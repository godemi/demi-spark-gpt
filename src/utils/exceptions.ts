/**
 * Provider error interface
 */
export interface ProviderError {
  code: string;
  message: string;
  type: string;
  param?: string;
  status?: number;
}

/**
 * HALO error response format
 */
export interface HALOError {
  error: {
    code: string;
    message: string;
    status: number;
    provider_error?: ProviderError;
    request_id: string;
    timestamp: string;
  };
}

/**
 * Custom exception class for API-related errors
 * Extends the built-in Error class with additional API-specific properties
 *
 * @class APIException
 * @extends Error
 *
 * Usage:
 * ```typescript
 * throw new APIException(
 *   "Invalid API key provided",
 *   401,
 *   "INVALID_API_KEY"
 * );
 * ```
 */
export class APIException extends Error {
  public statusCode: number;
  public errorCode: string;
  public providerError?: ProviderError;
  public requestId?: string;

  /**
   * Creates a new APIException instance
   *
   * @param message - Human-readable error message
   * @param statusCode - HTTP status code (e.g., 400, 401, 403, 500)
   * @param errorCode - Machine-readable error code (e.g., "INVALID_PARAMETER")
   * @param providerError - Optional provider-specific error details
   * @param requestId - Optional request ID for correlation
   */
  constructor(
    message: string,
    statusCode: number,
    errorCode: string,
    providerError?: ProviderError,
    requestId?: string
  ) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.providerError = providerError;
    this.requestId = requestId;

    // Fix the prototype chain for built-in Error extension
    Object.setPrototypeOf(this, APIException.prototype);
  }

  /**
   * Returns a structured error object suitable for API responses
   *
   * @returns Object containing error details formatted for API response
   *
   * Example Response:
   * ```json
   * {
   *   "error": {
   *     "code": "INVALID_PARAMETER",
   *     "message": "Parameter 'temperature' must be between 0 and 1",
   *     "status": 400,
   *     "request_id": "abc123",
   *     "timestamp": "2025-01-01T00:00:00Z"
   *   }
   * }
   * ```
   */
  public toResponse(): HALOError {
    return {
      error: {
        code: this.errorCode,
        message: this.message,
        status: this.statusCode,
        provider_error: this.providerError,
        request_id: this.requestId || this.generateRequestId(),
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * Generate a simple request ID (fallback if not provided)
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Returns a string representation of the error for logging
   *
   * @returns Formatted error string
   *
   * Example:
   * ```
   * APIException [INVALID_PARAMETER]: Parameter 'temperature' must be between 0 and 1 (Status: 400)
   * ```
   */
  public override toString(): string {
    return `APIException [${this.errorCode}]: ${this.message} (Status: ${this.statusCode})`;
  }
}
