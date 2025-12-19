import { describe, it, expect } from "vitest";
import {
  addCorsHeaders,
  createJsonResponseContent,
  getHttpResponseInitJson,
} from "../../../utils/httpJsonResponse";

/**
 * Unit tests for HTTP JSON response utilities
 */
describe("addCorsHeaders", () => {
  it("should add CORS headers to empty headers object", () => {
    const headers = addCorsHeaders();

    expect(headers).toHaveProperty("Access-Control-Allow-Origin", "*");
    expect(headers).toHaveProperty("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    expect(headers).toHaveProperty("Access-Control-Allow-Headers", "Content-Type, Authorization");
    expect(headers).toHaveProperty("Access-Control-Max-Age", "86400");
  });

  it("should merge CORS headers with existing headers", () => {
    const existingHeaders = {
      "Content-Type": "application/json",
      "X-Custom-Header": "custom-value",
    };

    const headers = addCorsHeaders(existingHeaders);

    expect(headers).toHaveProperty("Content-Type", "application/json");
    expect(headers).toHaveProperty("X-Custom-Header", "custom-value");
    expect(headers).toHaveProperty("Access-Control-Allow-Origin", "*");
    expect(headers).toHaveProperty("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  });

  it("should override existing headers with CORS headers if conflict", () => {
    const existingHeaders = {
      "Access-Control-Allow-Origin": "https://example.com",
    };

    const headers = addCorsHeaders(existingHeaders);

    // CORS headers should take precedence
    expect(headers["Access-Control-Allow-Origin"]).toBe("*");
  });

  it("should preserve all CORS headers", () => {
    const headers = addCorsHeaders();

    const corsHeaderKeys = [
      "Access-Control-Allow-Origin",
      "Access-Control-Allow-Methods",
      "Access-Control-Allow-Headers",
      "Access-Control-Max-Age",
    ];

    for (const key of corsHeaderKeys) {
      expect(headers).toHaveProperty(key);
    }
  });
});

describe("createJsonResponseContent", () => {
  it("should create response with all fields", () => {
    const startTime = Date.now() - 100; // 100ms ago
    const response = { result: "success" };
    const payload = { input: "test" };
    const headers = { "Content-Type": "application/json" };
    const parameters = { temperature: 0.7 };

    const result = createJsonResponseContent(
      startTime,
      response,
      null,
      payload,
      headers,
      parameters
    );

    expect(result.status).toBe(200);
    expect(result.body).toHaveProperty("version");
    expect(result.body).toHaveProperty("time");
    expect(result.body).toHaveProperty("response", response);
    expect(result.body).toHaveProperty("payload", payload);
    expect(result.body).toHaveProperty("headers", headers);
    expect(result.body).toHaveProperty("parameters", parameters);
    expect(result.body.time).toBeGreaterThanOrEqual(100);
    expect(result.headers).toHaveProperty("Content-Type", "application/json");
    expect(result.headers).toHaveProperty("Access-Control-Allow-Origin", "*");
  });

  it("should use errorResponse when response is null", () => {
    const startTime = Date.now();
    const errorResponse = { error: "Something went wrong" };

    const result = createJsonResponseContent(startTime, null, errorResponse, {}, {}, {});

    expect(result.body.response).toEqual(errorResponse);
  });

  it("should filter out pre_prompts from parameters", () => {
    const startTime = Date.now();
    const parameters = {
      temperature: 0.7,
      pre_prompts: ["prompt1", "prompt2"],
      max_tokens: 100,
    };

    const result = createJsonResponseContent(startTime, {}, null, {}, {}, parameters);

    expect(result.body.parameters).not.toHaveProperty("pre_prompts");
    expect(result.body.parameters).toHaveProperty("temperature", 0.7);
    expect(result.body.parameters).toHaveProperty("max_tokens", 100);
  });

  it("should calculate time elapsed correctly", () => {
    const startTime = Date.now() - 500; // 500ms ago

    const result = createJsonResponseContent(startTime, {}, null, {}, {}, {});

    expect(result.body.time).toBeGreaterThanOrEqual(500);
    expect(result.body.time).toBeLessThan(600); // Allow some margin
  });

  it("should include CORS headers in response", () => {
    const result = createJsonResponseContent(Date.now(), {}, null, {}, {}, {});

    expect(result.headers).toHaveProperty("Access-Control-Allow-Origin");
    expect(result.headers).toHaveProperty("Access-Control-Allow-Methods");
  });
});

describe("getHttpResponseInitJson", () => {
  it("should create HTTP response with status code and body", () => {
    const body = { message: "Success" };
    const result = getHttpResponseInitJson(200, body);

    expect(result.status).toBe(200);
    expect(result.body).toBe(JSON.stringify(body, null, 2));
    expect(result.headers).toHaveProperty("Content-Type", "application/json");
    expect(result.headers).toHaveProperty("Access-Control-Allow-Origin", "*");
  });

  it("should handle different status codes", () => {
    const statusCodes = [200, 201, 400, 401, 404, 500];

    for (const statusCode of statusCodes) {
      const result = getHttpResponseInitJson(statusCode, {});
      expect(result.status).toBe(statusCode);
    }
  });

  it("should stringify body with proper formatting", () => {
    const body = { key: "value", nested: { prop: "test" } };
    const result = getHttpResponseInitJson(200, body);

    expect(result.body).toBe(JSON.stringify(body, null, 2));
    expect(result.body).toContain("\n"); // Should be formatted with newlines
  });

  it("should include CORS headers", () => {
    const result = getHttpResponseInitJson(200, {});

    expect(result.headers).toHaveProperty("Access-Control-Allow-Origin", "*");
    expect(result.headers).toHaveProperty("Access-Control-Allow-Methods");
    expect(result.headers).toHaveProperty("Content-Type", "application/json");
  });

  it("should handle complex nested objects", () => {
    const body = {
      data: {
        items: [
          { id: 1, name: "Item 1" },
          { id: 2, name: "Item 2" },
        ],
        metadata: {
          count: 2,
          timestamp: new Date().toISOString(),
        },
      },
    };

    const result = getHttpResponseInitJson(200, body);
    const parsed = JSON.parse(result.body);

    expect(parsed).toEqual(body);
  });

  it("should handle null and undefined in body", () => {
    const body = { value: null, missing: undefined };
    const result = getHttpResponseInitJson(200, body);

    const parsed = JSON.parse(result.body);
    expect(parsed.value).toBeNull();
    expect(parsed).not.toHaveProperty("missing");
  });

  it("should handle arrays in body", () => {
    const body = { items: [1, 2, 3] };
    const result = getHttpResponseInitJson(200, body);

    const parsed = JSON.parse(result.body);
    expect(parsed.items).toEqual([1, 2, 3]);
  });
});
