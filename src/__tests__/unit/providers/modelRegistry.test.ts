import { describe, it, expect } from "vitest";
import {
  MODEL_REGISTRY,
  getModelCapabilities,
  hasCapability,
  getModelsForProvider,
} from "../../../providers/modelRegistry";
import { ModelCapabilities } from "../../../providers/types";

/**
 * Unit tests for model registry
 */
describe("MODEL_REGISTRY", () => {
  it("should contain expected models", () => {
    const expectedModels = [
      "gpt-4o",
      "gpt-4o-mini",
      "gpt-4-turbo",
      "gpt-4",
      "gpt-3.5-turbo",
      "o1-preview",
      "o1-mini",
      "o3-mini",
      "gpt-5.2",
      "gpt-5-nano",
      "gpt-5",
      "gpt-5-mini",
      "dall-e-2",
      "dall-e-3",
      "llama-3-70b",
      "llama-3-8b",
      "mistral-large",
      "phi-3-mini",
    ];

    for (const model of expectedModels) {
      expect(MODEL_REGISTRY).toHaveProperty(model);
      expect(MODEL_REGISTRY[model]).toBeDefined();
    }
  });

  it("should have valid capability structure for each model", () => {
    for (const [model, capabilities] of Object.entries(MODEL_REGISTRY)) {
      expect(capabilities).toHaveProperty("chat");
      expect(capabilities).toHaveProperty("vision");
      expect(capabilities).toHaveProperty("image_generate");
      expect(capabilities).toHaveProperty("tool_calls");
      expect(capabilities).toHaveProperty("json_mode");
      expect(capabilities).toHaveProperty("reasoning");
      expect(capabilities).toHaveProperty("max_context_tokens");
      expect(capabilities).toHaveProperty("max_output_tokens");
      expect(capabilities).toHaveProperty("supports_streaming");

      expect(typeof capabilities.chat).toBe("boolean");
      expect(typeof capabilities.vision).toBe("boolean");
      expect(typeof capabilities.image_generate).toBe("boolean");
      expect(typeof capabilities.tool_calls).toBe("boolean");
      expect(typeof capabilities.json_mode).toBe("boolean");
      expect(typeof capabilities.reasoning).toBe("boolean");
      expect(typeof capabilities.max_context_tokens).toBe("number");
      expect(typeof capabilities.max_output_tokens).toBe("number");
      expect(typeof capabilities.supports_streaming).toBe("boolean");
    }
  });

  it("should have correct capabilities for gpt-4o", () => {
    const caps = MODEL_REGISTRY["gpt-4o"];
    expect(caps.chat).toBe(true);
    expect(caps.vision).toBe(true);
    expect(caps.tool_calls).toBe(true);
    expect(caps.json_mode).toBe(true);
    expect(caps.reasoning).toBe(false);
    expect(caps.supports_streaming).toBe(true);
    expect(caps.max_context_tokens).toBe(128000);
  });

  it("should have correct capabilities for reasoning models", () => {
    const o1Caps = MODEL_REGISTRY["o1-preview"];
    expect(o1Caps.reasoning).toBe(true);
    expect(o1Caps.supports_streaming).toBe(false);
    expect(o1Caps.tool_calls).toBe(false);

    const o3Caps = MODEL_REGISTRY["o3-mini"];
    expect(o3Caps.reasoning).toBe(true);
    expect(o3Caps.json_mode).toBe(true);
  });

  it("should have correct capabilities for image generation models", () => {
    const dallE2 = MODEL_REGISTRY["dall-e-2"];
    expect(dallE2.image_generate).toBe(true);
    expect(dallE2.chat).toBe(false);
    expect(dallE2.supports_streaming).toBe(false);

    const dallE3 = MODEL_REGISTRY["dall-e-3"];
    expect(dallE3.image_generate).toBe(true);
    expect(dallE3.chat).toBe(false);
  });

  it("should have correct capabilities for OSS models", () => {
    const llama = MODEL_REGISTRY["llama-3-70b"];
    expect(llama.chat).toBe(true);
    expect(llama.tool_calls).toBe(false);
    expect(llama.json_mode).toBe(false);
    expect(llama.supports_streaming).toBe(true);

    const mistral = MODEL_REGISTRY["mistral-large"];
    expect(mistral.tool_calls).toBe(true);
  });

  it("should have correct capabilities for GPT-5 models", () => {
    const gpt52 = MODEL_REGISTRY["gpt-5.2"];
    expect(gpt52.chat).toBe(true);
    expect(gpt52.vision).toBe(true);
    expect(gpt52.tool_calls).toBe(true);
    expect(gpt52.json_mode).toBe(true);
    expect(gpt52.reasoning).toBe(true);
    expect(gpt52.supports_streaming).toBe(true);
    expect(gpt52.max_context_tokens).toBe(128000);
    expect(gpt52.max_output_tokens).toBe(16384);

    const gpt5Nano = MODEL_REGISTRY["gpt-5-nano"];
    expect(gpt5Nano.chat).toBe(true);
    expect(gpt5Nano.vision).toBe(true);
    expect(gpt5Nano.tool_calls).toBe(true);
    expect(gpt5Nano.json_mode).toBe(true);
    expect(gpt5Nano.reasoning).toBe(true);
    expect(gpt5Nano.supports_streaming).toBe(true);
    expect(gpt5Nano.max_context_tokens).toBe(128000);
    expect(gpt5Nano.max_output_tokens).toBe(16384);

    const gpt5 = MODEL_REGISTRY["gpt-5"];
    expect(gpt5.reasoning).toBe(true);
    expect(gpt5.supports_streaming).toBe(true);

    const gpt5Mini = MODEL_REGISTRY["gpt-5-mini"];
    expect(gpt5Mini.reasoning).toBe(true);
    expect(gpt5Mini.max_context_tokens).toBe(64000);
    expect(gpt5Mini.max_output_tokens).toBe(8192);
  });
});

