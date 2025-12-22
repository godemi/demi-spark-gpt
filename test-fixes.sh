#!/bin/bash

# Test temperature parameter with gpt-5-nano (should fail gracefully)
echo "=== Test 1: Temperature with gpt-5-nano (should fail) ==="
curl -s -X POST http://localhost:7071/api/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-5-nano",
    "messages": [{"role": "user", "content": "Test"}],
    "temperature": 0.5,
    "api_version": "2024-12-01-preview"
  }' | jq -r '.error.code // "SUCCESS"'

# Test max_tokens with gpt-5.2 (should auto-convert to max_completion_tokens)
echo ""
echo "=== Test 2: max_tokens with gpt-5.2 (should auto-convert) ==="
curl -s -X POST http://localhost:7071/api/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-5.2",
    "messages": [{"role": "user", "content": "Say hello"}],
    "max_tokens": 50,
    "api_version": "2024-12-01-preview"
  }' | jq -r '.choices[0].message.content // .error.code // "UNKNOWN"' | head -1

echo ""
echo "Tests complete!"
