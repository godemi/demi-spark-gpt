import { z } from "zod";

/**
 * HALO Layer - OpenAI-Compatible Chat Completion Types
 * 
 * This module defines the core request/response schemas for the HALO layer,
 * providing OpenAI-compatible API contracts with provider-specific extensions.
 */

/**
 * Attachment schema for input/output attachments (images, files)
 */
export const AttachmentSchema = z.object({
  type: z.enum(["image", "file"]),
  mime_type: z.string(),
  data: z.string().optional(),        // base64 encoded data
  url: z.string().url().optional(),   // URL reference
  filename: z.string().optional(),
  alt: z.string().optional(),
  size_bytes: z.number().optional(),
});

export type Attachment = z.infer<typeof AttachmentSchema>;

/**
 * Tool definition schema for function calling
 */
export const ToolDefinitionSchema = z.object({
  type: z.literal("function"),
  function: z.object({
    name: z.string(),
    description: z.string().optional(),
    parameters: z.record(z.any()), // JSON Schema object
    strict: z.boolean().optional(),
  }),
});

export type ToolDefinition = z.infer<typeof ToolDefinitionSchema>;

/**
 * Tool call schema (from model response)
 */
export const ToolCallSchema = z.object({
  id: z.string(),
  type: z.literal("function"),
  function: z.object({
    name: z.string(),
    arguments: z.string(), // JSON string
  }),
});

export type ToolCall = z.infer<typeof ToolCallSchema>;

/**
 * Content part for multimodal messages (text + image_url)
 */
export const ContentPartSchema = z.object({
  type: z.enum(["text", "image_url"]),
  text: z.string().optional(),
  image_url: z.object({
    url: z.string(),
    detail: z.enum(["auto", "low", "high"]).optional(),
  }).optional(),
});

export type ContentPart = z.infer<typeof ContentPartSchema>;

/**
 * Chat message schema with OpenAI-compatible format
 */
export const ChatMessageSchema = z.object({
  role: z.enum(["system", "user", "assistant", "tool"]),
  content: z.union([
    z.string(),
    z.array(ContentPartSchema),
  ]),
  name: z.string().optional(),
  tool_calls: z.array(ToolCallSchema).optional(),
  tool_call_id: z.string().optional(),
  // HALO extension: attachments for easier API usage
  attachments: z.array(AttachmentSchema).optional(),
});

export type ChatMessage = z.infer<typeof ChatMessageSchema>;

/**
 * Image generation parameters
 */
export const ImageParamsSchema = z.object({
  size: z.enum(["256x256", "512x512", "1024x1024", "1792x1024", "1024x1792"]).optional(),
  quality: z.enum(["standard", "hd"]).optional(),
  format: z.enum(["url", "b64_json"]).optional(),
  n: z.number().int().min(1).max(10).optional(),
  style: z.enum(["vivid", "natural"]).optional(),
});

export type ImageParams = z.infer<typeof ImageParamsSchema>;

/**
 * Response format schema
 */
export const ResponseFormatSchema = z.union([
  z.literal("text"),
  z.literal("json"),
  z.object({
    type: z.literal("json_schema"),
    json_schema: z.record(z.any()),
  }),
]);

export type ResponseFormat = z.infer<typeof ResponseFormatSchema>;

/**
 * Tool choice schema
 */
export const ToolChoiceSchema = z.union([
  z.literal("auto"),
  z.literal("none"),
  z.object({
    type: z.literal("function"),
    function: z.object({
      name: z.string(),
    }),
  }),
]);

export type ToolChoice = z.infer<typeof ToolChoiceSchema>;

/**
 * Main chat completion request schema
 */
