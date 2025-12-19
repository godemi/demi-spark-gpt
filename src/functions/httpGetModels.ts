import { app } from "@azure/functions";
import { listModelsHandler } from "../handlers/listModelsHandler";

/**
 * Azure Function endpoint definition for GET /v1/models
 * Returns list of available models with capabilities
 */
app.http("listModels", {
  methods: ["GET"],
  route: "v1/models",
  authLevel: "function",
  handler: listModelsHandler,
});

