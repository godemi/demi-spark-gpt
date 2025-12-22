import { describe, it, expect, beforeEach, vi } from "vitest";
import { HALOTelemetry } from "../../../observability/telemetry";
import { createMockInvocationContext } from "../../helpers/mock-azure-functions";

describe("HALOTelemetry", () => {
  let telemetry: HALOTelemetry;
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.APPLICATIONINSIGHTS_CONNECTION_STRING;
    telemetry = new HALOTelemetry();
  });

  describe("trackRequest", () => {
    it("should track request without App Insights (fallback to console)", () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      const context = createMockInvocationContext();

      telemetry.trackRequest({
        requestId: "req-123",
        model: "gpt-4o",
        provider: "azure-openai",
        latencyMs: 150,
        promptTokens: 10,
        completionTokens: 15,
        streaming: false,
        attachmentCount: 0,
        success: true,
        context,
      });

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it("should track request with all fields", () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      const context = createMockInvocationContext();

      telemetry.trackRequest({
        requestId: "req-123",
        model: "gpt-4o",
        provider: "azure-openai",
        latencyMs: 150,
        promptTokens: 10,
        completionTokens: 15,
        reasoningTokens: 5000,
        streaming: true,
        attachmentCount: 2,
        success: true,
        errorCode: undefined,
        context,
      });

      expect(consoleSpy).toHaveBeenCalled();
      const callArgs = consoleSpy.mock.calls[0][0];
      expect(callArgs).toContain("req-123");
      consoleSpy.mockRestore();
    });

    it("should track request with error", () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      const context = createMockInvocationContext();

      telemetry.trackRequest({
        requestId: "req-123",
        model: "gpt-4o",
        provider: "azure-openai",
        latencyMs: 50,
        promptTokens: 0,
        completionTokens: 0,
        streaming: false,
        attachmentCount: 0,
        success: false,
        errorCode: "INVALID_REQUEST",
        context,
      });

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe("trackError", () => {
    it("should track error without App Insights", () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      const context = createMockInvocationContext();
      const error = new Error("Test error");

      telemetry.trackError(error, "req-123", context);

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe("trackMetric", () => {
    it("should track metric without App Insights (no-op)", () => {
      // Should not throw
      expect(() => {
        telemetry.trackMetric("test.metric", 100);
      }).not.toThrow();
    });
  });

  describe("flush", () => {
    it("should flush without App Insights (no-op)", () => {
      expect(() => {
        telemetry.flush();
      }).not.toThrow();
    });
  });
});

