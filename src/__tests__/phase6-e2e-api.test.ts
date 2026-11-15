/*
Author: Domonick Mack
Date: 2026-11-15
Description: End-to-end integration tests verifying all Next.js API route handlers across creator discovery, outreach, contracts, and the Magic-Link Creator Portal.
*/

import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it } from "vitest";
import { resetStore } from "@/lib/store";
import { GET as getWorkspaces, POST as postWorkspaces } from "@/app/api/workspaces/route";
import { GET as getCreators, POST as postCreators } from "@/app/api/creators/route";
import { GET as getCampaigns, POST as postCampaigns } from "@/app/api/campaigns/route";
import { GET as getOutreach, POST as postOutreach } from "@/app/api/outreach/route";
import { GET as getContracts, POST as postContracts } from "@/app/api/contracts/route";
import {
  GET as getPortalByToken,
  POST as postPortalByToken
} from "@/app/api/portal/[token]/route";

function createJsonRequest(url: string, method: "GET" | "POST", body?: unknown): NextRequest {
  if (method === "GET") {
    return new NextRequest(url, { method: "GET" });
  }
  return new NextRequest(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-forwarded-for": "203.0.113.77",
      "user-agent": "Vitest-E2E-Agent"
    },
    body: JSON.stringify(body)
  });
}

