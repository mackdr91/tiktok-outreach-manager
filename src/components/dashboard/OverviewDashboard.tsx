"use client";

/*
Author: Domonick Mack
Date: 2026-11-15
Description: Executive KPI dashboard, outreach funnel visualization, usage-rights alert panel, and team/brand workspace settings.
*/

import React, { useState } from "react";
import {
  AlertTriangle,
  ArrowUpRight,
  Building2,
  CheckCircle2,
  ExternalLink,
  FileSignature,
  Flame,
  MessageSquare,
  Plus,
  Send,
  Sparkles,
  UserPlus,
  Users
} from "lucide-react";
import { PIPELINE_STAGES, WorkspaceRecord } from "@/lib/types";
import { formatCurrencyUsd } from "@/lib/utils";

export interface DashboardMetricsData {
  totalCreators: number;
  activeCampaigns: number;
  contactedCount: number;
  replyRatePercent: number;
  signedContractsCount: number;
  pendingDraftsCount: number;
  dmQueueCount: number;
  avgEngagementRate: number;
  expiringUsageRights: Array<{
    deliverableId: string;
    creatorHandle: string;
    tiktokPostUrl: string;
    sparkAdCode: string;
    usageExpiresAt: string;
  }>;
  pipelineStageCounts: Record<string, number>;
}

interface OverviewDashboardProps {
  workspace: WorkspaceRecord;
  metrics: DashboardMetricsData;
  onNavigateTab: (tab: string) => void;
  onInviteMember: (payload: {
    inviteEmail: string;
    fullName: string;
    role: "ADMIN" | "MEMBER";
  }) => Promise<void>;
  onCreateWorkspace: (payload: {
    name: string;
    brandWebsite: string;
    productCategory: string;
    defaultSenderName: string;
    defaultSenderEmail: string;
  }) => Promise<void>;
}

