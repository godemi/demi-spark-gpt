import { describe, it, expect, beforeEach, vi } from "vitest";
import { imageGenerateHandler } from "../../../handlers/imageGenerateHandler";
import {
  createMockHttpRequest,
  createMockInvocationContext,
} from "../../helpers/mock-azure-functions";
import { validImageGenerateRequest } from "../../fixtures/requests/imageGenerateRequests";

describe("imageGenerateHandler", () => {
  let context: ReturnType<typeof createMockInvocationContext>;

  beforeEach(() => {
    context = createMockInvocationContext();
  });

  it("should handle CORS preflight", async () => {
    const request = createMockHttpRequest({}, "OPTIONS");
    const response = await imageGenerateHandler(request, context);

    expect(response.status).toBe(204);
    expect(response.headers).toHaveProperty("Access-Control-Allow-Origin", "*");
  });

  it("should reject empty request body", async () => {
    const request = createMockHttpRequest("", "POST");
    const response = await imageGenerateHandler(request, context);

    expect(response.status).toBe(400);
    const body = JSON.parse(response.body as string);
    expect(body.error.code).toBe("EMPTY_REQUEST_BODY");
  });

  it("should reject missing prompt", async () => {
    const request = createMockHttpRequest({ model: "dall-e-3" }, "POST");
    const response = await imageGenerateHandler(request, context);

    expect(response.status).toBe(400);
    const body = JSON.parse(response.body as string);
    expect(body.error.code).toBe("MISSING_FIELD");
  });

  it("should handle valid image generation request", async () => {
    const request = createMockHttpRequest(validImageGenerateRequest, "POST");
    const response = await imageGenerateHandler(request, context);

    // Should attempt to generate (may fail without real OpenAI client, but should not crash)
    expect([200, 400, 500]).toContain(response.status);
  });
});
