# Azure Function demigpt for Processing Prompt Requests

by Tobias Wolff <tobias.wolff@posteo.de>

This document provides a comprehensive guide on the demigpt Azure Function designed to handle POST requests with prompting information, process it, and send it to the Azure Chat GPT API. The function allows the use of custom pre-prompts, system-wide prompts, and variables to tailor responses.

## Table of Contents

1. [Installation Instructions](#installation-instructions)
   - [Visual Studio Code](#installing-visual-studio-code)
   - [Azure Core Functions](#installing-azure-core-functions)
   - [Required Extensions](#installing-extensions)
2. [Code Checkout and Setup](#code-checkout-and-setup)
   - [Checkout Source Code from GIT](#checkout-source-code-from-git)
   - [Using Environment Variables](#using-environment-variables)
3. [Code Explanation](#code-explanation)
   - [Function Overview](#function-overview)
   - [Functions and Variables](#functions-and-variables)
4. [How to Use the Function](#how-to-use-the-function)
5. [Testing the Function Locally](#testing-the-function-locally)
6. [Deploying the Function to Azure](#deploying-the-function-to-azure)
   - [Publishing via VS Code Menu](#publishing-via-vs-code-menu)
7. [Generating the Function URL in Azure](#generating-the-function-url-in-azure)
8. [Chat GPT Parameters](#chat-gpt-parameters)

---

## Installation Instructions

### Installing Visual Studio Code

#### Linux

1. Open a terminal and update the package index:
   ```bash
   sudo apt update
   ```
2. Install Visual Studio Code:
   ```bash
   sudo snap install --classic code
   ```

#### macOS

1. Download the latest Visual Studio Code installer from the [official website](https://code.visualstudio.com/).
2. Drag and drop Visual Studio Code into the Applications folder.

#### Windows

1. Download the installer from the [official website](https://code.visualstudio.com/).
2. Run the installer and follow the on-screen instructions.

### Installing Azure Core Functions

To install the Azure Functions Core Tools, follow these steps based on your operating system:

#### Linux

```bash
npm install -g azure-functions-core-tools@3 --unsafe-perm true
```

#### macOS

```bash
brew tap azure/functions
brew install azure-functions-core-tools@3
```

#### Windows

```bash
npm install -g azure-functions-core-tools@3 --unsafe-perm true
```

### Installing Extensions

Install the following extensions in Visual Studio Code to facilitate Azure Functions development:

1. **Azure Resources**: Allows you to manage Azure resources.
2. **Python**: Provides Python language support.
3. **Azure Functions**: Enables Azure Functions development and deployment.
4. **Azurite**: A local Azure Storage emulator.
5. **Thunder Client**: A lightweight REST API client for testing HTTP requests.

To install extensions:

- Open Visual Studio Code.
- Go to the Extensions view (`Ctrl+Shift+X`).
- Search for each extension and click **Install**.

---

## Code Checkout and Setup

### Checkout Source Code from GIT

To check out the repository from Azure DevOps, follow these steps:

### Prerequisites

- Ensure you have Git installed on your local machine.
- You need access permissions to the Azure DevOps repository.

### Steps to Check Out the Repository

1. **Clone the Repository**: Use the `git clone` command followed by the repository URL to check it out. Replace `<your-username>` with your Azure DevOps username if required.

https://dev.azure.com/die-marketing-idee/_git/demigpt

```bash
git clone https://die-marketing-idee@dev.azure.com/die-marketing-idee/demigpt/_git/demigpt
```

2. **Enter Credentials**: If prompted, enter your Azure DevOps username and password (or a personal access token if you have set one up).

3. **Change into the Repository Directory**:

   ```bash
   cd demigpt
   ```

Now, you have successfully checked out the repository and can start working with it!

### Using Environment Variables

Environment variables are useful for storing configuration settings and secrets that your Azure Functions might need at runtime. This guide will walk you through how to use environment variables in Azure Functions.

#### Why Use Environment Variables?

- **Configuration Management**: Keep your settings separate from your code, making it easier to manage different configurations for development, testing, and production environments.
- **Security**: Store sensitive information such as connection strings, API keys, and passwords without hardcoding them in your application code.

#### Steps to Use Environment Variables in Azure Functions

##### 1. Setting Up Environment Variables

You can define environment variables in different ways depending on how you are hosting your Azure Functions.

##### a. Local Development

When developing locally, you can use a local.settings.json file to define environment variables.

1. **Create or Open `local.settings.json`**:

   - In your Azure Function project, locate or create a `local.settings.json` file in the root directory.

2. **Add Environment Variables**:

   - Define your environment variables within the `Values` section of the `local.settings.json` file. The format is as follows:

   ```json
   {
     "IsEncrypted": false,
     "Values": {
       "FUNCTIONS_WORKER_RUNTIME": "python",
       "AzureWebJobsStorage": "UseDevelopmentStorage=true",
       "MyBindingConnection": "",
       "AZURE_OPEN_AI_API_KEY": "API_KEY_HERE!"
     },
     "Host": {
       "LocalHttpPort": 7071,
       "CORS": "*",
       "CORSCredentials": false
     },
     "ConnectionStrings": {
       "SQLConnectionString": ""
     },
     "AZURE_OPENAI_ENDPOINT": "https://dmi-azure-open-ai.openai.azure.com/",
     "OPENAI_API_KEY": "",
     "AZURE_CLIENT_ID": "",
     "MODEL_ID": "azureml://registries/azure-openai/models/gpt-4/versions/turbo-2024-04-09"
   }
   ```

   > **Note**: Do not check in `local.settings.json` to version control (e.g., Git), as it may contain sensitive information. Add it to your `.gitignore` file.

##### b. Azure Portal

If you are deploying your Function to Azure, you can set environment variables directly in the Azure Portal.

1. **Navigate to Your Function App**:

   - Go to the Azure Portal and find your Function App.

2. **Configuration Settings**:

   - Under the **Settings** section, click on **Configuration**.

3. **Add New Application Setting**:

   - Click on **New application setting** to add a new environment variable.
   - Enter the name and value for your environment variable, then click **OK**.

4. **Save Changes**:
   - After adding all required environment variables, click the **Save** button at the top of the Configuration blade.

#### 2. Accessing Environment Variables in Your Function Code

You can access environment variables in your Azure Functions code using the following syntax:

##### a. Python Example

```python
import os
import logging
import azure.functions as func

def main(req: func.HttpRequest) -> func.HttpResponse:
    my_secret = os.getenv("MySecret")
    logging.info(f"My secret value: {my_secret}")

    return func.HttpResponse("Function executed successfully.", status_code=200)
```

### 3. Best Practices

- **Use Naming Conventions**: Use clear and descriptive names for your environment variables.
- **Limit Scope**: Only use environment variables that are necessary for your application.
- **Security Considerations**: Be cautious when logging environment variable values, especially sensitive ones.

---

## Code Explanation

### Function Overview

The Azure Function defined in the provided code processes POST requests, extracting prompting information and sending it to the Azure Chat GPT API. It enables customization through pre-prompts, system prompts, and variable definitions.

### Functions and Variables

1. **Global Constants**

   - `FUNCTION_VERSION`: Represents the version of the function.
   - `API_KEY`: Placeholder for the Azure API key. See local.settings.json

2. **Helper Functions**

   - **`get_http_json_response_data`**: Generates a structured JSON response based on input parameters, response data, status codes, and error information.
   - **`send_http_json_response`**: Sends an HTTP response back to the client, either using provided data or generating it using `get_http_json_response_data`.
   - **`gpt_request`**: Sends a request to the Azure Chat GPT API, handling any potential exceptions during the request.
   - **`generate_system_parameter_pre_prompts`**: Generates system pre-prompts based on the request body, adding relevant context for the AI's response.
   - **`generate_variables_pre_prompts`**: Extracts variables from the request body and formats them for use in the AI request.
   - **`generate_custom_parameter_pre_prompts`**: Handles custom pre-prompts specified by the user.

3. **Main Function**
   - **`demigpt`**: This is the main entry point for the function that processes incoming HTTP requests, validates them, and prepares parameters for AI requests.

### Code Walkthrough

- **Request Handling**: The function retrieves the JSON body from incoming requests. It validates the request and processes any errors.
- **Parameters**: Default parameters like `temperature`, `top_p`, and `max_tokens` are set, which influence the behavior of the AI response.
- **Pre-Prompt Generation**: The function creates a list of pre-prompts based on the user-defined options, improving response relevance.
- **AI Request**: The function constructs a payload and calls the `gpt_request` function to interact with the Azure Chat GPT API.
- **Response**: The final response is structured and sent back to the requester.

---

## How to Use the Function

### Sending Requests

Requests to the Azure Function are made locally at the following endpoint:

```
http://localhost:7071/api/demigpt
```

### Request Format

The requests are **POST** requests with the following JSON body format:

```json
{
  "prompt": "Generate a product description for the product described in the VARIABLES. Use 500 words. Make it exciting and easy to read.",
  "fallback_result_language": "de",
  "system_pre_prompts_enabled": true,
  "system_pre_prompts_explain_technical_terms": true,
  "system_pre_prompts_non_expert_mode": true,
  "system_pre_prompts_brief_response": false,
  "variables": [
    {
      "name": "PRODUCT_NAME",
      "description": "The name of the product",
      "value": "Schweißgerät X10 PowerFuse 3000",
      "type": "STRING"
    },
    {
      "name": "FIRST_RELEASE_DATE",
      "description": "The first release date of the product with PRODUCT_NAME",
      "value": "2024-10-14T15:32:29+0100",
      "type": "iso-8601"
    }
  ],
  "custom_pre_prompts": [
    {
      "name": "USE_HALUCINATIONS",
      "description": "Change the result to a halucination.",
      "text": "Generate the result in a halucinating way making up ridiculous things as if you are halucinating impossible things."
    }
  ]
}
```

### Explanation of Each Variable

1. **prompt**:

   - **Description**: The main prompt instructing the model on what to generate.
   - **Usage**: It drives the content creation process based on the user’s request.

2. **fallback_result_language**:

   - **Description**: The language in which the fallback response will be generated if the primary generation fails.
   - **Usage**: Useful for applications requiring multi-language support; if the primary request fails, the response can be generated in this language.

3. **system_pre_prompts_enabled**:

   - **Description**: A flag indicating whether system-wide pre-prompts should be enabled.
   - **Usage**: If set to `true`, system prompts are added to enhance the context for the model.

4. **system_pre_prompts_explain_technical_terms**:

   - **Description**: A flag to instruct the model to explain technical terms when generating responses.
   - **Usage**: If `true`, the AI will provide simpler explanations for any technical jargon present in the content.

5. **system_pre_prompts_non_expert_mode**:

   - **Description**: A flag indicating if the model should respond in a way that's understandable to non-experts.
   - **Usage**: Helps to tailor the response for a general audience if set to `true`.

6. **system_pre_prompts_brief_response**:

   - **Description**: This flag controls whether the model should provide brief or detailed responses.
   - **Usage**: If `false`, the AI will aim for a more comprehensive output.

7. **variables**:

   - **Description**: An array of variable objects that provide context for the model.
   - **Usage**: Each variable can be accessed in the prompt, allowing for dynamic content generation based on provided data.
   - **Example**: In the example above, the variables include:
     - `PRODUCT_NAME`: The name of the product being described.
     - `FIRST_RELEASE_DATE`: The release date of the product.

8. **custom_pre_prompts**:
   - **Description**: An array of custom pre-prompts to further guide the model's responses.
   - **Usage**: This allows users to customize the AI's response style or approach based on additional instructions.
   - **Example**: In the example above, the custom pre-prompt asks the model to generate content in a "hallucinated" manner, creating absurd or imaginative content.

---

### Response Format

This document explains the structure and components of the JSON output response returned by the Azure Function for processing prompt requests. The response contains both parameters and the generated response from the AI model.

### JSON Structure

```json
{
  "parameters": { ... },
  "response": { ... },
  "function_version": "20240925_2132", // The version of the code (to be adjusted manually)
  "status_code": 200
}
```

### 1. Parameters

The `parameters` field contains the inputs and configurations that were sent to the AI model. Below is a breakdown of its contents:

#### a. Prompt Configuration

- **`prompt`**:

  - **Description**: The primary instruction for the AI model.
  - **Example**: `"Generate a product description for the product described in the VARIABLES. Use 500 words. Make it exciting and easy to read."`

- **`temperature`**:

  - **Description**: Controls the randomness of the model’s output. Higher values lead to more creative responses.
  - **Example**: `0.7`

- **`top_p`**:

  - **Description**: Controls the diversity of the output by limiting the set of possible next words.
  - **Example**: `0.95`

- **`max_tokens`**:
  - **Description**: The maximum number of tokens in the generated response.
  - **Example**: `800`

#### b. System Pre-Prompts

- **`system_pre_prompts_enabled`**:

  - **Description**: Indicates whether system-wide prompts are enabled.
  - **Example**: `true`

- **`system_pre_prompts_explain_technical_terms`**:

  - **Description**: Flag to ensure technical terms are explained briefly.
  - **Example**: `true`

- **`system_pre_prompts_non_expert_mode`**:

  - **Description**: Specifies if the response should be understandable to non-experts.
  - **Example**: `true`

- **`system_pre_prompts_brief_response`**:

  - **Description**: Determines if the response should be brief.
  - **Example**: `false`

- **`fallback_result_language`**:

  - **Description**: The language to use if the primary generation fails.
  - **Example**: `"de"` (German)

- **`fallback_result_language_name`**:
  - **Description**: Human-readable name of the fallback language.
  - **Example**: `"German"`

#### c. Pre-Prompts

The `pre_prompts` field is an array of instructions to guide the AI’s output. Examples include:

```json
[
  {
    "type": "text",
    "text": "You are an AI assistant exclusively for marketing and help people find information and explain things."
  },
  {
    "type": "text",
    "text": "Technical terms need to always be explained briefly."
  },
  ...
]
```

Each object contains:

- **`type`**: Indicates the type of the prompt (usually "text").
- **`text`**: The actual instruction to be followed by the AI.

#### d. Variables

The `variables` field holds key-value pairs that provide contextual information for the AI. Examples include:

```json
[
  {
    "name": "PRODUCT_NAME",
    "description": "The name of the product",
    "value": "Schweißgerät X10 PowerFuse 3000",
    "type": "string"
  },
  {
    "name": "FIRST_RELEASE_DATE",
    "description": "The first release date of the product with PRODUCT_NAME",
    "value": "2024-10-14T15:32:29+0100",
    "type": "iso-8601"
  }
]
```

#### e. Custom Pre-Prompts

- **`custom_pre_prompts`**: Contains user-defined prompts to modify the AI’s output behavior.

```json
[
  {
    "name": "USE_HALUCINATIONS",
    "description": "Change the result to a halucination.",
    "text": "Generate the result in a halucinating way making up ridiculous things as if you are halucinating impossible things."
  }
]
```

### 2. Response

The `response` field contains the result from the AI model, detailing the generated content and other relevant metadata:

#### a. Response Metadata

- **`engine`**: The engine used for generating the response.

  - **Example**: `"chatgpt"`

- **`version`**: The version of the model.

  - **Example**: `"4"`

- **`api_version`**: The version of the API being used.

  - **Example**: `"2024-02-15-preview"`

- **`processing_time`**: The time taken to process the request (in seconds).
  - **Example**: `11.878988027572632`

#### b. GPT Response

The `gpt_response` contains the generated content from the AI:

```json
"gpt_response": [
  {
    "choices": [
      {
        "finish_reason": "stop",
        "index": 0,
        "message": {
          "content": "Introducing the revolutionary **PRODUCT_NAME**, a marvel of modern engineering ...",
          "role": "assistant"
        }
      }
    ],
    ...
  },
  null
]
```

- **`choices`**: An array of choices provided by the model. Each choice contains:
  - **`finish_reason`**: The reason for the end of the response (e.g., "stop").
  - **`index`**: The index of the choice in the array.
  - **`message`**: Contains the generated content and the role of the sender (usually "assistant").

### 3. Version and Status Code

- **`version`**: Indicates the version of the response structure.

  - **Example**: `"20240925_2132"`

- **`status_code`**: The HTTP status code for the response.
  - **Example**: `200` (indicating success)

---

## Testing the Function Locally

1. Open your terminal or command prompt.
2. Navigate to the directory where your function is located.
3. Start the Azure Functions host:
   ```bash
   func start
   ```
4. Use tools like **Thunder Client** or **Postman** to send a POST request to the local endpoint (usually `http://localhost:7071/api/demigpt`) with the appropriate JSON body.

---

## Deploying the Function to Azure

### Publishing via VS Code Menu

1. Open the Azure sidebar (`Ctrl+Shift+A`) in Visual Studio Code.
2. Find your Azure subscription and expand it.
3. Right-click on the **Functions** node and select **Deploy to Function App**.
4. Follow the prompts to select or create a new Function App in Azure.
5. Wait for the deployment to complete. You will see notifications on the progress.

### Using Shortcuts

1. Open the command palette (`Ctrl+Shift+P`).
2. Type **Azure Functions: Deploy to Function App** and select it.
3. Follow the prompts to complete the deployment.

## Generating the Function URL in Azure using Visual Studio Code

This guide will walk you through the steps to generate and access the URL for your Azure Function using Visual Studio Code.

### Prerequisites

1. **Azure Functions Extension**: Ensure that you have the Azure Functions extension installed in Visual Studio Code.
2. **Azure Subscription**: Make sure you have an active Azure subscription.

### Steps to Generate the Function URL

#### 1. Open Visual Studio Code

- Launch Visual Studio Code.

#### 2. Sign in to Azure

- Click on the **Azure** icon in the Activity Bar on the side.
- Sign in to your Azure account by clicking on **Sign In**. Follow the prompts to authenticate.

#### 3. Create or Open Your Azure Function Project

- If you already have a Function project, open it by navigating to `File -> Open Folder...`.
- If you need to create a new Azure Function project:
  - Open the Command Palette by pressing `Ctrl + Shift + P` (or `Cmd + Shift + P` on macOS).
  - Type `Azure Functions: Create New Project...` and follow the prompts to create a new project.

#### 4. Deploy Your Function

- Right-click on your Function in the Azure Functions explorer and select **Deploy to Function App...**.
- Follow the prompts to select an existing Function App or create a new one.
- Once the deployment is complete, you will see a message in the output window indicating that the Function has been successfully deployed.

#### 5. Generate the Function URL

- After deployment, right-click on the deployed Function in the Azure Functions explorer.
- Select **Copy Function URL** from the context menu.
- The Function URL will be copied to your clipboard. It will look something like this:

Replace CODE with the secret code to make an authenticated call to the function.

```
https://demigpt.azurewebsites.net/api/demigpt?code=CODE
```

#### 6. Accessing the Function URL

- You can test the Function URL using tools like **Thunder Client** or **Postman**.
- To make a request:
  - Open Thunder Client or Postman.
  - Create a new request and set the request type to `POST`.
  - Paste the copied URL into the request URL field.
  - Set the request body in JSON format as required by your Function.

## Chat GPT Parameters

When sending requests to the Azure Chat GPT API, the following parameters can be customized to control the output of the model:

1. **Temperature**:

   - **Description**: This parameter controls the randomness of the output. A lower temperature (e.g., `0.2`) will make the model more deterministic and focused, producing more predictable responses. A higher temperature (e.g., `0.8`) allows for more creative and diverse outputs.
   - **Range**: `0.0` (most deterministic) to `1.0` (most random).

2. **Top_p**:

   - **Description**: This parameter is used for nucleus sampling. Instead of choosing from all possible next words, the model considers only the top `p` percentage of most likely words. Setting `top_p` to `0.9` means the model will sample from the smallest set of words whose cumulative probability is at least `0.9`, promoting diverse responses while still being somewhat focused.
   - **Range**: `0.0` to `1.0`.

3. **Max_tokens**:
   - **Description**: This parameter specifies the maximum number of tokens (words or word pieces) that the model will generate in the response. It helps control the length of the output. For instance, setting `max_tokens` to `50` means the model can generate a maximum of 50 tokens.
   - **Range**: Depends on the specific API limits but typically ranges from `1` to a few thousand tokens.

---

## Conclusion

This guide provides a complete overview of an Azure Function that processes prompting information for the Azure Chat GPT API. By following the steps outlined, developers can set up their environment, understand the code, and deploy the function to Azure seamlessly. For any issues or further inquiries, contact me via tobias.wolff@posteo.de .
