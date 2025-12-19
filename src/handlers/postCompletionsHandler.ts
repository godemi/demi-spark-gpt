import { HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { SparkGPTInputParametersType, SparkGPTProcessedParametersType } from "../models/types";
import {
  getAzureChatGPTRequestJson,
  returnAzureChatGPTRequestStream,
} from "../utils/azureChatGPTRequest";
import { APIException } from "../utils/exceptions";
import {
  addCorsHeaders,
  createJsonResponseContent,
  getHttpResponseInitJson,
} from "../utils/httpJsonResponse";
import { buildChatMessages } from "../utils/chatMessageBuilder";
import { generatePrePrompts } from "../utils/processPrePrompts";
import { validateAndConvertParams } from "../utils/validation";

/**
 * Handles POST /completions requests to process chat completion requests
 * @param request - The HTTP request object containing completion parameters
 * @param context - Azure Functions invocation context
 * @returns HTTP response with completion results or error details
 *
 * Processing steps:
 * 1. Validates JSON request body
 * 2. Converts and validates input parameters
 * 3. Processes pre-prompts and variables
 * 4. Makes Azure OpenAI API request
 * 5. Returns formatted response with timing information
 *
 * Error handling:
 * - Returns 400 for invalid requests
 * - Returns 500 for unexpected errors
 * - Includes detailed error information in response
 */
export const postCompletionsHandler = async (
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> => {
  // Handle CORS preflight requests
  if (request.method === "OPTIONS") {
    return {
      status: 204,
      headers: addCorsHeaders(),
    };
  }

  const startTime = Date.now();
  let requestJson: unknown;

  try {
    // Check if request body is empty
    const body = await request.text();
    if (!body) {
      throw new APIException(
        "Request body is empty. Please provide a valid JSON body.",
        400,
        "EMPTY_REQUEST_BODY"
      );
    }

    // Parse and validate request JSON
    try {
      requestJson = JSON.parse(body);
    } catch (parseError) {
      throw new APIException(
        "Invalid JSON received. Ensure the request has a valid JSON body with Content-Type: application/json.",
        400,
        parseError instanceof Error ? parseError.message : "Invalid JSON format"
      );
    }
    if (!requestJson || typeof requestJson !== "object" || Array.isArray(requestJson)) {
      throw new APIException(
        "Invalid request body. The request must contain a valid JSON object.",
        400,
        "Request body must be a non-null JSON object."
      );
    }

    // Validate and process parameters.
    const inputParams: SparkGPTInputParametersType = validateAndConvertParams(requestJson);
    const processedParams: SparkGPTProcessedParametersType = generatePrePrompts(inputParams);
    const chatMessages = buildChatMessages(processedParams);

    // Check streaming support.
    if (processedParams.stream === true) {
      return returnAzureChatGPTRequestStream(context, processedParams, startTime, chatMessages);
    }

    // Make Azure OpenAI API request
    const { response, payload, headers, errorResponse } =
      await getAzureChatGPTRequestJson(processedParams, chatMessages);

    // Return success response
    return getHttpResponseInitJson(
      200,
      createJsonResponseContent(
        startTime,
        response,
        errorResponse,
        payload,
        headers,
        processedParams
      )
    );
  } catch (error) {
    // Handle known API exceptions
    console.log("Caught error type:", error?.constructor?.name);
    console.log("Error details:", error);

    if (error instanceof APIException) {
      console.log("Handling APIException with status:", error.statusCode);
      return {
        status: error.statusCode,
        body: JSON.stringify(error.toResponse(), null, 2),
        headers: addCorsHeaders({ "Content-Type": "application/json" }),
      };
    }

    // Handle unexpected errors
    console.log("Handling unexpected error");
    const apiError = new APIException(
      "Internal Server Error",
      500,
      `An unexpected error occurred: ${error instanceof Error ? error.message : String(error)}`
    );
    return {
      status: 500,
      body: JSON.stringify(apiError.toResponse(), null, 2),
      headers: addCorsHeaders({ "Content-Type": "application/json" }),
    };
  }
};
