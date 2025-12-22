#!/bin/bash
set -e

# Script to push environment variables from local.settings.json to Azure Function App
# This reads all values from local.settings.json and sets them in Azure
#
# Usage: ./push-env-to-azure.sh
# Or: FUNCTION_APP="your-app-name" ./push-env-to-azure.sh

# Configuration - can be overridden via environment variables
FUNCTION_APP="${FUNCTION_APP:-dmgpt-node-ts}"  # Default: dmgpt-node-ts (or use demigptnodets if different)
RESOURCE_GROUP="${RESOURCE_GROUP:-demi}"
LOCAL_SETTINGS_FILE="local.settings.json"

echo "🚀 Pushing environment variables from $LOCAL_SETTINGS_FILE to Azure Function App"
echo "   Function App: $FUNCTION_APP"
echo "   Resource Group: $RESOURCE_GROUP"
echo ""

# Check if Azure CLI is logged in
if ! az account show &> /dev/null; then
  echo "❌ Not logged in to Azure. Please run: az login"
  exit 1
fi

echo "✅ Azure CLI is logged in"
echo ""

# Check if local.settings.json exists
if [ ! -f "$LOCAL_SETTINGS_FILE" ]; then
  echo "❌ Error: $LOCAL_SETTINGS_FILE not found in current directory"
  exit 1
fi

echo "📖 Reading environment variables from $LOCAL_SETTINGS_FILE..."

# Use Node.js to parse JSON and extract environment variables
# This creates settings in the format needed by Azure CLI
TEMP_SETTINGS_FILE=$(mktemp)
SETTINGS_COUNT=$(node -e "
const fs = require('fs');
const settings = JSON.parse(fs.readFileSync('$LOCAL_SETTINGS_FILE', 'utf8'));

if (!settings.Values) {
  console.error('Error: No Values section found in local.settings.json');
  process.exit(1);
}

const settingsArray = [];
for (const [key, value] of Object.entries(settings.Values)) {
  // Properly escape the value for Azure CLI
  // Azure CLI expects KEY=VALUE format, and values with special chars need quoting
  const escapedValue = String(value).replace(/\\\\/g, '\\\\\\\\').replace(/\"/g, '\\\\\"');
  settingsArray.push(\`\${key}=\"\${escapedValue}\"\`);
}

// Write to temp file as space-separated string
fs.writeFileSync('$TEMP_SETTINGS_FILE', settingsArray.join(' '));
console.log(settingsArray.length);
")

if [ $? -ne 0 ] || [ -z "$SETTINGS_COUNT" ] || [ "$SETTINGS_COUNT" -eq 0 ]; then
  rm -f "$TEMP_SETTINGS_FILE"
  echo "❌ Error: Failed to parse $LOCAL_SETTINGS_FILE or no variables found"
  exit 1
fi

SETTINGS_CONTENT=$(cat "$TEMP_SETTINGS_FILE")

# Read settings into array for display (split by spaces, but handle quoted values)
read -ra SETTINGS <<< "$SETTINGS_CONTENT"

echo "✅ Found $SETTINGS_COUNT environment variables"
echo ""

# Show what will be set (without sensitive values)
echo "📋 Environment variables to be set:"
for setting in "${SETTINGS[@]}"; do
  key=$(echo "$setting" | cut -d'=' -f1)
  # Mask sensitive values (keys containing KEY, SECRET, PASSWORD, TOKEN, etc.)
  if [[ "$key" =~ (KEY|SECRET|PASSWORD|TOKEN|CONNECTION) ]]; then
    echo "   $key=*** (hidden)"
  else
    value=$(echo "$setting" | cut -d'=' -f2- | sed "s/^'//;s/'$//")
    # Truncate long values for display
    if [ ${#value} -gt 60 ]; then
      value="${value:0:60}..."
    fi
    echo "   $key=$value"
  fi
done
echo ""

# Confirm before proceeding
read -p "Continue and push these environment variables to Azure? [y/N] " confirm
if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
  rm -f "$TEMP_SETTINGS_FILE"
  echo "Aborted."
  exit 0
fi

echo ""
echo "🚀 Setting environment variables in Azure..."

# Set environment variables using Azure CLI
# Read settings from temp file to ensure proper handling of special characters
az functionapp config appsettings set \
  --name "$FUNCTION_APP" \
  --resource-group "$RESOURCE_GROUP" \
  --settings $SETTINGS_CONTENT \
  --output none

# Clean up temp file
rm -f "$TEMP_SETTINGS_FILE"

if [ $? -eq 0 ]; then
  echo "✅ Environment variables set successfully!"
  echo ""
  echo "🔄 Restarting function app to apply changes..."
  az functionapp restart \
    --name "$FUNCTION_APP" \
    --resource-group "$RESOURCE_GROUP" \
    --output none
  
  echo "✅ Function app restarted!"
  echo ""
  echo "📋 Summary:"
  echo "   Function App: $FUNCTION_APP"
  echo "   Resource Group: $RESOURCE_GROUP"
  echo "   Variables pushed: $SETTINGS_COUNT"
  echo "   Status: ✅ Successfully configured"
  echo ""
  echo "🌐 Your function is available at:"
  az functionapp show \
    --name "$FUNCTION_APP" \
    --resource-group "$RESOURCE_GROUP" \
    --query "defaultHostName" \
    -o tsv | xargs -I {} echo "   https://{}/"
else
  rm -f "$TEMP_SETTINGS_FILE"
  echo "❌ Failed to set environment variables"
  exit 1
fi

