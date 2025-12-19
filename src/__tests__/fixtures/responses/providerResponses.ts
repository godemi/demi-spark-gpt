/**
 * Mock provider responses for testing
 */

export const mockOpenAIResponse = {
  id: "chatcmpl-123",
  object: "chat.completion",
  created: 1677652288,
  model: "gpt-4o",
  choices: [
    {
      index: 0,
      message: {
        role: "assistant",
        content: "Hello! How can I help you today?",
      },
      finish_reason: "stop",
      logprobs: null,
    },
  ],
  usage: {
    prompt_tokens: 9,
    completion_tokens: 12,
    total_tokens: 21,
  },
};

export const mockOpenAIStreamingChunk = {
  id: "chatcmpl-123",
  object: "chat.completion.chunk",
  created: 1677652288,
  model: "gpt-4o",
  choices: [
    {
      index: 0,
      delta: {
        role: "assistant",
        content: "Hello",
      },
      finish_reason: null,
    },
  ],
};

export const mockOpenAIFinalChunk = {
  id: "chatcmpl-123",
  object: "chat.completion.chunk",
  created: 1677652288,
  model: "gpt-4o",
  choices: [
    {
      index: 0,
      delta: {},
      finish_reason: "stop",
    },
  ],
  usage: {
    prompt_tokens: 9,
    completion_tokens: 12,
    total_tokens: 21,
  },
};

export const mockOpenAIErrorResponse = {
  error: {
    message: "Invalid API key",
    type: "invalid_request_error",
    param: null,
    code: "invalid_api_key",
  },
};

export const mockImageGenerationResponse = {
  created: 1677652288,
  data: [
    {
      url: "https://example.com/image1.png",
      revised_prompt: "A futuristic cityscape at sunset",
    },
    {
      b64_json: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
    },
  ],
};

