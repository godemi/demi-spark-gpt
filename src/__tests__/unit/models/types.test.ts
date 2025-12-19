import { describe, it, expect } from "vitest";
import {
  ChatRoleSchema,
  ChatMessageSchema,
  HistoryStrategySchema,
  VariableTypeSchema,
  CustomPrePromptTypeSchema,
  PrePromptTypeSchema,
  SparkGPTInputParametersSchema,
  SparkGPTProcessedParametersSchema,
  AzureChatGPTRequestParameterSchema,
  DEFAULT_SPARK_GPT_PARAMETERS,
  OFFICIAL_AZURE_OPENAI_CHATGPT_PARAMETERS,
} from "../../../models/types";

/**
 * Unit tests for types and schemas
 */
describe("ChatRoleSchema", () => {
  it("should validate valid roles", () => {
    const roles = ["system", "user", "assistant"];
    for (const role of roles) {
      const result = ChatRoleSchema.safeParse(role);
      expect(result.success).toBe(true);
    }
  });

  it("should reject invalid role", () => {
    const result = ChatRoleSchema.safeParse("invalid");
    expect(result.success).toBe(false);
  });
});

describe("ChatMessageSchema", () => {
  it("should validate a valid chat message", () => {
    const message = {
      role: "user",
      content: "Hello",
    };
    const result = ChatMessageSchema.safeParse(message);
    expect(result.success).toBe(true);
  });

  it("should validate message with optional fields", () => {
    const message = {
      role: "user",
      content: "Hello",
      created_at: "2025-01-01T00:00:00Z",
      id: "msg-123",
    };
    const result = ChatMessageSchema.safeParse(message);
    expect(result.success).toBe(true);
  });

  it("should reject message with invalid role", () => {
    const message = {
      role: "invalid",
      content: "Hello",
    };
    const result = ChatMessageSchema.safeParse(message);
    expect(result.success).toBe(false);
  });
});

describe("HistoryStrategySchema", () => {
  it("should validate valid strategies", () => {
    const strategies = ["last_n", "token_budget", "all"];
    for (const strategy of strategies) {
      const result = HistoryStrategySchema.safeParse(strategy);
      expect(result.success).toBe(true);
    }
  });

  it("should reject invalid strategy", () => {
    const result = HistoryStrategySchema.safeParse("invalid");
    expect(result.success).toBe(false);
  });
});

describe("VariableTypeSchema", () => {
  it("should validate a valid variable", () => {
    const variable = {
      name: "location",
      description: "User location",
      value: "San Francisco",
      type: "string",
    };
    const result = VariableTypeSchema.safeParse(variable);
    expect(result.success).toBe(true);
  });

  it("should validate variable with all types", () => {
    const types = ["string", "iso-8601", "integer", "float", "boolean", "timestamp"];
    for (const type of types) {
      const variable = {
        name: "test",
        description: "Test",
        value: "test",
        type,
      };
      const result = VariableTypeSchema.safeParse(variable);
      expect(result.success).toBe(true);
    }
  });

  it("should reject variable with invalid type", () => {
    const variable = {
      name: "test",
      description: "Test",
      value: "test",
      type: "invalid",
    };
    const result = VariableTypeSchema.safeParse(variable);
    expect(result.success).toBe(false);
  });
});

describe("CustomPrePromptTypeSchema", () => {
  it("should validate a valid custom pre-prompt", () => {
    const prePrompt = {
      name: "test",
      description: "Test prompt",
      role: "system",
      text: "You are helpful",
    };
    const result = CustomPrePromptTypeSchema.safeParse(prePrompt);
    expect(result.success).toBe(true);
  });

  it("should validate pre-prompt with all roles", () => {
    const roles = ["system", "user", "assistant"];
    for (const role of roles) {
      const prePrompt = {
        name: "test",
        description: "Test",
        role,
        text: "Test",
      };
      const result = CustomPrePromptTypeSchema.safeParse(prePrompt);
      expect(result.success).toBe(true);
    }
  });
});

describe("PrePromptTypeSchema", () => {
  it("should validate a valid pre-prompt", () => {
    const prePrompt = {
      role: "system",
      type: "test",
      text: "You are helpful",
    };
    const result = PrePromptTypeSchema.safeParse(prePrompt);
    expect(result.success).toBe(true);
  });

  it("should validate pre-prompt without role", () => {
    const prePrompt = {
      type: "test",
      text: "Test",
    };
    const result = PrePromptTypeSchema.safeParse(prePrompt);
    expect(result.success).toBe(true);
  });
});

