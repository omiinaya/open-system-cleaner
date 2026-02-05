import * as os from 'os';
import si from 'systeminformation';
import { auditLogger } from './auditLogger';

export interface ProcessBehavior {
  pid: number;
  name: string;
  startTime: number;
  cpuHistory: number[];
  memoryHistory: number[];
  ioHistory: {
    read: number;
    write: number;
    timestamp: number;
  }[];
  networkHistory: {
    upload: number;
    download: number;
    timestamp: number;
  }[];
  fileAccessHistory: {
    path: string;
    operation: 'read' | 'write' | 'delete';
    timestamp: number;
  }[];
}

export interface ThreatAssessment {
  isMalicious: boolean;
  confidence: number; // 0-1
  threatLevel: 'low' | 'medium' | 'high' | 'critical';
  reasons: string[];
  recommendedAction: 'ignore' | 'monitor' | 'terminate' | 'quarantine';
}

export class BehavioralAnalyzer {
  private behaviors = new Map<number, ProcessBehavior>();
  private readonly HISTORY_LENGTH = 20;
  private readonly SAMPLING_INTERVAL = 5000; // 5 seconds
  private monitoringInterval: NodeJS.Timeout | null = null;

  // Thresholds for threat detection
  private thresholds = {
    cryptoMiner: {
      cpuUsage: 80, // Sustained high CPU
      duration: 60000, // For 1 minute
    },
    ransomware: {
      fileAccessRate: 10, // Files per second
      entropyChange: 0.8, // High entropy files created
    },
    trojan: {
      networkConnections: 20, // Many outbound connections
      dataTransfer: 10485760, // 10MB transferred
    },
    spyware: {
      screenshotFrequency: 0.1, // Screenshots per second
      keyloggerActivity: true,
    },
  };

