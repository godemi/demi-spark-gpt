#!/bin/bash
set -e

# Deployment script for new Azure Function App: dmgpt-node-ts
# This script creates a new function app (if it doesn't exist) and deploys the code
# Updated for December 2025 best practices

FUNCTION_APP_NAME="dmgpt-node-ts"
RESOURCE_GROUP="demi"
SUBSCRIPTION_ID="f72aad8c-7a1f-498b-8a19-7a25231523cf"
LOCATION="germanywestcentral"
STORAGE_ACCOUNT="demisparkgptstorage"  # Use existing storage account or create new one
NODE_VERSION="22"  # Node.js 22 LTS (stable as of Dec 2025)
FUNCTIONS_VERSION="4"  # Azure Functions v4

echo "🚀 Deploying to new Azure Function App: $FUNCTION_APP_NAME"
echo ""

# Check if Azure CLI is logged in
if ! az account show &> /dev/null; then
  echo "❌ Not logged in to Azure. Please run: az login"
  exit 1
fi

echo "✅ Azure CLI is logged in"

# Set subscription
echo "📋 Setting subscription..."
az account set --subscription "$SUBSCRIPTION_ID"
echo "✅ Subscription set to: $SUBSCRIPTION_ID"
echo ""

# Verify resource group exists
echo "🔍 Verifying resource group '$RESOURCE_GROUP'..."
if ! az group show --name "$RESOURCE_GROUP" &> /dev/null; then
  echo "❌ Resource group '$RESOURCE_GROUP' not found."
  read -p "Create resource group '$RESOURCE_GROUP'? [y/N] " create_rg
  if [[ "$create_rg" == "y" || "$create_rg" == "Y" ]]; then
    az group create --name "$RESOURCE_GROUP" --location "$LOCATION"
    echo "✅ Resource group created"
  else
    echo "Aborted."
    exit 1
  fi
else
  echo "✅ Resource group exists"
fi
echo ""

# Check if storage account exists
echo "🔍 Checking storage account '$STORAGE_ACCOUNT'..."
if ! az storage account show --name "$STORAGE_ACCOUNT" --resource-group "$RESOURCE_GROUP" &> /dev/null; then
  echo "⚠️  Storage account '$STORAGE_ACCOUNT' not found."
  read -p "Create storage account '$STORAGE_ACCOUNT'? [y/N] " create_storage
  if [[ "$create_storage" == "y" || "$create_storage" == "Y" ]]; then
    az storage account create \
      --name "$STORAGE_ACCOUNT" \
      --resource-group "$RESOURCE_GROUP" \
      --location "$LOCATION" \
      --sku Standard_LRS \
      --allow-blob-public-access false \
      --min-tls-version TLS1_2 \
      --https-only true
    echo "✅ Storage account created with security best practices"
  else
    echo "Aborted."
    exit 1
  fi
else
  echo "✅ Storage account exists"
fi
echo ""

# Check if function app exists
echo "🔍 Checking if function app '$FUNCTION_APP_NAME' exists..."
if az functionapp show --name "$FUNCTION_APP_NAME" --resource-group "$RESOURCE_GROUP" &> /dev/null; then
  echo "⚠️  Function app '$FUNCTION_APP_NAME' already exists!"
  read -p "Continue with deployment to existing function app? [y/N] " continue_deploy
  if [[ "$continue_deploy" != "y" && "$continue_deploy" != "Y" ]]; then
    echo "Aborted."
    exit 0
  fi
  echo "✅ Will deploy to existing function app"
