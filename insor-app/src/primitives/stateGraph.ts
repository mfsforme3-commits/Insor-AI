export type NodeType = "file" | "service" | "dependency" | "route";

export interface StateNode {
  id: string;
  label: string;
  type: NodeType;
  metadata?: Record<string, unknown>;
}

export interface StateEdge {
  from: string;
  to: string;
  relationship: string;
}

export interface StateGraphSnapshot {
  nodes: StateNode[];
  edges: StateEdge[];
  capturedAt: string;
}

export class StateGraph {
  private nodes = new Map<string, StateNode>();
  private edges: StateEdge[] = [];

  upsertNode(node: StateNode) {
    this.nodes.set(node.id, node);
  }

  connect(edge: StateEdge) {
    this.edges.push(edge);
  }

  snapshot(): StateGraphSnapshot {
    return {
      nodes: Array.from(this.nodes.values()),
      edges: [...this.edges],
      capturedAt: new Date().toISOString()
    };
  }
}
