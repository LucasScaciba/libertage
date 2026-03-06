// Import modules (dotenv is loaded in worker.ts)
import { mediaProcessor } from "../services/media-processor.service";
import { supabaseAdmin } from "../supabase/worker";
import type { ProcessingJob } from "../services/job-queue.service";

// Make supabaseAdmin available globally for services
(global as any).supabaseAdmin = supabaseAdmin;

/**
 * Media Processor Worker
 * 
 * Background worker that processes media jobs from the database.
 * Uses the database as a queue (polls for queued media records).
 * 
 * Features:
 * - Polls database every 1 second
 * - Processes up to 3 jobs concurrently
 * - Automatic retry on failure (handled by media processor)
 * - Graceful shutdown on SIGINT/SIGTERM
 */

class MediaProcessorWorker {
  private isRunning = false;
  private activeJobs = 0;
  private maxConcurrentJobs = 3;
  private pollInterval = 1000; // 1 second

  /**
   * Start the worker
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log("[Worker] Already running");
      return;
    }

    this.isRunning = true;
    console.log("[Worker] Starting media processor worker");
    console.log(`[Worker] Max concurrent jobs: ${this.maxConcurrentJobs}`);
    console.log(`[Worker] Poll interval: ${this.pollInterval}ms`);

    // Setup graceful shutdown
    this.setupGracefulShutdown();

    // Start processing loop
    await this.processLoop();
  }

  /**
   * Stop the worker
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    console.log("[Worker] Stopping worker...");
    this.isRunning = false;

    // Wait for active jobs to complete
    while (this.activeJobs > 0) {
      console.log(`[Worker] Waiting for ${this.activeJobs} active jobs to complete...`);
      await this.sleep(1000);
    }

    console.log("[Worker] Worker stopped");
  }

  /**
   * Get next queued media from database
   */
  private async getNextQueuedMedia(): Promise<ProcessingJob | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from("media_processing")
        .select("*")
        .eq("status", "queued")
        .order("created_at", { ascending: true })
        .limit(1)
        .single();

      if (error || !data) {
        return null;
      }

      // Convert database record to ProcessingJob format
      return {
        id: crypto.randomUUID(),
        mediaId: data.id,
        userId: data.user_id,
        type: data.type as "image" | "video",
        originalPath: data.original_path,
        status: "queued",
        attempts: 0,
        createdAt: new Date(data.created_at),
      };
    } catch (error) {
      console.error("[Worker] Error fetching queued media:", error);
      return null;
    }
  }

  /**
   * Main processing loop
   */
  private async processLoop(): Promise<void> {
    while (this.isRunning) {
      try {
        // Check if we can process more jobs
        if (this.activeJobs < this.maxConcurrentJobs) {
          const job = await this.getNextQueuedMedia();

          if (job) {
            // Process job asynchronously (don't await)
            this.processJob(job);
          } else {
            // Queue is empty, wait before checking again
            await this.sleep(this.pollInterval);
          }
        } else {
          // At max capacity, wait before checking again
          await this.sleep(this.pollInterval);
        }
      } catch (error) {
        console.error("[Worker] Error in processing loop:", error);
        await this.sleep(this.pollInterval);
      }
    }
  }

  /**
   * Process a single job
   */
  private async processJob(job: ProcessingJob): Promise<void> {
    this.activeJobs++;
    console.log(`[Worker] Processing media ${job.mediaId} (${this.activeJobs}/${this.maxConcurrentJobs} active)`);

    try {
      // Process the media
      await mediaProcessor.process(job);

      console.log(`[Worker] Media ${job.mediaId} completed successfully`);
    } catch (error) {
      console.error(`[Worker] Media ${job.mediaId} failed:`, error);
      // Error is already handled by mediaProcessor (status updated to "failed")
    } finally {
      this.activeJobs--;
      console.log(`[Worker] Media ${job.mediaId} finished (${this.activeJobs}/${this.maxConcurrentJobs} active)`);
    }
  }

  /**
   * Setup graceful shutdown handlers
   */
  private setupGracefulShutdown(): void {
    const shutdown = async (signal: string) => {
      console.log(`[Worker] Received ${signal}, shutting down gracefully...`);
      await this.stop();
      process.exit(0);
    };

    process.on("SIGINT", () => shutdown("SIGINT"));
    process.on("SIGTERM", () => shutdown("SIGTERM"));
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get worker stats
   */
  getStats(): {
    isRunning: boolean;
    activeJobs: number;
    maxConcurrentJobs: number;
  } {
    return {
      isRunning: this.isRunning,
      activeJobs: this.activeJobs,
      maxConcurrentJobs: this.maxConcurrentJobs,
    };
  }
}

// Create and export worker instance
export const worker = new MediaProcessorWorker();

// Auto-start worker if this file is run directly
if (require.main === module) {
  console.log("[Worker] Starting worker from command line");
  worker.start().catch((error) => {
    console.error("[Worker] Failed to start worker:", error);
    process.exit(1);
  });
}
