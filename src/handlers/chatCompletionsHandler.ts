import { HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { v4 as uuidv4 } from "uuid";
import { processInputAttachments } from "../attachments/inputProcessor";
import { buildProviderConfig } from "../config/providers";
import { applyGuardrails } from "../guardrails/profiles";
import { ChatCompletionRequest, ChatCompletionRequestSchema } from "../models/chatCompletionTypes";
import { logError, logRequest, logResponse } from "../observability/logger";
import { telemetry } from "../observability/telemetry";
import { getProviderAdapter } from "../providers";
import { SSEWriter } from "../streaming/sseWriter";
import { APIException } from "../utils/exceptions";
import { addCorsHeaders } from "../utils/httpJsonResponse";

/**
 * Handles POST /v1/chat/completions requests
 *
 * Main HALO layer endpoint for chat completions with:
 * - Multi-provider routing
 * - Streaming and non-streaming support
 * - Attachments support
 * - Tool calling
 * - Observability
 */
export const chatCompletionsHandler = async (
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> => {
  // Handle CORS preflight
  if (request.method === "OPTIONS") {
    return {
      status: 204,
      headers: addCorsHeaders(),
    };
  }

  const startTime = Date.now();
  const requestId = uuidv4();
  let chatRequest: ChatCompletionRequest | undefined;

  try {
    // Parse request body
    const body = await request.text();
    if (!body) {
      throw new APIException(
        "Request body is empty. Please provide a valid JSON body.",
        400,
        "EMPTY_REQUEST_BODY",
        undefined,
        requestId
      );
    }

    let requestJson: any;
    try {
      requestJson = JSON.parse(body);
    } catch (parseError) {
      throw new APIException(
        "Invalid JSON received. Ensure the request has a valid JSON body with Content-Type: application/json.",
        400,
        parseError instanceof Error ? parseError.message : "Invalid JSON format",
        undefined,
        requestId
      );
    }

    // Validate request schema
    const validationResult = ChatCompletionRequestSchema.safeParse(requestJson);
    if (!validationResult.success) {
      const errors = validationResult.error.issues
        .map(issue => `${issue.path.join(".")}: ${issue.message}`)
        .join("; ");
      throw new APIException(
        `Invalid request parameters: ${errors}`,
        400,
        "INVALID_PARAMETERS",
        undefined,
        requestId
      );
    }

    chatRequest = validationResult.data;

    // Determine provider (default to azure-openai if not specified)
    const provider = chatRequest.provider || "azure-openai";

    // Get provider adapter
    const adapter = getProviderAdapter(provider);
    if (!adapter) {
      throw new APIException(
        `Unknown provider: ${provider}`,
        400,
        "UNKNOWN_PROVIDER",
        undefined,
        requestId
      );
    }

    // Validate model capabilities
    const capabilities = adapter.getCapabilities(chatRequest.model);
    if (!capabilities) {
      throw new APIException(
        `Unknown model: ${chatRequest.model}`,
        400,
        "UNKNOWN_MODEL",
        undefined,
        requestId
      );
    }

    // Check if model supports requested features
    if (chatRequest.messages.some(m => m.attachments?.length)) {
      if (!capabilities.vision) {
        throw new APIException(
          `Model ${chatRequest.model} does not support vision/attachments`,
          400,
          "CAPABILITY_NOT_SUPPORTED",
          undefined,
          requestId
        );
      }
    }

    if (chatRequest.tools && chatRequest.tools.length > 0) {
      if (!capabilities.tool_calls) {
        throw new APIException(
          `Model ${chatRequest.model} does not support tool calling`,
          400,
          "CAPABILITY_NOT_SUPPORTED",
          undefined,
          requestId
        );
      }
    }

    // Build provider config
    let providerConfig;
    try {
      providerConfig = buildProviderConfig(
        provider,
        chatRequest.azure_endpoint,
        chatRequest.azure_deployment,
        chatRequest.api_version
      );
    } catch (configError) {
      throw new APIException(
        `Failed to build provider configuration: ${configError instanceof Error ? configError.message : String(configError)}`,
        500,
        "PROVIDER_CONFIG_ERROR",
        undefined,
        requestId
      );
    }

    // Process attachments
    let processedMessages = chatRequest.messages;
    if (chatRequest.messages.some(m => m.attachments?.length)) {
      processedMessages = await processInputAttachments(chatRequest.messages, capabilities);
    }

    // Apply guardrails if enabled
    if (chatRequest.system_guardrails_enabled && chatRequest.guardrail_profile) {
      processedMessages = applyGuardrails(processedMessages, chatRequest.guardrail_profile);
    }

    // Log request
    logRequest(context, {
      requestId,
      model: chatRequest.model,
      provider,
      messageCount: processedMessages.length,
      stream: chatRequest.stream || false,
      hasAttachments: chatRequest.messages.some(m => m.attachments?.length),
    });

    // Build provider request
    const providerRequest = await adapter.buildRequest(chatRequest, providerConfig);

    // Execute request
    if (chatRequest.stream) {
      return await handleStreaming(
        adapter,
        providerRequest,
        providerConfig,
        requestId,
        startTime,
        context,
        chatRequest.model,
        provider
      );
    } else {
      return await handleNonStreaming(
        adapter,
        providerRequest,
        providerConfig,
        requestId,
        startTime,
        context,
        chatRequest.model,
        provider
      );
    }
  } catch (error) {
    const latencyMs = Date.now() - startTime;

    if (error instanceof APIException) {
      logError(context, error, requestId);
      telemetry.trackRequest({
        requestId,
        model: chatRequest?.model || "unknown",
        provider: chatRequest?.provider || "unknown",
        latencyMs,
        promptTokens: 0,
        completionTokens: 0,
        streaming: false,
        attachmentCount: 0,
        success: false,
        errorCode: error.errorCode,
        context,
      });

      return {
        status: error.statusCode,
        body: JSON.stringify(error.toResponse(), null, 2),
        headers: addCorsHeaders({ "Content-Type": "application/json" }),
      };
    }

    // Unexpected error
    const apiError = new APIException(
      "Internal Server Error",
      500,
      `An unexpected error occurred: ${error instanceof Error ? error.message : String(error)}`,
      undefined,
      requestId
    );

    logError(context, apiError, requestId, { originalError: String(error) });
    telemetry.trackError(apiError, requestId, context);

    return {
      status: 500,
      body: JSON.stringify(apiError.toResponse(), null, 2),
      headers: addCorsHeaders({ "Content-Type": "application/json" }),
    };
  }
};

/**
 * Handle streaming response
 */
async function handleStreaming(
  adapter: any,
  providerRequest: any,
  providerConfig: any,
  requestId: string,
  startTime: number,
  context: InvocationContext,
  model: string,
  provider: string
): Promise<HttpResponseInit> {
  const sseWriter = new SSEWriter();
  const stream = adapter.executeStream(providerRequest, providerConfig);

  return {
    status: 200,
    headers: addCorsHeaders({
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    }),
    body: new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of sseWriter.stream(stream, requestId)) {
            controller.enqueue(new TextEncoder().encode(chunk));
          }
          controller.close();
        } catch (error) {
          context.error("Streaming error:", error);
          controller.error(error);
        }
      },
    }),
  };
}

