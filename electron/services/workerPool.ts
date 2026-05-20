import { Worker, isMainThread, parentPort, workerData } from "worker_threads";
import * as path from "path";
import * as os from "os";
import { auditLogger } from "./auditLogger";

export interface WorkerTask<T, R> {
  id: string;
  data: T;
  priority: number;
}

export interface WorkerResult<R> {
  taskId: string;
  result: R;
  error?: string;
  duration: number;
}

export interface WorkerPoolOptions {
  minWorkers?: number;
  maxWorkers?: number;
  idleTimeoutMs?: number;
  taskTimeoutMs?: number;
}

/**
 * Worker Thread Pool for CPU-intensive operations
 * Manages a pool of worker threads for parallel processing
 */
export class WorkerPool {
  private workers: Worker[] = [];
  private taskQueue: Array<{
    id: string;
    data: any;
    resolve: (value: any) => void;
    reject: (reason: any) => void;
    timestamp: number;
  }> = [];
  private busyWorkers = new Map<Worker, boolean>();
  private options: Required<WorkerPoolOptions>;
  private workerScript: string;
  private isShuttingDown = false;

  constructor(workerScript: string, options: WorkerPoolOptions = {}) {
    this.workerScript = workerScript;
    this.options = {
      minWorkers: options.minWorkers || 2,
      maxWorkers: options.maxWorkers || os.cpus().length,
      idleTimeoutMs: options.idleTimeoutMs || 300000, // 5 minutes
      taskTimeoutMs: options.taskTimeoutMs || 30000, // 30 seconds
    };

    this.initializePool();
  }

  /**
   * Initialize the worker pool with minimum workers
   */
  private initializePool(): void {
    for (let i = 0; i < this.options.minWorkers; i++) {
      this.createWorker();
    }
  }

  /**
   * Create a new worker thread
   */
  private createWorker(): Worker {
    const worker = new Worker(this.workerScript);

    worker.on("message", (result: WorkerResult<any>) => {
      this.handleWorkerMessage(worker, result);
    });

    worker.on("error", (error) => {
      console.error("Worker error:", error);
      this.handleWorkerError(worker, error);
    });

    worker.on("exit", (code) => {
      if (code !== 0) {
        console.error(`Worker stopped with exit code ${code}`);
        this.replaceWorker(worker);
      }
    });

    this.workers.push(worker);
    this.busyWorkers.set(worker, false);

    return worker;
  }

  /**
   * Replace a failed worker
   */
  private replaceWorker(oldWorker: Worker): void {
    const index = this.workers.indexOf(oldWorker);
    if (index > -1) {
      this.workers.splice(index, 1);
      this.busyWorkers.delete(oldWorker);
    }

    if (!this.isShuttingDown) {
      this.createWorker();
    }
  }

  /**
   * Handle messages from workers
   */
  private handleWorkerMessage(worker: Worker, result: WorkerResult<any>): void {
    const task = this.taskQueue.find((t) => t.id === result.taskId);
    if (task) {
      if (result.error) {
        task.reject(new Error(result.error));
      } else {
        task.resolve(result.result);
      }

      // Remove from queue
      const index = this.taskQueue.indexOf(task);
      if (index > -1) {
        this.taskQueue.splice(index, 1);
      }
    }

    // Mark worker as available
    this.busyWorkers.set(worker, false);

    // Process next task
    this.processQueue();
  }

  /**
   * Handle worker errors
   */
  private handleWorkerError(worker: Worker, error: Error): void {
    // Find pending tasks for this worker and reject them
    // In a real implementation, you'd track which worker is processing which task
    console.error("Worker error:", error);
    this.replaceWorker(worker);
  }

  /**
   * Execute a task in a worker thread
   */
  async execute<T, R>(data: T): Promise<R> {
    if (this.isShuttingDown) {
      throw new Error("Worker pool is shutting down");
    }

    const taskId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    return new Promise((resolve, reject) => {
      const task = {
        id: taskId,
        data,
        resolve,
        reject,
        timestamp: Date.now(),
      };

      this.taskQueue.push(task);
      this.processQueue();

      // Set timeout
      setTimeout(() => {
        const index = this.taskQueue.indexOf(task);
        if (index > -1) {
          this.taskQueue.splice(index, 1);
          reject(new Error("Task timeout"));
        }
      }, this.options.taskTimeoutMs);
    });
  }

