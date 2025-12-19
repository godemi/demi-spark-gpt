import { SSEChunk, FinalChunk, Usage } from "../models/chatCompletionTypes";
import { v4 as uuidv4 } from "uuid";

/**
 * SSE Writer - Handles Server-Sent Events streaming with final aggregate chunk
 *
 * Implements OpenAI-compatible SSE format with:
 * - Real-time chunk streaming
 * - Final aggregate chunk with complete response
 * - Usage statistics
 * - HALO metadata extensions
 */
export class SSEWriter {
  private chunks: SSEChunk[] = [];
  private aggregatedContent = "";
  private startTime: number;
  private totalPromptTokens = 0;
  private totalCompletionTokens = 0;
  private totalReasoningTokens = 0;
  private finishReason: "length" | "stop" | "tool_calls" | "content_filter" | null = null;

  constructor() {
    this.startTime = Date.now();
  }

  /**
   * Stream SSE chunks with final aggregate chunk
   */
  async *stream(source: AsyncIterable<SSEChunk>, requestId: string): AsyncIterable<string> {
    for await (const chunk of source) {
      this.chunks.push(chunk);

      // Accumulate content
      const deltaContent = chunk.choices?.[0]?.delta?.content;
      if (typeof deltaContent === "string") {
        this.aggregatedContent += deltaContent;
      }

      // Track finish reason
      if (chunk.choices?.[0]?.finish_reason) {
        this.finishReason = chunk.choices[0].finish_reason as
          | "length"
          | "stop"
          | "tool_calls"
          | "content_filter";
      }

      // Accumulate usage stats
      if (chunk.usage) {
        this.totalPromptTokens = Math.max(this.totalPromptTokens, chunk.usage.prompt_tokens || 0);
        this.totalCompletionTokens = Math.max(
          this.totalCompletionTokens,
          chunk.usage.completion_tokens || 0
        );
        if (chunk.usage.reasoning_tokens) {
          this.totalReasoningTokens = Math.max(
            this.totalReasoningTokens,
            chunk.usage.reasoning_tokens
          );
        }
      }

      // Emit chunk immediately
      yield `data: ${JSON.stringify(chunk)}\n\n`;
    }

    // Emit final aggregate chunk with full response
    const finalChunk = this.buildFinalChunk(requestId);
    yield `data: ${JSON.stringify(finalChunk)}\n\n`;

    // Emit done marker
    yield "data: [DONE]\n\n";
  }

  /**
   * Build final aggregate chunk with complete response
   */
  private buildFinalChunk(requestId: string): FinalChunk {
    const latencyMs = Date.now() - this.startTime;

    // Use the last chunk as base, or create new one
    const lastChunk = this.chunks[this.chunks.length - 1];

    return {
      id: requestId || lastChunk?.id || uuidv4(),
      object: "chat.completion.chunk",
      created: lastChunk?.created || Math.floor(Date.now() / 1000),
      model: lastChunk?.model || "",
      choices: [
        {
          index: 0,
          delta: {
            content: this.aggregatedContent,
          },
          finish_reason: this.finishReason || "stop",
        },
      ],
      usage: this.calculateUsage(),
      halo_metadata: {
        chunks_count: this.chunks.length,
        latency_ms: latencyMs,
      },
    };
  }

  /**
   * Calculate final usage statistics
   */
  private calculateUsage(): Usage {
    // Try to get usage from last chunk, otherwise use accumulated values
    const lastChunk = this.chunks[this.chunks.length - 1];
    if (lastChunk?.usage) {
      return {
        prompt_tokens: lastChunk.usage.prompt_tokens || this.totalPromptTokens,
        completion_tokens: lastChunk.usage.completion_tokens || this.totalCompletionTokens,
        total_tokens:
          lastChunk.usage.total_tokens || this.totalPromptTokens + this.totalCompletionTokens,
        reasoning_tokens:
          lastChunk.usage.reasoning_tokens ||
          (this.totalReasoningTokens > 0 ? this.totalReasoningTokens : undefined),
      };
    }

    return {
      prompt_tokens: this.totalPromptTokens,
      completion_tokens: this.totalCompletionTokens,
      total_tokens: this.totalPromptTokens + this.totalCompletionTokens,
      reasoning_tokens: this.totalReasoningTokens > 0 ? this.totalReasoningTokens : undefined,
    };
  }

  /**
   * Get aggregated content (for non-streaming fallback)
   */
  getAggregatedContent(): string {
    return this.aggregatedContent;
  }

  /**
   * Get all chunks (for debugging/analytics)
   */
  getChunks(): SSEChunk[] {
    return [...this.chunks];
  }
}
