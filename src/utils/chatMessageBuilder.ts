import { ChatMessage, HistoryStrategy, SparkGPTProcessedParametersType } from "../models/types";

const estimateTokens = (text: string): number => Math.ceil(text.length / 4);

const sortHistory = (history: ChatMessage[]): ChatMessage[] => {
  return [...history].sort((a, b) => {
    if (a.created_at && b.created_at) {
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    }
    return 0;
  });
};

const applyHistoryStrategy = (
  history: ChatMessage[],
  strategy: HistoryStrategy,
  historyWindow: number,
  maxHistoryTokens?: number
): ChatMessage[] => {
  if (history.length === 0) return [];

  const sorted = sortHistory(history);

  if (strategy === "all") {
    return sorted;
  }

  if (strategy === "token_budget") {
    if (!maxHistoryTokens) return sorted;
    let total = 0;
    const selected: ChatMessage[] = [];
    for (const message of [...sorted].reverse()) {
      const messageTokens = estimateTokens(message.content);
      if (total + messageTokens > maxHistoryTokens) break;
      total += messageTokens;
      selected.push(message);
    }
    return selected.reverse();
  }

  // Default strategy: last_n
  if (historyWindow <= 0) return [];
  return sorted.slice(-historyWindow);
};

export const buildChatMessages = (params: SparkGPTProcessedParametersType): ChatMessage[] => {
  const messages: ChatMessage[] = [];

  const systemPrompts = params.system_prompt
    ? Array.isArray(params.system_prompt)
      ? params.system_prompt
      : [params.system_prompt]
    : [];

  for (const prompt of systemPrompts) {
    messages.push({ role: "system", content: prompt });
  }

  if (Array.isArray(params.pre_prompts)) {
    for (const prePrompt of params.pre_prompts) {
      messages.push({
        role: prePrompt.role ?? "system",
        content: prePrompt.text,
      });
    }
  }

  const historyStrategy: HistoryStrategy = params.history_strategy ?? "last_n";
  const historyWindow: number = params.history_window ?? 3;
  const history = applyHistoryStrategy(
    params.history ?? [],
    historyStrategy,
    historyWindow,
    params.max_history_tokens
  );
  messages.push(...history);

  const prompts = Array.isArray(params.prompt) ? params.prompt : [params.prompt];
  for (const prompt of prompts) {
    messages.push({ role: "user", content: prompt });
  }

  return messages;
};
