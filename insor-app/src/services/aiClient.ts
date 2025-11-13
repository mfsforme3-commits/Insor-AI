import { defaultAiConfig } from "../config/env";

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export interface AiRuntimeConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
}

export type PartialAiConfig = Partial<AiRuntimeConfig>;

export class AiRequestError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = "AiRequestError";
    this.status = status;
    this.details = details;
  }
}

const COMPLETIONS_PATH = "/v1/chat/completions";

function normalizeBaseUrl(baseUrl: string) {
  return baseUrl.replace(/\/$/, "").trim();
}

export function resolveAiConfig(overrides?: PartialAiConfig): AiRuntimeConfig {
  const merged = {
    ...defaultAiConfig,
    ...overrides
  } satisfies AiRuntimeConfig;
  return {
    ...merged,
    baseUrl: normalizeBaseUrl(merged.baseUrl)
  };
}

async function buildAiRequestError(response: Response) {
  let message = `OpenAI request failed (${response.status})`;
  let details: unknown;
  try {
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      details = await response.json();
      const errorMessage =
        (details as { error?: { message?: string } })?.error?.message ??
        (details as { message?: string })?.message;
      if (errorMessage) {
        message = errorMessage;
      }
    } else {
      const text = await response.text();
      if (text) {
        message = text;
      }
    }
  } catch (error) {
    console.warn("Failed to parse AI error response", error);
  }
  return new AiRequestError(message, response.status, details);
}

async function requestCompletion(
  messages: ChatMessage[],
  overrides?: PartialAiConfig,
  extraBody: Record<string, unknown> = {},
  signal?: AbortSignal
) {
  const config = resolveAiConfig(overrides);
  if (!config.apiKey) {
    throw new Error("Missing API key. Add one in Settings to talk to Insor.");
  }

  const response = await fetch(`${config.baseUrl}${COMPLETIONS_PATH}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`
    },
    body: JSON.stringify({
      model: config.model,
      messages,
      temperature: 0.2,
      ...extraBody
    }),
    signal
  });

  if (!response.ok) {
    throw await buildAiRequestError(response);
  }

  return response.json();
}

export async function createChatCompletion(
  messages: ChatMessage[],
  overrides?: PartialAiConfig,
  signal?: AbortSignal
): Promise<string> {
  const payload = await requestCompletion(messages, overrides, { stream: false }, signal);
  const content = payload?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("OpenAI response did not include a message body");
  }
  return String(content).trim();
}

export async function testAiSettings(overrides?: PartialAiConfig) {
  const probeMessages: ChatMessage[] = [
    {
      role: "system",
      content:
        "You are a diagnostics agent for Insor. Respond with a short acknowledgement if you can read this."
    },
    {
      role: "user",
      content: "health check"
    }
  ];

  await requestCompletion(probeMessages, overrides, { stream: false, max_tokens: 16 });
}

export { buildAiRequestError };
