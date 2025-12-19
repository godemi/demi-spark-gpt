# Prompt for an LLM Reviewer/Researcher
> You are tasked with performing online research and a deep technical challenge of this Azure Functions-based HALO layer. Produce a concrete, state-of-the-art (as of Dec 2025) plan to modernize it. Examine streaming on/off behavior, multi-model routing (Azure AI Foundry, Azure OpenAI, OSS models), reasoning modes, attachments (image/file in/out), JSON/tool calling, safety/guardrails, observability, retries/timeouts, and cost controls. Provide best-practice recommendations for:
> - Public API contract (OpenAI-compatible chat completions) with provider-specific extensions
> - Model/deployment selection, capability detection, and versioning per provider
> - Handling API keys and env config (API key, AAD/Managed Identity, per-deployment endpoints, api_version)
> - Running as Azure Functions (Flex Consumption): cold-start mitigation, concurrency limits, connection reuse (keep-alive), telemetry, and scaling considerations
> - Streaming design (SSE parity with OpenAI, final aggregate chunk), non-streaming parity, binary/attachment handling in streaming
> - Security (secret redaction, CORS allowlist, rate limiting/throttling hooks)
> - Testing strategy (unit, contract, integration with mock OpenAI-style servers), and CI/CD with lint/type/test/build
> Deliver a prioritized, step-by-step migration plan with milestones, clear acceptance criteria, and example payloads for chat, vision, images, and tool calls. Stress-test assumptions and propose fallbacks.

# Changes Needed to Make the API a Generic HALO Layer

## Goals
- Treat this service as a neutral HALO layer that routes to multiple model backends (Azure OpenAI, OpenAI, etc.) with selectable models and reasoning/“thinking” modes.
- Eliminate baked-in prompts; callers supply all system/user/assistant content.
- Support both streaming and full-response modes, with optional attachments (input and output: text, images, binaries).

## Azure AI Foundry-first Generalization
- **Single Azure entrypoint, multiple model types:** Use Azure AI Foundry endpoints for both Azure OpenAI deployments and OSS “Models as a Service” (e.g., Llama 3.x, Mistral, Phi-3). Keep provider config minimal: `provider: "azure-ai-foundry"`, `endpoint`, `deployment` (or `model` for OSS), `api_version`.
- **Deployment abstraction:** Treat “deployment” as the canonical routing key; include `model` for informational purposes and capability detection (vision, images, tool use). For OSS models, the call pattern is still `POST {endpoint}/openai/deployments/{deployment}/chat/completions?api-version=...`.
- **API versions:** Make `api_version` required (e.g., `2024-10-21` for Azure OpenAI, `2023-12-01-preview` for some OSS chat/image). Validate/whitelist per deployment to avoid surprises.
- **Auth:** Support `api-key` and AAD bearer token (Managed Identity/Service Principal) via `authorization: "apiKey" | "aad"`. Use a credential provider that can issue the correct header per call.
- **Capabilities registry:** Maintain a table keyed by deployment/model -> capabilities: `{ chat: true, vision: true/false, image_generate: true/false, tool_calls: true/false, max_output_tokens, supports_reasoning: true/false }`. For OSS models, populate from the Azure Model Catalog metadata (curated locally).
- **Tooling parity:** Azure AI Foundry supports OpenAI-format chat/tool calling/JSON mode; keep payload shape OpenAI-compatible to avoid bespoke branches.

## API Surface Changes
- **Model selection:** Add required `model` and optional `provider` fields. Example: `provider: "azure-openai" | "openai"` and `model: "gpt-4o" | "gpt-4o-mini" | "o3-mini" | "<deployment-name>"`. Allow provider-specific extras (e.g., `azure_deployment` or `endpoint` override) in a namespaced object.
- **Reasoning/thinking mode:** Add `reasoning_mode` (e.g., `"standard" | "deep" | "thinking"`), `max_completion_tokens`, `max_reasoning_tokens`, `temperature`, `top_p`, `seed`, `presence_penalty`, `frequency_penalty`.
- **Messages contract:** Require full `messages` array from caller (system, user, assistant), each with `{role, content, attachments?}`. Deprecate/disable automatic pre-prompts and system prompts; keep an optional `prepend_prompts` array for infra-enforced guardrails only if explicitly enabled.
- **Attachments in input:** Support `attachments` on messages: objects with `{type: "image" | "file", mime_type, data(base64 or URL), filename?, alt?}`. For URLs, perform fetch or pass-through depending on provider capabilities.
- **Attachments in output:** Extend response to include `attachments` with metadata and data reference (URL or base64) for generated images/files. Include `mime_type` and `size_bytes`.
- **Image generation:** Add an operation flag or route parameter `mode: "chat" | "image_generate" | "multi"`. For image generation, accept `image_params` (size, quality, format) and payload either as base64 or URL in response.
- **Audio & embeddings (optional extension):** Support `mode: "audio_transcribe" | "embeddings"` when Azure AI Foundry deployments allow it; use provider capability flags to gate.
- **Binary outputs:** When non-streaming, allow `response_format: "json" | "text" | "binary"` and return `Content-Type` per mime. For streaming, encapsulate binary references in SSE JSON chunks.
- **Streaming:** Keep `stream: boolean`; for SSE, emit OpenAI-compatible chunks plus a final aggregated message. Support `client_event_id` to correlate partials; add `retry-after-ms` on backpressure.
- **Safety/guardrails:** Add optional `system_guardrails_enabled` plus `guardrail_profile` to apply platform-defined prompts/policies instead of hard-coded defaults.
- **Versioning:** Add `api_version` in request and response; reject unsupported versions with a clear error.

