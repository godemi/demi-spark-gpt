import { app } from "@azure/functions";
import { imageGenerateHandler } from "../handlers/imageGenerateHandler";

/**
 * Azure Function endpoint definition for POST /v1/images/generations
 * Image generation endpoint (DALL-E, etc.)
 */
app.http("imageGenerate", {
  methods: ["POST", "OPTIONS"],
  route: "v1/images/generations",
  authLevel: "function",
  handler: imageGenerateHandler,
});
