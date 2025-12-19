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

export const mockOpenAIResponseWithToolCalls = {
  id: "chatcmpl-123",
  object: "chat.completion",
  created: 1677652288,
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
      logprobs: null,
    },
  ],
  usage: {
    prompt_tokens: 20,
    completion_tokens: 15,
    total_tokens: 35,
  },
};

export const mockOpenAIResponseWithReasoning = {
  id: "chatcmpl-123",
  object: "chat.completion",
  created: 1677652288,
  model: "o3-mini",
  choices: [
    {
      index: 0,
      message: {
        role: "assistant",
        content: "This is a reasoning model response",
      },
      finish_reason: "stop",
      logprobs: null,
    },
  ],
  usage: {
    prompt_tokens: 10,
    completion_tokens: 20,
    total_tokens: 30,
    reasoning_tokens: 5000,
  },
};

export const mockOpenAIResponseMultipleChoices = {
  id: "chatcmpl-123",
  object: "chat.completion",
  created: 1677652288,
  model: "gpt-4o",
  choices: [
    {
      index: 0,
      message: {
        role: "assistant",
        content: "First response",
      },
      finish_reason: "stop",
      logprobs: null,
    },
    {
      index: 1,
      message: {
        role: "assistant",
        content: "Second response",
      },
      finish_reason: "stop",
      logprobs: null,
    },
  ],
  usage: {
    prompt_tokens: 9,
    completion_tokens: 24,
    total_tokens: 33,
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

export const mockOpenAIStreamingChunkWithToolCalls = {
  id: "chatcmpl-123",
  object: "chat.completion.chunk",
  created: 1677652288,
  model: "gpt-4o",
  choices: [
    {
      index: 0,
      delta: {
        role: "assistant",
        content: null,
        tool_calls: [
          {
            index: 0,
            id: "call_123",
            type: "function",
            function: {
              name: "get_weather",
              arguments: '{"location":',
            },
          },
        ],
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

export const mockOpenAIRateLimitError = {
  error: {
    message: "Rate limit exceeded",
    type: "rate_limit_error",
    code: "rate_limit_exceeded",
  },
};

export const mockOpenAIServerError = {
  error: {
    message: "Internal server error",
    type: "server_error",
    code: "internal_error",
  },
};

export const mockAzureOpenAIError = {
  error: {
    message: "Azure OpenAI error",
    code: "azure_error",
    type: "invalid_request_error",
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
      b64_json:
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
    },
  ],
};

export const mockImageGenerationResponseSingle = {
  created: 1677652288,
  data: [
    {
      url: "https://example.com/image.png",
      revised_prompt: "A beautiful landscape",
    },
  ],
};

export const mockImageGenerationResponseBase64 = {
  created: 1677652288,
  data: [
    {
      b64_json:
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
    },
  ],
};
