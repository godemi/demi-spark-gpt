import { ChatMessage, Attachment } from "../models/chatCompletionTypes";
import { ModelCapabilities } from "../providers/types";
import { APIException } from "../utils/exceptions";

/**
 * Process input attachments and convert to provider-compatible format
 *
 * Handles:
 * - Image attachments (base64 or URL)
 * - File attachments (future)
 * - Validation against model capabilities
 */
export async function processInputAttachments(
  messages: ChatMessage[],
  capabilities: ModelCapabilities
): Promise<ChatMessage[]> {
  return Promise.all(
    messages.map(async msg => {
      if (!msg.attachments || msg.attachments.length === 0) {
        return msg;
      }

      // Validate model supports vision/attachments
      if (!capabilities.vision && msg.attachments.some(a => a.type === "image")) {
        throw new APIException(
          `Model does not support vision/attachments`,
          400,
          "CAPABILITY_NOT_SUPPORTED"
        );
      }

      // Convert attachments to OpenAI content array format
      const contentParts: any[] = [];

      // Add text content if present
      if (typeof msg.content === "string" && msg.content.trim()) {
        contentParts.push({ type: "text", text: msg.content });
      } else if (Array.isArray(msg.content)) {
        // Already in content array format, merge with attachments
        contentParts.push(...msg.content);
      }

      // Process attachments
      for (const attachment of msg.attachments) {
        const processed = await processAttachment(attachment);
        if (processed) {
          contentParts.push(processed);
        }
      }

      // Return message with content array (removing attachments field)
      const { attachments, ...rest } = msg;
      return {
        ...rest,
        content: contentParts.length > 0 ? contentParts : msg.content,
      };
    })
  );
}

/**
 * Process a single attachment
 */
async function processAttachment(attachment: Attachment): Promise<any | null> {
  if (attachment.type === "image") {
    // Validate image attachment
    if (!attachment.url && !attachment.data) {
      throw new APIException(
        "Image attachment must have either 'url' or 'data' field",
        400,
        "INVALID_ATTACHMENT"
      );
    }

    // Validate MIME type
    if (!attachment.mime_type || !attachment.mime_type.startsWith("image/")) {
      throw new APIException(
        `Invalid image MIME type: ${attachment.mime_type}`,
        400,
        "INVALID_ATTACHMENT"
      );
    }

    // Build image URL (data URI or external URL)
    const imageUrl =
      attachment.url ||
      (attachment.data ? `data:${attachment.mime_type};base64,${attachment.data}` : null);

    if (!imageUrl) {
      return null;
    }

    return {
      type: "image_url",
      image_url: {
        url: imageUrl,
        detail: "auto", // Can be "low", "high", or "auto"
      },
    };
  }

  // File attachments (future support)
  if (attachment.type === "file") {
    throw new APIException(
      "File attachments are not yet supported",
      400,
      "UNSUPPORTED_ATTACHMENT_TYPE"
    );
  }

  return null;
}

/**
 * Validate attachment size and format
 */
export function validateAttachment(attachment: Attachment): void {
  // Validate MIME type
  if (attachment.type === "image") {
    const allowedImageTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
    if (!allowedImageTypes.includes(attachment.mime_type.toLowerCase())) {
      throw new APIException(
        `Unsupported image MIME type: ${attachment.mime_type}`,
        400,
        "INVALID_ATTACHMENT"
      );
    }
  }

  // Validate size (if provided)
  if (attachment.size_bytes) {
    const maxSize = 20 * 1024 * 1024; // 20MB
    if (attachment.size_bytes > maxSize) {
      throw new APIException(
        `Attachment size exceeds maximum of ${maxSize} bytes`,
        400,
        "ATTACHMENT_TOO_LARGE"
      );
    }
  }

  // Validate base64 data size
  if (attachment.data) {
    const base64Size = Buffer.from(attachment.data, "base64").length;
    const maxSize = 20 * 1024 * 1024; // 20MB
    if (base64Size > maxSize) {
      throw new APIException(
        `Base64 attachment data exceeds maximum of ${maxSize} bytes`,
        400,
        "ATTACHMENT_TOO_LARGE"
      );
    }
  }
}
