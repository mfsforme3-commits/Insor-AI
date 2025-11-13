import type { ChatMessage, PartialAiConfig } from "./aiClient";
import { buildAiRequestError, resolveAiConfig } from "./aiClient";

export type StreamChunkHandler = (chunk: string) => void;

export interface StreamOptions {
  signal?: AbortSignal;
}

export async function streamChatCompletion(
  messages: ChatMessage[],
  onChunk: StreamChunkHandler,
  overrides?: PartialAiConfig,
  options: StreamOptions = {}
) {
  const config = resolveAiConfig(overrides);
  if (!config.apiKey) {
    throw new Error("Missing API key. Add one in Settings to talk to Insor.");
  }

  const response = await fetch(`${config.baseUrl}/v1/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`
    },
    body: JSON.stringify({
      model: config.model,
      messages,
      temperature: 0.2,
      stream: true
    }),
    signal: options.signal
  });

  if (!response.ok) {
    throw await buildAiRequestError(response);
  }

  if (!response.body) {
    throw new Error("No response body for streamed completion");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    buffer += decoder.decode(value, { stream: true });
    const segments = buffer.split(/\n/);
    buffer = segments.pop() ?? "";

    for (const segment of segments) {
      const trimmed = segment.trim();
      if (!trimmed || !trimmed.startsWith("data:")) {
        continue;
      }
      const payload = trimmed.slice(5).trim();
      if (!payload) {
        continue;
      }
      if (payload === "[DONE]") {
        return;
      }
      try {
        const json = JSON.parse(payload);
        const delta = json?.choices?.[0]?.delta?.content ?? "";
        if (delta) {
          onChunk(delta);
        }
      } catch (error) {
        console.warn("Failed to parse stream chunk", error);
      }
    }
  }

  if (buffer.trim()) {
    const payload = buffer.replace(/^data:\s*/, "").trim();
    if (payload && payload !== "[DONE]") {
      try {
        const json = JSON.parse(payload);
        const delta = json?.choices?.[0]?.delta?.content ?? "";
        if (delta) {
          onChunk(delta);
        }
      } catch (error) {
        console.warn("Failed to parse trailing stream chunk", error);
      }
    }
  }
}
