import { z } from "zod";

/**
 * Type Definitions for SparkGPT API
 *
 * This file contains all type definitions and schemas used throughout the application.
 * It uses Zod for runtime type validation and TypeScript for static typing.
 */

/**
 * Variable Type Definitions
 * @description Represents dynamic variables that can be injected into prompts
 */
export const VariableTypeSchema = z.object({
  name: z.string(), // Identifier for the variable
  description: z.string(), // Human-readable description
  value: z.string(), // The actual value to be used
  type: z.enum([
    // Supported data types
    "string",
    "iso-8601",
    "integer",
    "float",
    "boolean",
    "timestamp",
  ]),
});
export type VariableType = z.infer<typeof VariableTypeSchema>;

/**
 * Custom Pre-Prompt Type Definitions
 * @description Defines structure for user-provided pre-prompts
 */
export const CustomPrePromptTypeSchema = z.object({
  name: z.string(), // Identifier for the pre-prompt
  description: z.string(), // Purpose/description of the pre-prompt
  role: z.enum([
    // Role in the conversation
    "system", // System-level instructions
    "user", // User context/preferences
    "assistant", // Assistant behavior modifications
  ]),
  text: z.string(), // The actual pre-prompt content
});
export type CustomPrePromptType = z.infer<typeof CustomPrePromptTypeSchema>;

/**
 * Valid Pre-Prompt Roles
 * @description Defines allowable roles for pre-prompts
 */
export const VALID_PRE_PROMPT_ROLES: Set<string> = new Set([
  "system_pre_prompts",
  "user_pre_prompts",
  "assistant_pre_prompts",
]);

/**
 * PrePromptType: Represents a structured pre-prompt.
 */
export const PrePromptTypeSchema = z.object({
  role: z.enum(["system", "user", "assistant"]).optional(),
  type: z.string(),
  text: z.string(),
});
export type PrePromptType = z.infer<typeof PrePromptTypeSchema>;

/**
 * SparkGPTInputParametersType: Represents the input parameters for a SparkGPT request.
 */
export const SparkGPTInputParametersSchema = z.object({
  // Main prompt(s)
  prompt: z.union([z.string(), z.array(z.string())]),
  // Optional streaming flag
  stream: z.boolean().optional(),
  // Required parameters
  temperature: z.number(),
  max_tokens: z.number(),
  fallback_result_language: z.enum(["en", "de", "fr", "es"]),
  // Optional parameters (added best_of property)
  best_of: z.number().optional(),
  frequency_penalty: z.number().optional(),
  logit_bias: z.record(z.number()).optional(),
  min_tokens: z.number().optional(),
  n: z.number().optional(),
  presence_penalty: z.number().optional(),
  stop: z.union([z.string(), z.array(z.string())]).optional(),
  suffix: z.string().optional(),
  // System pre-prompt configurations (required)
  system_pre_prompts_global: z.boolean(),
  system_pre_prompts_generate_min_tokens: z.boolean(),
  system_pre_prompts_explain_technical_terms: z.boolean(),
  system_pre_prompts_non_expert_mode: z.boolean(),
  system_pre_prompts_brief_response: z.boolean(),
  system_pre_prompts_add_emoticons: z.boolean(),
  system_pre_prompts_format_as_markdown: z.boolean(),
  // Other required parameters
  top_p: z.number(),
  // Optional user identifier
  user: z.string().optional(),
  // Optional lists
  variables: z.array(VariableTypeSchema).optional(),
  custom_pre_prompts: z.array(CustomPrePromptTypeSchema).optional(),
  // New parameter for overwriting system pre-prompts
  overwrite_system_pre_prompts: z
    .array(
      z.object({
        name: z.enum([
          "system_pre_prompts_global",
          "system_pre_prompts_explain_technical_terms",
          "system_pre_prompts_non_expert_mode",
          "system_pre_prompts_brief_response",
          "system_pre_prompts_add_emoticons",
          "system_pre_prompts_format_as_markdown",
        ]),
        prompt: z.string(),
      })
    )
    .optional(),
});