## Server-Side Behavior Adjustments
- Remove all baked-in pre-prompts and defaults that inject business context; only apply if `system_guardrails_enabled` is true and a profile is chosen.
- Build payloads from caller-provided `messages`; do not auto-append `prompt` as a final user message—`messages` is canonical.
- Normalize provider adapters: shared request DTO → provider-specific mapper → HTTP/SDK call. Support provider-level configs (timeout, retries, endpoints). For Azure AI Foundry, accept `endpoint`, `deployment`, `api_version`, and resolve capability flags from a local catalog.
- Attachments: if `data` is base64, pass via model capability (e.g., GPT-4o vision supports image base64/URL). For outgoing binaries, either return base64 with `mime_type` or issue a signed URL reference (future: blob store).
- Error model: standardized `error.code`, `status`, `message`, `provider_error?`, `request_id`, `timestamp`. Map rate limits/timeouts distinctly.
- Observability: log `request_id`, `model`, `provider`, latency, retries, streaming duration, payload size, attachment counts; redact secrets and raw content by default (enable sampling).

## Suggested Request Shape (chat with attachments & thinking)
```json
{
  "api_version": "2025-01-01",
  "provider": "azure-openai",
  "model": "gpt-4o",
  "reasoning_mode": "standard",
  "messages": [
    { "role": "system", "content": "You are a concise assistant." },
    { "role": "user", "content": "Describe this image", "attachments": [
      { "type": "image", "mime_type": "image/png", "data": "<base64>" }
    ]}
  ],
  "stream": true,
  "max_tokens": 800,
  "temperature": 0.7,
  "response_format": "json"
}
```

## Suggested Request Shape (image generation)
```json
{
  "api_version": "2025-01-01",
  "provider": "openai",
  "model": "gpt-image-1",
  "mode": "image_generate",
  "prompt": "A futuristic cityscape at sunset",
  "image_params": { "size": "1024x1024", "quality": "high", "format": "png" },
  "stream": false
}
```

## Response Shape (streaming SSE chunk example)
```json
data: {
  "request_id": "abc123",
  "model": "gpt-4o",
  "provider": "azure-openai",
  "delta": { "content": "Hello" },
  "attachments": [],
  "finish_reason": null,
  "index": 0
}
```
Final chunk mirrors non-stream response and includes any generated attachments metadata or base64 payloads if small.

## Migration Steps
1) **Schema update:** Replace prompt/pre-prompt fields with `messages[]`, `model`, `provider`, `reasoning_mode`, `response_format`, `attachments`, `mode`.
2) **Remove baked-in prompts:** Delete or behind a flag; keep only guardrail profiles when explicitly requested.
3) **Provider adapters:** Implement mappers for Azure OpenAI and OpenAI; include model routing, deployment names, endpoints, and capability flags (vision, images, reasoning).
4) **Payload builder:** Use `messages` as-is; attach images/files per provider capability; support both SSE and JSON responses.
5) **Attachments handling:** Accept base64 or URLs; validate mime types; limit size; redact in logs; optionally offload to blob storage and return signed URLs.
6) **Output formatting:** Support `response_format` and binary returns; for SSE, wrap references instead of raw binary.
7) **Observability/error model:** Standardize error codes and telemetry fields; add request IDs and correlation across streams.
8) **Docs/tests:** Update `/info`, add OpenAPI, and extend tests for multi-model selection, attachments, and streaming/non-streaming parity.
