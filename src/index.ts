/**
 * Main entry point for Azure Functions
 * Imports all function definitions to ensure they are registered
 */

// Import all function definitions
import "./functions/httpGetInfo";
import "./functions/httpGetModels"; // Models list endpoint
import "./functions/httpGetStatus";
import "./functions/httpPostChatCompletions"; // New HALO endpoint
import "./functions/httpPostCompletions"; // Legacy endpoint (deprecated)
import "./functions/httpPostImageGenerate"; // Image generation endpoint
