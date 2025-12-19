import { PARAMETER_CONSTRAINTS, ParameterName } from "../models/parameterConstraints";
import {
  DEFAULT_SPARK_GPT_PARAMETERS,
  SparkGPTInputParametersSchema,
  SparkGPTInputParametersType,
} from "../models/types";
import { APIException } from "./exceptions";

/**
 * Validates a numeric parameter against its constraints
 */
function validateNumericParameter(value: any, paramName: ParameterName): number {
  const constraint = PARAMETER_CONSTRAINTS[paramName];
  const converted =
    constraint.type === "int" ? parseInt(String(value), 10) : parseFloat(String(value));

  if (isNaN(converted)) {
    throw new Error(`Parameter '${paramName}' must be a valid ${constraint.type}`);
  }

  if (converted < constraint.min) {
    throw new Error(`Parameter '${paramName}' must be >= ${constraint.min}`);
  }

  if (constraint.max !== null && converted > constraint.max) {
    throw new Error(`Parameter '${paramName}' must be <= ${constraint.max}`);
  }

  return constraint.type === "int" ? Math.floor(converted) : converted;
}

/**
 * Validates that a given object matches the provided schema.
 */
function validateTypedDict(obj: any, schema: { [key: string]: any }): boolean {
  for (const key in schema) {
    if (!Object.prototype.hasOwnProperty.call(obj, key)) {
      return false;
    }
    const expected = schema[key];
    const value = obj[key];
    if (Array.isArray(expected)) {
      if (typeof value !== "string" || !expected.includes(value)) {
        return false;
      }
    } else if (expected === String) {
      if (typeof value !== "string") {
        return false;
      }
    } else if (expected === Number) {
      if (typeof value !== "number") {
        return false;
      }
    } else {
      if (typeof value !== typeof expected) {
        return false;
      }
    }
  }
  return true;
}

/**
 * Converts the provided variable based on its type.
 */
function convertVariableValue(variable: any): any {
  switch (variable.type) {
    case "integer":
      return parseInt(variable.value, 10);
    case "float":
      return parseFloat(variable.value);
    case "boolean":
      if (typeof variable.value === "boolean") {
        return variable.value;
      }
      if (typeof variable.value === "string") {
        const lowerVal = variable.value.toLowerCase();
        if (lowerVal === "true") return true;
        if (lowerVal === "false") return false;
      }
      throw new Error(`Invalid boolean value for ${variable.name}`);
    case "iso-8601":
    case "timestamp":
      const date = new Date(variable.value);
      if (isNaN(date.getTime())) {
        throw new Error(`Invalid date format for ${variable.name}`);
      }
      return date;
    case "string":
    default:
      return variable.value;
  }
}

