/**
 * Test fixtures for image generation requests
 */

export const validImageGenerateRequest = {
  prompt: "A beautiful sunset over the ocean",
  model: "dall-e-3",
  n: 1,
  size: "1024x1024",
  quality: "standard",
  response_format: "url",
  provider: "openai",
};

export const imageGenerateRequestWithBase64 = {
  ...validImageGenerateRequest,
  response_format: "b64_json",
};

export const imageGenerateRequestMultipleImages = {
  ...validImageGenerateRequest,
  n: 4,
  model: "dall-e-2",
};

export const imageGenerateRequestHD = {
  ...validImageGenerateRequest,
  quality: "hd",
  size: "1792x1024",
};

export const invalidImageGenerateRequestMissingPrompt = {
  model: "dall-e-3",
  n: 1,
};

export const invalidImageGenerateRequestInvalidSize = {
  ...validImageGenerateRequest,
  size: "999x999",
};

export const invalidImageGenerateRequestInvalidN = {
  ...validImageGenerateRequest,
  n: 11, // Exceeds maximum
};
