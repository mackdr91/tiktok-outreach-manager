/*
Author: Domonick Mack
Date: 2026-11-15
Description: API route for email drip sequence automation, BullMQ outreach dispatch, and Guided TikTok DM Queue actions.
*/

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getActiveSession } from "@/lib/auth";
import {
  getStore,
  getWorkspaceById,
  listCampaignsForWorkspace
} from "@/lib/store";
import {
  dispatchCreatorOutreachEmail,
  generatePersonalizedPitch,
  markTikTokDmDispatched
} from "@/lib/outreach-engine";

const OutreachPostSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("send_email_step"),
    campaignCreatorId: z.string().min(1),
    subject: z.string().optional(),
    body: z.string().optional(),
    stepOrder: z.number().int().positive().default(1)
  }),
  z.object({
    action: z.literal("copy_tiktok_dm"),
    campaignCreatorId: z.string().min(1),
    dmScript: z.string().optional()
  }),
  z.object({
    action: z.literal("generate_ai_pitch"),
    campaignCreatorId: z.string().min(1)
  }),
  z.object({
    action: z.literal("save_sequence"),
    workspaceId: z.string().min(1),
    campaignId: z.string().min(1),
    name: z.string().min(2),
    steps: z.array(
      z.object({
        stepOrder: z.number().int().positive(),
        channel: z.enum(["EMAIL", "TIKTOK_DM"]),
        delayHours: z.number().int().nonnegative(),
        subjectTemplate: z.string().default(""),
        bodyTemplate: z.string().min(2)
      })
    )
  })
]);

export async function GET(request: NextRequest): Promise<NextResponse> {
  const session = await getActiveSession();
  const workspaceId =
    request.nextUrl.searchParams.get("workspaceId") || session.activeWorkspaceId;

  const store = getStore();
  const campaigns = listCampaignsForWorkspace(workspaceId);
  const sequences = store.sequences.filter((s) => s.workspaceId === workspaceId);

  const outreachTargets = campaigns.flatMap((campaign) =>
    campaign.entries.map((entry) => ({
      campaignCreatorId: entry.id,
      campaignId: campaign.id,
      campaignName: campaign.name,
      productName: campaign.productName,
      stage: entry.stage,
      agreedRateUsd: entry.agreedRateUsd,
      magicLinkToken: entry.magicLinkToken,
      customHook: entry.customHook,
      dmScript: entry.dmScript,
      dmCopiedAt: entry.dmCopiedAt,
      lastContactedAt: entry.lastContactedAt,
      replied: entry.replied,
      creator: entry.creator,
      messages: entry.messages
    }))
  );

  const recentMessages = outreachTargets
    .flatMap((target) =>
      target.messages.map((msg) => ({
        ...msg,
        tiktokHandle: target.creator.tiktokHandle,
        creatorEmail: target.creator.email,
        campaignName: target.campaignName
      }))
    )
    .sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());

  return NextResponse.json({
    sequences,
    outreachTargets,
    recentMessages
  });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const rawBody = await request.json();
    const parsed = OutreachPostSchema.safeParse(rawBody);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid outreach request payload.", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const store = getStore();
    const data = parsed.data;

    if (data.action === "send_email_step") {
      const result = await dispatchCreatorOutreachEmail({
        campaignCreatorId: data.campaignCreatorId,
        subject: data.subject,
        body: data.body,
        stepOrder: data.stepOrder
      });
      return NextResponse.json(result, { status: 201 });
    }

    if (data.action === "copy_tiktok_dm") {
      const result = markTikTokDmDispatched({
        campaignCreatorId: data.campaignCreatorId,
        dmScript: data.dmScript
      });
      return NextResponse.json(result, { status: 200 });
    }

    if (data.action === "generate_ai_pitch") {
      const entry = store.campaignCreators.find(
        (cc) => cc.id === data.campaignCreatorId
      );
      if (!entry) {
        return NextResponse.json(
          { error: "Campaign creator entry not found." },
          { status: 404 }
        );
      }

      const campaign = store.campaigns.find((c) => c.id === entry.campaignId);
      const creator = store.creators.find((c) => c.id === entry.creatorId);
      if (!campaign || !creator) {
        return NextResponse.json(
          { error: "Campaign or creator missing." },
          { status: 404 }
        );
      }

      const workspace = getWorkspaceById(campaign.workspaceId);
      const generated = await generatePersonalizedPitch({
        workspace,
        campaign,
        creator,
        agreedRateUsd: entry.agreedRateUsd
      });

      entry.customHook = generated.customHook;
      entry.dmScript = generated.dmScript;

      return NextResponse.json(generated, { status: 200 });
    }

    const newSequence = {
      id: `seq_${Date.now().toString(36)}`,
      workspaceId: data.workspaceId,
      campaignId: data.campaignId,
      name: data.name.trim(),
      isActive: true,
      steps: data.steps.map((s, idx) => ({
        id: `step_${Date.now().toString(36)}_${idx}`,
        stepOrder: s.stepOrder,
        channel: s.channel,
        delayHours: s.delayHours,
        subjectTemplate: s.subjectTemplate,
        bodyTemplate: s.bodyTemplate
      }))
    };

    store.sequences.unshift(newSequence);
    return NextResponse.json({ sequence: newSequence }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Outreach operation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
