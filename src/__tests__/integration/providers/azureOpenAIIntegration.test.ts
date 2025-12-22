import { describe, it, expect, beforeEach } from "vitest";
import { AzureOpenAIAdapter } from "../../../providers/azureOpenAIAdapter";
import { ProviderConfig } from "../../../providers/types";
import { validChatRequest } from "../../fixtures/requests/chatCompletionRequests";
import { createMockProviderConfig } from "../../helpers/mock-providers";

/**
 * Integration tests for Azure OpenAI adapter
 * Uses MSW to mock HTTP requests
 */
describe("AzureOpenAIAdapter Integration", () => {
  let adapter: AzureOpenAIAdapter;
  let config: ProviderConfig;

  beforeEach(() => {
    adapter = new AzureOpenAIAdapter();
    config = createMockProviderConfig();
  });

  describe("buildRequest", () => {
    it("should build valid request for Azure OpenAI", async () => {
      const request = await adapter.buildRequest(validChatRequest, config);

      expect(request.model).toBeDefined();
      expect(request.messages).toBeDefined();
      expect(request.stream).toBe(false);
    });
  });

  describe("getCapabilities", () => {
    it("should return capabilities for known models", () => {
      const caps = adapter.getCapabilities("gpt-4o");
      expect(caps).toBeDefined();
      expect(caps?.chat).toBe(true);
    });
  });

  describe("validateRequest", () => {
    it("should validate all request types", () => {
      expect(adapter.validateRequest(validChatRequest)).toBe(true);
    });
  });
});

