const baseUrl = import.meta.env.VITE_OPENAI_BASE_URL ?? "https://api.openai.com";
const apiKey = import.meta.env.VITE_OPENAI_API_KEY ?? "";
const model = import.meta.env.VITE_OPENAI_MODEL ?? "gpt-4o-mini";

export const aiConfig = {
  baseUrl: baseUrl.replace(/\/$/, ""),
  apiKey,
  model
};
