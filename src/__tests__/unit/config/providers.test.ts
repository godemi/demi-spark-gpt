import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  buildProviderConfig,
  loadProviderConfig,
  ProviderEnvConfig,
} from "../../../config/providers";
import { ProviderConfig } from "../../../providers/types";

/**
 * Unit tests for provider configuration
 */
describe("loadProviderConfig", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  it("should load Azure OpenAI configuration", () => {
    process.env.AZURE_OPENAI_ENDPOINT = "https://test.openai.azure.com";
    process.env.AZURE_OPENAI_DEPLOYMENT = "gpt-4o";
    process.env.AZURE_OPENAI_API_KEY = "test-key";
    process.env.AZURE_OPENAI_API_VERSION = "2024-10-21";

    const config = loadProviderConfig();

    expect(config.azure_openai).toBeDefined();
    expect(config.azure_openai.endpoint).toBe("https://test.openai.azure.com");
    expect(config.azure_openai.deployment).toBe("gpt-4o");
    expect(config.azure_openai.api_key).toBe("test-key");
    expect(config.azure_openai.api_version).toBe("2024-10-21");
    expect(config.azure_openai.auth_type).toBe("api-key");
  });

  it("should extract deployment from endpoint URL", () => {
    process.env.AZURE_OPENAI_ENDPOINT = "https://test.openai.azure.com/openai/deployments/gpt-4o";

    const config = loadProviderConfig();

    expect(config.azure_openai.deployment).toBe("gpt-4o");
    expect(config.azure_openai.endpoint).not.toContain("/deployments/");
  });

  it("should remove /chat/completions from endpoint", () => {
    process.env.AZURE_OPENAI_ENDPOINT =
      "https://test.openai.azure.com/openai/deployments/gpt-4o/chat/completions";

    const config = loadProviderConfig();

    expect(config.azure_openai.endpoint).not.toContain("/chat/completions");
  });

  it("should load OpenAI configuration when available", () => {
    process.env.AZURE_OPENAI_ENDPOINT = "https://test.openai.azure.com";
    process.env.OPENAI_API_KEY = "openai-key";
    process.env.OPENAI_ORGANIZATION = "org-123";

    const config = loadProviderConfig();

    expect(config.openai).toBeDefined();
    expect(config.openai?.api_key).toBe("openai-key");
    expect(config.openai?.organization).toBe("org-123");
  });

  it("should not include OpenAI config when API key is missing", () => {
    process.env.AZURE_OPENAI_ENDPOINT = "https://test.openai.azure.com";
    delete process.env.OPENAI_API_KEY;

    const config = loadProviderConfig();

    expect(config.openai).toBeUndefined();
  });

  it("should load Azure Foundry configuration when available", () => {
    process.env.AZURE_OPENAI_ENDPOINT = "https://test.openai.azure.com";
    process.env.AZURE_FOUNDRY_ENDPOINT = "https://foundry.ai.azure.com";
    process.env.AZURE_FOUNDRY_DEPLOYMENT = "llama-3-70b";
    process.env.AZURE_FOUNDRY_API_KEY = "foundry-key";
    process.env.AZURE_FOUNDRY_API_VERSION = "2023-12-01-preview";

    const config = loadProviderConfig();

    expect(config.azure_foundry).toBeDefined();
    expect(config.azure_foundry?.endpoint).toBe("https://foundry.ai.azure.com");
    expect(config.azure_foundry?.deployment).toBe("llama-3-70b");
    expect(config.azure_foundry?.api_key).toBe("foundry-key");
    expect(config.azure_foundry?.api_version).toBe("2023-12-01-preview");
  });

  it("should use default API version for Azure OpenAI", () => {
    process.env.AZURE_OPENAI_ENDPOINT = "https://test.openai.azure.com";
    delete process.env.AZURE_OPENAI_API_VERSION;

    const config = loadProviderConfig();

    expect(config.azure_openai.api_version).toBe("2024-12-01-preview");
  });

  it("should use default deployment for Azure OpenAI", () => {
    process.env.AZURE_OPENAI_ENDPOINT = "https://test.openai.azure.com";
    delete process.env.AZURE_OPENAI_DEPLOYMENT;

    const config = loadProviderConfig();

    expect(config.azure_openai.deployment).toBe("gpt-5-nano");
  });

  it("should normalize endpoint with /openai/v1 path", () => {
    process.env.AZURE_OPENAI_ENDPOINT = "https://test.openai.azure.com/openai/v1";
    process.env.AZURE_OPENAI_DEPLOYMENT = "gpt-5.2";

    const config = loadProviderConfig();

    expect(config.azure_openai.endpoint).toBe("https://test.openai.azure.com");
    expect(config.azure_openai.deployment).toBe("gpt-5.2");
  });

  it("should normalize endpoint with /openai/v1/chat/completions path", () => {
    process.env.AZURE_OPENAI_ENDPOINT = "https://test.openai.azure.com/openai/v1/chat/completions";

    const config = loadProviderConfig();

    expect(config.azure_openai.endpoint).toBe("https://test.openai.azure.com");
  });

  it("should normalize endpoint with query parameters", () => {
    process.env.AZURE_OPENAI_ENDPOINT =
      "https://test.openai.azure.com/openai/deployments/gpt-5.2/chat/completions?api-version=2024-12-01-preview";
    delete process.env.AZURE_OPENAI_DEPLOYMENT; // Clear to test extraction from URL

    const config = loadProviderConfig();

    expect(config.azure_openai.endpoint).toBe("https://test.openai.azure.com");
    expect(config.azure_openai.deployment).toBe("gpt-5.2");
  });

  it("should handle endpoint with trailing slash", () => {
    process.env.AZURE_OPENAI_ENDPOINT = "https://test.openai.azure.com/";

    const config = loadProviderConfig();

    expect(config.azure_openai.endpoint).toBe("https://test.openai.azure.com");
  });

  it("should support AAD authentication type", () => {
    process.env.AZURE_OPENAI_ENDPOINT = "https://test.openai.azure.com";
    process.env.AZURE_OPENAI_AUTH_TYPE = "aad";

    const config = loadProviderConfig();

    expect(config.azure_openai.auth_type).toBe("aad");
  });
});

