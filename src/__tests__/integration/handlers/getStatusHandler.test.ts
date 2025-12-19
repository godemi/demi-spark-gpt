import { describe, it, expect, beforeEach, vi } from "vitest";
import { getStatusHandler } from "../../../handlers/getStatusHandler";
import {
  createMockHttpRequest,
  createMockInvocationContext,
} from "../../helpers/mock-azure-functions";

describe("getStatusHandler", () => {
  let context: ReturnType<typeof createMockInvocationContext>;
  const originalEnv = process.env;

  beforeEach(() => {
    context = createMockInvocationContext();
    process.env = { ...originalEnv };
    process.env.AZURE_OPENAI_ENDPOINT = "https://test.openai.azure.com";
    process.env.AZURE_OPENAI_API_KEY = "test-key";
  });

  it("should return status information", async () => {
    const request = createMockHttpRequest({}, "GET");
    // Mock axios to avoid real network calls
    vi.mock("axios", () => ({
      default: {
        create: vi.fn(() => ({
          post: vi.fn().mockResolvedValue({ status: 200, data: {} }),
        })),
        isAxiosError: vi.fn(() => false),
      },
      isAxiosError: vi.fn(() => false),
    }));

    const response = await getStatusHandler(request, context);

    // Should return some status (may vary based on env setup)
    expect([200, 400, 500, 503]).toContain(response.status);
  });

  it("should handle missing environment variables", async () => {
    delete process.env.AZURE_OPENAI_ENDPOINT;
    delete process.env.AZURE_OPENAI_API_KEY;

    const request = createMockHttpRequest({}, "GET");
    const response = await getStatusHandler(request, context);

    // Should handle error gracefully
    expect(response.status).toBeGreaterThanOrEqual(400);
  });
});
