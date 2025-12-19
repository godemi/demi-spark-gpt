import { HttpResponseInit, InvocationContext } from "@azure/functions";
import axios, { AxiosResponse } from "axios";
import {
  OFFICIAL_AZURE_OPENAI_CHATGPT_PARAMETERS,
  SparkGPTProcessedParametersType,
} from "../models/types";
import { getEnvVar } from "./config";
import { addCorsHeaders, createJsonResponseContent } from "./httpJsonResponse";

/**
 * Generates the JSON payload and HTTP headers for an Azure OpenAI ChatGPT API request
 *
 * @param parameters - Processed parameters including prompts and optional API parameters
 * @returns Promise resolving to payload and headers for the API request
 *
 * @throws Error if required environment variables are missing
 */
export const generatePayloadAndHeaders = async (
  parameters: SparkGPTProcessedParametersType
): Promise<{ payload: Record<string, any>; headers: Record<string, any> }> => {
  // Define headers with required content type and API key
  const headers: Record<string, any> = {
    "Content-Type": "application/json",
    "api-key": getEnvVar("AZURE_OPENAI_API_KEY"),
  };

  const messages: Array<Record<string, any>> = [];

  // Include system pre-prompts if provided
  if (parameters.pre_prompts?.length > 0) {
    for (const prePrompt of parameters.pre_prompts) {
      console.log(
        `Adding ${prePrompt.role || "undefined-role"} pre-prompt of type ${
          prePrompt.type
        } with text ${prePrompt.text.substring(0, 50)}...`
      );
      messages.push({
        role: prePrompt.role || "system",
        content: prePrompt.text,
      });
    }
  }

  // Add the main user prompt
  messages.push({
    role: "user",
    content: parameters.prompt || "",
  });

  const payload: Record<string, any> = { messages };

  // Add optional parameters if present
  for (const p of OFFICIAL_AZURE_OPENAI_CHATGPT_PARAMETERS) {
    if (p in parameters) {
      payload[p] = parameters[p as keyof SparkGPTProcessedParametersType];
    }
  }

  return { payload, headers };
};

/**
 * Handles streaming requests to Azure OpenAI ChatGPT API
 *
 * @param parameters - Processed parameters for streaming request
 * @returns Promise resolving to HttpResponse with SSE stream
 *
 * @throws Error for network or processing failures
 */
