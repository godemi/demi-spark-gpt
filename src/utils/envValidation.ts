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
 */
const REQUIRED_AZURE_OPENAI_VARS = [
  "AZURE_OPENAI_ENDPOINT",
  "AZURE_OPENAI_API_KEY",
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
 */
export function validateAzureOpenAIEnv(): EnvValidationResult {
  const missing: string[] = [];
  const warnings: string[] = [];

  // Check required variables
  for (const varName of REQUIRED_AZURE_OPENAI_VARS) {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  }

  // Check optional variables and warn if missing
  if (!process.env.AZURE_OPENAI_DEPLOYMENT) {
    warnings.push(
      "AZURE_OPENAI_DEPLOYMENT is not set. Using default: gpt-5-nano"
    );
  }

  if (!process.env.AZURE_OPENAI_API_VERSION) {
    warnings.push(
      "AZURE_OPENAI_API_VERSION is not set. Using default: 2024-12-01-preview"
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

1. AZURE_OPENAI_ENDPOINT
   - Your Azure OpenAI endpoint URL
   - Example: https://your-resource.openai.azure.com
   - Can be found in Azure Portal > Azure OpenAI > Keys and Endpoint

2. AZURE_OPENAI_API_KEY
   - Your Azure OpenAI API key
   - Can be found in Azure Portal > Azure OpenAI > Keys and Endpoint

Optional Environment Variables:

3. AZURE_OPENAI_DEPLOYMENT (default: gpt-5-nano)
   - The deployment name for your model
   - Examples: gpt-5.2, gpt-5-nano, gpt-4o

4. AZURE_OPENAI_API_VERSION (default: 2024-12-01-preview)
   - The API version to use
   - Recommended: 2024-12-01-preview for GPT-5 models

5. AZURE_OPENAI_AUTH_TYPE (default: api-key)
   - Authentication type: "api-key" or "aad"
   - Use "aad" for Azure AD authentication

Setting Environment Variables:

For Azure Functions (local.settings.json):
{
  "Values": {
    "AZURE_OPENAI_ENDPOINT": "https://your-resource.openai.azure.com",
    "AZURE_OPENAI_API_KEY": "your-api-key",
    "AZURE_OPENAI_DEPLOYMENT": "gpt-5-nano",
    "AZURE_OPENAI_API_VERSION": "2024-12-01-preview"
  }
}

For local development (.env file):
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com
AZURE_OPENAI_API_KEY=your-api-key
AZURE_OPENAI_DEPLOYMENT=gpt-5-nano
AZURE_OPENAI_API_VERSION=2024-12-01-preview

For production (Azure Portal):
Go to Function App > Configuration > Application settings
`;
}

