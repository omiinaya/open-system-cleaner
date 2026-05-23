import type { Stats } from "node:fs";
import { watch, FSWatcher } from "chokidar";
import * as path from "path";
import { auditLogger } from "./auditLogger";

export interface FileWatchEvent {
  type: "add" | "change" | "unlink" | "addDir" | "unlinkDir";
  path: string;
  stats?: Stats;
  timestamp: number;
}

export interface RansomwareIndicators {
  rapidFileChanges: boolean;
  suspiciousExtensions: boolean;
  highEntropyFiles: boolean;
  bulkOperations: boolean;
}

export class FileWatcherService {
  private watcher: FSWatcher | null = null;
  private recentEvents: FileWatchEvent[] = [];
  private readonly MAX_EVENTS = 100;
  private readonly RAPID_CHANGE_THRESHOLD = 10; // Events per second
  private suspiciousPatterns = [
    /\.encrypted$/,
    /\.locked$/,
    /\.crypto$/,
    /\.crypted$/,
    /\.vault$/,
    /\.aes$/,
    /\.locked\d+$/,
    /^\.[a-z0-9]{8}$/, // Random 8-char extension
  ];

  private ransomwareCallbacks: ((
    indicators: RansomwareIndicators,
    events: FileWatchEvent[],
  ) => void)[] = [];
  private isWatching = false;

  /**
   * Start watching directories for changes
   */
  startWatching(
    paths: string[],
    options: {
      ignored?: (string | RegExp)[];
      usePolling?: boolean;
      interval?: number;
    } = {},
  ): void {
    if (this.isWatching) {
      console.warn("File watcher already running");
      return;
    }

    const {
      ignored = [/node_modules/, /\.git/, /\.tmp/, /temp/],
      usePolling = false,
      interval = 100,
    } = options;

    this.watcher = watch(paths, {
      ignored,
      persistent: true,
      ignoreInitial: true,
      followSymlinks: false,
      usePolling,
      interval,
      binaryInterval: 300,
      alwaysStat: false,
      depth: 10,
      awaitWriteFinish: {
        stabilityThreshold: 2000,
        pollInterval: 100,
      },
    });

    this.setupEventHandlers();
    this.isWatching = true;

    auditLogger.log("file_watcher_started", "fileWatcher", "success", {
      paths,
    });
  }

  /**
   * Setup event handlers for the watcher
   */
  private setupEventHandlers(): void {
    if (!this.watcher) return;

    this.watcher.on("add", (filePath, stats) => {
      this.handleEvent("add", filePath, stats);
    });

    this.watcher.on("change", (filePath, stats) => {
      this.handleEvent("change", filePath, stats);
    });

    this.watcher.on("unlink", (filePath) => {
      this.handleEvent("unlink", filePath);
    });

    this.watcher.on("addDir", (dirPath) => {
      this.handleEvent("addDir", dirPath);
    });

    this.watcher.on("unlinkDir", (dirPath) => {
      this.handleEvent("unlinkDir", dirPath);
    });

    this.watcher.on("error", (error) => {
      console.error("File watcher error:", error);
      auditLogger.log("file_watcher_error", "fileWatcher", "failure", {
        error: String(error),
      });
    });

    this.watcher.on("ready", () => {
      console.log("File watcher ready");
    });
  }

  /**
   * Handle a file system event
   */
  private handleEvent(
    type: FileWatchEvent["type"],
    filePath: string,
    stats?: Stats,
  ): void {
    const event: FileWatchEvent = {
      type,
      path: filePath,
      stats,
      timestamp: Date.now(),
    };

    // Add to recent events
    this.recentEvents.push(event);
    if (this.recentEvents.length > this.MAX_EVENTS) {
      this.recentEvents.shift();
    }

    // Check for suspicious patterns
    this.checkForSuspiciousActivity(event);

    // Check for ransomware indicators
    this.checkRansomwareIndicators();
  }

