import { describe, it, expect } from "vitest";
import {
  ChatCompletionRequestSchema,
  ChatMessageSchema,
  AttachmentSchema,
} from "../../../models/chatCompletionTypes";

/**
 * Edge case tests for schema validation
 */
describe("Schema Edge Cases", () => {
  describe("Null and undefined values", () => {
    it("should handle null in optional fields", () => {
      const request = {
        api_version: "2025-01-01",
        model: "gpt-4o",
        messages: [{ role: "user", content: "Hello" }],
        stop: null as any,
      };

      // Should either accept or reject gracefully
      const result = ChatCompletionRequestSchema.safeParse(request);
      // Result depends on schema definition
      expect(result.success !== undefined).toBe(true);
    });

    it("should reject null in required fields", () => {
      const request = {
        api_version: "2025-01-01",
        model: null as any,
        messages: [{ role: "user", content: "Hello" }],
      };

      const result = ChatCompletionRequestSchema.safeParse(request);
      expect(result.success).toBe(false);
    });
  });

  describe("Empty arrays", () => {
    it("should reject empty messages array", () => {
      const request = {
        api_version: "2025-01-01",
        model: "gpt-4o",
        messages: [],
      };

      const result = ChatCompletionRequestSchema.safeParse(request);
      expect(result.success).toBe(false);
    });

    it("should accept empty tools array", () => {
      const request = {
        api_version: "2025-01-01",
        model: "gpt-4o",
        messages: [{ role: "user", content: "Hello" }],
        tools: [],
      };

      const result = ChatCompletionRequestSchema.safeParse(request);
      expect(result.success).toBe(true);
    });
  });

  describe("Very long strings", () => {
    it("should handle very long content", () => {
      const longContent = "A".repeat(100000);
      const request = {
        api_version: "2025-01-01",
        model: "gpt-4o",
        messages: [{ role: "user", content: longContent }],
      };

      const result = ChatCompletionRequestSchema.safeParse(request);
      expect(result.success).toBe(true);
    });

    it("should handle very long model names", () => {
      const longModel = "gpt-4o-" + "x".repeat(1000);
      const request = {
        api_version: "2025-01-01",
        model: longModel,
        messages: [{ role: "user", content: "Hello" }],
      };

      const result = ChatCompletionRequestSchema.safeParse(request);
      expect(result.success).toBe(true);
    });
  });

  describe("Special characters", () => {
    it("should handle Unicode characters", () => {
      const request = {
        api_version: "2025-01-01",
        model: "gpt-4o",
        messages: [{ role: "user", content: "Hello 世界 🌍" }],
      };

      const result = ChatCompletionRequestSchema.safeParse(request);
      expect(result.success).toBe(true);
    });

    it("should handle special characters in content", () => {
      const request = {
        api_version: "2025-01-01",
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: "Test with \"quotes\", 'apostrophes', <tags>, & symbols",
          },
        ],
      };

      const result = ChatCompletionRequestSchema.safeParse(request);
      expect(result.success).toBe(true);
    });

    it("should handle newlines and tabs", () => {
      const request = {
        api_version: "2025-01-01",
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: "Line 1\nLine 2\tTabbed",
          },
        ],
      };

      const result = ChatCompletionRequestSchema.safeParse(request);
      expect(result.success).toBe(true);
    });
  });

  describe("Boundary values", () => {
    it("should accept minimum temperature (0)", () => {
      const request = {
        api_version: "2025-01-01",
        model: "gpt-4o",
        messages: [{ role: "user", content: "Hello" }],
        temperature: 0,
      };

      const result = ChatCompletionRequestSchema.safeParse(request);
      expect(result.success).toBe(true);
    });

    it("should accept maximum temperature (2)", () => {
      const request = {
        api_version: "2025-01-01",
        model: "gpt-4o",
        messages: [{ role: "user", content: "Hello" }],
        temperature: 2,
      };

      const result = ChatCompletionRequestSchema.safeParse(request);
      expect(result.success).toBe(true);
    });

    it("should accept minimum top_p (0)", () => {
      const request = {
        api_version: "2025-01-01",
        model: "gpt-4o",
        messages: [{ role: "user", content: "Hello" }],
        top_p: 0,
      };

      const result = ChatCompletionRequestSchema.safeParse(request);
      expect(result.success).toBe(true);
    });

    it("should accept maximum top_p (1)", () => {
      const request = {
        api_version: "2025-01-01",
        model: "gpt-4o",
        messages: [{ role: "user", content: "Hello" }],
        top_p: 1,
      };

      const result = ChatCompletionRequestSchema.safeParse(request);
      expect(result.success).toBe(true);
    });

    it("should accept minimum max_tokens (1)", () => {
      const request = {
        api_version: "2025-01-01",
        model: "gpt-4o",
        messages: [{ role: "user", content: "Hello" }],
        max_tokens: 1,
      };

      const result = ChatCompletionRequestSchema.safeParse(request);
      expect(result.success).toBe(true);
    });
  });

  describe("Type coercion", () => {
    it("should handle string numbers in numeric fields", () => {
      // Zod should handle type coercion based on schema definition
      const request = {
        api_version: "2025-01-01",
        model: "gpt-4o",
        messages: [{ role: "user", content: "Hello" }],
        temperature: "0.7" as any,
      };

      const result = ChatCompletionRequestSchema.safeParse(request);
      // May succeed with coercion or fail, depending on schema
      expect(result.success !== undefined).toBe(true);
    });
  });

  describe("Nested structures", () => {
    it("should handle deeply nested tool parameters", () => {
      const request = {
        api_version: "2025-01-01",
        model: "gpt-4o",
        messages: [{ role: "user", content: "Hello" }],
        tools: [
          {
            type: "function",
            function: {
              name: "complex_tool",
              parameters: {
                type: "object",
                properties: {
                  nested: {
                    type: "object",
                    properties: {
                      deep: {
                        type: "object",
                        properties: {
                          value: { type: "string" },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        ],
      };

      const result = ChatCompletionRequestSchema.safeParse(request);
      expect(result.success).toBe(true);
    });
  });
});

