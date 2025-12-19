import { app } from "@azure/functions";
import { getInfoHandler } from "../handlers/getInfoHandler";

/**
 * Azure Function endpoint definition for GET /info
 * Configures the HTTP endpoint for retrieving API documentation
 *
 * @endpoint GET /info
 * @auth function-level authentication required
 * @handler getInfoHandler - Processes the request and returns API documentation
 */
app.http("info", {
  methods: ["GET"], // Only allow GET requests
  authLevel: "function", // Requires function-level authentication
  handler: getInfoHandler, // Links to the handler implementation
});