export type SparkGPTInputParametersType = z.infer<typeof SparkGPTInputParametersSchema>;

/**
 * SparkGPTProcessedParametersType: Extends the input parameters with pre-prompt arrays.
 */
export const SparkGPTProcessedParametersSchema = SparkGPTInputParametersSchema.extend({
  pre_prompts: z.array(PrePromptTypeSchema),
});
export type SparkGPTProcessedParametersType = z.infer<typeof SparkGPTProcessedParametersSchema>;

/**
 * DEFAULT_SPARK_GPT_PARAMETERS: Default values for SparkGPT parameters.
 */
export const DEFAULT_SPARK_GPT_PARAMETERS: SparkGPTProcessedParametersType = {
  prompt: "",
  stream: false,
  temperature: 0.7,
  max_tokens: 1600,
  fallback_result_language: "en",
  best_of: undefined as number | undefined,
  frequency_penalty: undefined as number | undefined,
  logit_bias: undefined as Record<string, number> | undefined,
  min_tokens: undefined as number | undefined,
  n: undefined as number | undefined,
  presence_penalty: undefined as number | undefined,
  stop: undefined as string | string[] | undefined,
  suffix: undefined as string | undefined,
  system_pre_prompts_global: true,
  system_pre_prompts_generate_min_tokens: false,
  system_pre_prompts_explain_technical_terms: false,
  system_pre_prompts_non_expert_mode: false,
  system_pre_prompts_brief_response: false,
  system_pre_prompts_add_emoticons: false,
  system_pre_prompts_format_as_markdown: false,
  top_p: 0.95,
  user: undefined as string | undefined,
  variables: [],
  custom_pre_prompts: [],
  pre_prompts: [],
  overwrite_system_pre_prompts: [],
};

/**
 * OFFICIAL_AZURE_OPENAI_CHATGPT_PARAMETERS: List of official parameters.
 */
export const OFFICIAL_AZURE_OPENAI_CHATGPT_PARAMETERS: string[] = [
  "temperature",
  "top_p",
  "max_tokens",
  "best_of",
  "frequency_penalty",
  "presence_penalty",
  "logit_bias",
  "stop",
  "stream",
  "suffix",
  "n",
  "user",
];

/**
 * AzureChatGPTRequestParameterType: Defines parameters for an Azure OpenAI GPT request.
 */
export const AzureChatGPTRequestParameterSchema = z.object({
  messages: z.array(z.record(z.string())),
  fallback_result_language: z.enum(["en", "de", "fr", "es"]).optional(),
  temperature: z.number(),
  top_p: z.number(),
  max_tokens: z.number(),
  min_tokens: z.number().optional(),
  n: z.number().optional(),
  best_of: z.number().optional(),
  frequency_penalty: z.number().optional(),
  presence_penalty: z.number().optional(),
  logit_bias: z.record(z.number()).optional(),
  stop: z.union([z.string(), z.array(z.string())]).optional(),
  stream: z.boolean().optional(),
  suffix: z.string().optional(),
  user: z.string().optional(),
});
export type AzureChatGPTRequestParameterType = z.infer<typeof AzureChatGPTRequestParameterSchema>;

/**
 * JSONValue represents any valid JSON value.
 */
export type JSONValue = string | number | boolean | null | JSONObject | JSONArray;

export interface JSONObject {
  [key: string]: JSONValue;
}

export interface JSONArray extends Array<JSONValue> {}

/**
 * AzureChatGPTResponse represents the structured response from an Azure OpenAI request,
 * where `response`, `payload`, and `headers` can be any valid JSON type.
 */
export interface AzureChatGPTResponse {
  version: string;
  time: number;
  response: JSONValue;
  payload: JSONValue;
  headers: JSONValue;
  parameters: JSONValue;
}
