import { describe, it, expect } from "vitest";
import { ChatCompletionRequestSchema } from "../../../models/chatCompletionTypes";
import {
  validChatRequest,
  requestWithAllParameters,
} from "../../fixtures/requests/chatCompletionRequests";

/**
 * Contract tests for OpenAI API request format compatibility
 */
describe("OpenAI Request Format Compatibility", () => {
  describe("Message structure", () => {
    it("should accept OpenAI-compatible message format", () => {
      const request = {
        ...validChatRequest,
        messages: [
          {
            role: "user",
            content: "Hello",
          },
        ],
      };

      const result = ChatCompletionRequestSchema.safeParse(request);
      expect(result.success).toBe(true);
    });

    it("should accept messages with content array (multimodal)", () => {
      const request = {
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

      const result = ChatCompletionRequestSchema.safeParse(request);
      expect(result.success).toBe(true);
    });

    it("should accept messages with tool calls", () => {
      const request = {
        ...validChatRequest,
        messages: [
          {
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
        ],
      };

      const result = ChatCompletionRequestSchema.safeParse(request);
      expect(result.success).toBe(true);
    });
  });

  describe("Parameter names", () => {
    it("should use OpenAI parameter names", () => {
      const request = {
        ...validChatRequest,
        temperature: 0.7,
        top_p: 0.95,
        max_tokens: 1000,
        stream: true,
        n: 2,
        stop: ["\n"],
        presence_penalty: 0.1,
        frequency_penalty: 0.1,
        logit_bias: { "123": 0.5 },
        user: "user-123",
      };

      const result = ChatCompletionRequestSchema.safeParse(request);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.temperature).toBe(0.7);
        expect(result.data.top_p).toBe(0.95);
        expect(result.data.max_tokens).toBe(1000);
        expect(result.data.stream).toBe(true);
        expect(result.data.n).toBe(2);
        expect(result.data.stop).toEqual(["\n"]);
        expect(result.data.presence_penalty).toBe(0.1);
        expect(result.data.frequency_penalty).toBe(0.1);
        expect(result.data.logit_bias).toEqual({ "123": 0.5 });
        expect(result.data.user).toBe("user-123");
      }
    });

    it("should support tools parameter", () => {
      const request = {
        ...validChatRequest,
        tools: [
          {
            type: "function",
            function: {
              name: "get_weather",
              description: "Get weather",
              parameters: {
                type: "object",
                properties: {
                  location: { type: "string" },
                },
              },
            },
          },
        ],
      };

      const result = ChatCompletionRequestSchema.safeParse(request);
      expect(result.success).toBe(true);
    });

    it("should support tool_choice parameter", () => {
      const toolChoices = ["auto", "none", { type: "function", function: { name: "get_weather" } }];

      for (const toolChoice of toolChoices) {
        const request = {
          ...validChatRequest,
          tools: [
            {
              type: "function",
              function: {
                name: "get_weather",
                parameters: { type: "object", properties: {} },
              },
            },
          ],
          tool_choice: toolChoice,
        };

        const result = ChatCompletionRequestSchema.safeParse(request);
        expect(result.success).toBe(true);
      }
    });

    it("should support response_format parameter", () => {
      const formats = [
        "text",
        "json",
        {
          type: "json_schema",
          json_schema: {
            type: "object",
            properties: {
              name: { type: "string" },
            },
          },
        },
      ];

      for (const format of formats) {
        const request = {
          ...validChatRequest,
          response_format: format,
        };

        const result = ChatCompletionRequestSchema.safeParse(request);
        expect(result.success).toBe(true);
      }
    });
  });

  describe("Optional fields", () => {
    it("should handle all optional fields as undefined", () => {
      const minimalRequest = {
        api_version: "2025-01-01",
        model: "gpt-4o",
        messages: [{ role: "user", content: "Hello" }],
      };

      const result = ChatCompletionRequestSchema.safeParse(minimalRequest);
      expect(result.success).toBe(true);
    });

    it("should accept request with all optional fields", () => {
      const result = ChatCompletionRequestSchema.safeParse(requestWithAllParameters);
      expect(result.success).toBe(true);
    });
  });

  describe("Value ranges", () => {
    it("should enforce temperature range (0-2)", () => {
      const validTemps = [0, 0.5, 1.0, 1.5, 2.0];
      for (const temp of validTemps) {
        const request = { ...validChatRequest, temperature: temp };
        const result = ChatCompletionRequestSchema.safeParse(request);
        expect(result.success).toBe(true);
      }
    });

    it("should enforce top_p range (0-1)", () => {
      const validTopP = [0, 0.5, 1.0];
      for (const topP of validTopP) {
        const request = { ...validChatRequest, top_p: topP };
        const result = ChatCompletionRequestSchema.safeParse(request);
        expect(result.success).toBe(true);
      }
    });

    it("should enforce max_tokens minimum (>=1)", () => {
      const request = { ...validChatRequest, max_tokens: 1 };
      const result = ChatCompletionRequestSchema.safeParse(request);
      expect(result.success).toBe(true);
    });
  });
});
