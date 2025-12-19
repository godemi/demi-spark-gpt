import { describe, it, expect, beforeEach } from "vitest";
import { SSEWriter } from "../../../streaming/sseWriter";
import { SSEChunk } from "../../../models/chatCompletionTypes";
import {
  mockStreamingSequence,
  mockStreamingSequenceWithToolCalls,
  mockStreamingSequenceWithReasoning,
} from "../../fixtures/responses/streamingChunks";
import { collectAsyncIterable } from "../../helpers/test-utils";

describe("SSEWriter", () => {
  let writer: SSEWriter;

  beforeEach(() => {
    writer = new SSEWriter();
  });

  describe("stream", () => {
    it("should emit chunks in SSE format", async () => {
      const chunks = mockStreamingSequence;
      const requestId = "req-123";

      const output: string[] = [];
      for await (const chunk of writer.stream(
        (async function* () {
          for (const c of chunks) yield c;
        })(),
        requestId
      )) {
        output.push(chunk);
      }

      expect(output.length).toBeGreaterThan(0);
      expect(output[0]).toContain("data: ");
      expect(output[output.length - 1]).toContain("[DONE]");
    });

    it("should accumulate content from chunks", async () => {
      const chunks: SSEChunk[] = [
        {
          id: "test",
          object: "chat.completion.chunk",
          created: Date.now(),
          model: "gpt-4o",
          choices: [{ index: 0, delta: { content: "Hello" }, finish_reason: null }],
        },
        {
          id: "test",
          object: "chat.completion.chunk",
          created: Date.now(),
          model: "gpt-4o",
          choices: [{ index: 0, delta: { content: " " }, finish_reason: null }],
        },
        {
          id: "test",
          object: "chat.completion.chunk",
          created: Date.now(),
          model: "gpt-4o",
          choices: [{ index: 0, delta: { content: "world" }, finish_reason: "stop" }],
        },
      ];

      const output: string[] = [];
      for await (const chunk of writer.stream(
        (async function* () {
          for (const c of chunks) yield c;
        })(),
        "req-123"
      )) {
        output.push(chunk);
      }

      const finalChunk = output[output.length - 2]; // Second to last (before [DONE])
      expect(finalChunk).toContain("Hello world");
    });

    it("should include final chunk with aggregated content", async () => {
      const chunks = mockStreamingSequence;

      const output: string[] = [];
      for await (const chunk of writer.stream(
        (async function* () {
          for (const c of chunks) yield c;
        })(),
        "req-123"
      )) {
        output.push(chunk);
      }

      // Should have final chunk before [DONE]
      const finalChunkStr = output[output.length - 2];
      expect(finalChunkStr).toContain("data: ");
      const finalChunk = JSON.parse(finalChunkStr.replace("data: ", "").trim());
      expect(finalChunk.choices[0].delta.content).toBeDefined();
    });

    it("should include HALO metadata in final chunk", async () => {
      const chunks = mockStreamingSequence;

      const output: string[] = [];
      for await (const chunk of writer.stream(
        (async function* () {
          for (const c of chunks) yield c;
        })(),
        "req-123"
      )) {
        output.push(chunk);
      }

      const finalChunkStr = output[output.length - 2];
      const finalChunk = JSON.parse(finalChunkStr.replace("data: ", "").trim());
      expect(finalChunk.halo_metadata).toBeDefined();
      expect(finalChunk.halo_metadata.chunks_count).toBeGreaterThan(0);
      expect(finalChunk.halo_metadata.latency_ms).toBeGreaterThanOrEqual(0);
    });

    it("should calculate usage statistics", async () => {
      const chunks: SSEChunk[] = [
        {
          id: "test",
          object: "chat.completion.chunk",
          created: Date.now(),
          model: "gpt-4o",
          choices: [{ index: 0, delta: { content: "Hello" }, finish_reason: null }],
          usage: {
            prompt_tokens: 10,
            completion_tokens: 5,
            total_tokens: 15,
          },
        },
        {
          id: "test",
          object: "chat.completion.chunk",
          created: Date.now(),
          model: "gpt-4o",
          choices: [{ index: 0, delta: {}, finish_reason: "stop" }],
          usage: {
            prompt_tokens: 10,
            completion_tokens: 10,
            total_tokens: 20,
          },
        },
      ];

      const output: string[] = [];
      for await (const chunk of writer.stream(
        (async function* () {
          for (const c of chunks) yield c;
        })(),
        "req-123"
      )) {
        output.push(chunk);
      }

      const finalChunkStr = output[output.length - 2];
      const finalChunk = JSON.parse(finalChunkStr.replace("data: ", "").trim());
      expect(finalChunk.usage).toBeDefined();
      expect(finalChunk.usage.prompt_tokens).toBe(10);
      expect(finalChunk.usage.completion_tokens).toBe(10);
      expect(finalChunk.usage.total_tokens).toBe(20);
    });

    it("should handle reasoning tokens", async () => {
      const chunks = mockStreamingSequenceWithReasoning;

      const output: string[] = [];
      for await (const chunk of writer.stream(
        (async function* () {
          for (const c of chunks) yield c;
        })(),
        "req-123"
      )) {
        output.push(chunk);
      }

      const finalChunkStr = output[output.length - 2];
      const finalChunk = JSON.parse(finalChunkStr.replace("data: ", "").trim());
      if (finalChunk.usage?.reasoning_tokens) {
        expect(finalChunk.usage.reasoning_tokens).toBeGreaterThan(0);
      }
    });

    it("should emit [DONE] marker at the end", async () => {
      const chunks = mockStreamingSequence;

      const output: string[] = [];
      for await (const chunk of writer.stream(
        (async function* () {
          for (const c of chunks) yield c;
        })(),
        "req-123"
      )) {
        output.push(chunk);
      }

      expect(output[output.length - 1]).toBe("data: [DONE]\n\n");
    });

    it("should handle empty chunks", async () => {
      const chunks: SSEChunk[] = [];

      const output: string[] = [];
      for await (const chunk of writer.stream(
        (async function* () {
          for (const c of chunks) yield c;
        })(),
        "req-123"
      )) {
        output.push(chunk);
      }

      // Should still emit final chunk and [DONE]
      expect(output.length).toBeGreaterThan(0);
      expect(output[output.length - 1]).toContain("[DONE]");
    });

    it("should handle chunks with tool calls", async () => {
      const chunks = mockStreamingSequenceWithToolCalls;

      const output: string[] = [];
      for await (const chunk of writer.stream(
        (async function* () {
          for (const c of chunks) yield c;
        })(),
        "req-123"
      )) {
        output.push(chunk);
      }

      expect(output.length).toBeGreaterThan(0);
      // Should process tool call chunks
      const firstChunk = output[0];
      expect(firstChunk).toContain("data: ");
    });
  });

  describe("getAggregatedContent", () => {
    it("should return accumulated content", async () => {
      const chunks: SSEChunk[] = [
        {
          id: "test",
          object: "chat.completion.chunk",
          created: Date.now(),
          model: "gpt-4o",
          choices: [{ index: 0, delta: { content: "Hello" }, finish_reason: null }],
        },
        {
          id: "test",
          object: "chat.completion.chunk",
          created: Date.now(),
          model: "gpt-4o",
          choices: [{ index: 0, delta: { content: " world" }, finish_reason: "stop" }],
        },
      ];

      for await (const _ of writer.stream(
        (async function* () {
          for (const c of chunks) yield c;
        })(),
        "req-123"
      )) {
        // Consume stream
      }

      const content = writer.getAggregatedContent();
      expect(content).toBe("Hello world");
    });
  });

  describe("getChunks", () => {
    it("should return all processed chunks", async () => {
      const chunks = mockStreamingSequence;

      for await (const _ of writer.stream(
        (async function* () {
          for (const c of chunks) yield c;
        })(),
        "req-123"
      )) {
        // Consume stream
      }

      const retrievedChunks = writer.getChunks();
      expect(retrievedChunks.length).toBe(chunks.length);
    });
  });
});
