import { HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { z } from "zod";
import { PARAMETER_CONSTRAINTS } from "../models/parameterConstraints";
import { PARAMETER_METADATA } from "../models/parameterMetadata";
import { SparkGPTInputParametersSchema } from "../models/types";
import { addCorsHeaders } from "../utils/httpJsonResponse";

/**
 * Interface defining the structure of parameter metadata
 * @interface ParameterMetadata
 */
interface ParameterMetadata {
  optional: boolean;
  type: string;
  allowed_values: string | null;
  description: string;
  usage: string;
  properties?: Record<string, ParameterMetadata>;
}

/**
 * Formats and extracts type information from a Zod schema
 * @param paramName - Name of the parameter being processed
 * @param paramSchema - Zod schema of the parameter
 * @returns Formatted parameter metadata
 */
function formatType(paramName: string, paramSchema: z.ZodTypeAny): ParameterMetadata {
  // Initialize metadata with default values
  const metadata: ParameterMetadata = {
    optional: false,
    type: "unknown",
    allowed_values: null,
    description: PARAMETER_METADATA[paramName]?.description ?? "",
    usage: PARAMETER_METADATA[paramName]?.usage ?? "",
  };

  // Unwrap effects (e.g., coerced numbers)
  if (paramSchema instanceof z.ZodEffects) {
    paramSchema = paramSchema._def.schema;
  }

  // Handle optional parameters
  if (paramSchema instanceof z.ZodOptional) {
    metadata.optional = true;
    paramSchema = paramSchema.unwrap();
  }

  // Handle different parameter types
  if (paramSchema instanceof z.ZodObject) {
    // Process object type parameters
    metadata.type = "object";
    metadata.properties = {};
    for (const [key, schema] of Object.entries(paramSchema.shape)) {
      metadata.properties[key] = formatType(key, schema as z.ZodTypeAny);
    }
  } else if (paramSchema instanceof z.ZodArray) {
    // Process array type parameters
    const elementMetadata = formatType("", paramSchema.element);
    if (elementMetadata.type === "object" && elementMetadata.properties) {
      metadata.type = "array";
      metadata.properties = elementMetadata.properties;
    } else {
      metadata.type = `${elementMetadata.type}[]`;
    }
  } else if (paramSchema instanceof z.ZodString) {
    metadata.type = "string";
  } else if (paramSchema instanceof z.ZodNumber) {
    metadata.type = "number";
  } else if (paramSchema instanceof z.ZodBoolean) {
    metadata.type = "boolean";
    metadata.allowed_values = "true | false";
  } else if (paramSchema instanceof z.ZodEnum) {
    metadata.type = "enum";
    metadata.allowed_values = paramSchema.options.map(String).join(" | ");
  } else if (paramSchema instanceof z.ZodUnion) {
    metadata.type = paramSchema._def.options
      .map((option: z.ZodTypeAny) => formatType("", option).type)
      .join(" | ");
  } else if (paramSchema instanceof z.ZodRecord) {
    metadata.type = "record";
    const valueType = formatType("", paramSchema._def.valueType).type;
    metadata.type = `Record<string, ${valueType}>`;
  }

  // Add constraint information if available
  if (paramName in PARAMETER_CONSTRAINTS) {
    const constraint = PARAMETER_CONSTRAINTS[paramName];
    const { min: minVal, max: maxVal } = constraint;

    if (minVal !== undefined && maxVal !== undefined) {
      metadata.allowed_values = `range(${minVal}, ${maxVal})`;
    } else if (minVal !== undefined) {
      metadata.allowed_values = `range(${minVal}, ∞)`;
    } else if (maxVal !== undefined) {
      metadata.allowed_values = `range(-∞, ${maxVal})`;
    }
  }

  return metadata;
}

/**
 * Handles GET /info requests
 * Returns API documentation including parameter descriptions and constraints
 * @param request - The HTTP request
 * @param context - The function invocation context
 * @returns HTTP response with API documentation
 */
export const getInfoHandler = async (
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> => {
  try {
    // Get all parameters from the Zod schema
    const shape = SparkGPTInputParametersSchema.shape as Record<string, z.ZodTypeAny>;

    // Convert schema definitions into detailed metadata
    const parametersInfo: Record<string, ParameterMetadata> = {};
    for (const [param, paramSchema] of Object.entries(shape)) {
      parametersInfo[param] = formatType(param, paramSchema);
    }

    // Construct API documentation
    const apiInfo = {
      description: "This API provides a ChatGPT-powered chat and completions functionality.",
      endpoints: {
        "POST /completions": "Send a chat request with JSON body containing parameters.",
        "GET /status": "Check if the API and ChatGPT are reachable.",
        "GET /info": "Retrieve API documentation.",
      },
      parameters: parametersInfo,
    };

    return {
      status: 200,
      body: JSON.stringify(apiInfo, null, 2),
      headers: addCorsHeaders({ "Content-Type": "application/json" }),
    };
  } catch (e: any) {
    return {
      status: 500,
      body: JSON.stringify({
        error: `Internal Server Error (${e.constructor.name}): ${e.message}`,
      }),
      headers: addCorsHeaders({ "Content-Type": "application/json" }),
    };
  }
};
