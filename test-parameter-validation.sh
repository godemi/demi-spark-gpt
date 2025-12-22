#!/bin/bash

echo "=========================================="
echo "Testing Parameter Validation Fixes"
echo "=========================================="
echo ""

# Test 1: Temperature with gpt-5-nano (should fail with clear error)
echo "Test 1: Temperature parameter with gpt-5-nano (should reject)"
echo "-----------------------------------------------------------"
RESULT=$(curl -s -X POST http://localhost:7071/api/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-5-nano",
    "messages": [{"role": "user", "content": "Test"}],
    "temperature": 0.5,
    "api_version": "2024-12-01-preview"
  }')

ERROR_CODE=$(echo "$RESULT" | jq -r '.error.code // "NONE"')
ERROR_MSG=$(echo "$RESULT" | jq -r '.error.message // "NONE"')

if [ "$ERROR_CODE" = "UNSUPPORTED_PARAMETER" ]; then
  echo "✅ PASS: Correctly rejected with UNSUPPORTED_PARAMETER"
  echo "   Error message: $ERROR_MSG"
else
  echo "❌ FAIL: Expected UNSUPPORTED_PARAMETER, got: $ERROR_CODE"
  echo "   Full response: $RESULT"
fi

echo ""
echo ""

# Test 2: max_tokens with gpt-5.2 (should auto-convert and succeed)
echo "Test 2: max_tokens with gpt-5.2 (should auto-convert to max_completion_tokens)"
echo "--------------------------------------------------------------------------------"
RESULT=$(curl -s -X POST http://localhost:7071/api/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-5.2",
    "messages": [{"role": "user", "content": "Say hello in 3 words"}],
    "max_tokens": 10,
    "api_version": "2024-12-01-preview"
  }')

CONTENT=$(echo "$RESULT" | jq -r '.choices[0].message.content // "NONE"')
ERROR_CODE=$(echo "$RESULT" | jq -r '.error.code // "NONE"')

if [ "$ERROR_CODE" = "NONE" ] && [ "$CONTENT" != "NONE" ]; then
  echo "✅ PASS: Request succeeded with auto-conversion"
  echo "   Response: $CONTENT"
else
  echo "❌ FAIL: Request failed"
  echo "   Error code: $ERROR_CODE"
  echo "   Full response: $RESULT"
fi

echo ""
echo ""

# Test 3: max_tokens with gpt-5-nano (should also auto-convert)
echo "Test 3: max_tokens with gpt-5-nano (should auto-convert)"
echo "---------------------------------------------------------"
RESULT=$(curl -s -X POST http://localhost:7071/api/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-5-nano",
    "messages": [{"role": "user", "content": "Say hi"}],
    "max_tokens": 5,
    "api_version": "2024-12-01-preview"
  }')

CONTENT=$(echo "$RESULT" | jq -r '.choices[0].message.content // "NONE"')
ERROR_CODE=$(echo "$RESULT" | jq -r '.error.code // "NONE"')

if [ "$ERROR_CODE" = "NONE" ] && [ "$CONTENT" != "NONE" ]; then
  echo "✅ PASS: Request succeeded with auto-conversion"
  echo "   Response: $CONTENT"
else
  echo "❌ FAIL: Request failed"
  echo "   Error code: $ERROR_CODE"
  echo "   Full response: $RESULT"
fi

echo ""
echo ""

# Test 4: Normal request with gpt-5-nano (no temperature, should work)
echo "Test 4: Normal request with gpt-5-nano (no temperature)"
echo "--------------------------------------------------------"
RESULT=$(curl -s -X POST http://localhost:7071/api/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-5-nano",
    "messages": [{"role": "user", "content": "Say hello"}],
    "api_version": "2024-12-01-preview"
  }')

CONTENT=$(echo "$RESULT" | jq -r '.choices[0].message.content // "NONE"')
ERROR_CODE=$(echo "$RESULT" | jq -r '.error.code // "NONE"')

if [ "$ERROR_CODE" = "NONE" ] && [ "$CONTENT" != "NONE" ]; then
  echo "✅ PASS: Request succeeded"
  echo "   Response: $CONTENT"
else
  echo "❌ FAIL: Request failed"
  echo "   Error code: $ERROR_CODE"
fi

echo ""
echo ""

# Test 5: Temperature with gpt-5.2 (should work)
echo "Test 5: Temperature with gpt-5.2 (should work)"
echo "-----------------------------------------------"
RESULT=$(curl -s -X POST http://localhost:7071/api/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-5.2",
    "messages": [{"role": "user", "content": "Say hello"}],
    "temperature": 0.7,
    "api_version": "2024-12-01-preview"
  }')

CONTENT=$(echo "$RESULT" | jq -r '.choices[0].message.content // "NONE"')
ERROR_CODE=$(echo "$RESULT" | jq -r '.error.code // "NONE"')

if [ "$ERROR_CODE" = "NONE" ] && [ "$CONTENT" != "NONE" ]; then
  echo "✅ PASS: Request succeeded with custom temperature"
  echo "   Response: $CONTENT"
else
  echo "❌ FAIL: Request failed"
  echo "   Error code: $ERROR_CODE"
  echo "   Full response: $RESULT"
fi

echo ""
echo "=========================================="
echo "All parameter validation tests complete!"
echo "=========================================="
