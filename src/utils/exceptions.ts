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

  /**
   * Creates a new APIException instance
   *
   * @param message - Human-readable error message
   * @param statusCode - HTTP status code (e.g., 400, 401, 403, 500)
   * @param errorCode - Machine-readable error code (e.g., "INVALID_PARAMETER")
   */
  constructor(message: string, statusCode: number, errorCode: string) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;

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
   *     "status": 400
   *   }
   * }
   * ```
   */
  public toResponse(): {
    error: { code: string; message: string; status: number };
  } {
    return {
      error: {
        code: this.errorCode,
        message: this.message,
        status: this.statusCode,
      },
    };
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
