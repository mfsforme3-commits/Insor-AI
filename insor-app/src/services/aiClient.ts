import { aiConfig } from "../config/env";

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

class AIClient {
  private baseUrl: string;
  private apiKey: string;
  private model: string;

  constructor() {
    this.baseUrl = aiConfig.baseUrl;
    this.apiKey = aiConfig.apiKey;
    this.model = aiConfig.model;
  }

  async createChatCompletion(messages: ChatMessage[]): Promise<string> {
    if (!this.apiKey) {
      throw new Error("Missing VITE_OPENAI_API_KEY. Set it in your .env file.");
    }

    const response = await fetch(`${this.baseUrl}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        temperature: 0.2,
        stream: false
      })
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
}

export const aiClient = new AIClient();
