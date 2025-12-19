import { HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { addCorsHeaders } from "../utils/httpJsonResponse";
import { MODEL_REGISTRY, getModelsForProvider } from "../providers/modelRegistry";
import { APIException } from "../utils/exceptions";

/**
 * Handles GET /v1/models requests
 * 
 * Returns list of available models with their capabilities
 */
export const listModelsHandler = async (
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> => {
  try {
    const provider = request.query.get("provider");

    let models: string[];
    if (provider) {
      models = getModelsForProvider(provider);
    } else {
      models = Object.keys(MODEL_REGISTRY);
    }

    const modelsList = models.map((model) => {
      const capabilities = MODEL_REGISTRY[model];
      return {
        id: model,
        object: "model",
        created: Math.floor(Date.now() / 1000),
        owned_by: "halo-layer",
        capabilities: {
          chat: capabilities.chat,
          vision: capabilities.vision,
          image_generate: capabilities.image_generate,
          tool_calls: capabilities.tool_calls,
          json_mode: capabilities.json_mode,
          reasoning: capabilities.reasoning,
          max_context_tokens: capabilities.max_context_tokens,
          max_output_tokens: capabilities.max_output_tokens,
          supports_streaming: capabilities.supports_streaming,
        },
      };
    });

    const response = {
      object: "list",
      data: modelsList,
    };

    return {
      status: 200,
      body: JSON.stringify(response, null, 2),
      headers: addCorsHeaders({ "Content-Type": "application/json" }),
    };
  } catch (error) {
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

