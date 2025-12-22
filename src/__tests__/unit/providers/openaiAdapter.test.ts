import { describe, it, expect, beforeEach } from "vitest";
import { OpenAIAdapter } from "../../../providers/openaiAdapter";
import { ProviderConfig } from "../../../providers/types";
import { createMockProviderConfig } from "../../helpers/mock-providers";
import {
  validChatRequest,
  requestWithAttachments,
  requestWithTools,
} from "../../fixtures/requests/chatCompletionRequests";

describe("OpenAIAdapter", () => {
  let adapter: OpenAIAdapter;
  let config: ProviderConfig;

  beforeEach(() => {
    adapter = new OpenAIAdapter();
    config = {
      provider: "openai",
      endpoint: "https://api.openai.com/v1",
      apiKey: "test-key",
      apiVersion: "v1",
      authType: "api-key",
      organization: "org-123",
    };
  });

  describe("name", () => {
    it("should have correct name", () => {
      expect(adapter.name).toBe("openai");
    });
  });

  describe("buildRequest", () => {
    it("should build request with minimal parameters", async () => {
      const request = await adapter.buildRequest(validChatRequest, config);

      expect(request.model).toBe(validChatRequest.model);
      expect(request.messages).toBeDefined();
      expect(request.stream).toBe(false);
    });

    it("should include all optional parameters", async () => {
      const fullRequest = {
        ...validChatRequest,
        temperature: 0.7,
        top_p: 0.95,
        max_tokens: 1000,
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
      expect(request.response_format).toBe("json");
      expect(request.tools).toBeDefined();
    });

    it("should normalize messages with attachments", async () => {
      const request = await adapter.buildRequest(requestWithAttachments, config);

      expect(request.messages).toBeDefined();
      const message = request.messages[0];
      if (Array.isArray(message.content)) {
        expect(message.content.some((part: any) => part.type === "image_url")).toBe(true);
      }
    });
  });

  describe("getCapabilities", () => {
    it("should return capabilities for known model", () => {
      const caps = adapter.getCapabilities("gpt-4o");
      expect(caps).toBeDefined();
      expect(caps?.chat).toBe(true);
    });

    it("should return null for unknown model", () => {
      const caps = adapter.getCapabilities("unknown-model");
      expect(caps).toBeNull();
    });
  });

  describe("validateRequest", () => {
    it("should validate any request", () => {
      expect(adapter.validateRequest(validChatRequest)).toBe(true);
      expect(adapter.validateRequest(requestWithAttachments)).toBe(true);
      expect(adapter.validateRequest(requestWithTools)).toBe(true);
    });
  });
});

