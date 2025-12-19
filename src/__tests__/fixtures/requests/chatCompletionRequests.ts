import { ChatCompletionRequest } from "../../../models/chatCompletionTypes";

/**
 * Test fixtures for chat completion requests
 */

export const validChatRequest: ChatCompletionRequest = {
  api_version: "2025-01-01",
  model: "gpt-4o",
  messages: [
    { role: "user", content: "Hello, how are you?" },
  ],
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

export const invalidRequestMissingModel = {
  api_version: "2025-01-01",
  messages: [{ role: "user", content: "Hello" }],
};

export const invalidRequestInvalidTemperature = {
  ...validChatRequest,
  temperature: 3.0, // Out of range
};

export const invalidRequestInvalidModel = {
  ...validChatRequest,
  model: "non-existent-model",
};

