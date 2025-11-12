# Workspace Bridge Events

Insor's React shell now waits for real-time updates from an external controller (Tauri backend, daemon, etc.). When no bridge is available it automatically falls back to the demo feed, so you can develop the UI without a running backend.

## Event Contract

The frontend listens for partial `WorkspaceState` payloads. Each payload can include any of:

- `projectName`
- `openDocuments`, `activeDocument`
- `plan` (array of plan nodes)
- `conversation` (turn history)
- `commandHistory`
- `artifacts`
- `graphSnapshot`
- `documentStream`

### Tauri

Emit events from Rust using the `insor://workspace-update` channel:

```rust
use serde_json::json;

window.emit(
    "insor://workspace-update",
    json!({
        "projectName": "Insor.ai",
        "openDocuments": ["README.md"],
        "plan": [{"id": "1", "title": "Bootstrap UI", "status": "done"}]
    })
)?;
```

The UI also emits a one-time `insor://workspace-ready` event so the backend knows when to start streaming.

### Browser / Other Hosts

Expose a bridge object on `window`:

```ts
window.InsorBridge = {
  onWorkspaceUpdate(callback) {
    socket.on("workspace:update", callback);
  },
  requestInitialState() {
    socket.emit("workspace:request");
  }
};
```

Once `onWorkspaceUpdate` calls back with payloads the UI will hydrate automatically.

## Fallback Demo

If neither Tauri nor `window.InsorBridge` exists, the UI loads the bundled demo feed (`src/mocks/demoFeed.ts`) so designers can preview the experience without a backend.