  /**
   * Start monitoring process behavior
   */
  startMonitoring(): void {
    if (this.monitoringInterval) {
      return;
    }

    this.monitoringInterval = setInterval(async () => {
      await this.sampleProcesses();
    }, this.SAMPLING_INTERVAL);

    auditLogger.log('behavioral_analysis_started', 'behavioralAnalyzer', 'success', {});
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;

      auditLogger.log('behavioral_analysis_stopped', 'behavioralAnalyzer', 'success', {});
    }
  }

  /**
   * Sample current process states
   */
  private async sampleProcesses(): Promise<void> {
    try {
      const processes = await si.processes();

      for (const proc of processes.list) {
        const pid = proc.pid;

        // Get or create behavior record
        let behavior = this.behaviors.get(pid);
        if (!behavior) {
          behavior = {
            pid,
            name: proc.name,
            startTime: Date.now(),
            cpuHistory: [],
            memoryHistory: [],
            ioHistory: [],
            networkHistory: [],
            fileAccessHistory: [],
          };
          this.behaviors.set(pid, behavior);
        }

        // Update history
        this.updateHistory(behavior, proc);

        // Analyze for threats
        const assessment = this.analyzeProcess(pid);
        if (assessment.isMalicious && assessment.confidence > 0.7) {
          await this.handleThreat(pid, behavior.name, assessment);
        }
      }

      // Cleanup old processes
      this.cleanupOldProcesses();
    } catch (error) {
      console.error('Error sampling processes:', error);
    }
  }

  /**
   * Update behavior history for a process
   */
  private updateHistory(behavior: ProcessBehavior, proc: any): void {
    // CPU history
    behavior.cpuHistory.push(proc.cpu);
    if (behavior.cpuHistory.length > this.HISTORY_LENGTH) {
      behavior.cpuHistory.shift();
    }

    // Memory history
    behavior.memoryHistory.push(proc.memRss);
    if (behavior.memoryHistory.length > this.HISTORY_LENGTH) {
      behavior.memoryHistory.shift();
    }

    // IO history
    if (proc.memVsz) {
      behavior.ioHistory.push({
        read: proc.memVsz,
        write: proc.memRss,
        timestamp: Date.now(),
      });
      if (behavior.ioHistory.length > this.HISTORY_LENGTH) {
        behavior.ioHistory.shift();
      }
    }
  }

  /**
   * Analyze a process for malicious behavior
   */
  analyzeProcess(pid: number): ThreatAssessment {
    const behavior = this.behaviors.get(pid);
    if (!behavior) {
      return {
        isMalicious: false,
        confidence: 0,
        threatLevel: 'low',
        reasons: [],
        recommendedAction: 'ignore',
      };
    }

    const reasons: string[] = [];
    let threatScore = 0;

    // Check for cryptomining patterns
    if (this.hasCryptominingPattern(behavior)) {
      reasons.push('Sustained high CPU usage pattern (possible cryptominer)');
      threatScore += 0.4;
    }

    // Check for ransomware patterns
    if (this.hasRansomwarePattern(behavior)) {
      reasons.push('Rapid file system modifications (possible ransomware)');
      threatScore += 0.5;
    }

    // Check for trojan patterns
    if (this.hasTrojanPattern(behavior)) {
      reasons.push('Suspicious network activity (possible trojan)');
      threatScore += 0.3;
    }

    // Check for memory leaks
    if (this.hasMemoryLeakPattern(behavior)) {
      reasons.push('Memory leak detected');
      threatScore += 0.1;
    }

    // Determine threat level and action
    let threatLevel: ThreatAssessment['threatLevel'] = 'low';
    let recommendedAction: ThreatAssessment['recommendedAction'] = 'ignore';

    if (threatScore >= 0.8) {
      threatLevel = 'critical';
      recommendedAction = 'quarantine';
    } else if (threatScore >= 0.6) {
      threatLevel = 'high';
      recommendedAction = 'terminate';
    } else if (threatScore >= 0.4) {
      threatLevel = 'medium';
      recommendedAction = 'monitor';
    }

    return {
      isMalicious: threatScore > 0.3,
      confidence: Math.min(threatScore, 1),
      threatLevel,
      reasons,
      recommendedAction,
    };
  }

  /**
   * Check for cryptomining patterns
   */
  private hasCryptominingPattern(behavior: ProcessBehavior): boolean {
    if (behavior.cpuHistory.length < 5) {
      return false;
    }

    // Check for sustained high CPU usage
    const recentCpu = behavior.cpuHistory.slice(-5);
    const avgCpu = recentCpu.reduce((a, b) => a + b, 0) / recentCpu.length;

    if (avgCpu > this.thresholds.cryptoMiner.cpuUsage) {
      // Check if it's been running for a while
      const runtime = Date.now() - behavior.startTime;
      if (runtime > this.thresholds.cryptoMiner.duration) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check for ransomware patterns
   */
  private hasRansomwarePattern(behavior: ProcessBehavior): boolean {
    // Check for rapid file access
    const recentAccess = behavior.fileAccessHistory.filter(
      a => Date.now() - a.timestamp < 10000 // Last 10 seconds
    );

    if (recentAccess.length > this.thresholds.ransomware.fileAccessRate * 10) {
      return true;
    }

    // Check for write operations to many different files
    const writeOperations = recentAccess.filter(a => a.operation === 'write');
    const uniquePaths = new Set(writeOperations.map(a => a.path)).size;

    if (uniquePaths > 10) {
      return true;
    }

    return false;
  }

  /**
   * Check for trojan patterns
   */
  private hasTrojanPattern(behavior: ProcessBehavior): boolean {
    // Check for many network connections
    if (behavior.networkHistory.length < 3) {
      return false;
    }

    const recentNetwork = behavior.networkHistory.slice(-3);
    const totalUpload = recentNetwork.reduce((sum, n) => sum + n.upload, 0);
    const totalDownload = recentNetwork.reduce((sum, n) => sum + n.download, 0);

    if (totalUpload > this.thresholds.trojan.dataTransfer) {
      return true;
    }

    return false;
  }

  /**
   * Check for memory leak patterns
   */
  private hasMemoryLeakPattern(behavior: ProcessBehavior): boolean {
    if (behavior.memoryHistory.length < 10) {
      return false;
    }

    const memory = behavior.memoryHistory;
    const firstHalf = memory.slice(0, Math.floor(memory.length / 2));
    const secondHalf = memory.slice(Math.floor(memory.length / 2));

    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

    // Memory increased by more than 50%
    if (secondAvg > firstAvg * 1.5) {
      return true;
    }

    return false;
  }

  /**
   * Handle detected threat
   */
  private async handleThreat(
    pid: number,
    processName: string,
    assessment: ThreatAssessment
  ): Promise<void> {
    await auditLogger.log('threat_detected', 'behavioralAnalyzer', 'warning', {
      pid,
      processName,
      threatLevel: assessment.threatLevel,
      confidence: assessment.confidence,
      reasons: assessment.reasons,
      recommendedAction: assessment.recommendedAction,
    });

    // Here you would integrate with your protection system
    // to take the recommended action
  }

  /**
   * Cleanup old process records
   */
  private cleanupOldProcesses(): void {
    const now = Date.now();
    const maxAge = 3600000; // 1 hour

    for (const [pid, behavior] of this.behaviors.entries()) {
      // Check if process is still running
      const lastActivity = Math.max(
        ...behavior.cpuHistory.map((_, i) => Date.now() - (behavior.cpuHistory.length - i) * this.SAMPLING_INTERVAL),
        behavior.startTime
      );

      if (now - lastActivity > maxAge) {
        this.behaviors.delete(pid);
      }
    }
  }

  /**
   * Get behavior record for a process
   */
  getProcessBehavior(pid: number): ProcessBehavior | undefined {
    return this.behaviors.get(pid);
  }

  /**
   * Get all monitored processes
   */
  getAllBehaviors(): ProcessBehavior[] {
    return Array.from(this.behaviors.values());
  }

  /**
   * Record file access for a process
   */
  recordFileAccess(
    pid: number,
    filePath: string,
    operation: 'read' | 'write' | 'delete'
  ): void {
    const behavior = this.behaviors.get(pid);
    if (!behavior) {
      return;
    }

    behavior.fileAccessHistory.push({
      path: filePath,
      operation,
      timestamp: Date.now(),
    });

    // Keep only recent history
    if (behavior.fileAccessHistory.length > 100) {
      behavior.fileAccessHistory.shift();
    }
  }

  /**
   * Record network activity for a process
   */
  recordNetworkActivity(
    pid: number,
    upload: number,
    download: number
  ): void {
    const behavior = this.behaviors.get(pid);
    if (!behavior) {
      return;
    }

    behavior.networkHistory.push({
      upload,
      download,
      timestamp: Date.now(),
    });

    if (behavior.networkHistory.length > this.HISTORY_LENGTH) {
      behavior.networkHistory.shift();
    }
  }
}

export const behavioralAnalyzer = new BehavioralAnalyzer();
