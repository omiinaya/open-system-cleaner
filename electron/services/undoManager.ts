import * as fs from "fs/promises";
import * as path from "path";
import { app } from "electron";
import { auditLogger } from "./auditLogger";

export interface UndoableAction {
  id: string;
  timestamp: number;
  description: string;
  module: string;
  undo: () => Promise<void>;
  redo: () => Promise<void>;
  metadata: Record<string, any>;
}

export interface SerializedAction {
  id: string;
  timestamp: number;
  description: string;
  module: string;
  actionType: string;
  metadata: Record<string, any>;
}

export class UndoManager {
  private actions: UndoableAction[] = [];
  private redoStack: UndoableAction[] = [];
  private maxHistory = 50;
  private persistencePath: string;

  constructor() {
    this.persistencePath = path.join(
      app.getPath("userData"),
      "undo-history.json",
    );
    this.loadHistory();
  }

  /**
   * Execute an action and add it to the undo stack
   */
  async execute<T>(
    description: string,
    module: string,
    action: () => Promise<T>,
    undo: () => Promise<void>,
    redo: () => Promise<void>,
    metadata: Record<string, any> = {},
  ): Promise<T> {
    const result = await action();

    const undoableAction: UndoableAction = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      description,
      module,
      undo,
      redo,
      metadata,
    };

    // Add to undo stack
    this.actions.push(undoableAction);

    // Clear redo stack when new action is performed
    this.redoStack = [];

    // Keep only recent actions
    if (this.actions.length > this.maxHistory) {
      this.actions.shift();
    }

    // Persist to disk
    await this.saveHistory();

    await auditLogger.log("action_executed", "undoManager", "success", {
      actionId: undoableAction.id,
      description,
      module,
    });

    return result;
  }

  /**
   * Undo the last action
   */
  async undo(): Promise<{
    success: boolean;
    action?: UndoableAction;
    message: string;
  }> {
    const action = this.actions.pop();

    if (!action) {
      return {
        success: false,
        message: "Nothing to undo",
      };
    }

    try {
      await auditLogger.log("undo_started", "undoManager", "success", {
        actionId: action.id,
        description: action.description,
      });

      await action.undo();

      // Move to redo stack
      this.redoStack.push(action);

      await this.saveHistory();

      await auditLogger.log("undo_completed", "undoManager", "success", {
        actionId: action.id,
      });

      return {
        success: true,
        action,
        message: `Undone: ${action.description}`,
      };
    } catch (error) {
      // Put action back if undo failed
      this.actions.push(action);

      await auditLogger.log("undo_failed", "undoManager", "failure", {
        actionId: action.id,
        error: String(error),
      });

      return {
        success: false,
        action,
        message: `Failed to undo: ${error}`,
      };
    }
  }

  /**
   * Redo the last undone action
   */
  async redo(): Promise<{
    success: boolean;
    action?: UndoableAction;
    message: string;
  }> {
    const action = this.redoStack.pop();

    if (!action) {
      return {
        success: false,
        message: "Nothing to redo",
      };
    }

    try {
      await auditLogger.log("redo_started", "undoManager", "success", {
        actionId: action.id,
        description: action.description,
      });

      await action.redo();

      // Move back to undo stack
      this.actions.push(action);

      await this.saveHistory();

      await auditLogger.log("redo_completed", "undoManager", "success", {
        actionId: action.id,
      });

      return {
        success: true,
        action,
        message: `Redone: ${action.description}`,
      };
    } catch (error) {
      // Put action back if redo failed
      this.redoStack.push(action);

      await auditLogger.log("redo_failed", "undoManager", "failure", {
        actionId: action.id,
        error: String(error),
      });

      return {
        success: false,
        action,
        message: `Failed to redo: ${error}`,
      };
    }
  }

  /**
   * Check if there are actions that can be undone
   */
  canUndo(): boolean {
    return this.actions.length > 0;
  }

  /**
   * Check if there are actions that can be redone
   */
  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  /**
   * Get the list of undoable actions
   */
  getUndoStack(): SerializedAction[] {
    return this.actions.map((a) => this.serializeAction(a));
  }

  /**
   * Get the list of redoable actions
   */
  getRedoStack(): SerializedAction[] {
    return this.redoStack.map((a) => this.serializeAction(a));
  }

  /**
   * Clear all history
   */
  async clearHistory(): Promise<void> {
    this.actions = [];
    this.redoStack = [];
    await this.saveHistory();

    await auditLogger.log("history_cleared", "undoManager", "success", {});
  }

  /**
   * Get the most recent actions
   */
  getRecentActions(count = 10): SerializedAction[] {
    return this.actions
      .slice(-count)
      .reverse()
      .map((a) => this.serializeAction(a));
  }

  /**
   * Serialize an action for storage/display
   */
  private serializeAction(action: UndoableAction): SerializedAction {
    return {
      id: action.id,
      timestamp: action.timestamp,
      description: action.description,
      module: action.module,
      actionType: this.getActionType(action),
      metadata: action.metadata,
    };
  }

  /**
   * Determine action type from metadata
   */
  private getActionType(action: UndoableAction): string {
    if (action.metadata.filesDeleted) return "delete";
    if (action.metadata.registryModified) return "registry";
    if (action.metadata.processesTerminated) return "process";
    if (action.metadata.startupModified) return "startup";
    return "generic";
  }

  /**
   * Save history to disk
   */
  private async saveHistory(): Promise<void> {
    try {
      const data = {
        actions: this.actions.map((a) => this.serializeAction(a)),
        redoStack: this.redoStack.map((a) => this.serializeAction(a)),
      };
      await fs.writeFile(this.persistencePath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error("Failed to save undo history:", error);
    }
  }

  /**
   * Load history from disk
   */
  private async loadHistory(): Promise<void> {
    try {
      const content = await fs.readFile(this.persistencePath, "utf-8");
      const data = JSON.parse(content);

      // Note: We can only restore the metadata, not the actual undo/redo functions
      // The functions would need to be recreated based on the action type
      console.log("Loaded undo history:", data.actions.length, "actions");
    } catch {
      // File doesn't exist or is corrupted
      this.actions = [];
      this.redoStack = [];
    }
  }

  /**
   * Create a file deletion action
   */
  async createFileDeleteAction(
    filePaths: string[],
    trashPaths: string[],
    description: string,
  ): Promise<void> {
    await this.execute(
      description,
      "junkFileCleaner",
      async () => {
        // Action already performed
        return true;
      },
      async () => {
        // Undo: Restore files from trash
        for (let i = 0; i < filePaths.length; i++) {
          try {
            await fs.rename(trashPaths[i], filePaths[i]);
          } catch (error) {
            console.error(`Failed to restore ${filePaths[i]}:`, error);
          }
        }
      },
      async () => {
        // Redo: Delete files again
        for (const filePath of filePaths) {
          try {
            await fs.unlink(filePath);
          } catch (error) {
            console.error(`Failed to re-delete ${filePath}:`, error);
          }
        }
      },
      {
        filesDeleted: filePaths,
        trashPaths,
        fileCount: filePaths.length,
      },
    );
  }
}

export const undoManager = new UndoManager();
