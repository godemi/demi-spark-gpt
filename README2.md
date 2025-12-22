# demi SPARK GPT - A Case-bound Pre-Prompted GPT Request Processor - TypeScript API

An Azure Functions-based API providing ChatGPT capabilities through Azure OpenAI, built with TypeScript. This service offers robust parameter validation, pre-prompt management, and flexible response modes.

The following provides an example on how to use the app.

## Table of Contents

- [Repository Access](#repository-access)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Available Endpoints](#available-endpoints)
- [ChatGPT Parameters](#chatgpt-parameters)
- [Request Examples](#request-examples)
- [Response Modes](#response-modes)
- [Development](#development)
- [Deployment](#deployment)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)

## Repository Access

### Location

The project is hosted on GitHub at:

```
https://github.com/demi-ai-dev/demisparkgpt
```

### Getting Access

- **Developer:** tobias.wolff@die-marketing-idee.de
- **Access Permissions:** For access requests, contact oliver.sokola@die-marketing-idee.de

### Cloning the Repository

```bash
# Clone using HTTPS
git clone https://github.com/demi-ai-dev/demisparkgpt.git

# Or clone using SSH (if configured)
git clone git@github.com:demi-ai-dev/demisparkgpt.git

# Navigate to the TypeScript implementation folder
cd demisparkgpt/SPARK/AzureFunctions/demisparkgpt_node_ts
```

### Branch Structure

- **main:** Production-ready code
- **develop:** Integration and development branch
- **feature/**: New feature branches
- **hotfix/**: Urgent fixes

## Prerequisites

- Node.js 22.x or later (Node.js 20 reaches EOL April 30, 2026)
- npm 9.x or later
- Azure Functions Core Tools v4
- Azure CLI
- An Azure subscription with OpenAI access
- Visual Studio Code (recommended) with:
  - Azure Functions extension
  - Thunder Client extension (for testing)
  - ESLint & Prettier (for code linting and formatting)

## Installation

```bash
# Clone the repository (see Repository Access section)
git clone https://github.com/demi-ai-dev/demisparkgpt.git
cd demisparkgpt/SPARK/AzureFunctions/demisparkgpt_node_ts

# Install dependencies
npm install

# Create local.settings.json for local development
cat > local.settings.json << EOF
{
  "IsEncrypted": false,
  "Values": {
    "FUNCTIONS_WORKER_RUNTIME": "node",
    "AzureWebJobsStorage": "UseDevelopmentStorage=true",
    "AZURE_OPENAI_API_KEY": "your-api-key",
    "AZURE_OPENAI_ENDPOINT": "your-endpoint-url"
  }
}
EOF
```

## Configuration

### Environment Variables

| Variable                    | Description                          | Required | Comment      |
| --------------------------- | ------------------------------------ | -------- | ------------ |
| AZURE_OPENAI_API_KEY        | Your Azure OpenAI API key            | Yes      |              |
| AZURE_OPENAI_ENDPOINT       | Azure OpenAI service endpoint        | Yes      |              |
| AZURE_FUNCTIONS_ENVIRONMENT | Set to "development" or "production" | No       | Not used yet |

## Available Endpoints

### GET /api/info

_Returns API documentation and parameter information._

```bash
curl http://localhost:7071/api/info
```

### GET /api/status

_Checks the health and availability of the API and Azure OpenAI service._

```bash
curl http://localhost:7071/api/status
```

### POST /api/completions

_Main endpoint for processing ChatGPT completions._

```bash
curl -X POST http://localhost:7071/api/completions \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Explain TypeScript interfaces",
    "temperature": 0.7,
    "max_tokens": 150,
    "stream": false
  }'
```

_Note: The endpoints are implemented in the following function files:_

- `src/functions/getInfoHandler.ts`
- `src/functions/httpGetStatus.ts`
- `src/functions/httpPostCompletions.ts`

## ChatGPT Parameters

### Core Parameters

1. **prompt**

   - **Description:** The input text or list of texts that guide the model's response.
   - **Usage:** Can be provided as a single string or an array of strings.

2. **temperature** (Model Creativity)

   - **Description:** Controls the randomness in responses; higher values increase creativity.
   - **Range:** 0.0 to 2.0
   - **Usage:** Typically use `0.9` for creative tasks or `0.0` for deterministic, factual responses.

3. **top_p** (Nucleus Sampling)
   - **Description:** An alternative to temperature; limits token selection to the top probability mass.
   - **Range:** 0.0 to 1.0
   - **Usage:** For example, `0.1` means only the top 10% of probable tokens are considered.

### Response Control

4. **max_tokens**

   - **Description:** Maximum number of tokens to generate in the response.
   - **Usage:** Adjust based on desired response length; subject to model limitations.

5. **min_tokens**

   - **Description:** Minimum number of tokens to generate.
   - **Usage:** Requires `system_pre_prompts_generate_min_tokens: true` to take effect.

6. **best_of**

   - **Description:** Generates multiple responses server-side and returns the best one.
   - **Usage:** Works in tandem with the `n` parameter for candidate selection.

7. **n**
   - **Description:** Number of completions to generate per prompt.
   - **Usage:** More completions provide variety but consume more tokens.

### Text Generation Control

8. **frequency_penalty**

   - **Description:** Reduces the model's tendency to repeat itself.
   - **Range:** -2.0 to 2.0
   - **Usage:** Higher values reduce repetition.

9. **presence_penalty**

   - **Description:** Discourages topic reuse to encourage varied responses.
   - **Range:** -2.0 to 2.0
   - **Usage:** Increase to promote new topics.

10. **logit_bias**
    - **Description:** Allows modification of specific token probabilities.
    - **Usage:** Provide a mapping from token IDs to bias values (range: -100 to 100).

### System Pre-Prompts

11. **system_pre_prompts_global**

    - **Description:** Enables predefined system prompts to modify model behavior.
    - **Usage:** Set to true to apply global behavior modifications.

12. **system_pre_prompts_format_as_markdown**

    - **Description:** Formats the output in Markdown.
    - **Usage:** Enable for structured, formatted responses.

13. **system_pre_prompts_brief_response**

    - **Description:** Forces the model to provide concise responses.
    - **Usage:** Enable for shorter, focused answers.

14. **system_pre_prompts_explain_technical_terms**

    - **Description:** Expands technical terms into simpler language.
    - **Usage:** Enable for beginner-friendly explanations.

15. **system_pre_prompts_non_expert_mode**

    - **Description:** Simplifies explanations for a general audience.
    - **Usage:** Enable for non-technical users.

16. **system_pre_prompts_add_emoticons**

    - **Description:** Adds emoticons to responses for a more engaging tone.
    - **Usage:** Enable if desired.

17. **system_pre_prompts_generate_min_tokens**

    - **Description:** Enables a system prompt that asks to make the response as the length specified in `min_tokens`.
    - **Usage:** Enable if desired.

### Advanced Options

18. **fallback_result_language**

    - **Description:** Specifies the language for fallback responses.
    - **Values:** 'en', 'de', 'fr', 'es'
    - **Usage:** Forces responses in the specified language.

19. **stream**

    - **Description:** Enables response streaming.
    - **Usage:** Set to true to send response chunks as they are generated. When `stream` is true, multiple SSE messages (each starting with `data:`) are sent, with each message containing a JSON chunk that holds a portion of the complete response. The final chunk aggregates all received delta content – replacing the `delta.content` field – and mirrors the JSON format used when `stream` is false. This allows intermediate backend services to stream updates to the frontend while eventually receiving the complete response in the same format as non-stream mode.

20. **stop**

    - **Description:** Defines stopping sequences to control where responses end.
    - **Usage:** Can specify up to four sequences.

21. **variables**

    - **Description:** Dynamic key-value pairs inserted into the prompt.
    - **Usage:** Enables inclusion of structured data.

22. **custom_pre_prompts**
    - **Description:** User-defined instructions to modify model behavior.
    - **Usage:** Customize tone, style, or domain-specific language.

## Request Examples

### Complex Marketing Request with Variables

```json
{
  "prompt": "Create a marketing speech using all the VARIABLES defined in the pre prompts.",
  "fallback_result_language": "en",
  "system_pre_prompts_enabled": true,
  "system_pre_prompts_explain_technical_terms": false,
  "system_pre_prompts_non_expert_mode": false,
  "system_pre_prompts_brief_response": false,
  "system_pre_prompts_add_emoticons": false,
  "system_pre_prompts_format_as_markdown": false,
  "system_pre_prompts_generate_min_tokens": true,
  "temperature": 0.7,
  "top_p": 0.95,
  "max_tokens": 1500,
  "min_tokens": 900,
  "stream": true,
  "user": "xxx",
  "custom_pre_prompts": [
    {
      "name": "Custom Writing Style",
      "description": "This pre-prompt modifies the tone of the AI output.",
      "role": "assistant",
      "text": "Use a professional and authoritative tone."
    },
    {
      "name": "Industry-Specific Language",
      "description": "Ensures AI responses are aligned with the industry jargon.",
      "role": "system",
      "text": "Use industry-specific terms for B2B manufacturing."
    }
  ],
  "variables": [
    {
      "name": "MACHINE",
      "description": "The machine being referred to in the prompt.",
      "value": "Super Machine X100",
      "type": "string"
    },
    {
      "name": "LAUNCH_DATE",
      "description": "The date when the product will launch.",
      "value": "2024-07-15T10:00:00Z",
      "type": "iso-8601"
    },
    {
      "name": "PRODUCT_PRICE",
      "description": "The price of the product.",
      "value": "4999.99",
      "type": "float"
    },
    {
      "name": "STOCK_AVAILABILITY",
      "description": "Whether the product is currently in stock.",
      "value": "true",
      "type": "boolean"
    }
  ]
}
```

### Expected Streaming Response (when `stream` is true)

### Expected Streaming Response (when `stream` is true)

When `stream` is enabled, you will receive a series of Server-Sent Event (SSE) messages. Each message is prefixed with `data:` and contains a JSON chunk similar to:

```json
data: {"choices":[{"content_filter_results":{"hate":{"filtered":false,"severity":"safe"},"self_harm":{"filtered":false,"severity":"safe"},"sexual":{"filtered":false,"severity":"safe"},"violence":{"filtered":false,"severity":"safe"}},"delta":{"content":"aktiv"},"finish_reason":null,"index":0,"logprobs":null}],"created":1741899757,"id":"chatcmpl-BAjzJVIrRwGlX92gCGAvb29W5JMjA","model":"gpt-4o-2024-08-06","object":"chat.completion.chunk","system_fingerprint":"fp_ded0d14823"}
```

Multiple such chunks will be streamed sequentially. The final chunk is sent after a message with `"finish_reason":"stop"`, and it aggregates all received delta content into one complete JSON object. In this final chunk, the `delta.content` field is replaced with the entire accumulated text, and the JSON format matches that of a non-streamed response.

For example, the final chunk looks like this:

```json
data: {"status":200,"body":{"version":"2.250304.1730","time":3998,"response":{"choices":[{"content_filter_results":{},"delta":{"content":"Your generated response."}, "finish_reason":"stop","index":0,"logprobs":null}],"created":1741899757,"id":"chatcmpl-BAjzJVIrRwGlX92gCGAvb29W5JMjA","model":"gpt-4o-2024-08-06","object":"chat.completion.chunk","system_fingerprint":"fp_ded0d14823"},"payload":{"messages":[{"role":"system","content":"System prompt..."},{"role":"system","content":"Another systme prompt..."},{"role":"user","content":"Your prompt to the system as user message"}],"temperature":0.7,"top_p":0.95,"max_tokens":1600,"stream":true,"user":"xxx"},"headers":{"Content-Type":"application/json","api-key":"*** API KEY REDACTED ***"}},"headers":{"Content-Type":"application/json"}}
```

In summary, earlier chunks are delivered with each containing a fragment of the response (via the `delta` object). The very last chunk—sent after a message with `"finish_reason":"stop"`—aggregates all the prior fragments into one complete JSON object, replacing the `delta.content` field with the full, final response. This approach allows the backend service to stream updates immediately to the frontend while also providing the complete response once the streaming concludes.

## Development

### Running Locally

```bash
# Start the development server
npm run start

# Watch mode (if available)
npm run watch
```

### Project Structure

```plaintext
demisparkgpt_node_ts/
├── src/
│   ├── functions/                    # Azure Function endpoints
│   │   ├── getInfoHandler.ts         # Provides API documentation and parameter info
│   │   ├── httpGetStatus.ts          # Health check endpoint
│   │   └── httpPostCompletions.ts    # Main ChatGPT completion handler
│   ├── models/                      # Type definitions and schemas
│   │   ├── constraints.ts          # Parameter validation rules
│   │   ├── parameterMetadata.ts    # Detailed parameter documentation
│   │   └── types.ts                # Core type definitions
│   └── utils/                       # Utility functions
│       ├── azureChatGPTRequest.ts  # Azure OpenAI API client to do the requests
│       ├── config.ts               # Configuration management
│       ├── exceptions.ts           # Custom error handling
│       └── httpJsonResponse.ts     # Generate a JSON response object
│       └── processPrePrompts.ts     # Processes the request body and generates the pre prompts
│       └── readVersionFile.ts     # Reads the version.txt file into a variable called VERSION
│       └── safeConversion.ts       # Helper functions for safe conversion of variables
│       └── validation.ts          # Request and parameter validation
├── local.settings.json            # Local development settings
├── host.json                        # Azure Functions host configuration
├── package.json                     # Project dependencies and npm scripts
├── publish_azure_function.sh        # Deployment script
├── README.md                       # TypeScript version documentation (this file)
└── tsconfig.json                    # TypeScript configuration
└── version.txt                    # The Version of this Azure Function. Updated by GIT hook.
```

## Deployment

### Using publish_azure_function.sh

```bash
# Make the script executable
chmod +x publish_azure_function.sh

# Run the deployment script
./publish_azure_function.sh
```

_The deployment script performs the following steps:_

1. Detects the operating system and installs prerequisites (if needed).
2. Verifies Azure CLI installation and ensures the user is logged in.
3. Configures Azure CLI settings (enabling dynamic extension installs).
4. Sets the subscription context.
5. Prompts to clean and rebuild the project.
6. Publishes the Azure Function (`demisparkgpt`) to your Azure subscription.

### Manual Deployment

```bash
# Build the project
npm run build

# Deploy to Azure using Azure Functions Core Tools
func azure functionapp publish demisparkgpt
```

## Testing

> **Note:** Testing framework is planned but not yet implemented.

Planned tests include:

- Unit tests for utility functions
- Integration tests for API endpoints
- Validation tests to ensure correct parameter processing

_NPM scripts for tests:_

```bash
npm test           # Run all tests
npm run test:coverage  # Generate a test coverage report
npm run test:watch     # Run tests in watch mode (if available)
```

## Troubleshooting

### Common Issues

1. **Connection Errors**

   - Verify Azure login:
     ```bash
     az account show
     ```
   - Check the status of your Function App:
     ```bash
     az functionapp show --name demisparkgpt --resource-group yourResourceGroup
     ```

2. **Build Errors**

   - Clean and rebuild the project:
     ```bash
     npm run clean
     npm install
     npm run build
     ```

3. **Deployment Issues**
   - Tail the Azure Function logs:
     ```bash
     az functionapp logs tail --name demisparkgpt
     ```

### Getting Help

For further issues or questions:

- Consult the [Azure Functions documentation](https://docs.microsoft.com/azure/azure-functions/)
- Review [Azure OpenAI service limits](https://learn.microsoft.com/azure/cognitive-services/openai/)
- **Technical Support:** dev@die-marketing-idee.de
- **Access or Permissions:** oliver.sokola@die-marketing-idee.de
