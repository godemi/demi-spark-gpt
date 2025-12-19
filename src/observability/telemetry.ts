import * as appInsights from "applicationinsights";
import { InvocationContext } from "@azure/functions";

/**
 * HALO Telemetry - Application Insights integration
 * 
 * Tracks requests, metrics, and errors for observability
 */
export class HALOTelemetry {
  private client: appInsights.TelemetryClient | null = null;
  private initialized = false;

  constructor() {
    // Initialize Application Insights if connection string is available
    const connectionString = process.env.APPLICATIONINSIGHTS_CONNECTION_STRING;
    if (connectionString) {
      appInsights.setup(connectionString).start();
      this.client = appInsights.defaultClient;
      this.initialized = true;
    }
  }

  /**
   * Track a chat completion request
   */
  trackRequest(data: {
    requestId: string;
    model: string;
    provider: string;
    latencyMs: number;
    promptTokens: number;
    completionTokens: number;
    reasoningTokens?: number;
    streaming: boolean;
    attachmentCount: number;
    success: boolean;
    errorCode?: string;
    context?: InvocationContext;
  }): void {
    if (!this.initialized || !this.client) {
      // Fallback to console logging if App Insights not configured
      console.log("Telemetry:", JSON.stringify(data));
      return;
    }

    // Track custom event
    this.client.trackEvent({
      name: "ChatCompletion",
      properties: {
        request_id: data.requestId,
        model: data.model,
        provider: data.provider,
        streaming: String(data.streaming),
        success: String(data.success),
        error_code: data.errorCode || "",
      },
      measurements: {
        latency_ms: data.latencyMs,
        prompt_tokens: data.promptTokens,
        completion_tokens: data.completionTokens,
        reasoning_tokens: data.reasoningTokens || 0,
        attachment_count: data.attachmentCount,
      },
    });

    // Track dependency (provider call)
    this.client.trackDependency({
      name: `${data.provider}-${data.model}`,
      data: `Chat completion request`,
      duration: data.latencyMs,
      success: data.success,
      resultCode: data.success ? "200" : data.errorCode || "500",
      dependencyTypeName: "HTTP",
    });

    // Track metrics
    this.client.trackMetric({
      name: "ChatCompletion.Latency",
      value: data.latencyMs,
    });

    this.client.trackMetric({
      name: "ChatCompletion.Tokens.Total",
      value: data.promptTokens + data.completionTokens,
    });
  }

  /**
   * Track an error
   */
  trackError(
    error: Error,
    requestId: string,
    context?: InvocationContext
  ): void {
    if (!this.initialized || !this.client) {
      console.error("Error:", error);
      return;
    }

    this.client.trackException({
      exception: error,
      properties: {
        request_id: requestId,
      },
    });
  }

  /**
   * Track custom metric
   */
  trackMetric(name: string, value: number, properties?: Record<string, string>): void {
    if (!this.initialized || !this.client) {
      return;
    }

    this.client.trackMetric({
      name,
      value,
      properties,
    });
  }

  /**
   * Flush telemetry (call before function exit)
   */
  flush(): void {
    if (this.initialized && this.client) {
      this.client.flush();
    }
  }
}

// Singleton instance
export const telemetry = new HALOTelemetry();

