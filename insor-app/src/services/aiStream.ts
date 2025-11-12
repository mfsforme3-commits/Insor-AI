import { aiConfig } from "../config/env";
import type { ChatMessage } from "./aiClient";

export type StreamChunkHandler = (chunk: string) => void;

export async function streamChatCompletion(
  messages: ChatMessage[],
  onChunk: StreamChunkHandler,
  signal?: AbortSignal
) {
  if (!aiConfig.apiKey) {
    throw new Error("Missing VITE_OPENAI_API_KEY. Set it in your .env file.");
  }

  const response = await fetch(`${aiConfig.baseUrl}/v1/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${aiConfig.apiKey}`
    },
    body: JSON.stringify({
      model: aiConfig.model,
      messages,
      temperature: 0.2,
      stream: true
    }),
    signal
  });

  if (!response.body) {
    throw new Error("No response body for streamed completion");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8");

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const text = decoder.decode(value, { stream: true });
    const lines = text.split(/\n/).filter(Boolean);
    for (const line of lines) {
      const cleaned = line.replace(/^data: /, "").trim();
      if (cleaned === "[DONE]") {
        return;
      }
      try {
        const payload = JSON.parse(cleaned);
        const delta = payload?.choices?.[0]?.delta?.content ?? "";
        if (delta) {
          onChunk(delta);
        }
      } catch (error) {
        console.warn("Failed to parse stream chunk", error);
      }
    }
  }
}
