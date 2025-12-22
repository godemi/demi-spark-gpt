# Quick Deployment Guide

## ✅ Current Status

- **Function App:** `demisparkgpt` (Running)
- **Resource Group:** `demi`
- **Location:** Germany West Central
- **URL:** https://demisparkgpt.azurewebsites.net
- **Environment Variables:** ✅ Configured

## 🚀 Deploy Now

### Option 1: One-Command Deploy (Recommended)

```bash
npm run publish:azure
```

This will:
1. Clean and build the project
2. Deploy to Azure Function App
3. Ask for confirmation before deploying

### Option 2: Step-by-Step Deploy

```bash
# 1. Build the project
npm run clean
npm run build

# 2. Deploy to Azure
func azure functionapp publish demisparkgpt
```

## 📋 Environment Variables Status

Current environment variables in Azure:
- ✅ `AZURE_OPENAI_ENDPOINT` - Set
- ✅ `AZURE_OPENAI_API_KEY` - Set  
- ✅ `AZURE_OPENAI_DEPLOYMENT` - Set to `gpt-5-nano`
- ✅ `AZURE_OPENAI_API_VERSION` - Set to `2024-12-01-preview`

## 🧪 Test After Deployment

```bash
# Get function key
FUNCTION_KEY=$(az functionapp keys list \
  --name "demisparkgpt" \
  --resource-group "demi" \
  --query "functionKeys.default" \
  -o tsv)

# Test chat completions
curl -X POST "https://demisparkgpt.azurewebsites.net/v1/chat/completions?code=$FUNCTION_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "api_version": "2024-12-01-preview",
    "model": "gpt-5-nano",
    "messages": [
      {
        "role": "user",
        "content": "Hello! Test message."
      }
    ]
  }'
```

## 📝 Update Environment Variables

If you need to update environment variables:

```bash
# Run the setup script
./setup-azure-env.sh

# OR manually via Azure CLI
az functionapp config appsettings set \
  --name "demisparkgpt" \
  --resource-group "demi" \
  --settings \
    AZURE_OPENAI_ENDPOINT="https://your-endpoint.openai.azure.com" \
    AZURE_OPENAI_API_KEY="your-key" \
    AZURE_OPENAI_DEPLOYMENT="gpt-5-nano" \
    AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

## 🔍 Verify Deployment

```bash
# Check function app status
az functionapp show \
  --name "demisparkgpt" \
  --resource-group "demi" \
  --query "{state:state, defaultHostName:defaultHostName}" \
  -o table

# View logs
az functionapp log tail \
  --name "demisparkgpt" \
  --resource-group "demi"
```

## 📚 Full Documentation

See `DEPLOYMENT_GUIDE.md` for comprehensive deployment instructions.

