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
 * @returns The value of the environment variable
 * @throws {APIException} If the environment variable is not set
 *
 * Usage:
 * ```typescript
 * const apiKey = getEnvVar('AZURE_OPENAI_API_KEY');
 * const endpoint = getEnvVar('AZURE_OPENAI_ENDPOINT');
 * ```
 *
 * Required Environment Variables:
 * - AZURE_OPENAI_API_KEY: API key for Azure OpenAI service
 * - AZURE_OPENAI_ENDPOINT: Endpoint URL for Azure OpenAI service
 */
export const getEnvVar = (key: string): string => {
  const value = process.env[key];
  console.log(`Loading ENV Variable ${key}`);

  if (!value) {
    throw new APIException(
      `The ENV Variable named ${key} is not set. Please adjust the Azure Function ENV settings.`,
      400,
      "ENV_VARIABLE_MISSING"
    );
  }

  return value;
};