export const validateAndConvertParams = (
  reqBody: Record<string, any>
): SparkGPTInputParametersType => {
  const errors: string[] = [];
  const convertedParams: Partial<SparkGPTInputParametersType> = {};

  // Dynamically get valid parameters from the Zod schema
  const validParameters = new Set(Object.keys(SparkGPTInputParametersSchema.shape));

  const unknownParams = Object.keys(reqBody).filter(param => !validParameters.has(param));
  if (unknownParams.length > 0) {
    throw new APIException(
      `Unknown parameters provided: ${unknownParams.join(
        ", "
      )}. Valid parameters are: ${Array.from(validParameters).join(", ")}`,
      400,
      "INVALID_PARAMETERS"
    );
  }

  for (const _param in reqBody) {
    const param = _param as keyof SparkGPTInputParametersType;
    const actualValue = reqBody[param];

    // Handle custom_pre_prompts
    if (param === "custom_pre_prompts") {
      if (!Array.isArray(actualValue)) {
        errors.push(`Parameter '${param}' must be a list.`);
        continue;
      }
      const customPrePromptSchema = {
        name: String,
        description: String,
        role: ["system", "user", "assistant"],
        text: String,
      };
      if (!actualValue.every((item: any) => validateTypedDict(item, customPrePromptSchema))) {
        errors.push(
          `Invalid structure for '${param}'. Must be a list of objects matching CustomPrePromptType.`
        );
        continue;
      }
      convertedParams[param] = actualValue;
      continue;
    }

    // Handle variables
    if (param === "variables") {
      if (!Array.isArray(actualValue)) {
        errors.push(`Parameter '${param}' must be a list.`);
        continue;
      }
      const variableSchema = {
        name: String,
        description: String,
        value: String,
        type: ["string", "iso-8601", "integer", "float", "boolean", "timestamp"],
      };
      const validatedVariables: any[] = [];
      for (const item of actualValue) {
        if (!validateTypedDict(item, variableSchema)) {
          errors.push(`Invalid structure for '${param}'. Each item must match VariableType.`);
          continue;
        }
        try {
          item.value = convertVariableValue(item);
          validatedVariables.push(item);
        } catch (e: any) {
          errors.push(e.message);
        }
      }
      convertedParams[param] = validatedVariables;
      continue;
    }

    // Handle numeric parameters using PARAMETER_CONSTRAINTS
    if (param in PARAMETER_CONSTRAINTS) {
      try {
        const numericParam = param as keyof SparkGPTInputParametersType;
        // We know this will be a numeric parameter based on PARAMETER_CONSTRAINTS
        // @ts-ignore
        convertedParams[numericParam] = validateNumericParameter(
          actualValue,
          param as ParameterName
        );
      } catch (e: any) {
        errors.push(e.message);
      }
      continue;
    }

    // For non-numeric parameters, assign the value directly
    const typedParam = param as keyof SparkGPTInputParametersType;
    convertedParams[typedParam] = actualValue;

    // For other parameters, assign the value directly
    convertedParams[param] = actualValue;
  }

  // Apply defaults
  for (const key in DEFAULT_SPARK_GPT_PARAMETERS) {
    const typedKey = key as keyof SparkGPTInputParametersType;
    if (convertedParams[typedKey] === undefined) {
      // @ts-ignore
      convertedParams[typedKey] = DEFAULT_SPARK_GPT_PARAMETERS[typedKey];
    }
  }

  // Validate prompt is not empty
  if (
    convertedParams.prompt === undefined ||
    (typeof convertedParams.prompt === "string" && convertedParams.prompt.trim() === "") ||
    (Array.isArray(convertedParams.prompt) && convertedParams.prompt.length === 0)
  ) {
    throw new APIException(
      "The 'prompt' parameter is a string and must be provided and cannot be empty.",
      400,
      "EMPTY_PROMPT"
    );
  }

  // Validate required parameters.
  const requiredParams = [
    "prompt",
    "temperature",
    "max_tokens",
    "fallback_result_language",
    "system_pre_prompts_global",
    "system_pre_prompts_generate_min_tokens",
    "system_pre_prompts_explain_technical_terms",
    "system_pre_prompts_non_expert_mode",
    "system_pre_prompts_brief_response",
    "system_pre_prompts_add_emoticons",
    "system_pre_prompts_format_as_markdown",
    "top_p",
  ];

  const missingParams = requiredParams.filter(
    param => convertedParams[param as keyof SparkGPTInputParametersType] === undefined
  );

  if (missingParams.length > 0) {
    throw new APIException(
      `Missing required parameters: ${missingParams.join(", ")}`,
      400,
      "MISSING_REQUIRED_PARAMETERS"
    );
  }

  // Validate min_tokens requirement
  if (
    convertedParams.hasOwnProperty("min_tokens") &&
    convertedParams["min_tokens"] !== undefined &&
    !convertedParams["system_pre_prompts_generate_min_tokens"]
  ) {
    console.log("min_tokens", convertedParams["min_tokens"]);
    console.log("type of min_tokens", typeof convertedParams["min_tokens"]);
    errors.push(
      "Parameter 'min_tokens' requires 'system_pre_prompts_generate_min_tokens' to be set to true."
    );
  }

  if (errors.length > 0) {
    throw new APIException(
      "Parameter validation failed: " + errors.join("; "),
      400,
      "INVALID_PARAMETER_TYPE"
    );
  }

  return convertedParams as SparkGPTInputParametersType;
};
