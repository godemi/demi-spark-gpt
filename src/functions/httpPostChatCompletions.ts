import { app } from "@azure/functions";
import { chatCompletionsHandler } from "../handlers/chatCompletionsHandler";

/**
 * Azure Function endpoint definition for POST /v1/chat/completions
 * Main HALO layer endpoint for chat completions
 */
app.http("chatCompletions", {
  methods: ["POST", "OPTIONS"],
  route: "v1/chat/completions",
  authLevel: "function",
  handler: chatCompletionsHandler,
});

