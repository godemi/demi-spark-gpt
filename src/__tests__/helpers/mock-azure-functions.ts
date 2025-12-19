import { HttpRequest, InvocationContext } from "@azure/functions";
import { vi } from "vitest";

/**
 * Create a mock Azure Functions HttpRequest
 */
export function createMockHttpRequest(
  body?: any,
  method: string = "POST",
  query?: Record<string, string>
): HttpRequest {
  return {
    method,
    url: "https://test.azurewebsites.net/api/test",
    headers: {
      "content-type": "application/json",
    },
    query: new URLSearchParams(query || {}),
    params: {},
    user: null,
    text: async () => (body ? JSON.stringify(body) : ""),
    json: async () => body || {},
    formData: async () => ({}) as any,
    arrayBuffer: async () => new ArrayBuffer(0),
    blob: async () => new Blob(),
  } as HttpRequest;
}

/**
 * Create a mock Azure Functions InvocationContext
 */
export function createMockInvocationContext(): InvocationContext {
  return {
    invocationId: "test-invocation-id",
    functionName: "test-function",
    extraInputs: new Map(),
    extraOutputs: new Map(),
    traceContext: {} as any,
    executionContext: {
      invocationId: "test-invocation-id",
      functionName: "test-function",
      functionDirectory: "/test",
      retryContext: undefined,
    },
    log: {
      error: vi.fn(),
      warn: vi.fn(),
      info: vi.fn(),
      verbose: vi.fn(),
    } as any,
    error: vi.fn(),
    trace: vi.fn(),
    done: vi.fn(),
  } as InvocationContext;
}
