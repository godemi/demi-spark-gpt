# Comprehensive Testing Plan - HALO Layer

## Executive Summary

This document outlines a complete testing strategy for the HALO layer modernization, covering unit tests, integration tests, contract tests, and end-to-end tests. The plan ensures 80%+ code coverage, OpenAI API compatibility, and production readiness.

---

## Testing Philosophy

- **Test Pyramid**: 70% Unit, 20% Integration, 10% E2E
- **Test-Driven Development**: Write tests alongside implementation
- **Contract Testing**: Ensure OpenAI API compatibility
- **Mocking Strategy**: Mock external providers, use real implementations for internal logic
- **Coverage Goal**: 80%+ code coverage with 100% coverage for critical paths

---

## Test Infrastructure Setup

### 1. Testing Framework Stack

```json
{
  "devDependencies": {
    "vitest": "^2.1.0",
    "@vitest/ui": "^2.1.0",
    "msw": "^2.7.0",
    "@types/node": "^22.0.0",
    "nock": "^13.5.0",
    "supertest": "^7.0.0",
    "@azure/functions-core-tools": "^4.5.0"
  }
}
```

### 2. Test Configuration

**`vitest.config.ts`**
```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.test.ts',
        '**/*.spec.ts',
        'src/index.ts',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80,
      },
    },
    testTimeout: 30000,
    hookTimeout: 30000,
  },
});
```

### 3. Test Directory Structure

```
src/
├── __tests__/
│   ├── unit/
│   │   ├── models/
│   │   ├── providers/
│   │   ├── streaming/
│   │   ├── attachments/
│   │   ├── guardrails/
│   │   ├── observability/
│   │   └── utils/
│   ├── integration/
│   │   ├── handlers/
│   │   ├── providers/
│   │   └── end-to-end/
│   ├── contract/
│   │   ├── openai-compatibility/
│   │   └── schema-validation/
│   ├── fixtures/
│   │   ├── requests/
│   │   ├── responses/
│   │   └── mocks/
│   └── helpers/
│       ├── test-utils.ts
│       ├── mock-providers.ts
│       └── mock-azure-functions.ts
```

---

## Phase 1: Unit Tests (70% of tests)

### 1.1 Model Schema Tests

**File**: `src/__tests__/unit/models/chatCompletionTypes.test.ts`

**Test Cases**:
- ✅ ChatCompletionRequestSchema validation
  - Valid request with all fields
  - Valid request with minimal fields
  - Invalid request (missing required fields)
  - Invalid request (wrong types)
  - Invalid request (out of range values)
  - Attachment schema validation
  - Tool definition schema validation
  - Response format schema validation
- ✅ ChatCompletionResponseSchema validation
  - Valid response structure
  - Response with usage stats
  - Response with reasoning tokens
  - Response with attachments
- ✅ SSEChunk schema validation
  - Valid chunk structure
  - Final chunk with aggregate data
  - Chunk with tool calls

**Coverage Target**: 100%

### 1.2 Provider Adapter Tests

**File**: `src/__tests__/unit/providers/azureOpenAIAdapter.test.ts`

**Test Cases**:
- ✅ Client creation
  - API key authentication
  - Azure AD authentication
  - Client caching/reuse
- ✅ Request building
  - Message normalization
  - Attachment conversion
  - Parameter mapping
  - Reasoning mode handling
- ✅ Response mapping
  - Non-streaming response mapping
  - Streaming chunk mapping
  - Error mapping
- ✅ Capability detection
  - Model capability lookup
  - Unknown model handling

**File**: `src/__tests__/unit/providers/openaiAdapter.test.ts`
- Same test structure as Azure OpenAI adapter

**File**: `src/__tests__/unit/providers/azureFoundryAdapter.test.ts`
- Same test structure with OSS model specifics

**Coverage Target**: 90%

### 1.3 Model Registry Tests

**File**: `src/__tests__/unit/providers/modelRegistry.test.ts`

