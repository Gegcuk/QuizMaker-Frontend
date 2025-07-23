// Polling utility for job status monitoring
// Used for long-running operations like document processing and quiz generation

import { JobStatus } from '../types/common.types';

/**
 * Polling configuration options
 */
export interface PollingConfig {
  /** Initial delay before first poll (ms) */
  initialDelay?: number;
  /** Interval between polls (ms) */
  interval?: number;
  /** Maximum number of polls before giving up */
  maxAttempts?: number;
  /** Exponential backoff multiplier */
  backoffMultiplier?: number;
  /** Maximum interval between polls (ms) */
  maxInterval?: number;
  /** Timeout for each individual request (ms) */
  requestTimeout?: number;
}

/**
 * Default polling configuration
 */
export const DEFAULT_POLLING_CONFIG: Required<PollingConfig> = {
  initialDelay: 1000,
  interval: 2000,
  maxAttempts: 30,
  backoffMultiplier: 1.5,
  maxInterval: 30000,
  requestTimeout: 10000,
};

/**
 * Polling result
 */
export interface PollingResult<T> {
  /** Final result data */
  data: T | undefined;
  /** Number of attempts made */
  attempts: number;
  /** Total time elapsed (ms) */
  elapsed: number;
  /** Whether polling was cancelled */
  cancelled: boolean;
}

/**
 * Polling status callback
 */
export type PollingStatusCallback = (status: JobStatus, attempt: number, elapsed: number) => void;

/**
 * Polling error callback
 */
export type PollingErrorCallback = (error: Error, attempt: number, elapsed: number) => void;

/**
 * Job status poller for long-running operations
 */
export class JobStatusPoller {
  private config: Required<PollingConfig>;
  private abortController: AbortController | null = null;

  constructor(config: PollingConfig = {}) {
    this.config = { ...DEFAULT_POLLING_CONFIG, ...config };
  }

  /**
   * Poll for job status until completion
   */
  async pollJobStatus<T>(
    jobId: string,
    statusChecker: (jobId: string) => Promise<JobStatus>,
    onStatus?: PollingStatusCallback,
    onError?: PollingErrorCallback
  ): Promise<PollingResult<T>> {
    const startTime = Date.now();
    let attempts = 0;
    let currentInterval = this.config.interval;

    // Create abort controller for cancellation
    this.abortController = new AbortController();

    try {
      // Initial delay
      await this.delay(this.config.initialDelay);

      while (attempts < this.config.maxAttempts) {
        attempts++;

        try {
          // Check job status
          const status = await this.withTimeout(
            statusChecker(jobId),
            this.config.requestTimeout
          );

          const elapsed = Date.now() - startTime;

          // Call status callback
          if (onStatus) {
            onStatus(status, attempts, elapsed);
          }

          // Check if job is complete
          if (status.status === 'COMPLETED') {
            return {
              data: status.result as T,
              attempts,
              elapsed,
              cancelled: false,
            };
          }

          // Check if job failed
          if (status.status === 'FAILED') {
            throw new Error(status.error || 'Job failed');
          }

          // Check if job was cancelled
          if (status.status === 'CANCELLED') {
            throw new Error('Job was cancelled');
          }

          // Wait before next poll
          await this.delay(currentInterval);

          // Apply exponential backoff
          currentInterval = Math.min(
            currentInterval * this.config.backoffMultiplier,
            this.config.maxInterval
          );

        } catch (error) {
          const elapsed = Date.now() - startTime;

          // Call error callback
          if (onError) {
            onError(error as Error, attempts, elapsed);
          }

          // If it's the last attempt, throw the error
          if (attempts >= this.config.maxAttempts) {
            throw error;
          }

          // Wait before retry
          await this.delay(currentInterval);
        }
      }

      throw new Error(`Polling timed out after ${attempts} attempts`);

    } catch (error) {
      const elapsed = Date.now() - startTime;
      
      // If polling was cancelled, return cancelled result
      if (this.abortController?.signal.aborted) {
        return {
          data: undefined,
          attempts,
          elapsed,
          cancelled: true,
        };
      }

      throw error;
    }
  }

