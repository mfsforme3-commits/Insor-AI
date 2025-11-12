import { generateId } from "../utils/id";

export interface ArtifactSnapshot {
  id: string;
  label: string;
  path: string;
  createdAt: string;
  diff?: string;
}

export class ArtifactManager {
  private snapshots: ArtifactSnapshot[] = [];

  capture(label: string, path: string, diff?: string) {
    const snapshot: ArtifactSnapshot = {
      id: generateId(),
      label,
      path,
      diff,
      createdAt: new Date().toISOString()
    };
    this.snapshots.unshift(snapshot);
    return snapshot;
  }

  list(limit = 10) {
    return this.snapshots.slice(0, limit);
  }
}