**Test Cases**:
- ✅ Model capability lookup
  - Exact model name match
  - Case-insensitive match
  - Prefix matching (deployment names)
  - Unknown model handling
- ✅ Capability checks
  - Vision support
  - Tool calling support
  - Reasoning support
  - Streaming support
- ✅ Provider model listing
  - Get models for provider
  - All models listing

**Coverage Target**: 100%

### 1.4 Streaming Engine Tests

**File**: `src/__tests__/unit/streaming/sseWriter.test.ts`

**Test Cases**:
- ✅ Chunk accumulation
  - Content aggregation
  - Multiple chunks handling
  - Empty chunks
- ✅ Final chunk generation
  - Complete content in final chunk
  - Usage statistics calculation
  - HALO metadata inclusion
- ✅ Error handling
  - Stream interruption
  - Invalid chunk format
- ✅ SSE format compliance
  - Correct data: prefix
  - Correct [DONE] marker
  - Proper newline formatting

**Coverage Target**: 95%

### 1.5 Attachment Processing Tests

**File**: `src/__tests__/unit/attachments/inputProcessor.test.ts`

**Test Cases**:
- ✅ Image attachment processing
  - Base64 image conversion
  - URL image handling
  - MIME type validation
  - Size validation
- ✅ Capability validation
  - Vision-capable model
  - Non-vision model rejection
- ✅ Multiple attachments
  - Multiple images in one message
  - Mixed text and images
- ✅ Error cases
  - Invalid MIME type
  - Oversized attachment
  - Missing data/URL

**File**: `src/__tests__/unit/attachments/outputProcessor.test.ts`
- Image generation response processing
- Base64 vs URL handling
- Attachment metadata extraction

**Coverage Target**: 95%

### 1.6 Guardrails Tests

**File**: `src/__tests__/unit/guardrails/profiles.test.ts`

**Test Cases**:
- ✅ Profile retrieval
  - Valid profile lookup
  - Invalid profile handling
- ✅ Guardrail application
  - System message prepending
  - Existing system message merging
  - No guardrails when disabled
- ✅ Profile configurations
  - Enterprise-safe profile
  - Creative mode profile
  - Academic profile

**Coverage Target**: 100%

### 1.7 Observability Tests

**File**: `src/__tests__/unit/observability/telemetry.test.ts`

**Test Cases**:
- ✅ Request tracking
  - Event creation
  - Metric recording
  - Dependency tracking
- ✅ Error tracking
  - Exception logging
  - Error properties
- ✅ Flush handling
  - Telemetry flushing
  - Missing App Insights handling

**File**: `src/__tests__/unit/observability/logger.test.ts`
- Secret redaction
  - API key redaction
  - Authorization header redaction
  - Nested object redaction
- Structured logging
  - Request logging
  - Response logging
  - Error logging

**Coverage Target**: 90%

### 1.8 Utility Tests

**File**: `src/__tests__/unit/utils/exceptions.test.ts`

**Test Cases**:
- ✅ APIException creation
  - With provider error
  - With request ID
  - Without optional fields
- ✅ Error response format
  - HALO error structure
  - Provider error inclusion
  - Timestamp generation

**File**: `src/__tests__/unit/utils/httpClient.test.ts`
- Connection keep-alive
- Timeout handling
- Agent reuse

**File**: `src/__tests__/unit/config/providers.test.ts`
- Environment variable loading
- Endpoint parsing
- Deployment extraction
- Default value handling

**Coverage Target**: 90%

---

## Phase 2: Integration Tests (20% of tests)

### 2.1 Handler Integration Tests

**File**: `src/__tests__/integration/handlers/chatCompletionsHandler.test.ts`

**Test Cases**:
- ✅ Non-streaming requests
  - Valid request → successful response
  - Invalid request → error response
  - Provider error → mapped error
- ✅ Streaming requests
  - Valid stream → SSE chunks
  - Stream interruption → error handling
  - Final chunk generation
