/**
 * Provider Adapters Export
 *
 * Central export point for all provider adapters and utilities
 */

export { AzureOpenAIAdapter } from "./azureOpenAIAdapter";
export { OpenAIAdapter } from "./openaiAdapter";
export { AzureFoundryAdapter } from "./azureFoundryAdapter";
export type {
  ProviderAdapter,
  ProviderConfig,
  ProviderRequest,
  ModelCapabilities,
  ProviderError,
} from "./types";
export {
  MODEL_REGISTRY,
  getModelCapabilities,
  hasCapability,
  getModelsForProvider,
} from "./modelRegistry";

import { AzureOpenAIAdapter } from "./azureOpenAIAdapter";
import { OpenAIAdapter } from "./openaiAdapter";
import { AzureFoundryAdapter } from "./azureFoundryAdapter";
import { ProviderAdapter } from "./types";

/**
 * Get provider adapter by name
 */
export function getProviderAdapter(provider: string): ProviderAdapter | null {
  switch (provider) {
    case "azure-openai":
      return new AzureOpenAIAdapter();
    case "openai":
      return new OpenAIAdapter();
    case "azure-ai-foundry":
      return new AzureFoundryAdapter();
    default:
      return null;
  }
}
