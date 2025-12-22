import { describe, it, expect } from "vitest";
import {
  ChatCompletionRequestSchema,
  ChatCompletionResponseSchema,
  SSEChunkSchema,
  AttachmentSchema,
  ToolDefinitionSchema,
  ToolCallSchema,
  ContentPartSchema,
  ChatMessageSchema,
  ResponseFormatSchema,
  ToolChoiceSchema,
  ChatCompletionChoiceSchema,
  UsageSchema,
  ImageParamsSchema,
} from "../../../models/chatCompletionTypes";
import {
  validChatRequest,
  requestWithAllParameters,
  requestWithAttachments,
  requestWithTools,
  requestWithReasoning,
  requestWithGuardrails,
  requestWithJsonMode,
  requestWithJsonSchema,
  requestWithContentArray,
  invalidRequestMissingModel,
  invalidRequestMissingMessages,
  invalidRequestEmptyMessages,
  invalidRequestInvalidTemperature,
  invalidRequestNegativeTemperature,
  invalidRequestInvalidTopP,
  invalidRequestInvalidMaxTokens,
  invalidRequestInvalidProvider,
  invalidRequestInvalidReasoningMode,
  invalidRequestAttachmentWithoutDataOrUrl,
  invalidRequestInvalidMimeType,
  invalidRequestToolWithoutParameters,
  requestWithUnicode,
  requestWithSpecialCharacters,
} from "../../fixtures/requests/chatCompletionRequests";

/**
 * Comprehensive unit tests for chat completion types
 *
 * Tests all Zod schemas with valid and invalid inputs
 */