- ✅ Multi-provider routing
  - Azure OpenAI routing
  - OpenAI routing
  - Azure Foundry routing
- ✅ Attachment handling
  - Image input processing
  - Vision model validation
- ✅ Guardrail application
  - Enabled guardrails
  - Disabled guardrails
- ✅ Tool calling
  - Tool definition validation
  - Tool call response handling

**File**: `src/__tests__/integration/handlers/imageGenerateHandler.test.ts`
- Image generation requests
- Provider routing
- Response processing

**File**: `src/__tests__/integration/handlers/listModelsHandler.test.ts`
- Model listing
- Provider filtering
- Capability display

**Coverage Target**: 85%

### 2.2 Provider Integration Tests

**File**: `src/__tests__/integration/providers/azureOpenAIIntegration.test.ts`

**Test Cases**:
- ✅ Real Azure OpenAI API calls (with mocks)
  - Non-streaming completion
  - Streaming completion
  - Error responses
  - Rate limiting
- ✅ Authentication
  - API key auth
  - AAD token refresh
- ✅ Request/response mapping
  - Full request lifecycle
  - Response transformation

**File**: `src/__tests__/integration/providers/openaiIntegration.test.ts`
- Same structure for OpenAI provider

**Coverage Target**: 80%

### 2.3 End-to-End Tests

**File**: `src/__tests__/integration/end-to-end/chatCompletionsE2E.test.ts`

**Test Cases**:
- ✅ Complete request flow
  - Request → Handler → Provider → Response
  - With attachments
  - With tool calling
  - With guardrails
- ✅ Error scenarios
  - Provider unavailable
  - Invalid model
  - Rate limiting
- ✅ Performance
  - Response time tracking
  - Memory usage
  - Connection reuse

**Coverage Target**: 75%

---

## Phase 3: Contract Tests (10% of tests)

### 3.1 OpenAI API Compatibility Tests

**File**: `src/__tests__/contract/openai-compatibility/requestFormat.test.ts`

**Test Cases**:
- ✅ Request format compliance
  - Message structure matches OpenAI
  - Parameter names match OpenAI
  - Optional fields handling
- ✅ Response format compliance
  - Response structure matches OpenAI
  - Choice format matches
  - Usage format matches
- ✅ SSE format compliance
  - Chunk format matches OpenAI
  - Data: prefix format
  - [DONE] marker

**File**: `src/__tests__/contract/openai-compatibility/responseFormat.test.ts`
- Response schema validation
- Error format validation
- Streaming format validation

**Coverage Target**: 100%

### 3.2 Schema Validation Tests

**File**: `src/__tests__/contract/schema-validation/zodSchemas.test.ts`

**Test Cases**:
- ✅ All Zod schemas
  - Request schema validation
  - Response schema validation
  - Message schema validation
  - Attachment schema validation
  - Tool schema validation
- ✅ Edge cases
  - Null values
  - Undefined values
  - Empty arrays
  - Very long strings
  - Special characters

**Coverage Target**: 100%

---

## Phase 4: Test Fixtures and Mocks

### 4.1 Test Fixtures

**File**: `src/__tests__/fixtures/requests/chatCompletionRequests.ts`

```typescript
export const validChatRequest = {
  api_version: "2025-01-01",
  model: "gpt-4o",
  messages: [
    { role: "user", content: "Hello" }
  ],
  stream: false,
};

export const streamingRequest = {
  ...validChatRequest,
  stream: true,
};

export const requestWithAttachments = {
  ...validChatRequest,
  messages: [
    {
      role: "user",
      content: "What's in this image?",
      attachments: [
        {
          type: "image",
          mime_type: "image/png",
          data: "base64encodeddata",
        }
      ]
    }
  ]
};

export const requestWithTools = {
  ...validChatRequest,
  tools: [
    {
      type: "function",
      function: {
        name: "get_weather",
        parameters: {
          type: "object",
          properties: {
            location: { type: "string" }
          }
        }
      }
    }
  ]
};
```

