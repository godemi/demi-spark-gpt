# Refactoring Plan for DME GPT (Azure Functions, TypeScript)

## Objectives
- Build a resilient, strictly typed chat API that supports system prompts plus full chat history with a tunable message window (e.g., “use last 3 messages”).
- Remove bottlenecks, simplify data flow, and harden error handling, observability, and deployment.
- Make the codebase extensible for future models/features while keeping operations predictable and testable.

## Current Gaps / Bottlenecks (quick triage)
- Mixed validation: Zod schema exists but is bypassed by ad-hoc validation; duplicated type conversions; missing schema for chat history/system prompt concepts.
- Prompt assembly is linear (`prompt` + optional pre-prompts) and doesn’t support multi-turn chat or configurable history slices.
- Streaming handler manually parses SSE chunks with minimal lifecycle/error handling; no aborts on client disconnect; limited protection against partial data.
- Config/env handling is ad-hoc; secrets logged; no central config typing or defaults by environment.
- Error handling not standardized (custom `APIException` but divergent usage); inconsistent status mapping; limited retry/circuit breaking.
- Logging/telemetry is unstructured; no correlation IDs, sampling, or performance metrics (latency, retries, token usage).
- Dependency hygiene: unused/legacy deps (e.g., Prisma) and no pinned runtime guardrails; test suite stubbed out.

## Target Architecture (high level)
- **Layers:** `api` (function bindings, HTTP concerns) → `application` (use-cases: validate/build request, call LLM, map response) → `domain` (chat message model, history windowing, prompt policies) → `infrastructure` (OpenAI client, config, logging, telemetry).
- **Schema-first contracts:** Zod schemas drive runtime validation and TypeScript types (inferred). Single source of truth for request/response DTOs.
- **Message builder:** Dedicated module to compose system prompts, pre-prompts, custom prompts, chat history slices, and current user turn.
- **Resilient OpenAI client:** Shared axios (or official Azure OpenAI SDK) instance with timeouts, retry/backoff, circuit-breaker hooks, and streaming helpers.
- **Observability:** Structured logger, request IDs, App Insights/OpenTelemetry traces, counters for success/error/timeout, and latency histograms.

## Functional Enhancements (chat & history)
- Add explicit fields: `system_prompt` (string | array), `history` (array of {role: system|user|assistant, content, created_at?, id?}), `history_window` (int, default N), `history_strategy` (last_n | token_budget | all), and `max_history_tokens` optional safeguard.
- Message selection rules: accept full history, apply windowing (e.g., last N messages), optionally trim by token budget, preserve chronological order, and always prepend system-level prompts and pre-prompts.
- Support multi-message prompts per turn: allow `prompt` to be a user message array merged into the turn.
- Ensure streaming and non-streaming paths share the same message-building pipeline and return consistent final payload shapes.

## Refactor Steps (ordered)
1) **Tooling & Baseline**
   - Add/enable ESLint + Prettier with project rules; enforce on CI. Remove unused deps (e.g., Prisma if truly unused), pin versions, and add `npm audit` gate.
   - Introduce `tsconfig` strict mode (noImplicitAny, strictNullChecks), path aliases for layers, and centralized types package.

2) **Config & Secrets**
   - Create `config` module with Zod-validated env schema (endpoint, key, timeouts, retry policy, CORS origins, log level). Prevent logging secrets by default.
   - Add runtime-safe defaults per environment (dev/stage/prod) and a configuration contract exposed to handlers.

3) **Request/Response Contracts**
   - Replace ad-hoc validation with Zod parsing for the entire request: core params + chat history/system prompt + windowing fields.
   - Normalize numeric coercions and range checks in schema refinements; drop duplicate manual validation.
   - Define typed success/error response envelopes; ensure `APIException` (or `HttpError`) maps 1:1 to HTTP responses.

4) **Message Assembly Pipeline**
   - Build `ChatMessageBuilder` to merge: system_prompt(s) → pre-prompts (existing knobs) → variables → sliced history (respect `history_window`/strategy) → current user input.
   - Add token estimation utility (tiktoken-like) to enforce `max_history_tokens` and truncate gracefully with rationale metadata.
   - Make pre-prompt overwrites data-driven (configurable registry) instead of inline branching.

