#!/bin/bash
set -e

# Azure Function App Configuration Script for dmgpt-node-ts
# This script sets up environment variables for the Azure Function App
# Supports multiple Azure OpenAI endpoints for different models

FUNCTION_APP="dmgpt-node-ts"
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
echo "Step 1: Default Azure OpenAI Configuration (Fallback Only)"
echo "═══════════════════════════════════════════════════════════════"
echo "These are only used as fallback defaults for model-specific configs."
echo ""

read -p "Default Deployment Name (default: gpt-5-nano): " AZURE_OPENAI_DEPLOYMENT
AZURE_OPENAI_DEPLOYMENT=${AZURE_OPENAI_DEPLOYMENT:-gpt-5-nano}

read -p "Default API Version (default: 2024-12-01-preview): " AZURE_OPENAI_API_VERSION
AZURE_OPENAI_API_VERSION=${AZURE_OPENAI_API_VERSION:-2024-12-01-preview}

read -p "Default Auth Type (default: api-key): " AZURE_OPENAI_AUTH_TYPE
AZURE_OPENAI_AUTH_TYPE=${AZURE_OPENAI_AUTH_TYPE:-api-key}

echo ""
echo "📝 Default Configuration:"
echo "   Deployment: $AZURE_OPENAI_DEPLOYMENT"
echo "   API Version: $AZURE_OPENAI_API_VERSION"
echo "   Auth Type: $AZURE_OPENAI_AUTH_TYPE"
echo ""

# Prompt for additional model-specific endpoints
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "Step 2: Model-Specific Endpoints (REQUIRED)"
echo "═══════════════════════════════════════════════════════════════"
echo "You MUST configure at least one model. Each model requires its own endpoint and API key."
echo ""

ADDITIONAL_CONFIGS=()
while true; do
  read -p "Add model-specific endpoint? [y/N] " add_more
  if [[ "$add_more" != "y" && "$add_more" != "Y" ]]; then
    if [ ${#ADDITIONAL_CONFIGS[@]} -eq 0 ]; then
      echo "⚠️  Warning: At least one model configuration is required!"
      read -p "Continue anyway? [y/N] " continue_anyway
      if [[ "$continue_anyway" != "y" && "$continue_anyway" != "Y" ]]; then
        echo "Aborted. Please configure at least one model."
        exit 1
      fi
    fi
    break
  fi

  echo ""
  read -p "Model name (e.g., gpt-5.2, gpt-5-nano, gpt-4o): " MODEL_NAME
  read -p "Endpoint for $MODEL_NAME: " MODEL_ENDPOINT
  read -p "API Key for $MODEL_NAME: " MODEL_API_KEY
  read -p "API Version (default: $AZURE_OPENAI_API_VERSION): " MODEL_API_VERSION
  MODEL_API_VERSION=${MODEL_API_VERSION:-$AZURE_OPENAI_API_VERSION}
  read -p "Auth Type (default: $AZURE_OPENAI_AUTH_TYPE): " MODEL_AUTH_TYPE
  MODEL_AUTH_TYPE=${MODEL_AUTH_TYPE:-$AZURE_OPENAI_AUTH_TYPE}

  # Normalize model name for env var (e.g., "gpt-5.2" -> "GPT_5_2")
  MODEL_ENV_SUFFIX=$(echo "$MODEL_NAME" | tr '[:lower:]' '[:upper:]' | tr '-' '_' | tr '.' '_')

  ADDITIONAL_CONFIGS+=("AZURE_OPENAI_ENDPOINT_${MODEL_ENV_SUFFIX}=${MODEL_ENDPOINT}")
  ADDITIONAL_CONFIGS+=("AZURE_OPENAI_API_KEY_${MODEL_ENV_SUFFIX}=${MODEL_API_KEY}")
  ADDITIONAL_CONFIGS+=("AZURE_OPENAI_API_VERSION_${MODEL_ENV_SUFFIX}=${MODEL_API_VERSION}")
  ADDITIONAL_CONFIGS+=("AZURE_OPENAI_AUTH_TYPE_${MODEL_ENV_SUFFIX}=${MODEL_AUTH_TYPE}")

  echo "✅ Added configuration for $MODEL_NAME"
  echo ""
done

# Build settings array
SETTINGS=(
  "AZURE_OPENAI_DEPLOYMENT=$AZURE_OPENAI_DEPLOYMENT"
  "AZURE_OPENAI_API_VERSION=$AZURE_OPENAI_API_VERSION"
  "AZURE_OPENAI_AUTH_TYPE=$AZURE_OPENAI_AUTH_TYPE"
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
echo "Default Configuration (Fallback Only):"
echo "  Deployment: $AZURE_OPENAI_DEPLOYMENT"
echo "  API Version: $AZURE_OPENAI_API_VERSION"
echo "  Auth Type: $AZURE_OPENAI_AUTH_TYPE"
echo ""

if [ ${#ADDITIONAL_CONFIGS[@]} -gt 0 ]; then
  echo "Model-Specific Configurations:"
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
  echo "   AZURE_OPENAI_AUTH_TYPE_<MODEL_NAME>"
  echo ""
  echo "   Where <MODEL_NAME> is the model name in UPPER_CASE (e.g., GPT_5_2 for gpt-5.2)"
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

