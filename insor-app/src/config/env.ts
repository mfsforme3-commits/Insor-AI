const rawBaseUrl = import.meta.env.VITE_OPENAI_BASE_URL ?? "https://api.openai.com";
const apiKey = import.meta.env.VITE_OPENAI_API_KEY ?? "";
const model = import.meta.env.VITE_OPENAI_MODEL ?? "gpt-4o-mini";

export const defaultAiConfig = {
  baseUrl: rawBaseUrl.replace(/\/$/, ""),
  apiKey,
  model
};

let currentConfig: AIConfig = { ...defaultConfig };

export function getAIConfig(): AIConfig {
  return { ...currentConfig };
}

export function updateAIConfig(patch: Partial<AIConfig>): AIConfig {
  currentConfig = {
    ...currentConfig,
    ...patch
  };

  currentConfig.baseUrl = currentConfig.baseUrl.replace(/\/$/, "");

  return getAIConfig();
}

export function resetAIConfig(): AIConfig {
  currentConfig = { ...defaultConfig };
  return getAIConfig();
}

export const DEFAULT_AI_CONFIG = Object.freeze({ ...defaultConfig });