  /**
   * Process the task queue
   */
  private processQueue(): void {
    if (this.taskQueue.length === 0) return;

    // Find available worker
    const availableWorker = this.workers.find(
      (worker) => !this.busyWorkers.get(worker),
    );

    if (availableWorker) {
      const task = this.taskQueue[0];

      // Check if we need more workers
      if (!availableWorker && this.workers.length < this.options.maxWorkers) {
        this.createWorker();
        return;
      }

      if (availableWorker) {
        this.busyWorkers.set(availableWorker, true);

        availableWorker.postMessage({
          taskId: task.id,
          data: task.data,
        });
      }
    }
  }

  /**
   * Execute multiple tasks in parallel
   */
  async executeBatch<T, R>(items: T[], maxConcurrency?: number): Promise<R[]> {
    const concurrency = maxConcurrency || this.options.maxWorkers;
    const results: R[] = new Array(items.length);
    const errors: (Error | null)[] = new Array(items.length).fill(null);

    // Process in chunks
    for (let i = 0; i < items.length; i += concurrency) {
      const chunk = items.slice(i, i + concurrency);
      const promises = chunk.map((item, index) =>
        this.execute<T, R>(item)
          .then((result) => {
            results[i + index] = result;
          })
          .catch((error) => {
            errors[i + index] = error;
            results[i + index] = null as any;
          }),
      );

      await Promise.all(promises);
    }

    // Check for errors
    const failedTasks = errors.filter((e) => e !== null);
    if (failedTasks.length > 0) {
      console.warn(`${failedTasks.length} tasks failed`);
    }

    return results;
  }

  /**
   * Map operation using worker threads (like Array.map but parallel)
   */
  async map<T, R>(
    items: T[],
    mapper: (item: T) => R | Promise<R>,
    options: { batchSize?: number } = {},
  ): Promise<R[]> {
    const batchSize = options.batchSize || 100;
    const results: R[] = [];

    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map((item) => this.execute<T, R>(item)),
      );
      results.push(...batchResults);

      // Progress update
      if (i % 1000 === 0) {
        console.log(`Mapped ${i}/${items.length} items...`);
      }
    }

    return results;
  }

  /**
   * Filter operation using worker threads
   */
  async filter<T>(
    items: T[],
    predicate: (item: T) => boolean | Promise<boolean>,
    options: { batchSize?: number } = {},
  ): Promise<T[]> {
    const batchSize = options.batchSize || 100;
    const results: T[] = [];

    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const mask = await Promise.all(
        batch.map((item) => this.execute<T, boolean>(item)),
      );

      for (let j = 0; j < batch.length; j++) {
        if (mask[j]) {
          results.push(batch[j]);
        }
      }
    }

    return results;
  }

  /**
   * Reduce operation using worker threads
   */
  async reduce<T, R>(
    items: T[],
    reducer: (acc: R, item: T) => R | Promise<R>,
    initialValue: R,
  ): Promise<R> {
    let result = initialValue;

    for (const item of items) {
      result = await this.execute<{ acc: R; item: T }, R>({
        acc: result,
        item,
      });
    }

    return result;
  }

  /**
   * Get pool statistics
   */
  getStats(): {
    totalWorkers: number;
    busyWorkers: number;
    idleWorkers: number;
    queueLength: number;
  } {
    const busy = Array.from(this.busyWorkers.values()).filter(Boolean).length;

    return {
      totalWorkers: this.workers.length,
      busyWorkers: busy,
      idleWorkers: this.workers.length - busy,
      queueLength: this.taskQueue.length,
    };
  }

  /**
   * Shutdown the worker pool
   */
  async shutdown(): Promise<void> {
    this.isShuttingDown = true;

    // Wait for queued tasks to complete (with timeout)
    const shutdownTimeout = 30000; // 30 seconds
    const startTime = Date.now();

    while (
      this.taskQueue.length > 0 &&
      Date.now() - startTime < shutdownTimeout
    ) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    // Terminate all workers
    const terminatePromises = this.workers.map((worker) => worker.terminate());

    await Promise.all(terminatePromises);

    this.workers = [];
    this.busyWorkers.clear();
    this.taskQueue = [];

    await auditLogger.log("worker_pool_shutdown", "workerPool", "success", {});
  }
}

/**
 * Create a worker script for file hashing
 */
