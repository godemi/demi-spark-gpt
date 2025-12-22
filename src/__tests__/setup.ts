import { beforeAll, afterEach, afterAll } from "vitest";
import { setupServer } from "msw/node";
import { handlers } from "./helpers/msw-handlers";

/**
 * Global test setup file
 *
 * Configures MSW for HTTP mocking and sets up test environment
 */

// Setup MSW server for HTTP request mocking
const server = setupServer(...handlers);

// Establish API mocking before all tests
beforeAll(() => {
  server.listen({ onUnhandledRequest: "error" });

  // Set default environment variables for tests
  process.env.AZURE_OPENAI_ENDPOINT =
    process.env.AZURE_OPENAI_ENDPOINT || "https://test.openai.azure.com";
  process.env.AZURE_OPENAI_DEPLOYMENT = process.env.AZURE_OPENAI_DEPLOYMENT || "gpt-4o";
  process.env.AZURE_OPENAI_API_KEY = process.env.AZURE_OPENAI_API_KEY || "test-api-key";
  process.env.AZURE_OPENAI_API_VERSION = process.env.AZURE_OPENAI_API_VERSION || "2024-10-21";
  process.env.OPENAI_API_KEY = process.env.OPENAI_API_KEY || "test-openai-key";
  process.env.APPLICATIONINSIGHTS_CONNECTION_STRING =
    process.env.APPLICATIONINSIGHTS_CONNECTION_STRING || "";
});

// Reset any request handlers that are added during tests
afterEach(() => {
  server.resetHandlers();
});

// Clean up after all tests are done
afterAll(() => {
  server.close();
});

