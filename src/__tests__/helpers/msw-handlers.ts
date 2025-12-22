import { http, HttpResponse } from "msw";
import {
  mockOpenAIResponse,
  mockOpenAIStreamingChunk,
  mockOpenAIFinalChunk,
  mockOpenAIErrorResponse,
} from "../fixtures/responses/providerResponses";

/**
 * MSW (Mock Service Worker) handlers for HTTP request mocking
 *
 * Provides mock endpoints for all provider APIs used in tests
 */

export const handlers = [
  // Azure OpenAI mock endpoints
  http.post(
    "https://*.openai.azure.com/openai/deployments/*/chat/completions",
    async ({ request }) => {
      const body = (await request.json()) as any;

      // Simulate streaming request
      if (body.stream === true) {
        // Return streaming response (handled by ReadableStream in tests)
        return HttpResponse.json(mockOpenAIStreamingChunk);
      }

      // Simulate error responses
      if (body.messages?.[0]?.content === "trigger-error") {
        return HttpResponse.json(mockOpenAIErrorResponse, { status: 400 });
      }

      // Simulate rate limiting
      if (body.messages?.[0]?.content === "trigger-rate-limit") {
        return HttpResponse.json(
          { error: { message: "Rate limit exceeded", code: "rate_limit_exceeded" } },
          { status: 429 }
        );
      }

      // Normal response
      return HttpResponse.json(mockOpenAIResponse);
    }
  ),

  // OpenAI mock endpoints
  http.post("https://api.openai.com/v1/chat/completions", async ({ request }) => {
    const body = (await request.json()) as any;

    // Simulate streaming request
    if (body.stream === true) {
      return HttpResponse.json(mockOpenAIStreamingChunk);
    }

    // Simulate error responses
    if (body.messages?.[0]?.content === "trigger-error") {
      return HttpResponse.json(mockOpenAIErrorResponse, { status: 400 });
    }

    // Normal response
    return HttpResponse.json(mockOpenAIResponse);
  }),

  // Azure AI Foundry mock endpoints
  http.post("https://*.ai.azure.com/openai/deployments/*/chat/completions", async ({ request }) => {
    const body = (await request.json()) as any;

    // Simulate streaming request
    if (body.stream === true) {
      return HttpResponse.json(mockOpenAIStreamingChunk);
    }

    // Simulate error responses
    if (body.messages?.[0]?.content === "trigger-error") {
      return HttpResponse.json(
        { error: { message: "Azure Foundry error", code: "foundry_error" } },
        { status: 400 }
      );
    }

    // Normal response
    return HttpResponse.json(mockOpenAIResponse);
  }),

  // Image generation endpoint (OpenAI)
  http.post("https://api.openai.com/v1/images/generations", async () => {
    return HttpResponse.json({
      created: Math.floor(Date.now() / 1000),
      data: [
        {
          url: "https://example.com/generated-image.png",
          revised_prompt: "A beautiful landscape",
        },
      ],
    });
  }),
];

