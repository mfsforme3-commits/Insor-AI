import { getAIConfig } from "../config/env";

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

class AIClient {
  async createChatCompletion(messages: ChatMessage[], signal?: AbortSignal): Promise<string> {
    const config = getAIConfig();

    if (!config.apiKey) {
      throw new Error("Missing VITE_OPENAI_API_KEY. Set it in your .env file.");
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
        stream: false
      }),
      signal
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`OpenAI request failed: ${response.status} ${errorBody}`);
    }

    const payload = await response.json();
    const content = payload?.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("OpenAI response did not include content");
    }
    return content.trim();
  }

  async verifyCredentials(): Promise<void> {
    const config = getAIConfig();

    if (!config.apiKey) {
      throw new Error("Missing VITE_OPENAI_API_KEY. Set it in your .env file.");
    }

    const response = await fetch(`${config.baseUrl}/v1/models`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${config.apiKey}`
      }
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Failed to verify credentials: ${response.status} ${errorBody}`);
    }
  }
}

export const aiClient = new AIClient();
