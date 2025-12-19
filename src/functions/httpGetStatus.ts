import { app } from "@azure/functions";
import { getStatusHandler } from "../handlers/getStatusHandler";

/**
 * Azure Function endpoint definition for GET /status
 * Configures the HTTP endpoint for checking API and OpenAI service status
 *
 * @endpoint GET /status
 * @auth function-level authentication required
 * @handler getStatusHandler - Checks availability of the API and OpenAI service
 */
app.http("status", {
  methods: ["GET"], // Only allow GET requests
  authLevel: "function", // Requires function-level authentication
  handler: getStatusHandler, // Links to the handler implementation
});
