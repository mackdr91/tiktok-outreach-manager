/*
Author: Domonick Mack
Date: 2026-11-15
Description: Public Magic-Link Creator Portal API for passwordless contract e-signature and deliverable submission.
*/

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getPortalContextByToken } from "@/lib/store";
import {
  signCreatorContractByToken,
  submitDeliverableByToken
} from "@/lib/contract-engine";

const PortalPostSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("sign_contract"),
    signerFullName: z.string().min(2),
    signerEmail: z.string().email()
  }),
  z.object({
    action: z.literal("submit_deliverable"),
    submissionType: z.enum(["SCRIPT", "DRAFT", "LIVE_POST"]),
    scriptContent: z.string().optional(),
    draftVideoUrl: z.string().optional(),
    tiktokPostUrl: z.string().optional(),
    sparkAdCode: z.string().optional()
  })
]);

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ token: string }> }
): Promise<NextResponse> {
  const { token } = await context.params;
  const portalData = getPortalContextByToken(token);

  if (!portalData) {
    return NextResponse.json(
      { error: "Creator portal link not found or expired." },
      { status: 404 }
    );
  }

  return NextResponse.json(portalData);
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ token: string }> }
): Promise<NextResponse> {
  try {
    const { token } = await context.params;
    const rawBody = await request.json();
    const parsed = PortalPostSchema.safeParse(rawBody);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid portal submission.", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    if (data.action === "sign_contract") {
      const forwardedFor = request.headers.get("x-forwarded-for");
      const signerIpAddress = forwardedFor
        ? forwardedFor.split(",")[0].trim()
        : "127.0.0.1";
      const signerUserAgent =
        request.headers.get("user-agent") || "TikTok-Creator-Mobile-Portal";

      const contract = signCreatorContractByToken({
        magicLinkToken: token,
        signerFullName: data.signerFullName,
        signerEmail: data.signerEmail,
        signerIpAddress,
        signerUserAgent
      });

      return NextResponse.json(
        {
          contract,
          portalData: getPortalContextByToken(token)
        },
        { status: 200 }
      );
    }

    const deliverable = submitDeliverableByToken({
      magicLinkToken: token,
      submissionType: data.submissionType,
      scriptContent: data.scriptContent,
      draftVideoUrl: data.draftVideoUrl,
      tiktokPostUrl: data.tiktokPostUrl,
      sparkAdCode: data.sparkAdCode
    });

    return NextResponse.json(
      {
        deliverable,
        portalData: getPortalContextByToken(token)
      },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Portal submission failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
