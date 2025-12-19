import { describe, it, expect } from "vitest";
import {
  processImageGenerationResponse,
  createAttachmentFromBase64,
  createAttachmentFromUrl,
} from "../../../attachments/outputProcessor";
import { Attachment } from "../../../models/chatCompletionTypes";

describe("processImageGenerationResponse", () => {
  it("should process image generation response with URLs", () => {
    const response = {
      created: 1677652288,
      data: [
        {
          url: "https://example.com/image1.png",
          revised_prompt: "A beautiful landscape",
        },
        {
          url: "https://example.com/image2.png",
        },
      ],
    };

    const attachments = processImageGenerationResponse(response);

    expect(attachments.length).toBe(2);
    expect(attachments[0].type).toBe("image");
    expect(attachments[0].url).toBe("https://example.com/image1.png");
    expect(attachments[0].mime_type).toBe("image/png");
    expect(attachments[1].url).toBe("https://example.com/image2.png");
  });

  it("should process image generation response with base64", () => {
    const response = {
      created: 1677652288,
      data: [
        {
          b64_json:
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
        },
      ],
    };

    const attachments = processImageGenerationResponse(response);

    expect(attachments.length).toBe(1);
    expect(attachments[0].type).toBe("image");
    expect(attachments[0].data).toBeDefined();
    expect(attachments[0].mime_type).toBe("image/png");
  });

  it("should prefer URL over base64", () => {
    const response = {
      created: 1677652288,
      data: [
        {
          url: "https://example.com/image.png",
          b64_json: "base64data",
        },
      ],
    };

    const attachments = processImageGenerationResponse(response);

    expect(attachments[0].url).toBe("https://example.com/image.png");
    expect(attachments[0].data).toBeUndefined();
  });

  it("should generate filenames", () => {
    const response = {
      created: 1677652288,
      data: [
        {
          url: "https://example.com/image.png",
        },
      ],
    };

    const attachments = processImageGenerationResponse(response);

    expect(attachments[0].filename).toBeDefined();
    expect(attachments[0].filename).toContain("generated-image");
  });

  it("should handle empty data array", () => {
    const response = {
      created: 1677652288,
      data: [],
    };

    const attachments = processImageGenerationResponse(response);

    expect(attachments.length).toBe(0);
  });
});

describe("createAttachmentFromBase64", () => {
  it("should create attachment from base64 data", () => {
    const base64 =
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
    const attachment = createAttachmentFromBase64(base64, "image/png");

    expect(attachment.type).toBe("image");
    expect(attachment.mime_type).toBe("image/png");
    expect(attachment.data).toBe(base64);
    expect(attachment.size_bytes).toBeDefined();
  });

  it("should calculate size from base64", () => {
    const base64 =
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
    const attachment = createAttachmentFromBase64(base64);

    expect(attachment.size_bytes).toBeGreaterThan(0);
  });

  it("should generate filename if not provided", () => {
    const attachment = createAttachmentFromBase64("base64data", "image/png");

    expect(attachment.filename).toBeDefined();
    expect(attachment.filename).toContain(".png");
  });

  it("should use provided filename", () => {
    const attachment = createAttachmentFromBase64("base64data", "image/png", "custom.png");

    expect(attachment.filename).toBe("custom.png");
  });
});

describe("createAttachmentFromUrl", () => {
  it("should create attachment from URL", () => {
    const url = "https://example.com/image.png";
    const attachment = createAttachmentFromUrl(url);

    expect(attachment.type).toBe("image");
    expect(attachment.url).toBe(url);
    expect(attachment.mime_type).toBe("image/png");
  });

  it("should use custom MIME type", () => {
    const attachment = createAttachmentFromUrl("https://example.com/image.jpg", "image/jpeg");

    expect(attachment.mime_type).toBe("image/jpeg");
  });

  it("should extract filename from URL", () => {
    const attachment = createAttachmentFromUrl("https://example.com/path/to/image.png");

    expect(attachment.filename).toBe("image.png");
  });

  it("should generate filename if URL has no path", () => {
    const attachment = createAttachmentFromUrl("https://example.com");

    expect(attachment.filename).toBeDefined();
    expect(attachment.filename).toContain("image");
  });
});
