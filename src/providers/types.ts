import {
  ChatCompletionRequest,
  ChatCompletionResponse,
  SSEChunk,
} from "../models/chatCompletionTypes";

/**
 * Provider configuration interface
 */
export interface ProviderConfig {
  provider: "azure-openai" | "openai" | "azure-ai-foundry";
  endpoint: string;
  deployment?: string;
  model?: string;
  apiKey?: string;
  apiVersion: string;
  authType: "api-key" | "aad";
  organization?: string;
}

/**
 * Model capabilities interface
 */
export interface ModelCapabilities {
  chat: boolean;
  vision: boolean;
  image_generate: boolean;
  tool_calls: boolean;
  json_mode: boolean;
  reasoning: boolean;
  max_context_tokens: number;
  max_output_tokens: number;
  supports_streaming: boolean;
}

/**
 * Provider request interface (normalized for provider adapters)
 */
export interface ProviderRequest {
  model: string;
  messages: any[];
  stream?: boolean;
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
  max_completion_tokens?: number;
  reasoning_mode?: "standard" | "deep" | "thinking";
  max_reasoning_tokens?: number;
  response_format?: any;
  tools?: any[];
  tool_choice?: any;
  seed?: number;
  stop?: string | string[];
  presence_penalty?: number;
  frequency_penalty?: number;
  n?: number;
  logit_bias?: Record<string, number>;
  logprobs?: boolean;
  top_logprobs?: number;
  user?: string;
  [key: string]: any; // Allow provider-specific extensions
}

/**
 * Provider error interface
 */
export interface ProviderError {
  code: string;
  message: string;
  type: string;
  param?: string;
  status?: number;
}

/**
 * Provider adapter interface
 * All providers must implement this interface for consistent routing
 */
export interface ProviderAdapter {
  name: string;

  /**
   * Build a provider-specific request from a HALO request
   */
  buildRequest(params: ChatCompletionRequest, config: ProviderConfig): Promise<ProviderRequest>;

  /**
   * Execute a streaming request
   */
  executeStream(request: ProviderRequest, config: ProviderConfig): AsyncIterable<SSEChunk>;

  /**
   * Execute a non-streaming request
   */
  executeJson(request: ProviderRequest, config: ProviderConfig): Promise<ChatCompletionResponse>;

  /**
   * Get model capabilities for a given model name
   */
  getCapabilities(model: string): ModelCapabilities | null;

  /**
   * Validate that the request is compatible with this provider
   */
  validateRequest(request: ChatCompletionRequest): boolean;
}
