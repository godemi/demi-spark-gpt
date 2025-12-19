/**
 * Represents metadata entry for a parameter, including description and usage information
 * @interface ParameterMetadataEntry
 * @property {string} description - Detailed explanation of the parameter's purpose
 * @property {string} usage - Examples and guidance on how to use the parameter
 */
export interface ParameterMetadataEntry {
  description: string;
  usage: string;
}

/**
 * Contains metadata for all supported parameters in the DemiGPT API
 * Used for API documentation and parameter guidance
 *
 * Structure:
 * - Key: Parameter name
 * - Value: Object containing description and usage information
 *
 * Categories:
 * 1. Model Configuration (temperature, top_p, etc.)
 * 2. Response Control (max_tokens, min_tokens, etc.)
 * 3. System Behavior (system_pre_prompts_*)
 * 4. Input Processing (variables, custom_pre_prompts)
 * 5. Request Metadata (user, stream)
 *
 * @constant
 * @type {Record<string, ParameterMetadataEntry>}
 */
export const PARAMETER_METADATA: Record<string, ParameterMetadataEntry> = {
  best_of: {
    description:
      "Generates multiple completions server-side and returns the best one. This parameter is only available in completion-based models (/completions), not chat models.",
    usage:
      "When used with `n`, `best_of` determines the number of candidate completions, while `n` specifies how many to return.",
  },
  fallback_result_language: {
    description: "Specifies the language for fallback responses.",
    usage:
      "Used when the response must be in a specific language. Accepted values are 'en', 'de', 'fr', and 'es'.",
  },
  frequency_penalty: {
    description:
      "A number between -2.0 and 2.0 that reduces the model's tendency to repeat itself.",
    usage: "Higher values decrease token frequency repetition, while lower values increase it.",
  },
  logit_bias: {
    description: "Allows modifying the likelihood of specified tokens appearing in the completion.",
    usage:
      "Pass a dictionary mapping token IDs to bias values (-100 to 100) to influence token selection.",
  },
  max_tokens: {
    description: "The maximum number of tokens that the model should generate in the completion.",
    usage:
      "Use lower values for shorter responses and higher values for longer responses. The token limit depends on the model used.",
  },
  min_tokens: {
    description: "The minimum number of tokens that the model should generate in the completion.",
    usage:
      "For `min_tokens` to take effect, `system_pre_prompts_generate_min_tokens` must be set to `true`, which ensures a system prompt is generated to enforce the minimum token count.",
  },
  n: {
    description: "How many completions to generate per input prompt.",
    usage: "More completions increase token consumption but offer more variety.",
  },
  presence_penalty: {
    description:
      "A number between -2.0 and 2.0 that controls repetition by discouraging topic reuse.",
    usage:
      "Higher values encourage new topics, while lower values favor repeating existing content.",
  },
  prompt: {
    description: "The input text or list of texts that guide the model's response.",
    usage:
      "Can be a single string or a list of prompts. The model generates responses based on this input.",
  },
  stop: {
    description: "Sequences where the model will stop generating more tokens.",
    usage: "Define up to four stopping sequences to cut off responses at desired points.",
  },
  stream: {
    description:
      "If set to `true`, responses are streamed back in chunks instead of being returned as a full completion. The result differs from the standard API response format without streaming.",
    usage: "Useful for real-time applications requiring incremental output, like chatbots.",
  },
  suffix: {
    description:
      "A suffix that is appended after the model’s generated response. This parameter is only supported for gpt-3.5-turbo-instruct.",
    usage: "Useful for ensuring a specific format or appending structured text.",
  },
  system_pre_prompts_add_emoticons: {
    description: "Adds emoticons to the generated responses.",
    usage: "If set to `true`, the model includes relevant emoticons to enhance emotional tone.",
  },
  system_pre_prompts_brief_response: {
    description: "Forces the model to generate more concise responses.",
    usage: "If set to `true`, the output is shortened while maintaining informativeness.",
  },
  system_pre_prompts_global: {
    description: "Enables predefined system prompts to modify model behavior.",
    usage:
      "If set to `true`, predefined behavior-modifying system prompts are applied before processing the request.",
  },
  system_pre_prompts_explain_technical_terms: {
    description: "Explains complex or technical terms in simpler language.",
    usage: "If set to `true`, the model expands on technical jargon and provides definitions.",
  },
  system_pre_prompts_format_as_markdown: {
    description: "Formats the output in Markdown.",
    usage:
      "If set to `true`, responses will be structured using Markdown syntax for better readability.",
  },
  system_pre_prompts_generate_min_tokens: {
    description: "Activates a system prompt to ensure the model generates at least `min_tokens`.",
    usage:
      "If set to `true`, the system ensures the `min_tokens` constraint is met. Without this, the model might generate fewer tokens than specified.",
  },
  system_pre_prompts_non_expert_mode: {
    description: "Simplifies explanations for non-expert users.",
    usage:
      "If set to `true`, the model tailors responses to a general audience with minimal technical complexity.",
  },
  temperature: {
    description: "Controls randomness in responses: higher values increase creativity.",
    usage: "Use `0.9` for creative tasks and `0.0` for deterministic, factual responses.",
  },
  top_p: {
    description: "Alternative to temperature: limits token selection to the top probability mass.",
    usage:
      "`0.1` means only the top 10% probability tokens are considered for response generation.",
  },
  user: {
    description: "Unique identifier for the end-user making the request.",
    usage: "Useful for tracking usage, rate limiting, or abuse prevention.",
  },
  variables: {
    description:
      "A list of structured key-value pairs representing dynamic variables used in the prompt.",
    usage: "Used to insert structured data into the prompt dynamically.",
  },
  custom_pre_prompts: {
    description: "User-defined pre-prompts that influence model behavior before processing.",
    usage:
      "Allows defining additional instructions that modify how the model interprets input prompts.",
  },
  system_prompt: {
    description: "Root system instruction(s) applied before any pre-prompts or history.",
    usage:
      "Use to set global behavior/context. Accepts a string or array of strings; each becomes a system message.",
  },
  history: {
    description: "Array of prior messages to include in context.",
    usage:
      "Provide ordered chat messages with roles system|user|assistant. Combined with history_window/history_strategy to limit size.",
  },
  history_window: {
    description: "Number of trailing history messages to include when using last_n strategy.",
    usage:
      "Defaults to a small number (e.g., 3). Helps bound prompt size without truncation logic.",
  },
  history_strategy: {
    description: "Strategy for selecting history: include all, last N, or trim to a token budget.",
    usage:
      "Valid values: last_n, token_budget, all. Use with history_window or max_history_tokens.",
  },
  max_history_tokens: {
    description: "Token budget used when history_strategy is token_budget.",
    usage:
      "Approximate token budget for history. Messages beyond the budget are dropped from oldest to newest.",
  },
};