describe("ChatCompletionRequestSchema", () => {
  describe("Valid requests", () => {
    it("should validate a minimal valid request", () => {
      const result = ChatCompletionRequestSchema.safeParse(validChatRequest);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.model).toBe("gpt-4o");
        expect(result.data.messages).toHaveLength(1);
        expect(result.data.stream).toBe(false);
      }
    });

    it("should validate a request with all optional fields", () => {
      const result = ChatCompletionRequestSchema.safeParse(requestWithAllParameters);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.temperature).toBe(0.7);
        expect(result.data.top_p).toBe(0.95);
        expect(result.data.max_tokens).toBe(1000);
        expect(result.data.stream).toBe(true);
        expect(result.data.tools).toBeDefined();
        expect(result.data.tools?.length).toBeGreaterThan(0);
      }
    });

    it("should validate request with attachments", () => {
      const result = ChatCompletionRequestSchema.safeParse(requestWithAttachments);
      expect(result.success).toBe(true);
    });

    it("should validate request with tools", () => {
      const result = ChatCompletionRequestSchema.safeParse(requestWithTools);
      expect(result.success).toBe(true);
    });

    it("should validate request with reasoning mode", () => {
      const result = ChatCompletionRequestSchema.safeParse(requestWithReasoning);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.reasoning_mode).toBe("deep");
        expect(result.data.max_reasoning_tokens).toBe(10000);
      }
    });

    it("should validate request with guardrails", () => {
      const result = ChatCompletionRequestSchema.safeParse(requestWithGuardrails);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.system_guardrails_enabled).toBe(true);
        expect(result.data.guardrail_profile).toBe("enterprise-safe");
      }
    });

    it("should validate request with JSON mode", () => {
      const result = ChatCompletionRequestSchema.safeParse(requestWithJsonMode);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.response_format).toBe("json");
      }
    });

    it("should validate request with JSON schema", () => {
      const result = ChatCompletionRequestSchema.safeParse(requestWithJsonSchema);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.response_format).toBeDefined();
        if (typeof result.data.response_format === "object") {
          expect(result.data.response_format.type).toBe("json_schema");
        }
      }
    });

    it("should validate request with content array", () => {
      const result = ChatCompletionRequestSchema.safeParse(requestWithContentArray);
      expect(result.success).toBe(true);
    });

    it("should validate request with Unicode characters", () => {
      const result = ChatCompletionRequestSchema.safeParse(requestWithUnicode);
      expect(result.success).toBe(true);
    });

    it("should validate request with special characters", () => {
      const result = ChatCompletionRequestSchema.safeParse(requestWithSpecialCharacters);
      expect(result.success).toBe(true);
    });

    it("should validate request with all providers", () => {
      const providers = ["azure-openai", "openai", "azure-ai-foundry"];
      for (const provider of providers) {
        const result = ChatCompletionRequestSchema.safeParse({
          ...validChatRequest,
          provider,
        });
        expect(result.success).toBe(true);
      }
    });

    it("should validate request with reasoning modes", () => {
      const modes = ["standard", "deep", "thinking"];
      for (const mode of modes) {
        const result = ChatCompletionRequestSchema.safeParse({
          ...validChatRequest,
          model: "o3-mini",
          reasoning_mode: mode,
        });
        expect(result.success).toBe(true);
      }
    });

    it("should validate request with reasoning_effort for GPT-5 models", () => {
      const efforts = ["none", "low", "medium", "high", "xhigh"];
      for (const effort of efforts) {
        const result = ChatCompletionRequestSchema.safeParse({
          ...validChatRequest,
          model: "gpt-5.2",
          reasoning_effort: effort,
        });
        expect(result.success).toBe(true);
      }
    });

    it("should validate request with task_profile instead of model", () => {
      const profiles = ["fast", "balanced", "reasoning", "deep_reasoning", "creative", "cost_effective"];
      for (const profile of profiles) {
        const request = { ...validChatRequest };
        delete request.model;
        const result = ChatCompletionRequestSchema.safeParse({
          ...request,
          task_profile: profile,
        });
        expect(result.success).toBe(true);
      }
    });

    it("should validate request with both model and task_profile (model takes precedence)", () => {
      const result = ChatCompletionRequestSchema.safeParse({
        ...validChatRequest,
        model: "gpt-5.2",
        task_profile: "fast",
      });
      expect(result.success).toBe(true);
    });

    it("should validate request with tool_choice options", () => {
      const toolChoices = ["auto", "none", { type: "function", function: { name: "get_weather" } }];
      for (const toolChoice of toolChoices) {
        const result = ChatCompletionRequestSchema.safeParse({
          ...validChatRequest,
          tools: [
            {
              type: "function",
              function: {
                name: "get_weather",
                parameters: { type: "object", properties: {} },
              },
            },
          ],
          tool_choice: toolChoice,
        });
        expect(result.success).toBe(true);
      }
    });
  });

  describe("Invalid requests", () => {
    it("should reject request missing both model and task_profile", () => {
      const request = { ...validChatRequest };
      delete request.model;
      const result = ChatCompletionRequestSchema.safeParse(request);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(
          result.error.issues.some(
            issue => issue.message.includes("model") || issue.message.includes("task_profile")
          )
        ).toBe(true);
      }
    });

    it("should reject request missing required model field (when task_profile also missing)", () => {
      const result = ChatCompletionRequestSchema.safeParse(invalidRequestMissingModel);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(issue => issue.path.includes("model"))).toBe(true);
      }
    });

    it("should reject request with invalid task_profile", () => {
      const request = { ...validChatRequest };
      delete request.model;
      const result = ChatCompletionRequestSchema.safeParse({
        ...request,
        task_profile: "invalid-profile",
      });
      expect(result.success).toBe(false);
    });

    it("should reject request with invalid reasoning_effort", () => {
      const result = ChatCompletionRequestSchema.safeParse({
        ...validChatRequest,
        model: "gpt-5.2",
        reasoning_effort: "invalid",
      });
      expect(result.success).toBe(false);
    });

    it("should reject request missing required messages field", () => {
      const result = ChatCompletionRequestSchema.safeParse(invalidRequestMissingMessages);
      expect(result.success).toBe(false);
    });

    it("should reject request with empty messages array", () => {
      const result = ChatCompletionRequestSchema.safeParse(invalidRequestEmptyMessages);
      expect(result.success).toBe(false);
    });

    it("should reject request with invalid temperature (too high)", () => {
      const result = ChatCompletionRequestSchema.safeParse(invalidRequestInvalidTemperature);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(
          result.error.issues.some(
            issue => issue.path.includes("temperature") && issue.message.includes("2")
          )
        ).toBe(true);
      }
    });

    it("should reject request with invalid temperature (negative)", () => {
      const result = ChatCompletionRequestSchema.safeParse(invalidRequestNegativeTemperature);
      expect(result.success).toBe(false);
    });

    it("should reject request with invalid top_p", () => {
      const result = ChatCompletionRequestSchema.safeParse(invalidRequestInvalidTopP);
      expect(result.success).toBe(false);
    });

    it("should reject request with invalid max_tokens", () => {
      const result = ChatCompletionRequestSchema.safeParse(invalidRequestInvalidMaxTokens);
      expect(result.success).toBe(false);
    });

    it("should reject request with invalid provider", () => {
      const result = ChatCompletionRequestSchema.safeParse(invalidRequestInvalidProvider);
      expect(result.success).toBe(false);
    });

    it("should reject request with invalid reasoning mode", () => {
      const result = ChatCompletionRequestSchema.safeParse(invalidRequestInvalidReasoningMode);
      expect(result.success).toBe(false);
    });

    it("should reject request with attachment missing data and URL", () => {
      const result = ChatCompletionRequestSchema.safeParse(
        invalidRequestAttachmentWithoutDataOrUrl
      );
      expect(result.success).toBe(false);
    });

    it("should reject request with invalid tool definition", () => {
      const result = ChatCompletionRequestSchema.safeParse(invalidRequestToolWithoutParameters);
      expect(result.success).toBe(false);
    });
  });
});

