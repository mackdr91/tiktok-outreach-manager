/*
Author: Domonick Mack
Date: 2026-11-15
Description: API route for managing TikTok campaigns, creator pipeline stages, budgets, and seeding logistics.
*/

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getActiveSession } from "@/lib/auth";
import {
  getStore,
  getWorkspaceById,
  listCampaignsForWorkspace,
  listCreators,
  updateCampaignCreatorStage
} from "@/lib/store";
import { PipelineStageId } from "@/lib/types";
import { generatePersonalizedPitch } from "@/lib/outreach-engine";

const CampaignPostSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("create_campaign"),
    workspaceId: z.string().min(1),
    name: z.string().min(2),
    productName: z.string().min(2),
    productBrief: z.string().min(5),
    budgetUsd: z.number().positive(),
    defaultFeeUsd: z.number().positive(),
    usageRightsDays: z.number().int().positive().default(90),
    sparkAdsRequired: z.boolean().default(true),
    exclusivityDays: z.number().int().nonnegative().default(30),
    targetNiche: z.string().default("Skincare & UGC")
  }),
  z.object({
    action: z.literal("assign_creator"),
    campaignId: z.string().min(1),
    creatorId: z.string().min(1),
    agreedRateUsd: z.number().positive().optional()
  }),
  z.object({
    action: z.literal("update_entry"),
    campaignCreatorId: z.string().min(1),
    stage: z
      .enum([
        "DISCOVERED",
        "OUTREACH_QUEUED",
        "CONTACTED",
        "NEGOTIATING",
        "CONTRACT_SENT",
        "CONTRACT_SIGNED",
        "DRAFT_REVIEW",
        "LIVE"
      ])
      .optional(),
    agreedRateUsd: z.number().positive().optional(),
    shippingStatus: z.enum(["PENDING", "SHIPPED", "DELIVERED"]).optional(),
    trackingNumber: z.string().optional(),
    payoutStatus: z.enum(["UNPAID", "SCHEDULED", "PAID"]).optional(),
    replied: z.boolean().optional()
  })
]);

export async function GET(request: NextRequest): Promise<NextResponse> {
  const session = await getActiveSession();
  const workspaceId =
    request.nextUrl.searchParams.get("workspaceId") || session.activeWorkspaceId;

  const campaigns = listCampaignsForWorkspace(workspaceId);
  const allCreators = listCreators({ workspaceId });

  return NextResponse.json({
    campaigns,
    allCreators
  });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const rawBody = await request.json();
    const parsed = CampaignPostSchema.safeParse(rawBody);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid campaign request payload.", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const store = getStore();
    const data = parsed.data;

    if (data.action === "create_campaign") {
      const created = {
        id: `camp_${Date.now().toString(36)}`,
        workspaceId: data.workspaceId,
        name: data.name.trim(),
        productName: data.productName.trim(),
        productBrief: data.productBrief.trim(),
        budgetUsd: data.budgetUsd,
        defaultFeeUsd: data.defaultFeeUsd,
        usageRightsDays: data.usageRightsDays,
        sparkAdsRequired: data.sparkAdsRequired,
        exclusivityDays: data.exclusivityDays,
        targetNiche: data.targetNiche.trim(),
        status: "ACTIVE" as const,
        createdAt: new Date().toISOString()
      };

      store.campaigns.unshift(created);
      return NextResponse.json(
        {
          campaign: created,
          campaigns: listCampaignsForWorkspace(data.workspaceId)
        },
        { status: 201 }
      );
    }

    if (data.action === "assign_creator") {
      const campaign = store.campaigns.find((c) => c.id === data.campaignId);
      const creator = store.creators.find((c) => c.id === data.creatorId);
      if (!campaign || !creator) {
        return NextResponse.json(
          { error: "Campaign or creator not found." },
          { status: 404 }
        );
      }

      const existing = store.campaignCreators.find(
        (cc) => cc.campaignId === campaign.id && cc.creatorId === creator.id
      );
      if (existing) {
        return NextResponse.json({ entry: existing }, { status: 200 });
      }

      const workspace = getWorkspaceById(campaign.workspaceId);
      const fee = data.agreedRateUsd ?? creator.estimatedRateUsd ?? campaign.defaultFeeUsd;
      const pitch = await generatePersonalizedPitch({
        workspace,
        campaign,
        creator,
        agreedRateUsd: fee
      });

      const newEntry = {
        id: `cc_${creator.tiktokHandle}_${Date.now().toString(36)}`,
        campaignId: campaign.id,
        creatorId: creator.id,
        stage: "OUTREACH_QUEUED" as PipelineStageId,
        agreedRateUsd: fee,
        magicLinkToken: `tok_${creator.tiktokHandle}_${Date.now().toString(36)}`,
        customHook: pitch.customHook,
        dmScript: pitch.dmScript,
        dmCopiedAt: null,
        lastContactedAt: null,
        replied: false,
        shippingStatus: "PENDING" as const,
        trackingNumber: "",
        payoutStatus: "UNPAID" as const,
        messages: [],
        contract: null,
        deliverables: []
      };

      store.campaignCreators.unshift(newEntry);

      return NextResponse.json(
        {
          entry: newEntry,
          campaigns: listCampaignsForWorkspace(campaign.workspaceId)
        },
        { status: 201 }
      );
    }

    const entry = store.campaignCreators.find(
      (cc) => cc.id === data.campaignCreatorId
    );
    if (!entry) {
      return NextResponse.json(
        { error: "Pipeline entry not found." },
        { status: 404 }
      );
    }

    if (data.stage) {
      updateCampaignCreatorStage({
        campaignCreatorId: entry.id,
        stage: data.stage
      });
    }
    if (typeof data.agreedRateUsd === "number") {
      entry.agreedRateUsd = data.agreedRateUsd;
    }
    if (data.shippingStatus) {
      entry.shippingStatus = data.shippingStatus;
    }
    if (typeof data.trackingNumber === "string") {
      entry.trackingNumber = data.trackingNumber;
    }
    if (data.payoutStatus) {
      entry.payoutStatus = data.payoutStatus;
    }
    if (typeof data.replied === "boolean") {
      entry.replied = data.replied;
    }

    return NextResponse.json({ entry });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Campaign action failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
