#!/bin/bash

BASE_URL="http://localhost:7071"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
RESULTS_FILE="test-results-${TIMESTAMP}.json"

echo "=== Comprehensive Endpoint Testing ==="
echo "Starting at: $(date)"
echo ""

# Initialize results array
echo "[]" > "$RESULTS_FILE"

# Function to test endpoint and measure time
test_endpoint() {
    local name=$1
    local method=$2
    local url=$3
    local data=$4
    local description=$5
    
    echo "Testing: $name"
    echo "Description: $description"
    
    if [ "$method" = "GET" ]; then
        start_time=$(date +%s.%N)
        response=$(curl -s -w "\n%{http_code}" -X GET "$url" 2>&1)
        end_time=$(date +%s.%N)
    else
        start_time=$(date +%s.%N)
        response=$(curl -s -w "\n%{http_code}" -X POST "$url" \
            -H "Content-Type: application/json" \
            -d "$data" 2>&1)
        end_time=$(date +%s.%N)
    fi
    
    http_code=$(echo "$response" | tail -1)
    body=$(echo "$response" | sed '$d')
    duration=$(echo "$end_time - $start_time" | bc)
    duration_ms=$(echo "$duration * 1000" | bc | cut -d. -f1)
    
    # Extract response size
    response_size=$(echo "$body" | wc -c)
    
    # Check if response is valid JSON
    if echo "$body" | jq . >/dev/null 2>&1; then
        is_valid_json=true
        # Try to extract model, provider, request_id if present
        model=$(echo "$body" | jq -r '.model // .error.code // "N/A"' 2>/dev/null)
        provider=$(echo "$body" | jq -r '.provider // "N/A"' 2>/dev/null)
        request_id=$(echo "$body" | jq -r '.request_id // .id // "N/A"' 2>/dev/null)
    else
        is_valid_json=false
        model="N/A"
        provider="N/A"
        request_id="N/A"
    fi
    
    # Create result JSON
    result=$(jq -n \
        --arg name "$name" \
        --arg method "$method" \
        --arg url "$url" \
        --arg description "$description" \
        --arg http_code "$http_code" \
        --arg duration_ms "$duration_ms" \
        --arg response_size "$response_size" \
        --arg is_valid_json "$is_valid_json" \
        --arg model "$model" \
        --arg provider "$provider" \
        --arg request_id "$request_id" \
        '{name: $name, method: $method, url: $url, description: $description, http_code: $http_code, duration_ms: ($duration_ms | tonumber), response_size: ($response_size | tonumber), is_valid_json: ($is_valid_json == "true"), model: $model, provider: $provider, request_id: $request_id}')
    
    # Add to results
    jq ". += [$result]" "$RESULTS_FILE" > "${RESULTS_FILE}.tmp" && mv "${RESULTS_FILE}.tmp" "$RESULTS_FILE"
    
    echo "  Status: $http_code | Duration: ${duration_ms}ms | Size: ${response_size} bytes"
    if [ "$is_valid_json" = "true" ]; then
        echo "  Model: $model | Provider: $provider"
    fi
    echo ""
}

# Test 1: GET /info
test_endpoint \
    "GET /info" \
    "GET" \
    "${BASE_URL}/info" \
    "" \
    "API documentation endpoint"

# Test 2: GET /status
test_endpoint \
    "GET /status" \
    "GET" \
    "${BASE_URL}/status" \
    "" \
    "API and service status check"

# Test 3: GET /v1/models
test_endpoint \
    "GET /v1/models" \
    "GET" \
    "${BASE_URL}/v1/models" \
    "" \
    "List all available models with capabilities"

# Test 4: POST /v1/chat/completions - Default model (gpt-5-nano)
test_endpoint \
    "POST /v1/chat/completions - Simple prompt (default)" \
    "POST" \
    "${BASE_URL}/v1/chat/completions" \
    '{"api_version": "2024-12-01-preview", "model": "gpt-5-nano", "messages": [{"role": "user", "content": "Explain quantum computing in exactly 50 words"}]}' \
    "Simple prompt with gpt-5-nano model"

# Test 5: POST /v1/chat/completions - gpt-5.2 model
test_endpoint \
    "POST /v1/chat/completions - Complex prompt (gpt-5.2)" \
    "POST" \
    "${BASE_URL}/v1/chat/completions" \
    '{"api_version": "2024-12-01-preview", "model": "gpt-5.2", "messages": [{"role": "user", "content": "Write a detailed analysis comparing machine learning and deep learning, including use cases, advantages, and limitations of each approach"}]}' \
    "Complex analytical prompt with gpt-5.2 model"