describe("ChatCompletionResponseSchema", () => {
  it("should validate a valid response", () => {
    const response = {
      id: "chatcmpl-123",
      object: "chat.completion",
      created: 1677652288,
      model: "gpt-4o",
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content: "Hello! How can I help you?",
          },
          finish_reason: "stop",
        },
      ],
      usage: {
        prompt_tokens: 10,
        completion_tokens: 15,
        total_tokens: 25,
      },
    };
    const result = ChatCompletionResponseSchema.safeParse(response);
    expect(result.success).toBe(true);
  });

  it("should validate response with reasoning tokens", () => {
    const response = {
      id: "chatcmpl-123",
      object: "chat.completion",
      created: 1677652288,
      model: "o3-mini",
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content: "Response",
          },
          finish_reason: "stop",
        },
      ],
      usage: {
        prompt_tokens: 10,
        completion_tokens: 20,
        total_tokens: 30,
        reasoning_tokens: 5000,
      },
    };
    const result = ChatCompletionResponseSchema.safeParse(response);
    expect(result.success).toBe(true);
  });

  it("should validate response with HALO extensions", () => {
    const response = {
      id: "chatcmpl-123",
      object: "chat.completion",
      created: 1677652288,
      model: "gpt-4o",
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content: "Response",
          },
          finish_reason: "stop",
        },
      ],
      usage: {
        prompt_tokens: 10,
        completion_tokens: 15,
        total_tokens: 25,
      },
      request_id: "req-123",
      provider: "azure-openai",
      latency_ms: 150,
    };
    const result = ChatCompletionResponseSchema.safeParse(response);
    expect(result.success).toBe(true);
  });

  it("should validate response with tool calls", () => {
    const response = {
      id: "chatcmpl-123",
      object: "chat.completion",
      created: 1677652288,
      model: "gpt-4o",
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content: null,
            tool_calls: [
              {
                id: "call_123",
                type: "function",
                function: {
                  name: "get_weather",
                  arguments: '{"location": "SF"}',
                },
              },
            ],
          },
          finish_reason: "tool_calls",
        },
      ],
      usage: {
        prompt_tokens: 20,
        completion_tokens: 15,
        total_tokens: 35,
      },
    };
    const result = ChatCompletionResponseSchema.safeParse(response);
    expect(result.success).toBe(true);
  });

  it("should reject response missing required fields", () => {
    const response = {
      id: "chatcmpl-123",
      // Missing object, created, model, choices
    };
    const result = ChatCompletionResponseSchema.safeParse(response);
    expect(result.success).toBe(false);
  });
});

describe("SSEChunkSchema", () => {
  it("should validate a valid SSE chunk", () => {
    const chunk = {
      id: "chatcmpl-123",
      object: "chat.completion.chunk",
      created: 1677652288,
      model: "gpt-4o",
      choices: [
        {
          index: 0,
          delta: {
            content: "Hello",
          },
          finish_reason: null,
        },
      ],
    };
    const result = SSEChunkSchema.safeParse(chunk);
    expect(result.success).toBe(true);
  });

  it("should validate chunk with tool calls", () => {
    const chunk = {
      id: "chatcmpl-123",
      object: "chat.completion.chunk",
      created: 1677652288,
      model: "gpt-4o",
      choices: [
        {
          index: 0,
          delta: {
            tool_calls: [
              {
                id: "call_123",
                type: "function",
                function: {
                  name: "get_weather",
                  arguments: '{"location":',
                },
              },
            ],
          },
          finish_reason: null,
        },
      ],
    };
    const result = SSEChunkSchema.safeParse(chunk);
    expect(result.success).toBe(true);
  });

  it("should validate chunk with HALO metadata", () => {
    const chunk = {
      id: "chatcmpl-123",
      object: "chat.completion.chunk",
      created: 1677652288,
      model: "gpt-4o",
      choices: [
        {
          index: 0,
          delta: {
            content: "Hello",
          },
          finish_reason: "stop",
        },
      ],
      usage: {
        prompt_tokens: 10,
        completion_tokens: 15,
        total_tokens: 25,
      },
      halo_metadata: {
        chunks_count: 5,
        latency_ms: 150,
      },
    };
    const result = SSEChunkSchema.safeParse(chunk);
    expect(result.success).toBe(true);
  });
});

