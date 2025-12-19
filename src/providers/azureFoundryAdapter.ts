import OpenAI from "openai";
import { DefaultAzureCredential } from "@azure/identity";
import {
  ChatCompletionRequest,
  ChatCompletionResponse,
  SSEChunk,
  ChatMessage,
} from "../models/chatCompletionTypes";
import { ProviderAdapter, ProviderConfig, ProviderRequest, ModelCapabilities } from "./types";
import { getModelCapabilities } from "./modelRegistry";

/**
 * Azure AI Foundry Provider Adapter
 *
 * Handles requests to Azure AI Foundry for both Azure OpenAI deployments
 * and OSS "Models as a Service" (Llama, Mistral, Phi-3, etc.)
 *
 * Uses the same OpenAI-compatible API pattern as Azure OpenAI
 */
export class AzureFoundryAdapter implements ProviderAdapter {
  name = "azure-ai-foundry";
  private clients: Map<string, OpenAI> = new Map();

  /**
   * Get or create an Azure AI Foundry client for a configuration
   */
  private getClient(config: ProviderConfig): OpenAI {
    const key = `${config.endpoint}-${config.deployment || config.model}-${config.authType}`;

    if (this.clients.has(key)) {
      return this.clients.get(key)!;
    }

    let client: OpenAI;

    if (config.authType === "aad") {
      const credential = new DefaultAzureCredential();
      client = new OpenAI({
        baseURL: `${config.endpoint}/openai/deployments/${config.deployment || config.model}`,
        defaultQuery: { "api-version": config.apiVersion },
        defaultHeaders: {
          "api-key": "", // Will be replaced by token
        },
      });

      // Set up token refresh
      const getToken = async () => {
        const token = await credential.getToken("https://cognitiveservices.azure.com/.default");
        return token.token;
      };

      (client as any)._getToken = getToken;
    } else {
      client = new OpenAI({
        baseURL: `${config.endpoint}/openai/deployments/${config.deployment || config.model}`,
        defaultQuery: { "api-version": config.apiVersion },
        apiKey: config.apiKey,
      });
    }

    this.clients.set(key, client);
    return client;
  }

  async buildRequest(
    params: ChatCompletionRequest,
    config: ProviderConfig
  ): Promise<ProviderRequest> {
    // Azure AI Foundry uses the same request format as Azure OpenAI
    const request: ProviderRequest = {
      model: config.deployment || config.model || params.model,
      messages: params.messages.map(this.normalizeMessage),
      stream: params.stream,
    };

    // Add optional parameters (OSS models may not support all)
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
    if (params.user) request.user = params.user;

    // Note: OSS models typically don't support reasoning_mode, logprobs, etc.

    return request;
  }

  async *executeStream(request: ProviderRequest, config: ProviderConfig): AsyncIterable<SSEChunk> {
    const client = this.getClient(config);

    try {
      const options: any = {
        ...request,
        stream: true,
      };

      if (config.authType === "aad" && (client as any)._getToken) {
        const token = await (client as any)._getToken();
        options.headers = {
          Authorization: `Bearer ${token}`,
        };
      }

      const stream = (await client.chat.completions.create(
        options
      )) as unknown as AsyncIterable<any>;

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
      const options: any = {
        ...request,
        stream: false,
      };

      if (config.authType === "aad" && (client as any)._getToken) {
        const token = await (client as any)._getToken();
        options.headers = {
          Authorization: `Bearer ${token}`,
        };
      }

      const response = await client.chat.completions.create(options);

      return this.mapResponse(response);
    } catch (error: any) {
      throw this.mapError(error);
    }
  }

  getCapabilities(model: string): ModelCapabilities | null {
    return getModelCapabilities(model);
  }

  validateRequest(request: ChatCompletionRequest): boolean {
    // Azure AI Foundry supports OpenAI-compatible API
    // Some OSS models may have limited capabilities
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

      // Add attachments as image_url (if model supports vision)
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
   * Map Azure AI Foundry chunk to HALO SSE chunk format
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
          }
        : undefined,
    };
  }

  /**
   * Map Azure AI Foundry response to HALO response format
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
          }
        : undefined,
    };
  }

  /**
   * Map Azure AI Foundry errors to HALO error format
   */
  private mapError(error: any): Error {
    if (error.response?.data?.error) {
      const foundryError = error.response.data.error;
      return new Error(
        `Azure AI Foundry Error: ${foundryError.message || error.message} (Code: ${foundryError.code || "unknown"})`
      );
    }
    return error instanceof Error ? error : new Error(String(error));
  }
}
