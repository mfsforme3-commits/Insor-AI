/// <reference types="vite/client" />

import type { WorkspaceState } from "./core/workspace";

interface ImportMetaEnv {
  readonly VITE_OPENAI_BASE_URL?: string;
  readonly VITE_OPENAI_API_KEY?: string;
  readonly VITE_OPENAI_MODEL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare global {
  interface Window {
    InsorBridge?: {
      onWorkspaceUpdate?: (callback: (payload: Partial<WorkspaceState>) => void) => void;
      requestInitialState?: () => void;
    };
  }
}

export {};