**File**: `src/__tests__/fixtures/responses/providerResponses.ts`
- Mock provider responses
- Error responses
- Streaming chunks

### 4.2 Mock Providers

**File**: `src/__tests__/helpers/mock-providers.ts`

```typescript
import { vi } from 'vitest';
import { ProviderAdapter } from '../../providers/types';

export function createMockProviderAdapter(): ProviderAdapter {
  return {
    name: 'mock-provider',
    buildRequest: vi.fn(),
    executeStream: vi.fn(),
    executeJson: vi.fn(),
    getCapabilities: vi.fn(),
    validateRequest: vi.fn(),
  };
}
```

### 4.3 MSW Handlers

**File**: `src/__tests__/helpers/msw-handlers.ts`

```typescript
import { http, HttpResponse } from 'msw';

export const handlers = [
  // Azure OpenAI mock
  http.post('https://*.openai.azure.com/openai/deployments/*/chat/completions', () => {
    return HttpResponse.json({
      id: 'chatcmpl-123',
      object: 'chat.completion',
      created: 1677652288,
      model: 'gpt-4o',
      choices: [{
        index: 0,
        message: {
          role: 'assistant',
          content: 'Hello! How can I help you?',
        },
        finish_reason: 'stop',
      }],
      usage: {
        prompt_tokens: 9,
        completion_tokens: 12,
        total_tokens: 21,
      },
    });
  }),
  
  // OpenAI mock
  http.post('https://api.openai.com/v1/chat/completions', () => {
    return HttpResponse.json({
      id: 'chatcmpl-123',
      object: 'chat.completion',
      created: 1677652288,
      model: 'gpt-4o',
      choices: [{
        index: 0,
        message: {
          role: 'assistant',
          content: 'Hello! How can I help you?',
        },
        finish_reason: 'stop',
      }],
      usage: {
        prompt_tokens: 9,
        completion_tokens: 12,
        total_tokens: 21,
      },
    });
  }),
];
```

---

## Phase 5: Test Execution Strategy

### 5.1 Test Scripts

**`package.json` scripts**:
```json
{
  "scripts": {
    "test": "vitest",
    "test:unit": "vitest run src/__tests__/unit",
    "test:integration": "vitest run src/__tests__/integration",
    "test:contract": "vitest run src/__tests__/contract",
    "test:watch": "vitest watch",
    "test:coverage": "vitest run --coverage",
    "test:ui": "vitest --ui",
    "test:ci": "vitest run --coverage --reporter=json --outputFile=coverage.json"
  }
}
```

### 5.2 CI/CD Integration

**GitHub Actions** (`.github/workflows/test.yml`):
```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '22'
      - run: npm ci
      - run: npm run test:ci
      - uses: codecov/codecov-action@v3
        with:
          file: ./coverage.json
```

### 5.3 Test Execution Order

1. **Unit Tests** (fast, isolated)
   - Run first for quick feedback
   - No external dependencies
   - ~5-10 seconds

2. **Integration Tests** (medium speed)
   - Use mocks for external services
   - Test component interactions
   - ~30-60 seconds

3. **Contract Tests** (fast)
   - Schema validation
   - Format compliance
   - ~10-15 seconds

4. **E2E Tests** (slowest)
   - Full request flow
   - Optional in CI, required before release
   - ~2-5 minutes

---

## Phase 6: Test Coverage Goals

### 6.1 Coverage Targets by Component

| Component | Target Coverage | Critical Paths |
|-----------|----------------|----------------|
| Models/Schemas | 100% | All validation paths |
| Provider Adapters | 90% | Request/response mapping |
| Streaming Engine | 95% | Chunk aggregation, final chunk |
| Attachments | 95% | Input/output processing |
| Guardrails | 100% | Profile application |
| Observability | 90% | Telemetry, logging |
| Handlers | 85% | Request flow, error handling |
| Utils | 90% | Error handling, config |

### 6.2 Critical Paths (100% Coverage Required)

