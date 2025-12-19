import { ChatCompletionRequest } from "../../../models/chatCompletionTypes";

/**
 * Test fixtures for chat completion requests
 */

export const validChatRequest: ChatCompletionRequest = {
  api_version: "2025-01-01",
  model: "gpt-4o",
  messages: [{ role: "user", content: "Hello, how are you?" }],
  stream: false,
};

export const streamingRequest: ChatCompletionRequest = {
  ...validChatRequest,
  stream: true,
};

export const requestWithAttachments: ChatCompletionRequest = {
  ...validChatRequest,
  messages: [
    {
      role: "user",
      content: "What's in this image?",
      attachments: [
        {
          type: "image",
          mime_type: "image/png",
          data: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
        },
      ],
    },
  ],
};

export const requestWithMultipleAttachments: ChatCompletionRequest = {
  ...validChatRequest,
  messages: [
    {
      role: "user",
      content: "Compare these images",
      attachments: [
        {
          type: "image",
          mime_type: "image/png",
          data: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
        },
        {
          type: "image",
          mime_type: "image/jpeg",
          url: "https://example.com/image.jpg",
        },
      ],
    },
  ],
};

export const requestWithUrlAttachment: ChatCompletionRequest = {
  ...validChatRequest,
  messages: [
    {
      role: "user",
      content: "What's in this image?",
      attachments: [
        {
          type: "image",
          mime_type: "image/png",
          url: "https://example.com/image.png",
        },
      ],
    },
  ],
};

export const requestWithTools: ChatCompletionRequest = {
  ...validChatRequest,
  tools: [
    {
      type: "function",
      function: {
        name: "get_weather",
        description: "Get the current weather in a location",
        parameters: {
          type: "object",
          properties: {
            location: {
              type: "string",
              description: "The city and state, e.g. San Francisco, CA",
            },
            unit: {
              type: "string",
              enum: ["celsius", "fahrenheit"],
            },
          },
          required: ["location"],
        },
      },
    },
  ],
  tool_choice: "auto",
};

export const requestWithMultipleTools: ChatCompletionRequest = {
  ...validChatRequest,
  tools: [
    {
      type: "function",
      function: {
        name: "get_weather",
        description: "Get the current weather",
        parameters: {
          type: "object",
          properties: {
            location: { type: "string" },
          },
        },
      },
    },
    {
      type: "function",
      function: {
        name: "get_time",
        description: "Get the current time",
        parameters: {
          type: "object",
          properties: {
            timezone: { type: "string" },
          },
        },
      },
    },
  ],
  tool_choice: "auto",
};

export const requestWithToolChoiceFunction: ChatCompletionRequest = {
  ...validChatRequest,
  tools: [
    {
      type: "function",
      function: {
        name: "get_weather",
        description: "Get the current weather",
        parameters: {
          type: "object",
          properties: {
            location: { type: "string" },
          },
        },
      },
    },
  ],
  tool_choice: {
    type: "function",
    function: {
      name: "get_weather",
    },
  },
};

export const requestWithReasoning: ChatCompletionRequest = {
  ...validChatRequest,
  model: "o3-mini",
  reasoning_mode: "deep",
  max_reasoning_tokens: 10000,
};

export const requestWithGuardrails: ChatCompletionRequest = {
  ...validChatRequest,
  system_guardrails_enabled: true,
  guardrail_profile: "enterprise-safe",
};

export const requestWithAllParameters: ChatCompletionRequest = {
  api_version: "2025-01-01",
  model: "gpt-4o",
  messages: [
    { role: "system", content: "You are a helpful assistant" },
    { role: "user", content: "Hello" },
  ],
  provider: "azure-openai",
  azure_endpoint: "https://test.openai.azure.com",
  azure_deployment: "gpt-4o",
  stream: true,
  temperature: 0.7,
  top_p: 0.95,
  max_tokens: 1000,
  max_completion_tokens: 500,
  response_format: { type: "json_schema", json_schema: { type: "object" } },
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
  stop: ["\n", "END"],
  presence_penalty: 0.1,
  frequency_penalty: 0.1,
  n: 2,
  logit_bias: { "123": 0.5 },
  logprobs: true,
  top_logprobs: 5,
  user: "test-user",
  system_guardrails_enabled: true,
  guardrail_profile: "enterprise-safe",
};

