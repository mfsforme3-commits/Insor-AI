import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { DEFAULT_AI_CONFIG, getAIConfig, type AIConfig, updateAIConfig } from "../config/env";

export type AIConnectionStatus = "idle" | "connecting" | "ready" | "error";

interface AISettingsContextValue {
  config: AIConfig;
  status: AIConnectionStatus;
  lastError: string | null;
  updateConfig: (patch: Partial<AIConfig>) => void;
  markStatus: (status: AIConnectionStatus, error?: string | null) => void;
  resetToDefaults: () => void;
}

const STORAGE_KEY = "insor.ai.settings";

const AISettingsContext = createContext<AISettingsContextValue | null>(null);

function readStoredConfig(): Partial<AIConfig> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    const { baseUrl, apiKey, model } = parsed as Partial<AIConfig>;
    return {
      baseUrl: typeof baseUrl === "string" && baseUrl.trim() ? baseUrl : undefined,
      apiKey: typeof apiKey === "string" ? apiKey : undefined,
      model: typeof model === "string" && model.trim() ? model : undefined
    };
  } catch (error) {
    console.warn("Failed to parse stored AI settings", error);
    return null;
  }
}

export function AISettingsProvider({ children }: { children: ReactNode }) {
  const initialConfig = useMemo(() => {
    const stored = readStoredConfig();
    const base = stored ? { ...getAIConfig(), ...stored } : getAIConfig();
    updateAIConfig(base);
    return base;
  }, []);

  const [config, setConfig] = useState<AIConfig>(initialConfig);
  const [status, setStatus] = useState<AIConnectionStatus>("idle");
  const [lastError, setLastError] = useState<string | null>(null);

  useEffect(() => {
    updateAIConfig(config);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    }
  }, [config]);

  const updateConfig = useCallback((patch: Partial<AIConfig>) => {
    setConfig((prev) => {
      const next: AIConfig = {
        ...prev,
        ...patch
      };
      next.baseUrl = next.baseUrl.trim().replace(/\/$/, "");
      next.model = next.model.trim();
      setStatus("idle");
      setLastError(null);
      return next;
    });
  }, []);

  const markStatus = useCallback((nextStatus: AIConnectionStatus, error: string | null = null) => {
    setStatus(nextStatus);
    setLastError(error ?? null);
  }, []);

  const resetToDefaults = useCallback(() => {
    setConfig(DEFAULT_AI_CONFIG);
    setStatus("idle");
    setLastError(null);
  }, []);

  const value = useMemo<AISettingsContextValue>(() => {
    return {
      config,
      status,
      lastError,
      updateConfig,
      markStatus,
      resetToDefaults
    };
  }, [config, status, lastError, updateConfig, markStatus, resetToDefaults]);

  return <AISettingsContext.Provider value={value}>{children}</AISettingsContext.Provider>;
}

export function useAISettings() {
  const ctx = useContext(AISettingsContext);
  if (!ctx) {
    throw new Error("useAISettings must be used within an AISettingsProvider");
  }
  return ctx;
}
