import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { ArtifactManager, type ArtifactSnapshot } from "../primitives/artifactManager";
import { ConversationLog, type ConversationTurn } from "../primitives/conversation";
import { Planner, type PlanNode } from "../primitives/planner";
import { Sandbox, type CommandResult } from "../primitives/sandbox";
import { StateGraph, type StateGraphSnapshot } from "../primitives/stateGraph";
import { generateId } from "../utils/id";

export interface WorkspaceState {
  projectName: string | null;
  openDocuments: string[];
  activeDocument?: string | null;
  plan: PlanNode[];
  conversation: ConversationTurn[];
  commandHistory: CommandResult[];
  artifacts: ArtifactSnapshot[];
  graphSnapshot?: StateGraphSnapshot;
  documentStream?: {
    title: string;
    sections: Array<{ heading: string; body: string }>;
  };
}

export interface WorkspaceController {
  state: WorkspaceState;
  hydrate(snapshot: Partial<WorkspaceState>): void;
  clear(): void;
  appendConversation(author: ConversationTurn["author"], content: string): string;
  updateConversation(id: string, content: string): void;
}

const WorkspaceContext = createContext<WorkspaceController | null>(null);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const primitives = useMemo(() => ({
    graph: new StateGraph(),
    sandbox: new Sandbox(),
    planner: new Planner(),
    conversation: new ConversationLog(),
    artifacts: new ArtifactManager()
  }), []);

  const [state, setState] = useState<WorkspaceState>({
    projectName: null,
    openDocuments: [],
    activeDocument: null,
    plan: [],
    conversation: [],
    commandHistory: [],
    artifacts: [],
    documentStream: undefined
  });

  const hydrate = (snapshot: Partial<WorkspaceState>) => {
    setState((prev) => ({
      ...prev,
      ...snapshot,
      graphSnapshot: snapshot.graphSnapshot ?? prev.graphSnapshot,
      documentStream: snapshot.documentStream ?? prev.documentStream
    }));
  };

  const clear = () => {
    primitives.conversation.clear();
    setState({
      projectName: null,
      openDocuments: [],
      activeDocument: null,
      plan: [],
      conversation: [],
      commandHistory: [],
      artifacts: [],
      graphSnapshot: undefined,
      documentStream: undefined
    });
  };

  const appendConversation = (author: ConversationTurn["author"], content: string) => {
    const id = generateId();
    setState((prev) => ({
      ...prev,
      conversation: [
        ...prev.conversation,
        {
          id,
          author,
          content,
          createdAt: new Date().toISOString()
        }
      ]
    }));
    return id;
  };

  const updateConversation = (id: string, content: string) => {
    setState((prev) => ({
      ...prev,
      conversation: prev.conversation.map((turn) =>
        turn.id === id
          ? {
              ...turn,
              content
            }
          : turn
      )
    }));
  };

  const value: WorkspaceController = {
    state,
    hydrate,
    clear,
    appendConversation,
    updateConversation
  };

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider");
  }
  return ctx;
}
