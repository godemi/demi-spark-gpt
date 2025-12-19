import { SSEChunk } from "../../../models/chatCompletionTypes";

/**
 * Mock streaming chunks for testing
 */

export const createStreamingChunkSequence = (content: string[]): SSEChunk[] => {
  return content.map((chunkContent, index) => ({
    id: "chatcmpl-123",
    object: "chat.completion.chunk",
    created: 1677652288,
    model: "gpt-4o",
    choices: [
      {
        index: 0,
        delta: {
          content: chunkContent,
        },
        finish_reason: index === content.length - 1 ? "stop" : null,
      },
    ],
    usage:
      index === content.length - 1
        ? {
            prompt_tokens: 10,
            completion_tokens: content.join("").length,
            total_tokens: 10 + content.join("").length,
          }
        : undefined,
  }));
};

export const mockStreamingSequence: SSEChunk[] = createStreamingChunkSequence([
  "Hello",
  " ",
  "world",
  "!",
  " How",
  " can",
  " I",
  " help",
  "?",
]);

export const mockStreamingSequenceLong: SSEChunk[] = createStreamingChunkSequence(
  Array.from({ length: 50 }, (_, i) => `chunk${i} `)
);

export const mockStreamingSequenceWithToolCalls: SSEChunk[] = [
  {
    id: "chatcmpl-123",
    object: "chat.completion.chunk",
    created: 1677652288,
    model: "gpt-4o",
    choices: [
      {
        index: 0,
        delta: {
          tool_calls: [
            {
              index: 0,
              id: "call_123",
              type: "function",
              function: {
                name: "get_weather",
                arguments: '{"location":',
              },
            },
          ],
        },
        finish_reason: null,
      },
    ],
  },
  {
    id: "chatcmpl-123",
    object: "chat.completion.chunk",
    created: 1677652288,
    model: "gpt-4o",
    choices: [
      {
        index: 0,
        delta: {
          tool_calls: [
            {
              index: 0,
              id: "call_123",
              type: "function",
              function: {
                name: null,
                arguments: ' "San Francisco"}',
              },
            },
          ],
        },
        finish_reason: null,
      },
    ],
  },
  {
    id: "chatcmpl-123",
    object: "chat.completion.chunk",
    created: 1677652288,
    model: "gpt-4o",
    choices: [
      {
        index: 0,
        delta: {},
        finish_reason: "tool_calls",
      },
    ],
    usage: {
      prompt_tokens: 20,
      completion_tokens: 15,
      total_tokens: 35,
    },
  },
];

export const mockStreamingSequenceWithReasoning: SSEChunk[] = [
  {
    id: "chatcmpl-123",
    object: "chat.completion.chunk",
    created: 1677652288,
    model: "o3-mini",
    choices: [
      {
        index: 0,
        delta: {
          content: "Reasoning",
        },
        finish_reason: null,
      },
    ],
  },
  {
    id: "chatcmpl-123",
    object: "chat.completion.chunk",
    created: 1677652288,
    model: "o3-mini",
    choices: [
      {
        index: 0,
        delta: {},
        finish_reason: "stop",
      },
    ],
    usage: {
      prompt_tokens: 10,
      completion_tokens: 20,
      total_tokens: 30,
      reasoning_tokens: 5000,
    },
  },
];
