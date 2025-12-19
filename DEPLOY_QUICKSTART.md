# Quick Deployment Guide

## 🚀 Quick Start - Deploy to Existing Function App

If you already have a Function App deployed and just want to update the code:

```bashr
# 1. Build the project
npm run build

# 2. Deploy (replace 'demigpt' with your Function App name)
func azure functionapp publish demigpt

# Or use the npm script
npm run deploy
```

## 🏗️ First-Time Deployment (Full Infrastructure)

If this is your first deployment or you need to provision infrastructure:

```bash
# 1. Initialize Azure Developer CLI
azd init

# 2. Deploy everything (infrastructure + code)
azd up
```

## 📦 Automated Deployment Script

Use the provided script for a guided deployment:

```bash
npm run publish:azure
```

This script will:

- ✅ Check Azure CLI installation
- ✅ Verify login status
- ✅ Clean and rebuild the project
- ✅ Deploy to Azure

## ⚙️ Update Environment Variables

After deployment, set your environment variables:

```bash
az functionapp config appsettings set \
  --name demigpt \
  --resource-group demi \
  --settings \
    AZURE_OPENAI_API_KEY="your-key" \
    DEMIGPT_API_KEY="your-key" \
    DATABASE_URL="your-database-url"
```

## 🔍 Verify Deployment

```bash
# List all functions
func azure functionapp list-functions demigpt

# Stream logs
func azure functionapp logstream demigpt

# Test endpoint
curl https://demigpt.azurewebsites.net/api/status
```

## 📝 Current Configuration

- **Function App Name**: `demigpt` (update in `publish_azure_function.sh` if different)
- **Resource Group**: `demi` (update in `publish_azure_function.sh` if different)
- **Subscription ID**: `f72aad8c-7a1f-498b-8a19-7a25231523cf` (update in `publish_azure_function.sh` if different)
- **Runtime**: Node.js 20
- **Entry Point**: `dist/index.js`

For detailed information, see [DEPLOYMENT.md](./DEPLOYMENT.md).
