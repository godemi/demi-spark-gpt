import { describe, it, expect } from "vitest";
import {
  ChatCompletionRequestSchema,
  ChatCompletionResponseSchema,
  SSEChunkSchema,
  AttachmentSchema,
  ToolDefinitionSchema,
} from "../../../models/chatCompletionTypes";
import {
  validChatRequest,
  invalidRequestMissingModel,
  invalidRequestInvalidTemperature,
} from "../../fixtures/requests/chatCompletionRequests";

/**
 * Example unit test file for chat completion types
 * 
 * This demonstrates the testing pattern for schema validation
 */
describe("ChatCompletionRequestSchema", () => {
  describe("Valid requests", () => {
    it("should validate a minimal valid request", () => {
      const result = ChatCompletionRequestSchema.safeParse(validChatRequest);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.model).toBe("gpt-4o");
        expect(result.data.messages).toHaveLength(1);
      }
    });

    it("should validate a request with all optional fields", () => {
      const fullRequest = {
        ...validChatRequest,
        temperature: 0.7,
        top_p: 0.95,
        max_tokens: 1000,
        stream: true,
        tools: [
          {
            type: "function",
            function: {
              name: "test_function",
              parameters: { type: "object", properties: {} },
            },
          },
        ],
      };
      const result = ChatCompletionRequestSchema.safeParse(fullRequest);
      expect(result.success).toBe(true);
    });
  });

  describe("Invalid requests", () => {
    it("should reject request missing required model field", () => {
      const result = ChatCompletionRequestSchema.safeParse(
        invalidRequestMissingModel
      );
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((issue) => issue.path.includes("model"))).toBe(true);
      }
    });

    it("should reject request with invalid temperature", () => {
      const result = ChatCompletionRequestSchema.safeParse(
        invalidRequestInvalidTemperature
      );
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(
          result.error.issues.some(
            (issue) => issue.path.includes("temperature") && issue.message.includes("2")
          )
        ).toBe(true);
      }
    });

    it("should reject request with empty messages array", () => {
      const result = ChatCompletionRequestSchema.safeParse({
        ...validChatRequest,
        messages: [],
      });
      expect(result.success).toBe(false);
    });

    it("should reject request with invalid provider", () => {
      const result = ChatCompletionRequestSchema.safeParse({
        ...validChatRequest,
        provider: "invalid-provider",
      });
      expect(result.success).toBe(false);
    });
  });
});

describe("AttachmentSchema", () => {
  it("should validate image attachment with base64 data", () => {
    const attachment = {
      type: "image",
      mime_type: "image/png",
      data: "base64data",
    };
    const result = AttachmentSchema.safeParse(attachment);
    expect(result.success).toBe(true);
  });

  it("should validate image attachment with URL", () => {
    const attachment = {
      type: "image",
      mime_type: "image/jpeg",
      url: "https://example.com/image.jpg",
    };
    const result = AttachmentSchema.safeParse(attachment);
    expect(result.success).toBe(true);
  });

  it("should reject attachment without data or URL", () => {
    const attachment = {
      type: "image",
      mime_type: "image/png",
    };
    const result = AttachmentSchema.safeParse(attachment);
    expect(result.success).toBe(false);
  });
});

describe("ToolDefinitionSchema", () => {
  it("should validate a valid tool definition", () => {
    const tool = {
      type: "function",
      function: {
        name: "get_weather",
        description: "Get weather information",
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

  it("should reject tool without required fields", () => {
    const tool = {
      type: "function",
      function: {
        name: "get_weather",
        // Missing parameters
      },
    };
    const result = ToolDefinitionSchema.safeParse(tool);
    expect(result.success).toBe(false);
  });
});

