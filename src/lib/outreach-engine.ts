/*
Author: Domonick Mack
Date: 2026-11-15
Description: Outreach automation engine handling merge-variable rendering, AI pitch generation, BullMQ job scheduling, and TikTok DM queue actions.
*/

import { Queue } from "bullmq";
import IORedis from "ioredis";
import { GoogleGenAI } from "@google/genai";
import {
  CampaignCreatorRecord,
  CampaignRecord,
  CreatorRecord,
  OutreachMessageRecord,
  WorkspaceRecord
} from "./types";
import { getStore } from "./store";
import { OUTREACH_QUEUE_NAME, OutreachJobData } from "@/worker";

export interface MergeContext {
  firstName: string;
  creatorName: string;
  tiktokHandle: string;
  creatorEmail: string;
  niche: string;
  productName: string;
  campaignName: string;
  agreedRateUsd: number;
  customHook: string;
  portalUrl: string;
}

/**
 * Replaces {{variable}} tokens in an outreach subject or body template.
 */
export function renderOutreachTemplate(template: string, context: MergeContext): string {
  return template
    .replace(/\{\{firstName\}\}/g, context.firstName)
    .replace(/\{\{creatorName\}\}/g, context.creatorName)
    .replace(/\{\{tiktokHandle\}\}/g, context.tiktokHandle)
    .replace(/\{\{creatorEmail\}\}/g, context.creatorEmail)
    .replace(/\{\{niche\}\}/g, context.niche)
    .replace(/\{\{productName\}\}/g, context.productName)
    .replace(/\{\{campaignName\}\}/g, context.campaignName)
    .replace(/\{\{agreedRateUsd\}\}/g, String(context.agreedRateUsd))
    .replace(/\{\{customHook\}\}/g, context.customHook)
    .replace(/\{\{portalUrl\}\}/g, context.portalUrl);
}

/**
 * Builds the merge context for a specific campaign creator entry.
 */
export function buildMergeContext(params: {
  workspace: WorkspaceRecord;
  campaign: CampaignRecord;
  creator: CreatorRecord;
  entry: CampaignCreatorRecord;
}): MergeContext {
  const { campaign, creator, entry } = params;
  const firstName = creator.displayName.replace(/^@/, "").split(" ")[0] || creator.tiktokHandle;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  return {
    firstName,
    creatorName: creator.displayName,
    tiktokHandle: creator.tiktokHandle,
    creatorEmail: creator.email,
    niche: creator.nicheTags[0] || "TikTok",
    productName: campaign.productName,
    campaignName: campaign.name,
    agreedRateUsd: entry.agreedRateUsd,
    customHook:
      entry.customHook ||
      `We love your @${creator.tiktokHandle} TikTok videos and high ${creator.engagementRate}% engagement rate!`,
    portalUrl: `${appUrl}/portal/${entry.magicLinkToken}`
  };
}

/**
 * Generates an AI-personalized email pitch and short TikTok DM script for a creator.
 */
export async function generatePersonalizedPitch(params: {
  workspace: WorkspaceRecord;
  campaign: CampaignRecord;
  creator: CreatorRecord;
  agreedRateUsd: number;
}): Promise<{
  customHook: string;
  emailSubject: string;
  emailBody: string;
  dmScript: string;
}> {
  const { workspace, campaign, creator, agreedRateUsd } = params;
  const firstName = creator.displayName.replace(/^@/, "").split(" ")[0] || creator.tiktokHandle;
  const primaryNiche = (creator.nicheTags[0] || "TikTok").replace(/-/g, " ");

  let customHook = `We've been following @${creator.tiktokHandle} and love how authentic your ${primaryNiche} videos feel (${creator.engagementRate}% engagement is incredible!).`;

  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (apiKey && creator.bio.trim()) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `Write a single warm, non-cringey 1-sentence compliment referencing this TikTok creator's bio for a brand collaboration pitch.
Creator: @${creator.tiktokHandle} (${creator.displayName})
Bio: ${creator.bio}
Product: ${campaign.productName} (${workspace.name})`
      });
      if (response.text?.trim()) {
        customHook = response.text.trim().replace(/^["']|["']$/g, "");
      }
    } catch {
      // Fall back to deterministic hook
    }
  }

  const emailSubject = `Paid TikTok Collab: ${workspace.name} x @${creator.tiktokHandle} ($${agreedRateUsd})`;
  const emailBody = `Hi ${firstName},\n\n${customHook}\n\nWe're inviting a small group of TikTok micro-creators for our ${campaign.name} featuring ${campaign.productName}. We'd love to offer you a $${agreedRateUsd} flat fee for 1 vertical TikTok video (${campaign.usageRightsDays}-day Spark Ads rights included) + complimentary product seeding.\n\nYou can review the brief and e-sign the creator agreement directly via your passwordless Creator Portal link.\n\nBest,\n${workspace.defaultSenderName}`;

  const dmScript = `Hey ${firstName}! Just sent an email to ${creator.email} with a paid $${agreedRateUsd} TikTok collab offer for ${workspace.name} (${campaign.productName}) ✨ Let me know if you want me to drop your brief link here!`;

  return {
    customHook,
    emailSubject,
    emailBody,
    dmScript
  };
}