5) **OpenAI Client & Resilience**
   - Extract a single OpenAI client with keep-alive agents, sane timeouts, retries (axios-retry or p-retry), and circuit-breaker hooks.
   - Switch to official Azure OpenAI SDK if viable; otherwise, wrap axios with typed request/response DTOs.
   - Harden streaming: handle SSE parsing via eventsource parser, support AbortSignal for client disconnect, emit heartbeat/keep-alive, and surface partial results with structured errors.

6) **HTTP Layer Cleanup**
   - Thin handlers: parse & validate → call use-case → map to HTTP (status, headers, CORS). Centralize CORS policy (allowlist) and OPTIONS handling.
   - Add request ID, client metadata (ip/ua if allowed), and feature flags for experimental behaviors (e.g., history_strategy=token_budget).

7) **Error Model & Safety**
   - Standardize error taxonomy (validation, auth/config, upstream, rate limit, timeout, internal). Map to stable `error.code` and HTTP status.
   - Redact secrets in logs/payload echoes; clamp inputs (max prompt/history size) and enforce rate/throughput limits per key/user in middleware (future: durable storage/redis).

8) **Performance & Cost Controls**
   - Memoize static assets (version, metadata) instead of recomputing per request; lazy-load heavy modules.
   - Optional response compression for non-streaming paths; cache `/info` in-memory.
   - Token-budget trimming to reduce prompt size; configurable defaults per environment.

9) **Observability**
   - Add structured logger (pino/winston) with context; surface latency, retries, and token counts.
   - Integrate Application Insights/OpenTelemetry tracing; emit spans around validation, message build, OpenAI call, streaming lifecycle.
   - Add health/status to include dependency checks (endpoint, dns, outbound) with cached results to avoid hot-looping the model.

10) **Testing Strategy**
    - Unit: validation schemas, message builder (history/windowing), pre-prompt composition, error mapper, streaming parser.
    - Integration: mock OpenAI server (nock/msw) for non-streaming and streaming paths; contract tests for HTTP envelopes.
    - Load/smoke: lightweight k6/Artillery script for `/completions` with history windows; gate in CI (smoke) and CD (optional).

11) **DevEx & Delivery**
    - Add CI (lint, test, typecheck, build) and CD (func deploy) with environment promotion.
    - Document API (OpenAPI/Swagger) generated from Zod schemas; include examples for history/system_prompt + windowing.
    - Add `npm run test` real suite, `npm run ci` pipeline, and PR templates/checklists.

## Implementation Notes (for the chat-history feature)
- Request shape example:
  - `system_prompt: string | string[]`
  - `history: Array<{ role: "system" | "user" | "assistant"; content: string; created_at?: string; id?: string }>`
  - `history_window: number` (default 3), `history_strategy?: "last_n" | "token_budget" | "all"`, `max_history_tokens?: number`
  - Existing params (`prompt`, pre-prompt toggles, variables, stream, etc.) remain; current prompt becomes the latest user turn.
- Behavior:
  - If history provided, slice according to strategy, keep chronological order, and always prepend system/pre-prompts.
  - When streaming, accumulate final content but also expose incremental deltas; on failure, surface partials with metadata.

## Backlog / Stretch
- Add content-filter hooks and guardrail policies before sending to OpenAI.
- Optional conversation summarization to shrink long histories.
- Multi-tenant configuration (per key/model defaults) and usage metering.
- Canary flag for model version rollouts and A/B routing.

## Implementation Status (current change set)
- Added Zod-coerced request schema with chat history fields (`system_prompt`, `history`, `history_window`, `history_strategy`, `max_history_tokens`) and stricter parameter constraints.
- Replaced ad-hoc validation with schema-driven parsing and consistent error messages.
- Introduced `ChatMessageBuilder` to compose system prompts, pre-prompts, history slices (last_n/token_budget/all), and the current user prompt.
- Refactored completion handler and Azure request utilities to accept prebuilt messages for both streaming and non-streaming flows.
- Hardened payload/header handling by redacting secrets in error paths.

### Example request (chat history + windowing)
```json
{
  "system_prompt": "You are a concise marketing assistant.",
  "history_strategy": "last_n",
  "history_window": 4,
  "history": [
    { "role": "user", "content": "Hi" },
    { "role": "assistant", "content": "Hello!" },
    { "role": "user", "content": "Draft a tagline." }
  ],
  "prompt": "Use the last two exchanges only and refine the tagline.",
  "temperature": 0.7,
  "top_p": 0.95,
  "max_tokens": 150
}
```
