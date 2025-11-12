import type { WorkspaceController, WorkspaceState } from "../core/workspace";
import { runDemoHydration } from "../mocks/demoFeed";

const WORKSPACE_EVENT = "insor://workspace-update";

export async function startWorkspaceBridge(controller: WorkspaceController) {
  if (typeof window === "undefined") return;

  const tauriEvent = (window as any).__TAURI__?.event;
  if (tauriEvent?.listen) {
    await tauriEvent.listen(
      WORKSPACE_EVENT,
      ({ payload }: { payload?: Partial<WorkspaceState> }) => {
        if (payload) controller.hydrate(payload);
      }
    );
    await tauriEvent.emit?.("insor://workspace-ready");
    return;
  }

  const externalBridge = (window as any).InsorBridge;
  if (externalBridge?.onWorkspaceUpdate) {
    externalBridge.onWorkspaceUpdate((payload: Partial<WorkspaceState>) => {
      controller.hydrate(payload ?? {});
    });
    externalBridge.requestInitialState?.();
    return;
  }

  runDemoHydration(controller);
}
