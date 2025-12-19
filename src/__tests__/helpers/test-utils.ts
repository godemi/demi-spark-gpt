import { ChatCompletionRequest, ChatMessage, Attachment } from "../../models/chatCompletionTypes";

/**
 * Test utility functions
 */

/**
 * Create a minimal valid chat completion request
 */
export function createMinimalRequest(): ChatCompletionRequest {
  return {
    api_version: "2025-01-01",
    model: "gpt-4o",
    messages: [{ role: "user", content: "Hello" }],
    stream: false,
  };
}

/**
 * Create a request with all optional fields
 */
export function createFullRequest(): ChatCompletionRequest {
  return {
    api_version: "2025-01-01",
    model: "gpt-4o",
    messages: [
      { role: "system", content: "You are a helpful assistant" },
      { role: "user", content: "Hello" },
    ],
    provider: "azure-openai",
    stream: true,
    temperature: 0.7,
    top_p: 0.95,
    max_tokens: 1000,
    tools: [
      {
        type: "function",
        function: {
          name: "test_function",
          parameters: { type: "object", properties: {} },
        },
      },
    ],
    tool_choice: "auto",
    seed: 42,
    stop: ["\n"],
    presence_penalty: 0.1,
    frequency_penalty: 0.1,
    n: 1,
    user: "test-user",
  };
}

/**
 * Create a message with attachments
 */
export function createMessageWithAttachments(text: string, attachments: Attachment[]): ChatMessage {
  return {
    role: "user",
    content: text,
    attachments,
  };
}

/**
 * Create a base64 image attachment
 */
export function createBase64ImageAttachment(mimeType = "image/png"): Attachment {
  return {
    type: "image",
    mime_type: mimeType,
    data: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  };
}

/**
 * Create a URL image attachment
 */
export function createUrlImageAttachment(url = "https://example.com/image.png"): Attachment {
  return {
    type: "image",
    mime_type: "image/png",
    url,
  };
}

/**
 * Wait for a specified number of milliseconds
 */
export function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Collect all values from an async iterable
 */
export async function collectAsyncIterable<T>(iterable: AsyncIterable<T>): Promise<T[]> {
  const results: T[] = [];
  for await (const value of iterable) {
    results.push(value);
  }
  return results;
}

/**
 * Create a mock error response
 */
export function createMockError(message: string, code: string, status = 400) {
  return {
    error: {
      message,
      code,
      type: "invalid_request_error",
      status,
    },
  };
}