/**
 * Attempts to enqueue an outreach email job into BullMQ (Redis) with graceful non-blocking fallback.
 */
export async function tryEnqueueBullMqJob(jobData: OutreachJobData, delayMs = 0): Promise<boolean> {
  if (process.env.NODE_ENV === "test") {
    return false;
  }

  const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
  let connection: IORedis | null = null;
  let queue: Queue | null = null;

  try {
    connection = new IORedis(redisUrl, {
      maxRetriesPerRequest: 1,
      connectTimeout: 1200,
      lazyConnect: true
    });
    await connection.connect();
    queue = new Queue(OUTREACH_QUEUE_NAME, { connection });
    await queue.add(`step-${jobData.stepNumber}`, jobData, {
      delay: Math.max(0, delayMs),
      removeOnComplete: 50
    });
    return true;
  } catch {
    return false;
  } finally {
    if (queue) {
      await queue.close().catch(() => undefined);
    }
    if (connection) {
      connection.disconnect();
    }
  }
}

/**
 * Dispatches an email outreach step for a campaign creator, logs the message,
 * schedules follow-up BullMQ jobs if part of a sequence, and updates pipeline stage.
 */
export async function dispatchCreatorOutreachEmail(params: {
  campaignCreatorId: string;
  subject?: string;
  body?: string;
  stepOrder?: number;
}): Promise<{
  message: OutreachMessageRecord;
  queuedInBullMq: boolean;
  updatedStage: string;
}> {
  const store = getStore();
  const entry = store.campaignCreators.find((cc) => cc.id === params.campaignCreatorId);
  if (!entry) {
    throw new Error("Campaign creator entry not found.");
  }

  const campaign = store.campaigns.find((c) => c.id === entry.campaignId);
  const creator = store.creators.find((c) => c.id === entry.creatorId);
  if (!campaign || !creator) {
    throw new Error("Campaign or creator record missing.");
  }

  const workspace =
    store.workspaces.find((w) => w.id === campaign.workspaceId) || store.workspaces[0];

  const context = buildMergeContext({
    workspace,
    campaign,
    creator,
    entry
  });

  const defaultSubject = `Paid TikTok Collab with ${workspace.name} x @${creator.tiktokHandle} ✨`;
  const defaultBody =
    "Hi {{firstName}},\n\n{{customHook}}\n\nWe have a ${{agreedRateUsd}} flat budget for 1 TikTok video featuring {{productName}}. Review the brief and sign in 1 click at {{portalUrl}}";

  const renderedSubject = renderOutreachTemplate(params.subject || defaultSubject, context);
  const renderedBody = renderOutreachTemplate(params.body || defaultBody, context);
  const stepOrder = params.stepOrder ?? 1;

  const queuedInBullMq = await tryEnqueueBullMqJob({
    campaignCreatorId: entry.id,
    stepNumber: stepOrder,
    recipientEmail: creator.email,
    subject: renderedSubject,
    body: renderedBody
  });

  const message: OutreachMessageRecord = {
    id: `msg_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    campaignCreatorId: entry.id,
    channel: "EMAIL",
    stepOrder,
    subject: renderedSubject,
    body: renderedBody,
    status: "SENT",
    sentAt: new Date().toISOString()
  };

  entry.messages.unshift(message);
  entry.lastContactedAt = message.sentAt;
  if (entry.stage === "DISCOVERED" || entry.stage === "OUTREACH_QUEUED") {
    entry.stage = "CONTACTED";
  }

  return {
    message,
    queuedInBullMq,
    updatedStage: entry.stage
  };
}

/**
 * Records that a guided TikTok DM script was copied/dispatched and advances the creator stage.
 */
export function markTikTokDmDispatched(params: {
  campaignCreatorId: string;
  dmScript?: string;
}): {
  entry: CampaignCreatorRecord;
  message: OutreachMessageRecord;
} {
  const store = getStore();
  const entry = store.campaignCreators.find((cc) => cc.id === params.campaignCreatorId);
  if (!entry) {
    throw new Error("Campaign creator entry not found.");
  }

  if (params.dmScript?.trim()) {
    entry.dmScript = params.dmScript.trim();
  }

  const nowIso = new Date().toISOString();
  entry.dmCopiedAt = nowIso;
  entry.lastContactedAt = nowIso;

  if (entry.stage === "DISCOVERED" || entry.stage === "OUTREACH_QUEUED") {
    entry.stage = "CONTACTED";
  }

  const message: OutreachMessageRecord = {
    id: `msg_dm_${Date.now().toString(36)}`,
    campaignCreatorId: entry.id,
    channel: "TIKTOK_DM",
    stepOrder: 2,
    subject: "TikTok Direct Message",
    body: entry.dmScript,
    status: "COPIED_FOR_DM",
    sentAt: nowIso
  };

  entry.messages.unshift(message);

  return { entry, message };
}
