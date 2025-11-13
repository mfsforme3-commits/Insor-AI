import { useEffect, useMemo, useState } from "react";
import { useAiSettings } from "../core/aiSettings";

interface SettingsPanelProps {
  open: boolean;
  onClose: () => void;
}

type DraftState = ReturnType<typeof useAiSettings>["settings"];

function areSettingsEqual(a: DraftState, b: DraftState) {
  return (
    a.baseUrl.trim() === b.baseUrl.trim() &&
    a.model.trim() === b.model.trim() &&
    a.apiKey === b.apiKey &&
    a.enableStreaming === b.enableStreaming
  );
}

export function SettingsPanel({ open, onClose }: SettingsPanelProps) {
  const { settings, defaults, status, lastError, updateSettings, resetSettings, testConnection } = useAiSettings();
  const [draft, setDraft] = useState<DraftState>(settings);
  const [dirty, setDirty] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    if (open) {
      setDraft(settings);
      setDirty(false);
    }
  }, [open, settings]);

  const statusLabel = useMemo(() => {
    switch (status) {
      case "connected":
        return "Connected";
      case "testing":
        return "Testing...";
      case "error":
        return "Connection Error";
      default:
        return "Not tested";
    }
  }, [status]);

  const statusTone = useMemo(() => {
    switch (status) {
      case "connected":
        return "success";
      case "error":
        return "error";
      case "testing":
        return "loading";
      default:
        return "idle";
    }
  }, [status]);

  const isDefault = useMemo(() => areSettingsEqual(draft, defaults), [draft, defaults]);
  const isSaved = useMemo(() => areSettingsEqual(draft, settings), [draft, settings]);

  const handleChange = <K extends keyof DraftState>(key: K, value: DraftState[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    try {
      await testConnection(draft);
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = () => {
    updateSettings(draft);
    onClose();
  };

  const handleReset = () => {
    resetSettings();
    setDraft(defaults);
    setDirty(false);
  };

  if (!open) return null;

  return (
    <div className="settings-overlay" role="dialog" aria-modal="true" aria-label="Insor settings">
      <div className="settings-panel">
        <header className="settings-header">
          <div>
            <h2>Insor Settings</h2>
            <p className="settings-subtitle">Configure your AI workspace preferences.</p>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Close settings">
            ✕
          </button>
        </header>

        <section className="settings-section">
          <div className="settings-section-title">
            <h3>AI Provider</h3>
            <span className={`settings-status settings-status-${statusTone}`}>{statusLabel}</span>
          </div>
          <div className="form-grid">
            <label className="form-field">
              <span>Base URL</span>
              <input
                value={draft.baseUrl}
                onChange={(event) => handleChange("baseUrl", event.target.value)}
                placeholder="https://api.openai.com"
              />
            </label>
            <label className="form-field">
              <span>Model</span>
              <input
                value={draft.model}
                onChange={(event) => handleChange("model", event.target.value)}
                placeholder="gpt-4o-mini"
              />
            </label>
            <label className="form-field full-width">
              <span>API Key</span>
              <input
                type="password"
                value={draft.apiKey}
                onChange={(event) => handleChange("apiKey", event.target.value)}
                placeholder="sk-..."
                autoComplete="off"
              />
            </label>
            <label className="form-switch">
              <input
                type="checkbox"
                checked={draft.enableStreaming}
                onChange={(event) => handleChange("enableStreaming", event.target.checked)}
              />
              <div>
                <span>Enable streaming responses</span>
                <p>Stream tokens in real time when the provider supports it.</p>
              </div>
            </label>
          </div>
          {lastError && status === "error" && <p className="settings-error">{lastError}</p>}
        </section>

        <footer className="settings-footer">
          <div className="settings-actions-left">
            <button className="ghost-button" onClick={handleReset} disabled={isDefault && !dirty}>
              Restore defaults
            </button>
            <button className="ghost-button" onClick={handleTestConnection} disabled={isTesting}>
              {isTesting ? "Testing..." : "Test connection"}
            </button>
          </div>
          <div className="settings-actions-right">
            <button className="ghost-button" onClick={onClose}>
              Cancel
            </button>
            <button className="primary-btn" onClick={handleSave} disabled={!dirty || isSaved}>
              Save changes
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
