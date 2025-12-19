import { HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import axios, { AxiosError } from "axios";
import axiosRetry from "axios-retry";
import { getEnvVar } from "../utils/config";
import { APIException } from "../utils/exceptions";
import { addCorsHeaders } from "../utils/httpJsonResponse";
import { VERSION } from "../utils/readVersionFile";

/**
 * Handles Axios errors and converts them to standardized APIException format
 * @param error - The Axios error to handle
 * @throws APIException with appropriate status code and message
 */
const handleAxiosError = (error: AxiosError): never => {
  if (error.code === "ECONNABORTED") {
    throw new APIException(
      "Connection timeout",
      504,
      "The request timed out while trying to connect to the OpenAI API"
    );
  }

  if (error.code === "ECONNREFUSED") {
    throw new APIException(
      "Connection refused",
      503,
      "Could not establish connection to the OpenAI API"
    );
  }

  if (!error.response) {
    throw new APIException("Network error", 503, `Network error occurred: ${error.message}`);
  }

  throw new APIException(
    "OpenAI API error",
    error.response?.status || 503,
    `Service error: ${error.message}`
  );
};

/**
 * Creates a standardized HTTP response
 * @param status - HTTP status code
 * @param body - Response body object
 * @param errorCode - Optional error code for error responses
 * @returns Formatted HTTP response
 */
const createResponse = (
  status: number,
  body: Record<string, unknown>,
  errorCode?: string
): HttpResponseInit => ({
  status,
  body: JSON.stringify(body, null, 2),
  headers: addCorsHeaders({
    "Content-Type": "application/json",
    ...(errorCode && { "X-Error-Code": errorCode }),
  }),
});

/**
 * Handles GET /status requests to check API and Azure OpenAI availability
 * @param request - The HTTP request object
 * @param context - Azure Functions invocation context
 * @returns HTTP response with status information
 *
 * Status checks performed:
 * 1. Validates Azure OpenAI endpoint URL
 * 2. Attempts connection with retry mechanism
 * 3. Verifies authentication and authorization
 * 4. Returns detailed status information
 */
export async function getStatusHandler(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  try {
    // Get and validate environment variables
    const openAIUrl = getEnvVar("AZURE_OPENAI_ENDPOINT");
    const apiKey = getEnvVar("AZURE_OPENAI_API_KEY");

    // Validate URL format
    try {
      new URL(openAIUrl);
    } catch {
      throw new APIException(
        "Invalid Azure OpenAI endpoint URL",
        400,
        "The AZURE_OPENAI_ENDPOINT environment variable contains an invalid URL"
      );
    }

    // Configure axios with retry mechanism
    const client = axios.create({
      timeout: 5000, // 5 second timeout
      validateStatus: status => status < 500, // Don't reject on non-500 errors
    });

    // Setup retry configuration
    axiosRetry(client, {
      retries: 3,
      retryDelay: axiosRetry.exponentialDelay,
      retryCondition: error =>
        axiosRetry.isNetworkOrIdempotentRequestError(error) ||
        error.code === "ECONNABORTED" ||
        (error.response?.status ?? 0) >= 500,
    });

    let openaiStatus = "unreachable";
    let statusDetails = "";

    try {
      // Test Azure OpenAI connection with minimal request
      const response = await client.post(
        openAIUrl,
        {
          messages: [{ role: "user", content: "Hello" }],
          max_tokens: 1,
        },
        {
          headers: {
            "Content-Type": "application/json",
            "api-key": apiKey,
          },
        }
      );

      // Handle different response status codes
      switch (response.status) {
        case 200:
          openaiStatus = "reachable";
          break;
        case 401:
          throw new APIException(
            "Authentication failed",
            401,
            "Invalid API key or authentication token"
          );
        case 403:
          throw new APIException(
            "Access forbidden",
            403,
            "The API key doesn't have permission to access this endpoint"
          );
        case 404:
          throw new APIException(
            "Endpoint not found",
            404,
            "The specified Azure OpenAI endpoint URL is incorrect"
          );
        case 429:
          throw new APIException(
            "Rate limit exceeded",
            429,
            "Too many requests. Please try again later"
          );
        default:
          openaiStatus = `error (${response.status})`;
          statusDetails = response.data?.error?.message || "Unknown error";
          break;
      }
    } catch (error) {
      // Handle different types of errors
      if (error instanceof APIException) {
        throw error;
      }

      if (axios.isAxiosError(error)) {
        handleAxiosError(error);
      }

      throw new APIException("Unexpected error", 500, `An unexpected error occurred: ${error}`);
    }

    // Return success response
    return createResponse(200, {
      status: "ok",
      spark_gpt_status: "reachable",
      spark_azure_openai_status: openaiStatus,
      details: statusDetails || undefined,
      timestamp: new Date().toISOString(),
      version: VERSION,
    });
  } catch (error) {
    // Handle and format all errors
    if (error instanceof APIException) {
      return createResponse(
        error.statusCode,
        { ...error.toResponse(), version: VERSION },
        error.statusCode.toString()
      );
    }

    const apiError = new APIException(
      "Internal Server Error",
      500,
      `Unexpected error occurred: ${error instanceof Error ? error.message : String(error)}`
    );

    return createResponse(500, { ...apiError.toResponse(), version: VERSION }, "500");
  }
}
