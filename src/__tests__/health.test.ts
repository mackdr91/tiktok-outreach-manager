/*
Author: Domonick Mack
Date: 2026-11-15
Description: Unit tests for healthcheck payload and TikTok handle/engagement utility functions.
*/

import { describe, expect, it } from "vitest";
import { buildHealthPayload } from "@/app/api/health/route";
import {
  buildTikTokProfileUrl,
  calculateEngagementRate,
  estimateCreatorRateUsd,
  formatCompactNumber,
  formatCurrencyUsd,
  normalizeTikTokHandle
} from "@/lib/utils";

describe("Phase 1 Foundation & TikTok Utilities", () => {
  it("returns a healthy status payload with valid metadata", () => {
    const payload = buildHealthPayload();
    expect(payload.status).toBe("healthy");
    expect(payload.service).toBe("tokreach-web");
    expect(payload.version).toBe("0.1.0");
    expect(typeof payload.uptimeSeconds).toBe("number");
  });

  it("normalizes TikTok handles from raw @handles and full URLs", () => {
    expect(normalizeTikTokHandle("@GlowWithMaya")).toBe("glowwithmaya");
    expect(normalizeTikTokHandle("@GlowWithMaya", true)).toBe("@glowwithmaya");
    expect(normalizeTikTokHandle("https://www.tiktok.com/@fitchefleo?lang=en")).toBe("fitchefleo");
    expect(normalizeTikTokHandle("   ")).toBe("");
  });

  it("constructs canonical TikTok profile URLs", () => {
    expect(buildTikTokProfileUrl("@GlowWithMaya")).toBe("https://www.tiktok.com/@glowwithmaya");
    expect(buildTikTokProfileUrl("")).toBe("https://www.tiktok.com");
  });

  it("computes accurate TikTok view-based engagement rates", () => {
    const rate = calculateEngagementRate({
      likes: 1400,
      comments: 120,
      shares: 80,
      views: 20000
    });
    expect(rate).toBe(8);
    expect(calculateEngagementRate({ likes: 100, comments: 10, shares: 5, views: 0 })).toBe(0);
  });

  it("estimates fair creator USD deliverable rates and formats numbers", () => {
    const estimatedRate = estimateCreatorRateUsd({
      followerCount: 35000,
      avgViews: 18000,
      engagementRate: 6.5
    });
    expect(estimatedRate).toBeGreaterThanOrEqual(140);
    expect(formatCompactNumber(35400)).toBe("35.4K");
    expect(formatCurrencyUsd(250)).toBe("$250");
  });
});
