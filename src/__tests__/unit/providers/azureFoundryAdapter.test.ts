import { describe, it, expect, beforeEach } from "vitest";
import { AzureFoundryAdapter } from "../../../providers/azureFoundryAdapter";
import { ProviderConfig } from "../../../providers/types";
import { createMockProviderConfig } from "../../helpers/mock-providers";
import {
  validChatRequest,
  requestWithAttachments,
} from "../../fixtures/requests/chatCompletionRequests";

describe("AzureFoundryAdapter", () => {
  let adapter: AzureFoundryAdapter;
  let config: ProviderConfig;

  beforeEach(() => {
    adapter = new AzureFoundryAdapter();
    config = {
      provider: "azure-ai-foundry",
      endpoint: "https://foundry.ai.azure.com",
      deployment: "llama-3-70b",
      apiKey: "test-key",
      apiVersion: "2023-12-01-preview",
      authType: "api-key",
    };
  });

  describe("name", () => {
    it("should have correct name", () => {
      expect(adapter.name).toBe("azure-ai-foundry");
    });
  });

  describe("buildRequest", () => {
    it("should build request with minimal parameters", async () => {
      const request = await adapter.buildRequest(validChatRequest, config);

      expect(request.model).toBeDefined();
      expect(request.messages).toBeDefined();
      expect(request.stream).toBe(false);
    });

    it("should include standard parameters", async () => {
      const fullRequest = {
        ...validChatRequest,
        temperature: 0.7,
        top_p: 0.95,
        max_tokens: 1000,
        tools: [
          {
            type: "function",
            function: {
              name: "test",
              parameters: { type: "object", properties: {} },
            },
          },
        ],
      };

      const request = await adapter.buildRequest(fullRequest, config);

      expect(request.temperature).toBe(0.7);
      expect(request.top_p).toBe(0.95);
      expect(request.max_tokens).toBe(1000);
      expect(request.tools).toBeDefined();
    });

    it("should normalize messages with attachments", async () => {
      const request = await adapter.buildRequest(requestWithAttachments, config);

      expect(request.messages).toBeDefined();
    });

    it("should use deployment as model", async () => {
      const request = await adapter.buildRequest(validChatRequest, config);
      expect(request.model).toBe(config.deployment || config.model || validChatRequest.model);
    });
  });

  describe("getCapabilities", () => {
    it("should return capabilities for OSS models", () => {
      const caps = adapter.getCapabilities("llama-3-70b");
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
    });
  });
});
