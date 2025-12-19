import { describe, it, expect, beforeEach, vi } from "vitest";
import { chatCompletionsHandler } from "../../../handlers/chatCompletionsHandler";
import {
  createMockHttpRequest,
  createMockInvocationContext,
} from "../../helpers/mock-azure-functions";
import { createMockProviderAdapter } from "../../helpers/mock-providers";
import { getProviderAdapter } from "../../../providers";
import {
  validChatRequest,
  requestWithAttachments,
  requestWithTools,
  requestWithGuardrails,
  streamingRequest,
} from "../../fixtures/requests/chatCompletionRequests";

vi.mock("../../../providers", () => ({
  getProviderAdapter: vi.fn(),
}));

/**
 * End-to-end tests for complete request flow
 */
describe("Chat Completions E2E", () => {
  let context: ReturnType<typeof createMockInvocationContext>;
  let mockAdapter: ReturnType<typeof createMockProviderAdapter>;

  beforeEach(() => {
    context = createMockInvocationContext();
    mockAdapter = createMockProviderAdapter();
    vi.mocked(getProviderAdapter).mockReturnValue(mockAdapter);
  });

  describe("Complete request flow", () => {
    it("should handle complete non-streaming request flow", async () => {
      const request = createMockHttpRequest(validChatRequest, "POST");
      const response = await chatCompletionsHandler(request, context);

      expect(response.status).toBe(200);
      expect(mockAdapter.buildRequest).toHaveBeenCalled();
      expect(mockAdapter.executeJson).toHaveBeenCalled();

      const body = JSON.parse(response.body as string);
      expect(body.request_id).toBeDefined();
      expect(body.provider).toBeDefined();
    });

    it("should handle complete streaming request flow", async () => {
      const request = createMockHttpRequest(streamingRequest, "POST");
      const response = await chatCompletionsHandler(request, context);

      expect(response.status).toBe(200);
      expect(response.headers["Content-Type"]).toBe("text/event-stream");
      expect(mockAdapter.executeStream).toHaveBeenCalled();
    });

    it("should handle request with attachments end-to-end", async () => {
      const request = createMockHttpRequest(requestWithAttachments, "POST");
      const response = await chatCompletionsHandler(request, context);

      expect(response.status).toBe(200);
      expect(mockAdapter.buildRequest).toHaveBeenCalled();
    });

    it("should handle request with tools end-to-end", async () => {
      const request = createMockHttpRequest(requestWithTools, "POST");
      const response = await chatCompletionsHandler(request, context);

      expect(response.status).toBe(200);
      expect(mockAdapter.buildRequest).toHaveBeenCalled();
    });

    it("should handle request with guardrails end-to-end", async () => {
      const request = createMockHttpRequest(requestWithGuardrails, "POST");
      const response = await chatCompletionsHandler(request, context);

      expect(response.status).toBe(200);
      expect(mockAdapter.buildRequest).toHaveBeenCalled();
    });
  });

  describe("Error recovery", () => {
    it("should handle provider errors gracefully", async () => {
      const request = createMockHttpRequest(validChatRequest, "POST");
      mockAdapter.executeJson.mockRejectedValue(new Error("Provider error"));

      const response = await chatCompletionsHandler(request, context);

      expect(response.status).toBe(500);
      const body = JSON.parse(response.body as string);
      expect(body.error).toBeDefined();
    });

    it("should handle validation errors gracefully", async () => {
      const invalidRequest = { model: "gpt-4o" }; // Missing messages
      const request = createMockHttpRequest(invalidRequest, "POST");

      const response = await chatCompletionsHandler(request, context);

      expect(response.status).toBe(400);
      const body = JSON.parse(response.body as string);
      expect(body.error.code).toBe("INVALID_PARAMETERS");
    });
  });

  describe("Multi-provider scenarios", () => {
    it("should route to correct provider", async () => {
      const requestData = {
        ...validChatRequest,
        provider: "openai",
      };
      const request = createMockHttpRequest(requestData, "POST");

      await chatCompletionsHandler(request, context);

      expect(getProviderAdapter).toHaveBeenCalledWith("openai");
    });
  });
});
