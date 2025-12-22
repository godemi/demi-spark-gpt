/**
 * Main entry point for Azure Functions
 * Imports all function definitions to ensure they are registered
 */

// Validate environment variables at startup
import { validateEnvironmentVariables } from "./utils/envValidation";

// Validate environment variables and show helpful messages
try {
  validateEnvironmentVariables();
} catch (error) {
  console.error("⚠️  Environment validation error:", error);
  console.error(
    "\n📝 Please ensure all required environment variables are set.\n"
  );
}

// Import all function definitions
import "./functions/httpGetInfo";
import "./functions/httpGetModels"; // Models list endpoint
import "./functions/httpGetStatus";
import "./functions/httpPostChatCompletions"; // New HALO endpoint
import "./functions/httpPostCompletions"; // Legacy endpoint (deprecated)
import "./functions/httpPostImageGenerate"; // Image generation endpoint
