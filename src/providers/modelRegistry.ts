import { ModelCapabilities } from "./types";

/**
 * Model Registry - Centralized capability detection for all supported models
 *
 * This registry maps model names to their capabilities, enabling automatic
 * routing and validation of requests based on model features.
 */
export const MODEL_REGISTRY: Record<string, ModelCapabilities> = {
  // Azure OpenAI Models
  "gpt-4o": {
    chat: true,
    vision: true,
    image_generate: false,
    tool_calls: true,
    json_mode: true,
    reasoning: false,
    max_context_tokens: 128000,
    max_output_tokens: 16384,
    supports_streaming: true,
  },
  "gpt-4o-mini": {
    chat: true,
    vision: true,
    image_generate: false,
    tool_calls: true,
    json_mode: true,
    reasoning: false,
    max_context_tokens: 128000,
    max_output_tokens: 16384,
    supports_streaming: true,
  },
  "gpt-4-turbo": {
    chat: true,
    vision: true,
    image_generate: false,
    tool_calls: true,
    json_mode: true,
    reasoning: false,
    max_context_tokens: 128000,
    max_output_tokens: 4096,
    supports_streaming: true,
  },
  "gpt-4": {
    chat: true,
    vision: false,
    image_generate: false,
    tool_calls: true,
    json_mode: true,
    reasoning: false,
    max_context_tokens: 8192,
    max_output_tokens: 4096,
    supports_streaming: true,
  },
  "gpt-3.5-turbo": {
    chat: true,
    vision: false,
    image_generate: false,
    tool_calls: true,
    json_mode: true,
    reasoning: false,
    max_context_tokens: 16385,
    max_output_tokens: 4096,
    supports_streaming: true,
  },

  // Reasoning models (o1/o3)
  "o1-preview": {
    chat: true,
    vision: false,
    image_generate: false,
    tool_calls: false,
    json_mode: false,
    reasoning: true,
    max_context_tokens: 200000,
    max_output_tokens: 100000,
    supports_streaming: false,
  },
  "o1-mini": {
    chat: true,
    vision: false,
    image_generate: false,
    tool_calls: false,
    json_mode: false,
    reasoning: true,
    max_context_tokens: 128000,
    max_output_tokens: 65536,
    supports_streaming: false,
  },
  "o3-mini": {
    chat: true,
    vision: false,
    image_generate: false,
    tool_calls: false,
    json_mode: true,
    reasoning: true,
    max_context_tokens: 200000,
    max_output_tokens: 100000,
    supports_streaming: false,
  },

  // GPT-5 Models (Azure OpenAI - supports reasoning_effort parameter)
  "gpt-5.2": {
    chat: true,
    vision: true,
    image_generate: false,
    tool_calls: true,
    json_mode: true,
    reasoning: true,
    max_context_tokens: 128000,
    max_output_tokens: 16384,
    supports_streaming: true,
  },
  "gpt-5-nano": {
    chat: true,
    vision: true,
    image_generate: false,
    tool_calls: true,
    json_mode: true,
    reasoning: true,
    max_context_tokens: 128000,
    max_output_tokens: 16384,
    supports_streaming: true,
  },
  "gpt-5": {
    chat: true,
    vision: true,
    image_generate: false,
    tool_calls: true,
    json_mode: true,
    reasoning: true,
    max_context_tokens: 128000,
    max_output_tokens: 16384,
    supports_streaming: true,
  },
  "gpt-5-mini": {
    chat: true,
    vision: true,
    image_generate: false,
    tool_calls: true,
    json_mode: true,
    reasoning: true,
    max_context_tokens: 64000,
    max_output_tokens: 8192,
    supports_streaming: true,
  },

  // Image generation models
  "dall-e-2": {
    chat: false,
    vision: false,
    image_generate: true,
    tool_calls: false,
    json_mode: false,
    reasoning: false,
    max_context_tokens: 0,
    max_output_tokens: 0,
    supports_streaming: false,
  },
  "dall-e-3": {
    chat: false,
    vision: false,
    image_generate: true,
    tool_calls: false,
    json_mode: false,
    reasoning: false,
    max_context_tokens: 0,
    max_output_tokens: 0,
    supports_streaming: false,
  },
  "gpt-image-1": {
    chat: false,
    vision: false,
    image_generate: true,
    tool_calls: false,
    json_mode: false,
    reasoning: false,
    max_context_tokens: 0,
    max_output_tokens: 0,
    supports_streaming: false,
  },

  // OSS Models (Azure AI Foundry)
  "llama-3-70b": {
    chat: true,
    vision: false,
    image_generate: false,
    tool_calls: false,
    json_mode: false,
    reasoning: false,
    max_context_tokens: 8192,
    max_output_tokens: 4096,
    supports_streaming: true,
  },
  "llama-3-8b": {
    chat: true,
    vision: false,
    image_generate: false,
    tool_calls: false,
    json_mode: false,
    reasoning: false,
    max_context_tokens: 8192,
    max_output_tokens: 4096,
    supports_streaming: true,
  },
  "mistral-large": {
    chat: true,
    vision: false,
    image_generate: false,
    tool_calls: true,
    json_mode: false,
    reasoning: false,
    max_context_tokens: 32000,
    max_output_tokens: 8192,
    supports_streaming: true,
  },
  "phi-3-mini": {
    chat: true,
    vision: false,
    image_generate: false,
    tool_calls: false,
    json_mode: false,
    reasoning: false,
    max_context_tokens: 4096,
    max_output_tokens: 2048,
    supports_streaming: true,
  },
};

/**
 * Get capabilities for a model
 */
export function getModelCapabilities(model: string): ModelCapabilities | null {
  // Try exact match first
  if (model in MODEL_REGISTRY) {
    return MODEL_REGISTRY[model];
  }

  // Try case-insensitive match
  const lowerModel = model.toLowerCase();
  for (const [key, capabilities] of Object.entries(MODEL_REGISTRY)) {
    if (key.toLowerCase() === lowerModel) {
      return capabilities;
    }
  }

  // Try prefix matching for deployment names (e.g., "gpt-4o-2024-08-06")
  for (const [key, capabilities] of Object.entries(MODEL_REGISTRY)) {
    if (model.toLowerCase().startsWith(key.toLowerCase())) {
      return capabilities;
    }
  }

  return null;
}

/**
 * Check if a model supports a specific capability
 */
export function hasCapability(model: string, capability: keyof ModelCapabilities): boolean {
  const caps = getModelCapabilities(model);
  if (!caps) return false;

  if (capability === "max_context_tokens" || capability === "max_output_tokens") {
    return caps[capability] > 0;
  }

  return caps[capability] === true;
}

/**
 * Get all available models for a provider
 */
export function getModelsForProvider(provider: string): string[] {
  // This is a simplified version - in production, you might want to
  // maintain a separate mapping or query the provider's model list
  return Object.keys(MODEL_REGISTRY);
}

