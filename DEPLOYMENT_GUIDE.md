# Azure Function Deployment Guide

This guide will help you deploy your Azure Function to Azure with all necessary configurations.

## Prerequisites

✅ **Already Verified:**
- Azure CLI installed (`az --version`)
- Logged in to Azure (`az account show`)
- Subscription ID: `f72aad8c-7a1f-498b-8a19-7a25231523cf`
- Resource Group: `demi`

## Deployment Options

### Option 1: Quick Deploy (Using Existing Function App)

If you already have a function app named `demisparkgpt` in resource group `demi`:

```bash
# Build and deploy
npm run publish:azure
```

This will:
1. Clean and build the project
2. Publish to the existing function app `demisparkgpt`

### Option 2: Full Infrastructure Deployment (Using Bicep)

If you need to create the infrastructure from scratch:

#### Step 1: Set Environment Variables

```bash
export AZURE_ENV_NAME="production"  # or your environment name
export AZURE_LOCATION="swedencentral"  # or your preferred location
```

#### Step 2: Deploy Infrastructure

```bash
# Navigate to infra directory
cd infra

# Deploy using Azure CLI
az deployment sub create \
  --location swedencentral \
  --template-file main.bicep \
  --parameters @main.parameters.json \
  --parameters environmentName=$AZURE_ENV_NAME \
  --parameters location=$AZURE_LOCATION
```

#### Step 3: Deploy Function Code

```bash
# Return to root directory
cd ..

# Build and deploy
npm run publish:azure
```

### Option 3: Manual Deployment (Step by Step)

#### Step 1: Verify Azure Login

```bash
az account show
```

If not logged in:
```bash
az login
az account set --subscription "f72aad8c-7a1f-498b-8a19-7a25231523cf"
```

#### Step 2: Check/Create Resource Group

```bash
# Check if resource group exists
az group show --name "demi"

# If it doesn't exist, create it:
az group create \
  --name "demi" \
  --location "swedencentral"
```

#### Step 3: Check/Create Function App

```bash
# Check if function app exists
az functionapp show \
  --name "demisparkgpt" \
  --resource-group "demi"

# If it doesn't exist, create it:
az functionapp create \
  --resource-group "demi" \
  --consumption-plan-location "swedencentral" \
  --runtime "node" \
  --runtime-version "22" \
  --functions-version "4" \
  --name "demisparkgpt" \
  --storage-account "<storage-account-name>" \
  --os-type "Linux" \
  --plan-type "FlexConsumption"
```

#### Step 4: Build the Project

```bash
npm run clean
npm install
npm run build
```

#### Step 5: Deploy Function Code

```bash
# Using Azure Functions Core Tools
func azure functionapp publish demisparkgpt

# OR using npm script
npm run deploy
```

## Configure Environment Variables in Azure

**⚠️ CRITICAL:** You must set environment variables in Azure Portal or via CLI before the function will work.

### Method 1: Azure Portal (Recommended for First-Time Setup)

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to: **Function App** → **demisparkgpt** → **Configuration** → **Application settings**
3. Click **+ New application setting** for each variable:

#### Required Settings:

| Name | Value | Description |
|------|-------|-------------|
| `AZURE_OPENAI_ENDPOINT` | `https://your-resource.openai.azure.com` | Your Azure OpenAI endpoint |
| `AZURE_OPENAI_API_KEY` | `your-api-key-here` | Your Azure OpenAI API key |

#### Optional Settings (with defaults):

| Name | Value | Description |
|------|-------|-------------|
| `AZURE_OPENAI_DEPLOYMENT` | `gpt-5-nano` | Model deployment name |
| `AZURE_OPENAI_API_VERSION` | `2024-12-01-preview` | API version |
| `AZURE_OPENAI_AUTH_TYPE` | `api-key` | Auth type: `api-key` or `aad` |
| `FUNCTIONS_WORKER_RUNTIME` | `node` | Node.js runtime |
| `WEBSITE_NODE_DEFAULT_VERSION` | `~22` | Node.js version (should match runtime-version) |

4. Click **Save** to apply changes
5. The function app will restart automatically

### Method 2: Azure CLI

