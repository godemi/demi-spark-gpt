/**
 * Main entry point for Azure Functions
 * 
 * IMPORTANT: All function registrations must happen at the top level
 * with no other code execution before them. This ensures Azure Functions
 * can properly detect and register all HTTP triggers.
 */

// Import Azure Functions app instance
import { app } from "@azure/functions";

// Register all HTTP functions - these MUST be imported first
// and executed synchronously during module load
import "./functions/httpGetInfo";
import "./functions/httpGetModels";
import "./functions/httpGetStatus";
import "./functions/httpPostChatCompletions";
import "./functions/httpPostCompletions";
import "./functions/httpPostImageGenerate";

// Export app instance for Azure Functions runtime
export { app };
