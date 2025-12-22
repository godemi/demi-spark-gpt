/**
 * Task Profile System
 *
 * Defines task profiles that map to optimal model configurations,
 * enabling users to select models by task type rather than model name.
 *
 * Example usage:
 *   { task_profile: "fast", messages: [...] }  // Uses gpt-5-nano with no reasoning
 *   { task_profile: "reasoning", messages: [...] }  // Uses gpt-5.2 with high reasoning
 */

import { ReasoningEffort } from "../models/chatCompletionTypes";

/**
 * Task profile configuration
 */
export interface TaskProfile {
  /** Profile identifier */
  name: string;
  /** Human-readable description of the profile */
  description: string;
  /** Model to use for this profile */
  model: string;
  /** Reasoning effort level for GPT-5 models */
  reasoning_effort?: ReasoningEffort;
  /** Temperature override (0.0-2.0) */
  temperature?: number;
  /** Maximum completion tokens override */
  max_completion_tokens?: number;
}

/**
 * Task profiles mapping
 *
 * Each profile defines the optimal model and settings for a specific use case.
 */
export const TASK_PROFILES: Record<string, TaskProfile> = {
  /**
   * Fast profile - optimized for speed and low latency
   * Use cases: Intent detection, quick decisions, simple classifications
   */
  fast: {
    name: "fast",
    description: "Quick responses for intent detection, simple decisions",
    model: "gpt-5-nano",
    reasoning_effort: "none",
  },

  /**
   * Balanced profile - good quality/speed trade-off
   * Use cases: General purpose tasks, moderate complexity
   */
  balanced: {
    name: "balanced",
    description: "Good quality/speed trade-off for general tasks",
    model: "gpt-5-nano",
    reasoning_effort: "medium",
  },

  /**
   * Reasoning profile - optimized for complex analysis
   * Use cases: Multi-step problems, analytical tasks, code generation
   */
  reasoning: {
    name: "reasoning",
    description: "Complex analysis, multi-step problem solving",
    model: "gpt-5.2",
    reasoning_effort: "high",
  },

  /**
   * Deep reasoning profile - maximum reasoning capability
   * Use cases: Research-level tasks, complex reasoning chains
   */
  deep_reasoning: {
    name: "deep_reasoning",
    description: "Maximum reasoning for research-level tasks",
    model: "gpt-5.2",
    reasoning_effort: "xhigh",
  },

  /**
   * Creative profile - optimized for creative tasks
   * Use cases: Creative writing, brainstorming, idea generation
   */
  creative: {
    name: "creative",
    description: "Creative writing, brainstorming, idea generation",
    model: "gpt-5.2",
    reasoning_effort: "medium",
    temperature: 0.9,
  },

  /**
   * Cost effective profile - budget-conscious option
   * Use cases: High-volume simple tasks, basic completions
   */
  cost_effective: {
    name: "cost_effective",
    description: "Budget-conscious for high-volume simple tasks",
    model: "gpt-5-nano",
    reasoning_effort: "low",
  },
};

/**
 * Get a task profile by name
 */
export function getTaskProfile(name: string): TaskProfile | null {
  return TASK_PROFILES[name] || null;
}

/**
 * Get all available task profile names
 */
export function getTaskProfileNames(): string[] {
  return Object.keys(TASK_PROFILES);
}

/**
 * Check if a task profile exists
 */
export function isValidTaskProfile(name: string): boolean {
  return name in TASK_PROFILES;
}

