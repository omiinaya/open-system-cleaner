import { autoUpdater, UpdateInfo } from "electron-updater";
import { dialog, ipcMain, app } from "electron";
import log from "electron-log";
import { auditLogger } from "./auditLogger";

export interface UpdateProgress {
  percent: number;
  bytesPerSecond: number;
  transferred: number;
  total: number;
}

export class UpdateManager {
  private isInitialized = false;
  private updateAvailable = false;
  private updateDownloaded = false;
  private lastCheck: Date | null = null;
  private autoDownload = true;
  private autoInstallOnAppQuit = true;
  private allowPrerelease = false;

  constructor() {
    this.setupAutoUpdater();
  }

  /**
   * Setup auto-updater event handlers
   */
  private setupAutoUpdater(): void {
    // Configure logging
    log.transports.file.level = "info";
    autoUpdater.logger = log;

    // Configure auto-updater
    autoUpdater.autoDownload = this.autoDownload;
    autoUpdater.autoInstallOnAppQuit = this.autoInstallOnAppQuit;
    autoUpdater.allowPrerelease = this.allowPrerelease;

    // Event handlers
    autoUpdater.on("checking-for-update", () => {
      log.info("Checking for update...");
      this.lastCheck = new Date();
    });

    autoUpdater.on("update-available", async (info: UpdateInfo) => {
      log.info("Update available:", info);
      this.updateAvailable = true;

      await auditLogger.log("update_available", "updateManager", "success", {
        version: info.version,
        releaseDate: info.releaseDate,
      });

      // Notify renderer process
      this.notifyRenderer("update-available", info);

      // Show notification to user
      if (!this.autoDownload) {
        const response = await dialog.showMessageBox({
          type: "info",
          title: "Update Available",
          message: `A new version (${info.version}) is available.`,
          detail:
            typeof info.releaseNotes === "string"
              ? info.releaseNotes
              : "Update now to get the latest features and improvements.",
          buttons: [
            "Download & Install",
            "Remind Me Later",
            "Skip This Version",
          ],
          defaultId: 0,
          cancelId: 1,
        });

        if (response.response === 0) {
          await this.downloadUpdate();
        }
      }
    });

    autoUpdater.on("update-not-available", (info: UpdateInfo) => {
      log.info("Update not available:", info);

      auditLogger.log("update_not_available", "updateManager", "success", {
        currentVersion: app.getVersion(),
      });
    });

    autoUpdater.on("error", async (err: Error) => {
      log.error("Error in auto-updater:", err);

      await auditLogger.log("update_error", "updateManager", "failure", {
        error: err.message,
      });

      this.notifyRenderer("update-error", { error: err.message });
    });

    autoUpdater.on("download-progress", (progressObj: UpdateProgress) => {
      const logMessage = `Download speed: ${progressObj.bytesPerSecond} - Downloaded ${progressObj.percent}% (${progressObj.transferred}/${progressObj.total})`;
      log.info(logMessage);

      // Notify renderer of progress
      this.notifyRenderer("download-progress", progressObj);
    });

    autoUpdater.on("update-downloaded", async (info: UpdateInfo) => {
      log.info("Update downloaded:", info);
      this.updateDownloaded = true;

      await auditLogger.log("update_downloaded", "updateManager", "success", {
        version: info.version,
      });

      // Notify renderer
      this.notifyRenderer("update-downloaded", info);

      // Ask user to install
      const response = await dialog.showMessageBox({
        type: "info",
        title: "Update Ready",
        message: `Update to version ${info.version} has been downloaded.`,
        detail: "The application will restart to apply the update.",
        buttons: ["Restart Now", "Later"],
        defaultId: 0,
        cancelId: 1,
      });

      if (response.response === 0) {
        this.quitAndInstall();
      }
    });

    this.isInitialized = true;
  }

  /**
   * Check for updates
   */
  async checkForUpdates(): Promise<{ available: boolean; info?: UpdateInfo }> {
    try {
      if (!this.isInitialized) {
        this.setupAutoUpdater();
      }

      const result = await autoUpdater.checkForUpdates();

      return {
        available: result?.updateInfo ? true : false,
        info: result?.updateInfo,
      };
    } catch (error) {
      log.error("Error checking for updates:", error);
      return { available: false };
    }
  }

  /**
   * Download update manually
   */
  async downloadUpdate(): Promise<boolean> {
    try {
      await autoUpdater.downloadUpdate();
      return true;
    } catch (error) {
      log.error("Error downloading update:", error);
      return false;
    }
  }

  /**
   * Quit and install update
   */
  quitAndInstall(): void {
    if (this.updateDownloaded) {
      autoUpdater.quitAndInstall();
    }
  }

  /**
   * Get current update status
   */
  getStatus(): {
    initialized: boolean;
    updateAvailable: boolean;
    updateDownloaded: boolean;
    lastCheck: Date | null;
    currentVersion: string;
  } {
    return {
      initialized: this.isInitialized,
      updateAvailable: this.updateAvailable,
      updateDownloaded: this.updateDownloaded,
      lastCheck: this.lastCheck,
      currentVersion: app.getVersion(),
    };
  }

  /**
   * Configure update settings
   */
  configure(settings: {
    autoDownload?: boolean;
    autoInstallOnAppQuit?: boolean;
    allowPrerelease?: boolean;
  }): void {
    if (settings.autoDownload !== undefined) {
      this.autoDownload = settings.autoDownload;
      autoUpdater.autoDownload = settings.autoDownload;
    }

    if (settings.autoInstallOnAppQuit !== undefined) {
      this.autoInstallOnAppQuit = settings.autoInstallOnAppQuit;
      autoUpdater.autoInstallOnAppQuit = settings.autoInstallOnAppQuit;
    }

    if (settings.allowPrerelease !== undefined) {
      this.allowPrerelease = settings.allowPrerelease;
      autoUpdater.allowPrerelease = settings.allowPrerelease;
    }
  }

  /**
   * Notify renderer process of update events
   */
  private notifyRenderer(channel: string, data: any): void {
    // This would typically send to renderer via IPC
    // For now, just log it
    log.info(`[Renderer Notification] ${channel}:`, data);
  }

  /**
   * Setup IPC handlers for update management
   */
  setupIpcHandlers(): void {
    ipcMain.handle("update:check", async () => {
      return await this.checkForUpdates();
    });

    ipcMain.handle("update:download", async () => {
      return await this.downloadUpdate();
    });

    ipcMain.handle("update:install", () => {
      this.quitAndInstall();
      return true;
    });

    ipcMain.handle("update:getStatus", () => {
      return this.getStatus();
    });

    ipcMain.handle("update:configure", (_event, settings) => {
      this.configure(settings);
      return true;
    });
  }

  /**
   * Start periodic update checks
   */
  startPeriodicChecks(intervalHours = 24): void {
    // Check immediately on startup
    this.checkForUpdates();

    // Then check periodically
    setInterval(
      () => {
        this.checkForUpdates();
      },
      intervalHours * 60 * 60 * 1000,
    );
  }
}

export const updateManager = new UpdateManager();
