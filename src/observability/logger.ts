import { InvocationContext } from "@azure/functions";

/**
 * Structured logging with secret redaction
 */

const SENSITIVE_KEYS = [
  "api-key",
  "api_key",
  "authorization",
  "x-api-key",
  "password",
  "secret",
  "token",
  "apikey",
];

/**
 * Redact sensitive information from objects
 */
export function redactSecrets(obj: any, depth = 0, maxDepth = 10): any {
  if (depth > maxDepth) {
    return "[MAX_DEPTH_REACHED]";
  }

  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj !== "object") {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => redactSecrets(item, depth + 1, maxDepth));
  }

  const redacted: any = {};

  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();
    const isSensitive = SENSITIVE_KEYS.some((sensitive) =>
      lowerKey.includes(sensitive)
    );

    if (isSensitive) {
      redacted[key] = "***REDACTED***";
    } else if (typeof value === "object" && value !== null) {
      redacted[key] = redactSecrets(value, depth + 1, maxDepth);
    } else {
      redacted[key] = value;
    }
  }

  return redacted;
}

/**
 * Log request with structured format
 */
export function logRequest(
  context: InvocationContext,
  request: {
    requestId: string;
    model: string;
    provider?: string;
    messageCount: number;
    stream: boolean;
    hasAttachments?: boolean;
  }
): void {
  context.log({
    level: "info",
    message: "Incoming chat completion request",
    request_id: request.requestId,
    model: request.model,
    provider: request.provider || "unknown",
    message_count: request.messageCount,
    stream: request.stream,
    has_attachments: request.hasAttachments || false,
    // Never log message content by default
  });
}

/**
 * Log response with structured format
 */
export function logResponse(
  context: InvocationContext,
  response: {
    requestId: string;
    success: boolean;
    latencyMs: number;
    promptTokens?: number;
    completionTokens?: number;
    errorCode?: string;
  }
): void {
  context.log({
    level: response.success ? "info" : "error",
    message: response.success
      ? "Chat completion request completed"
      : "Chat completion request failed",
    request_id: response.requestId,
    success: response.success,
    latency_ms: response.latencyMs,
    prompt_tokens: response.promptTokens,
    completion_tokens: response.completionTokens,
    error_code: response.errorCode,
  });
}

/**
 * Log error with structured format
 */
export function logError(
  context: InvocationContext,
  error: Error,
  requestId: string,
  additionalContext?: Record<string, any>
): void {
  context.error({
    level: "error",
    message: error.message,
    request_id: requestId,
    error_name: error.constructor.name,
    error_stack: error.stack,
    ...redactSecrets(additionalContext || {}),
  });
}

