import { AzureChatGPTResponse } from "../models/types";
import { VERSION } from "./readVersionFile";

export interface SuccessResponse {
  status: number;
  body: AzureChatGPTResponse;
  headers: { [key: string]: string };
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400",
};

export const addCorsHeaders = (headers: Record<string, string> = {}) => ({
  ...headers,
  ...corsHeaders,
});

/**
 * Creates a standardized success HTTP response.
 *
 * This function builds a response object containing the API version,
 * the time elapsed since the start of processing, and the results from
 * the Azure OpenAI API call.
 *
 * @param startTime - The timestamp (in milliseconds) when processing started.
 * @param response - The successful response data from the Azure OpenAI API.
 * @param errorResponse - The error data if the API call failed.
 * @param payload - The payload sent to the Azure OpenAI API.
 * @param headers - The headers returned or used in the API call.
 * @param parameters - The parameters used in the API call.
 * @returns An object conforming to SuccessResponse.
 */
export const createJsonResponseContent = (
  startTime: number,
  response: any,
  errorResponse: any,
  payload: any,
  headers: any,
  parameters: any
): SuccessResponse => {
  const timeElapsed = Date.now() - startTime;

  // Create a copy of parameters without pre_prompts
  const filteredParameters = { ...parameters };
  delete filteredParameters.pre_prompts;

  return {
    status: 200,
    body: {
      version: VERSION,
      time: timeElapsed,
      response: response ?? errorResponse,
      payload: payload,
      headers: headers,
      parameters: filteredParameters,
    },
    headers: addCorsHeaders({ "Content-Type": "application/json" }),
  };
};

export const getHttpResponseInitJson = (statusCode: number, body: any) => {
  return {
    status: statusCode,
    body: JSON.stringify(body, null, 2),
    headers: addCorsHeaders({ "Content-Type": "application/json" }),
  };
};
