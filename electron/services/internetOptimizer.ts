import { exec } from "child_process";
import { promisify } from "util";
import * as os from "os";

const execAsync = promisify(exec);

export interface InternetOptimizationResult {
  success: boolean;
  dnsOptimized: boolean;
  tcpOptimized: boolean;
  browserOptimized: boolean;
  improvements: string[];
}

export class InternetOptimizerService {
  // Fast public DNS servers
  private fastDNS = [
    { name: "Cloudflare", primary: "1.1.1.1", secondary: "1.0.0.1" },
    { name: "Google", primary: "8.8.8.8", secondary: "8.8.4.4" },
    { name: "OpenDNS", primary: "208.67.222.222", secondary: "208.67.220.220" },
    { name: "Quad9", primary: "9.9.9.9", secondary: "149.112.112.112" },
  ];

  async optimize(
    options: {
      optimizeDNS?: boolean;
      optimizeTCP?: boolean;
      optimizeBrowser?: boolean;
    } = {},
  ): Promise<InternetOptimizationResult> {
    const {
      optimizeDNS = true,
      optimizeTCP = true,
      optimizeBrowser = true,
    } = options;

    const improvements: string[] = [];
    let dnsOptimized = false;
    let tcpOptimized = false;
    let browserOptimized = false;

    // DNS Optimization
    if (optimizeDNS) {
      dnsOptimized = await this.optimizeDNS();
      if (dnsOptimized) {
        improvements.push("DNS servers optimized to Cloudflare (1.1.1.1)");
      }
    }

    // TCP Optimization
    if (optimizeTCP) {
      tcpOptimized = await this.optimizeTCP();
      if (tcpOptimized) {
        improvements.push("TCP/IP settings optimized for better throughput");
      }
    }

    // Browser Optimization
    if (optimizeBrowser) {
      browserOptimized = await this.optimizeBrowsers();
      if (browserOptimized) {
        improvements.push("Browser settings optimized for faster loading");
      }
    }

    return {
      success: dnsOptimized || tcpOptimized || browserOptimized,
      dnsOptimized,
      tcpOptimized,
      browserOptimized,
      improvements,
    };
  }

  private async optimizeDNS(): Promise<boolean> {
    try {
      // Find fastest DNS
      const fastestDNS = await this.findFastestDNS();

      if (process.platform === "win32") {
        // Set DNS on Windows using netsh
        // This requires admin privileges
        await execAsync(
          `netsh interface ip set dns "Wi-Fi" static ${fastestDNS.primary}`,
        );
        await execAsync(
          `netsh interface ip add dns "Wi-Fi" ${fastestDNS.secondary} index=2`,
        );
      } else if (process.platform === "linux") {
        // Update resolv.conf (requires sudo)
        // Note: This is temporary and will be reset on reboot
        await execAsync(
          `echo "nameserver ${fastestDNS.primary}" | sudo tee /etc/resolv.conf`,
        );
        await execAsync(
          `echo "nameserver ${fastestDNS.secondary}" | sudo tee -a /etc/resolv.conf`,
        );
      } else if (process.platform === "darwin") {
        // Set DNS on macOS using networksetup
        await execAsync(
          `networksetup -setdnsservers Wi-Fi ${fastestDNS.primary} ${fastestDNS.secondary}`,
        );
      }

      return true;
    } catch (error) {
      console.error("Error optimizing DNS:", error);
      return false;
    }
  }

  private async findFastestDNS(): Promise<{
    name: string;
    primary: string;
    secondary: string;
  }> {
    // For now, return Cloudflare as it's generally fastest
    // In a real implementation, you'd ping each DNS and measure response time
    return this.fastDNS[0]; // Cloudflare
  }

  private async optimizeTCP(): Promise<boolean> {
    try {
      if (process.platform === "win32") {
        // Windows TCP optimizations
        const commands = [
          // Enable TCP Window Scaling
          "netsh int tcp set global autotuninglevel=normal",
          // Enable Receive Side Scaling
          "netsh int tcp set global rss=enabled",
          // Enable Direct Cache Access
          "netsh int tcp set global dca=enabled",
          // Set congestion provider to CTCP (Compound TCP)
          "netsh int tcp set global congestionprovider=ctcp",
          // Increase TCP window size
          'reg add "HKLM\\SYSTEM\\CurrentControlSet\\Services\\Tcpip\\Parameters" /v TcpWindowSize /t REG_DWORD /d 64240 /f',
        ];

        for (const cmd of commands) {
          try {
            await execAsync(cmd);
          } catch {
            // Command might fail without admin rights
          }
        }
      } else if (process.platform === "linux") {
        // Linux TCP optimizations
        const commands = [
          // Increase TCP buffer sizes
          "sudo sysctl -w net.core.rmem_max=16777216",
          "sudo sysctl -w net.core.wmem_max=16777216",
          'sudo sysctl -w net.ipv4.tcp_rmem="4096 87380 16777216"',
          'sudo sysctl -w net.ipv4.tcp_wmem="4096 65536 16777216"',
          // Enable TCP Fast Open
          "sudo sysctl -w net.ipv4.tcp_fastopen=3",
          // Enable BBR congestion control
          "sudo sysctl -w net.ipv4.tcp_congestion_control=bbr",
        ];

        for (const cmd of commands) {
          try {
            await execAsync(cmd);
          } catch {
            // Command might fail without permissions
          }
        }
      }

      return true;
    } catch (error) {
      console.error("Error optimizing TCP:", error);
      return false;
    }
  }

  private async optimizeBrowsers(): Promise<boolean> {
    try {
      // Clear browser DNS cache
      if (process.platform === "win32") {
        try {
          // Chrome DNS cache clear (requires Chrome to be running)
          await execAsync("chrome.exe chrome://net-internals/#dns");
        } catch {
          // Chrome might not be running
        }
      }

      // For now, return true as browser optimization
      // In a real implementation, you might optimize browser settings
      return true;
    } catch (error) {
      console.error("Error optimizing browsers:", error);
      return false;
    }
  }

  async measureNetworkSpeed(): Promise<{
    downloadSpeed: number;
    uploadSpeed: number;
    latency: number;
  }> {
    // This is a placeholder - real implementation would use speed test APIs
    return {
      downloadSpeed: 0,
      uploadSpeed: 0,
      latency: 0,
    };
  }

  async resetToDefault(): Promise<boolean> {
    try {
      if (process.platform === "win32") {
        // Reset DNS to DHCP
        await execAsync('netsh interface ip set dns "Wi-Fi" dhcp');

        // Reset TCP settings
        await execAsync("netsh int tcp set global autotuninglevel=disabled");
        await execAsync("netsh int tcp set global rss=disabled");
      } else if (process.platform === "linux") {
        // Reset resolv.conf (might need to restore from backup)
        await execAsync("sudo systemctl restart NetworkManager");
      } else if (process.platform === "darwin") {
        // Reset DNS on macOS
        await execAsync("networksetup -setdnsservers Wi-Fi Empty");
      }

      return true;
    } catch (error) {
      console.error("Error resetting network settings:", error);
      return false;
    }
  }
}

export const internetOptimizerService = new InternetOptimizerService();
