import { ChatCompletionRequest, ChatMessage, Attachment } from "../../models/chatCompletionTypes";
import { SSEChunk, Usage } from "../../models/chatCompletionTypes";

/**
 * Test data generators for creating dynamic test fixtures
 */

/**
 * Generate a random valid chat completion request
 */
export function generateRandomRequest(
  overrides: Partial<ChatCompletionRequest> = {}
): ChatCompletionRequest {
  const models = ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-3.5-turbo"];
  const providers = ["azure-openai", "openai", "azure-ai-foundry"];

  return {
    api_version: "2025-01-01",
    model: models[Math.floor(Math.random() * models.length)],
    messages: [
      {
        role: "user",
        content: `Test message ${Math.random().toString(36).substring(7)}`,
      },
    ],
    stream: Math.random() > 0.5,
    provider: providers[Math.floor(Math.random() * providers.length)],
    temperature: Math.random() * 2,
    top_p: Math.random(),
    max_tokens: Math.floor(Math.random() * 1000) + 100,
    ...overrides,
  };
}

/**
 * Generate a streaming chunk sequence
 */
export function* generateStreamingChunks(content: string, chunkSize = 5): Generator<SSEChunk> {
  const chunks = content.match(new RegExp(`.{1,${chunkSize}}`, "g")) || [content];

  for (let i = 0; i < chunks.length; i++) {
    yield {
      id: `chatcmpl-${Date.now()}`,
      object: "chat.completion.chunk",
      created: Math.floor(Date.now() / 1000),
      model: "gpt-4o",
      choices: [
        {
          index: 0,
          delta: {
            content: chunks[i],
          },
          finish_reason: i === chunks.length - 1 ? "stop" : null,
        },
      ],
      usage: i === chunks.length - 1 ? generateUsageStats() : undefined,
    };
  }
}

/**
 * Generate usage statistics
 */
export function generateUsageStats(overrides: Partial<Usage> = {}): Usage {
  const promptTokens = Math.floor(Math.random() * 1000) + 10;
  const completionTokens = Math.floor(Math.random() * 2000) + 10;

  return {
    prompt_tokens: promptTokens,
    completion_tokens: completionTokens,
    total_tokens: promptTokens + completionTokens,
    reasoning_tokens: Math.random() > 0.7 ? Math.floor(Math.random() * 10000) : undefined,
    ...overrides,
  };
}

/**
 * Generate a message with random content
 */
export function generateRandomMessage(role: "user" | "assistant" | "system" = "user"): ChatMessage {
  const contents = [
    "Hello, how are you?",
    "What is the weather today?",
    "Explain quantum computing",
    "Write a poem about AI",
    "Calculate 2+2",
  ];

  return {
    role,
    content: contents[Math.floor(Math.random() * contents.length)],
  };
}

/**
 * Generate a random attachment
 */
export function generateRandomAttachment(): Attachment {
  const types = ["image"];
  const mimeTypes = ["image/png", "image/jpeg", "image/gif", "image/webp"];

  const useUrl = Math.random() > 0.5;

  return {
    type: types[0] as "image",
    mime_type: mimeTypes[Math.floor(Math.random() * mimeTypes.length)],
    ...(useUrl
      ? { url: `https://example.com/image-${Math.random().toString(36).substring(7)}.png` }
      : {
          data: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
        }),
  };
}

/**
 * Generate multiple messages for conversation history
 */
export function generateConversationHistory(count = 5): ChatMessage[] {
  const messages: ChatMessage[] = [];
  const roles: Array<"user" | "assistant"> = ["user", "assistant"];

  for (let i = 0; i < count; i++) {
    messages.push(generateRandomMessage(roles[i % 2]));
  }

  return messages;
}

/**
 * Generate a request with tool definitions
 */
export function generateRequestWithTools(toolCount = 1): ChatCompletionRequest {
  const tools = Array.from({ length: toolCount }, (_, i) => ({
    type: "function" as const,
    function: {
      name: `tool_${i + 1}`,
      description: `Test tool ${i + 1}`,
      parameters: {
        type: "object",
        properties: {
          param1: { type: "string" },
          param2: { type: "number" },
        },
        required: ["param1"],
      },
    },
  }));

  return {
    api_version: "2025-01-01",
    model: "gpt-4o",
    messages: [generateRandomMessage()],
    stream: false,
    tools,
    tool_choice: "auto",
  };
}

