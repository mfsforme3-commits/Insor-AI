import { useEffect, useState } from "react";
import { useWorkspace } from "./core/workspace";
import { useAiSettings } from "./core/aiSettings";
import { SettingsPanel } from "./components/SettingsPanel";
import { AiRequestError, createChatCompletion, type ChatMessage } from "./services/aiClient";
import { streamChatCompletion } from "./services/aiStream";
import { startWorkspaceBridge } from "./services/workspaceBridge";
import type { ArtifactSnapshot } from "./primitives/artifactManager";

interface AppHeaderProps {
  onOpenSettings: () => void;
}

function AppHeader({ onOpenSettings }: AppHeaderProps) {
  const { status } = useAiSettings();

  const statusLabel =
    status === "connected"
      ? "AI Connected"
      : status === "testing"
        ? "Testing AI"
        : status === "error"
          ? "AI Error"
          : "Configure AI";

  const statusTone =
    status === "connected"
      ? "connected"
      : status === "error"
        ? "error"
        : status === "testing"
          ? "testing"
          : "idle";

  return (
    <header className="app-header">
      <div className="header-content">
        <div className="menu-bar">
          <span className="menu-item active">File</span>
          <span className="menu-item">Edit</span>
          <span className="menu-item">Selection</span>
          <span className="menu-item">View</span>
          <span className="menu-item">Go</span>
          <span className="menu-item">Run</span>
          <span className="menu-item">Terminal</span>
          <span className="menu-item">Help</span>
        </div>
        <div className="app-title-section">
          <div className="app-logo">
            <span className="material-symbols-outlined">code</span>
          </div>
          <div className="app-title">Insor</div>
          <div className="app-version">v1.0</div>
        </div>
        <div className="header-actions">
          <div className={`connection-indicator connection-${statusTone}`}>
            <span className="connection-dot" aria-hidden="true" />
            <span>{statusLabel}</span>
          </div>
          <button className="header-settings-btn" onClick={onOpenSettings}>
            <span className="material-symbols-outlined">settings</span>
            <span>Settings</span>
          </button>
          <div className="window-controls">
            <button className="window-btn minimize">
              <span className="material-symbols-outlined">minimize</span>
            </button>
            <button className="window-btn maximize">
              <span className="material-symbols-outlined">crop_square</span>
            </button>
            <button className="window-btn close">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

function Sidebar() {
  const { state } = useWorkspace();
  const projectName = state.projectName ?? "No Folder Opened";
  const graphNodes = state.graphSnapshot?.nodes ?? [];

  return (
    <aside className="sidebar">
      <div className="sidebar-content">
        <div className="explorer-header">
          <div className="section-title">
            <span className="material-symbols-outlined">expand_more</span>
            <span>{projectName}</span>
          </div>
          <div className="explorer-actions">
            <span className="material-symbols-outlined">create_new_folder</span>
            <span className="material-symbols-outlined">search</span>
            <span className="material-symbols-outlined">sync_alt</span>
          </div>
        </div>

        {graphNodes.length === 0 ? (
          <div className="welcome-content">
            <p>You have not yet opened a folder.</p>
            <button className="primary-btn">Open Folder</button>
            <p>You can clone a repository locally.</p>
            <button className="secondary-btn">Clone Repository</button>
            <p className="help-text">
              To learn more about how to use Git and source control, <a href="#">read our docs</a>.
            </p>
          </div>
        ) : (
          <div className="project-tree">
            {graphNodes.map((node) => (
              <div key={node.id} className="project-node">
                <span className="material-symbols-outlined project-node-icon">
                  {node.type === "file" ? "description" : "account_tree"}
                </span>
                <div>
                  <div className="project-node-label">{node.label}</div>
                  <div className="project-node-meta">{node.type}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="sidebar-footer">
        <div className="footer-section">
          <button className="footer-toggle">
            <span className="material-symbols-outlined">chevron_right</span>
            <span className="section-label">Outline</span>
          </button>
        </div>
        <div className="footer-section">
          <button className="footer-toggle">
            <span className="material-symbols-outlined">chevron_right</span>
            <span className="section-label">Timeline</span>
          </button>
        </div>
        <div className="status-bar-footer">
          <span className="material-symbols-outlined">gite</span>
          <div className="error-counts">
            <span className="material-symbols-outlined">error_outline</span>
            <span>0</span>
            <span className="material-symbols-outlined">warning_amber</span>
            <span>0</span>
          </div>
        </div>
      </div>
    </aside>
  );
}

function WelcomeScreen() {
  const { state } = useWorkspace();
  const plan = state.plan;
  const documentStream = state.documentStream;
  const commandHistory = state.commandHistory.slice(0, 4);
  const artifacts = state.artifacts.slice(0, 3);
  const statusCounts = plan.reduce(
    (acc, node) => {
      acc[node.status] += 1;
      return acc;
    },
    { done: 0, "in-progress": 0, waiting: 0 } as Record<"done" | "in-progress" | "waiting", number>
  );

  const formatCommandStatus = (status: string) =>
    status.replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());

  const formatTime = (iso?: string | null) => {
    if (!iso) return "";
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <main className="welcome-screen">
      <div className="welcome-content">
        <div className="logo-section">
          <h1 className="app-name">Insor</h1>
        </div>

        <div className="action-cards">
          <button className="action-card">
            <span className="material-symbols-outlined">folder_open</span>
            <span>Open Folder</span>
          </button>
          <button className="action-card">
            <span className="material-symbols-outlined">history</span>
            <span>Clone Repository</span>
          </button>
          <button className="action-card">
            <span className="material-symbols-outlined">terminal</span>
            <span>Connect via SSH</span>
          </button>
        </div>

        {documentStream ? (
          <div className="document-preview">
            <div className="document-preview-header">
              <span className="material-symbols-outlined">description</span>
              <div>
                <h4>{documentStream.title}</h4>
                <p>Live plan streamed by Insor.ai</p>
              </div>
            </div>
            {documentStream.sections.map((section) => (
              <div key={section.heading} className="document-section">
                <h5>{section.heading}</h5>
                <p>{section.body}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="whats-new">
            What's New in Insor: <a href="#">Learn More</a>
          </div>
        )}

        <div className="status-grid">
          {["in-progress", "waiting", "done"].map((status) => (
            <div key={status} className="status-card">
              <span className="status-label">{status.replace("-", " ")}</span>
              <span className="status-value">{statusCounts[status as keyof typeof statusCounts]}</span>
            </div>
          ))}
        </div>

        <div className="activity-panels">
          <div className="activity-card">
            <div className="activity-card-header">
              <span className="material-symbols-outlined">terminal</span>
              <div>
                <h4>Recent Commands</h4>
                <p>Live feed from the Insor sandbox.</p>
              </div>
            </div>
            <ul className="activity-list">
              {commandHistory.length === 0 ? (
                <li className="activity-empty">No commands have run yet.</li>
              ) : (
                commandHistory.map((command) => (
                  <li key={command.id} className={`activity-item command-${command.status}`}>
                    <div>
                      <p className="activity-primary">{command.command}</p>
                      <p className="activity-secondary">{command.cwd}</p>
                    </div>
                    <div className="activity-meta">
                      <span>{formatCommandStatus(command.status)}</span>
                      <time>{formatTime(command.finishedAt ?? command.startedAt)}</time>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </div>

          <div className="activity-card">
            <div className="activity-card-header">
              <span className="material-symbols-outlined">collections_bookmark</span>
              <div>
                <h4>Artifacts</h4>
                <p>Snapshots captured during the mission.</p>
              </div>
            </div>
            <ul className="activity-list">
              {artifacts.length === 0 ? (
                <li className="activity-empty">No artifacts captured yet.</li>
              ) : (
                artifacts.map((artifact) => (
                  <li key={artifact.id} className="activity-item">
                    <div>
                      <p className="activity-primary">{artifact.label}</p>
                      <p className="activity-secondary">{artifact.path}</p>
                    </div>
                    <div className="activity-meta">
                      <time>{formatTime(artifact.createdAt)}</time>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
}

interface AssistantPaneProps {
  onShowArtifact: (artifact: ArtifactSnapshot) => void;
  onOpenSettings: () => void;
}

function AssistantPane({ onShowArtifact, onOpenSettings }: AssistantPaneProps) {
  const { state, appendConversation, updateConversation } = useWorkspace();
  const { settings, markConnectionHealthy } = useAiSettings();
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const conversation = state.conversation.slice(-6);
  const plan = state.plan;
  const artifacts = state.artifacts.slice(0, 3);
  const missingCredentials = !settings.apiKey.trim();

  const handleSend = async () => {
    const trimmed = message.trim();
    if (!trimmed || isSending) return;
    if (missingCredentials) {
      appendConversation("system", "Add an API key in Settings before asking Insor.");
      return;
    }

    const chatHistory = state.conversation.map<ChatMessage>((turn) => ({
      role:
        turn.author === "ai"
          ? ("assistant" as const)
          : turn.author === "user"
            ? ("user" as const)
            : ("system" as const),
      content: turn.content
    }));

    const payload: ChatMessage[] = [
      {
        role: "system",
        content:
          "You are Insor.ai, an AI IDE pilot. Be concise, describe next engineering actions, and always ask clarifying questions when uncertain."
      },
      ...chatHistory,
      { role: "user", content: trimmed }
    ];

    appendConversation("user", trimmed);
    setMessage("");
    setIsSending(true);

    try {
      const aiMessageId = appendConversation("ai", "");
      let streamedReply = "";
      let receivedResponse = false;

      if (settings.enableStreaming) {
        try {
          await streamChatCompletion(payload, (chunk) => {
            streamedReply += chunk;
            receivedResponse = true;
            updateConversation(aiMessageId, streamedReply);
          }, settings);
        } catch (error) {
          console.warn("Streaming failed, falling back to non-streaming completion", error);
        }
      }

      if (!receivedResponse) {
        const fallback = await createChatCompletion(payload, settings);
        streamedReply = fallback;
        receivedResponse = true;
        updateConversation(aiMessageId, fallback);
      }

      if (receivedResponse) {
        markConnectionHealthy();
      }
    } catch (error) {
      const details =
        error instanceof AiRequestError
          ? `${error.message} (status ${error.status})`
          : error instanceof Error
            ? error.message
            : String(error);
      appendConversation("system", `AI error: ${details}`);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <aside className="assistant-pane">
      <header className="assistant-header">
        <h3>Insor Assistant</h3>
      </header>

      {missingCredentials && (
        <div className="assistant-warning" role="status">
          <span className="material-symbols-outlined" aria-hidden="true">
            vpn_key
          </span>
          <div>
            <p>Add your API key to start chatting with Insor.</p>
            <button className="ghost-button" onClick={onOpenSettings}>
              Open settings
            </button>
          </div>
        </div>
      )}

      <div className="assistant-plan">
        <div className="assistant-plan-header">
          <span className="material-symbols-outlined">route</span>
          <span>Plan Queue</span>
        </div>
        {plan.length === 0 ? (
          <p className="assistant-plan-empty">No active plan nodes yet.</p>
        ) : (
          <ul className="assistant-plan-list">
            {plan.map((node) => (
              <li key={node.id}>
                <span>{node.title}</span>
                <small>{node.status}</small>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="assistant-messages">
        {conversation.length === 0 ? (
          <div className="empty-chat-hint">No messages yet. Ask Insor anything about your repo.</div>
        ) : (
          conversation.map((turn) => (
            <div
              key={turn.id}
              className={`message-bubble ${turn.author === "ai" ? "assistant" : turn.author === "user" ? "user" : "system"}`}
            >
              <p>{turn.content}</p>
            </div>
          ))
        )}
      </div>

      {artifacts.length > 0 && (
        <div className="artifact-strip">
          {artifacts.map((artifact) => (
            <button
              key={artifact.id}
              className="artifact-pill"
              onClick={() => onShowArtifact(artifact)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onShowArtifact(artifact);
                }
              }}
            >
              {artifact.label}
            </button>
          ))}
        </div>
      )}

      <div className="assistant-input-area">
        <div className="input-container">
          <textarea
            placeholder="Plan, @ for context, / for commands"
            rows={3}
            className="message-input"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            onKeyDown={(event) => {
              if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                event.preventDefault();
                handleSend();
              }
            }}
          />
          <div className="input-toolbar">
            <div className="toolbar-left">
              <button className="toolbar-btn">
                <span className="material-symbols-outlined">auto_awesome</span>
                <span>Agent</span>
                <span className="material-symbols-outlined">expand_more</span>
              </button>
              <button className="toolbar-btn">
                <span>Auto</span>
                <span className="material-symbols-outlined">expand_more</span>
              </button>
            </div>
            <div className="toolbar-right">
              <span className="material-symbols-outlined">alternate_email</span>
              <span className="material-symbols-outlined">public</span>
              <span className="material-symbols-outlined">image</span>
              <button className="mic-btn">
                <span className="material-symbols-outlined">mic</span>
              </button>
              <button className="send-btn" onClick={handleSend} disabled={!message.trim() || isSending}>
                {isSending ? "Thinking..." : "Send"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <footer className="assistant-footer">
        <span>Insor Tab</span>
        <span className="material-symbols-outlined">notifications</span>
      </footer>
    </aside>
  );
}

function App() {
  const controller = useWorkspace();
  const [artifactPreview, setArtifactPreview] = useState<ArtifactSnapshot | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    startWorkspaceBridge(controller);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!artifactPreview) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setArtifactPreview(null);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [artifactPreview]);

  return (
    <div className="app-container">
      <AppHeader onOpenSettings={() => setIsSettingsOpen(true)} />
      <div className="app-main">
        <Sidebar />
        <WelcomeScreen />
        <AssistantPane onShowArtifact={setArtifactPreview} onOpenSettings={() => setIsSettingsOpen(true)} />
      </div>

      <ArtifactModal artifact={artifactPreview} onClose={() => setArtifactPreview(null)} />
      <SettingsPanel open={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
}

interface ArtifactModalProps {
  artifact: ArtifactSnapshot | null;
  onClose: () => void;
}

function ArtifactModal({ artifact, onClose }: ArtifactModalProps) {
  if (!artifact) return null;
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-panel"
        role="dialog"
        aria-modal="true"
        aria-label="Artifact details"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <h3>{artifact.label}</h3>
          <button className="icon-button" onClick={onClose} aria-label="Close artifact details">
            ✕
          </button>
        </div>
        <div className="modal-body">
          <p className="modal-meta">{artifact.path}</p>
          <p className="modal-meta">
            Captured {new Date(artifact.createdAt).toLocaleString()}
          </p>
          <pre className="command-output">{artifact.diff ?? "(diff preview not available yet)"}</pre>
        </div>
      </div>
    </div>
  );
}

export default App;