/**
 * Handle non-streaming response
 */
async function handleNonStreaming(
  adapter: any,
  providerRequest: any,
  providerConfig: any,
  requestId: string,
  startTime: number,
  context: InvocationContext,
  model: string,
  provider: string
): Promise<HttpResponseInit> {
  const response = await adapter.executeJson(providerRequest, providerConfig);
  const latencyMs = Date.now() - startTime;

  // Add HALO extensions
  const haloResponse = {
    ...response,
    request_id: requestId,
    provider,
    latency_ms: latencyMs,
  };

  // Track telemetry
  telemetry.trackRequest({
    requestId,
    model,
    provider,
    latencyMs,
    promptTokens: response.usage?.prompt_tokens || 0,
    completionTokens: response.usage?.completion_tokens || 0,
    reasoningTokens: response.usage?.reasoning_tokens,
    streaming: false,
    attachmentCount: 0,
    success: true,
    context,
  });

  logResponse(context, {
    requestId,
    success: true,
    latencyMs,
    promptTokens: response.usage?.prompt_tokens,
    completionTokens: response.usage?.completion_tokens,
  });

  return {
    status: 200,
    body: JSON.stringify(haloResponse, null, 2),
    headers: addCorsHeaders({ "Content-Type": "application/json" }),
  };
}