export const returnAzureChatGPTRequestStream = async (
  context: InvocationContext,
  parameters: SparkGPTProcessedParametersType,
  startTime: number
): Promise<HttpResponseInit> => {
  try {
    const { payload, headers } = await generatePayloadAndHeaders(parameters);
    const axiosResponse: AxiosResponse = await axios.post(
      getEnvVar("AZURE_OPENAI_ENDPOINT"),
      payload,
      {
        headers,
        responseType: "stream",
      }
    );

    const headersRedacted = redactSensitiveHeaderData(headers);

    const stream = axiosResponse.data;
    // Accumulator for the complete delta content (in order).
    let finalContent = "";
    // Buffer to hold incomplete SSE lines.
    let bufferedData = "";
    // Hold the latest JSON chunk.
    let finalJson: Record<string, any> | null = null;
    // Flag to stop updating finalJson if finish_reason becomes "stop".
    let finished = false;

    return {
      status: 200,
      headers: addCorsHeaders({
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      }),
      body: new ReadableStream({
        start(controller) {
          stream.on("data", (chunk: Buffer) => {
            bufferedData += chunk.toString();
            const lines = bufferedData.split("\n");
            // Keep the last (possibly incomplete) line.
            bufferedData = lines.pop() || "";

            for (const line of lines) {
              const trimmedLine = line.trim();
              if (!trimmedLine) continue;

              if (!trimmedLine.startsWith("data:")) {
                // Forward non-SSE lines as-is.
                controller.enqueue(new TextEncoder().encode(line + "\n"));
                continue;
              }

              // Remove the "data:" prefix.
              const dataPart = trimmedLine.slice(5).trim();
              if (dataPart === "[DONE]") continue;

              try {
                const parsed = JSON.parse(dataPart);
                // Only update finalJson if finish_reason hasn't been "stop"
                if (!finished) {
                  finalJson = parsed;
                  if (parsed?.choices?.[0]?.finish_reason === "stop") {
                    finished = true;
                  }
                }
                const deltaContent = parsed?.choices?.[0]?.delta?.content;
                if (typeof deltaContent === "string") {
                  finalContent += deltaContent;
                }
              } catch (err) {
                context.error("Error parsing SSE data:", err);
              }
              // Forward the raw line immediately.
              controller.enqueue(new TextEncoder().encode(line + "\n"));
            }
          });

          stream.on("end", () => {
            if (bufferedData.trim().startsWith("data:")) {
              const dataPart = bufferedData.trim().slice(5).trim();
              if (dataPart !== "[DONE]") {
                try {
                  const parsed = JSON.parse(dataPart);
                  if (!finished) {
                    finalJson = parsed;
                    if (parsed?.choices?.[0]?.finish_reason === "stop") {
                      finished = true;
                    }
                  }
                  const deltaContent = parsed?.choices?.[0]?.delta?.content;
                  if (typeof deltaContent === "string") {
                    finalContent += deltaContent;
                  }
                } catch (err) {
                  context.error("Error parsing final buffered data:", err);
                }
              }
            }

            // Build the final JSON response – updating its delta.content with the complete finalContent.
            let finalResponse: Record<string, any>;
            if (finalJson && finalJson.choices && finalJson.choices[0]) {
              finalResponse = {
                ...finalJson,
                choices: [
                  {
                    ...finalJson.choices[0],
                    delta: {
                      ...finalJson.choices[0].delta,
                      content: finalContent,
                    },
                  },
                ],
              };
            } else {
              finalResponse = { finalContent };
            }

            // Send the final SSE message.
            const finalMessage = `data: ${JSON.stringify(
              createJsonResponseContent(
                startTime,
                finalResponse,
                null,
                payload,
                headersRedacted,
                parameters
              )
            )}\n\n`;
            controller.enqueue(new TextEncoder().encode(finalMessage));

            console.log("finalMessage", finalMessage);

            controller.close();
          });

          stream.on("error", (err: Error) => {
            context.error("Stream error:", err);
            controller.error(err);
          });
        },
      }),
    };
  } catch (error) {
    context.error("Error calling OpenAI API:", error);
    return { status: 500, body: "Error calling OpenAI API" };
  }
};

const redactSensitiveHeaderData = (headers: Record<string, any>): Record<string, any> => {
  // Redact API key for security
  if ("api-key" in headers) {
    headers["api-key"] = "*** API KEY REDACTED ***";
  }
  return headers;
};

/**
 * Handles non-streaming requests to Azure OpenAI ChatGPT API
 *
 * @param parameters - Processed parameters for the request
 * @returns Promise resolving to response object with API response or error details
 *
 * @throws Error for network or processing failures
 */
export const getAzureChatGPTRequestJson = async (
  parameters: SparkGPTProcessedParametersType
): Promise<{
  response: any | null;
  payload: Record<string, any>;
  headers: Record<string, any>;
  errorResponse: any | null;
}> => {
  const { payload, headers } = await generatePayloadAndHeaders(parameters);

  try {
    // Make non-streaming POST request
    const response: AxiosResponse = await axios.post(getEnvVar("AZURE_OPENAI_ENDPOINT"), payload, {
      headers,
    });

    const headersRedacted = redactSensitiveHeaderData(headers);

    return {
      response: response.data,
      payload: payload,
      headers: headersRedacted,
      errorResponse: null,
    };
  } catch (error: any) {
    // Format error response
    const errorResponse = {
      error_name: "INTERNAL_SERVER_ERROR",
      error_message: `Failed to make or process the request: ${error.message}`,
      status_code: 500,
    };

    return {
      response: null,
      payload: payload,
      headers: headers,
      errorResponse: errorResponse,
    };
  }
};
