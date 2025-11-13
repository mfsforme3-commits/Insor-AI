export interface AIConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
}

const defaultBaseUrl = import.meta.env.VITE_OPENAI_BASE_URL ?? "https://api.openai.com";
const defaultApiKey = import.meta.env.VITE_OPENAI_API_KEY ?? "";
const defaultModel = import.meta.env.VITE_OPENAI_MODEL ?? "gpt-4o-mini";

const defaultConfig: AIConfig = {
  baseUrl: defaultBaseUrl.replace(/\/$/, ""),
  apiKey: defaultApiKey,
  model: defaultModel
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
