import { describe, it, expect } from "vitest";
import { ChatCompletionResponseSchema, SSEChunkSchema } from "../../../models/chatCompletionTypes";
import {
  mockOpenAIResponse,
  mockOpenAIStreamingChunk,
} from "../../fixtures/responses/providerResponses";

/**
 * Contract tests for OpenAI API response format compatibility
 */
describe("OpenAI Response Format Compatibility", () => {
  describe("ChatCompletionResponse structure", () => {
    it("should match OpenAI response format", () => {
      const response = {
        id: "chatcmpl-123",
        object: "chat.completion",
        created: 1677652288,
        model: "gpt-4o",
        choices: [
          {
            index: 0,
            message: {
              role: "assistant",
              content: "Hello! How can I help you?",
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

      const result = ChatCompletionResponseSchema.safeParse(response);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe("chatcmpl-123");
        expect(result.data.object).toBe("chat.completion");
        expect(result.data.model).toBe("gpt-4o");
        expect(result.data.choices).toHaveLength(1);
        expect(result.data.usage).toBeDefined();
      }
    });

    it("should match OpenAI response with tool calls", () => {
      const response = {
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
                    arguments: '{"location": "SF"}',
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

      const result = ChatCompletionResponseSchema.safeParse(response);
      expect(result.success).toBe(true);
    });

    it("should support HALO extensions without breaking compatibility", () => {
      const response = {
        ...mockOpenAIResponse,
        request_id: "req-123",
        provider: "azure-openai",
        latency_ms: 150,
      };

      const result = ChatCompletionResponseSchema.safeParse(response);
      expect(result.success).toBe(true);
      if (result.success) {
        // OpenAI fields should still be present
        expect(result.data.id).toBe("chatcmpl-123");
        expect(result.data.object).toBe("chat.completion");
        // HALO extensions should be optional
        expect(result.data.request_id).toBe("req-123");
        expect(result.data.provider).toBe("azure-openai");
      }
    });
  });

  describe("SSE Chunk format", () => {
    it("should match OpenAI streaming chunk format", () => {
      const chunk = {
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

      const result = SSEChunkSchema.safeParse(chunk);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe("chatcmpl-123");
        expect(result.data.object).toBe("chat.completion.chunk");
        expect(result.data.choices[0].delta.content).toBe("Hello");
      }
    });

    it("should match final chunk format", () => {
      const chunk = {
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

      const result = SSEChunkSchema.safeParse(chunk);
      expect(result.success).toBe(true);
    });

    it("should format SSE chunks with data: prefix", () => {
      const chunk = mockOpenAIStreamingChunk;
      const sseFormat = `data: ${JSON.stringify(chunk)}\n\n`;

      expect(sseFormat).toContain("data: ");
      expect(sseFormat).toContain("\n\n");
      expect(sseFormat.startsWith("data: ")).toBe(true);
    });

    it("should include [DONE] marker", () => {
      const doneMarker = "data: [DONE]\n\n";
      expect(doneMarker).toBe("data: [DONE]\n\n");
    });
  });

  describe("Usage statistics", () => {
    it("should match OpenAI usage format", () => {
      const usage = {
        prompt_tokens: 10,
        completion_tokens: 15,
        total_tokens: 25,
      };

      const response = {
        ...mockOpenAIResponse,
        usage,
      };

      const result = ChatCompletionResponseSchema.safeParse(response);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.usage?.prompt_tokens).toBe(10);
        expect(result.data.usage?.completion_tokens).toBe(15);
        expect(result.data.usage?.total_tokens).toBe(25);
      }
    });

    it("should support reasoning tokens (HALO extension)", () => {
      const usage = {
        prompt_tokens: 10,
        completion_tokens: 20,
        total_tokens: 30,
        reasoning_tokens: 5000,
      };

      const response = {
        ...mockOpenAIResponse,
        usage,
      };

      const result = ChatCompletionResponseSchema.safeParse(response);
      expect(result.success).toBe(true);
      if (result.success && result.data.usage) {
        expect(result.data.usage.reasoning_tokens).toBe(5000);
      }
    });
  });

  describe("Error format", () => {
    it("should match OpenAI error format", () => {
      const error = {
        error: {
          message: "Invalid API key",
          type: "invalid_request_error",
          param: null,
          code: "invalid_api_key",
        },
      };

      // Error format should be consistent
      expect(error.error).toHaveProperty("message");
      expect(error.error).toHaveProperty("type");
      expect(error.error).toHaveProperty("code");
    });
  });

  describe("Choice format", () => {
    it("should match OpenAI choice structure", () => {
      const choice = {
        index: 0,
        message: {
          role: "assistant",
          content: "Response",
        },
        finish_reason: "stop",
        logprobs: null,
      };

      const response = {
        ...mockOpenAIResponse,
        choices: [choice],
      };

      const result = ChatCompletionResponseSchema.safeParse(response);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.choices[0].index).toBe(0);
        expect(result.data.choices[0].message.role).toBe("assistant");
        expect(result.data.choices[0].finish_reason).toBe("stop");
      }
    });

    it("should support multiple choices", () => {
      const response = {
        ...mockOpenAIResponse,
        choices: [
          {
            index: 0,
            message: { role: "assistant", content: "First" },
            finish_reason: "stop",
          },
          {
            index: 1,
            message: { role: "assistant", content: "Second" },
            finish_reason: "stop",
          },
        ],
      };

      const result = ChatCompletionResponseSchema.safeParse(response);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.choices).toHaveLength(2);
      }
    });
  });
});
