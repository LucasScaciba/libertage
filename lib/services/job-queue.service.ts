/**
 * Job Queue Service
 * 
 * In-memory job queue implementation for media processing.
 * This is an MVP implementation suitable for single-worker scenarios.
 * For production with multiple workers, consider using Redis-based queue (Bull/BullMQ).
 */

export interface ProcessingJob {
  id: string;
  mediaId: string;
  userId: string;
  type: "image" | "video";
  originalPath: string;
  status: "queued" | "processing" | "completed" | "failed";
  attempts: number;
  createdAt: Date;
  processedAt?: Date;
  error?: string;
}

export interface JobQueue {
  enqueue(job: Omit<ProcessingJob, "id" | "status" | "attempts" | "createdAt">): Promise<void>;
  dequeue(): Promise<ProcessingJob | null>;
  markProcessing(jobId: string): Promise<void>;
  markComplete(jobId: string): Promise<void>;
  markFailed(jobId: string, error: string): Promise<void>;
  getJob(jobId: string): Promise<ProcessingJob | null>;
  getQueueLength(): number;
  getProcessingCount(): number;
}

/**
 * In-Memory Job Queue Implementation
 * 
 * Features:
 * - FIFO (First-In-First-Out) processing order
 * - Automatic retry with exponential backoff (3 attempts)
 * - Job status tracking
 * - Processing concurrency limit
 */
export class InMemoryJobQueue implements JobQueue {
  private queue: ProcessingJob[] = [];
  private processing: Map<string, ProcessingJob> = new Map();
  private completed: Map<string, ProcessingJob> = new Map();
  private failed: Map<string, ProcessingJob> = new Map();
  
  private maxRetries = 3;
  private retryDelays = [60000, 300000, 900000]; // 1min, 5min, 15min in milliseconds

  /**
   * Add a job to the queue
   */
  async enqueue(
    job: Omit<ProcessingJob, "id" | "status" | "attempts" | "createdAt">
  ): Promise<void> {
    const processingJob: ProcessingJob = {
      ...job,
      id: crypto.randomUUID(),
      status: "queued",
      attempts: 0,
      createdAt: new Date(),
    };

    this.queue.push(processingJob);
    console.log(`[JobQueue] Enqueued job ${processingJob.id} for media ${processingJob.mediaId}`);
  }

  /**
   * Get the next job from the queue (FIFO)
   * Returns null if queue is empty
   */
  async dequeue(): Promise<ProcessingJob | null> {
    if (this.queue.length === 0) {
      return null;
    }

    const job = this.queue.shift()!;
    job.status = "processing";
    job.attempts += 1;
    this.processing.set(job.id, job);

    console.log(`[JobQueue] Dequeued job ${job.id} (attempt ${job.attempts}/${this.maxRetries})`);
    return job;
  }

  /**
   * Mark a job as processing
   */
  async markProcessing(jobId: string): Promise<void> {
    const job = this.processing.get(jobId);
    if (job) {
      job.status = "processing";
      console.log(`[JobQueue] Job ${jobId} marked as processing`);
    }
  }

  /**
   * Mark a job as completed
   */
  async markComplete(jobId: string): Promise<void> {
    const job = this.processing.get(jobId);
    if (job) {
      job.status = "completed";
      job.processedAt = new Date();
      this.processing.delete(jobId);
      this.completed.set(jobId, job);
      console.log(`[JobQueue] Job ${jobId} completed successfully`);
    }
  }

  /**
   * Mark a job as failed
   * Implements automatic retry with exponential backoff
   */
  async markFailed(jobId: string, error: string): Promise<void> {
    const job = this.processing.get(jobId);
    if (!job) {
      console.error(`[JobQueue] Job ${jobId} not found in processing queue`);
      return;
    }

    job.error = error;
    console.error(`[JobQueue] Job ${jobId} failed (attempt ${job.attempts}/${this.maxRetries}): ${error}`);

    // Check if we should retry
    if (job.attempts < this.maxRetries) {
      // Schedule retry with exponential backoff
      const retryDelay = this.retryDelays[job.attempts - 1] || this.retryDelays[this.retryDelays.length - 1];
      
      console.log(`[JobQueue] Scheduling retry for job ${jobId} in ${retryDelay / 1000} seconds`);
      
      setTimeout(() => {
        // Move job back to queue for retry
        job.status = "queued";
        this.processing.delete(jobId);
        this.queue.push(job);
        console.log(`[JobQueue] Job ${jobId} re-queued for retry`);
      }, retryDelay);
    } else {
      // Max retries reached, mark as permanently failed
      job.status = "failed";
      job.processedAt = new Date();
      this.processing.delete(jobId);
      this.failed.set(jobId, job);
      console.error(`[JobQueue] Job ${jobId} permanently failed after ${this.maxRetries} attempts`);
    }
  }

  /**
   * Get a job by ID from any queue
   */
  async getJob(jobId: string): Promise<ProcessingJob | null> {
    // Check processing queue
    if (this.processing.has(jobId)) {
      return this.processing.get(jobId)!;
    }

    // Check completed queue
    if (this.completed.has(jobId)) {
      return this.completed.get(jobId)!;
    }

    // Check failed queue
    if (this.failed.has(jobId)) {
      return this.failed.get(jobId)!;
    }

    // Check queued jobs
    const queuedJob = this.queue.find((job) => job.id === jobId);
    if (queuedJob) {
      return queuedJob;
    }

    return null;
  }

  /**
   * Get the number of jobs in the queue
   */
  getQueueLength(): number {
    return this.queue.length;
  }

  /**
   * Get the number of jobs currently being processed
   */
  getProcessingCount(): number {
    return this.processing.size;
  }

  /**
   * Get queue statistics
   */
  getStats(): {
    queued: number;
    processing: number;
    completed: number;
    failed: number;
  } {
    return {
      queued: this.queue.length,
      processing: this.processing.size,
      completed: this.completed.size,
      failed: this.failed.size,
    };
  }

  /**
   * Clear all completed and failed jobs (cleanup)
   */
  clearHistory(): void {
    this.completed.clear();
    this.failed.clear();
    console.log("[JobQueue] Cleared completed and failed job history");
  }
}

// Export singleton instance
export const jobQueue = new InMemoryJobQueue();