describe("buildProviderConfig", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env = {
      AZURE_OPENAI_ENDPOINT: "https://test.openai.azure.com",
      AZURE_OPENAI_DEPLOYMENT: "gpt-5-nano",
      AZURE_OPENAI_API_KEY: "test-key",
      AZURE_OPENAI_API_VERSION: "2024-12-01-preview",
      AZURE_OPENAI_AUTH_TYPE: "api-key",
    };
  });

  it("should build Azure OpenAI config", () => {
    const config = buildProviderConfig("azure-openai");

    expect(config.provider).toBe("azure-openai");
    expect(config.endpoint).toBe("https://test.openai.azure.com");
    expect(config.deployment).toBe("gpt-5-nano");
    expect(config.apiKey).toBe("test-key");
    expect(config.apiVersion).toBe("2024-12-01-preview");
    expect(config.authType).toBe("api-key");
  });

  it("should use request parameters over environment variables", () => {
    const config = buildProviderConfig(
      "azure-openai",
      "https://custom.openai.azure.com",
      "custom-deployment",
      "2024-11-01"
    );

    expect(config.endpoint).toBe("https://custom.openai.azure.com");
    expect(config.deployment).toBe("custom-deployment");
    expect(config.apiVersion).toBe("2024-11-01");
  });

  it("should build OpenAI config", () => {
    process.env.OPENAI_API_KEY = "openai-key";
    process.env.OPENAI_ORGANIZATION = "org-123";

    const config = buildProviderConfig("openai");

    expect(config.provider).toBe("openai");
    expect(config.endpoint).toBe("https://api.openai.com/v1");
    expect(config.apiKey).toBe("openai-key");
    expect(config.organization).toBe("org-123");
    expect(config.apiVersion).toBe("v1");
    expect(config.authType).toBe("api-key");
  });

  it("should throw error when OpenAI config is missing", () => {
    delete process.env.OPENAI_API_KEY;

    expect(() => {
      buildProviderConfig("openai");
    }).toThrow("OpenAI configuration not found in environment");
  });

  it("should build Azure Foundry config", () => {
    process.env.AZURE_FOUNDRY_ENDPOINT = "https://foundry.ai.azure.com";
    process.env.AZURE_FOUNDRY_DEPLOYMENT = "llama-3-70b";
    process.env.AZURE_FOUNDRY_API_KEY = "foundry-key";
    process.env.AZURE_FOUNDRY_API_VERSION = "2023-12-01-preview";

    const config = buildProviderConfig("azure-ai-foundry");

    expect(config.provider).toBe("azure-ai-foundry");
    expect(config.endpoint).toBe("https://foundry.ai.azure.com");
    expect(config.deployment).toBe("llama-3-70b");
    // model is only set when requestDeployment is provided, not from env
    expect(config.model).toBeUndefined();
    expect(config.apiKey).toBe("foundry-key");
    expect(config.apiVersion).toBe("2023-12-01-preview");
  });

  it("should throw error when Azure Foundry config is missing", () => {
    delete process.env.AZURE_FOUNDRY_ENDPOINT;

    expect(() => {
      buildProviderConfig("azure-ai-foundry");
    }).toThrow("Azure AI Foundry configuration not found in environment");
  });

  it("should throw error for unknown provider", () => {
    expect(() => {
      buildProviderConfig("unknown-provider" as any);
    }).toThrow("Unknown provider: unknown-provider");
  });

  it("should use request deployment for Azure Foundry model", () => {
    process.env.AZURE_FOUNDRY_ENDPOINT = "https://foundry.ai.azure.com";
    process.env.AZURE_FOUNDRY_API_KEY = "foundry-key";
    process.env.AZURE_FOUNDRY_API_VERSION = "2023-12-01-preview";

    const config = buildProviderConfig("azure-ai-foundry", undefined, "custom-model");

    expect(config.model).toBe("custom-model");
    expect(config.deployment).toBe("custom-model");
  });

  it("should load model-specific configuration", () => {
    process.env.AZURE_OPENAI_ENDPOINT = "https://default.openai.azure.com";
    process.env.AZURE_OPENAI_API_KEY = "default-key";
    process.env.AZURE_OPENAI_ENDPOINT_GPT_4O = "https://gpt4o.openai.azure.com";
    process.env.AZURE_OPENAI_API_KEY_GPT_4O = "gpt4o-key";
    process.env.AZURE_OPENAI_API_VERSION_GPT_4O = "2024-10-21";

    const config = buildProviderConfig("azure-openai", undefined, undefined, undefined, "gpt-4o");

    expect(config.endpoint).toBe("https://gpt4o.openai.azure.com");
    expect(config.apiKey).toBe("gpt4o-key");
    expect(config.apiVersion).toBe("2024-10-21");
  });

  it("should fallback to default config when model-specific config not found", () => {
    process.env.AZURE_OPENAI_ENDPOINT = "https://default.openai.azure.com";
    process.env.AZURE_OPENAI_API_KEY = "default-key";
    process.env.AZURE_OPENAI_DEPLOYMENT = "gpt-5-nano";

    const config = buildProviderConfig("azure-openai", undefined, undefined, undefined, "gpt-4o");

    expect(config.endpoint).toBe("https://default.openai.azure.com");
    expect(config.apiKey).toBe("default-key");
  });

  it("should load all model-specific configurations", () => {
    process.env.AZURE_OPENAI_ENDPOINT = "https://default.openai.azure.com";
    process.env.AZURE_OPENAI_ENDPOINT_GPT_4O = "https://gpt4o.openai.azure.com";
    process.env.AZURE_OPENAI_API_KEY_GPT_4O = "gpt4o-key";
    process.env.AZURE_OPENAI_ENDPOINT_GPT_5_2 = "https://gpt52.openai.azure.com";
    process.env.AZURE_OPENAI_API_KEY_GPT_5_2 = "gpt52-key";

    const envConfig = loadProviderConfig();

    expect(envConfig.azure_openai_models.has("gpt-4o")).toBe(true);
    expect(envConfig.azure_openai_models.has("gpt-5.2")).toBe(true);
    expect(envConfig.azure_openai_models.get("gpt-4o")?.endpoint).toBe("https://gpt4o.openai.azure.com");
    expect(envConfig.azure_openai_models.get("gpt-5.2")?.endpoint).toBe("https://gpt52.openai.azure.com");
  });

  it("should use endpoint-based configuration when endpoint matches", () => {
    process.env.AZURE_OPENAI_ENDPOINT = "https://default.openai.azure.com";
    process.env.AZURE_OPENAI_API_KEY = "default-key";
    // Endpoint-based config (using endpoint hash/identifier)
    process.env.AZURE_OPENAI_ENDPOINT_CUSTOM = "https://custom.openai.azure.com";
    process.env.AZURE_OPENAI_API_KEY_CUSTOM = "custom-key";
    process.env.AZURE_OPENAI_API_VERSION_CUSTOM = "2024-11-01";

    const config = buildProviderConfig("azure-openai", "https://custom.openai.azure.com");

    // Should use the custom endpoint config
    expect(config.endpoint).toBe("https://custom.openai.azure.com");
    expect(config.apiKey).toBe("custom-key");
    expect(config.apiVersion).toBe("2024-11-01");
  });

  it("should prioritize model-specific config over endpoint config", () => {
    process.env.AZURE_OPENAI_ENDPOINT = "https://default.openai.azure.com";
    process.env.AZURE_OPENAI_API_KEY = "default-key";
    process.env.AZURE_OPENAI_ENDPOINT_GPT_4O = "https://gpt4o.openai.azure.com";
    process.env.AZURE_OPENAI_API_KEY_GPT_4O = "gpt4o-key";
    process.env.AZURE_OPENAI_ENDPOINT_CUSTOM = "https://custom.openai.azure.com";
    process.env.AZURE_OPENAI_API_KEY_CUSTOM = "custom-key";

    const config = buildProviderConfig(
      "azure-openai",
      "https://custom.openai.azure.com",
      undefined,
      undefined,
      "gpt-4o"
    );

    // Model-specific should take priority
    expect(config.endpoint).toBe("https://gpt4o.openai.azure.com");
    expect(config.apiKey).toBe("gpt4o-key");
  });
});
