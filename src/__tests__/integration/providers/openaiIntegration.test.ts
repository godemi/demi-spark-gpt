import { describe, it, expect, beforeEach } from "vitest";
import { OpenAIAdapter } from "../../../providers/openaiAdapter";
import { ProviderConfig } from "../../../providers/types";
import { validChatRequest } from "../../fixtures/requests/chatCompletionRequests";

describe("OpenAIAdapter Integration", () => {
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
    };
  });

  describe("buildRequest", () => {
    it("should build valid request for OpenAI", async () => {
      const request = await adapter.buildRequest(validChatRequest, config);

      expect(request.model).toBe(validChatRequest.model);
      expect(request.messages).toBeDefined();
    });
  });

  describe("getCapabilities", () => {
    it("should return capabilities for known models", () => {
      const caps = adapter.getCapabilities("gpt-4o");
      expect(caps).toBeDefined();
    });
  });
});