describe("SparkGPTInputParametersSchema", () => {
  it("should validate minimal valid parameters", () => {
    const params = {
      prompt: "Hello",
      temperature: 0.7,
      max_tokens: 100,
      fallback_result_language: "en",
      top_p: 0.95,
      system_pre_prompts_global: true,
      system_pre_prompts_generate_min_tokens: false,
      system_pre_prompts_explain_technical_terms: false,
      system_pre_prompts_non_expert_mode: false,
      system_pre_prompts_brief_response: false,
      system_pre_prompts_add_emoticons: false,
      system_pre_prompts_format_as_markdown: false,
    };
    const result = SparkGPTInputParametersSchema.safeParse(params);
    expect(result.success).toBe(true);
  });

  it("should validate parameters with all optional fields", () => {
    const params = {
      prompt: "Hello",
      stream: true,
      temperature: 0.7,
      max_tokens: 100,
      fallback_result_language: "en",
      top_p: 0.95,
      system_pre_prompts_global: true,
      system_pre_prompts_generate_min_tokens: false,
      system_pre_prompts_explain_technical_terms: false,
      system_pre_prompts_non_expert_mode: false,
      system_pre_prompts_brief_response: false,
      system_pre_prompts_add_emoticons: false,
      system_pre_prompts_format_as_markdown: false,
      best_of: 2,
      frequency_penalty: 0.1,
      min_tokens: 10,
      n: 2,
      presence_penalty: 0.1,
      stop: ["\n"],
      user: "test-user",
      variables: [
        {
          name: "var1",
          description: "Variable 1",
          value: "value1",
          type: "string",
        },
      ],
      custom_pre_prompts: [
        {
          name: "pre1",
          description: "Pre-prompt 1",
          role: "system",
          text: "Test",
        },
      ],
      history: [
        {
          role: "user",
          content: "Hello",
        },
      ],
      history_window: 5,
      history_strategy: "last_n",
    };
    const result = SparkGPTInputParametersSchema.safeParse(params);
    expect(result.success).toBe(true);
  });

  it("should validate prompt as array", () => {
    const params = {
      prompt: ["Hello", "World"],
      temperature: 0.7,
      max_tokens: 100,
      fallback_result_language: "en",
      top_p: 0.95,
      system_pre_prompts_global: true,
      system_pre_prompts_generate_min_tokens: false,
      system_pre_prompts_explain_technical_terms: false,
      system_pre_prompts_non_expert_mode: false,
      system_pre_prompts_brief_response: false,
      system_pre_prompts_add_emoticons: false,
      system_pre_prompts_format_as_markdown: false,
    };
    const result = SparkGPTInputParametersSchema.safeParse(params);
    expect(result.success).toBe(true);
  });

  it("should reject parameters with invalid temperature", () => {
    const params = {
      prompt: "Hello",
      temperature: 3.0, // Out of range
      max_tokens: 100,
      fallback_result_language: "en",
      top_p: 0.95,
      system_pre_prompts_global: true,
      system_pre_prompts_generate_min_tokens: false,
      system_pre_prompts_explain_technical_terms: false,
      system_pre_prompts_non_expert_mode: false,
      system_pre_prompts_brief_response: false,
      system_pre_prompts_add_emoticons: false,
      system_pre_prompts_format_as_markdown: false,
    };
    const result = SparkGPTInputParametersSchema.safeParse(params);
    expect(result.success).toBe(false);
  });
});

describe("AzureChatGPTRequestParameterSchema", () => {
  it("should validate a valid Azure request", () => {
    const params = {
      messages: [{ role: "user", content: "Hello" }],
      temperature: 0.7,
      top_p: 0.95,
      max_tokens: 100,
    };
    const result = AzureChatGPTRequestParameterSchema.safeParse(params);
    expect(result.success).toBe(true);
  });

  it("should validate request with all optional fields", () => {
    const params = {
      messages: [{ role: "user", content: "Hello" }],
      fallback_result_language: "en",
      temperature: 0.7,
      top_p: 0.95,
      max_tokens: 100,
      min_tokens: 10,
      n: 2,
      best_of: 3,
      frequency_penalty: 0.1,
      presence_penalty: 0.1,
      logit_bias: { "123": 0.5 },
      stop: ["\n"],
      stream: true,
      suffix: "END",
      user: "test-user",
    };
    const result = AzureChatGPTRequestParameterSchema.safeParse(params);
    expect(result.success).toBe(true);
  });
});

describe("DEFAULT_SPARK_GPT_PARAMETERS", () => {
  it("should have all required fields", () => {
    expect(DEFAULT_SPARK_GPT_PARAMETERS).toHaveProperty("prompt");
    expect(DEFAULT_SPARK_GPT_PARAMETERS).toHaveProperty("temperature");
    expect(DEFAULT_SPARK_GPT_PARAMETERS).toHaveProperty("max_tokens");
    expect(DEFAULT_SPARK_GPT_PARAMETERS).toHaveProperty("fallback_result_language");
    expect(DEFAULT_SPARK_GPT_PARAMETERS).toHaveProperty("top_p");
  });

  it("should validate against schema", () => {
    const result = SparkGPTProcessedParametersSchema.safeParse(DEFAULT_SPARK_GPT_PARAMETERS);
    expect(result.success).toBe(true);
  });
});

describe("OFFICIAL_AZURE_OPENAI_CHATGPT_PARAMETERS", () => {
  it("should contain expected parameters", () => {
    const expected = ["temperature", "top_p", "max_tokens", "stream", "user"];
    for (const param of expected) {
      expect(OFFICIAL_AZURE_OPENAI_CHATGPT_PARAMETERS).toContain(param);
    }
  });

  it("should be an array of strings", () => {
    expect(Array.isArray(OFFICIAL_AZURE_OPENAI_CHATGPT_PARAMETERS)).toBe(true);
    for (const param of OFFICIAL_AZURE_OPENAI_CHATGPT_PARAMETERS) {
      expect(typeof param).toBe("string");
    }
  });
});
