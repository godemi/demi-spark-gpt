import { describe, it, expect } from "vitest";
import { processInputAttachments, validateAttachment } from "../../../attachments/inputProcessor";
import { ChatMessage, Attachment } from "../../../models/chatCompletionTypes";
import { ModelCapabilities } from "../../../providers/types";
import { APIException } from "../../../utils/exceptions";
import { createBase64ImageAttachment, createUrlImageAttachment } from "../../helpers/test-utils";

describe("processInputAttachments", () => {
  const visionCapabilities: ModelCapabilities = {
    chat: true,
    vision: true,
    image_generate: false,
    tool_calls: false,
    json_mode: false,
    reasoning: false,
    max_context_tokens: 128000,
    max_output_tokens: 16384,
    supports_streaming: true,
  };

  const nonVisionCapabilities: ModelCapabilities = {
    ...visionCapabilities,
    vision: false,
  };

  it("should process messages with image attachments", async () => {
    const messages: ChatMessage[] = [
      {
        role: "user",
        content: "What's in this image?",
        attachments: [createBase64ImageAttachment()],
      },
    ];

    const processed = await processInputAttachments(messages, visionCapabilities);

    expect(processed.length).toBe(1);
    expect(Array.isArray(processed[0].content)).toBe(true);
    if (Array.isArray(processed[0].content)) {
      expect(processed[0].content.some((part: any) => part.type === "image_url")).toBe(true);
    }
  });

  it("should reject attachments for non-vision models", async () => {
    const messages: ChatMessage[] = [
      {
        role: "user",
        content: "Test",
        attachments: [createBase64ImageAttachment()],
      },
    ];

    await expect(processInputAttachments(messages, nonVisionCapabilities)).rejects.toThrow(
      APIException
    );
  });

  it("should handle messages without attachments", async () => {
    const messages: ChatMessage[] = [
      {
        role: "user",
        content: "Hello",
      },
    ];

    const processed = await processInputAttachments(messages, visionCapabilities);

    expect(processed).toEqual(messages);
  });

  it("should process multiple attachments", async () => {
    const messages: ChatMessage[] = [
      {
        role: "user",
        content: "Compare these images",
        attachments: [createBase64ImageAttachment(), createUrlImageAttachment()],
      },
    ];

    const processed = await processInputAttachments(messages, visionCapabilities);

    expect(processed.length).toBe(1);
    if (Array.isArray(processed[0].content)) {
      const imageParts = processed[0].content.filter((part: any) => part.type === "image_url");
      expect(imageParts.length).toBe(2);
    }
  });

  it("should preserve text content with attachments", async () => {
    const messages: ChatMessage[] = [
      {
        role: "user",
        content: "What's in this image?",
        attachments: [createBase64ImageAttachment()],
      },
    ];

    const processed = await processInputAttachments(messages, visionCapabilities);

    if (Array.isArray(processed[0].content)) {
      const textPart = processed[0].content.find((part: any) => part.type === "text");
      expect(textPart).toBeDefined();
      expect(textPart.text).toBe("What's in this image?");
    }
  });

  it("should handle URL attachments", async () => {
    const messages: ChatMessage[] = [
      {
        role: "user",
        content: "Test",
        attachments: [createUrlImageAttachment()],
      },
    ];

    const processed = await processInputAttachments(messages, visionCapabilities);

    expect(processed.length).toBe(1);
    if (Array.isArray(processed[0].content)) {
      const imagePart = processed[0].content.find((part: any) => part.type === "image_url");
      expect(imagePart).toBeDefined();
      expect(imagePart.image_url.url).toContain("https://");
    }
  });

  it("should remove attachments field from processed messages", async () => {
    const messages: ChatMessage[] = [
      {
        role: "user",
        content: "Test",
        attachments: [createBase64ImageAttachment()],
      },
    ];

    const processed = await processInputAttachments(messages, visionCapabilities);

    expect(processed[0]).not.toHaveProperty("attachments");
  });
});

describe("validateAttachment", () => {
  it("should validate valid image attachment", () => {
    const attachment: Attachment = {
      type: "image",
      mime_type: "image/png",
      data: "base64data",
    };

    expect(() => validateAttachment(attachment)).not.toThrow();
  });

  it("should reject invalid MIME type", () => {
    const attachment: Attachment = {
      type: "image",
      mime_type: "application/json",
      data: "base64data",
    };

    expect(() => validateAttachment(attachment)).toThrow(APIException);
  });

  it("should validate allowed image MIME types", () => {
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];

    for (const mimeType of allowedTypes) {
      const attachment: Attachment = {
        type: "image",
        mime_type: mimeType,
        data: "base64data",
      };

      expect(() => validateAttachment(attachment)).not.toThrow();
    }
  });

  it("should validate size when provided", () => {
    const attachment: Attachment = {
      type: "image",
      mime_type: "image/png",
      data: "base64data",
      size_bytes: 1024,
    };

    expect(() => validateAttachment(attachment)).not.toThrow();
  });

  it("should reject oversized attachment", () => {
    const attachment: Attachment = {
      type: "image",
      mime_type: "image/png",
      data: "base64data",
      size_bytes: 25 * 1024 * 1024, // 25MB, exceeds 20MB limit
    };

    expect(() => validateAttachment(attachment)).toThrow(APIException);
  });

  it("should validate base64 data size", () => {
    // Create a large base64 string (simulating large image)
    const largeBase64 = "A".repeat(25 * 1024 * 1024); // 25MB

    const attachment: Attachment = {
      type: "image",
      mime_type: "image/png",
      data: largeBase64,
    };

    expect(() => validateAttachment(attachment)).toThrow(APIException);
  });
});
