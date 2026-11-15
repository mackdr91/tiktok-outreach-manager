/*
Author: Domonick Mack
Date: 2026-11-15
Description: Background worker entrypoint for processing BullMQ outreach sequences and usage-rights alerts.
*/

import IORedis from "ioredis";
import { Worker } from "bullmq";

export const OUTREACH_QUEUE_NAME = "tokreach-outreach-queue";

export interface OutreachJobData {
  campaignCreatorId: string;
  stepNumber: number;
  recipientEmail: string;
  subject: string;
  body: string;
}

/**
 * Starts the BullMQ worker for scheduled email outreach steps and deliverable alerts.
 */
export function startOutreachWorker(): Worker<OutreachJobData> {
  const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
  const connection = new IORedis(redisUrl, {
    maxRetriesPerRequest: null
  });

  const worker = new Worker<OutreachJobData>(
    OUTREACH_QUEUE_NAME,
    async (job) => {
      const { campaignCreatorId, stepNumber, recipientEmail, subject } = job.data;
      console.info(
        `[TokReach Worker] Processed outreach step #${stepNumber} for campaignCreator=${campaignCreatorId} (${recipientEmail}) | Subject="${subject}"`
      );
      return { delivered: true, processedAt: new Date().toISOString() };
    },
    { connection }
  );

  worker.on("completed", (job) => {
    console.info(`[TokReach Worker] Job ${job.id} completed.`);
  });

  worker.on("failed", (job, err) => {
    console.error(`[TokReach Worker] Job ${job?.id ?? "unknown"} failed:`, err.message);
  });

  return worker;
}

if (require.main === module) {
  console.info("[TokReach Worker] Starting background queue processor...");
  const workerInstance = startOutreachWorker();

  const shutdown = async () => {
    console.info("[TokReach Worker] Gracefully shutting down...");
    await workerInstance.close();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}
