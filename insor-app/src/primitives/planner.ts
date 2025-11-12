export interface PlanNode {
  id: string;
  title: string;
  status: "waiting" | "in-progress" | "done";
  details?: string;
}

export class Planner {
  private plan: PlanNode[] = [];

  setPlan(nodes: PlanNode[]) {
    this.plan = nodes;
  }

  updateStatus(id: string, status: PlanNode["status"], details?: string) {
    this.plan = this.plan.map((node) =>
      node.id === id ? { ...node, status, details: details ?? node.details } : node
    );
  }

  currentPlan(): PlanNode[] {
    return this.plan;
  }
}
