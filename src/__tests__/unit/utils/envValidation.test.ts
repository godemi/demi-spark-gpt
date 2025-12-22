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
    it("should return valid when model-specific configurations exist", () => {
      process.env.AZURE_OPENAI_ENDPOINT_GPT_5_NANO = "https://test.openai.azure.com";
      process.env.AZURE_OPENAI_API_KEY_GPT_5_NANO = "test-key";

      const result = validateAzureOpenAIEnv();

      expect(result.valid).toBe(true);
      expect(result.missing).toHaveLength(0);
    });

    it("should warn when no model-specific configurations exist", () => {
      // Clear all model-specific configs
      for (const key of Object.keys(process.env)) {
        if (key.startsWith("AZURE_OPENAI_ENDPOINT_")) {
          delete process.env[key];
        }
      }

      const result = validateAzureOpenAIEnv();

      expect(result.valid).toBe(true); // No required vars anymore, so still valid
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some((w) => w.includes("No model-specific configurations"))).toBe(true);
    });

    it("should return valid even without default endpoint and API key", () => {
      delete process.env.AZURE_OPENAI_ENDPOINT;
      delete process.env.AZURE_OPENAI_API_KEY;
      // But have a model-specific config
      process.env.AZURE_OPENAI_ENDPOINT_GPT_4O = "https://gpt4o.openai.azure.com";
      process.env.AZURE_OPENAI_API_KEY_GPT_4O = "gpt4o-key";

      const result = validateAzureOpenAIEnv();

      expect(result.valid).toBe(true);
      expect(result.missing).toHaveLength(0);
    });

    it("should warn when no configurations exist at all", () => {
      delete process.env.AZURE_OPENAI_ENDPOINT;
      delete process.env.AZURE_OPENAI_API_KEY;
      // Clear all model-specific configs
      for (const key of Object.keys(process.env)) {
        if (key.startsWith("AZURE_OPENAI_ENDPOINT_")) {
          delete process.env[key];
        }
      }

      const result = validateAzureOpenAIEnv();

      expect(result.valid).toBe(true); // No required vars in new system
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some((w) => w.includes("No model-specific configurations"))).toBe(true);
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

    it("should not warn when model-specific configs and optional variables are set", () => {
      process.env.AZURE_OPENAI_ENDPOINT_GPT_5_NANO = "https://test.openai.azure.com";
      process.env.AZURE_OPENAI_API_KEY_GPT_5_NANO = "test-key";
      process.env.AZURE_OPENAI_DEPLOYMENT = "gpt-5-nano";
      process.env.AZURE_OPENAI_API_VERSION = "2024-12-01-preview";

      const result = validateAzureOpenAIEnv();

      expect(result.valid).toBe(true);
      expect(result.warnings.length).toBe(0);
    });
  });

  describe("getRequiredEnvVarsMessage", () => {
    it("should return a formatted message with model-specific instructions", () => {
      const message = getRequiredEnvVarsMessage();

      expect(message).toContain("Model-Specific Configuration");
      expect(message).toContain("AZURE_OPENAI_ENDPOINT_<MODEL_NAME>");
      expect(message).toContain("AZURE_OPENAI_API_KEY_<MODEL_NAME>");
      expect(message).toContain("local.settings.json");
      expect(message).toContain("Azure Portal");
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

