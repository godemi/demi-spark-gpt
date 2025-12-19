import { describe, it, expect, beforeEach } from "vitest";
import { AzureFoundryAdapter } from "../../../providers/azureFoundryAdapter";
import { ProviderConfig } from "../../../providers/types";
import { validChatRequest } from "../../fixtures/requests/chatCompletionRequests";

describe("AzureFoundryAdapter Integration", () => {
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

  describe("buildRequest", () => {
    it("should build valid request for Azure Foundry", async () => {
      const request = await adapter.buildRequest(validChatRequest, config);

      expect(request.model).toBeDefined();
      expect(request.messages).toBeDefined();
    });
  });

  describe("getCapabilities", () => {
    it("should return capabilities for OSS models", () => {
      const caps = adapter.getCapabilities("llama-3-70b");
      expect(caps).toBeDefined();
      expect(caps?.chat).toBe(true);
    });
  });
});
