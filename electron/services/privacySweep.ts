import * as fs from "fs/promises";
import * as path from "path";
import * as os from "os";

export interface PrivacyItem {
  type: "history" | "cookies" | "cache" | "downloads" | "passwords";
  path: string;
  size: number;
  browser: string;
}

export interface BrowserData {
  name: string;
  dataPath: string;
  items: PrivacyItem[];
}

export class PrivacySweepService {
  private browsers = [
    {
      name: "Chrome",
      dataPath: this.getChromePath(),
      profiles: ["Default", "Profile 1", "Profile 2", "Profile 3"],
    },
    {
      name: "Firefox",
      dataPath: this.getFirefoxPath(),
      profiles: ["*"], // Auto-detect profiles
    },
    {
      name: "Edge",
      dataPath: this.getEdgePath(),
      profiles: ["Default"],
    },
  ];

  private getChromePath(): string {
    if (process.platform === "win32") {
      return path.join(
        os.homedir(),
        "AppData",
        "Local",
        "Google",
        "Chrome",
        "User Data",
      );
    } else if (process.platform === "darwin") {
      return path.join(
        os.homedir(),
        "Library",
        "Application Support",
        "Google",
        "Chrome",
      );
    } else {
      return path.join(os.homedir(), ".config", "google-chrome");
    }
  }

  private getFirefoxPath(): string {
    if (process.platform === "win32") {
      return path.join(
        os.homedir(),
        "AppData",
        "Roaming",
        "Mozilla",
        "Firefox",
        "Profiles",
      );
    } else if (process.platform === "darwin") {
      return path.join(
        os.homedir(),
        "Library",
        "Application Support",
        "Firefox",
        "Profiles",
      );
    } else {
      return path.join(os.homedir(), ".mozilla", "firefox");
    }
  }

  private getEdgePath(): string {
    if (process.platform === "win32") {
      return path.join(
        os.homedir(),
        "AppData",
        "Local",
        "Microsoft",
        "Edge",
        "User Data",
      );
    } else if (process.platform === "darwin") {
      return path.join(
        os.homedir(),
        "Library",
        "Application Support",
        "Microsoft Edge",
      );
    } else {
      return path.join(os.homedir(), ".config", "microsoft-edge");
    }
  }

  async scan(): Promise<BrowserData[]> {
    const results: BrowserData[] = [];

    for (const browser of this.browsers) {
      try {
        const exists = await this.browserExists(browser.dataPath);
        if (exists) {
          const items = await this.scanBrowserData(browser);
          if (items.length > 0) {
            results.push({
              name: browser.name,
              dataPath: browser.dataPath,
              items,
            });
          }
        }
      } catch (error) {
        console.error(`Error scanning ${browser.name}:`, error);
      }
    }

    return results;
  }

  private async browserExists(dataPath: string): Promise<boolean> {
    try {
      await fs.access(dataPath);
      return true;
    } catch {
      return false;
    }
  }

  private async scanBrowserData(browser: {
    name: string;
    dataPath: string;
    profiles: string[];
  }): Promise<PrivacyItem[]> {
    const items: PrivacyItem[] = [];

    for (const profile of browser.profiles) {
      try {
        const profilePath =
          profile === "*"
            ? browser.dataPath
            : path.join(browser.dataPath, profile);

        // Scan cache
        const cachePaths = [
          path.join(profilePath, "Cache"),
          path.join(profilePath, "Code Cache"),
          path.join(profilePath, "GPUCache"),
        ];

        for (const cachePath of cachePaths) {
          const cacheItems = await this.scanDirectory(
            cachePath,
            "cache",
            browser.name,
          );
          items.push(...cacheItems);
        }

        // Scan cookies
        const cookieFiles = [
          path.join(profilePath, "Cookies"),
          path.join(profilePath, "Network", "Cookies"),
        ];

        for (const cookieFile of cookieFiles) {
          try {
            const stats = await fs.stat(cookieFile);
            items.push({
              type: "cookies",
              path: cookieFile,
              size: stats.size,
              browser: browser.name,
            });
          } catch {
            // File doesn't exist
          }
        }

        // Scan history
        const historyFiles = [
          path.join(profilePath, "History"),
          path.join(profilePath, "places.sqlite"),
        ];

        for (const historyFile of historyFiles) {
          try {
            const stats = await fs.stat(historyFile);
            items.push({
              type: "history",
              path: historyFile,
              size: stats.size,
              browser: browser.name,
            });
          } catch {
            // File doesn't exist
          }
        }
      } catch (error) {
        console.error(`Error scanning profile ${profile}:`, error);
      }
    }

    return items;
  }

  private async scanDirectory(
    dirPath: string,
    type: PrivacyItem["type"],
    browser: string,
  ): Promise<PrivacyItem[]> {
    const items: PrivacyItem[] = [];

    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);

        if (entry.isDirectory()) {
          const subItems = await this.scanDirectory(fullPath, type, browser);
          items.push(...subItems);
        } else {
          try {
            const stats = await fs.stat(fullPath);
            items.push({
              type,
              path: fullPath,
              size: stats.size,
              browser,
            });
          } catch {
            // Skip files we can't stat
          }
        }
      }
    } catch {
      // Directory doesn't exist or is not accessible
    }

    return items;
  }

  async cleanItems(
    itemPaths: string[],
  ): Promise<{ success: boolean; cleanedSize: number }> {
    let cleanedSize = 0;
    let success = true;

    for (const itemPath of itemPaths) {
      try {
        const stats = await fs.stat(itemPath);

        if (stats.isDirectory()) {
          await fs.rm(itemPath, { recursive: true, force: true });
        } else {
          await fs.unlink(itemPath);
        }

        cleanedSize += stats.size;
      } catch (error) {
        console.error(`Failed to clean ${itemPath}:`, error);
        success = false;
      }
    }

    return { success, cleanedSize };
  }

  async cleanByType(
    type: PrivacyItem["type"],
  ): Promise<{ success: boolean; cleanedSize: number }> {
    const browsers = await this.scan();
    const itemsToClean = browsers.flatMap((b) =>
      b.items.filter((i) => i.type === type),
    );

    return await this.cleanItems(itemsToClean.map((i) => i.path));
  }

  async cleanByBrowser(
    browserName: string,
  ): Promise<{ success: boolean; cleanedSize: number }> {
    const browsers = await this.scan();
    const browser = browsers.find(
      (b) => b.name.toLowerCase() === browserName.toLowerCase(),
    );

    if (!browser) {
      return { success: false, cleanedSize: 0 };
    }

    return await this.cleanItems(browser.items.map((i) => i.path));
  }
}

export const privacySweepService = new PrivacySweepService();
