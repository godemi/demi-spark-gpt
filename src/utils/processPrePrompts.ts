// src/utils/processPrePrompts.ts

import {
  DemiGPTInputParametersType,
  DemiGPTProcessedParametersType,
  VALID_PRE_PROMPT_ROLES,
} from "../models/types";

// Helper: add system pre-prompt if global flag is true.
const addSystemPrePromptsGlobal = (
  params: DemiGPTProcessedParametersType
): DemiGPTProcessedParametersType => {
  if (params.system_pre_prompts_global === true) {
    const overwrite = params.overwrite_system_pre_prompts?.find(
      p => p.name === "system_pre_prompts_global"
    );

    params.pre_prompts.push({
      role: "system",
      type: "text",
      text:
        overwrite?.prompt ||
        `Please consider the following information about our software and business model to generate content:
  We develop an innovative marketing software called "Die Marketing Idee" (DMI) for small and medium-sized enterprises (SMEs), specifically in the industrial sector. Our software leverages artificial intelligence (AI) and data-driven methods to create automated, customized marketing strategies for SMEs and convert these into a concrete operational roadmap with specific measures.
   
  Context for Content Usage: The generated content will be used directly as building blocks for creating actionable measures in the DMI software. It serves as an operational feed for the marketing roadmap and should be ready for immediate implementation without any need for further adjustments.
   
  Target Audience:
  Medium-sized industrial companies in the DACH region
  Companies with limited marketing expertise and resources
  Businesses that require efficient marketing strategies to expand their presence in niche markets
   
  Key Objectives of the Software:
  Automated Strategy Development: Creating tailored marketing strategies based on specific company parameters
  Actionable Roadmaps: Translating strategies into concrete operational steps that are easy for companies to implement
  Increased Efficiency: Reducing planning efforts by up to 88% and increasing lead generation by three times
  Flexibility and Adaptability: Dynamic adjustment to changing market conditions and continuous learning from users and peer groups
   
  Your task is now to create the suggested, optimal measures, mostly content, which is played via channels or to give recommendations and ideas. More detailed instructions and the configuration to understand the company and its market will follow. Please make sure that your results are specifically applicable for the user, as they are displayed in the roadmap as the content of the individual measures.
   
  Please avoid additional information and create only the specific content, unless otherwise specified in the prompt (e.g. such as a disclaimer)`,
    });
  }
  return params;
};

// Helper: add system pre-prompt for ensuring minimum tokens.
const addSystemPrePromptsGenerateMinTokens = (
  params: DemiGPTProcessedParametersType
): DemiGPTProcessedParametersType => {
  if (
    typeof params.min_tokens === "number" &&
    params.system_pre_prompts_generate_min_tokens === true
  ) {
    params.pre_prompts.push({
      role: "system",
      type: "text",
      text: `Please ensure that the result is at least ${params.min_tokens} tokens in length. You can achieve this by elaborating further on key points, providing more in-depth explanations, incorporating vivid descriptions, or refining the wording for clarity and richness. Expand on relevant details where possible to enhance the depth and quality of the content.`,
    });
  }
  return params;
};

// Helper: add system pre-prompt to explain technical terms.
const addSystemPrePromptsExplainTechnicalTerms = (
  params: DemiGPTProcessedParametersType
): DemiGPTProcessedParametersType => {
  if (params.system_pre_prompts_explain_technical_terms === true) {
    const overwrite = params.overwrite_system_pre_prompts?.find(
      p => p.name === "system_pre_prompts_explain_technical_terms"
    );

    params.pre_prompts.push({
      role: "system",
      type: "text",
      text: overwrite?.prompt || "Technical terms need to always be explained briefly.",
    });
  }
  return params;
};

// Helper: add system pre-prompt for non-expert mode.
const addSystemPrePromptsNonExpertMode = (
  params: DemiGPTProcessedParametersType
): DemiGPTProcessedParametersType => {
  if (params.system_pre_prompts_non_expert_mode === true) {
    const overwrite = params.overwrite_system_pre_prompts?.find(
      p => p.name === "system_pre_prompts_non_expert_mode"
    );

    params.pre_prompts.push({
      role: "system",
      type: "text",
      text:
        overwrite?.prompt ||
        "Write your answers in a form that can be understood by someone who is not a marketing expert.",
    });
  }
  return params;
};

// Helper: add system pre-prompt for brief responses.
const addSystemPrePromptsBriefResponse = (
  params: DemiGPTProcessedParametersType
): DemiGPTProcessedParametersType => {
  if (params.system_pre_prompts_brief_response === true) {
    const overwrite = params.overwrite_system_pre_prompts?.find(
      p => p.name === "system_pre_prompts_brief_response"
    );

    params.pre_prompts.push({
      role: "system",
      type: "text",
      text: overwrite?.prompt || "Please keep your responses complete but be as brief as possible.",
    });
  }
  return params;
};

