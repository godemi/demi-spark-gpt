import * as dotenv from "dotenv";
import { APIException } from "./exceptions";

/**
 * Initialize environment variables from .env file
 * This should be called at application startup
 */
dotenv.config();

/**
 * Retrieves and validates environment variables
 *
 * @param key - Name of the environment variable to retrieve
 * @param defaultValue - Optional default value if variable is not set
 * @returns The value of the environment variable or default
 * @throws {APIException} If the environment variable is not set and no default provided
 *
 * Usage:
 * ```typescript
 * const apiKey = getEnvVar('AZURE_OPENAI_API_KEY');
 * const endpoint = getEnvVar('AZURE_OPENAI_ENDPOINT');
 * const optional = getEnvVar('OPTIONAL_VAR', 'default');
 * ```
 *
 * Required Environment Variables:
 * - AZURE_OPENAI_API_KEY: API key for Azure OpenAI service
 * - AZURE_OPENAI_ENDPOINT: Endpoint URL for Azure OpenAI service
 */
export const getEnvVar = (key: string, defaultValue?: string): string => {
  const value = process.env[key];
  console.log(`Loading ENV Variable ${key}`);

  if (!value) {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    throw new APIException(
      `The ENV Variable named ${key} is not set. Please adjust the Azure Function ENV settings.`,
      400,
      "ENV_VARIABLE_MISSING"
    );
  }

  return value;
};