describe("getModelCapabilities", () => {
  it("should return capabilities for exact model match", () => {
    const caps = getModelCapabilities("gpt-4o");
    expect(caps).toBeDefined();
    expect(caps?.chat).toBe(true);
    expect(caps?.vision).toBe(true);
  });

  it("should return capabilities for case-insensitive match", () => {
    const caps1 = getModelCapabilities("GPT-4O");
    const caps2 = getModelCapabilities("gpt-4o");

    expect(caps1).toBeDefined();
    expect(caps2).toBeDefined();
    expect(caps1).toEqual(caps2);
  });

  it("should return capabilities for prefix match (deployment names)", () => {
    const caps = getModelCapabilities("gpt-4o-2024-08-06");
    expect(caps).toBeDefined();
    expect(caps?.chat).toBe(true);
  });

  it("should return null for unknown model", () => {
    const caps = getModelCapabilities("unknown-model-xyz");
    expect(caps).toBeNull();
  });

  it("should handle empty string", () => {
    const caps = getModelCapabilities("");
    expect(caps).toBeNull();
  });

  it("should handle models with special characters", () => {
    const caps = getModelCapabilities("gpt-4o-mini");
    expect(caps).toBeDefined();
  });

  it("should handle deployment names with version suffixes", () => {
    const caps = getModelCapabilities("gpt-4-turbo-2024-04-09");
    expect(caps).toBeDefined();
    expect(caps?.chat).toBe(true);
  });
});

describe("hasCapability", () => {
  it("should return true for supported capability", () => {
    expect(hasCapability("gpt-4o", "vision")).toBe(true);
    expect(hasCapability("gpt-4o", "tool_calls")).toBe(true);
    expect(hasCapability("gpt-4o", "chat")).toBe(true);
    expect(hasCapability("gpt-4o", "json_mode")).toBe(true);
  });

  it("should return false for unsupported capability", () => {
    expect(hasCapability("gpt-4o", "reasoning")).toBe(false);
    expect(hasCapability("gpt-4o", "image_generate")).toBe(false);
  });

  it("should return false for unknown model", () => {
    expect(hasCapability("unknown-model", "chat")).toBe(false);
  });

  it("should check max_context_tokens capability", () => {
    expect(hasCapability("gpt-4o", "max_context_tokens")).toBe(true);
    expect(hasCapability("dall-e-2", "max_context_tokens")).toBe(false);
  });

  it("should check max_output_tokens capability", () => {
    expect(hasCapability("gpt-4o", "max_output_tokens")).toBe(true);
  });

  it("should handle reasoning models", () => {
    expect(hasCapability("o1-preview", "reasoning")).toBe(true);
    expect(hasCapability("o3-mini", "reasoning")).toBe(true);
    expect(hasCapability("o1-preview", "tool_calls")).toBe(false);
  });

  it("should handle image generation models", () => {
    expect(hasCapability("dall-e-3", "image_generate")).toBe(true);
    expect(hasCapability("dall-e-3", "chat")).toBe(false);
  });

  it("should handle OSS models", () => {
    expect(hasCapability("llama-3-70b", "chat")).toBe(true);
    expect(hasCapability("llama-3-70b", "tool_calls")).toBe(false);
    expect(hasCapability("mistral-large", "tool_calls")).toBe(true);
  });
});

describe("getModelsForProvider", () => {
  it("should return all models when no provider specified", () => {
    const models = getModelsForProvider("");
    expect(models.length).toBeGreaterThan(0);
    expect(Array.isArray(models)).toBe(true);
  });

  it("should return array of model names", () => {
    const models = getModelsForProvider("");
    for (const model of models) {
      expect(typeof model).toBe("string");
      expect(MODEL_REGISTRY).toHaveProperty(model);
    }
  });

  it("should include all registered models", () => {
    const models = getModelsForProvider("");
    const registryKeys = Object.keys(MODEL_REGISTRY);

    expect(models.length).toBe(registryKeys.length);
    for (const key of registryKeys) {
      expect(models).toContain(key);
    }
  });
});

describe("Model capability edge cases", () => {
  it("should handle models with different token limits", () => {
    const gpt4 = MODEL_REGISTRY["gpt-4"];
    const gpt4o = MODEL_REGISTRY["gpt-4o"];

    expect(gpt4.max_context_tokens).toBe(8192);
    expect(gpt4o.max_context_tokens).toBe(128000);
  });

  it("should have correct streaming support flags", () => {
    const streamingModels = ["gpt-4o", "gpt-4-turbo", "gpt-3.5-turbo"];
    const nonStreamingModels = ["o1-preview", "o1-mini", "dall-e-2"];

    for (const model of streamingModels) {
      expect(MODEL_REGISTRY[model]?.supports_streaming).toBe(true);
    }

    for (const model of nonStreamingModels) {
      expect(MODEL_REGISTRY[model]?.supports_streaming).toBe(false);
    }
  });

  it("should have vision support only for vision-capable models", () => {
    const visionModels = ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo"];
    const nonVisionModels = ["gpt-4", "gpt-3.5-turbo", "o1-preview"];

    for (const model of visionModels) {
      expect(MODEL_REGISTRY[model]?.vision).toBe(true);
    }

    for (const model of nonVisionModels) {
      expect(MODEL_REGISTRY[model]?.vision).toBe(false);
    }
  });
});