// Helper: add system pre-prompt regarding emoticons.
const addSystemPrePromptsAddEmoticons = (
  params: DemiGPTProcessedParametersType
): DemiGPTProcessedParametersType => {
  if (params.system_pre_prompts_add_emoticons === true) {
    const overwrite = params.overwrite_system_pre_prompts?.find(
      p => p.name === "system_pre_prompts_add_emoticons"
    );

    params.pre_prompts.push({
      role: "system",
      type: "text",
      text:
        overwrite?.prompt ||
        "Add emoticons and isocode icons to the result to help with explanations and illustrations.",
    });
  } else {
    params.pre_prompts.push({
      role: "system",
      type: "text",
      text: "Do not add any emoticons or isocode icons to the result.",
    });
  }
  return params;
};

// Helper: add system pre-prompt to format as markdown.
const addSystemPrePromptsFormatAsMarkdown = (
  params: DemiGPTProcessedParametersType
): DemiGPTProcessedParametersType => {
  if (params.system_pre_prompts_format_as_markdown === true) {
    const overwrite = params.overwrite_system_pre_prompts?.find(
      p => p.name === "system_pre_prompts_format_as_markdown"
    );

    params.pre_prompts.push({
      role: "system",
      type: "text",
      text:
        overwrite?.prompt ||
        "Format the result as markdown code in text form using headlines, paragraphs, enumerations, bold and italic texts, etc.",
    });
  }
  return params;
};

// Helper: add system pre-prompt for fallback language.
export const addSystemPrePromptsFallbackLanguage = (
  params: DemiGPTProcessedParametersType
): DemiGPTProcessedParametersType => {
  if (params.fallback_result_language) {
    params.pre_prompts.push({
      role: "system",
      type: "text",
      text: `Detect the main input language from the main prompt (user message), not the pre prompts (system messages), and generate the result in the same language as the user message. If you cannot generate the result in the same language as the main input language from the user message, then generate the result in using the ${params.fallback_result_language} language. Don't mentioned it in the response.`,
    });
  }
  return params;
};

// Helper: add custom pre-prompts.
const addCustomPrePrompts = (
  params: DemiGPTProcessedParametersType
): DemiGPTProcessedParametersType => {
  if (params.custom_pre_prompts && params.custom_pre_prompts.length > 0) {
    for (const customPrePrompt of params.custom_pre_prompts) {
      const prePromptRole = `${customPrePrompt.role}_pre_prompts`;
      if (!VALID_PRE_PROMPT_ROLES.has(prePromptRole)) {
        throw new Error(
          `${prePromptRole} is not allowed. Only ${Array.from(VALID_PRE_PROMPT_ROLES).join(
            ", "
          )} are allowed.`
        );
      }
      params["pre_prompts"].push({
        role: customPrePrompt.role,
        type: "text",
        text: customPrePrompt.text,
      });
    }
  }
  return params;
};

// Helper: add system pre-prompts for variables.
const addSystemPrePromptsVariables = (
  params: DemiGPTProcessedParametersType
): DemiGPTProcessedParametersType => {
  console.log("variables", params.variables);

  if (Array.isArray(params.variables) && params.variables.length > 0) {
    const variablesText =
      "Use the following VARIABLES throughout this request when asked for. " +
      "Each variable has a name, value, description, and type.  " +
      "Also, use the value wherever the variable name appears, without surrounding quotes.  " +
      "Decode any special characters in the value.  " +
      "For dates, format them according to the response language and abbreviate if appropriate.\n\n" +
      "VARIABLES: \n\n" +
      JSON.stringify(params.variables, null, 2);

    params.pre_prompts.push({
      role: "system",
      type: "text",
      text: variablesText,
    });
  }
  return params;
};

/**
 * Generates a list of pre-prompts based on the given parameters.
 * It ensures the processed parameters object includes empty arrays for system, assistant,
 * and user pre-prompts, then adds the various pre-prompts.
 *
 * @param params - The current DemiGPTInputParametersType configuration.
 * @returns The extended DemiGPTProcessedParametersType with added pre-prompts.
 */
export const generatePrePrompts = (
  params: DemiGPTInputParametersType
): DemiGPTProcessedParametersType => {
  // Initialize pre-prompt arrays in the processed parameters.
  const processedParams: DemiGPTProcessedParametersType = {
    ...params,
    pre_prompts: [],
  };

  // Array of functions to add different pre-prompts.
  const adders = [
    addSystemPrePromptsGlobal,
    addSystemPrePromptsGenerateMinTokens,
    addSystemPrePromptsExplainTechnicalTerms,
    addSystemPrePromptsNonExpertMode,
    addSystemPrePromptsBriefResponse,
    addSystemPrePromptsAddEmoticons,
    addSystemPrePromptsFormatAsMarkdown,
    addSystemPrePromptsFallbackLanguage,
    addSystemPrePromptsVariables,
    addCustomPrePrompts,
  ];

  // Apply each adder sequentially.
  return adders.reduce(
    (processedParams_, addFunction) => addFunction(processedParams_),
    processedParams
  );
};
