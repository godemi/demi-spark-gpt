# Azure Functions Deployment Guide

This project supports multiple deployment methods to Azure Functions. Choose the method that best fits your needs.

## Prerequisites

Before deploying, ensure you have:

1. **Azure CLI** installed and logged in:
   ```bash
   az login
   az account set --subscription "your-subscription-id"
   ```

2. **Azure Functions Core Tools** installed:
   ```bash
   npm install -g azure-functions-core-tools@4 --unsafe-perm true
   ```

3. **Azure Developer CLI (azd)** installed (for full infrastructure deployment):
   ```bash
   # macOS
   brew tap azure/azd && brew install azd
   
   # Windows (PowerShell)
   irm https://aka.ms/install-azd.ps1 | iex
   
   # Linux
   curl -fsSL https://aka.ms/install-azd.sh | bash
   ```

4. **Node.js 20+** installed

5. **Build dependencies** installed:
   ```bash
   npm install
   ```

## Deployment Methods

### Method 1: Azure Developer CLI (azd) - Full Infrastructure + Code Deployment

**Best for:** First-time deployment, infrastructure provisioning, or when you need to deploy everything from scratch.

This method uses the Bicep templates in the `infra/` directory to provision all Azure resources and deploy your code.

#### Steps:

1. **Initialize environment** (if not already done):
   ```bash
   azd init
   ```
   - Provide an environment name (e.g., `dev`, `staging`, `prod`)
   - Select your Azure subscription
   - Choose an Azure location (must support Flex Consumption plan)

2. **Deploy everything**:
   ```bash
   azd up
   ```
   This will:
   - Provision all Azure resources (Function App, Storage Account, Application Insights, VNet, etc.)
   - Build your TypeScript code
   - Deploy the compiled code to Azure Functions
   - Output the function app URL and endpoints

3. **Redeploy code only** (after initial deployment):
   ```bash
   azd deploy
   ```

4. **Update infrastructure only**:
   ```bash
   azd provision
   ```

#### Configuration:

- Infrastructure templates: `infra/main.bicep` and related files
- Azure Developer CLI config: `azure.yaml`
- Parameters: `infra/main.parameters.json` (if exists)

### Method 2: Azure Functions Core Tools - Code-Only Deployment

**Best for:** Deploying code updates to an existing Function App.

This method deploys only your code to an existing Azure Function App.

#### Steps:

1. **Build your project**:
   ```bash
   npm run build
   ```

2. **Deploy to existing Function App**:
   ```bash
   func azure functionapp publish <FUNCTION_APP_NAME>
   ```
   
   Or use the npm script:
   ```bash
   npm run deploy
   ```
   
   Replace `<FUNCTION_APP_NAME>` with your actual Function App name (e.g., `demigpt`).

3. **Verify deployment**:
   ```bash
   func azure functionapp list-functions <FUNCTION_APP_NAME>
   ```

### Method 3: Automated Deployment Script

**Best for:** Automated deployments with build verification and confirmation prompts.

The project includes a shell script that automates the build and deployment process.

#### Steps:

1. **Make script executable** (if needed):
   ```bash
   chmod +x publish_azure_function.sh
   ```

2. **Run the script**:
   ```bash
   ./publish_azure_function.sh
   ```
   
   Or use the npm script:
   ```bash
   npm run publish:azure
   ```

3. **Force deployment** (skip prompts):
   ```bash
   npm run publish:azure:force
   ```

The script will:
- Check Azure CLI installation and login status
- Set the subscription and resource group
- Clean and rebuild the project
- Prompt for confirmation before publishing
- Deploy to the Function App named `demigpt`

**Note:** Update the `SUBSCRIPTION_ID` and `RESOURCE_GROUP` variables in `publish_azure_function.sh` if needed.

### Method 4: CI/CD Pipeline Deployment

**Best for:** Automated deployments from GitHub Actions, Azure DevOps, or other CI/CD platforms.

#### GitHub Actions Example:

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Azure Functions

