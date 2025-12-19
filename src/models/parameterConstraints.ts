import { z } from "zod";

/**
 * Defines the valid types for parameters used in Azure OpenAI requests
 * @type {string} "int" - Integer values only
 * @type {string} "float" - Floating point values allowed
 */
export type ParameterType = "int" | "float";

/**
 * Defines the structure for parameter constraints
 * Used to validate and document Azure OpenAI API parameters
 *
 * @interface ParameterConstraint
 * @property {number} min - Minimum allowed value for the parameter
 * @property {number | null} max - Maximum allowed value (null for unbounded)
 * @property {ParameterType} type - Parameter type (int or float)
 * @property {string} description - Human-readable description of the parameter
 */
export interface ParameterConstraint {
  min: number;
  max: number | null;
  type: ParameterType;
  description: string;
}

/**
 * Defines constraints for all supported Azure OpenAI API parameters
 * Used for parameter validation and documentation generation
 *
 * @constant
 * @type {Record<string, ParameterConstraint>}
 */
export const PARAMETER_CONSTRAINTS: Record<string, ParameterConstraint> = {
  best_of: {
    min: 2,
    max: null,
    type: "int",
    description: "Number of server-side completion alternatives to generate",
  },
  frequency_penalty: {
    min: -2.0,
    max: 2.0,
    type: "float",
    description: "Penalty for token frequency in generated text",
  },
  max_tokens: {
    min: 1,
    max: 32768,
    type: "int",
    description: "Maximum number of tokens to generate",
  },
  min_tokens: {
    min: 1,
    max: 32768,
    type: "int",
    description: "Minimum number of tokens to generate",
  },
  n: {
    min: 1,
    max: null,
    type: "int",
    description: "Number of completions to generate",
  },
  presence_penalty: {
    min: -2.0,
    max: 2.0,
    type: "float",
    description: "Penalty for token presence in generated text",
  },
  temperature: {
    min: 0.0,
    max: 2.0,
    type: "float",
    description: "Sampling temperature for token generation",
  },
  top_p: {
    min: 0.0,
    max: 1.0,
    type: "float",
    description: "Nucleus sampling probability threshold",
  },
  history_window: {
    min: 1,
    max: 100,
    type: "int",
    description: "Maximum number of history messages to include",
  },
  max_history_tokens: {
    min: 32,
    max: 32768,
    type: "int",
    description: "Token budget for history inclusion when using token_budget strategy",
  },
} as const;

/**
 * Zod schema for runtime validation of parameter constraints
 * Ensures all constraints follow the required structure
 *
 * @constant
 * @type {z.ZodObject}
 */
export const ParameterConstraintSchema = z.object({
  min: z.number(),
  max: z.number().nullable(),
  type: z.enum(["int", "float"]),
  description: z.string(),
});

/**
 * Type for parameter names derived from constraints
 * Provides type safety when referencing parameters
 *
 * @type {string}
 */
export type ParameterName = keyof typeof PARAMETER_CONSTRAINTS;
