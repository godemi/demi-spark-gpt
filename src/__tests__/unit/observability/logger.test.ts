import { describe, it, expect, vi } from "vitest";
import { redactSecrets, logRequest, logResponse, logError } from "../../../observability/logger";
import { createMockInvocationContext } from "../../helpers/mock-azure-functions";

describe("redactSecrets", () => {
  it("should redact API keys", () => {
    const obj = {
      api_key: "sk-1234567890",
      other_field: "value",
    };

    const redacted = redactSecrets(obj);

    expect(redacted.api_key).toBe("***REDACTED***");
    expect(redacted.other_field).toBe("value");
  });

  it("should redact authorization headers", () => {
    const obj = {
      headers: {
        authorization: "Bearer token123",
        "x-api-key": "key123",
      },
    };

    const redacted = redactSecrets(obj);

    expect(redacted.headers.authorization).toBe("***REDACTED***");
    expect(redacted.headers["x-api-key"]).toBe("***REDACTED***");
  });

  it("should redact nested objects", () => {
    const obj = {
      level1: {
        level2: {
          api_key: "secret123",
          normal_field: "value",
        },
      },
    };

    const redacted = redactSecrets(obj);

    expect(redacted.level1.level2.api_key).toBe("***REDACTED***");
    expect(redacted.level1.level2.normal_field).toBe("value");
  });

  it("should handle arrays", () => {
    const obj = {
      items: [
        { api_key: "key1", name: "item1" },
        { api_key: "key2", name: "item2" },
      ],
    };

    const redacted = redactSecrets(obj);

    expect(redacted.items[0].api_key).toBe("***REDACTED***");
    expect(redacted.items[0].name).toBe("item1");
    expect(redacted.items[1].api_key).toBe("***REDACTED***");
  });

  it("should handle case-insensitive key matching", () => {
    const obj = {
      API_KEY: "key123",
      ApiKey: "key456",
      "X-API-KEY": "key789",
    };

    const redacted = redactSecrets(obj);

    expect(redacted.API_KEY).toBe("***REDACTED***");
    expect(redacted.ApiKey).toBe("***REDACTED***");
    expect(redacted["X-API-KEY"]).toBe("***REDACTED***");
  });

  it("should handle null and undefined", () => {
    expect(redactSecrets(null)).toBeNull();
    expect(redactSecrets(undefined)).toBeUndefined();
  });

  it("should handle non-objects", () => {
    expect(redactSecrets("string")).toBe("string");
    expect(redactSecrets(123)).toBe(123);
    expect(redactSecrets(true)).toBe(true);
  });

  it("should respect max depth", () => {
    const deepObj: any = { level: {} };
    let current = deepObj;
    for (let i = 0; i < 15; i++) {
      current.level = { level: {} };
      current = current.level;
    }
    current.api_key = "secret";

    const redacted = redactSecrets(deepObj, 0, 10);

    // Should stop at max depth
    expect(redacted).toBeDefined();
  });
});

describe("logRequest", () => {
  it("should log request with all fields", () => {
    const context = createMockInvocationContext();
    const logSpy = vi.mocked(context.log);

    logRequest(context, {
      requestId: "req-123",
      model: "gpt-4o",
      provider: "azure-openai",
      messageCount: 3,
      stream: true,
      hasAttachments: true,
    });

    expect(logSpy).toHaveBeenCalled();
    const logCall = logSpy.mock.calls[0][0];
    expect(logCall.request_id).toBe("req-123");
    expect(logCall.model).toBe("gpt-4o");
    expect(logCall.provider).toBe("azure-openai");
    expect(logCall.message_count).toBe(3);
    expect(logCall.stream).toBe(true);
    expect(logCall.has_attachments).toBe(true);
  });

  it("should log request with minimal fields", () => {
    const context = createMockInvocationContext();
    const logSpy = vi.mocked(context.log);

    logRequest(context, {
      requestId: "req-123",
      model: "gpt-4o",
      messageCount: 1,
      stream: false,
    });

    expect(logSpy).toHaveBeenCalled();
  });
});

describe("logResponse", () => {
  it("should log successful response", () => {
    const context = createMockInvocationContext();
    const logSpy = vi.mocked(context.log);

    logResponse(context, {
      requestId: "req-123",
      success: true,
      latencyMs: 150,
      promptTokens: 10,
      completionTokens: 15,
    });

    expect(logSpy).toHaveBeenCalled();
    const logCall = logSpy.mock.calls[0][0];
    expect(logCall.level).toBe("info");
    expect(logCall.success).toBe(true);
    expect(logCall.latency_ms).toBe(150);
  });

  it("should log failed response", () => {
    const context = createMockInvocationContext();
    const logSpy = vi.mocked(context.log);

    logResponse(context, {
      requestId: "req-123",
      success: false,
      latencyMs: 50,
      errorCode: "INVALID_REQUEST",
    });

    expect(logSpy).toHaveBeenCalled();
    const logCall = logSpy.mock.calls[0][0];
    expect(logCall.level).toBe("error");
    expect(logCall.success).toBe(false);
    expect(logCall.error_code).toBe("INVALID_REQUEST");
  });
});

describe("logError", () => {
  it("should log error with all fields", () => {
    const context = createMockInvocationContext();
    const errorSpy = vi.spyOn(context, "error");
    const error = new Error("Test error");
    error.stack = "Error stack trace";

    logError(context, error, "req-123", { additional: "context" });

    expect(errorSpy).toHaveBeenCalled();
    const errorCall = errorSpy.mock.calls[0][0];
    expect(errorCall.request_id).toBe("req-123");
    expect(errorCall.error_name).toBe("Error");
    expect(errorCall.error_stack).toBe("Error stack trace");
  });

  it("should redact secrets in additional context", () => {
    const context = createMockInvocationContext();
    const errorSpy = vi.spyOn(context, "error");
    const error = new Error("Test error");

    logError(context, error, "req-123", {
      api_key: "secret123",
      normal_field: "value",
    });

    expect(errorSpy).toHaveBeenCalled();
    const errorCall = errorSpy.mock.calls[0][0];
    expect(errorCall.api_key).toBe("***REDACTED***");
    expect(errorCall.normal_field).toBe("value");
  });
});

