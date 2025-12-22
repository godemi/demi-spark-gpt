import { describe, it, expect } from "vitest";
import {
  TASK_PROFILES,
  getTaskProfile,
  getTaskProfileNames,
  isValidTaskProfile,
  TaskProfile,
} from "../../../providers/taskProfiles";

/**
 * Unit tests for task profiles
 */
describe("Task Profiles", () => {
  describe("TASK_PROFILES", () => {
    it("should contain all expected profiles", () => {
      const expectedProfiles = [
        "fast",
        "balanced",
        "reasoning",
        "deep_reasoning",
        "creative",
        "cost_effective",
      ];

      for (const profile of expectedProfiles) {
        expect(TASK_PROFILES).toHaveProperty(profile);
        expect(TASK_PROFILES[profile]).toBeDefined();
      }
    });

    it("should have valid structure for each profile", () => {
      for (const [name, profile] of Object.entries(TASK_PROFILES)) {
        expect(profile.name).toBe(name);
        expect(typeof profile.description).toBe("string");
        expect(typeof profile.model).toBe("string");
        expect(profile.model.length).toBeGreaterThan(0);
      }
    });

    it("should have fast profile with correct settings", () => {
      const fast = TASK_PROFILES.fast;
      expect(fast.model).toBe("gpt-5-nano");
      expect(fast.reasoning_effort).toBe("none");
      expect(fast.temperature).toBeUndefined();
    });

    it("should have balanced profile with correct settings", () => {
      const balanced = TASK_PROFILES.balanced;
      expect(balanced.model).toBe("gpt-5-nano");
      expect(balanced.reasoning_effort).toBe("medium");
    });

    it("should have reasoning profile with correct settings", () => {
      const reasoning = TASK_PROFILES.reasoning;
      expect(reasoning.model).toBe("gpt-5.2");
      expect(reasoning.reasoning_effort).toBe("high");
    });

    it("should have deep_reasoning profile with correct settings", () => {
      const deepReasoning = TASK_PROFILES.deep_reasoning;
      expect(deepReasoning.model).toBe("gpt-5.2");
      expect(deepReasoning.reasoning_effort).toBe("xhigh");
    });

    it("should have creative profile with correct settings", () => {
      const creative = TASK_PROFILES.creative;
      expect(creative.model).toBe("gpt-5.2");
      expect(creative.reasoning_effort).toBe("medium");
      expect(creative.temperature).toBe(0.9);
    });

    it("should have cost_effective profile with correct settings", () => {
      const costEffective = TASK_PROFILES.cost_effective;
      expect(costEffective.model).toBe("gpt-5-nano");
      expect(costEffective.reasoning_effort).toBe("low");
    });

    it("should have valid reasoning_effort values", () => {
      const validEfforts = ["none", "low", "medium", "high", "xhigh"];
      for (const profile of Object.values(TASK_PROFILES)) {
        if (profile.reasoning_effort) {
          expect(validEfforts).toContain(profile.reasoning_effort);
        }
      }
    });

    it("should have valid model names", () => {
      const validModels = ["gpt-5-nano", "gpt-5.2"];
      for (const profile of Object.values(TASK_PROFILES)) {
        expect(validModels).toContain(profile.model);
      }
    });

    it("should have temperature in valid range if specified", () => {
      for (const profile of Object.values(TASK_PROFILES)) {
        if (profile.temperature !== undefined) {
          expect(profile.temperature).toBeGreaterThanOrEqual(0);
          expect(profile.temperature).toBeLessThanOrEqual(2);
        }
      }
    });
  });

  describe("getTaskProfile", () => {
    it("should return profile for valid name", () => {
      const profile = getTaskProfile("fast");
      expect(profile).toBeDefined();
      expect(profile?.name).toBe("fast");
      expect(profile?.model).toBe("gpt-5-nano");
    });

    it("should return null for invalid name", () => {
      const profile = getTaskProfile("invalid-profile");
      expect(profile).toBeNull();
    });

    it("should return null for empty string", () => {
      const profile = getTaskProfile("");
      expect(profile).toBeNull();
    });

    it("should return all profiles correctly", () => {
      for (const name of Object.keys(TASK_PROFILES)) {
        const profile = getTaskProfile(name);
        expect(profile).toBeDefined();
        expect(profile?.name).toBe(name);
      }
    });
  });

  describe("getTaskProfileNames", () => {
    it("should return array of profile names", () => {
      const names = getTaskProfileNames();
      expect(Array.isArray(names)).toBe(true);
      expect(names.length).toBeGreaterThan(0);
    });

    it("should return all profile names", () => {
      const names = getTaskProfileNames();
      const expectedNames = Object.keys(TASK_PROFILES);
      expect(names.length).toBe(expectedNames.length);
      for (const name of expectedNames) {
        expect(names).toContain(name);
      }
    });

    it("should return strings only", () => {
      const names = getTaskProfileNames();
      for (const name of names) {
        expect(typeof name).toBe("string");
      }
    });
  });

  describe("isValidTaskProfile", () => {
    it("should return true for valid profile names", () => {
      expect(isValidTaskProfile("fast")).toBe(true);
      expect(isValidTaskProfile("balanced")).toBe(true);
      expect(isValidTaskProfile("reasoning")).toBe(true);
      expect(isValidTaskProfile("deep_reasoning")).toBe(true);
      expect(isValidTaskProfile("creative")).toBe(true);
      expect(isValidTaskProfile("cost_effective")).toBe(true);
    });

    it("should return false for invalid profile names", () => {
      expect(isValidTaskProfile("invalid")).toBe(false);
      expect(isValidTaskProfile("")).toBe(false);
      expect(isValidTaskProfile("FAST")).toBe(false); // Case sensitive
    });

    it("should return false for undefined", () => {
      expect(isValidTaskProfile(undefined as any)).toBe(false);
    });
  });

  describe("Profile model distribution", () => {
    it("should have nano model for fast/balanced/cost_effective profiles", () => {
      const nanoProfiles = ["fast", "balanced", "cost_effective"];
      for (const name of nanoProfiles) {
        expect(TASK_PROFILES[name].model).toBe("gpt-5-nano");
      }
    });

    it("should have gpt-5.2 for reasoning/deep_reasoning/creative profiles", () => {
      const gpt52Profiles = ["reasoning", "deep_reasoning", "creative"];
      for (const name of gpt52Profiles) {
        expect(TASK_PROFILES[name].model).toBe("gpt-5.2");
      }
    });
  });

  describe("Profile reasoning effort distribution", () => {
    it("should have none effort for fast profile", () => {
      expect(TASK_PROFILES.fast.reasoning_effort).toBe("none");
    });

    it("should have low effort for cost_effective profile", () => {
      expect(TASK_PROFILES.cost_effective.reasoning_effort).toBe("low");
    });

    it("should have medium effort for balanced and creative profiles", () => {
      expect(TASK_PROFILES.balanced.reasoning_effort).toBe("medium");
      expect(TASK_PROFILES.creative.reasoning_effort).toBe("medium");
    });

    it("should have high effort for reasoning profile", () => {
      expect(TASK_PROFILES.reasoning.reasoning_effort).toBe("high");
    });

    it("should have xhigh effort for deep_reasoning profile", () => {
      expect(TASK_PROFILES.deep_reasoning.reasoning_effort).toBe("xhigh");
    });
  });
});

