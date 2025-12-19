import { describe, it, expect } from "vitest";
import { APIException, ProviderError, HALOError } from "../../../utils/exceptions";

/**
 * Unit tests for APIException and error handling
 */
describe("APIException", () => {
  describe("Constructor", () => {
    it("should create an APIException with all fields", () => {
      const providerError: ProviderError = {
        code: "provider_error",
        message: "Provider error message",
        type: "invalid_request_error",
        param: "model",
        status: 400,
      };

      const exception = new APIException(
        "Test error message",
        400,
        "TEST_ERROR",
        providerError,
        "req-123"
      );

      expect(exception.message).toBe("Test error message");
      expect(exception.statusCode).toBe(400);
      expect(exception.errorCode).toBe("TEST_ERROR");
      expect(exception.providerError).toEqual(providerError);
      expect(exception.requestId).toBe("req-123");
    });

    it("should create an APIException without optional fields", () => {
      const exception = new APIException("Test error", 500, "INTERNAL_ERROR");

      expect(exception.message).toBe("Test error");
      expect(exception.statusCode).toBe(500);
      expect(exception.errorCode).toBe("INTERNAL_ERROR");
      expect(exception.providerError).toBeUndefined();
      expect(exception.requestId).toBeUndefined();
    });

    it("should be an instance of Error", () => {
      const exception = new APIException("Test", 400, "TEST");
      expect(exception).toBeInstanceOf(Error);
      expect(exception).toBeInstanceOf(APIException);
    });

    it("should have correct prototype chain", () => {
      const exception = new APIException("Test", 400, "TEST");
      expect(Object.getPrototypeOf(exception)).toBe(APIException.prototype);
    });
  });

  describe("toResponse", () => {
    it("should return HALO error format with all fields", () => {
      const providerError: ProviderError = {
        code: "provider_error",
        message: "Provider error",
        type: "error",
      };

      const exception = new APIException("Test error", 400, "TEST_ERROR", providerError, "req-123");

      const response = exception.toResponse();

      expect(response).toHaveProperty("error");
      expect(response.error.code).toBe("TEST_ERROR");
      expect(response.error.message).toBe("Test error");
      expect(response.error.status).toBe(400);
      expect(response.error.provider_error).toEqual(providerError);
      expect(response.error.request_id).toBe("req-123");
      expect(response.error.timestamp).toBeDefined();
      expect(typeof response.error.timestamp).toBe("string");
    });

    it("should return HALO error format without optional fields", () => {
      const exception = new APIException("Test error", 500, "INTERNAL_ERROR");
      const response = exception.toResponse();

      expect(response.error.code).toBe("INTERNAL_ERROR");
      expect(response.error.message).toBe("Test error");
      expect(response.error.status).toBe(500);
      expect(response.error.provider_error).toBeUndefined();
      expect(response.error.request_id).toBeDefined(); // Generated if not provided
      expect(response.error.timestamp).toBeDefined();
    });

    it("should generate request ID if not provided", () => {
      const exception = new APIException("Test", 400, "TEST");
      const response1 = exception.toResponse();
      const response2 = exception.toResponse();

      // Should generate different IDs
      expect(response1.error.request_id).toBeDefined();
      expect(response2.error.request_id).toBeDefined();
    });

    it("should include valid ISO timestamp", () => {
      const exception = new APIException("Test", 400, "TEST");
      const response = exception.toResponse();

      const timestamp = new Date(response.error.timestamp);
      expect(timestamp.getTime()).toBeGreaterThan(0);
      expect(response.error.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });
  });

  describe("toString", () => {
    it("should return formatted error string", () => {
      const exception = new APIException("Test error message", 400, "TEST_ERROR");
      const str = exception.toString();

      expect(str).toContain("APIException");
      expect(str).toContain("TEST_ERROR");
      expect(str).toContain("Test error message");
      expect(str).toContain("400");
    });

    it("should include error code in string representation", () => {
      const exception = new APIException("Error", 500, "INTERNAL_ERROR");
      const str = exception.toString();

      expect(str).toContain("[INTERNAL_ERROR]");
    });
  });

  describe("Error scenarios", () => {
    it("should handle 400 Bad Request", () => {
      const exception = new APIException("Bad request", 400, "BAD_REQUEST");
      expect(exception.statusCode).toBe(400);
    });

    it("should handle 401 Unauthorized", () => {
      const exception = new APIException("Unauthorized", 401, "UNAUTHORIZED");
      expect(exception.statusCode).toBe(401);
    });

    it("should handle 403 Forbidden", () => {
      const exception = new APIException("Forbidden", 403, "FORBIDDEN");
      expect(exception.statusCode).toBe(403);
    });

    it("should handle 404 Not Found", () => {
      const exception = new APIException("Not found", 404, "NOT_FOUND");
      expect(exception.statusCode).toBe(404);
    });

    it("should handle 429 Rate Limit", () => {
      const exception = new APIException("Rate limited", 429, "RATE_LIMIT");
      expect(exception.statusCode).toBe(429);
    });

    it("should handle 500 Internal Server Error", () => {
      const exception = new APIException("Internal error", 500, "INTERNAL_ERROR");
      expect(exception.statusCode).toBe(500);
    });

    it("should handle 503 Service Unavailable", () => {
      const exception = new APIException("Service unavailable", 503, "SERVICE_UNAVAILABLE");
      expect(exception.statusCode).toBe(503);
    });
  });

  describe("Provider error integration", () => {
    it("should preserve provider error details", () => {
      const providerError: ProviderError = {
        code: "invalid_api_key",
        message: "Invalid API key provided",
        type: "authentication_error",
        param: "api_key",
        status: 401,
      };

      const exception = new APIException("Authentication failed", 401, "AUTH_ERROR", providerError);

      const response = exception.toResponse();
      expect(response.error.provider_error).toEqual(providerError);
    });

    it("should handle provider error without optional fields", () => {
      const providerError: ProviderError = {
        code: "error",
        message: "Error",
        type: "error",
      };

      const exception = new APIException("Test", 400, "TEST", providerError);
      const response = exception.toResponse();

      expect(response.error.provider_error).toBeDefined();
      expect(response.error.provider_error?.param).toBeUndefined();
      expect(response.error.provider_error?.status).toBeUndefined();
    });
  });
});

describe("HALOError interface", () => {
  it("should match expected structure", () => {
    const haloError: HALOError = {
      error: {
        code: "TEST",
        message: "Test",
        status: 400,
        request_id: "req-123",
        timestamp: "2025-01-01T00:00:00Z",
      },
    };

    expect(haloError.error).toBeDefined();
    expect(haloError.error.code).toBe("TEST");
    expect(haloError.error.message).toBe("Test");
    expect(haloError.error.status).toBe(400);
  });

  it("should support optional provider_error", () => {
    const haloError: HALOError = {
      error: {
        code: "TEST",
        message: "Test",
        status: 400,
        request_id: "req-123",
        timestamp: "2025-01-01T00:00:00Z",
        provider_error: {
          code: "provider_code",
          message: "Provider message",
          type: "error",
        },
      },
    };

    expect(haloError.error.provider_error).toBeDefined();
  });
});