export const requestWithJsonMode: ChatCompletionRequest = {
  ...validChatRequest,
  response_format: "json",
};

export const requestWithJsonSchema: ChatCompletionRequest = {
  ...validChatRequest,
  response_format: {
    type: "json_schema",
    json_schema: {
      type: "object",
      properties: {
        name: { type: "string" },
        age: { type: "number" },
      },
    },
  },
};

export const requestWithSystemMessage: ChatCompletionRequest = {
  ...validChatRequest,
  messages: [
    { role: "system", content: "You are a helpful assistant" },
    { role: "user", content: "Hello" },
  ],
};

export const requestWithMultipleMessages: ChatCompletionRequest = {
  ...validChatRequest,
  messages: [
    { role: "system", content: "You are helpful" },
    { role: "user", content: "Hello" },
    { role: "assistant", content: "Hi there!" },
    { role: "user", content: "How are you?" },
  ],
};

export const requestWithContentArray: ChatCompletionRequest = {
  ...validChatRequest,
  messages: [
    {
      role: "user",
      content: [
        { type: "text", text: "What's in this image?" },
        {
          type: "image_url",
          image_url: {
            url: "https://example.com/image.png",
            detail: "high",
          },
        },
      ],
    },
  ],
};

// Invalid request fixtures
export const invalidRequestMissingModel = {
  api_version: "2025-01-01",
  messages: [{ role: "user", content: "Hello" }],
};

export const invalidRequestMissingMessages = {
  api_version: "2025-01-01",
  model: "gpt-4o",
};

export const invalidRequestEmptyMessages = {
  api_version: "2025-01-01",
  model: "gpt-4o",
  messages: [],
};

export const invalidRequestInvalidTemperature = {
  ...validChatRequest,
  temperature: 3.0, // Out of range
};

export const invalidRequestNegativeTemperature = {
  ...validChatRequest,
  temperature: -1.0,
};

export const invalidRequestInvalidTopP = {
  ...validChatRequest,
  top_p: 1.5, // Out of range
};

export const invalidRequestInvalidMaxTokens = {
  ...validChatRequest,
  max_tokens: 0, // Below minimum
};

export const invalidRequestInvalidProvider = {
  ...validChatRequest,
  provider: "invalid-provider",
};

export const invalidRequestInvalidModel = {
  ...validChatRequest,
  model: "non-existent-model",
};

export const invalidRequestInvalidReasoningMode = {
  ...validChatRequest,
  model: "o3-mini",
  reasoning_mode: "invalid-mode" as any,
};

export const invalidRequestAttachmentWithoutDataOrUrl = {
  ...validChatRequest,
  messages: [
    {
      role: "user",
      content: "Test",
      attachments: [
        {
          type: "image",
          mime_type: "image/png",
          // Missing both data and url
        },
      ],
    },
  ],
};

export const invalidRequestInvalidMimeType = {
  ...validChatRequest,
  messages: [
    {
      role: "user",
      content: "Test",
      attachments: [
        {
          type: "image",
          mime_type: "application/json", // Invalid for image
          data: "base64data",
        },
      ],
    },
  ],
};

export const invalidRequestToolWithoutParameters = {
  ...validChatRequest,
  tools: [
    {
      type: "function",
      function: {
        name: "test_function",
        // Missing parameters
      },
    },
  ],
};

export const invalidRequestInvalidStopArray = {
  ...validChatRequest,
  stop: ["stop1", "stop2", "stop3", "stop4", "stop5"], // Too many stop sequences
};

// Edge cases
export const requestWithUnicode: ChatCompletionRequest = {
  ...validChatRequest,
  messages: [{ role: "user", content: "Hello 世界 🌍" }],
};

export const requestWithVeryLongContent: ChatCompletionRequest = {
  ...validChatRequest,
  messages: [{ role: "user", content: "A".repeat(100000) }],
};

export const requestWithSpecialCharacters: ChatCompletionRequest = {
  ...validChatRequest,
  messages: [{ role: "user", content: "Test with \"quotes\", 'apostrophes', and <tags>" }],
};
