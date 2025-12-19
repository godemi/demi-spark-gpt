import { vi } from "vitest";
import {
  ProviderAdapter,
  ProviderConfig,
  ProviderRequest,
  ModelCapabilities,
} from "../../providers/types";
import {
  ChatCompletionRequest,
  ChatCompletionResponse,
  SSEChunk,
} from "../../models/chatCompletionTypes";

/**
 * Create a mock provider adapter for testing
 */
export function createMockProviderAdapter(): ProviderAdapter {
  return {
    name: "mock-provider",
    buildRequest: vi.fn().mockResolvedValue({
      model: "gpt-4o",
      messages: [],
      stream: false,
    } as ProviderRequest),
    executeStream: vi.fn().mockImplementation(async function* () {
      yield {
        id: "test-id",
        object: "chat.completion.chunk",
        created: Math.floor(Date.now() / 1000),
        model: "gpt-4o",
        choices: [
          {
            index: 0,
            delta: { content: "Hello" },
            finish_reason: null,
          },
        ],
      } as SSEChunk;
    }),
    executeJson: vi.fn().mockResolvedValue({
      id: "test-id",
      object: "chat.completion",
      created: Math.floor(Date.now() / 1000),
      model: "gpt-4o",
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content: "Hello! How can I help you?",
          },
          finish_reason: "stop",
        },
      ],
      usage: {
        prompt_tokens: 10,
        completion_tokens: 15,
        total_tokens: 25,
      },
    } as ChatCompletionResponse),
    getCapabilities: vi.fn().mockReturnValue({
      chat: true,
      vision: true,
      image_generate: false,
      tool_calls: true,
      json_mode: true,
      reasoning: false,
      max_context_tokens: 128000,
      max_output_tokens: 16384,
      supports_streaming: true,
    } as ModelCapabilities),
    validateRequest: vi.fn().mockReturnValue(true),
  };
}

/**
 * Create a mock provider config
 */
export function createMockProviderConfig(): ProviderConfig {
  return {
    provider: "azure-openai",
    endpoint: "https://test.openai.azure.com",
    deployment: "gpt-4o",
    apiKey: "test-api-key",
    apiVersion: "2024-10-21",
    authType: "api-key",
  };
}

