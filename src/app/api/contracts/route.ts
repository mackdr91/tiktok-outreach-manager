/*
Author: Domonick Mack
Date: 2026-11-15
Description: Brand API route for generating TikTok contracts, managing templates, and reviewing creator deliverables.
*/

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getActiveSession } from "@/lib/auth";
import { getStore, listCampaignsForWorkspace } from "@/lib/store";
import {
  generateCreatorContract,
  reviewDeliverableByBrand
} from "@/lib/contract-engine";

const ContractPostSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("generate_contract"),
    campaignCreatorId: z.string().min(1),
    agreedRateUsd: z.number().positive(),
    deliverableCount: z.number().int().positive().default(1),
    usageRightsDays: z.number().int().positive().default(90),
    sparkAdsRequired: z.boolean().default(true),
    exclusivityRequired: z.boolean().default(true),
    exclusivityDays: z.number().int().nonnegative().default(30),
    revisionRounds: z.number().int().nonnegative().default(1),
    paymentTerms: z
      .string()
      .default("Net 7 via ACH/PayPal upon live TikTok URL & Spark Ad authorization code")
  }),
  z.object({
    action: z.literal("review_deliverable"),
    campaignCreatorId: z.string().min(1),
    reviewAction: z.enum([
      "APPROVE_SCRIPT",
      "REQUEST_SCRIPT_REVISION",
      "APPROVE_DRAFT",
      "REQUEST_DRAFT_REVISION"
    ]),
    feedback: z.string().default("")
  })
]);

export async function GET(request: NextRequest): Promise<NextResponse> {
  const session = await getActiveSession();
  const workspaceId =
    request.nextUrl.searchParams.get("workspaceId") || session.activeWorkspaceId;

  const store = getStore();
  const campaigns = listCampaignsForWorkspace(workspaceId);
  const templates = store.contractTemplates.filter(
    (t) => t.workspaceId === workspaceId
  );

  const items = campaigns.flatMap((campaign) =>
    campaign.entries.map((entry) => ({
      campaignCreatorId: entry.id,
      campaignId: campaign.id,
      campaignName: campaign.name,
      productName: campaign.productName,
      stage: entry.stage,
      agreedRateUsd: entry.agreedRateUsd,
      magicLinkToken: entry.magicLinkToken,
      payoutStatus: entry.payoutStatus,
      creator: entry.creator,
      contract: entry.contract,
      deliverables: entry.deliverables
    }))
  );

  return NextResponse.json({
    templates,
    items
  });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const rawBody = await request.json();
    const parsed = ContractPostSchema.safeParse(rawBody);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid contract/deliverable payload.", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    if (data.action === "generate_contract") {
      const contract = generateCreatorContract(data);
      return NextResponse.json({ contract }, { status: 201 });
    }

    const deliverable = reviewDeliverableByBrand({
      campaignCreatorId: data.campaignCreatorId,
      reviewAction: data.reviewAction,
      feedback: data.feedback
    });

    return NextResponse.json({ deliverable }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Contract action failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
