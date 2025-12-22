import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  validateAzureOpenAIEnv,
  validateEnvironmentVariables,
  getRequiredEnvVarsMessage,
} from "../../../utils/envValidation";

describe("Environment Variable Validation", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("validateAzureOpenAIEnv", () => {
    it("should return valid when all required variables are set", () => {
      process.env.AZURE_OPENAI_ENDPOINT = "https://test.openai.azure.com";
      process.env.AZURE_OPENAI_API_KEY = "test-key";

      const result = validateAzureOpenAIEnv();

      expect(result.valid).toBe(true);
      expect(result.missing).toHaveLength(0);
    });

    it("should detect missing AZURE_OPENAI_ENDPOINT", () => {
      delete process.env.AZURE_OPENAI_ENDPOINT;
      process.env.AZURE_OPENAI_API_KEY = "test-key";

      const result = validateAzureOpenAIEnv();

      expect(result.valid).toBe(false);
      expect(result.missing).toContain("AZURE_OPENAI_ENDPOINT");
    });

    it("should detect missing AZURE_OPENAI_API_KEY", () => {
      process.env.AZURE_OPENAI_ENDPOINT = "https://test.openai.azure.com";
      delete process.env.AZURE_OPENAI_API_KEY;

      const result = validateAzureOpenAIEnv();

      expect(result.valid).toBe(false);
      expect(result.missing).toContain("AZURE_OPENAI_API_KEY");
    });

    it("should detect all missing required variables", () => {
      delete process.env.AZURE_OPENAI_ENDPOINT;
      delete process.env.AZURE_OPENAI_API_KEY;

      const result = validateAzureOpenAIEnv();

      expect(result.valid).toBe(false);
      expect(result.missing).toHaveLength(2);
      expect(result.missing).toContain("AZURE_OPENAI_ENDPOINT");
      expect(result.missing).toContain("AZURE_OPENAI_API_KEY");
    });

    it("should warn when optional variables are missing", () => {
      process.env.AZURE_OPENAI_ENDPOINT = "https://test.openai.azure.com";
      process.env.AZURE_OPENAI_API_KEY = "test-key";
      delete process.env.AZURE_OPENAI_DEPLOYMENT;
      delete process.env.AZURE_OPENAI_API_VERSION;

      const result = validateAzureOpenAIEnv();

      expect(result.valid).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some((w) => w.includes("AZURE_OPENAI_DEPLOYMENT"))).toBe(true);
    });

    it("should not warn when optional variables are set", () => {
      process.env.AZURE_OPENAI_ENDPOINT = "https://test.openai.azure.com";
      process.env.AZURE_OPENAI_API_KEY = "test-key";
      process.env.AZURE_OPENAI_DEPLOYMENT = "gpt-5.2";
      process.env.AZURE_OPENAI_API_VERSION = "2024-12-01-preview";

      const result = validateAzureOpenAIEnv();

      expect(result.valid).toBe(true);
      expect(result.warnings.length).toBe(0);
    });
  });

  describe("getRequiredEnvVarsMessage", () => {
    it("should return a formatted message", () => {
      const message = getRequiredEnvVarsMessage();

      expect(message).toContain("AZURE_OPENAI_ENDPOINT");
      expect(message).toContain("AZURE_OPENAI_API_KEY");
      expect(message).toContain("local.settings.json");
      expect(message).toContain(".env");
    });
  });

  describe("validateEnvironmentVariables", () => {
    it("should not throw when required variables are set", () => {
      process.env.AZURE_OPENAI_ENDPOINT = "https://test.openai.azure.com";
      process.env.AZURE_OPENAI_API_KEY = "test-key";

      expect(() => validateEnvironmentVariables()).not.toThrow();
    });

    it("should handle missing variables gracefully", () => {
      delete process.env.AZURE_OPENAI_ENDPOINT;
      delete process.env.AZURE_OPENAI_API_KEY;

      // Should not throw, just log warnings
      expect(() => validateEnvironmentVariables()).not.toThrow();
    });
  });
});

