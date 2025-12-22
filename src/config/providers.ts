import { getEnvVar } from "../utils/config";
import { ProviderConfig } from "../providers/types";

/**
 * Provider Environment Configuration
 *
 * Loads and validates provider configurations from environment variables
 */
export interface ProviderEnvConfig {
  azure_openai: {
    endpoint: string;
    deployment: string;
    api_key?: string;
    api_version: string;
    auth_type: "api-key" | "aad";
  };
  openai?: {
    api_key: string;
    organization?: string;
  };
  azure_foundry?: {
    endpoint: string;
    deployment?: string;
    api_key?: string;
    api_version: string;
    auth_type: "api-key" | "aad";
  };
}

/**
 * Normalize Azure OpenAI endpoint URL
 * Removes paths like /openai/v1, /openai/deployments/{deployment}, /chat/completions
 */
function normalizeAzureEndpoint(url: string): string {
  let normalized = url;

  // Remove trailing slash
  normalized = normalized.replace(/\/+$/, "");

  // Remove /openai/v1 or /openai/v1/chat/completions suffix
  normalized = normalized.replace(/\/openai\/v1(\/chat\/completions)?$/, "");

  // Remove /openai/deployments/{deployment} suffix
  normalized = normalized.replace(/\/openai\/deployments\/[^/]+.*$/, "");

  // Remove /chat/completions suffix
  normalized = normalized.replace(/\/chat\/completions.*$/, "");

  // Remove query parameters
  normalized = normalized.replace(/\?.*$/, "");

  return normalized;
}

/**
 * Load provider configuration from environment variables
 */
export function loadProviderConfig(): ProviderEnvConfig {
  // Extract endpoint and deployment from AZURE_OPENAI_ENDPOINT if it contains deployment info
  const endpointUrl = process.env.AZURE_OPENAI_ENDPOINT || "";
  let endpoint = endpointUrl;
  let deployment = process.env.AZURE_OPENAI_DEPLOYMENT;

  // If endpoint contains /deployments/, extract it
  const deploymentMatch = endpointUrl.match(/\/deployments\/([^/]+)/);
  if (deploymentMatch && !deployment) {
    deployment = deploymentMatch[1];
  }

  // Normalize endpoint URL
  endpoint = normalizeAzureEndpoint(endpoint);

  const config: ProviderEnvConfig = {
    azure_openai: {
      endpoint: endpoint || getEnvVar("AZURE_OPENAI_ENDPOINT"),
      deployment: deployment || getEnvVar("AZURE_OPENAI_DEPLOYMENT", "gpt-5-nano"),
      api_key: process.env.AZURE_OPENAI_API_KEY,
      api_version: process.env.AZURE_OPENAI_API_VERSION || "2024-12-01-preview",
      auth_type: (process.env.AZURE_OPENAI_AUTH_TYPE || "api-key") as "api-key" | "aad",
    },
  };

  // Optional OpenAI config
  if (process.env.OPENAI_API_KEY) {
    config.openai = {
      api_key: process.env.OPENAI_API_KEY,
      organization: process.env.OPENAI_ORGANIZATION,
    };
  }

  // Optional Azure AI Foundry config
  if (process.env.AZURE_FOUNDRY_ENDPOINT) {
    config.azure_foundry = {
      endpoint: process.env.AZURE_FOUNDRY_ENDPOINT,
      deployment: process.env.AZURE_FOUNDRY_DEPLOYMENT,
      api_key: process.env.AZURE_FOUNDRY_API_KEY,
      api_version: process.env.AZURE_FOUNDRY_API_VERSION || "2023-12-01-preview",
      auth_type: (process.env.AZURE_FOUNDRY_AUTH_TYPE || "api-key") as "api-key" | "aad",
    };
  }

  return config;
}

/**
 * Build provider config from request and environment
 */
export function buildProviderConfig(
  provider: string,
  requestEndpoint?: string,
  requestDeployment?: string,
  requestApiVersion?: string
): ProviderConfig {
  const envConfig = loadProviderConfig();

  switch (provider) {
    case "azure-openai": {
      const azureConfig = envConfig.azure_openai;
      return {
        provider: "azure-openai",
        endpoint: requestEndpoint || azureConfig.endpoint,
        deployment: requestDeployment || azureConfig.deployment,
        apiKey: azureConfig.api_key,
        apiVersion: requestApiVersion || azureConfig.api_version,
        authType: azureConfig.auth_type,
      };
    }

    case "openai": {
      if (!envConfig.openai) {
        throw new Error("OpenAI configuration not found in environment");
      }
      return {
        provider: "openai",
        endpoint: "https://api.openai.com/v1",
        apiKey: envConfig.openai.api_key,
        apiVersion: "v1",
        authType: "api-key",
        organization: envConfig.openai.organization,
      };
    }

    case "azure-ai-foundry": {
      if (!envConfig.azure_foundry) {
        throw new Error("Azure AI Foundry configuration not found in environment");
      }
      const foundryConfig = envConfig.azure_foundry;
      return {
        provider: "azure-ai-foundry",
        endpoint: requestEndpoint || foundryConfig.endpoint,
        deployment: requestDeployment || foundryConfig.deployment,
        model: requestDeployment, // For OSS models, deployment is the model name
        apiKey: foundryConfig.api_key,
        apiVersion: requestApiVersion || foundryConfig.api_version,
        authType: foundryConfig.auth_type,
      };
    }

    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}
