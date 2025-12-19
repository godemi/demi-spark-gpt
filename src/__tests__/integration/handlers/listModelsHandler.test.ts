import { describe, it, expect } from "vitest";
import { listModelsHandler } from "../../../handlers/listModelsHandler";
import {
  createMockHttpRequest,
  createMockInvocationContext,
} from "../../helpers/mock-azure-functions";

describe("listModelsHandler", () => {
  it("should return list of all models", async () => {
    const request = createMockHttpRequest({}, "GET");
    const context = createMockInvocationContext();
    const response = await listModelsHandler(request, context);

    expect(response.status).toBe(200);
    const body = JSON.parse(response.body as string);
    expect(body.object).toBe("list");
    expect(body.data).toBeDefined();
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBeGreaterThan(0);
  });

  it("should include model capabilities", async () => {
    const request = createMockHttpRequest({}, "GET");
    const context = createMockInvocationContext();
    const response = await listModelsHandler(request, context);

    const body = JSON.parse(response.body as string);
    const firstModel = body.data[0];
    expect(firstModel).toHaveProperty("id");
    expect(firstModel).toHaveProperty("object", "model");
    expect(firstModel).toHaveProperty("capabilities");
    expect(firstModel.capabilities).toHaveProperty("chat");
    expect(firstModel.capabilities).toHaveProperty("vision");
  });

  it("should filter by provider when specified", async () => {
    const request = createMockHttpRequest({}, "GET");
    request.query.set("provider", "azure-openai");
    const context = createMockInvocationContext();
    const response = await listModelsHandler(request, context);

    expect(response.status).toBe(200);
    const body = JSON.parse(response.body as string);
    expect(body.data).toBeDefined();
  });
});
