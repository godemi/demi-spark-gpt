import { Attachment } from "../models/chatCompletionTypes";

/**
 * Process output attachments (generated images, files)
 *
 * Handles:
 * - Image generation responses (DALL-E, etc.)
 * - Converting provider responses to HALO attachment format
 * - Base64 vs URL handling
 */
export interface ImageGenerationResponse {
  created: number;
  data: Array<{
    url?: string;
    b64_json?: string;
    revised_prompt?: string;
  }>;
}

/**
 * Convert image generation response to HALO attachments
 */
export function processImageGenerationResponse(response: ImageGenerationResponse): Attachment[] {
  return response.data.map((item, index) => {
    const attachment: Attachment = {
      type: "image",
      mime_type: "image/png", // Default, could be determined from response
      filename: `generated-image-${response.created}-${index}.png`,
    };

    // Prefer URL over base64 for large images
    if (item.url) {
      attachment.url = item.url;
    } else if (item.b64_json) {
      attachment.data = item.b64_json;
      // Calculate size if possible
      try {
        attachment.size_bytes = Buffer.from(item.b64_json, "base64").length;
      } catch {
        // Ignore size calculation errors
      }
    }

    return attachment;
  });
}

/**
 * Convert base64 image to attachment with size calculation
 */
export function createAttachmentFromBase64(
  base64Data: string,
  mimeType: string = "image/png",
  filename?: string
): Attachment {
  let sizeBytes: number | undefined;
  try {
    sizeBytes = Buffer.from(base64Data, "base64").length;
  } catch {
    // Ignore size calculation errors
  }

  return {
    type: "image",
    mime_type: mimeType,
    data: base64Data,
    filename: filename || `image-${Date.now()}.${mimeType.split("/")[1]}`,
    size_bytes: sizeBytes,
  };
}

/**
 * Convert URL to attachment
 */
export function createAttachmentFromUrl(
  url: string,
  mimeType: string = "image/png",
  filename?: string
): Attachment {
  return {
    type: "image",
    mime_type: mimeType,
    url,
    filename: filename || url.split("/").pop() || `image-${Date.now()}.png`,
  };
}