export const ChatCompletionRequestSchema = z.object({
  // Required fields
  api_version: z.string(),
  model: z.string(),
  messages: z.array(ChatMessageSchema).min(1),
  
  // Provider routing
  provider: z.enum(["azure-openai", "openai", "azure-ai-foundry"]).optional(),
  azure_deployment: z.string().optional(),
  azure_endpoint: z.string().url().optional(),
  
  // Generation parameters
  stream: z.boolean().default(false),
  temperature: z.number().min(0).max(2).optional(),
  top_p: z.number().min(0).max(1).optional(),
  max_tokens: z.number().int().min(1).optional(),
  max_completion_tokens: z.number().int().min(1).optional(),
  
  // Reasoning mode (o1/o3 models)
  reasoning_mode: z.enum(["standard", "deep", "thinking"]).optional(),
  max_reasoning_tokens: z.number().int().optional(),
  
  // Advanced parameters
  response_format: ResponseFormatSchema.optional(),
  tools: z.array(ToolDefinitionSchema).optional(),
  tool_choice: ToolChoiceSchema.optional(),
  seed: z.number().int().optional(),
  stop: z.union([z.string(), z.array(z.string())]).optional(),
  presence_penalty: z.number().min(-2).max(2).optional(),
  frequency_penalty: z.number().min(-2).max(2).optional(),
  n: z.number().int().min(1).max(128).optional(),
  logit_bias: z.record(z.number()).optional(),
  logprobs: z.boolean().optional(),
  top_logprobs: z.number().int().min(0).max(20).optional(),
  user: z.string().optional(),
  
  // HALO-specific extensions
  mode: z.enum(["chat", "image_generate", "multi"]).default("chat"),
  image_params: ImageParamsSchema.optional(),
  system_guardrails_enabled: z.boolean().default(false),
  guardrail_profile: z.string().optional(),
});

export type ChatCompletionRequest = z.infer<typeof ChatCompletionRequestSchema>;

/**
 * Chat completion choice schema
 */
export const ChatCompletionChoiceSchema = z.object({
  index: z.number(),
  message: ChatMessageSchema,
  finish_reason: z.enum(["stop", "length", "tool_calls", "content_filter", "function_call"]).nullable(),
  logprobs: z.any().nullable().optional(),
});

export type ChatCompletionChoice = z.infer<typeof ChatCompletionChoiceSchema>;

/**
 * Usage statistics schema
 */
export const UsageSchema = z.object({
  prompt_tokens: z.number(),
  completion_tokens: z.number(),
  total_tokens: z.number(),
  reasoning_tokens: z.number().optional(),
});

export type Usage = z.infer<typeof UsageSchema>;

/**
 * Chat completion response schema (OpenAI-compatible)
 */
export const ChatCompletionResponseSchema = z.object({
  id: z.string(),
  object: z.literal("chat.completion"),
  created: z.number(),
  model: z.string(),
  choices: z.array(ChatCompletionChoiceSchema),
  usage: UsageSchema.optional(),
  
  // HALO extensions
  request_id: z.string().optional(),
  provider: z.string().optional(),
  latency_ms: z.number().optional(),
  attachments: z.array(AttachmentSchema).optional(),
});

export type ChatCompletionResponse = z.infer<typeof ChatCompletionResponseSchema>;

/**
 * SSE chunk schema for streaming responses
 */
export const SSEChunkSchema = z.object({
  id: z.string(),
  object: z.literal("chat.completion.chunk"),
  created: z.number(),
  model: z.string(),
  choices: z.array(z.object({
    index: z.number(),
    delta: z.object({
      role: z.enum(["system", "user", "assistant", "tool"]).optional(),
      content: z.string().nullable().optional(),
      tool_calls: z.array(ToolCallSchema).optional(),
    }),
    finish_reason: z.enum(["stop", "length", "tool_calls", "content_filter"]).nullable().optional(),
    logprobs: z.any().nullable().optional(),
  })),
  usage: UsageSchema.optional(),
  
  // HALO extensions
  halo_metadata: z.object({
    chunks_count: z.number().optional(),
    latency_ms: z.number().optional(),
  }).optional(),
});

export type SSEChunk = z.infer<typeof SSEChunkSchema>;

/**
 * Final aggregate chunk schema
 */
export const FinalChunkSchema = SSEChunkSchema.extend({
  choices: z.array(z.object({
    index: z.number(),
    delta: z.object({
      content: z.string(),
    }),
    finish_reason: z.enum(["stop", "length", "tool_calls", "content_filter"]).nullable(),
  })),
});

export type FinalChunk = z.infer<typeof FinalChunkSchema>;