describe("AttachmentSchema", () => {
  it("should validate image attachment with base64 data", () => {
    const attachment = {
      type: "image",
      mime_type: "image/png",
      data: "base64data",
    };
    const result = AttachmentSchema.safeParse(attachment);
    expect(result.success).toBe(true);
  });

  it("should validate image attachment with URL", () => {
    const attachment = {
      type: "image",
      mime_type: "image/jpeg",
      url: "https://example.com/image.jpg",
    };
    const result = AttachmentSchema.safeParse(attachment);
    expect(result.success).toBe(true);
  });

  it("should validate attachment with optional fields", () => {
    const attachment = {
      type: "image",
      mime_type: "image/png",
      data: "base64data",
      filename: "image.png",
      alt: "Test image",
      size_bytes: 1024,
    };
    const result = AttachmentSchema.safeParse(attachment);
    expect(result.success).toBe(true);
  });

  it("should reject attachment without data or URL", () => {
    const attachment = {
      type: "image",
      mime_type: "image/png",
    };
    const result = AttachmentSchema.safeParse(attachment);
    expect(result.success).toBe(false);
  });

  it("should reject attachment with invalid type", () => {
    const attachment = {
      type: "invalid",
      mime_type: "image/png",
      data: "base64data",
    };
    const result = AttachmentSchema.safeParse(attachment);
    expect(result.success).toBe(false);
  });

  it("should reject attachment with invalid URL", () => {
    const attachment = {
      type: "image",
      mime_type: "image/png",
      url: "not-a-valid-url",
    };
    const result = AttachmentSchema.safeParse(attachment);
    expect(result.success).toBe(false);
  });
});

describe("ToolDefinitionSchema", () => {
  it("should validate a valid tool definition", () => {
    const tool = {
      type: "function",
      function: {
        name: "get_weather",
        description: "Get weather information",
        parameters: {
          type: "object",
          properties: {
            location: { type: "string" },
          },
        },
      },
    };
    const result = ToolDefinitionSchema.safeParse(tool);
    expect(result.success).toBe(true);
  });

  it("should validate tool with strict mode", () => {
    const tool = {
      type: "function",
      function: {
        name: "get_weather",
        parameters: {
          type: "object",
          properties: {},
        },
        strict: true,
      },
    };
    const result = ToolDefinitionSchema.safeParse(tool);
    expect(result.success).toBe(true);
  });

  it("should reject tool without required fields", () => {
    const tool = {
      type: "function",
      function: {
        name: "get_weather",
        // Missing parameters
      },
    };
    const result = ToolDefinitionSchema.safeParse(tool);
    expect(result.success).toBe(false);
  });

  it("should reject tool with invalid type", () => {
    const tool = {
      type: "invalid",
      function: {
        name: "get_weather",
        parameters: { type: "object", properties: {} },
      },
    };
    const result = ToolDefinitionSchema.safeParse(tool);
    expect(result.success).toBe(false);
  });
});

describe("ToolCallSchema", () => {
  it("should validate a valid tool call", () => {
    const toolCall = {
      id: "call_123",
      type: "function",
      function: {
        name: "get_weather",
        arguments: '{"location": "SF"}',
      },
    };
    const result = ToolCallSchema.safeParse(toolCall);
    expect(result.success).toBe(true);
  });

  it("should reject tool call with invalid type", () => {
    const toolCall = {
      id: "call_123",
      type: "invalid",
      function: {
        name: "get_weather",
        arguments: "{}",
      },
    };
    const result = ToolCallSchema.safeParse(toolCall);
    expect(result.success).toBe(false);
  });
});