describe("Phase 6: End-to-End API Workflow Verification", () => {
  beforeEach(() => {
    resetStore();
  });

  it("executes the full brand-to-creator lifecycle across all API routes", async () => {
    // 1. Verify workspace & metrics API
    const wsRes = await getWorkspaces(
      createJsonRequest("http://localhost:3000/api/workspaces?workspaceId=ws_glowbotanics", "GET")
    );
    expect(wsRes.status).toBe(200);
    const wsData = await wsRes.json();
    expect(wsData.activeWorkspace.id).toBe("ws_glowbotanics");

    // 2. Invite a collaborator via POST /api/workspaces
    const inviteRes = await postWorkspaces(
      createJsonRequest("http://localhost:3000/api/workspaces", "POST", {
        action: "invite_member",
        workspaceId: "ws_glowbotanics",
        inviteEmail: "elena@glowbotanics.co",
        fullName: "Elena Vance",
        role: "MEMBER"
      })
    );
    expect(inviteRes.status).toBe(201);

    // 3. Add a new TikTok creator by @handle and assign directly to camp_barrier_serum
    const addCreatorRes = await postCreators(
      createJsonRequest("http://localhost:3000/api/creators", "POST", {
        action: "add_creator",
        workspaceId: "ws_glowbotanics",
        tiktokHandle: "@dermglow_tessa",
        displayName: "Tessa Lin",
        bio: "Derm PA & glass skin enthusiast ✨ barrier serums | collabs: tessa@dermglow.co",
        followerCount: 38000,
        avgViews: 26000,
        avgLikes: 2100,
        avgComments: 180,
        avgShares: 120,
        assignToCampaignId: "camp_barrier_serum"
      })
    );
    expect(addCreatorRes.status).toBe(201);
    const addedCreatorPayload = await addCreatorRes.json();
    expect(addedCreatorPayload.creator.tiktokHandle).toBe("dermglow_tessa");
    expect(addedCreatorPayload.creator.email).toBe("tessa@dermglow.co");

    // 4. Verify creator is listed in GET /api/creators and GET /api/campaigns
    const creatorsRes = await getCreators(
      createJsonRequest(
        "http://localhost:3000/api/creators?workspaceId=ws_glowbotanics&search=dermglow_tessa",
        "GET"
      )
    );
    const creatorsJson = await creatorsRes.json();
    expect(creatorsJson.creators.length).toBe(1);

    const campaignsRes = await getCampaigns(
      createJsonRequest("http://localhost:3000/api/campaigns?workspaceId=ws_glowbotanics", "GET")
    );
    const campaignsJson = await campaignsRes.json();
    const barrierCampaign = campaignsJson.campaigns.find(
      (c: { id: string }) => c.id === "camp_barrier_serum"
    );
    const tessaEntry = barrierCampaign.entries.find(
      (e: { creatorId: string }) => e.creatorId === addedCreatorPayload.creator.id
    );
    expect(tessaEntry).toBeDefined();

    // 5. Copy TikTok DM & Send Outreach Email via POST /api/outreach
    const dmRes = await postOutreach(
      createJsonRequest("http://localhost:3000/api/outreach", "POST", {
        action: "copy_tiktok_dm",
        campaignCreatorId: tessaEntry.id
      })
    );
    expect(dmRes.status).toBe(200);

    const emailRes = await postOutreach(
      createJsonRequest("http://localhost:3000/api/outreach", "POST", {
        action: "send_email_step",
        campaignCreatorId: tessaEntry.id,
        stepOrder: 1
      })
    );
    expect(emailRes.status).toBe(201);

    const outreachListRes = await getOutreach(
      createJsonRequest("http://localhost:3000/api/outreach?workspaceId=ws_glowbotanics", "GET")
    );
    expect(outreachListRes.status).toBe(200);

    // 6. Generate a customized TikTok contract via POST /api/contracts
    const genContractRes = await postContracts(
      createJsonRequest("http://localhost:3000/api/contracts", "POST", {
        action: "generate_contract",
        campaignCreatorId: tessaEntry.id,
        agreedRateUsd: 275,
        deliverableCount: 1,
        usageRightsDays: 90,
        sparkAdsRequired: true,
        exclusivityRequired: true,
        exclusivityDays: 30,
        revisionRounds: 1,
        paymentTerms: "Net 7 upon live TikTok URL & Spark Ad code submission"
      })
    );
    expect(genContractRes.status).toBe(201);

    const contractsListRes = await getContracts(
      createJsonRequest("http://localhost:3000/api/contracts?workspaceId=ws_glowbotanics", "GET")
    );
    expect(contractsListRes.status).toBe(200);

    // 7. Creator opens Magic-Link Portal, e-signs contract, and submits live TikTok URL + Spark code
    const token = tessaEntry.magicLinkToken as string;
    const portalGetRes = await getPortalByToken(
      createJsonRequest(`http://localhost:3000/api/portal/${token}`, "GET"),
      { params: Promise.resolve({ token }) }
    );
    expect(portalGetRes.status).toBe(200);

    const portalSignRes = await postPortalByToken(
      createJsonRequest(`http://localhost:3000/api/portal/${token}`, "POST", {
        action: "sign_contract",
        signerFullName: "Tessa Lin",
        signerEmail: "tessa@dermglow.co"
      }),
      { params: Promise.resolve({ token }) }
    );
    expect(portalSignRes.status).toBe(200);
    const signedJson = await portalSignRes.json();
    expect(signedJson.contract.status).toBe("SIGNED");

    const portalLiveRes = await postPortalByToken(
      createJsonRequest(`http://localhost:3000/api/portal/${token}`, "POST", {
        action: "submit_deliverable",
        submissionType: "LIVE_POST",
        tiktokPostUrl: "https://www.tiktok.com/@dermglow_tessa/video/7440123456789012345",
        sparkAdCode: "SPARK-TESSA-90D-2026"
      }),
      { params: Promise.resolve({ token }) }
    );
    expect(portalLiveRes.status).toBe(200);
    const liveJson = await portalLiveRes.json();
    expect(liveJson.deliverable.status).toBe("LIVE");
    expect(liveJson.portalData.entry.stage).toBe("LIVE");

    // 8. Update payout status to PAID via POST /api/campaigns
    const payoutRes = await postCampaigns(
      createJsonRequest("http://localhost:3000/api/campaigns", "POST", {
        action: "update_entry",
        campaignCreatorId: tessaEntry.id,
        payoutStatus: "PAID"
      })
    );
    expect(payoutRes.status).toBe(200);
  });
});
