import { describe, it, expect, beforeEach, vi } from "vitest";
import { getEnvVar } from "../../../utils/config";
import { APIException } from "../../../utils/exceptions";

/**
 * Unit tests for config utilities
 */
describe("getEnvVar", () => {
  const originalEnv = process.env;
  const originalConsoleLog = console.log;

  beforeEach(() => {
    // Reset environment variables before each test
    process.env = { ...originalEnv };
    console.log = originalConsoleLog;
    vi.clearAllMocks();
  });

  it("should return environment variable value when set", () => {
    process.env.TEST_VAR = "test-value";
    const value = getEnvVar("TEST_VAR");
    expect(value).toBe("test-value");
  });

  it("should return default value when variable is not set", () => {
    delete process.env.TEST_VAR;
    const value = getEnvVar("TEST_VAR", "default-value");
    expect(value).toBe("default-value");
  });

  it("should throw APIException when variable is not set and no default provided", () => {
    delete process.env.TEST_VAR;

    expect(() => {
      getEnvVar("TEST_VAR");
    }).toThrow(APIException);

    try {
      getEnvVar("TEST_VAR");
    } catch (error) {
      expect(error).toBeInstanceOf(APIException);
      if (error instanceof APIException) {
        expect(error.statusCode).toBe(400);
        expect(error.errorCode).toBe("ENV_VARIABLE_MISSING");
        expect(error.message).toContain("TEST_VAR");
      }
    }
  });

  it("should handle empty string as unset", () => {
    process.env.TEST_VAR = "";
    const value = getEnvVar("TEST_VAR", "default");
    expect(value).toBe("default");
  });

  it("should return actual value even if default is provided", () => {
    process.env.TEST_VAR = "actual-value";
    const value = getEnvVar("TEST_VAR", "default-value");
    expect(value).toBe("actual-value");
  });

  it("should log when loading environment variable", () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    process.env.TEST_VAR = "test-value";

    getEnvVar("TEST_VAR");

    expect(consoleSpy).toHaveBeenCalledWith("Loading ENV Variable TEST_VAR");
    consoleSpy.mockRestore();
  });

  it("should handle special characters in variable values", () => {
    process.env.TEST_VAR = "value-with-special-chars-!@#$%";
    const value = getEnvVar("TEST_VAR");
    expect(value).toBe("value-with-special-chars-!@#$%");
  });

  it("should handle very long variable values", () => {
    const longValue = "a".repeat(10000);
    process.env.TEST_VAR = longValue;
    const value = getEnvVar("TEST_VAR");
    expect(value).toBe(longValue);
  });

  it("should handle Unicode characters in variable values", () => {
    process.env.TEST_VAR = "测试值-🌍";
    const value = getEnvVar("TEST_VAR");
    expect(value).toBe("测试值-🌍");
  });
});
