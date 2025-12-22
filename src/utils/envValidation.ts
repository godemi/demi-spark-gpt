/**
 * Environment Variable Validation
 *
 * Validates required environment variables at startup and provides
 * helpful error messages if they are missing.
 */

import { getEnvVar } from "./config";

export interface EnvValidationResult {
  valid: boolean;
  missing: string[];
  warnings: string[];
}

/**
 * Required environment variables for Azure OpenAI
 * Note: Model-specific configurations are required (AZURE_OPENAI_ENDPOINT_<MODEL>, etc.)
 * These defaults are only used as fallback values for optional fields.
 */
const REQUIRED_AZURE_OPENAI_VARS = [
  // No longer required - model-specific configs are required instead
] as const;

/**
 * Optional but recommended environment variables
 */
const OPTIONAL_VARS = [
  "AZURE_OPENAI_DEPLOYMENT",
  "AZURE_OPENAI_API_VERSION",
  "AZURE_OPENAI_AUTH_TYPE",
] as const;

/**
 * Validate environment variables for Azure OpenAI provider
 * 
 * Note: Model-specific configurations are required at runtime.
 * This validation only checks for default/fallback values.
 */
export function validateAzureOpenAIEnv(): EnvValidationResult {
  const missing: string[] = [];
  const warnings: string[] = [];

  // Check required variables (none for defaults - model-specific configs are required at runtime)
  for (const varName of REQUIRED_AZURE_OPENAI_VARS) {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  }

  // Check for model-specific configurations
  const modelConfigs: string[] = [];
  for (const [key] of Object.entries(process.env)) {
    if (key.startsWith("AZURE_OPENAI_ENDPOINT_") && !key.includes("_API_KEY_") && !key.includes("_API_VERSION_") && !key.includes("_AUTH_TYPE_")) {
      const modelName = key.replace("AZURE_OPENAI_ENDPOINT_", "").toLowerCase().replace(/_/g, "-");
      modelConfigs.push(modelName);
    }
  }

  if (modelConfigs.length === 0) {
    warnings.push(
      "No model-specific configurations found. " +
      "You must configure at least one model using AZURE_OPENAI_ENDPOINT_<MODEL> and AZURE_OPENAI_API_KEY_<MODEL>."
    );
  } else {
    console.log(`✅ Found ${modelConfigs.length} model-specific configuration(s): ${modelConfigs.join(", ")}`);
  }

  // Check optional default variables and warn if missing
  if (!process.env.AZURE_OPENAI_DEPLOYMENT) {
    warnings.push(
      "AZURE_OPENAI_DEPLOYMENT is not set. Using default: gpt-5-nano (only used as fallback)"
    );
  }

  if (!process.env.AZURE_OPENAI_API_VERSION) {
    warnings.push(
      "AZURE_OPENAI_API_VERSION is not set. Using default: 2024-12-01-preview (only used as fallback for model-specific configs)"
    );
  }

  return {
    valid: missing.length === 0,
    missing,
    warnings,
  };
}

/**
 * Validate all environment variables and print helpful messages
 */
export function validateEnvironmentVariables(): void {
  console.log("🔍 Validating environment variables...\n");

  const azureResult = validateAzureOpenAIEnv();

  if (!azureResult.valid) {
    console.error("❌ Missing required environment variables for Azure OpenAI:\n");
    for (const varName of azureResult.missing) {
      console.error(`   - ${varName}`);
    }
    console.error("\n📝 Please set the following environment variables:");
    console.error("\n   For Azure Functions (local.settings.json):");
    console.error("   {");
    console.error('     "Values": {');
    for (const varName of azureResult.missing) {
      console.error(`       "${varName}": "your-value-here",`);
    }
    console.error("     }");
    console.error("   }");
    console.error("\n   For local development (.env file):");
    for (const varName of azureResult.missing) {
      console.error(`   ${varName}=your-value-here`);
    }
    console.error(
      "\n⚠️  The application may not function correctly without these variables.\n"
    );
  } else {
    console.log("✅ All required environment variables are set.\n");
  }

  if (azureResult.warnings.length > 0) {
    console.log("⚠️  Warnings:\n");
    for (const warning of azureResult.warnings) {
      console.log(`   - ${warning}`);
    }
    console.log();
  }

  // Check for optional providers
  if (process.env.OPENAI_API_KEY) {
    console.log("✅ OpenAI provider configuration detected.");
  }

  if (process.env.AZURE_FOUNDRY_ENDPOINT) {
    console.log("✅ Azure AI Foundry provider configuration detected.");
  }

  console.log("\n📚 For more information, see:");
  console.log("   - local.settings.json (Azure Functions)");
  console.log("   - .env file (local development)");
  console.log("   - Azure Portal > Function App > Configuration (production)\n");
}

/**
 * Get a formatted list of required environment variables
 */
export function getRequiredEnvVarsMessage(): string {
  return `
Required Environment Variables for Azure OpenAI:

Model-Specific Configuration (REQUIRED for each model you want to use):

For each model (e.g., gpt-5.2, gpt-5-nano, gpt-4o), you must set:
  - AZURE_OPENAI_ENDPOINT_<MODEL_NAME>
  - AZURE_OPENAI_API_KEY_<MODEL_NAME>
  - AZURE_OPENAI_API_VERSION_<MODEL_NAME> (optional, defaults to 2024-12-01-preview)
  - AZURE_OPENAI_AUTH_TYPE_<MODEL_NAME> (optional, defaults to api-key)

Example for gpt-5.2:
  - AZURE_OPENAI_ENDPOINT_GPT_5_2=https://your-resource.openai.azure.com
  - AZURE_OPENAI_API_KEY_GPT_5_2=your-api-key
  - AZURE_OPENAI_API_VERSION_GPT_5_2=2024-12-01-preview
  - AZURE_OPENAI_AUTH_TYPE_GPT_5_2=api-key

Example for gpt-5-nano:
  - AZURE_OPENAI_ENDPOINT_GPT_5_NANO=https://your-resource.openai.azure.com
  - AZURE_OPENAI_API_KEY_GPT_5_NANO=your-api-key

Optional Default/Fallback Variables (used only as defaults for model-specific configs):

  - AZURE_OPENAI_DEPLOYMENT (default: gpt-5-nano)
    Only used as fallback when no model is specified (should not happen due to schema validation)

  - AZURE_OPENAI_API_VERSION (default: 2024-12-01-preview)
    Used as default API version for model-specific configs if not specified

  - AZURE_OPENAI_AUTH_TYPE (default: api-key)
    Used as default auth type for model-specific configs if not specified

Setting Environment Variables:

For Azure Functions (local.settings.json):
{
  "Values": {
    "AZURE_OPENAI_ENDPOINT_GPT_5_2": "https://your-resource.openai.azure.com",
    "AZURE_OPENAI_API_KEY_GPT_5_2": "your-api-key",
    "AZURE_OPENAI_API_VERSION_GPT_5_2": "2024-12-01-preview",
    "AZURE_OPENAI_ENDPOINT_GPT_5_NANO": "https://your-resource.openai.azure.com",
    "AZURE_OPENAI_API_KEY_GPT_5_NANO": "your-api-key"
  }
}

For production (Azure Portal):
Go to Function App > Configuration > Application settings
`;
}

