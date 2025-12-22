#!/bin/bash
set -e

# Azure Function App Configuration Script
# This script sets up environment variables for the Azure Function App
# Supports multiple Azure OpenAI endpoints for different models

FUNCTION_APP="demigptnodets"
RESOURCE_GROUP="demi"

echo "🔧 Setting up environment variables for Azure Function App: $FUNCTION_APP"
echo ""

# Check if Azure CLI is logged in
if ! az account show &> /dev/null; then
  echo "❌ Not logged in to Azure. Please run: az login"
  exit 1
fi

echo "✅ Azure CLI is logged in"
echo ""

# Prompt for default Azure OpenAI configuration (backward compatible)
echo "═══════════════════════════════════════════════════════════════"
echo "Step 1: Default Azure OpenAI Configuration"
echo "═══════════════════════════════════════════════════════════════"
echo "This will be used as the fallback/default configuration."
echo ""

read -p "Azure OpenAI Endpoint (e.g., https://your-resource.openai.azure.com): " AZURE_OPENAI_ENDPOINT
read -p "Azure OpenAI API Key: " AZURE_OPENAI_API_KEY
read -p "Azure OpenAI Deployment (default: gpt-5-nano): " AZURE_OPENAI_DEPLOYMENT
AZURE_OPENAI_DEPLOYMENT=${AZURE_OPENAI_DEPLOYMENT:-gpt-5-nano}

read -p "Azure OpenAI API Version (default: 2024-12-01-preview): " AZURE_OPENAI_API_VERSION
AZURE_OPENAI_API_VERSION=${AZURE_OPENAI_API_VERSION:-2024-12-01-preview}

echo ""
echo "📝 Default Configuration:"
echo "   Endpoint: $AZURE_OPENAI_ENDPOINT"
echo "   Deployment: $AZURE_OPENAI_DEPLOYMENT"
echo "   API Version: $AZURE_OPENAI_API_VERSION"
echo ""

# Prompt for additional model-specific endpoints
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "Step 2: Additional Model-Specific Endpoints (Optional)"
echo "═══════════════════════════════════════════════════════════════"
echo "You can configure additional endpoints for specific models."
echo "This allows different models to use different Azure OpenAI resources."
echo ""
echo "Example: If you have gpt-4o on a different endpoint, you can set:"
echo "  Model: gpt-4o"
echo "  Endpoint: https://another-resource.openai.azure.com"
echo "  API Key: <different-key>"
echo ""

ADDITIONAL_CONFIGS=()
while true; do
  read -p "Add another model-specific endpoint? [y/N] " add_more
  if [[ "$add_more" != "y" && "$add_more" != "Y" ]]; then
    break
  fi

  echo ""
  read -p "Model name (e.g., gpt-4o, gpt-4-turbo): " MODEL_NAME
  read -p "Endpoint for $MODEL_NAME: " MODEL_ENDPOINT
  read -p "API Key for $MODEL_NAME: " MODEL_API_KEY
  read -p "API Version (default: $AZURE_OPENAI_API_VERSION): " MODEL_API_VERSION
  MODEL_API_VERSION=${MODEL_API_VERSION:-$AZURE_OPENAI_API_VERSION}

  # Normalize model name for env var (e.g., "gpt-4o" -> "GPT_4O")
  MODEL_ENV_SUFFIX=$(echo "$MODEL_NAME" | tr '[:lower:]' '[:upper:]' | tr '-' '_' | tr '.' '_')

  ADDITIONAL_CONFIGS+=("AZURE_OPENAI_ENDPOINT_${MODEL_ENV_SUFFIX}=${MODEL_ENDPOINT}")
  ADDITIONAL_CONFIGS+=("AZURE_OPENAI_API_KEY_${MODEL_ENV_SUFFIX}=${MODEL_API_KEY}")
  ADDITIONAL_CONFIGS+=("AZURE_OPENAI_API_VERSION_${MODEL_ENV_SUFFIX}=${MODEL_API_VERSION}")

  echo "✅ Added configuration for $MODEL_NAME"
  echo ""
done

# Build settings array
SETTINGS=(
  "AZURE_OPENAI_ENDPOINT=$AZURE_OPENAI_ENDPOINT"
  "AZURE_OPENAI_API_KEY=$AZURE_OPENAI_API_KEY"
  "AZURE_OPENAI_DEPLOYMENT=$AZURE_OPENAI_DEPLOYMENT"
  "AZURE_OPENAI_API_VERSION=$AZURE_OPENAI_API_VERSION"
  "FUNCTIONS_WORKER_RUNTIME=node"
  "WEBSITE_NODE_DEFAULT_VERSION=~22"
  "FUNCTIONS_EXTENSION_VERSION=~4"
)

# Add additional configs
for config in "${ADDITIONAL_CONFIGS[@]}"; do
  SETTINGS+=("$config")
done

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "Summary"
echo "═══════════════════════════════════════════════════════════════"
echo "Default Configuration:"
echo "  Endpoint: $AZURE_OPENAI_ENDPOINT"
echo "  Deployment: $AZURE_OPENAI_DEPLOYMENT"
echo "  API Version: $AZURE_OPENAI_API_VERSION"
echo ""

if [ ${#ADDITIONAL_CONFIGS[@]} -gt 0 ]; then
  echo "Additional Model Configurations:"
  for config in "${ADDITIONAL_CONFIGS[@]}"; do
    if [[ $config == AZURE_OPENAI_ENDPOINT_* ]]; then
      echo "  $config"
    fi
  done
  echo ""
fi

read -p "Continue with these settings? [y/N] " confirm
if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
  echo "Aborted."
  exit 0
fi

echo ""
echo "🚀 Setting environment variables..."

# Set environment variables
az functionapp config appsettings set \
  --name "$FUNCTION_APP" \
  --resource-group "$RESOURCE_GROUP" \
  --settings "${SETTINGS[@]}" \
  --output none

if [ $? -eq 0 ]; then
  echo "✅ Environment variables set successfully!"
  echo ""
  echo "🔄 Restarting function app..."
  az functionapp restart \
    --name "$FUNCTION_APP" \
    --resource-group "$RESOURCE_GROUP" \
    --output none
  
  echo "✅ Function app restarted!"
  echo ""
  echo "📋 Summary:"
  echo "   Function App: $FUNCTION_APP"
  echo "   Resource Group: $RESOURCE_GROUP"
  echo "   Environment variables configured and function restarted"
  echo ""
  echo "💡 Tip: To add more model-specific endpoints later, use:"
  echo "   AZURE_OPENAI_ENDPOINT_<MODEL_NAME>"
  echo "   AZURE_OPENAI_API_KEY_<MODEL_NAME>"
  echo "   AZURE_OPENAI_API_VERSION_<MODEL_NAME>"
  echo ""
  echo "   Where <MODEL_NAME> is the model name in UPPER_CASE (e.g., GPT_4O for gpt-4o)"
  echo ""
  echo "🌐 Your function is available at:"
  az functionapp show \
    --name "$FUNCTION_APP" \
    --resource-group "$RESOURCE_GROUP" \
    --query "defaultHostName" \
    -o tsv | xargs -I {} echo "   https://{}/"
else
  echo "❌ Failed to set environment variables"
  exit 1
fi

