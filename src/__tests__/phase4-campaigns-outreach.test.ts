/*
Author: Domonick Mack
Date: 2026-11-15
Description: Unit and integration tests for Phase 4 campaign pipeline transitions, merge-variable outreach rendering, and TikTok DM queue dispatch.
*/

import { beforeEach, describe, expect, it } from "vitest";
import {
  getStore,
  getWorkspaceById,
  listCampaignsForWorkspace,
  resetStore,
  updateCampaignCreatorStage
} from "@/lib/store";
import {
  buildMergeContext,
  dispatchCreatorOutreachEmail,
  generatePersonalizedPitch,
  markTikTokDmDispatched,
  renderOutreachTemplate
} from "@/lib/outreach-engine";

describe("Phase 4: Campaign Pipeline, Email Drip Automation & TikTok DM Queue", () => {
  beforeEach(() => {
    resetStore();
  });

  it("renders merge variables into outreach subject and body templates", () => {
    const store = getStore();
    const workspace = getWorkspaceById("ws_glowbotanics");
    const campaign = store.campaigns[0];
    const creator = store.creators[0];
    const entry = store.campaignCreators[0];

    const context = buildMergeContext({
      workspace,
      campaign,
      creator,
      entry
    });

    const rendered = renderOutreachTemplate(
      "Hi {{firstName}} (@{{tiktokHandle}}), offer is ${{agreedRateUsd}} for {{productName}}!",
      context
    );

    expect(rendered).toContain("Hi Maya (@glowwithmaya)");
    expect(rendered).toContain("$265");
    expect(rendered).toContain("CloudDew Cica + Ceramide Barrier Serum (30ml)");
  });

  it("generates personalized email pitches and short TikTok DM scripts", async () => {
    const store = getStore();
    const workspace = getWorkspaceById("ws_glowbotanics");
    const campaign = store.campaigns[0];
    const creator = store.creators[1];

    const pitch = await generatePersonalizedPitch({
      workspace,
      campaign,
      creator,
      agreedRateUsd: 185
    });

    expect(pitch.emailSubject).toContain("@skincarebychloe");
    expect(pitch.emailBody).toContain("$185");
    expect(pitch.dmScript).toContain("chloe.ugc@gmail.com");
  });

  it("dispatches an outreach email step and advances creator stage from OUTREACH_QUEUED to CONTACTED", async () => {
    const result = await dispatchCreatorOutreachEmail({
      campaignCreatorId: "cc_zoe_serum",
      stepOrder: 1
    });

    expect(result.message.channel).toBe("EMAIL");
    expect(result.message.status).toBe("SENT");
    expect(result.updatedStage).toBe("CONTACTED");
  });

  it("records guided TikTok DM queue copy events and logs a TIKTOK_DM outreach message", () => {
    const result = markTikTokDmDispatched({
      campaignCreatorId: "cc_zoe_serum",
      dmScript: "Hey Zoe! Just emailed you our $300 CloudDew Cica Serum offer ✨"
    });

    expect(result.entry.dmCopiedAt).not.toBeNull();
    expect(result.entry.stage).toBe("CONTACTED");
    expect(result.message.channel).toBe("TIKTOK_DM");
    expect(result.message.status).toBe("COPIED_FOR_DM");
  });

  it("updates campaign pipeline stages across the Kanban workflow", () => {
    const updated = updateCampaignCreatorStage({
      campaignCreatorId: "cc_kayla_serum",
      stage: "NEGOTIATING"
    });
    expect(updated?.stage).toBe("NEGOTIATING");

    const campaigns = listCampaignsForWorkspace("ws_glowbotanics");
    const entry = campaigns[0].entries.find((e) => e.id === "cc_kayla_serum");
    expect(entry?.stage).toBe("NEGOTIATING");
  });
});
