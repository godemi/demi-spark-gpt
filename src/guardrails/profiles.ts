/**
 * Guardrail Profiles
 *
 * Optional system-level guardrails that can be applied when explicitly enabled.
 * These replace the old baked-in pre-prompts with a configurable system.
 */

export interface GuardrailProfile {
  system_prefix: string;
  content_filter_level: "strict" | "moderate" | "permissive";
  pii_redaction: boolean;
  max_output_length?: number;
  blocked_topics?: string[];
}

/**
 * Predefined guardrail profiles
 */
export const GUARDRAIL_PROFILES: Record<string, GuardrailProfile> = {
  "enterprise-safe": {
    system_prefix: `You are a helpful AI assistant. You must not generate:
- Harmful, illegal, or inappropriate content
- Personal information (PII) unless explicitly requested
- Content that violates privacy or security policies
- Misleading or false information

Always prioritize safety, accuracy, and user privacy.`,
    content_filter_level: "strict",
    pii_redaction: true,
    max_output_length: 10000,
    blocked_topics: ["violence", "illegal-activities", "personal-data"],
  },

  "creative-mode": {
    system_prefix: "",
    content_filter_level: "moderate",
    pii_redaction: false,
  },

  academic: {
    system_prefix: `You are an academic research assistant. You must:
- Cite sources when making factual claims
- Distinguish between facts and opinions
- Avoid generating copyrighted material
- Maintain academic integrity standards`,
    content_filter_level: "moderate",
    pii_redaction: true,
  },

  "customer-support": {
    system_prefix: `You are a customer support assistant. You must:
- Be polite, professional, and empathetic
- Protect customer privacy and data
- Escalate sensitive issues appropriately
- Provide accurate information about products/services`,
    content_filter_level: "strict",
    pii_redaction: true,
  },
};

/**
 * Get guardrail profile by name
 */
export function getGuardrailProfile(name: string): GuardrailProfile | null {
  return GUARDRAIL_PROFILES[name] || null;
}

/**
 * Apply guardrail profile to messages (if enabled)
 */
export function applyGuardrails(messages: any[], profileName: string | undefined): any[] {
  if (!profileName) {
    return messages;
  }

  const profile = getGuardrailProfile(profileName);
  if (!profile || !profile.system_prefix) {
    return messages;
  }

  // Prepend system message with guardrail prefix
  // Only if there isn't already a system message at the start
  const hasSystemMessage = messages.length > 0 && messages[0].role === "system";

  if (hasSystemMessage) {
    // Prepend to existing system message
    return [
      {
        ...messages[0],
        content: `${profile.system_prefix}\n\n${messages[0].content || ""}`,
      },
      ...messages.slice(1),
    ];
  } else {
    // Add new system message
    return [
      {
        role: "system",
        content: profile.system_prefix,
      },
      ...messages,
    ];
  }
}