on:
  push:
    branches: [ main ]
  workflow_dispatch:

env:
  AZURE_FUNCTIONAPP_NAME: 'demigpt'
  NODE_VERSION: '20.x'

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: ${{ env.NODE_VERSION }}
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
      
      - name: Deploy to Azure Functions
        uses: Azure/functions-action@v1
        with:
          app-name: ${{ env.AZURE_FUNCTIONAPP_NAME }}
          package: '.'
          publish-profile: ${{ secrets.AZURE_FUNCTIONAPP_PUBLISH_PROFILE }}
```

## Environment Variables and Configuration

### Local Development

Configure `local.settings.json` for local testing:

```json
{
  "IsEncrypted": false,
  "Values": {
    "AzureWebJobsStorage": "UseDevelopmentStorage=true",
    "FUNCTIONS_WORKER_RUNTIME": "node",
    "WEBSITE_NODE_DEFAULT_VERSION": "~22",
    "AZURE_OPENAI_API_KEY": "your-key",
    "DEMIGPT_API_KEY": "your-key",
    "AZURE_OPENAI_ENDPOINT": "your-endpoint",
    "DATABASE_URL": "your-database-url"
  }
}
```

### Azure Function App Settings

After deployment, configure application settings in Azure:

1. **Via Azure Portal**:
   - Navigate to your Function App
   - Go to Configuration → Application settings
   - Add/update required environment variables

2. **Via Azure CLI**:
   ```bash
   az functionapp config appsettings set \
     --name <FUNCTION_APP_NAME> \
     --resource-group <RESOURCE_GROUP> \
     --settings \
       AZURE_OPENAI_API_KEY="your-key" \
       DEMIGPT_API_KEY="your-key" \
       DATABASE_URL="your-database-url"
   ```

3. **Via Azure Developer CLI**:
   Update `infra/app/processor.bicep` to include app settings in the `appSettings` parameter.

## Verification

After deployment, verify your functions are working:

1. **List functions**:
   ```bash
   func azure functionapp list-functions <FUNCTION_APP_NAME> --show-keys
   ```

2. **Test endpoints**:
   ```bash
   curl https://<FUNCTION_APP_NAME>.azurewebsites.net/api/chat/completions
   ```

3. **View logs**:
   ```bash
   func azure functionapp logstream <FUNCTION_APP_NAME>
   ```

## Troubleshooting

### Common Issues

1. **Build errors**:
   - Ensure Node.js 20+ is installed
   - Run `npm install` to ensure all dependencies are installed
   - Check TypeScript compilation: `npm run build`

2. **Deployment failures**:
   - Verify Azure CLI is logged in: `az account show`
   - Check Function App exists: `az functionapp show --name <NAME> --resource-group <RG>`
   - Ensure you have proper permissions

3. **Function not found**:
   - Verify `host.json` points to correct entry: `"main": "dist/index.js"`
   - Check function bindings are correctly configured
   - Review function registration in `src/index.ts`

4. **Runtime errors**:
   - Check Application Insights logs in Azure Portal
   - Review function logs: `func azure functionapp logstream <NAME>`
   - Verify environment variables are set correctly

### Useful Commands

```bash
# View Function App details
az functionapp show --name <NAME> --resource-group <RG>

# View application settings
az functionapp config appsettings list --name <NAME> --resource-group <RG>

# Restart Function App
az functionapp restart --name <NAME> --resource-group <RG>

# View deployment logs
az functionapp deployment list --name <NAME> --resource-group <RG>
```

## Clean Up

To remove all deployed resources:

```bash
# Using Azure Developer CLI
azd down

# Or manually via Azure CLI
az group delete --name <RESOURCE_GROUP> --yes
```

## Additional Resources

- [Azure Functions Documentation](https://learn.microsoft.com/azure/azure-functions/)
- [Azure Developer CLI Documentation](https://learn.microsoft.com/azure/developer/azure-developer-cli/)
- [Azure Functions Core Tools](https://learn.microsoft.com/azure/azure-functions/functions-run-local)