export function createFileHashWorkerScript(): string {
  return `
const { parentPort } = require('worker_threads');
const crypto = require('crypto');
const fs = require('fs');

parentPort.on('message', async ({ taskId, data }) => {
  const startTime = Date.now();
  
  try {
    const { filePath } = data;
    
    // Stream hash the file
    const hash = crypto.createHash('md5');
    const stream = fs.createReadStream(filePath);
    
    await new Promise((resolve, reject) => {
      stream.on('error', reject);
      stream.on('data', chunk => hash.update(chunk));
      stream.on('end', resolve);
    });
    
    const result = {
      filePath,
      hash: hash.digest('hex'),
    };
    
    parentPort.postMessage({
      taskId,
      result,
      duration: Date.now() - startTime,
    });
  } catch (error) {
    parentPort.postMessage({
      taskId,
      error: error.message,
      duration: Date.now() - startTime,
    });
  }
});
  `;
}

/**
 * Create a worker script for CPU-intensive calculations
 */
export function createCalculationWorkerScript(): string {
  return `
const { parentPort } = require('worker_threads');

parentPort.on('message', async ({ taskId, data }) => {
  const startTime = Date.now();
  
  try {
    const { operation, values } = data;
    let result;
    
    switch (operation) {
      case 'sum':
        result = values.reduce((a, b) => a + b, 0);
        break;
      case 'average':
        result = values.reduce((a, b) => a + b, 0) / values.length;
        break;
      case 'max':
        result = Math.max(...values);
        break;
      case 'min':
        result = Math.min(...values);
        break;
      default:
        throw new Error('Unknown operation: ' + operation);
    }
    
    parentPort.postMessage({
      taskId,
      result,
      duration: Date.now() - startTime,
    });
  } catch (error) {
    parentPort.postMessage({
      taskId,
      error: error.message,
      duration: Date.now() - startTime,
    });
  }
});
  `;
}

/**
 * Parallel file processor using worker threads
 */
export class ParallelFileProcessor {
  private workerPool: WorkerPool | null = null;
  private workerScriptPath: string;

  constructor() {
    // Create a temporary worker script
    this.workerScriptPath = path.join(__dirname, "file-hash-worker.js");
    this.createWorkerScript();
  }

  private createWorkerScript(): void {
    const fs = require("fs");
    const script = createFileHashWorkerScript();
    fs.writeFileSync(this.workerScriptPath, script);
  }

  /**
   * Initialize the worker pool
   */
  initialize(): void {
    if (!this.workerPool) {
      this.workerPool = new WorkerPool(this.workerScriptPath, {
        minWorkers: 2,
        maxWorkers: os.cpus().length,
      });
    }
  }

  /**
   * Hash multiple files in parallel
   */
  async hashFiles(
    filePaths: string[],
  ): Promise<Array<{ filePath: string; hash: string }>> {
    this.initialize();

    if (!this.workerPool) {
      throw new Error("Worker pool not initialized");
    }

    const startTime = Date.now();

    try {
      const results = await this.workerPool.executeBatch<
        { filePath: string },
        { filePath: string; hash: string }
      >(filePaths.map((filePath) => ({ filePath })));

      const duration = Date.now() - startTime;
      console.log(
        `Hashed ${filePaths.length} files in ${duration}ms using worker threads`,
      );

      return results;
    } catch (error) {
      console.error("Error hashing files:", error);
      throw error;
    }
  }

  /**
   * Process files in parallel with custom processor
   */
  async processFiles<T, R>(
    filePaths: string[],
    processor: (filePath: string) => T,
    options: { batchSize?: number } = {},
  ): Promise<R[]> {
    this.initialize();

    if (!this.workerPool) {
      throw new Error("Worker pool not initialized");
    }

    const batchSize = options.batchSize || 50;
    const results: R[] = [];

    for (let i = 0; i < filePaths.length; i += batchSize) {
      const batch = filePaths.slice(i, i + batchSize);
      const batchResults = await this.workerPool.executeBatch<T, R>(
        batch.map(processor),
      );
      results.push(...batchResults);

      if (i % 500 === 0) {
        console.log(`Processed ${i}/${filePaths.length} files...`);
      }
    }

    return results;
  }

  /**
   * Get processing statistics
   */
  getStats(): {
    totalWorkers: number;
    busyWorkers: number;
    idleWorkers: number;
    queueLength: number;
  } | null {
    if (!this.workerPool) {
      return null;
    }
    return this.workerPool.getStats();
  }

  /**
   * Shutdown the processor
   */
  async shutdown(): Promise<void> {
    if (this.workerPool) {
      await this.workerPool.shutdown();
      this.workerPool = null;
    }

    // Cleanup worker script
    try {
      const fs = require("fs");
      fs.unlinkSync(this.workerScriptPath);
    } catch {
      // Ignore cleanup errors
    }
  }
}

export const parallelFileProcessor = new ParallelFileProcessor();