describe("ContentPartSchema", () => {
  it("should validate text content part", () => {
    const part = {
      type: "text",
      text: "Hello world",
    };
    const result = ContentPartSchema.safeParse(part);
    expect(result.success).toBe(true);
  });

  it("should validate image_url content part", () => {
    const part = {
      type: "image_url",
      image_url: {
        url: "https://example.com/image.png",
        detail: "high",
      },
    };
    const result = ContentPartSchema.safeParse(part);
    expect(result.success).toBe(true);
  });

  it("should reject invalid content part type", () => {
    const part = {
      type: "invalid",
      text: "Hello",
    };
    const result = ContentPartSchema.safeParse(part);
    expect(result.success).toBe(false);
  });
});

describe("ChatMessageSchema", () => {
  it("should validate message with string content", () => {
    const message = {
      role: "user",
      content: "Hello",
    };
    const result = ChatMessageSchema.safeParse(message);
    expect(result.success).toBe(true);
  });

  it("should validate message with content array", () => {
    const message = {
      role: "user",
      content: [
        { type: "text", text: "Hello" },
        {
          type: "image_url",
          image_url: { url: "https://example.com/image.png" },
        },
      ],
    };
    const result = ChatMessageSchema.safeParse(message);
    expect(result.success).toBe(true);
  });

  it("should validate message with attachments", () => {
    const message = {
      role: "user",
      content: "What's in this image?",
      attachments: [
        {
          type: "image",
          mime_type: "image/png",
          data: "base64data",
        },
      ],
    };
    const result = ChatMessageSchema.safeParse(message);
    expect(result.success).toBe(true);
  });

  it("should validate message with tool calls", () => {
    const message = {
      role: "assistant",
      content: null,
      tool_calls: [
        {
          id: "call_123",
          type: "function",
          function: {
            name: "get_weather",
            arguments: "{}",
          },
        },
      ],
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

describe("ResponseFormatSchema", () => {
  it("should validate text format", () => {
    const result = ResponseFormatSchema.safeParse("text");
    expect(result.success).toBe(true);
  });

  it("should validate json format", () => {
    const result = ResponseFormatSchema.safeParse("json");
    expect(result.success).toBe(true);
  });

  it("should validate json_schema format", () => {
    const format = {
      type: "json_schema",
      json_schema: {
        type: "object",
        properties: {
          name: { type: "string" },
        },
      },
    };
    const result = ResponseFormatSchema.safeParse(format);
    expect(result.success).toBe(true);
  });
});

describe("ToolChoiceSchema", () => {
  it("should validate auto choice", () => {
    const result = ToolChoiceSchema.safeParse("auto");
    expect(result.success).toBe(true);
  });

  it("should validate none choice", () => {
    const result = ToolChoiceSchema.safeParse("none");
    expect(result.success).toBe(true);
  });

  it("should validate function choice", () => {
    const choice = {
      type: "function",
      function: {
        name: "get_weather",
      },
    };
    const result = ToolChoiceSchema.safeParse(choice);
    expect(result.success).toBe(true);
  });
});

describe("UsageSchema", () => {
  it("should validate usage with all fields", () => {
    const usage = {
      prompt_tokens: 10,
      completion_tokens: 15,
      total_tokens: 25,
      reasoning_tokens: 5000,
    };
    const result = UsageSchema.safeParse(usage);
    expect(result.success).toBe(true);
  });

  it("should validate usage without reasoning tokens", () => {
    const usage = {
      prompt_tokens: 10,
      completion_tokens: 15,
      total_tokens: 25,
    };
    const result = UsageSchema.safeParse(usage);
    expect(result.success).toBe(true);
  });
});

describe("ImageParamsSchema", () => {
  it("should validate image params with all fields", () => {
    const params = {
      size: "1024x1024",
      quality: "hd",
      format: "url",
      n: 2,
      style: "vivid",
    };
    const result = ImageParamsSchema.safeParse(params);
    expect(result.success).toBe(true);
  });

  it("should validate image params with minimal fields", () => {
    const params = {
      size: "512x512",
    };
    const result = ImageParamsSchema.safeParse(params);
    expect(result.success).toBe(true);
  });

  it("should reject invalid size", () => {
    const params = {
      size: "999x999",
    };
    const result = ImageParamsSchema.safeParse(params);
    expect(result.success).toBe(false);
  });

  it("should reject invalid n value", () => {
    const params = {
      n: 11, // Exceeds max of 10
    };
    const result = ImageParamsSchema.safeParse(params);
    expect(result.success).toBe(false);
  });
});
