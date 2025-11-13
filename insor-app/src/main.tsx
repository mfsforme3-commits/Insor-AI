import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles.css";
import { WorkspaceProvider } from "./core/workspace";
import { AiSettingsProvider } from "./core/aiSettings";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <AiSettingsProvider>
      <WorkspaceProvider>
        <App />
      </WorkspaceProvider>
    </AiSettingsProvider>
  </React.StrictMode>
);
