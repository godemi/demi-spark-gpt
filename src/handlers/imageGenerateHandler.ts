import { HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { v4 as uuidv4 } from "uuid";
import OpenAI from "openai";
import { buildProviderConfig } from "../config/providers";
import { APIException } from "../utils/exceptions";
import { addCorsHeaders } from "../utils/httpJsonResponse";
import { processImageGenerationResponse } from "../attachments/outputProcessor";
import { logRequest, logResponse, logError } from "../observability/logger";
import { telemetry } from "../observability/telemetry";

/**
 * Handles POST /v1/images/generations requests
 *
 * Image generation endpoint (DALL-E, etc.)
 */
export const imageGenerateHandler = async (
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
      throw new APIException("Invalid JSON received.", 400, "INVALID_JSON", undefined, requestId);
    }

    // Validate required fields
    if (!requestJson.prompt) {
      throw new APIException(
        "Missing required field: prompt",
        400,
        "MISSING_FIELD",
        undefined,
        requestId
      );
    }

    const provider = requestJson.provider || "openai";
    const model = requestJson.model || "dall-e-3";
    const prompt = requestJson.prompt;
    const n = requestJson.n || 1;
    const size = requestJson.size || "1024x1024";
    const quality = requestJson.quality || "standard";
    const response_format = requestJson.response_format || "url";

    // Build provider config
    const providerConfig = buildProviderConfig(provider);

    // Log request
    logRequest(context, {
      requestId,
      model,
      provider,
      messageCount: 0,
      stream: false,
    });

    // Generate image
    let response: any;
    if (provider === "openai") {
      const openai = new OpenAI({
        apiKey: providerConfig.apiKey,
        organization: providerConfig.organization,
      });

      response = await openai.images.generate({
        model: model as "dall-e-2" | "dall-e-3",
        prompt,
        n,
        size: size as "256x256" | "512x512" | "1024x1024" | "1792x1024" | "1024x1792",
        quality: quality as "standard" | "hd",
        response_format: response_format as "url" | "b64_json",
      });
    } else {
      throw new APIException(
        `Image generation not yet supported for provider: ${provider}`,
        400,
        "UNSUPPORTED_PROVIDER",
        undefined,
        requestId
      );
    }

    const latencyMs = Date.now() - startTime;

    // Process attachments
    const attachments = processImageGenerationResponse(response);

    // Build response
    const haloResponse = {
      request_id: requestId,
      provider,
      model,
      created: response.created,
      attachments,
      latency_ms: latencyMs,
    };

    // Track telemetry
    telemetry.trackRequest({
      requestId,
      model,
      provider,
      latencyMs,
      promptTokens: 0, // Image generation doesn't use tokens
      completionTokens: 0,
      streaming: false,
      attachmentCount: attachments.length,
      success: true,
      context,
    });

    logResponse(context, {
      requestId,
      success: true,
      latencyMs,
    });

    return {
      status: 200,
      body: JSON.stringify(haloResponse, null, 2),
      headers: addCorsHeaders({ "Content-Type": "application/json" }),
    };
  } catch (error) {
    const latencyMs = Date.now() - startTime;

    if (error instanceof APIException) {
      logError(context, error, requestId);
      telemetry.trackRequest({
        requestId,
        model: "unknown",
        provider: "unknown",
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
