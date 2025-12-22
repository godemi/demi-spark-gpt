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

describe("chatCompletionsHandler", () => {
  let context: ReturnType<typeof createMockInvocationContext>;
  let mockAdapter: ReturnType<typeof createMockProviderAdapter>;

  beforeEach(() => {
    context = createMockInvocationContext();
    mockAdapter = createMockProviderAdapter();
    vi.mocked(getProviderAdapter).mockReturnValue(mockAdapter);
  });

  describe("CORS preflight", () => {
    it("should handle OPTIONS request", async () => {
      const request = createMockHttpRequest({}, "OPTIONS");
      const response = await chatCompletionsHandler(request, context);

      expect(response.status).toBe(204);
      expect(response.headers).toHaveProperty("Access-Control-Allow-Origin", "*");
    });
  });

  describe("Request validation", () => {
    it("should reject empty request body", async () => {
      const request = createMockHttpRequest("", "POST");
      const response = await chatCompletionsHandler(request, context);

      expect(response.status).toBe(400);
      const body = JSON.parse(response.body as string);
      expect(body.error.code).toBe("EMPTY_REQUEST_BODY");
    });

    it("should reject invalid JSON", async () => {
      const request = createMockHttpRequest("invalid json", "POST");
      const response = await chatCompletionsHandler(request, context);

      expect(response.status).toBe(400);
      const body = JSON.parse(response.body as string);
      expect(body.error.code).toBeDefined();
    });

    it("should reject invalid request schema", async () => {
      const invalidRequest = { model: "gpt-4o" }; // Missing messages
      const request = createMockHttpRequest(invalidRequest, "POST");
      const response = await chatCompletionsHandler(request, context);

      expect(response.status).toBe(400);
      const body = JSON.parse(response.body as string);
      expect(body.error.code).toBe("INVALID_PARAMETERS");
    });

    it("should reject unknown provider", async () => {
      const requestData = {
        ...validChatRequest,
        provider: "unknown-provider",
      };
      const request = createMockHttpRequest(requestData, "POST");
      vi.mocked(getProviderAdapter).mockReturnValue(null);

      const response = await chatCompletionsHandler(request, context);

      expect(response.status).toBe(400);
      const body = JSON.parse(response.body as string);
      expect(body.error.code).toBe("UNKNOWN_PROVIDER");
    });

    it("should reject unknown model", async () => {
      const requestData = {
        ...validChatRequest,
        model: "unknown-model",
      };
      const request = createMockHttpRequest(requestData, "POST");
      mockAdapter.getCapabilities.mockReturnValue(null);

      const response = await chatCompletionsHandler(request, context);

      expect(response.status).toBe(400);
      const body = JSON.parse(response.body as string);
      expect(body.error.code).toBe("UNKNOWN_MODEL");
    });
  });

  describe("Non-streaming requests", () => {
    it("should handle valid non-streaming request", async () => {
      const request = createMockHttpRequest(validChatRequest, "POST");
      const response = await chatCompletionsHandler(request, context);

      expect(response.status).toBe(200);
      const body = JSON.parse(response.body as string);
      expect(body.request_id).toBeDefined();
      expect(body.provider).toBe("azure-openai");
      expect(mockAdapter.executeJson).toHaveBeenCalled();
    });

    it("should include HALO extensions in response", async () => {
      const request = createMockHttpRequest(validChatRequest, "POST");
      const response = await chatCompletionsHandler(request, context);

      const body = JSON.parse(response.body as string);
      expect(body.request_id).toBeDefined();
      expect(body.provider).toBeDefined();
      expect(body.latency_ms).toBeGreaterThanOrEqual(0);
    });

    it("should handle provider errors", async () => {
      const request = createMockHttpRequest(validChatRequest, "POST");
      const error = new Error("Provider error");
      mockAdapter.executeJson.mockRejectedValue(error);

      const response = await chatCompletionsHandler(request, context);

      expect(response.status).toBe(500);
      const body = JSON.parse(response.body as string);
      expect(body.error).toBeDefined();
    });
  });

  describe("Streaming requests", () => {
    it("should handle valid streaming request", async () => {
      const request = createMockHttpRequest(streamingRequest, "POST");
      const response = await chatCompletionsHandler(request, context);

      expect(response.status).toBe(200);
      expect(response.headers).toHaveProperty("Content-Type", "text/event-stream");
      expect(response.headers).toHaveProperty("Cache-Control", "no-cache");
      expect(response.body).toBeInstanceOf(ReadableStream);
      expect(mockAdapter.executeStream).toHaveBeenCalled();
    });
  });

  describe("Attachment handling", () => {
    it("should process requests with attachments", async () => {
      const request = createMockHttpRequest(requestWithAttachments, "POST");
      const response = await chatCompletionsHandler(request, context);

      expect(response.status).toBe(200);
      expect(mockAdapter.buildRequest).toHaveBeenCalled();
    });

    it("should reject attachments for non-vision models", async () => {
      const request = createMockHttpRequest(requestWithAttachments, "POST");
      mockAdapter.getCapabilities.mockReturnValue({
        chat: true,
        vision: false,
        image_generate: false,
        tool_calls: false,
        json_mode: false,
        reasoning: false,
        max_context_tokens: 4096,
        max_output_tokens: 2048,
        supports_streaming: true,
      });

      const response = await chatCompletionsHandler(request, context);

      expect(response.status).toBe(400);
      const body = JSON.parse(response.body as string);
      expect(body.error.code).toBe("CAPABILITY_NOT_SUPPORTED");
    });
  });

  describe("Tool calling", () => {
    it("should handle requests with tools", async () => {
      const request = createMockHttpRequest(requestWithTools, "POST");
      const response = await chatCompletionsHandler(request, context);

      expect(response.status).toBe(200);
      expect(mockAdapter.buildRequest).toHaveBeenCalled();
    });

    it("should reject tools for non-tool-capable models", async () => {
      const request = createMockHttpRequest(requestWithTools, "POST");
      mockAdapter.getCapabilities.mockReturnValue({
        chat: true,
        vision: false,
        image_generate: false,
        tool_calls: false,
        json_mode: false,
        reasoning: false,
        max_context_tokens: 4096,
        max_output_tokens: 2048,
        supports_streaming: true,
      });

      const response = await chatCompletionsHandler(request, context);

      expect(response.status).toBe(400);
      const body = JSON.parse(response.body as string);
      expect(body.error.code).toBe("CAPABILITY_NOT_SUPPORTED");
    });
  });

  describe("Guardrails", () => {
    it("should apply guardrails when enabled", async () => {
      const request = createMockHttpRequest(requestWithGuardrails, "POST");
      const response = await chatCompletionsHandler(request, context);

      expect(response.status).toBe(200);
      // Guardrails should be applied before building request
      expect(mockAdapter.buildRequest).toHaveBeenCalled();
    });
  });

  describe("Multi-provider routing", () => {
    it("should route to Azure OpenAI by default", async () => {
      const request = createMockHttpRequest(validChatRequest, "POST");
      await chatCompletionsHandler(request, context);

      expect(getProviderAdapter).toHaveBeenCalledWith("azure-openai");
    });

    it("should route to specified provider", async () => {
      const requestData = {
        ...validChatRequest,
        provider: "openai",
      };
      const request = createMockHttpRequest(requestData, "POST");
      await chatCompletionsHandler(request, context);

      expect(getProviderAdapter).toHaveBeenCalledWith("openai");
    });
  });

  describe("Task profile integration", () => {
    it("should resolve task_profile to model", async () => {
      const requestData = {
        ...validChatRequest,
        model: undefined,
        task_profile: "fast",
      };
      const request = createMockHttpRequest(requestData, "POST");
      mockAdapter.getCapabilities.mockReturnValue({
        chat: true,
        vision: true,
        image_generate: false,
        tool_calls: true,
        json_mode: true,
        reasoning: true,
        max_context_tokens: 128000,
        max_output_tokens: 16384,
        supports_streaming: true,
      });

      const response = await chatCompletionsHandler(request, context);

      expect(response.status).toBe(200);
      expect(mockAdapter.buildRequest).toHaveBeenCalled();
      // Verify that the resolved model was used
      const buildRequestCall = mockAdapter.buildRequest.mock.calls[0];
      expect(buildRequestCall[0].model).toBe("gpt-5-nano");
    });

    it("should prioritize direct model over task_profile", async () => {
      const requestData = {
        ...validChatRequest,
        model: "gpt-5.2",
        task_profile: "fast",
      };
      const request = createMockHttpRequest(requestData, "POST");
      mockAdapter.getCapabilities.mockReturnValue({
        chat: true,
        vision: true,
        image_generate: false,
        tool_calls: true,
        json_mode: true,
        reasoning: true,
        max_context_tokens: 128000,
        max_output_tokens: 16384,
        supports_streaming: true,
      });

      const response = await chatCompletionsHandler(request, context);

      expect(response.status).toBe(200);
      const buildRequestCall = mockAdapter.buildRequest.mock.calls[0];
      expect(buildRequestCall[0].model).toBe("gpt-5.2");
    });

    it("should reject invalid task_profile", async () => {
      const requestData = {
        ...validChatRequest,
        model: undefined,
        task_profile: "invalid-profile",
      };
      const request = createMockHttpRequest(requestData, "POST");

      const response = await chatCompletionsHandler(request, context);

      expect(response.status).toBe(400);
      const body = JSON.parse(response.body as string);
      expect(body.error.code).toBe("INVALID_TASK_PROFILE");
    });

    it("should apply reasoning_effort from task_profile", async () => {
      const requestData = {
        ...validChatRequest,
        model: undefined,
        task_profile: "reasoning",
      };
      const request = createMockHttpRequest(requestData, "POST");
      mockAdapter.getCapabilities.mockReturnValue({
        chat: true,
        vision: true,
        image_generate: false,
        tool_calls: true,
        json_mode: true,
        reasoning: true,
        max_context_tokens: 128000,
        max_output_tokens: 16384,
        supports_streaming: true,
      });

      const response = await chatCompletionsHandler(request, context);

      expect(response.status).toBe(200);
      const buildRequestCall = mockAdapter.buildRequest.mock.calls[0];
      expect(buildRequestCall[0].reasoning_effort).toBe("high");
      expect(buildRequestCall[0].model).toBe("gpt-5.2");
    });

    it("should not override explicit reasoning_effort when using task_profile", async () => {
      const requestData = {
        ...validChatRequest,
        model: undefined,
        task_profile: "reasoning",
        reasoning_effort: "low",
      };
      const request = createMockHttpRequest(requestData, "POST");
      mockAdapter.getCapabilities.mockReturnValue({
        chat: true,
        vision: true,
        image_generate: false,
        tool_calls: true,
        json_mode: true,
        reasoning: true,
        max_context_tokens: 128000,
        max_output_tokens: 16384,
        supports_streaming: true,
      });

      const response = await chatCompletionsHandler(request, context);

      expect(response.status).toBe(200);
      const buildRequestCall = mockAdapter.buildRequest.mock.calls[0];
      // Explicit reasoning_effort should take precedence
      expect(buildRequestCall[0].reasoning_effort).toBe("low");
    });
  });

  describe("Error handling", () => {
    it("should handle configuration errors", async () => {
      const request = createMockHttpRequest(validChatRequest, "POST");
      // Simulate config error by making getProviderAdapter return null
      vi.mocked(getProviderAdapter).mockReturnValue(null);

      const response = await chatCompletionsHandler(request, context);

      expect(response.status).toBe(400);
      const body = JSON.parse(response.body as string);
      expect(body.error).toBeDefined();
    });
  });
});