  /**
   * Cancel ongoing polling
   */
  cancel(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }

  /**
   * Delay utility with abort support
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(resolve, ms);
      
      if (this.abortController) {
        this.abortController.signal.addEventListener('abort', () => {
          clearTimeout(timeout);
          reject(new Error('Polling cancelled'));
        });
      }
    });
  }

  /**
   * Timeout wrapper for requests
   */
  private async withTimeout<T>(promise: Promise<T>, timeout: number): Promise<T> {
    return Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), timeout);
      }),
    ]);
  }
}

/**
 * Simple polling function for basic use cases
 */
export async function pollJobStatus<T>(
  jobId: string,
  statusChecker: (jobId: string) => Promise<JobStatus>,
  config?: PollingConfig,
  onStatus?: PollingStatusCallback,
  onError?: PollingErrorCallback
): Promise<T> {
  const poller = new JobStatusPoller(config);
  const result = await poller.pollJobStatus(jobId, statusChecker, onStatus, onError);
  
  if (result.cancelled) {
    throw new Error('Polling was cancelled');
  }
  
  return result.data;
}

/**
 * Polling with progress tracking
 */
export async function pollWithProgress<T>(
  jobId: string,
  statusChecker: (jobId: string) => Promise<JobStatus>,
  onProgress?: (progress: number, message?: string) => void,
  config?: PollingConfig
): Promise<T> {
  return pollJobStatus(
    jobId,
    statusChecker,
    config,
    (status, attempt, elapsed) => {
      if (onProgress && status.progress !== undefined) {
        onProgress(status.progress, status.message);
      }
    }
  );
}

/**
 * Polling with retry logic for network errors
 */
export async function pollWithRetry<T>(
  jobId: string,
  statusChecker: (jobId: string) => Promise<JobStatus>,
  config?: PollingConfig,
  retryConfig?: {
    maxRetries: number;
    retryDelay: number;
  }
): Promise<T> {
  const maxRetries = retryConfig?.maxRetries || 3;
  const retryDelay = retryConfig?.retryDelay || 1000;

  for (let retry = 0; retry <= maxRetries; retry++) {
    try {
      return await pollJobStatus(jobId, statusChecker, config);
    } catch (error) {
      if (retry === maxRetries) {
        throw error;
      }

      // Only retry on network errors
      if (error instanceof Error && error.message.includes('Network')) {
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        continue;
      }

      throw error;
    }
  }

  throw new Error('Max retries exceeded');
}

/**
 * Batch polling for multiple jobs
 */
export async function pollMultipleJobs<T>(
  jobIds: string[],
  statusChecker: (jobId: string) => Promise<JobStatus>,
  config?: PollingConfig,
  onProgress?: (completed: number, total: number) => void
): Promise<T[]> {
  const results: T[] = [];
  let completed = 0;

  const pollPromises = jobIds.map(async (jobId, index) => {
    try {
      const result = await pollJobStatus<T>(jobId, statusChecker, config);
      results[index] = result;
      completed++;
      
      if (onProgress) {
        onProgress(completed, jobIds.length);
      }
      
      return result;
    } catch (error) {
      completed++;
      
      if (onProgress) {
        onProgress(completed, jobIds.length);
      }
      
      throw error;
    }
  });

  return Promise.all(pollPromises);
}

/**
 * Polling with custom completion condition
 */
export async function pollUntilCondition<T>(
  jobId: string,
  statusChecker: (jobId: string) => Promise<JobStatus>,
  condition: (status: JobStatus) => boolean,
  config?: PollingConfig
): Promise<JobStatus> {
  const poller = new JobStatusPoller(config);
  
  return new Promise((resolve, reject) => {
    poller.pollJobStatus(
      jobId,
      statusChecker,
      (status) => {
        if (condition(status)) {
          poller.cancel();
          resolve(status);
        }
      },
      (error) => {
        reject(error);
      }
    );
  });
} 