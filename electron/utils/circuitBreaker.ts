/**
 * Circuit Breaker Pattern Implementation
 * Prevents cascading failures by stopping calls to failing services
 */

export type CircuitState = "CLOSED" | "OPEN" | "HALF_OPEN";

export interface CircuitBreakerOptions {
  failureThreshold?: number;
  resetTimeout?: number;
  monitoringPeriod?: number;
}

export class CircuitBreaker {
  private state: CircuitState = "CLOSED";
  private failures = 0;
  private nextAttempt = Date.now();
  private lastFailureTime?: number;

  private readonly failureThreshold: number;
  private readonly resetTimeout: number;
  private readonly monitoringPeriod: number;

  constructor(
    private name: string,
    options: CircuitBreakerOptions = {},
  ) {
    this.failureThreshold = options.failureThreshold || 5;
    this.resetTimeout = options.resetTimeout || 60000; // 1 minute
    this.monitoringPeriod = options.monitoringPeriod || 60000; // 1 minute
  }

  /**
   * Execute a function with circuit breaker protection
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === "OPEN") {
      if (Date.now() < this.nextAttempt) {
        throw new Error(`Circuit breaker '${this.name}' is OPEN`);
      }
      // Try half-open
      this.state = "HALF_OPEN";
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    if (this.state === "HALF_OPEN") {
      // Reset after successful call in half-open state
      this.reset();
    }
  }

  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.failures >= this.failureThreshold) {
      this.trip();
    }
  }

  private trip(): void {
    this.state = "OPEN";
    this.nextAttempt = Date.now() + this.resetTimeout;
    console.warn(
      `Circuit breaker '${this.name}' tripped. Next attempt at ${new Date(this.nextAttempt).toISOString()}`,
    );
  }

  private reset(): void {
    this.state = "CLOSED";
    this.failures = 0;
    this.lastFailureTime = undefined;
    console.log(`Circuit breaker '${this.name}' reset`);
  }

  /**
   * Get current circuit breaker state
   */
  getState(): CircuitState {
    return this.state;
  }

  /**
   * Get failure count
   */
  getFailureCount(): number {
    return this.failures;
  }

  /**
   * Force circuit breaker to reset (for testing)
   */
  forceReset(): void {
    this.reset();
  }
}

// Predefined circuit breakers for common services
export const circuitBreakers = {
  systemMetrics: new CircuitBreaker("systemMetrics", {
    failureThreshold: 3,
    resetTimeout: 30000, // 30 seconds
  }),
  junkFileScan: new CircuitBreaker("junkFileScan", {
    failureThreshold: 5,
    resetTimeout: 60000, // 1 minute
  }),
  ramOptimize: new CircuitBreaker("ramOptimize", {
    failureThreshold: 3,
    resetTimeout: 30000, // 30 seconds
  }),
};
