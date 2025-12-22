# Quick Start: Testing Azure Functions Locally

This guide explains how to run and test your Azure Functions locally on your development machine.

## Prerequisites

1. **Node.js 22+** - [Download Node.js](https://nodejs.org/) (Node.js 20 reaches EOL April 30, 2026)
2. **Azure Functions Core Tools** - Already included in `devDependencies`
   - If not installed globally, it will use the local version from `node_modules`
3. **Dependencies installed** - Run `npm install` if you haven't already

## Setup

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Configure local settings:**
   - The `local.settings.json` file is already configured with your environment variables
   - Make sure your `DATABASE_URL` is properly set if you need database access
   - Update any API keys or endpoints as needed

## Running the Function Locally

### Option 1: Standard Start (Recommended for first-time testing)

```bash
npm start
```

This command will:

- Clean the `dist` folder
- Build TypeScript to JavaScript
- Start the Azure Functions runtime

The function will be available at: **http://localhost:7071**

### Option 2: Development Mode with Auto-reload

```bash
npm run dev
```

This command will:

- Build the project
- Watch for TypeScript changes and rebuild automatically
- Start the Azure Functions runtime
- Automatically restart when code changes

### Option 3: Watch Mode (TypeScript only)

```bash
npm run start:watch
```

Starts the function with watch mode enabled.

## Available Endpoints

When the function starts, you'll see output showing all available endpoints with their exact URLs. Here are the main endpoints (note: since `routePrefix` is empty in `host.json`, these may not include `/api` prefix):

| Method | Endpoint                 | Description                      |
| ------ | ------------------------ | -------------------------------- |
| GET    | `/info`                  | Get API documentation            |
| GET    | `/status`                | Check API and service status     |
| GET    | `/v1/models`             | List available models            |
| POST   | `/v1/chat/completions`   | Chat completions (main endpoint) |
| POST   | `/v1/images/generations` | Image generation                 |
| POST   | `/completions`           | Legacy completions endpoint      |

**Important:** Check the console output when you start the function to see the exact URLs, as they may vary based on your configuration.

## Testing the Functions

### Getting the Function Key

When you start the function, look for output like this:

```
Functions:
    info: [GET] http://localhost:7071/api/info?code=YOUR_FUNCTION_KEY
    status: [GET] http://localhost:7071/api/status?code=YOUR_FUNCTION_KEY
    ...
```

The `code` parameter is your function key. You can also find it in the console output.

**Note:** For local development, you can also set `authLevel: "anonymous"` in the function definitions to test without keys, but remember to change it back before deploying.

### Testing with cURL

**Note:** Replace `YOUR_FUNCTION_KEY` with the actual function key shown in the console output when you start the function. Also, check if your URLs need `/api` prefix based on the console output.

#### 1. Test Info Endpoint

```bash
curl http://localhost:7071/info?code=YOUR_FUNCTION_KEY
```

#### 2. Test Status Endpoint

```bash
curl http://localhost:7071/status?code=YOUR_FUNCTION_KEY
```

#### 3. Test Models List

```bash
curl http://localhost:7071/v1/models?code=YOUR_FUNCTION_KEY
```

#### 4. Test Chat Completions

```bash
curl -X POST http://localhost:7071/v1/chat/completions?code=YOUR_FUNCTION_KEY \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4",
    "messages": [
      {
        "role": "user",
        "content": "Hello, how are you?"
      }
    ]
  }'
```

#### 5. Test Image Generation

```bash
curl -X POST http://localhost:7071/v1/images/generations?code=YOUR_FUNCTION_KEY \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "a beautiful sunset over mountains",
    "n": 1,
    "size": "1024x1024"
  }'
```

### Testing with Browser

For GET endpoints, you can simply open them in your browser (replace with actual URLs from console output):

- http://localhost:7071/info?code=YOUR_FUNCTION_KEY
- http://localhost:7071/status?code=YOUR_FUNCTION_KEY
- http://localhost:7071/v1/models?code=YOUR_FUNCTION_KEY

### Testing with HTTP Client Tools

You can use tools like:

- **Postman** - Import the endpoints and test them
- **Insomnia** - Create requests for each endpoint
- **VS Code REST Client** - If you have the REST Client extension installed
- **Thunder Client** - VS Code extension for API testing

Example REST Client format (`.http` file):

```http
### Get Info
GET http://localhost:7071/info?code=YOUR_FUNCTION_KEY

### Get Status
GET http://localhost:7071/status?code=YOUR_FUNCTION_KEY

### List Models
GET http://localhost:7071/v1/models?code=YOUR_FUNCTION_KEY

### Chat Completions
POST http://localhost:7071/v1/chat/completions?code=YOUR_FUNCTION_KEY
Content-Type: application/json

{
  "model": "gpt-4",
  "messages": [
    {
      "role": "user",
      "content": "Hello!"
    }
  ]
}
```

## Troubleshooting

### Port Already in Use

If port 7071 is already in use, you can change it by setting the `AzureWebJobsStorage` connection string or using a different port:

```bash
func start --port 7072
```

### Build Errors

If you encounter TypeScript errors:

```bash
npm run clean
npm run build
```

Check for any TypeScript compilation errors in the output.

### Function Not Starting

1. Make sure all dependencies are installed: `npm install`
2. Check that `local.settings.json` exists and is properly formatted
3. Verify Node.js version: `node --version` (should be 22+)
4. Check the console output for specific error messages

### Authentication Issues

For local testing, you can temporarily modify the function definitions to use `authLevel: "anonymous"` instead of `authLevel: "function"`. Remember to revert this before deploying to production.

## Next Steps

- Review the function handlers in `src/handlers/` to understand the business logic
- Check the test files in `src/__tests__/` for examples of how the functions are tested
- See `README.md` for deployment instructions
- See `DEPLOYMENT.md` for detailed deployment information

## Stopping the Function

Press `Ctrl+C` in the terminal where the function is running to stop it.
