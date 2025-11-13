import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { defaultAiConfig } from "../config/env";
import { resolveAiConfig, testAiSettings, type AiRuntimeConfig } from "../services/aiClient";

export interface AiSettings extends AiRuntimeConfig {
  enableStreaming: boolean;
}

export type AiConnectionStatus = "idle" | "testing" | "connected" | "error";

interface AiSettingsContextValue {
  settings: AiSettings;
  defaults: AiSettings;
  status: AiConnectionStatus;
  lastError: string | null;
  updateSettings(patch: Partial<AiSettings>): void;
  resetSettings(): void;
  testConnection(overrides?: Partial<AiSettings>): Promise<void>;
  markConnectionHealthy(): void;
}

const STORAGE_KEY = "insor.ai.settings";

const defaultSettings: AiSettings = {
  ...defaultAiConfig,
  enableStreaming: true
};

const AiSettingsContext = createContext<AiSettingsContextValue | null>(null);

function sanitizeSettings(settings: Partial<AiSettings> | null | undefined): AiSettings {
  const runtime = resolveAiConfig(settings ?? undefined);
  return {
    ...runtime,
    enableStreaming: settings?.enableStreaming ?? defaultSettings.enableStreaming
  };
}

function loadStoredSettings(): AiSettings {
  if (typeof window === "undefined") {
    return defaultSettings;
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return defaultSettings;
    }
    const parsed = JSON.parse(raw) as Partial<AiSettings>;
    return sanitizeSettings(parsed);
  } catch (error) {
    console.warn("Failed to load stored AI settings", error);
    return defaultSettings;
  }
}

function persistSettings(settings: AiSettings) {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (error) {
    console.warn("Failed to persist AI settings", error);
  }
}

export function AiSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AiSettings>(() => loadStoredSettings());
  const [status, setStatus] = useState<AiConnectionStatus>("idle");
  const [lastError, setLastError] = useState<string | null>(null);

  const updateSettings = useCallback((patch: Partial<AiSettings>) => {
    setSettings((prev) => {
      const next = sanitizeSettings({ ...prev, ...patch });
      persistSettings(next);
      return next;
    });
  }, []);

  const resetSettings = useCallback(() => {
    setSettings(defaultSettings);
    setStatus("idle");
    setLastError(null);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const testConnection = useCallback(
    async (overrides?: Partial<AiSettings>) => {
      const target = sanitizeSettings({ ...settings, ...overrides });
      setStatus("testing");
      setLastError(null);
      try {
        await testAiSettings(target);
        setStatus("connected");
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        setStatus("error");
        setLastError(message);
        throw error;
      }
    },
    [settings]
  );

  const markConnectionHealthy = useCallback(() => {
    setStatus("connected");
    setLastError(null);
  }, []);

  const value = useMemo<AiSettingsContextValue>(
    () => ({
      settings,
      defaults: defaultSettings,
      status,
      lastError,
      updateSettings,
      resetSettings,
      testConnection,
      markConnectionHealthy
    }),
    [lastError, markConnectionHealthy, resetSettings, settings, status, testConnection, updateSettings]
  );

  return <AiSettingsContext.Provider value={value}>{children}</AiSettingsContext.Provider>;
}

export function useAiSettings() {
  const ctx = useContext(AiSettingsContext);
  if (!ctx) {
    throw new Error("useAiSettings must be used within an AiSettingsProvider");
  }
  return ctx;
}