```bash
# Set required environment variables
az functionapp config appsettings set \
  --name "demisparkgpt" \
  --resource-group "demi" \
  --settings \
    AZURE_OPENAI_ENDPOINT="https://your-resource.openai.azure.com" \
    AZURE_OPENAI_API_KEY="your-api-key-here" \
    AZURE_OPENAI_DEPLOYMENT="gpt-5-nano" \
    AZURE_OPENAI_API_VERSION="2024-12-01-preview" \
    FUNCTIONS_WORKER_RUNTIME="node" \
    WEBSITE_NODE_DEFAULT_VERSION="~22"
```

### Method 3: Using Script

Create a script `set-env-vars.sh`:

```bash
#!/bin/bash

FUNCTION_APP="demisparkgpt"
RESOURCE_GROUP="demi"

az functionapp config appsettings set \
  --name "$FUNCTION_APP" \
  --resource-group "$RESOURCE_GROUP" \
  --settings \
    AZURE_OPENAI_ENDPOINT="https://your-resource.openai.azure.com" \
    AZURE_OPENAI_API_KEY="your-api-key-here" \
    AZURE_OPENAI_DEPLOYMENT="gpt-5-nano" \
    AZURE_OPENAI_API_VERSION="2024-12-01-preview" \
    FUNCTIONS_WORKER_RUNTIME="node" \
    WEBSITE_NODE_DEFAULT_VERSION="~22"

echo "Environment variables set successfully!"
```

Make it executable and run:
```bash
chmod +x set-env-vars.sh
./set-env-vars.sh
```

## Verify Deployment

### 1. Check Function App Status

```bash
az functionapp show \
  --name "demisparkgpt" \
  --resource-group "demi" \
  --query "{state:state, defaultHostName:defaultHostName}" \
  -o table
```

### 2. Get Function URLs

```bash
# Get the function app URL
az functionapp show \
  --name "demisparkgpt" \
  --resource-group "demi" \
  --query "defaultHostName" \
  -o tsv
```

### 3. Test the Deployment

```bash
# Get function key
FUNCTION_KEY=$(az functionapp keys list \
  --name "demisparkgpt" \
  --resource-group "demi" \
  --query "functionKeys.default" \
  -o tsv)

# Test info endpoint
curl "https://demisparkgpt.azurewebsites.net/info?code=$FUNCTION_KEY"

# Test chat completions
curl -X POST "https://demisparkgpt.azurewebsites.net/v1/chat/completions?code=$FUNCTION_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "api_version": "2024-12-01-preview",
    "model": "gpt-5-nano",
    "messages": [
      {
        "role": "user",
        "content": "Hello!"
      }
    ]
  }'
```

## Troubleshooting

### Function App Not Found

If you get "Function app not found":
1. Check the function app name: `az functionapp list --resource-group "demi"`
2. Update `publish_azure_function.sh` with the correct name
3. Or create a new function app (see Step 3 above)

### Deployment Fails

1. **Check build errors:**
   ```bash
   npm run clean
   npm run build
   ```

2. **Check Azure Functions Core Tools:**
   ```bash
   func --version
   ```

3. **Verify you're logged in:**
   ```bash
   az account show
   ```

### Environment Variables Not Working

1. **Verify variables are set:**
   ```bash
   az functionapp config appsettings list \
     --name "demisparkgpt" \
     --resource-group "demi" \
     --query "[?name=='AZURE_OPENAI_ENDPOINT' || name=='AZURE_OPENAI_API_KEY']" \
     -o table
   ```

2. **Restart the function app:**
   ```bash
   az functionapp restart \
     --name "demisparkgpt" \
     --resource-group "demi"
   ```

3. **Check function logs:**
   ```bash
   az functionapp log tail \
     --name "demisparkgpt" \
     --resource-group "demi"
   ```

### Function Returns Errors

1. **Check application insights logs** in Azure Portal
2. **Enable streaming logs:**
   ```bash
   az webapp log tail \
     --name "demisparkgpt" \
     --resource-group "demi"
   ```

3. **Check environment variable validation** - the function validates env vars at startup

### Functions Not Showing in Portal (No Endpoints Visible)

If your functions don't appear in the Azure Portal:

1. **Verify functions are deployed:**
   ```bash
   # List deployed functions
   az functionapp function list \
     --name "demisparkgpt" \
     --resource-group "demi"
   ```