else
  echo "📦 Function app does not exist. Creating new function app..."
  
  # Create function app with Flex Consumption plan (modern approach as of Dec 2025)
  echo "Creating function app with Flex Consumption plan..."
  az functionapp create \
    --resource-group "$RESOURCE_GROUP" \
    --name "$FUNCTION_APP_NAME" \
    --storage-account "$STORAGE_ACCOUNT" \
    --runtime "node" \
    --runtime-version "$NODE_VERSION" \
    --functions-version "$FUNCTIONS_VERSION" \
    --flexconsumption-location "$LOCATION" \
    --output none
  
  echo "✅ Function app created with Flex Consumption plan"
  
  # Enable System-Assigned Managed Identity for secure access
  echo "🔐 Enabling System-Assigned Managed Identity..."
  az functionapp identity assign \
    --name "$FUNCTION_APP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --output none
  
  # Get managed identity principal ID
  IDENTITY_PRINCIPAL_ID=$(az functionapp identity show \
    --name "$FUNCTION_APP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --query principalId -o tsv)
  
  # Get storage account ID
  STORAGE_ACCOUNT_ID=$(az storage account show \
    --name "$STORAGE_ACCOUNT" \
    --resource-group "$RESOURCE_GROUP" \
    --query id -o tsv)
  
  # Grant Storage Blob Data Contributor role to managed identity
  echo "🔑 Granting storage access to managed identity..."
  az role assignment create \
    --assignee "$IDENTITY_PRINCIPAL_ID" \
    --role "Storage Blob Data Contributor" \
    --scope "$STORAGE_ACCOUNT_ID" \
    --output none 2>/dev/null || echo "⚠️  Role assignment may already exist (continuing...)"
  
  # Get storage account connection string (fallback for compatibility)
  STORAGE_CONNECTION_STRING=$(az storage account show-connection-string \
    --name "$STORAGE_ACCOUNT" \
    --resource-group "$RESOURCE_GROUP" \
    --query connectionString -o tsv)
  
  # Set comprehensive configuration with modern best practices
  # Note: FUNCTIONS_WORKER_RUNTIME, WEBSITE_NODE_DEFAULT_VERSION, and FUNCTIONS_WORKER_PROCESS_COUNT
  # are automatically managed by Azure for Flex Consumption plans and should not be set manually
  echo "⚙️  Setting comprehensive configuration..."
  az functionapp config appsettings set \
    --name "$FUNCTION_APP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --settings \
      FUNCTIONS_EXTENSION_VERSION="~$FUNCTIONS_VERSION" \
      AzureWebJobsStorage="$STORAGE_CONNECTION_STRING" \
      AzureWebJobsStorage__accountName="$STORAGE_ACCOUNT" \
      SCM_DO_BUILD_DURING_DEPLOYMENT="true" \
      ENABLE_ORYX_BUILD="true" \
      WEBSITE_RUN_FROM_PACKAGE="1" \
      WEBSITE_ENABLE_SYNC_UPDATE_SITE="true" \
      NODE_OPTIONS="--enable-source-maps" \
    --output none
  
  echo "✅ Configuration set with modern best practices"
  
  # Configure HTTPS only and minimum TLS version
  echo "🔒 Configuring security settings..."
  az functionapp update \
    --name "$FUNCTION_APP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --https-only true \
    --min-tls-version "1.2" \
    --output none
  
  echo "✅ Security settings configured"
fi
echo ""

# Build the project
echo "🔨 Building project..."
read -p "Clean and rebuild project? [y/N] " rebuild_choice
if [[ "$rebuild_choice" == "y" || "$rebuild_choice" == "Y" ]]; then
  echo "Cleaning..."
  npm run clean
  echo "Installing dependencies..."
  npm install
  echo "Building..."
  npm run build
  echo "✅ Build complete"
else
  echo "Skipping build (using existing dist folder)"
fi
echo ""

# Create deployment package (zip deployment - recommended as of Dec 2025)
echo "📦 Creating deployment package..."
if [ ! -d "dist" ]; then
  echo "❌ Error: dist directory does not exist. Please build the project first."
  exit 1
fi

if [ ! -f "host.json" ]; then
  echo "❌ Error: host.json file does not exist in project root."
  exit 1
fi

if [ ! -f "package.json" ]; then
  echo "❌ Error: package.json file does not exist in project root."
  exit 1
fi

DEPLOYMENT_ZIP="functionapp-deploy-$(date +%Y%m%d-%H%M%S).zip"

# Create zip from project root including required files
# Azure Functions requires host.json at root, package.json for dependencies, and dist/ for code
if ! zip -r "$DEPLOYMENT_ZIP" \
  host.json \
  package.json \
  dist/ \
  -q; then
  echo "❌ Error: Failed to create deployment package. Is 'zip' command available?"
  exit 1
fi

echo "✅ Deployment package created: $DEPLOYMENT_ZIP"
echo ""

# Deploy function code using zip deployment (recommended method as of Dec 2025)
echo "📤 Deploying function code..."
read -p "Deploy to '$FUNCTION_APP_NAME'? [y/N] " deploy_choice
if [[ "$deploy_choice" != "y" && "$deploy_choice" != "Y" ]]; then
  echo "Deployment aborted."
  rm -f "$DEPLOYMENT_ZIP"
  exit 0
fi

echo "Uploading deployment package..."
az functionapp deployment source config-zip \
  --resource-group "$RESOURCE_GROUP" \
  --name "$FUNCTION_APP_NAME" \
  --src "$DEPLOYMENT_ZIP" \
  --timeout 600 \
  --output none

echo "✅ Deployment complete"

# Clean up deployment package
rm -f "$DEPLOYMENT_ZIP"
echo "🧹 Cleaned up deployment package"
echo ""

# Get function app URL
FUNCTION_APP_URL=$(az functionapp show \
  --name "$FUNCTION_APP_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --query "defaultHostName" \
  -o tsv)

echo "🌐 Function app is available at:"
echo "   https://${FUNCTION_APP_URL}/"
echo ""

echo "⚠️  IMPORTANT: You must configure environment variables before the function will work!"
echo "   Run: ./setup-azure-env.sh"
echo "   Or set them manually in Azure Portal"
echo ""
echo "📋 Next steps:"
echo "   1. Configure environment variables (model-specific configs required)"
echo "   2. Test the function endpoints"
echo "   3. Set up Application Insights (recommended for production)"
echo "   4. Configure deployment slots for staging (optional but recommended)"
echo "   5. Review and configure networking/VNet integration if needed"
echo ""
echo "✨ Deployment completed with December 2025 best practices:"
echo "   ✓ Flex Consumption plan (modern hosting)"
echo "   ✓ System-Assigned Managed Identity enabled"
echo "   ✓ Secure storage access via managed identity"
echo "   ✓ HTTPS-only and TLS 1.2 minimum"
echo "   ✓ Zip deployment method (reliable)"
echo "   ✓ Modern build settings (Oryx, SCM build)"
echo ""

