# Test Suite Documentation

## Quick Start

```bash
# Install dependencies
npm install

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage

# Run specific test suite
npm run test:unit
npm run test:integration
npm run test:contract
```

## Test Structure

```
src/__tests__/
├── unit/              # Unit tests (70% of tests)
│   ├── models/       # Schema validation tests
│   ├── providers/    # Provider adapter tests
│   ├── streaming/    # Streaming engine tests
│   ├── attachments/  # Attachment processing tests
│   ├── guardrails/   # Guardrail tests
│   ├── observability/# Telemetry and logging tests
│   └── utils/        # Utility function tests
├── integration/      # Integration tests (20% of tests)
│   ├── handlers/     # Handler integration tests
│   ├── providers/    # Provider integration tests
│   └── end-to-end/   # E2E tests
├── contract/         # Contract tests (10% of tests)
│   ├── openai-compatibility/
│   └── schema-validation/
├── fixtures/         # Test data
│   ├── requests/     # Request fixtures
│   └── responses/    # Response fixtures
└── helpers/         # Test utilities
    ├── mock-providers.ts
    └── mock-azure-functions.ts
```

## Writing Tests

### Unit Test Example

```typescript
import { describe, it, expect } from "vitest";
import { ChatCompletionRequestSchema } from "../../../models/chatCompletionTypes";

describe("ChatCompletionRequestSchema", () => {
  it("should validate a valid request", () => {
    const request = {
      api_version: "2025-01-01",
      model: "gpt-4o",
      messages: [{ role: "user", content: "Hello" }],
    };
    
    const result = ChatCompletionRequestSchema.safeParse(request);
    expect(result.success).toBe(true);
  });
});
```

### Integration Test Example

```typescript
import { describe, it, expect, vi } from "vitest";
import { chatCompletionsHandler } from "../../../handlers/chatCompletionsHandler";
import { createMockHttpRequest, createMockInvocationContext } from "../helpers/mock-azure-functions";
import { createMockProviderAdapter } from "../helpers/mock-providers";

describe("chatCompletionsHandler", () => {
  it("should handle a valid request", async () => {
    const request = createMockHttpRequest({
      api_version: "2025-01-01",
      model: "gpt-4o",
      messages: [{ role: "user", content: "Hello" }],
    });
    const context = createMockInvocationContext();
    
    const response = await chatCompletionsHandler(request, context);
    
    expect(response.status).toBe(200);
  });
});
```

## Test Fixtures

Use fixtures from `fixtures/` directory:

```typescript
import { validChatRequest, requestWithAttachments } from "../fixtures/requests/chatCompletionRequests";
```

## Mocking

### Mock Providers

```typescript
import { createMockProviderAdapter } from "../helpers/mock-providers";

const mockAdapter = createMockProviderAdapter();
mockAdapter.executeJson.mockResolvedValue(mockResponse);
```

### Mock Azure Functions

```typescript
import { createMockHttpRequest, createMockInvocationContext } from "../helpers/mock-azure-functions";

const request = createMockHttpRequest({ /* body */ });
const context = createMockInvocationContext();
```

## Coverage Goals

- **Overall**: 80%+
- **Critical Paths**: 100%
- **Models/Schemas**: 100%
- **Handlers**: 85%
- **Providers**: 90%

## Running Specific Tests

```bash
# Run a specific test file
npm test src/__tests__/unit/models/chatCompletionTypes.test.ts

# Run tests matching a pattern
npm test -- --grep "ChatCompletion"

# Run tests in a specific directory
npm test src/__tests__/unit
```

## Debugging Tests

```bash
# Run with Node.js debugger
node --inspect-brk node_modules/.bin/vitest

# Run with verbose output
npm test -- --reporter=verbose

# Run with UI
npm run test:ui
```

## Best Practices

1. **Test Isolation**: Each test should be independent
2. **AAA Pattern**: Arrange, Act, Assert
3. **Descriptive Names**: Test names should describe what they test
4. **Use Fixtures**: Reuse test data from fixtures
5. **Mock External Dependencies**: Mock providers, Azure Functions, etc.
6. **Test Edge Cases**: Include boundary conditions and error cases
7. **Keep Tests Fast**: Unit tests should run in < 1s each

## Continuous Integration

Tests run automatically on:
- Push to main branch
- Pull requests
- Pre-commit hooks (optional)

Coverage reports are generated and uploaded to code coverage service.


