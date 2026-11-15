/*
Author: Domonick Mack
Date: 2026-11-15
Description: Unit and integration tests for Phase 5 TikTok contract builder, Magic-Link e-signature capture, and deliverable review lifecycle.
*/

import { beforeEach, describe, expect, it } from "vitest";
import { getPortalContextByToken, resetStore } from "@/lib/store";
import {
  generateCreatorContract,
  reviewDeliverableByBrand,
  signCreatorContractByToken,
  submitDeliverableByToken,
  validateTikTokVideoUrl
} from "@/lib/contract-engine";

describe("Phase 5: Contract Builder, Deliverable Tracker & Magic-Link Creator Portal", () => {
  beforeEach(() => {
    resetStore();
  });

  it("validates live TikTok post URLs and extracts video IDs", () => {
    const valid = validateTikTokVideoUrl(
      "https://www.tiktok.com/@glowwithmaya/video/7431982341098234112"
    );
    expect(valid.valid).toBe(true);
    expect(valid.videoId).toBe("7431982341098234112");

    const shortValid = validateTikTokVideoUrl("https://vm.tiktok.com/ZM8abc123");
    expect(shortValid.valid).toBe(true);

    const invalid = validateTikTokVideoUrl("https://instagram.com/p/12345");
    expect(invalid.valid).toBe(false);
  });

  it("generates customized TikTok contracts with Spark Ads and usage rights clauses", () => {
    const contract = generateCreatorContract({
      campaignCreatorId: "cc_zoe_serum",
      agreedRateUsd: 320,
      deliverableCount: 2,
      usageRightsDays: 180,
      sparkAdsRequired: true,
      exclusivityRequired: true,
      exclusivityDays: 45,
      revisionRounds: 2,
      paymentTerms: "Net 7 upon live TikTok URL & Spark Ad code submission"
    });

    expect(contract.status).toBe("SENT");
    expect(contract.agreedRateUsd).toBe(320);
    expect(contract.renderedBodyMarkdown).toContain("2 original short-form vertical video(s)");
    expect(contract.renderedBodyMarkdown).toContain("180 days");
    expect(contract.renderedBodyMarkdown).toContain("#ad");
  });

  it("executes legal e-signatures via the Magic-Link Creator Portal token", () => {
    const signed = signCreatorContractByToken({
      magicLinkToken: "tok_nina_barrier_2026",
      signerFullName: "Nina Kowalski",
      signerEmail: "ninakcreates@outlook.com",
      signerIpAddress: "198.51.100.42",
      signerUserAgent: "Mozilla/5.0 (iPhone)"
    });

    expect(signed.status).toBe("SIGNED");
    expect(signed.signerFullName).toBe("Nina Kowalski");
    expect(signed.signerIpAddress).toBe("198.51.100.42");
    expect(signed.signedAt).not.toBeNull();

    const portalContext = getPortalContextByToken("tok_nina_barrier_2026");
    expect(portalContext?.entry.stage).toBe("CONTRACT_SIGNED");
  });

  it("processes the end-to-end deliverable lifecycle from script to live TikTok post and usage expiration", () => {
    const scriptSubmission = submitDeliverableByToken({
      magicLinkToken: "tok_nina_barrier_2026",
      submissionType: "SCRIPT",
      scriptContent: "ASMR glass bottle tapping hook + milky serum texture closeup."
    });
    expect(scriptSubmission.status).toBe("SCRIPT_SUBMITTED");

    const approvedScript = reviewDeliverableByBrand({
      campaignCreatorId: "cc_nina_serum",
      reviewAction: "APPROVE_SCRIPT",
      feedback: "Love the ASMR tapping hook!"
    });
    expect(approvedScript.status).toBe("SCRIPT_APPROVED");
    expect(approvedScript.scriptFeedback).toContain("ASMR tapping hook");

    const draftSubmission = submitDeliverableByToken({
      magicLinkToken: "tok_nina_barrier_2026",
      submissionType: "DRAFT",
      draftVideoUrl: "https://drive.google.com/file/d/nina-asmr-draft"
    });
    expect(draftSubmission.status).toBe("DRAFT_SUBMITTED");

    const approvedDraft = reviewDeliverableByBrand({
      campaignCreatorId: "cc_nina_serum",
      reviewAction: "APPROVE_DRAFT",
      feedback: "Cleared to publish on TikTok!"
    });
    expect(approvedDraft.status).toBe("APPROVED_TO_POST");

    const liveSubmission = submitDeliverableByToken({
      magicLinkToken: "tok_nina_barrier_2026",
      submissionType: "LIVE_POST",
      tiktokPostUrl: "https://www.tiktok.com/@unboxwithnina/video/7439991112223334445",
      sparkAdCode: "SPARK-NINA-2026-ASMR"
    });
    expect(liveSubmission.status).toBe("LIVE");
    expect(liveSubmission.sparkAdCode).toBe("SPARK-NINA-2026-ASMR");
    expect(liveSubmission.usageExpiresAt).not.toBeNull();

    const portalContext = getPortalContextByToken("tok_nina_barrier_2026");
    expect(portalContext?.entry.stage).toBe("LIVE");
    expect(portalContext?.entry.payoutStatus).toBe("SCHEDULED");
  });
});
