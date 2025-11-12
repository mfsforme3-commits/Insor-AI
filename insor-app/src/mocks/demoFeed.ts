import type { WorkspaceController } from "../core/workspace";
import { generateId } from "../utils/id";
import type { StateNode, StateEdge } from "../primitives/stateGraph";
import type { PlanNode } from "../primitives/planner";
import type { CommandResult } from "../primitives/sandbox";
import type { ArtifactSnapshot } from "../primitives/artifactManager";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function runDemoHydration(controller: WorkspaceController) {
  controller.hydrate({ projectName: "Insor.ai Demo" });

  const nodes: StateNode[] = [
    { id: "n1", label: "src/main.tsx", type: "file" },
    { id: "n2", label: "src-tauri/main.rs", type: "file" },
    { id: "n3", label: "App Shell", type: "service" },
    { id: "n4", label: "AI Planner", type: "service" }
  ];

  const edges: StateEdge[] = [
    { from: "n1", to: "n3", relationship: "imports" },
    { from: "n2", to: "n3", relationship: "launches" },
    { from: "n3", to: "n4", relationship: "delegates" }
  ];

  controller.hydrate({
    graphSnapshot: {
      nodes,
      edges,
      capturedAt: new Date().toISOString()
    },
    openDocuments: ["plans/mission.md", "src/App.tsx"],
    activeDocument: "plans/mission.md"
  });

  await wait(800);

  const plan: PlanNode[] = [
    { id: generateId(), title: "Sync workspace graph", status: "done" },
    { id: generateId(), title: "Render mission-control shell", status: "in-progress" },
    { id: generateId(), title: "Connect AI planner", status: "waiting" }
  ];
  controller.hydrate({ plan });

  await wait(600);

  controller.hydrate({
    conversation: [
      {
        id: generateId(),
        author: "system",
        content: "Connected to Insor.ai core.",
        createdAt: new Date().toISOString()
      },
      {
        id: generateId(),
        author: "ai",
        content: "Ready to ingest repository state and craft development plan.",
        createdAt: new Date().toISOString()
      }
    ]
  });

  await wait(500);

  controller.hydrate({
    documentStream: {
      title: "Mission Control Plan",
      sections: [
        {
          heading: "Overview",
          body:
            "Native Insor.ai mission control guiding AI-first development across Linux and Windows."
        },
        {
          heading: "Next Steps",
          body: "1. Wire planner. 2. Stream command logs. 3. Capture artifacts."
        }
      ]
    }
  });

  await wait(400);

  const commandHistory: CommandResult[] = [
    {
      id: generateId(),
      command: "npm install",
      cwd: "/Users/you/projects/insor",
      output: "added 140 packages",
      status: "succeeded",
      startedAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
      finishedAt: new Date(Date.now() - 1000 * 60 * 4).toISOString()
    },
    {
      id: generateId(),
      command: "npm run tauri dev",
      cwd: "/Users/you/projects/insor",
      output: "Compiling rust backend...",
      status: "running",
      startedAt: new Date(Date.now() - 1000 * 60 * 2).toISOString()
    },
    {
      id: generateId(),
      command: "git status -sb",
      cwd: "/Users/you/projects/insor",
      output: "?? new-feature",
      status: "succeeded",
      startedAt: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
      finishedAt: new Date(Date.now() - 1000 * 60 * 3 + 15000).toISOString()
    }
  ];

  const artifacts: ArtifactSnapshot[] = [
    {
      id: generateId(),
      label: "UI Shell Snapshot",
      path: "snapshots/ui-shell.patch",
      createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString()
    },
    {
      id: generateId(),
      label: "Planner Plan v1",
      path: "plans/mission-control.md",
      createdAt: new Date(Date.now() - 1000 * 60 * 20).toISOString()
    }
  ];

  controller.hydrate({
    commandHistory,
    artifacts
  });
}
