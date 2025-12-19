#!/bin/bash
set -e

# Detect Operating System
echo "Detecting OS..."
if [[ "$OSTYPE" == "darwin"* ]]; then
  echo "Running on macOS"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
  echo "Running on Linux"
elif [[ "$OSTYPE" == "cygwin" ]] || [[ "$OSTYPE" == "msys" ]]; then
  echo "Running on Windows (using Cygwin or MSYS)"
else
  echo "Unknown OS: $OSTYPE. Proceeding with caution."
fi

# Check if Azure CLI is installed; if not, install it
if ! command -v az &> /dev/null; then
  echo "Azure CLI (az) not found, installing..."
  if [[ "$OSTYPE" == "darwin"* ]]; then
    brew update && brew install azure-cli
  elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash
  else
    echo "Please install Azure CLI manually: https://aka.ms/InstallAzureCLI"
    exit 1
  fi
else
  echo "Azure CLI is installed."
fi

# Check if user is logged in to Azure
echo "Checking Azure login status..."
if ! az account show &> /dev/null; then
  echo "Not logged in. Running 'az login'..."
  az login
else
  echo "Already logged in."
fi

echo "Enabling dynamic installation of preview extensions..."
az config set extension.dynamic_install_allow_preview=true

echo "Enabling dynamic installation of extensions without prompt..."
az config set extension.use_dynamic_install=yes_without_prompt

# Specify your subscription ID and resource group here
SUBSCRIPTION_ID="f72aad8c-7a1f-498b-8a19-7a25231523cf"
RESOURCE_GROUP="demi"

echo "Selecting subscription with ID: $SUBSCRIPTION_ID"
az account set --subscription "$SUBSCRIPTION_ID"

# Optionally, fetch and display the associated tenant.
tenant_id=$(az account show --query tenantId -o tsv)
echo "Active tenant: $tenant_id"

# Verify resource group exists
echo "Verifying resource group '$RESOURCE_GROUP' exists..."
if ! az group show --name "$RESOURCE_GROUP" &> /dev/null; then
  echo "Error: Resource group '$RESOURCE_GROUP' not found in subscription."
  exit 1
fi
echo "Resource group '$RESOURCE_GROUP' verified."

# Prompt before cleaning and rebuilding
read -p "Are you sure you want to clean and rebuild the project? [y/N] " rebuild_choice
if [[ "$rebuild_choice" != "y" && "$rebuild_choice" != "Y" ]]; then
  echo "Build process aborted by user."
  exit 0
fi

echo "Deleting dist folder..."
rm -rf dist

# Run npm tasks
echo "Cleaning the project..."
npm run clean

echo "Installing npm packages..."
npm install

echo "Building the project..."
npm run build

# Prompt before publishing the function
read -p "Are you sure you want to publish and overwrite the function 'demisparkgpt' on Azure? [y/N] " publish_choice
if [[ "$publish_choice" != "y" && "$publish_choice" != "Y" ]]; then
  echo "Publish process aborted by user."
  exit 0
fi

# Publish the functionapp to Azure
echo "Publishing Azure Function 'demisparkgpt' to resource group '$RESOURCE_GROUP'..."
func azure functionapp publish demisparkgpt

echo "Deployment complete."
