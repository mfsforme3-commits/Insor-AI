import { generateId } from "../utils/id";

export type Author = "ai" | "user" | "system";

export interface ConversationTurn {
  id: string;
  author: Author;
  content: string;
  createdAt: string;
}

export class ConversationLog {
  private turns: ConversationTurn[] = [];

  append(author: Author, content: string) {
    this.turns.push({
      id: generateId(),
      author,
      content,
      createdAt: new Date().toISOString()
    });
  }

  all(): ConversationTurn[] {
    return this.turns.slice(-50);
  }

  clear() {
    this.turns = [];
  }
}
