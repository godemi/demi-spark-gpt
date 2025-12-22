/**
 * Model Selector
 *
 * Resolves model selection from either:
 * 1. Direct model specification (e.g., model: "gpt-5.2")
 * 2. Task profile specification (e.g., task_profile: "fast")
 * 3. Default model from environment configuration
 *
 * Priority: direct model > task_profile > default
 */

import { ReasoningEffort, TaskProfile as TaskProfileType } from "../models/chatCompletionTypes";
import { TASK_PROFILES, getTaskProfile } from "./taskProfiles";

/**
 * Resolved model configuration
 */
export interface ResolvedModel {
  /** Model name/deployment */
  model: string;
  /** Deployment name (typically same as model) */
  deployment: string;
  /** Reasoning effort for GPT-5 models */
  reasoning_effort?: ReasoningEffort;
  /** Temperature override from profile */
  temperature?: number;
  /** Max completion tokens override from profile */
  max_completion_tokens?: number;
  /** How the model was resolved */
  source: "direct" | "task_profile" | "default";
  /** Task profile name if resolved from profile */
  task_profile?: string;
}

/**
 * Options for model resolution
 */
export interface ResolveModelOptions {
  /** Direct model specification from request */
  requestModel?: string;
  /** Task profile from request */
  taskProfile?: TaskProfileType;
  /** Default model from environment/config */
  defaultModel?: string;
  /** Default deployment from environment/config */
  defaultDeployment?: string;
}

/**
 * Resolve model from request parameters
 *
 * Resolution priority:
 * 1. Direct model specification takes priority
 * 2. Task profile resolves to model + settings
 * 3. Default model from configuration
 *
 * @param options - Model resolution options
 * @returns Resolved model configuration
 * @throws Error if task profile is invalid
 */
export function resolveModel(options: ResolveModelOptions): ResolvedModel {
  const {
    requestModel,
    taskProfile,
    defaultModel = "gpt-5-nano",
    defaultDeployment,
  } = options;

  // 1. Direct model selection takes priority
  if (requestModel) {
    return {
      model: requestModel,
      deployment: requestModel,
      source: "direct",
    };
  }

  // 2. Task profile resolution
  if (taskProfile) {
    const profile = getTaskProfile(taskProfile);
    if (!profile) {
      throw new Error(`Unknown task profile: ${taskProfile}. Valid profiles: ${Object.keys(TASK_PROFILES).join(", ")}`);
    }

    return {
      model: profile.model,
      deployment: profile.model,
      reasoning_effort: profile.reasoning_effort,
      temperature: profile.temperature,
      max_completion_tokens: profile.max_completion_tokens,
      source: "task_profile",
      task_profile: taskProfile,
    };
  }

  // 3. Default model from config (should rarely happen due to schema validation)
  // This is a fallback, but the request should have specified a model or task_profile
  if (!defaultModel) {
    throw new Error(
      "No model specified in request and no default model configured. " +
      "Please specify either 'model' or 'task_profile' in your request."
    );
  }
  
  return {
    model: defaultModel,
    deployment: defaultDeployment || defaultModel,
    source: "default",
  };
}

/**
 * Apply resolved model settings to a request
 *
 * Merges profile-derived settings with explicit request parameters,
 * where explicit request parameters take precedence.
 *
 * @param resolved - Resolved model configuration
 * @param requestParams - Original request parameters
 * @returns Merged parameters with model settings applied
 */
export function applyResolvedModelSettings<T extends Record<string, unknown>>(
  resolved: ResolvedModel,
  requestParams: T
): T & { model: string; reasoning_effort?: ReasoningEffort } {
  const result: Record<string, unknown> = { ...requestParams };

  // Always set the resolved model
  result.model = resolved.model;

  // Apply profile settings only if not explicitly set in request
  if (resolved.source === "task_profile") {
    // Apply reasoning_effort if not explicitly set
    if (resolved.reasoning_effort && !result.reasoning_effort) {
      result.reasoning_effort = resolved.reasoning_effort;
    }

    // Apply temperature if not explicitly set
    if (resolved.temperature !== undefined && result.temperature === undefined) {
      result.temperature = resolved.temperature;
    }

    // Apply max_completion_tokens if not explicitly set
    if (resolved.max_completion_tokens !== undefined && result.max_completion_tokens === undefined) {
      result.max_completion_tokens = resolved.max_completion_tokens;
    }
  }

  return result as T & { model: string; reasoning_effort?: ReasoningEffort };
}

/**
 * Get a human-readable description of how the model was resolved
 */
export function describeResolution(resolved: ResolvedModel): string {
  switch (resolved.source) {
    case "direct":
      return `Using directly specified model: ${resolved.model}`;
    case "task_profile":
      return `Using task profile "${resolved.task_profile}" → model: ${resolved.model}${resolved.reasoning_effort ? `, reasoning_effort: ${resolved.reasoning_effort}` : ""}`;
    case "default":
      return `Using default model: ${resolved.model}`;
    default:
      return `Using model: ${resolved.model}`;
  }
}

