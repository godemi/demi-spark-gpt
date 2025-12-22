import { describe, it, expect } from "vitest";
import { PARAMETER_METADATA } from "../../../models/parameterMetadata";

/**
 * Unit tests for parameter metadata
 */
describe("PARAMETER_METADATA", () => {
  it("should have metadata for expected parameters", () => {
    const expectedParams = [
      "temperature",
      "top_p",
      "max_tokens",
      "min_tokens",
      "n",
      "frequency_penalty",
      "presence_penalty",
      "stream",
      "user",
    ];

    for (const param of expectedParams) {
      expect(PARAMETER_METADATA).toHaveProperty(param);
      expect(PARAMETER_METADATA[param]).toBeDefined();
    }
  });

  it("should have valid metadata structure for each parameter", () => {
    for (const [name, metadata] of Object.entries(PARAMETER_METADATA)) {
      expect(metadata).toHaveProperty("description");
      expect(metadata).toHaveProperty("usage");
      expect(typeof metadata.description).toBe("string");
      expect(typeof metadata.usage).toBe("string");
      expect(metadata.description.length).toBeGreaterThan(0);
      expect(metadata.usage.length).toBeGreaterThan(0);
    }
  });

  it("should have metadata for temperature", () => {
    const temp = PARAMETER_METADATA.temperature;
    expect(temp.description).toContain("randomness");
    expect(temp.usage).toBeDefined();
  });

  it("should have metadata for top_p", () => {
    const topP = PARAMETER_METADATA.top_p;
    expect(topP.description).toContain("probability");
    expect(topP.usage).toBeDefined();
  });

  it("should have metadata for max_tokens", () => {
    const maxTokens = PARAMETER_METADATA.max_tokens;
    expect(maxTokens.description).toContain("maximum");
    expect(maxTokens.usage).toBeDefined();
  });

  it("should have metadata for stream", () => {
    const stream = PARAMETER_METADATA.stream;
    expect(stream.description).toContain("stream");
    expect(stream.usage).toBeDefined();
  });

  it("should have metadata for system pre-prompts", () => {
    const systemPrompts = [
      "system_pre_prompts_global",
      "system_pre_prompts_brief_response",
      "system_pre_prompts_format_as_markdown",
      "system_pre_prompts_explain_technical_terms",
      "system_pre_prompts_non_expert_mode",
      "system_pre_prompts_add_emoticons",
      "system_pre_prompts_generate_min_tokens",
    ];

    for (const param of systemPrompts) {
      if (PARAMETER_METADATA[param]) {
        expect(PARAMETER_METADATA[param].description).toBeDefined();
        expect(PARAMETER_METADATA[param].usage).toBeDefined();
      }
    }
  });

  it("should have metadata for history parameters", () => {
    const historyParams = ["history", "history_window", "history_strategy", "max_history_tokens"];

    for (const param of historyParams) {
      if (PARAMETER_METADATA[param]) {
        expect(PARAMETER_METADATA[param].description).toBeDefined();
        expect(PARAMETER_METADATA[param].usage).toBeDefined();
      }
    }
  });

  it("should have metadata for all penalty parameters", () => {
    expect(PARAMETER_METADATA.frequency_penalty).toBeDefined();
    expect(PARAMETER_METADATA.presence_penalty).toBeDefined();
  });

  it("should have metadata for logit_bias", () => {
    const logitBias = PARAMETER_METADATA.logit_bias;
    expect(logitBias.description).toContain("likelihood");
    expect(logitBias.usage).toBeDefined();
  });

  it("should have metadata for stop parameter", () => {
    const stop = PARAMETER_METADATA.stop;
    expect(stop.description).toContain("stop");
    expect(stop.usage).toBeDefined();
  });
});