  /**
   * Check for suspicious file patterns
   */
  private checkForSuspiciousActivity(event: FileWatchEvent): void {
    const fileName = path.basename(event.path);

    // Check for suspicious file extensions
    if (this.suspiciousPatterns.some((pattern) => pattern.test(fileName))) {
      auditLogger.log("suspicious_file_detected", "fileWatcher", "warning", {
        path: event.path,
        type: event.type,
        fileName,
      });
    }

    // Check for rapid file creation (possible file bomb)
    if (event.type === "add") {
      const recentAdditions = this.recentEvents.filter(
        (e) => e.type === "add" && Date.now() - e.timestamp < 1000,
      );

      if (recentAdditions.length > 50) {
        auditLogger.log(
          "rapid_file_creation_detected",
          "fileWatcher",
          "warning",
          {
            count: recentAdditions.length,
            timeframe: "1 second",
          },
        );
      }
    }
  }

  /**
   * Check for ransomware indicators
   */
  private checkRansomwareIndicators(): void {
    const now = Date.now();
    const recentWindow = 5000; // 5 seconds

    const recentChanges = this.recentEvents.filter(
      (e) => now - e.timestamp < recentWindow,
    );

    const indicators: RansomwareIndicators = {
      rapidFileChanges: false,
      suspiciousExtensions: false,
      highEntropyFiles: false,
      bulkOperations: false,
    };

    // Check for rapid file changes
    if (recentChanges.length > this.RAPID_CHANGE_THRESHOLD) {
      indicators.rapidFileChanges = true;
    }

    // Check for suspicious extensions
    const suspiciousFiles = recentChanges.filter((e) =>
      this.suspiciousPatterns.some((pattern) =>
        pattern.test(path.basename(e.path)),
      ),
    );

    if (suspiciousFiles.length > 0) {
      indicators.suspiciousExtensions = true;
    }

    // Check for bulk operations (many files modified at once)
    const modifiedFiles = recentChanges.filter((e) => e.type === "change");
    if (modifiedFiles.length > 20) {
      indicators.bulkOperations = true;
    }

    // If any indicators are present, trigger callbacks
    if (
      indicators.rapidFileChanges ||
      indicators.suspiciousExtensions ||
      indicators.bulkOperations
    ) {
      this.triggerRansomwareCallbacks(indicators, recentChanges);
    }
  }

  /**
   * Register a callback for ransomware detection
   */
  onRansomwareDetected(
    callback: (
      indicators: RansomwareIndicators,
      events: FileWatchEvent[],
    ) => void,
  ): () => void {
    this.ransomwareCallbacks.push(callback);

    // Return unsubscribe function
    return () => {
      const index = this.ransomwareCallbacks.indexOf(callback);
      if (index > -1) {
        this.ransomwareCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Trigger ransomware detection callbacks
   */
  private triggerRansomwareCallbacks(
    indicators: RansomwareIndicators,
    events: FileWatchEvent[],
  ): void {
    for (const callback of this.ransomwareCallbacks) {
      try {
        callback(indicators, events);
      } catch (error) {
        console.error("Error in ransomware callback:", error);
      }
    }

    auditLogger.log(
      "ransomware_indicators_detected",
      "fileWatcher",
      "warning",
      {
        indicators,
        eventCount: events.length,
      },
    );
  }

  /**
   * Stop watching
   */
  stopWatching(): void {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
      this.isWatching = false;
      this.recentEvents = [];

      auditLogger.log("file_watcher_stopped", "fileWatcher", "success", {});
    }
  }

  /**
   * Check if watcher is running
   */
  isRunning(): boolean {
    return this.isWatching;
  }

  /**
   * Get recent events
   */
  getRecentEvents(count = 50): FileWatchEvent[] {
    return this.recentEvents.slice(-count);
  }

  /**
   * Get statistics about recent activity
   */
  getActivityStats(): {
    totalEvents: number;
    eventsByType: Record<string, number>;
    eventsPerSecond: number;
  } {
    const now = Date.now();
    const recentEvents = this.recentEvents.filter(
      (e) => now - e.timestamp < 60000, // Last minute
    );

    const eventsByType: Record<string, number> = {};
    for (const event of recentEvents) {
      eventsByType[event.type] = (eventsByType[event.type] || 0) + 1;
    }

    return {
      totalEvents: recentEvents.length,
      eventsByType,
      eventsPerSecond: recentEvents.length / 60,
    };
  }
}

export const fileWatcherService = new FileWatcherService();
