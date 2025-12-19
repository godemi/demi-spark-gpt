import { app } from "@azure/functions";
import { postCompletionsHandler } from "../handlers/postCompletionsHandler";

/**
 * Azure Function endpoint definition for POST /completions
 * Configures the HTTP endpoint for chat completions requests
 *
 * @endpoint POST /completions
 * @auth function-level authentication required
 * @handler postCompletionsHandler - Processes chat completion requests
 * @description
 * Main endpoint for chat completions:
 * - Accepts POST requests with completion parameters
 * - Validates input parameters
 * - Processes requests through Azure OpenAI
 * - Returns completion responses or handles errors
 */
app.http("completions", {
  methods: ["POST"], // Only allow POST requests
  authLevel: "function", // Requires function-level authentication
  handler: postCompletionsHandler, // Links to the handler implementation
});
