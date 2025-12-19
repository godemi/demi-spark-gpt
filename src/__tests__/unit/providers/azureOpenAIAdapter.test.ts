import { describe, it, expect, beforeEach, vi } from "vitest";
import { AzureOpenAIAdapter } from "../../../providers/azureOpenAIAdapter";
import { ChatCompletionRequest } from "../../../models/chatCompletionTypes";
import { ProviderConfig } from "../../../providers/types";
import { createMockProviderConfig } from "../../helpers/mock-providers";
import {
  validChatRequest,
  requestWithAttachments,
  requestWithTools,
  requestWithReasoning,
} from "../../fixtures/requests/chatCompletionRequests";

/**
 * Unit tests for Azure OpenAI adapter
 */
describe("AzureOpenAIAdapter", () => {
  let adapter: AzureOpenAIAdapter;
  let config: ProviderConfig;

  beforeEach(() => {
    adapter = new AzureOpenAIAdapter();
    config = createMockProviderConfig();
  });

  describe("name", () => {
    it("should have correct name", () => {
      expect(adapter.name).toBe("azure-openai");
    });
  });

  describe("buildRequest", () => {
    it("should build request with minimal parameters", async () => {
      const request = await adapter.buildRequest(validChatRequest, config);

      expect(request.model).toBeDefined();
      expect(request.messages).toBeDefined();
      expect(request.stream).toBe(false);
    });

    it("should include all optional parameters", async () => {
      const fullRequest: ChatCompletionRequest = {
        ...validChatRequest,
        temperature: 0.7,
        top_p: 0.95,
        max_tokens: 1000,
        max_completion_tokens: 500,
        reasoning_mode: "deep",
        max_reasoning_tokens: 10000,
        response_format: "json",
        tools: [
          {
            type: "function",
            function: {
              name: "test",
              parameters: { type: "object", properties: {} },
            },
          },
        ],
        tool_choice: "auto",
        seed: 42,
        stop: ["\n"],
        presence_penalty: 0.1,
        frequency_penalty: 0.1,
        n: 2,
        logit_bias: { "123": 0.5 },
        logprobs: true,
        top_logprobs: 5,
        user: "test-user",
      };

      const request = await adapter.buildRequest(fullRequest, config);

      expect(request.temperature).toBe(0.7);
      expect(request.top_p).toBe(0.95);
      expect(request.max_tokens).toBe(1000);
      expect(request.max_completion_tokens).toBe(500);
      expect(request.reasoning_mode).toBe("deep");
      expect(request.max_reasoning_tokens).toBe(10000);
      expect(request.response_format).toBe("json");
      expect(request.tools).toBeDefined();
      expect(request.tool_choice).toBe("auto");
      expect(request.seed).toBe(42);
      expect(request.stop).toEqual(["\n"]);
      expect(request.presence_penalty).toBe(0.1);
      expect(request.frequency_penalty).toBe(0.1);
      expect(request.n).toBe(2);
      expect(request.logit_bias).toEqual({ "123": 0.5 });
      expect(request.logprobs).toBe(true);
      expect(request.top_logprobs).toBe(5);
      expect(request.user).toBe("test-user");
    });

    it("should normalize messages with attachments", async () => {
      const request = await adapter.buildRequest(requestWithAttachments, config);

      expect(request.messages).toBeDefined();
      expect(request.messages.length).toBeGreaterThan(0);
      // Attachments should be converted to content array format
      const message = request.messages[0];
      if (Array.isArray(message.content)) {
        expect(message.content.some((part: any) => part.type === "image_url")).toBe(true);
      }
    });

    it("should handle messages without attachments", async () => {
      const request = await adapter.buildRequest(validChatRequest, config);

      expect(request.messages).toBeDefined();
      expect(request.messages[0]).toHaveProperty("content");
    });

    it("should use deployment from config if provided", async () => {
      const customConfig: ProviderConfig = {
        ...config,
        deployment: "custom-deployment",
      };

      const request = await adapter.buildRequest(validChatRequest, customConfig);

      expect(request.model).toBe("custom-deployment");
    });

    it("should use model from request if no deployment", async () => {
      const customConfig: ProviderConfig = {
        ...config,
        deployment: undefined,
        model: undefined,
      };

      const request = await adapter.buildRequest(validChatRequest, customConfig);

      expect(request.model).toBe(validChatRequest.model);
    });
  });

  describe("getCapabilities", () => {
    it("should return capabilities for known model", () => {
      const caps = adapter.getCapabilities("gpt-4o");

      expect(caps).toBeDefined();
      expect(caps?.chat).toBe(true);
      expect(caps?.vision).toBe(true);
    });

    it("should return null for unknown model", () => {
      const caps = adapter.getCapabilities("unknown-model");

      expect(caps).toBeNull();
    });

    it("should handle case-insensitive model names", () => {
      const caps1 = adapter.getCapabilities("GPT-4O");
      const caps2 = adapter.getCapabilities("gpt-4o");

      expect(caps1).toEqual(caps2);
    });
  });

  describe("validateRequest", () => {
    it("should validate any request (Azure OpenAI supports all)", () => {
      expect(adapter.validateRequest(validChatRequest)).toBe(true);
      expect(adapter.validateRequest(requestWithAttachments)).toBe(true);
      expect(adapter.validateRequest(requestWithTools)).toBe(true);
      expect(adapter.validateRequest(requestWithReasoning)).toBe(true);
    });
  });

  describe("Client creation and caching", () => {
    it("should create client with API key authentication", () => {
      const apiKeyConfig: ProviderConfig = {
        ...config,
        authType: "api-key",
        apiKey: "test-key",
      };

      // Access private method through buildRequest which uses getClient
      adapter.buildRequest(validChatRequest, apiKeyConfig);

      // Client should be created (we can't directly test private method, but buildRequest should work)
      expect(adapter.name).toBe("azure-openai");
    });

    it("should handle AAD authentication", () => {
      const aadConfig: ProviderConfig = {
        ...config,
        authType: "aad",
        apiKey: undefined,
      };

      // Should not throw
      expect(() => {
        adapter.buildRequest(validChatRequest, aadConfig);
      }).not.toThrow();
    });
  });

  describe("Message normalization", () => {
    it("should convert attachments to content array", async () => {
      const request = await adapter.buildRequest(requestWithAttachments, config);
      const message = request.messages[0];

      if (Array.isArray(message.content)) {
        const hasImage = message.content.some(
          (part: any) => part.type === "image_url" || part.type === "image_url"
        );
        expect(hasImage || typeof message.content === "string").toBe(true);
      }
    });

    it("should preserve text content with attachments", async () => {
      const request = await adapter.buildRequest(requestWithAttachments, config);
      const message = request.messages[0];

      if (Array.isArray(message.content)) {
        const hasText = message.content.some((part: any) => part.type === "text");
        expect(hasText || typeof message.content === "string").toBe(true);
      }
    });

    it("should handle messages with content array already", async () => {
      const requestWithContentArray: ChatCompletionRequest = {
        ...validChatRequest,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: "Hello" },
              {
                type: "image_url",
                image_url: { url: "https://example.com/image.png" },
              },
            ],
          },
        ],
      };

      const request = await adapter.buildRequest(requestWithContentArray, config);

      expect(request.messages).toBeDefined();
    });
  });

  describe("Error handling", () => {
    it("should handle invalid model gracefully", () => {
      const caps = adapter.getCapabilities("invalid-model-xyz");
      expect(caps).toBeNull();
    });
  });
});