- Request validation
- Provider routing
- Error handling
- Secret redaction
- Authentication
- Response formatting

---

## Phase 7: Performance and Load Tests

### 7.1 Performance Tests

**File**: `src/__tests__/performance/load.test.ts`

**Test Cases**:
- ✅ Response time benchmarks
  - P50, P95, P99 latencies
  - Cold start vs warm start
- ✅ Throughput tests
  - Requests per second
  - Concurrent request handling
- ✅ Memory usage
  - Memory leaks detection
  - Connection pool management

### 7.2 Load Tests

**File**: `src/__tests__/performance/stress.test.ts`

**Test Cases**:
- ✅ Concurrent requests
  - 10, 50, 100, 500 concurrent
  - Rate limiting behavior
- ✅ Long-running streams
  - 1-minute streams
  - Connection stability
- ✅ Error recovery
  - Provider failures
  - Network interruptions

---

## Phase 8: Security Tests

### 8.1 Security Test Cases

**File**: `src/__tests__/security/security.test.ts`

**Test Cases**:
- ✅ Secret redaction
  - API keys in logs
  - Authorization headers
  - Request/response bodies
- ✅ Input validation
  - SQL injection attempts
  - XSS attempts
  - Path traversal
- ✅ Authentication
  - Invalid API keys
  - Expired tokens
  - Token injection

---

## Phase 9: Test Data Management

### 9.1 Test Data Strategy

- **Fixtures**: Static test data in `fixtures/` directory
- **Factories**: Dynamic test data generation
- **Mocks**: Provider response mocks
- **Seeds**: Database seeds (if applicable)

### 9.2 Test Isolation

- Each test is independent
- No shared state between tests
- Cleanup after each test
- Mock external dependencies

---

## Phase 10: Test Maintenance

### 10.1 Test Review Process

- Review tests with code reviews
- Update tests when APIs change
- Remove obsolete tests
- Refactor tests for clarity

### 10.2 Test Documentation

- Document test scenarios
- Explain complex test cases
- Document mock setup
- Update test plan as needed

---

## Implementation Timeline

### Week 1: Setup and Unit Tests
- Day 1-2: Test infrastructure setup
- Day 3-4: Model schema tests
- Day 5: Provider adapter unit tests

### Week 2: Unit Tests (Continued)
- Day 1-2: Streaming, attachments, guardrails
- Day 3-4: Observability, utilities
- Day 5: Review and fix coverage gaps

### Week 3: Integration Tests
- Day 1-2: Handler integration tests
- Day 3-4: Provider integration tests
- Day 5: E2E tests

### Week 4: Contract and Performance Tests
- Day 1-2: Contract tests
- Day 3: Performance tests
- Day 4: Security tests
- Day 5: Final review and documentation

---

## Success Criteria

✅ **Code Coverage**: 80%+ overall, 100% for critical paths  
✅ **All Tests Passing**: Green CI/CD pipeline  
✅ **OpenAI Compatibility**: 100% contract test pass rate  
✅ **Performance**: P95 latency < 2s for non-streaming, < 100ms first chunk for streaming  
✅ **Security**: All secrets redacted, no sensitive data in logs  
✅ **Documentation**: All test scenarios documented  

---

## Test Execution Commands

```bash
# Run all tests
npm test

# Run specific test suite
npm run test:unit
npm run test:integration
npm run test:contract

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch

# Run with UI
npm run test:ui

# Run in CI mode
npm run test:ci
```

---

## Notes

- Use `vi.mock()` for module mocking in Vitest
- Use MSW for HTTP request mocking
- Use `@azure/functions-core-tools` for local Azure Functions testing
- Mock Application Insights to avoid external dependencies
- Use test fixtures for consistent test data
- Keep tests fast (< 30s for unit, < 5min for integration)
- Write descriptive test names
- Follow AAA pattern (Arrange, Act, Assert)

---

## Appendix: Example Test File

See `src/__tests__/unit/models/chatCompletionTypes.example.test.ts` for a complete example test file structure.

