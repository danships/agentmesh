import type { Tool } from './types.js';

export type TaskHandler = (payload: unknown) => Promise<unknown>;

interface ToolEntry {
  tool: Tool;
  handler: TaskHandler;
}

export class ToolRegistry {
  private readonly entries = new Map<string, ToolEntry>();

  register(tool: Tool, handler: TaskHandler): void {
    this.entries.set(tool.name, { tool, handler });
  }

  has(toolName: string): boolean {
    return this.entries.has(toolName);
  }

  getHandler(toolName: string): TaskHandler | undefined {
    return this.entries.get(toolName)?.handler;
  }

  list(): Tool[] {
    return [...this.entries.values()].map((entry) => entry.tool);
  }
}
