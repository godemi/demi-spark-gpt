import OpenAI from "openai";
import {
  ChatCompletionRequest,
  ChatCompletionResponse,
  SSEChunk,
  ChatMessage,
} from "../models/chatCompletionTypes";
import { ProviderAdapter, ProviderConfig, ProviderRequest, ModelCapabilities } from "./types";
import { getModelCapabilities } from "./modelRegistry";

/**
 * OpenAI Provider Adapter
 *
 * Handles requests to OpenAI's direct API with support for:
 * - API key authentication
 * - Streaming and non-streaming responses
 * - Vision, tool calling, and image generation
 */
export class OpenAIAdapter implements ProviderAdapter {
  name = "openai";
  private clients: Map<string, OpenAI> = new Map();

  /**
   * Get or create an OpenAI client for a configuration
   */
  private getClient(config: ProviderConfig): OpenAI {
    const key = `${config.apiKey}-${config.organization || "default"}`;

    if (this.clients.has(key)) {
      return this.clients.get(key)!;
    }

    const client = new OpenAI({
      apiKey: config.apiKey,
      organization: config.organization,
    });

    this.clients.set(key, client);
    return client;
  }

  async buildRequest(
    params: ChatCompletionRequest,
    config: ProviderConfig
  ): Promise<ProviderRequest> {
    const request: ProviderRequest = {
      model: params.model,
      messages: params.messages.map(this.normalizeMessage),
      stream: params.stream,
    };

    // Add optional parameters
    if (params.temperature !== undefined) request.temperature = params.temperature;
    if (params.top_p !== undefined) request.top_p = params.top_p;
    if (params.max_tokens !== undefined) request.max_tokens = params.max_tokens;
    if (params.max_completion_tokens !== undefined) {
      request.max_completion_tokens = params.max_completion_tokens;
    }
    if (params.response_format) request.response_format = params.response_format;
    if (params.tools) request.tools = params.tools;
    if (params.tool_choice) request.tool_choice = params.tool_choice;
    if (params.seed !== undefined) request.seed = params.seed;
    if (params.stop) request.stop = params.stop;
    if (params.presence_penalty !== undefined) {
      request.presence_penalty = params.presence_penalty;
    }
    if (params.frequency_penalty !== undefined) {
      request.frequency_penalty = params.frequency_penalty;
    }
    if (params.n !== undefined) request.n = params.n;
    if (params.logit_bias) request.logit_bias = params.logit_bias;
    if (params.logprobs !== undefined) request.logprobs = params.logprobs;
    if (params.top_logprobs !== undefined) {
      request.top_logprobs = params.top_logprobs;
    }
    if (params.user) request.user = params.user;

    return request;
  }

  async *executeStream(request: ProviderRequest, config: ProviderConfig): AsyncIterable<SSEChunk> {
    const client = this.getClient(config);

    try {
      const stream = (await client.chat.completions.create({
        ...request,
        stream: true,
      } as any)) as unknown as AsyncIterable<any>;

      for await (const chunk of stream) {
        yield this.mapChunk(chunk);
      }
    } catch (error: any) {
      throw this.mapError(error);
    }
  }

  async executeJson(
    request: ProviderRequest,
    config: ProviderConfig
  ): Promise<ChatCompletionResponse> {
    const client = this.getClient(config);

    try {
      const response = await client.chat.completions.create({
        ...request,
        stream: false,
      } as any);

      return this.mapResponse(response);
    } catch (error: any) {
      throw this.mapError(error);
    }
  }

  getCapabilities(model: string): ModelCapabilities | null {
    return getModelCapabilities(model);
  }

  validateRequest(request: ChatCompletionRequest): boolean {
    // OpenAI supports all standard chat completion features
    return true;
  }

  /**
   * Normalize HALO message format to OpenAI format
   */
  private normalizeMessage(msg: ChatMessage): any {
    // If message has attachments, convert to content array format
    if (msg.attachments && msg.attachments.length > 0) {
      const content: any[] = [];

      // Add text content if present
      if (typeof msg.content === "string" && msg.content.trim()) {
        content.push({ type: "text", text: msg.content });
      } else if (Array.isArray(msg.content)) {
        content.push(...msg.content);
      }

      // Add attachments as image_url
      for (const att of msg.attachments) {
        if (att.type === "image") {
          const url =
            att.url || (att.data ? `data:${att.mime_type};base64,${att.data}` : undefined);
          if (url) {
            content.push({
              type: "image_url",
              image_url: {
                url,
                detail: "auto",
              },
            });
          }
        }
      }

      return {
        role: msg.role,
        content,
        name: msg.name,
        tool_calls: msg.tool_calls,
        tool_call_id: msg.tool_call_id,
      };
    }

    // Otherwise, return as-is (already in OpenAI format)
    return {
      role: msg.role,
      content: msg.content,
      name: msg.name,
      tool_calls: msg.tool_calls,
      tool_call_id: msg.tool_call_id,
    };
  }

  /**
   * Map OpenAI chunk to HALO SSE chunk format
   */
  private mapChunk(chunk: any): SSEChunk {
    return {
      id: chunk.id || "",
      object: "chat.completion.chunk",
      created: chunk.created || Math.floor(Date.now() / 1000),
      model: chunk.model || "",
      choices: (chunk.choices || []).map((choice: any) => ({
        index: choice.index || 0,
        delta: {
          role: choice.delta?.role,
          content: choice.delta?.content || null,
          tool_calls: choice.delta?.tool_calls,
        },
        finish_reason: choice.finish_reason || null,
        logprobs: choice.logprobs || null,
      })),
      usage: chunk.usage
        ? {
            prompt_tokens: chunk.usage.prompt_tokens || 0,
            completion_tokens: chunk.usage.completion_tokens || 0,
            total_tokens: chunk.usage.total_tokens || 0,
            reasoning_tokens: chunk.usage.reasoning_tokens,
          }
        : undefined,
    };
  }

  /**
   * Map OpenAI response to HALO response format
   */
  private mapResponse(response: any): ChatCompletionResponse {
    return {
      id: response.id || "",
      object: "chat.completion",
      created: response.created || Math.floor(Date.now() / 1000),
      model: response.model || "",
      choices: (response.choices || []).map((choice: any) => ({
        index: choice.index || 0,
        message: {
          role: choice.message.role,
          content: choice.message.content,
          tool_calls: choice.message.tool_calls,
        },
        finish_reason: choice.finish_reason || null,
        logprobs: choice.logprobs || null,
      })),
      usage: response.usage
        ? {
            prompt_tokens: response.usage.prompt_tokens || 0,
            completion_tokens: response.usage.completion_tokens || 0,
            total_tokens: response.usage.total_tokens || 0,
            reasoning_tokens: response.usage.reasoning_tokens,
          }
        : undefined,
    };
  }

  /**
   * Map OpenAI errors to HALO error format
   */
  private mapError(error: any): Error {
    if (error.error) {
      const openaiError = error.error;
      return new Error(
        `OpenAI Error: ${openaiError.message || error.message} (Type: ${openaiError.type || "unknown"})`
      );
    }
    return error instanceof Error ? error : new Error(String(error));
  }
}
