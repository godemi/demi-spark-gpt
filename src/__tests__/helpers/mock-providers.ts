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

/**
 * Create a streaming chunk generator for testing
 */
export async function* createMockStreamingChunks(
  content: string[] = ["Hello", " ", "world", "!"],
  includeUsage = false
): AsyncGenerator<SSEChunk> {
  for (let i = 0; i < content.length; i++) {
    yield {
      id: "test-id",
      object: "chat.completion.chunk",
      created: Math.floor(Date.now() / 1000),
      model: "gpt-4o",
      choices: [
        {
          index: 0,
          delta: { content: content[i] },
          finish_reason: i === content.length - 1 ? "stop" : null,
        },
      ],
      usage:
        includeUsage && i === content.length - 1
          ? {
              prompt_tokens: 10,
              completion_tokens: content.join("").length,
              total_tokens: 10 + content.join("").length,
            }
          : undefined,
    } as SSEChunk;
  }
}

/**
 * Create a mock provider adapter with error response
 */
export function createMockProviderAdapterWithError(error: Error): ProviderAdapter {
  const adapter = createMockProviderAdapter();
  adapter.executeJson = vi.fn().mockRejectedValue(error);
  adapter.executeStream = vi.fn().mockImplementation(async function* () {
    throw error;
  });
  return adapter;
}

/**
 * Create a mock provider adapter with specific capabilities
 */
export function createMockProviderAdapterWithCapabilities(
  capabilities: Partial<ModelCapabilities>
): ProviderAdapter {
  const adapter = createMockProviderAdapter();
  adapter.getCapabilities = vi.fn().mockReturnValue({
    chat: true,
    vision: false,
    image_generate: false,
    tool_calls: false,
    json_mode: false,
    reasoning: false,
    max_context_tokens: 4096,
    max_output_tokens: 2048,
    supports_streaming: true,
    ...capabilities,
  } as ModelCapabilities);
  return adapter;
}

/**
 * Create a mock provider adapter that doesn't support streaming
 */
export function createMockProviderAdapterNoStreaming(): ProviderAdapter {
  const adapter = createMockProviderAdapter();
  adapter.getCapabilities = vi.fn().mockReturnValue({
    chat: true,
    vision: false,
    image_generate: false,
    tool_calls: false,
    json_mode: false,
    reasoning: true,
    max_context_tokens: 200000,
    max_output_tokens: 100000,
    supports_streaming: false,
  } as ModelCapabilities);
  adapter.executeStream = vi.fn().mockImplementation(async function* () {
    throw new Error("Streaming not supported");
  });
  return adapter;
}

/**
 * Create a mock response with tool calls
 */
export function createMockResponseWithToolCalls(): ChatCompletionResponse {
  return {
    id: "test-id",
    object: "chat.completion",
    created: Math.floor(Date.now() / 1000),
    model: "gpt-4o",
    choices: [
      {
        index: 0,
        message: {
          role: "assistant",
          content: null,
          tool_calls: [
            {
              id: "call_123",
              type: "function",
              function: {
                name: "get_weather",
                arguments: '{"location": "San Francisco"}',
              },
            },
          ],
        },
        finish_reason: "tool_calls",
      },
    ],
    usage: {
      prompt_tokens: 20,
      completion_tokens: 15,
      total_tokens: 35,
    },
  };
}

/**
 * Create a mock response with reasoning tokens
 */
export function createMockResponseWithReasoning(): ChatCompletionResponse {
  return {
    id: "test-id",
    object: "chat.completion",
    created: Math.floor(Date.now() / 1000),
    model: "o3-mini",
    choices: [
      {
        index: 0,
        message: {
          role: "assistant",
          content: "This is a reasoning model response",
        },
        finish_reason: "stop",
      },
    ],
    usage: {
      prompt_tokens: 10,
      completion_tokens: 20,
      total_tokens: 30,
      reasoning_tokens: 5000,
    },
  };
}
