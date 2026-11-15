/*
Author: Domonick Mack
Date: 2026-11-15
Description: Unit and integration tests for Phase 2 authentication, JWT session tokens, multi-brand workspaces, and KPI metrics.
*/

import { beforeEach, describe, expect, it } from "vitest";
import {
  hashPassword,
  signSessionToken,
  verifyPassword,
  verifySessionToken
} from "@/lib/auth";
import {
  createWorkspace,
  getWorkspaceById,
  getWorkspaceDashboardMetrics,
  inviteWorkspaceMember,
  listWorkspaces,
  resetStore
} from "@/lib/store";

describe("Phase 2: Multi-Brand Auth, Workspaces & Dashboard Metrics", () => {
  beforeEach(() => {
    resetStore();
  });

  it("hashes and verifies user passwords accurately", async () => {
    const hash = await hashPassword("SecureBrandPass2026!");
    expect(hash).not.toBe("SecureBrandPass2026!");
    expect(await verifyPassword("SecureBrandPass2026!", hash)).toBe(true);
    expect(await verifyPassword("WrongPassword", hash)).toBe(false);
  });

  it("signs and verifies JWT session payloads", async () => {
    const token = await signSessionToken({
      userId: "user_founder_1",
      email: "domonick@glowbotanics.co",
      fullName: "Domonick Mack",
      activeWorkspaceId: "ws_glowbotanics"
    });
    const decoded = await verifySessionToken(token);
    expect(decoded).not.toBeNull();
    expect(decoded?.email).toBe("domonick@glowbotanics.co");
    expect(decoded?.activeWorkspaceId).toBe("ws_glowbotanics");
    expect(await verifySessionToken("invalid.token.string")).toBeNull();
  });

  it("creates new brand workspaces and invites team members", () => {
    const initialCount = listWorkspaces().length;
    const created = createWorkspace({
      name: "AuraMatcha Rituals",
      brandWebsite: "https://auramatcha.co",
      productCategory: "Beverage & Matcha",
      defaultSenderName: "Domonick at AuraMatcha",
      defaultSenderEmail: "collabs@auramatcha.co",
      ownerEmail: "domonick@glowbotanics.co",
      ownerName: "Domonick Mack"
    });

    expect(listWorkspaces().length).toBe(initialCount + 1);
    expect(created.slug).toBe("auramatcha-rituals");
    expect(created.members.length).toBe(1);

    const invited = inviteWorkspaceMember({
      workspaceId: created.id,
      inviteEmail: "coordinator@auramatcha.co",
      fullName: "Taylor Kim",
      role: "ADMIN"
    });

    expect(invited.status).toBe("INVITED");
    expect(getWorkspaceById(created.id).members.length).toBe(2);
  });

  it("calculates workspace KPI metrics and expiring usage rights accurately", () => {
    const metrics = getWorkspaceDashboardMetrics("ws_glowbotanics");
    expect(metrics.totalCreators).toBeGreaterThanOrEqual(5);
    expect(metrics.activeCampaigns).toBe(2);
    expect(metrics.signedContractsCount).toBe(2);
    expect(metrics.pendingDraftsCount).toBe(1);
    expect(metrics.expiringUsageRights.length).toBeGreaterThanOrEqual(1);
  });
});