# Test 6: POST /v1/chat/completions - Task profile "fast"
test_endpoint \
    "POST /v1/chat/completions - Task profile fast" \
    "POST" \
    "${BASE_URL}/v1/chat/completions" \
    '{"api_version": "2024-12-01-preview", "task_profile": "fast", "messages": [{"role": "user", "content": "Classify this text: I love this product!"}]}' \
    "Task profile routing to gpt-5-nano with fast profile"

# Test 7: POST /v1/chat/completions - Task profile "reasoning"
test_endpoint \
    "POST /v1/chat/completions - Task profile reasoning" \
    "POST" \
    "${BASE_URL}/v1/chat/completions" \
    '{"api_version": "2024-12-01-preview", "task_profile": "reasoning", "messages": [{"role": "user", "content": "Solve this step by step: If a train travels 120 km in 2 hours, and another train travels 180 km in 3 hours, which train is faster and by how much?"}]}' \
    "Task profile routing to gpt-5.2 with reasoning profile"

# Test 8: POST /v1/chat/completions - Streaming
test_endpoint \
    "POST /v1/chat/completions - Streaming" \
    "POST" \
    "${BASE_URL}/v1/chat/completions" \
    '{"api_version": "2024-12-01-preview", "model": "gpt-5-nano", "messages": [{"role": "user", "content": "Count from 1 to 10"}], "stream": true}' \
    "Streaming response with gpt-5-nano"

# Test 9: POST /v1/chat/completions - Multi-turn conversation
test_endpoint \
    "POST /v1/chat/completions - Multi-turn" \
    "POST" \
    "${BASE_URL}/v1/chat/completions" \
    '{"api_version": "2024-12-01-preview", "model": "gpt-5-nano", "messages": [{"role": "system", "content": "You are a helpful assistant"}, {"role": "user", "content": "What is 2+2?"}, {"role": "assistant", "content": "2+2 equals 4"}, {"role": "user", "content": "What about 3+3?"}]}' \
    "Multi-turn conversation with context"

# Test 10: POST /v1/chat/completions - With temperature
test_endpoint \
    "POST /v1/chat/completions - Creative prompt" \
    "POST" \
    "${BASE_URL}/v1/chat/completions" \
    '{"api_version": "2024-12-01-preview", "model": "gpt-5-nano", "messages": [{"role": "user", "content": "Write a creative haiku about artificial intelligence"}], "temperature": 0.9}' \
    "Creative generation with high temperature"

# Test 11: POST /v1/chat/completions - With max_tokens
test_endpoint \
    "POST /v1/chat/completions - Limited tokens" \
    "POST" \
    "${BASE_URL}/v1/chat/completions" \
    '{"api_version": "2024-12-01-preview", "model": "gpt-5-nano", "messages": [{"role": "user", "content": "List the first 5 prime numbers"}], "max_tokens": 50}' \
    "Response with token limit"

# Test 12: POST /v1/images/generations
test_endpoint \
    "POST /v1/images/generations" \
    "POST" \
    "${BASE_URL}/v1/images/generations" \
    '{"prompt": "a futuristic cityscape at sunset with flying cars", "n": 1, "size": "1024x1024"}' \
    "Image generation with DALL-E"

# Generate summary
echo "=== Test Summary ==="
echo ""
echo "Total tests run: $(jq 'length' "$RESULTS_FILE")"
echo "Successful (2xx): $(jq '[.[] | select(.http_code | startswith("2"))] | length' "$RESULTS_FILE")"
echo "Failed (4xx/5xx): $(jq '[.[] | select(.http_code | startswith("4") or startswith("5"))] | length' "$RESULTS_FILE")"
echo ""
echo "Average response time: $(jq '[.[] | .duration_ms] | add / length' "$RESULTS_FILE")ms"
echo "Fastest response: $(jq '[.[] | .duration_ms] | min' "$RESULTS_FILE")ms"
echo "Slowest response: $(jq '[.[] | .duration_ms] | max' "$RESULTS_FILE")ms"
echo ""
echo "Detailed results saved to: $RESULTS_FILE"
echo ""
echo "=== Individual Test Results ==="
jq -r '.[] | "\(.name): \(.http_code) - \(.duration_ms)ms - \(.model)"' "$RESULTS_FILE"

