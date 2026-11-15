/*
Author: Domonick Mack
Date: 2026-11-15
Description: Unit and integration tests for Phase 3 TikTok creator discovery, AI bio/niche tagging, email extraction, and CSV bulk import.
*/

import { beforeEach, describe, expect, it } from "vitest";
import { listCreators, resetStore, upsertCreator } from "@/lib/store";
import {
  analyzeBioDeterministically,
  analyzeCreatorBioWithAi,
  classifyFollowerTier,
  extractEmailFromBio,
  parseAndImportCreatorCsv,
  SAMPLE_TIKTOK_CREATORS_CSV
} from "@/lib/tiktok-discovery";

describe("Phase 3: Hybrid TikTok Creator Discovery, CSV Importer & AI Bio Enrichment", () => {
  beforeEach(() => {
    resetStore();
  });

  it("extracts creator contact emails embedded inside TikTok bios", () => {
    expect(
      extractEmailFromBio("Esthetician ✨ glass skin routines | collabs: maya@glowwithmaya.com")
    ).toBe("maya@glowwithmaya.com");
    expect(extractEmailFromBio("Just vibes and dancing 💃")).toBeNull();
  });

  it("classifies micro-influencer follower tiers accurately", () => {
    expect(classifyFollowerTier(9500)).toBe("NANO_5K_15K");
    expect(classifyFollowerTier(32000)).toBe("MICRO_15K_50K");
    expect(classifyFollowerTier(85000)).toBe("MID_MICRO_50K_150K");
  });

  it("extracts niche tags and generates personalized outreach hooks from creator bios", async () => {
    const analysis = await analyzeCreatorBioWithAi({
      tiktokHandle: "@glowbysamira",
      displayName: "Samira Khan",
      bio: "Esthetician & barrier repair routines ✨ sensitive skin GRWM | samira@glowbysamira.co",
      followerCount: 29400
    });

    const deterministic = analyzeBioDeterministically({
      tiktokHandle: "@glowbysamira",
      displayName: "Samira Khan",
      bio: "Esthetician & barrier repair routines ✨ sensitive skin GRWM | samira@glowbysamira.co",
      followerCount: 29400
    });
    expect(deterministic.source).toBe("RULE_ENGINE");
    expect(analysis.nicheTags).toContain("skincare");
    expect(analysis.nicheTags).toContain("grwm");
    expect(analysis.extractedEmail).toBe("samira@glowbysamira.co");
    expect(analysis.personalizedHook).toContain("@glowbysamira");
  });

  it("parses and bulk-imports CSV creator rosters with automatic email extraction and rate estimation", async () => {
    const beforeCount = listCreators({ workspaceId: "ws_glowbotanics" }).length;
    const summary = await parseAndImportCreatorCsv({
      workspaceId: "ws_glowbotanics",
      csvText: SAMPLE_TIKTOK_CREATORS_CSV
    });

    expect(summary.importedCount).toBe(4);
    expect(summary.skippedCount).toBe(0);

    const afterCreators = listCreators({ workspaceId: "ws_glowbotanics" });
    expect(afterCreators.length).toBe(beforeCount + 4);

    const samira = afterCreators.find((c) => c.tiktokHandle === "glowbysamira");
    expect(samira).toBeDefined();
    expect(samira?.email).toBe("samira@glowbysamira.co");
    expect(samira?.engagementRate).toBeGreaterThan(8);
  });

  it("filters workspace creators by niche, minimum engagement rate, and max rate USD", () => {
    upsertCreator({
      workspaceId: "ws_glowbotanics",
      tiktokHandle: "@budgetskincare_mia",
      displayName: "Mia L.",
      bio: "Affordable skincare routines",
      followerCount: 12000,
      avgViews: 10000,
      avgLikes: 850,
      avgComments: 60,
      avgShares: 40,
      nicheTags: ["skincare", "budget"]
    });

    const highEngagementSkincare = listCreators({
      workspaceId: "ws_glowbotanics",
      niche: "skincare",
      minEngagementRate: 8,
      maxRateUsd: 270
    });

    expect(highEngagementSkincare.length).toBeGreaterThanOrEqual(2);
    expect(
      highEngagementSkincare.every(
        (c) => c.engagementRate >= 8 && c.estimatedRateUsd <= 270
      )
    ).toBe(true);
  });
});
