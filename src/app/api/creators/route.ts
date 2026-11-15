/*
Author: Domonick Mack
Date: 2026-11-15
Description: API route for listing, filtering, AI-enriching, adding by @handle, and CSV-importing TikTok micro-influencers.
*/

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getActiveSession } from "@/lib/auth";
import {
  getStore,
  listCampaignsForWorkspace,
  listCreators,
  upsertCreator
} from "@/lib/store";
import {
  analyzeCreatorBioWithAi,
  calculateEngagementRate,
  estimateCreatorRateUsd,
  parseAndImportCreatorCsv
} from "@/lib/tiktok-discovery";
import { normalizeTikTokHandle } from "@/lib/utils";

const CreatorPostSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("analyze_bio"),
    tiktokHandle: z.string().min(1),
    displayName: z.string().optional(),
    bio: z.string().default(""),
    followerCount: z.number().nonnegative().default(25000),
    avgViews: z.number().nonnegative().default(15000),
    avgLikes: z.number().nonnegative().default(1100),
    avgComments: z.number().nonnegative().default(90),
    avgShares: z.number().nonnegative().default(60)
  }),
  z.object({
    action: z.literal("add_creator"),
    workspaceId: z.string().min(1),
    tiktokHandle: z.string().min(1),
    displayName: z.string().optional(),
    email: z.string().optional(),
    bio: z.string().default(""),
    followerCount: z.number().nonnegative(),
    avgViews: z.number().nonnegative(),
    avgLikes: z.number().nonnegative(),
    avgComments: z.number().nonnegative(),
    avgShares: z.number().nonnegative(),
    nicheTags: z.array(z.string()).optional(),
    notes: z.string().optional(),
    assignToCampaignId: z.string().optional()
  }),
  z.object({
    action: z.literal("import_csv"),
    workspaceId: z.string().min(1),
    csvText: z.string().min(5)
  })
]);

export async function GET(request: NextRequest): Promise<NextResponse> {
  const session = await getActiveSession();
  const params = request.nextUrl.searchParams;
  const workspaceId = params.get("workspaceId") || session.activeWorkspaceId;
  const search = params.get("search") || undefined;
  const niche = params.get("niche") || undefined;
  const minFollowers = params.get("minFollowers")
    ? Number(params.get("minFollowers"))
    : undefined;
  const maxFollowers = params.get("maxFollowers")
    ? Number(params.get("maxFollowers"))
    : undefined;
  const minEngagementRate = params.get("minEngagementRate")
    ? Number(params.get("minEngagementRate"))
    : undefined;
  const maxRateUsd = params.get("maxRateUsd")
    ? Number(params.get("maxRateUsd"))
    : undefined;

  const allWorkspaceCreators = listCreators({ workspaceId });
  const uniqueNiches = Array.from(
    new Set(allWorkspaceCreators.flatMap((c) => c.nicheTags))
  ).sort();

  const filteredCreators = listCreators({
    workspaceId,
    search,
    niche,
    minFollowers,
    maxFollowers,
    minEngagementRate,
    maxRateUsd
  });

  const campaigns = listCampaignsForWorkspace(workspaceId).map((c) => ({
    id: c.id,
    name: c.name,
    defaultFeeUsd: c.defaultFeeUsd
  }));

  return NextResponse.json({
    creators: filteredCreators,
    totalInWorkspace: allWorkspaceCreators.length,
    uniqueNiches,
    campaigns
  });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const rawBody = await request.json();
    const parsed = CreatorPostSchema.safeParse(rawBody);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid creator request payload.", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    if (data.action === "analyze_bio") {
      const bioAnalysis = await analyzeCreatorBioWithAi({
        tiktokHandle: data.tiktokHandle,
        displayName: data.displayName,
        bio: data.bio,
        followerCount: data.followerCount
      });

      const engagementRate = calculateEngagementRate({
        likes: data.avgLikes,
        comments: data.avgComments,
        shares: data.avgShares,
        views: data.avgViews
      });

      const estimatedRateUsd = estimateCreatorRateUsd({
        followerCount: data.followerCount,
        avgViews: data.avgViews,
        engagementRate
      });

      return NextResponse.json({
        normalizedHandle: normalizeTikTokHandle(data.tiktokHandle, true),
        bioAnalysis,
        engagementRate,
        estimatedRateUsd
      });
    }

    if (data.action === "add_creator") {
      const bioAnalysis = await analyzeCreatorBioWithAi({
        tiktokHandle: data.tiktokHandle,
        displayName: data.displayName,
        bio: data.bio,
        followerCount: data.followerCount
      });

      const nicheTags =
        data.nicheTags && data.nicheTags.length > 0
          ? data.nicheTags
          : bioAnalysis.nicheTags;

      const resolvedEmail =
        data.email?.trim() ||
        bioAnalysis.extractedEmail ||
        `${normalizeTikTokHandle(data.tiktokHandle)}@creatorcollab.co`;

      const creator = upsertCreator({
        workspaceId: data.workspaceId,
        tiktokHandle: data.tiktokHandle,
        displayName: data.displayName,
        email: resolvedEmail,
        bio: data.bio,
        followerCount: data.followerCount,
        avgViews: data.avgViews,
        avgLikes: data.avgLikes,
        avgComments: data.avgComments,
        avgShares: data.avgShares,
        nicheTags,
        enrichmentSource: "AI_ENRICHED",
        notes: data.notes || bioAnalysis.personalizedHook
      });

      if (data.assignToCampaignId) {
        const store = getStore();
        const existingLink = store.campaignCreators.find(
          (cc) =>
            cc.campaignId === data.assignToCampaignId && cc.creatorId === creator.id
        );
        if (!existingLink) {
          store.campaignCreators.push({
            id: `cc_${creator.tiktokHandle}_${Date.now().toString(36)}`,
            campaignId: data.assignToCampaignId,
            creatorId: creator.id,
            stage: "OUTREACH_QUEUED",
            agreedRateUsd: creator.estimatedRateUsd,
            magicLinkToken: `tok_${creator.tiktokHandle}_${Date.now().toString(36)}`,
            customHook: bioAnalysis.personalizedHook,
            dmScript: `Hey ${creator.displayName.split(" ")[0]}! Just sent an email to ${creator.email} about a paid $${creator.estimatedRateUsd} TikTok collab ✨ Let me know if you want the brief link here!`,
            dmCopiedAt: null,
            lastContactedAt: null,
            replied: false,
            shippingStatus: "PENDING",
            trackingNumber: "",
            payoutStatus: "UNPAID",
            messages: [],
            contract: null,
            deliverables: []
          });
        }
      }

      return NextResponse.json(
        {
          creator,
          bioAnalysis
        },
        { status: 201 }
      );
    }

    const importSummary = await parseAndImportCreatorCsv({
      workspaceId: data.workspaceId,
      csvText: data.csvText
    });

    return NextResponse.json(importSummary, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Creator operation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