2. **Check if functions are properly registered:**
   - Ensure `dist/index.js` exists and contains all function imports
   - Verify `host.json` points to `dist/index.js` as the main entry point
   - Check that all function files are imported in `src/index.ts`

3. **Restart and sync functions:**
   ```bash
   # Restart the function app
   az functionapp restart \
     --name "demisparkgpt" \
     --resource-group "demi"
   
   # Wait a few seconds, then sync triggers
   az functionapp function sync \
     --name "demisparkgpt" \
     --resource-group "demi"
   ```

4. **Check runtime errors:**
   ```bash
   # View streaming logs
   az functionapp log tail \
     --name "demisparkgpt" \
     --resource-group "demi"
   ```

5. **Verify Node.js version compatibility:**
   - Ensure `WEBSITE_NODE_DEFAULT_VERSION` is set to `~22`
   - Check that runtime version matches in function app settings

6. **Force redeploy:**
   ```bash
   # Clean build and redeploy
   npm run clean
   npm run build
   func azure functionapp publish demisparkgpt --force
   ```

## Migrating to Flex Consumption and Node.js 22

### Current Status
Your function app is currently on **Linux Consumption** plan and **Node.js 20**. You need to migrate to:
- **Flex Consumption** hosting plan (EOL: September 30, 2028)
- **Node.js 22** runtime (EOL: April 30, 2026)

### Migration Steps

#### Option 1: Using Azure Portal (Recommended)

1. **Upgrade Node.js Version:**
   - Go to Azure Portal → Function App → Configuration → Application settings
   - Update `WEBSITE_NODE_DEFAULT_VERSION` to `~22`
   - Save and restart

2. **Migrate to Flex Consumption:**
   - Go to Function App → Settings → Hosting
   - Click "Change plan"
   - Select "Flex Consumption" plan
   - Follow the migration wizard

#### Option 2: Using Azure CLI

```bash
# 1. Update Node.js version
az functionapp config appsettings set \
  --name "demigptnodets" \
  --resource-group "demi" \
  --settings WEBSITE_NODE_DEFAULT_VERSION="~22" \
  FUNCTIONS_EXTENSION_VERSION="~4"

# 2. Create Flex Consumption plan (if needed)
az functionapp plan create \
  --name "demigptnodets-flex" \
  --resource-group "demi" \
  --location "germanywestcentral" \
  --sku FC1 \
  --is-linux

# 3. Move function app to Flex Consumption plan
az functionapp update \
  --name "demigptnodets" \
  --resource-group "demi" \
  --plan "demigptnodets-flex"

# 4. Restart function app
az functionapp restart \
  --name "demigptnodets" \
  --resource-group "demi"
```

#### Option 3: Using Infrastructure as Code (Bicep)

The infrastructure code has been updated to use Node.js 22 and Flex Consumption. Redeploy:

```bash
cd infra
az deployment sub create \
  --location germanywestcentral \
  --template-file main.bicep \
  --parameters @main.parameters.json \
  --parameters environmentName="production" \
  --parameters location="germanywestcentral"
```

**Note:** This will update the existing function app if the names match, or create a new one.

### Verify Migration

```bash
# Check function app plan
az functionapp show \
  --name "demigptnodets" \
  --resource-group "demi" \
  --query "{plan:appServicePlanId, nodeVersion:siteConfig.nodeVersion}" \
  -o table

# Check runtime version
az functionapp config show \
  --name "demigptnodets" \
  --resource-group "demi" \
  --query "linuxFxVersion" \
  -o tsv
```

## Quick Deploy Checklist

- [ ] Azure CLI installed and logged in
- [ ] Resource group exists (`demi`)
- [ ] Function app exists (`demisparkgpt`) or will be created
- [ ] Environment variables configured in Azure
- [ ] Project built successfully (`npm run build`)
- [ ] Function deployed (`npm run publish:azure`)
- [ ] Function tested and working

## Next Steps After Deployment

1. **Set up Application Insights** for monitoring
2. **Configure CORS** if needed for web applications
3. **Set up authentication** if required
4. **Configure custom domain** if needed
5. **Set up CI/CD** for automated deployments

## Support

For issues:
- Check function logs in Azure Portal
- Review Application Insights
- Check environment variable validation messages
- Verify all required environment variables are set

