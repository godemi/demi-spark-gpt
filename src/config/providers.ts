import { getEnvVar } from "../utils/config";
import { ProviderConfig } from "../providers/types";
import { MODEL_REGISTRY } from "../providers/modelRegistry";

/**
 * Azure OpenAI endpoint configuration
 */
export interface AzureOpenAIConfig {
  endpoint: string;
  deployment?: string;
  api_key?: string;
  api_version: string;
  auth_type: "api-key" | "aad";
}

/**
 * Provider Environment Configuration
 *
 * Loads and validates provider configurations from environment variables
 */
export interface ProviderEnvConfig {
  azure_openai: {
    deployment: string; // Default deployment name only (for fallback when no model specified)
    api_version: string; // Default API version
    auth_type: "api-key" | "aad"; // Default auth type
  };
  azure_openai_endpoints: Map<string, AzureOpenAIConfig>; // Map of endpoint URL -> config
  azure_openai_models: Map<string, AzureOpenAIConfig>; // Map of model name -> config
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
 * Removes paths like /openai/v1, /openai/deployments/{deployment}, /chat/completions, /openai/responses
 */
function normalizeAzureEndpoint(url: string): string {
  let normalized = url;

  // Remove trailing slash
  normalized = normalized.replace(/\/+$/, "");

  // Remove /openai/v1 or /openai/v1/chat/completions suffix
  normalized = normalized.replace(/\/openai\/v1(\/chat\/completions)?$/, "");

  // Remove /openai/deployments/{deployment} suffix
  normalized = normalized.replace(/\/openai\/deployments\/[^/]+.*$/, "");

  // Remove /openai/responses suffix (for GPT-5.2 responses endpoint)
  normalized = normalized.replace(/\/openai\/responses.*$/, "");

  // Remove /chat/completions suffix
  normalized = normalized.replace(/\/chat\/completions.*$/, "");

  // Remove query parameters
  normalized = normalized.replace(/\?.*$/, "");

  return normalized;
}

/**
 * Load model-specific Azure OpenAI configuration from environment variables
 * Supports pattern: AZURE_OPENAI_ENDPOINT_<MODEL>, AZURE_OPENAI_API_KEY_<MODEL>, etc.
 */
function loadModelSpecificConfig(model: string): AzureOpenAIConfig | null {
  const modelUpper = model.toUpperCase().replace(/[^A-Z0-9]/g, "_");
  const endpointKey = `AZURE_OPENAI_ENDPOINT_${modelUpper}`;
  const apiKeyKey = `AZURE_OPENAI_API_KEY_${modelUpper}`;
  const apiVersionKey = `AZURE_OPENAI_API_VERSION_${modelUpper}`;
  const authTypeKey = `AZURE_OPENAI_AUTH_TYPE_${modelUpper}`;

  const endpoint = process.env[endpointKey];
  if (!endpoint) {
    return null;
  }

  return {
    endpoint: normalizeAzureEndpoint(endpoint),
    api_key: process.env[apiKeyKey],
    api_version: process.env[apiVersionKey] || "2024-12-01-preview",
    auth_type: (process.env[authTypeKey] || "api-key") as "api-key" | "aad",
  };
}

/**
 * Normalize model name from environment variable key
 * Handles the case where both dots and dashes are converted to underscores
 * by checking against the model registry to find the correct model name
 * 
 * Example: GPT_5_2 -> tries gpt-5.2 (found in registry) -> returns gpt-5.2
 *          GPT_4O -> tries gpt-4o (found in registry) -> returns gpt-4o
 */
function normalizeModelNameFromEnvKey(modelKey: string): string {
  const lowerKey = modelKey.toLowerCase();
  
  // Try all possible combinations of replacing underscores with dashes and dots
  // Start with the most likely pattern: last underscore might be a dot (e.g., gpt-5.2)
  const parts = lowerKey.split("_");
  
  // Strategy: Try replacing the last underscore with a dot first (common pattern: gpt-5.2)
  if (parts.length >= 3) {
    const lastTwo = parts.slice(-2).join(".");
    const rest = parts.slice(0, -2).join("-");
    const withDot = `${rest}-${lastTwo}`;
    if (withDot in MODEL_REGISTRY) {
      return withDot;
    }
  }
  
  // Try all dashes (default conversion)
  const withDashes = lowerKey.replace(/_/g, "-");
  if (withDashes in MODEL_REGISTRY) {
    return withDashes;
  }
  
  // Try all dots (unlikely but possible)
  const withDots = lowerKey.replace(/_/g, ".");
  if (withDots in MODEL_REGISTRY) {
    return withDots;
  }
  
  // If no match found in registry, return dash version (original behavior)
  // This allows custom model names not in the registry
  return withDashes;
}

/**
 * Load all model-specific configurations from environment
 */
function loadAllModelConfigs(): Map<string, AzureOpenAIConfig> {
  const modelConfigs = new Map<string, AzureOpenAIConfig>();

  // Scan environment for AZURE_OPENAI_ENDPOINT_* patterns
  for (const [key, value] of Object.entries(process.env)) {
    if (key.startsWith("AZURE_OPENAI_ENDPOINT_") && value) {
      // Extract model name from key (e.g., AZURE_OPENAI_ENDPOINT_GPT_4O -> gpt-4o)
      const modelKey = key.replace("AZURE_OPENAI_ENDPOINT_", "");
      // Use smart normalization that checks model registry
      const modelName = normalizeModelNameFromEnvKey(modelKey);

      const apiKeyKey = `AZURE_OPENAI_API_KEY_${modelKey}`;
      const apiVersionKey = `AZURE_OPENAI_API_VERSION_${modelKey}`;
      const authTypeKey = `AZURE_OPENAI_AUTH_TYPE_${modelKey}`;

      modelConfigs.set(modelName, {
        endpoint: normalizeAzureEndpoint(value),
        api_key: process.env[apiKeyKey],
        api_version: process.env[apiVersionKey] || "2024-12-01-preview",
        auth_type: (process.env[authTypeKey] || "api-key") as "api-key" | "aad",
      });
    }
  }

  return modelConfigs;
}

/**
 * Build endpoint lookup map from environment variables
 * Supports pattern: AZURE_OPENAI_ENDPOINT_<ENDPOINT_HASH>, AZURE_OPENAI_API_KEY_<ENDPOINT_HASH>
 * where ENDPOINT_HASH is a normalized identifier for the endpoint
 */
function loadEndpointConfigs(): Map<string, AzureOpenAIConfig> {
  const endpointConfigs = new Map<string, AzureOpenAIConfig>();

  // Look for endpoint-specific configs (using endpoint hash/identifier)
  // Pattern: AZURE_OPENAI_ENDPOINT_<ID> and AZURE_OPENAI_API_KEY_<ID>
  const endpointIds = new Set<string>();
  for (const key of Object.keys(process.env)) {
    const match = key.match(/^AZURE_OPENAI_ENDPOINT_([A-Z0-9_]+)$/);
    if (match && !key.includes("_API_KEY_") && !key.includes("_API_VERSION_") && !key.includes("_AUTH_TYPE_")) {
      endpointIds.add(match[1]);
    }
  }

  for (const endpointId of endpointIds) {
    const endpointKey = `AZURE_OPENAI_ENDPOINT_${endpointId}`;
    const apiKeyKey = `AZURE_OPENAI_API_KEY_${endpointId}`;
    const apiVersionKey = `AZURE_OPENAI_API_VERSION_${endpointId}`;
    const authTypeKey = `AZURE_OPENAI_AUTH_TYPE_${endpointId}`;

    const endpoint = process.env[endpointKey];
    if (endpoint) {
      const normalized = normalizeAzureEndpoint(endpoint);
      endpointConfigs.set(normalized, {
        endpoint: normalized,
        api_key: process.env[apiKeyKey],
        api_version: process.env[apiVersionKey] || "2024-12-01-preview",
        auth_type: (process.env[authTypeKey] || "api-key") as "api-key" | "aad",
      });
    }
  }

  return endpointConfigs;
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
      deployment: deployment || process.env.AZURE_OPENAI_DEPLOYMENT || "gpt-5-nano",
      api_version: process.env.AZURE_OPENAI_API_VERSION || "2024-12-01-preview",
      auth_type: (process.env.AZURE_OPENAI_AUTH_TYPE || "api-key") as "api-key" | "aad",
    },
    azure_openai_endpoints: loadEndpointConfigs(),
    azure_openai_models: loadAllModelConfigs(),
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
  requestApiVersion?: string,
  modelName?: string
): ProviderConfig {
  const envConfig = loadProviderConfig();

  switch (provider) {
    case "azure-openai": {
      const azureConfig = envConfig.azure_openai;
      
      // Initialize with default values
      let endpoint = requestEndpoint || process.env.AZURE_OPENAI_ENDPOINT;
      let apiKey = process.env.AZURE_OPENAI_API_KEY;
      let apiVersion = requestApiVersion || azureConfig.api_version;
      let authType = azureConfig.auth_type;
      let deployment = requestDeployment || azureConfig.deployment;

      // Priority 1: Model-specific configuration (if modelName provided)
      if (modelName) {
        const modelConfig = envConfig.azure_openai_models.get(modelName.toLowerCase());
        if (modelConfig) {
          // Use model-specific configuration (model-specific config has priority over requestEndpoint)
          endpoint = modelConfig.endpoint; // Model-specific endpoint takes priority
          apiKey = modelConfig.api_key;
          apiVersion = requestApiVersion || modelConfig.api_version;
          authType = modelConfig.auth_type;
          deployment = requestDeployment || modelName;
        } else {
          // Model name provided but no model-specific config found
          // Fall back to default config but warn in logs
          console.warn(
            `No model-specific configuration found for: ${modelName}. ` +
            `Falling back to default Azure OpenAI configuration. ` +
            `For better control, set environment variables:\n` +
            `  - AZURE_OPENAI_ENDPOINT_${modelName.toUpperCase().replace(/[^A-Z0-9]/g, "_")}\n` +
            `  - AZURE_OPENAI_API_KEY_${modelName.toUpperCase().replace(/[^A-Z0-9]/g, "_")}`
          );
          // Use modelName as deployment if not explicitly provided
          if (!requestDeployment && modelName) {
            deployment = modelName;
          }
        }
      }

      // Validate required fields
      if (!endpoint) {
        throw new Error(
          "Azure OpenAI endpoint is required. " +
          "Please set AZURE_OPENAI_ENDPOINT environment variable or provide endpoint in request."
        );
      }

      if (!apiKey) {
        throw new Error(
          "Azure OpenAI API key is required. " +
          "Please set AZURE_OPENAI_API_KEY environment variable or model-specific API key."
        );
      }

      // Normalize endpoint for lookup
      const normalizedEndpoint = normalizeAzureEndpoint(endpoint);

      // Priority 2: Endpoint-specific configuration (for API key override)
      const endpointConfig = envConfig.azure_openai_endpoints.get(normalizedEndpoint);
      if (endpointConfig) {
        if (endpointConfig.api_key) {
          apiKey = endpointConfig.api_key;
        }
        if (endpointConfig.api_version) {
          apiVersion = endpointConfig.api_version;
        }
        if (endpointConfig.auth_type) {
          authType = endpointConfig.auth_type;
        }
      }

      return {
        provider: "azure-openai",
        endpoint: endpoint,
        deployment: deployment,
        apiKey: apiKey,
        apiVersion: apiVersion,
        authType: authType,
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
