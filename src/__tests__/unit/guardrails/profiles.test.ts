import { describe, it, expect } from "vitest";
import {
  getGuardrailProfile,
  applyGuardrails,
  GUARDRAIL_PROFILES,
} from "../../../guardrails/profiles";

describe("getGuardrailProfile", () => {
  it("should return profile for valid name", () => {
    const profile = getGuardrailProfile("enterprise-safe");

    expect(profile).toBeDefined();
    expect(profile?.system_prefix).toBeDefined();
    expect(profile?.content_filter_level).toBe("strict");
    expect(profile?.pii_redaction).toBe(true);
  });

  it("should return null for invalid profile name", () => {
    const profile = getGuardrailProfile("invalid-profile");

    expect(profile).toBeNull();
  });

  it("should return all predefined profiles", () => {
    const profiles = ["enterprise-safe", "creative-mode", "academic", "customer-support"];

    for (const name of profiles) {
      const profile = getGuardrailProfile(name);
      expect(profile).toBeDefined();
    }
  });

  it("should have correct structure for enterprise-safe", () => {
    const profile = getGuardrailProfile("enterprise-safe");

    expect(profile?.content_filter_level).toBe("strict");
    expect(profile?.pii_redaction).toBe(true);
    expect(profile?.max_output_length).toBe(10000);
    expect(profile?.blocked_topics).toBeDefined();
  });

  it("should have correct structure for creative-mode", () => {
    const profile = getGuardrailProfile("creative-mode");

    expect(profile?.content_filter_level).toBe("moderate");
    expect(profile?.pii_redaction).toBe(false);
    expect(profile?.system_prefix).toBe("");
  });

  it("should have correct structure for academic", () => {
    const profile = getGuardrailProfile("academic");

    expect(profile?.content_filter_level).toBe("moderate");
    expect(profile?.pii_redaction).toBe(true);
    expect(profile?.system_prefix).toContain("academic");
  });

  it("should have correct structure for customer-support", () => {
    const profile = getGuardrailProfile("customer-support");

    expect(profile?.content_filter_level).toBe("strict");
    expect(profile?.pii_redaction).toBe(true);
    expect(profile?.system_prefix).toContain("customer support");
  });
});

describe("applyGuardrails", () => {
  it("should return messages unchanged when profile is not provided", () => {
    const messages = [{ role: "user", content: "Hello" }];

    const result = applyGuardrails(messages, undefined);

    expect(result).toEqual(messages);
  });

  it("should return messages unchanged when profile is invalid", () => {
    const messages = [{ role: "user", content: "Hello" }];

    const result = applyGuardrails(messages, "invalid-profile");

    expect(result).toEqual(messages);
  });

  it("should prepend system message when no system message exists", () => {
    const messages = [{ role: "user", content: "Hello" }];

    const result = applyGuardrails(messages, "enterprise-safe");

    expect(result.length).toBe(2);
    expect(result[0].role).toBe("system");
    expect(result[0].content).toContain("helpful AI assistant");
    expect(result[1]).toEqual(messages[0]);
  });

  it("should prepend to existing system message", () => {
    const messages = [
      { role: "system", content: "You are a chatbot" },
      { role: "user", content: "Hello" },
    ];

    const result = applyGuardrails(messages, "enterprise-safe");

    expect(result.length).toBe(2);
    expect(result[0].role).toBe("system");
    expect(result[0].content).toContain("helpful AI assistant");
    expect(result[0].content).toContain("You are a chatbot");
    expect(result[1]).toEqual(messages[1]);
  });

  it("should not modify messages when profile has empty prefix", () => {
    const messages = [{ role: "user", content: "Hello" }];

    const result = applyGuardrails(messages, "creative-mode");

    // Creative mode has empty prefix, so should return unchanged
    expect(result).toEqual(messages);
  });

  it("should handle multiple messages correctly", () => {
    const messages = [
      { role: "user", content: "First message" },
      { role: "assistant", content: "Response" },
      { role: "user", content: "Second message" },
    ];

    const result = applyGuardrails(messages, "enterprise-safe");

    expect(result.length).toBe(4); // System + 3 original
    expect(result[0].role).toBe("system");
    expect(result.slice(1)).toEqual(messages);
  });

  it("should preserve message structure", () => {
    const messages = [
      {
        role: "user",
        content: "Hello",
        attachments: [
          {
            type: "image",
            mime_type: "image/png",
            data: "base64",
          },
        ],
      },
    ];

    const result = applyGuardrails(messages, "enterprise-safe");

    expect(result.length).toBe(2);
    expect(result[1]).toEqual(messages[0]);
  });
});

describe("GUARDRAIL_PROFILES", () => {
  it("should contain all expected profiles", () => {
    const expectedProfiles = ["enterprise-safe", "creative-mode", "academic", "customer-support"];

    for (const name of expectedProfiles) {
      expect(GUARDRAIL_PROFILES).toHaveProperty(name);
    }
  });

  it("should have valid structure for all profiles", () => {
    for (const [name, profile] of Object.entries(GUARDRAIL_PROFILES)) {
      expect(profile).toHaveProperty("system_prefix");
      expect(profile).toHaveProperty("content_filter_level");
      expect(profile).toHaveProperty("pii_redaction");
      expect(["strict", "moderate", "permissive"]).toContain(profile.content_filter_level);
      expect(typeof profile.pii_redaction).toBe("boolean");
    }
  });
});