export function OverviewDashboard({
  workspace,
  metrics,
  onNavigateTab,
  onInviteMember,
  onCreateWorkspace
}: OverviewDashboardProps) {
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteRole, setInviteRole] = useState<"ADMIN" | "MEMBER">("MEMBER");
  const [inviteBusy, setInviteBusy] = useState(false);
  const [inviteFeedback, setInviteFeedback] = useState<string | null>(null);

  const [showNewBrandModal, setShowNewBrandModal] = useState(false);
  const [brandName, setBrandName] = useState("");
  const [brandWebsite, setBrandWebsite] = useState("");
  const [productCategory, setProductCategory] = useState("");
  const [senderName, setSenderName] = useState("");
  const [senderEmail, setSenderEmail] = useState("");
  const [createBrandBusy, setCreateBrandBusy] = useState(false);

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !inviteName.trim()) return;
    setInviteBusy(true);
    setInviteFeedback(null);
    try {
      await onInviteMember({
        inviteEmail: inviteEmail.trim(),
        fullName: inviteName.trim(),
        role: inviteRole
      });
      setInviteEmail("");
      setInviteName("");
      setInviteFeedback("Team invitation sent and added to workspace roster.");
    } finally {
      setInviteBusy(false);
    }
  };

  const handleCreateBrandSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brandName.trim() || !senderEmail.trim()) return;
    setCreateBrandBusy(true);
    try {
      await onCreateWorkspace({
        name: brandName.trim(),
        brandWebsite: brandWebsite.trim(),
        productCategory: productCategory.trim() || "Consumer Brand",
        defaultSenderName: senderName.trim() || `${brandName.trim()} Team`,
        defaultSenderEmail: senderEmail.trim()
      });
      setShowNewBrandModal(false);
      setBrandName("");
      setBrandWebsite("");
      setProductCategory("");
      setSenderName("");
      setSenderEmail("");
    } finally {
      setCreateBrandBusy(false);
    }
  };

  const kpiCards = [
    {
      label: "Vetted TikTok Creators",
      value: metrics.totalCreators.toString(),
      subtext: `${metrics.avgEngagementRate}% avg view engagement`,
      icon: Users,
      accent: "text-[#25F4EE]",
      targetTab: "creators"
    },
    {
      label: "Outreach Reply Rate",
      value: `${metrics.replyRatePercent}%`,
      subtext: `${metrics.contactedCount} creators contacted`,
      icon: Send,
      accent: "text-emerald-400",
      targetTab: "outreach"
    },
    {
      label: "TikTok DM Queue",
      value: metrics.dmQueueCount.toString(),
      subtext: "Ready for 1-click DM copy",
      icon: MessageSquare,
      accent: "text-[#FE2C55]",
      targetTab: "outreach"
    },
    {
      label: "Signed Contracts & Drafts",
      value: `${metrics.signedContractsCount} signed`,
      subtext: `${metrics.pendingDraftsCount} deliverables awaiting review`,
      icon: FileSignature,
      accent: "text-amber-400",
      targetTab: "contracts"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Top Workspace Banner */}
      <div className="flex flex-col justify-between gap-4 rounded-xl border border-slate-200 bg-white p-5 dark:border-[#1F2230] dark:bg-[#11131A] sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center rounded-md bg-[#25F4EE]/15 px-2 py-0.5 font-mono text-xs font-medium text-[#0891B2] dark:text-[#25F4EE]">
              {workspace.productCategory}
            </span>
            <a
              href={workspace.brandWebsite}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 font-mono text-xs text-slate-500 hover:text-slate-800 dark:text-[#8A90A6] dark:hover:text-white"
            >
              {workspace.brandWebsite}
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
          <h2 className="mt-1.5 text-xl font-bold tracking-tight text-slate-900 dark:text-[#F3F5F8]">
            {workspace.name} — Command Center
          </h2>
          <p className="text-xs text-slate-500 dark:text-[#8A90A6]">
            Default Outreach Sender:{" "}
            <span className="font-mono text-slate-700 dark:text-slate-300">
              {workspace.defaultSenderName} &lt;{workspace.defaultSenderEmail}&gt;
            </span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowNewBrandModal(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-slate-50 px-3.5 py-2 text-xs font-medium text-slate-800 transition hover:border-[#25F4EE] dark:border-[#1F2230] dark:bg-[#090A0F] dark:text-[#F3F5F8]"
          >
            <Building2 className="h-3.5 w-3.5 text-[#25F4EE]" />
            New Brand Workspace
          </button>
          <button
            type="button"
            onClick={() => onNavigateTab("creators")}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#FE2C55] px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[#FE2C55]/90"
          >
            <Plus className="h-3.5 w-3.5" />
            Add TikTok Creators
          </button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpiCards.map((card) => {
          const Icon = card.icon;
          return (
            <button
              key={card.label}
              type="button"
              onClick={() => onNavigateTab(card.targetTab)}
              className="group flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 text-left transition hover:border-[#25F4EE]/50 dark:border-[#1F2230] dark:bg-[#11131A]"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 dark:text-[#8A90A6]">
                  {card.label}
                </span>
                <Icon className={`h-4 w-4 ${card.accent}`} />
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="font-mono text-2xl font-bold text-slate-900 dark:text-[#F3F5F8]">
                  {card.value}
                </span>
                <ArrowUpRight className="h-4 w-4 text-slate-400 opacity-0 transition group-hover:opacity-100 dark:text-[#8A90A6]" />
              </div>
              <p className="mt-1.5 text-xs text-slate-500 dark:text-[#8A90A6]">{card.subtext}</p>
            </button>
          );
        })}
      </div>

      {/* Pipeline Conversion Funnel + Usage Rights Alerts */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-[#1F2230] dark:bg-[#11131A] lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-[#F3F5F8]">
                TikTok Collaboration Pipeline Velocity
              </h3>
              <p className="text-xs text-slate-500 dark:text-[#8A90A6]">
                Creator distribution across active campaign stages
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab("campaigns")}
              className="text-xs font-medium text-[#0891B2] hover:underline dark:text-[#25F4EE]"
            >
              Open Kanban Board →
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {PIPELINE_STAGES.map((stage) => {
              const count = metrics.pipelineStageCounts[stage.id] ?? 0;
              return (
                <div
                  key={stage.id}
                  className="rounded-lg border border-slate-200 bg-slate-50/60 p-3 dark:border-[#1F2230] dark:bg-[#090A0F]"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-medium text-slate-500 dark:text-[#8A90A6]">
                      {stage.label}
                    </span>
                    <span className="font-mono text-sm font-bold text-slate-900 dark:text-[#F3F5F8]">
                      {count}
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-[#1F2230]">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#25F4EE] to-[#FE2C55]"
                      style={{ width: `${Math.min(100, count * 28)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Paid Usage Rights & Spark Ads Watchlist */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-[#1F2230] dark:bg-[#11131A]">
          <div className="mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-[#FE2C55]" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-[#F3F5F8]">
              Spark Ads & Usage Window Alerts
            </h3>
          </div>
          <p className="mb-4 text-xs text-slate-500 dark:text-[#8A90A6]">
            Paid amplification rights expiring within 14 days
          </p>

          {metrics.expiringUsageRights.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-200 p-4 text-center text-xs text-slate-500 dark:border-[#1F2230] dark:text-[#8A90A6]">
              All active Spark Ad usage windows have &gt;14 days remaining.
            </div>
          ) : (
            <div className="space-y-3">
              {metrics.expiringUsageRights.map((item) => (
                <div
                  key={item.deliverableId}
                  className="rounded-lg border border-[#FE2C55]/30 bg-[#FE2C55]/5 p-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-semibold text-[#FE2C55]">
                      @{item.creatorHandle}
                    </span>
                    <span className="font-mono text-[11px] text-slate-500 dark:text-[#8A90A6]">
                      Expires {new Date(item.usageExpiresAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="mt-1.5 flex items-center justify-between text-xs">
                    <span className="font-mono text-[11px] text-slate-600 dark:text-slate-300">
                      Code: {item.sparkAdCode || "N/A"}
                    </span>
                    <button
                      type="button"
                      onClick={() => onNavigateTab("contracts")}
                      className="text-[11px] font-medium text-[#0891B2] hover:underline dark:text-[#25F4EE]"
                    >
                      Manage →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Multi-Brand Team Roster & Invite Section */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-[#1F2230] dark:bg-[#11131A] lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-[#F3F5F8]">
                Workspace Team Roster ({workspace.members.length})
              </h3>
              <p className="text-xs text-slate-500 dark:text-[#8A90A6]">
                Collaborators with access to {workspace.name} campaigns & creator contracts
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 dark:border-[#1F2230] dark:text-[#8A90A6]">
                  <th className="pb-2.5 font-medium">Team Member</th>
                  <th className="pb-2.5 font-medium">Email</th>
                  <th className="pb-2.5 font-medium">Role</th>
                  <th className="pb-2.5 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-[#1F2230]">
                {workspace.members.map((member) => (
                  <tr key={member.id}>
                    <td className="py-3 font-medium text-slate-900 dark:text-[#F3F5F8]">
                      {member.fullName}
                    </td>
                    <td className="py-3 font-mono text-slate-600 dark:text-[#8A90A6]">
                      {member.inviteEmail}
                    </td>
                    <td className="py-3">
                      <span className="rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 font-mono text-[11px] dark:border-[#1F2230] dark:bg-[#090A0F]">
                        {member.role}
                      </span>
                    </td>
                    <td className="py-3">
                      {member.status === "ACTIVE" ? (
                        <span className="inline-flex items-center gap-1 text-emerald-500">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-amber-400">
                          <Sparkles className="h-3.5 w-3.5" />
                          Invited
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Invite Collaborator Form */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-[#1F2230] dark:bg-[#11131A]">
          <div className="mb-3 flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-[#25F4EE]" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-[#F3F5F8]">
              Invite Brand Collaborator
            </h3>
          </div>
          <p className="mb-4 text-xs text-slate-500 dark:text-[#8A90A6]">
            Grant your social or influencer coordinator access to this workspace.
          </p>

          <form onSubmit={handleInviteSubmit} className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
                Full Name
              </label>
              <input
                type="text"
                required
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
                placeholder="Alex Rivera"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-[#25F4EE] focus:outline-none dark:border-[#1F2230] dark:bg-[#090A0F] dark:text-[#F3F5F8]"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
                Work Email
              </label>
              <input
                type="email"
                required
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="alex@brand.com"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-[#25F4EE] focus:outline-none dark:border-[#1F2230] dark:bg-[#090A0F] dark:text-[#F3F5F8]"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
                Workspace Role
              </label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as "ADMIN" | "MEMBER")}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-[#25F4EE] focus:outline-none dark:border-[#1F2230] dark:bg-[#090A0F] dark:text-[#F3F5F8]"
              >
                <option value="MEMBER">MEMBER (Outreach & Deliverables)</option>
                <option value="ADMIN">ADMIN (Full Workspace & Contracts)</option>
              </select>
            </div>
            {inviteFeedback && (
              <p className="text-xs text-emerald-500">{inviteFeedback}</p>
            )}
            <button
              type="submit"
              disabled={inviteBusy}
              className="w-full rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50 dark:bg-[#25F4EE] dark:text-[#090A0F] dark:hover:bg-[#25F4EE]/90"
            >
              {inviteBusy ? "Sending Invite..." : "Send Workspace Invite"}
            </button>
          </form>
        </div>
      </div>

      {/* Create New Brand Workspace Modal */}
      {showNewBrandModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl dark:border-[#1F2230] dark:bg-[#11131A]">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame className="h-4 w-4 text-[#FE2C55]" />
                <h3 className="text-base font-semibold text-slate-900 dark:text-[#F3F5F8]">
                  Create Brand Workspace
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowNewBrandModal(false)}
                className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                ESC
              </button>
            </div>
            <form onSubmit={handleCreateBrandSubmit} className="space-y-3.5">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Brand Name *
                </label>
                <input
                  type="text"
                  required
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  placeholder="MatchaCloud Beverage Co."
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 dark:border-[#1F2230] dark:bg-[#090A0F] dark:text-[#F3F5F8]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Website URL
                  </label>
                  <input
                    type="text"
                    value={brandWebsite}
                    onChange={(e) => setBrandWebsite(e.target.value)}
                    placeholder="https://matchacloud.co"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 dark:border-[#1F2230] dark:bg-[#090A0F] dark:text-[#F3F5F8]"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Niche / Category
                  </label>
                  <input
                    type="text"
                    value={productCategory}
                    onChange={(e) => setProductCategory(e.target.value)}
                    placeholder="Beverage & Wellness"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 dark:border-[#1F2230] dark:bg-[#090A0F] dark:text-[#F3F5F8]"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Outreach Sender Name
                  </label>
                  <input
                    type="text"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    placeholder="Domonick at MatchaCloud"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 dark:border-[#1F2230] dark:bg-[#090A0F] dark:text-[#F3F5F8]"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Outreach Sender Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={senderEmail}
                    onChange={(e) => setSenderEmail(e.target.value)}
                    placeholder="collabs@matchacloud.co"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 dark:border-[#1F2230] dark:bg-[#090A0F] dark:text-[#F3F5F8]"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewBrandModal(false)}
                  className="rounded-lg border border-slate-300 px-3.5 py-2 text-xs font-medium text-slate-700 dark:border-[#1F2230] dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createBrandBusy}
                  className="rounded-lg bg-[#FE2C55] px-4 py-2 text-xs font-semibold text-white hover:bg-[#FE2C55]/90 disabled:opacity-50"
                >
                  {createBrandBusy ? "Creating..." : "Create Brand Workspace"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export { formatCurrencyUsd };
