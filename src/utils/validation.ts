import {
  DEFAULT_SPARK_GPT_PARAMETERS,
  SparkGPTInputParametersSchema,
  SparkGPTInputParametersType,
} from "../models/types";
import { APIException } from "./exceptions";

const REQUEST_SCHEMA = SparkGPTInputParametersSchema.strict();

const formatZodErrors = (issues: { path: (string | number)[]; message: string }[]): string =>
  issues.map(issue => `${issue.path.join(".") || "root"}: ${issue.message}`).join("; ");

export const validateAndConvertParams = (
  reqBody: Record<string, any>
): SparkGPTInputParametersType => {
  const result = REQUEST_SCHEMA.safeParse(reqBody);

  if (!result.success) {
    throw new APIException(
      `Invalid parameters: ${formatZodErrors(result.error.issues)}`,
      400,
      "INVALID_PARAMETERS"
    );
  }

  const parsed = result.data;

  if (
    parsed.prompt === undefined ||
    (typeof parsed.prompt === "string" && parsed.prompt.trim() === "") ||
    (Array.isArray(parsed.prompt) && parsed.prompt.every(p => p.trim() === ""))
  ) {
    throw new APIException(
      "The 'prompt' parameter must be provided and cannot be empty.",
      400,
      "EMPTY_PROMPT"
    );
  }

  if (parsed.min_tokens !== undefined && !parsed.system_pre_prompts_generate_min_tokens) {
    throw new APIException(
      "Parameter 'min_tokens' requires 'system_pre_prompts_generate_min_tokens' to be set to true.",
      400,
      "INVALID_PARAMETER_COMBINATION"
    );
  }

  if (
    parsed.history_strategy === "token_budget" &&
    parsed.max_history_tokens !== undefined &&
    parsed.max_history_tokens < 32
  ) {
    throw new APIException(
      "Parameter 'max_history_tokens' must be at least 32 when using token_budget strategy.",
      400,
      "INVALID_PARAMETER_COMBINATION"
    );
  }

  const merged = {
    ...DEFAULT_SPARK_GPT_PARAMETERS,
    ...parsed,
  };

  delete (merged as any).pre_prompts;

  return merged as SparkGPTInputParametersType;
};
