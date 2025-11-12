import { generateId } from "../utils/id";

export type CommandStatus = "pending" | "running" | "succeeded" | "failed";

export interface CommandResult {
  id: string;
  command: string;
  cwd: string;
  output: string;
  status: CommandStatus;
  startedAt: string;
  finishedAt?: string;
}

export class Sandbox {
  private history: CommandResult[] = [];

  recordPending(command: string, cwd: string): CommandResult {
    const record: CommandResult = {
      id: generateId(),
      command,
      cwd,
      output: "",
      status: "pending",
      startedAt: new Date().toISOString()
    };
    this.history.unshift(record);
    return record;
  }

  complete(id: string, output: string, status: Exclude<CommandStatus, "pending" | "running">) {
    this.history = this.history.map((cmd) =>
      cmd.id === id
        ? {
            ...cmd,
            output,
            status,
            finishedAt: new Date().toISOString()
          }
        : cmd
    );
  }

  list(limit = 20): CommandResult[] {
    return this.history.slice(0, limit);
  }
}
