import { describe, it, expect } from "vitest";
import {
  resolveModel,
  applyResolvedModelSettings,
  describeResolution,
  ResolvedModel,
  ResolveModelOptions,
} from "../../../providers/modelSelector";
import { TASK_PROFILES } from "../../../providers/taskProfiles";

/**
 * Unit tests for model selector
 */
describe("Model Selector", () => {
  describe("resolveModel", () => {
    it("should prioritize direct model over task profile", () => {
      const options: ResolveModelOptions = {
        requestModel: "gpt-5.2",
        taskProfile: "fast",
        defaultModel: "gpt-5-nano",
      };

      const resolved = resolveModel(options);

      expect(resolved.model).toBe("gpt-5.2");
      expect(resolved.deployment).toBe("gpt-5.2");
      expect(resolved.source).toBe("direct");
      expect(resolved.task_profile).toBeUndefined();
    });

    it("should resolve from task profile when no direct model", () => {
      const options: ResolveModelOptions = {
        taskProfile: "fast",
        defaultModel: "gpt-5-nano",
      };

      const resolved = resolveModel(options);

      expect(resolved.model).toBe("gpt-5-nano");
      expect(resolved.deployment).toBe("gpt-5-nano");
      expect(resolved.source).toBe("task_profile");
      expect(resolved.task_profile).toBe("fast");
      expect(resolved.reasoning_effort).toBe("none");
    });

    it("should resolve from default when no model or profile", () => {
      const options: ResolveModelOptions = {
        defaultModel: "gpt-5-nano",
        defaultDeployment: "gpt-5-nano",
      };

      const resolved = resolveModel(options);

      expect(resolved.model).toBe("gpt-5-nano");
      expect(resolved.deployment).toBe("gpt-5-nano");
      expect(resolved.source).toBe("default");
    });

    it("should use default deployment when provided", () => {
      const options: ResolveModelOptions = {
        defaultModel: "gpt-5.2",
        defaultDeployment: "custom-deployment",
      };

      const resolved = resolveModel(options);

      expect(resolved.model).toBe("gpt-5.2");
      expect(resolved.deployment).toBe("custom-deployment");
    });

    it("should throw error for invalid task profile", () => {
      const options: ResolveModelOptions = {
        taskProfile: "invalid-profile" as any,
      };

      expect(() => resolveModel(options)).toThrow("Unknown task profile");
    });

    it("should include reasoning_effort from task profile", () => {
      const options: ResolveModelOptions = {
        taskProfile: "reasoning",
      };

      const resolved = resolveModel(options);

      expect(resolved.reasoning_effort).toBe("high");
      expect(resolved.model).toBe("gpt-5.2");
    });

    it("should include temperature from task profile", () => {
      const options: ResolveModelOptions = {
        taskProfile: "creative",
      };

      const resolved = resolveModel(options);

      expect(resolved.temperature).toBe(0.9);
      expect(resolved.reasoning_effort).toBe("medium");
    });

    it("should handle all task profiles correctly", () => {
      for (const [name, profile] of Object.entries(TASK_PROFILES)) {
        const options: ResolveModelOptions = {
          taskProfile: name as any,
        };

        const resolved = resolveModel(options);

        expect(resolved.model).toBe(profile.model);
        expect(resolved.deployment).toBe(profile.model);
        expect(resolved.source).toBe("task_profile");
        expect(resolved.task_profile).toBe(name);

        if (profile.reasoning_effort) {
          expect(resolved.reasoning_effort).toBe(profile.reasoning_effort);
        }
        if (profile.temperature !== undefined) {
          expect(resolved.temperature).toBe(profile.temperature);
        }
      }
    });

    it("should use model as deployment when no deployment specified", () => {
      const options: ResolveModelOptions = {
        requestModel: "gpt-5.2",
      };

      const resolved = resolveModel(options);

      expect(resolved.model).toBe("gpt-5.2");
      expect(resolved.deployment).toBe("gpt-5.2");
    });
  });

  describe("applyResolvedModelSettings", () => {
    it("should always set the resolved model", () => {
      const resolved: ResolvedModel = {
        model: "gpt-5.2",
        deployment: "gpt-5.2",
        source: "direct",
      };

      const requestParams = {
        messages: [{ role: "user", content: "Hello" }],
      };

      const result = applyResolvedModelSettings(resolved, requestParams);

      expect(result.model).toBe("gpt-5.2");
    });

    it("should apply reasoning_effort from task profile if not in request", () => {
      const resolved: ResolvedModel = {
        model: "gpt-5-nano",
        deployment: "gpt-5-nano",
        reasoning_effort: "high",
        source: "task_profile",
        task_profile: "reasoning",
      };

      const requestParams = {
        messages: [{ role: "user", content: "Hello" }],
      };

      const result = applyResolvedModelSettings(resolved, requestParams);

      expect(result.model).toBe("gpt-5-nano");
      expect(result.reasoning_effort).toBe("high");
    });

    it("should not override explicit reasoning_effort in request", () => {
      const resolved: ResolvedModel = {
        model: "gpt-5-nano",
        deployment: "gpt-5-nano",
        reasoning_effort: "high",
        source: "task_profile",
      };

      const requestParams = {
        messages: [{ role: "user", content: "Hello" }],
        reasoning_effort: "low" as const,
      };

      const result = applyResolvedModelSettings(resolved, requestParams);

      expect(result.reasoning_effort).toBe("low"); // Request takes precedence
    });

    it("should apply temperature from task profile if not in request", () => {
      const resolved: ResolvedModel = {
        model: "gpt-5.2",
        deployment: "gpt-5.2",
        temperature: 0.9,
        source: "task_profile",
        task_profile: "creative",
      };

      const requestParams = {
        messages: [{ role: "user", content: "Hello" }],
      };

      const result = applyResolvedModelSettings(resolved, requestParams);

      expect(result.temperature).toBe(0.9);
    });

    it("should not override explicit temperature in request", () => {
      const resolved: ResolvedModel = {
        model: "gpt-5.2",
        deployment: "gpt-5.2",
        temperature: 0.9,
        source: "task_profile",
      };

      const requestParams = {
        messages: [{ role: "user", content: "Hello" }],
        temperature: 0.5,
      };

      const result = applyResolvedModelSettings(resolved, requestParams);

      expect(result.temperature).toBe(0.5); // Request takes precedence
    });

    it("should apply max_completion_tokens from task profile if not in request", () => {
      const resolved: ResolvedModel = {
        model: "gpt-5.2",
        deployment: "gpt-5.2",
        max_completion_tokens: 8192,
        source: "task_profile",
      };

      const requestParams = {
        messages: [{ role: "user", content: "Hello" }],
      };

      const result = applyResolvedModelSettings(resolved, requestParams);

      expect(result.max_completion_tokens).toBe(8192);
    });

    it("should not apply settings from direct model selection", () => {
      const resolved: ResolvedModel = {
        model: "gpt-5.2",
        deployment: "gpt-5.2",
        source: "direct",
      };

      const requestParams = {
        messages: [{ role: "user", content: "Hello" }],
      };

      const result = applyResolvedModelSettings(resolved, requestParams);

      expect(result.model).toBe("gpt-5.2");
      expect(result.reasoning_effort).toBeUndefined();
      expect(result.temperature).toBeUndefined();
    });

    it("should preserve all original request parameters", () => {
      const resolved: ResolvedModel = {
        model: "gpt-5-nano",
        deployment: "gpt-5-nano",
        reasoning_effort: "medium",
        source: "task_profile",
      };

      const requestParams = {
        messages: [{ role: "user", content: "Hello" }],
        stream: true,
        max_tokens: 1000,
        top_p: 0.95,
      };

      const result = applyResolvedModelSettings(resolved, requestParams);

      expect(result.messages).toEqual(requestParams.messages);
      expect(result.stream).toBe(true);
      expect(result.max_tokens).toBe(1000);
      expect(result.top_p).toBe(0.95);
    });
  });

  describe("describeResolution", () => {
    it("should describe direct model selection", () => {
      const resolved: ResolvedModel = {
        model: "gpt-5.2",
        deployment: "gpt-5.2",
        source: "direct",
      };

      const description = describeResolution(resolved);

      expect(description).toContain("directly specified");
      expect(description).toContain("gpt-5.2");
    });

    it("should describe task profile resolution", () => {
      const resolved: ResolvedModel = {
        model: "gpt-5-nano",
        deployment: "gpt-5-nano",
        reasoning_effort: "none",
        source: "task_profile",
        task_profile: "fast",
      };

      const description = describeResolution(resolved);

      expect(description).toContain("task profile");
      expect(description).toContain("fast");
      expect(description).toContain("gpt-5-nano");
      expect(description).toContain("reasoning_effort: none");
    });

    it("should describe default model selection", () => {
      const resolved: ResolvedModel = {
        model: "gpt-5-nano",
        deployment: "gpt-5-nano",
        source: "default",
      };

      const description = describeResolution(resolved);

      expect(description).toContain("default model");
      expect(description).toContain("gpt-5-nano");
    });

    it("should not include reasoning_effort if not present", () => {
      const resolved: ResolvedModel = {
        model: "gpt-5-nano",
        deployment: "gpt-5-nano",
        source: "task_profile",
        task_profile: "fast",
      };

      const description = describeResolution(resolved);

      expect(description).not.toContain("reasoning_effort");
    });
  });

  describe("Resolution priority", () => {
    it("should prioritize direct model > task profile > default", () => {
      // Direct model
      const direct = resolveModel({
        requestModel: "gpt-5.2",
        taskProfile: "fast",
        defaultModel: "gpt-5-nano",
      });
      expect(direct.source).toBe("direct");
      expect(direct.model).toBe("gpt-5.2");

      // Task profile
      const profile = resolveModel({
        taskProfile: "fast",
        defaultModel: "gpt-5.2",
      });
      expect(profile.source).toBe("task_profile");
      expect(profile.model).toBe("gpt-5-nano");

      // Default
      const default_ = resolveModel({
        defaultModel: "gpt-5-nano",
      });
      expect(default_.source).toBe("default");
      expect(default_.model).toBe("gpt-5-nano");
    });
  });
});

