import { describe, it, expect } from "vitest";
import {
  ChatCompletionRequestSchema,
  ChatCompletionResponseSchema,
  ChatMessageSchema,
  AttachmentSchema,
  ToolDefinitionSchema,
  SSEChunkSchema,
} from "../../../models/chatCompletionTypes";

/**
 * Comprehensive schema validation tests
 */
describe("Zod Schema Validation", () => {
  describe("ChatCompletionRequestSchema", () => {
    it("should validate all required fields", () => {
      const request = {
        api_version: "2025-01-01",
        model: "gpt-4o",
        messages: [{ role: "user", content: "Hello" }],
      };

      const result = ChatCompletionRequestSchema.safeParse(request);
      expect(result.success).toBe(true);
    });

    it("should validate all optional fields", () => {
      const request = {
        api_version: "2025-01-01",
        model: "gpt-4o",
        messages: [{ role: "user", content: "Hello" }],
        temperature: 0.7,
        top_p: 0.95,
        max_tokens: 1000,
        stream: true,
        tools: [],
        seed: 42,
        stop: ["\n"],
        presence_penalty: 0.1,
        frequency_penalty: 0.1,
        n: 2,
        logit_bias: {},
        logprobs: true,
        top_logprobs: 5,
        user: "user-123",
      };

      const result = ChatCompletionRequestSchema.safeParse(request);
      expect(result.success).toBe(true);
    });
  });

  describe("ChatMessageSchema", () => {
    it("should validate string content", () => {
      const message = {
        role: "user",
        content: "Hello",
      };

      const result = ChatMessageSchema.safeParse(message);
      expect(result.success).toBe(true);
    });

    it("should validate content array", () => {
      const message = {
        role: "user",
        content: [
          { type: "text", text: "Hello" },
          {
            type: "image_url",
            image_url: { url: "https://example.com/image.png" },
          },
        ],
      };

      const result = ChatMessageSchema.safeParse(message);
      expect(result.success).toBe(true);
    });
  });

  describe("AttachmentSchema", () => {
    it("should validate base64 attachment", () => {
      const attachment = {
        type: "image",
        mime_type: "image/png",
        data: "base64data",
      };

      const result = AttachmentSchema.safeParse(attachment);
      expect(result.success).toBe(true);
    });

    it("should validate URL attachment", () => {
      const attachment = {
        type: "image",
        mime_type: "image/png",
        url: "https://example.com/image.png",
      };

      const result = AttachmentSchema.safeParse(attachment);
      expect(result.success).toBe(true);
    });
  });

  describe("ToolDefinitionSchema", () => {
    it("should validate tool definition", () => {
      const tool = {
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
      };

      const result = ToolDefinitionSchema.safeParse(tool);
      expect(result.success).toBe(true);
    });
  });

  describe("SSEChunkSchema", () => {
    it("should validate streaming chunk", () => {
      const chunk = {
        id: "chatcmpl-123",
        object: "chat.completion.chunk",
        created: 1677652288,
        model: "gpt-4o",
        choices: [
          {
            index: 0,
            delta: { content: "Hello" },
            finish_reason: null,
          },
        ],
      };

      const result = SSEChunkSchema.safeParse(chunk);
      expect(result.success).toBe(true);
    });
  });
});

