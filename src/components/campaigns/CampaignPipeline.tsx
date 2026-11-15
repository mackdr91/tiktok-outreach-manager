"use client";

/*
Author: Domonick Mack
Date: 2026-11-15
Description: TikTok Campaign Pipeline module with switchable Kanban Board and High-Density Table views, budget tracking, and seeding logistics.
*/

import React, { useCallback, useEffect, useState } from "react";
import {
  ArrowRight,
  ExternalLink,
  Kanban,
  Package,
  Plus,
  Sparkles,
  Table2,
  UserPlus,
  X
} from "lucide-react";
import {
  CampaignCreatorRecord,
  CampaignRecord,
  CreatorRecord,
  PIPELINE_STAGES,
  PipelineStageId
} from "@/lib/types";
import { formatCompactNumber, formatCurrencyUsd } from "@/lib/utils";

interface EnrichedCampaignEntry extends CampaignCreatorRecord {
  creator: CreatorRecord;
}

interface EnrichedCampaign extends CampaignRecord {
  entries: EnrichedCampaignEntry[];
}

interface CampaignPipelineProps {
  workspaceId: string;
}

export function CampaignPipeline({ workspaceId }: CampaignPipelineProps) {
  const [campaigns, setCampaigns] = useState<EnrichedCampaign[]>([]);
  const [allCreators, setAllCreators] = useState<CreatorRecord[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>("");
  const [viewMode, setViewMode] = useState<"KANBAN" | "TABLE">("KANBAN");
  const [loading, setLoading] = useState(true);

  // Modals
  const [showNewCampaignModal, setShowNewCampaignModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);

  // New Campaign states
  const [campName, setCampName] = useState("");
  const [productName, setProductName] = useState("");
  const [productBrief, setProductBrief] = useState("");
  const [budgetUsd, setBudgetUsd] = useState(3000);
  const [defaultFeeUsd, setDefaultFeeUsd] = useState(200);
  const [usageRightsDays, setUsageRightsDays] = useState(90);
  const [exclusivityDays, setExclusivityDays] = useState(30);
  const [targetNiche, setTargetNiche] = useState("Skincare & GRWM");
  const [creatingCampaign, setCreatingCampaign] = useState(false);

  // Assign Creator states
  const [selectedCreatorId, setSelectedCreatorId] = useState("");
  const [customFeeUsd, setCustomFeeUsd] = useState(200);
  const [assigningCreator, setAssigningCreator] = useState(false);

  const fetchCampaigns = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/campaigns?workspaceId=${encodeURIComponent(workspaceId)}`
      );
      if (res.ok) {
        const data = await res.json();
        setCampaigns(data.campaigns);
        setAllCreators(data.allCreators);
        if (data.campaigns.length > 0 && !selectedCampaignId) {
          setSelectedCampaignId(data.campaigns[0].id);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [workspaceId, selectedCampaignId]);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  const activeCampaign =
    campaigns.find((c) => c.id === selectedCampaignId) || campaigns[0] || null;

  const committedSpend = activeCampaign
    ? activeCampaign.entries.reduce((sum, e) => sum + e.agreedRateUsd, 0)
    : 0;

  const handleUpdateStage = async (
    campaignCreatorId: string,
    stage: PipelineStageId
  ) => {
    const res = await fetch("/api/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "update_entry",
        campaignCreatorId,
        stage
      })
    });
    if (res.ok) {
      await fetchCampaigns();
    }
  };

  const handleUpdateLogistics = async (
    campaignCreatorId: string,
    patch: {
      shippingStatus?: "PENDING" | "SHIPPED" | "DELIVERED";
      payoutStatus?: "UNPAID" | "SCHEDULED" | "PAID";
    }
  ) => {
    const res = await fetch("/api/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "update_entry",
        campaignCreatorId,
        ...patch
      })
    });
    if (res.ok) {
      await fetchCampaigns();
    }
  };

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!campName.trim() || !productName.trim()) return;
    setCreatingCampaign(true);
    try {
      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_campaign",
          workspaceId,
          name: campName,
          productName,
          productBrief:
            productBrief ||
            `Show an authentic TikTok demo of ${productName} in the first 3 seconds.`,
          budgetUsd,
          defaultFeeUsd,
          usageRightsDays,
          sparkAdsRequired: true,
          exclusivityDays,
          targetNiche
        })
      });
      if (res.ok) {
        const data = await res.json();
        setCampaigns(data.campaigns);
        setSelectedCampaignId(data.campaign.id);
        setShowNewCampaignModal(false);
        setCampName("");
        setProductName("");
        setProductBrief("");
      }
    } finally {
      setCreatingCampaign(false);
    }
  };

  const handleAssignCreator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCampaign || !selectedCreatorId) return;
    setAssigningCreator(true);
    try {
      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "assign_creator",
          campaignId: activeCampaign.id,
          creatorId: selectedCreatorId,
          agreedRateUsd: customFeeUsd
        })
      });
      if (res.ok) {
        setShowAssignModal(false);
        await fetchCampaigns();
      }
    } finally {
      setAssigningCreator(false);
    }
  };

  const getNextStage = (current: PipelineStageId): PipelineStageId | null => {
    const idx = PIPELINE_STAGES.findIndex((s) => s.id === current);
    if (idx >= 0 && idx < PIPELINE_STAGES.length - 1) {
      return PIPELINE_STAGES[idx + 1].id;
    }
    return null;
  };

  return (
    <div className="space-y-5">
      {/* Campaign Header & View Switcher */}
      <div className="flex flex-col justify-between gap-4 rounded-xl border border-slate-200 bg-white p-5 dark:border-[#1F2230] dark:bg-[#11131A] lg:flex-row lg:items-center">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-3">
            <select
              aria-label="Select Active Campaign"
              value={activeCampaign?.id || ""}
              onChange={(e) => setSelectedCampaignId(e.target.value)}
              className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-1.5 text-sm font-bold text-slate-900 focus:border-[#25F4EE] focus:outline-none dark:border-[#1F2230] dark:bg-[#090A0F] dark:text-[#F3F5F8]"
            >
              {campaigns.map((camp) => (
                <option key={camp.id} value={camp.id}>
                  {camp.name}
                </option>
              ))}
            </select>
            {activeCampaign && (
              <span className="rounded-md bg-[#25F4EE]/15 px-2.5 py-1 font-mono text-xs font-medium text-[#0891B2] dark:text-[#25F4EE]">
                {activeCampaign.usageRightsDays}d Spark Ads + {activeCampaign.exclusivityDays}d Exclusivity
              </span>
            )}
          </div>
          {activeCampaign && (
            <p className="max-w-3xl text-xs text-slate-500 dark:text-[#8A90A6]">
              <strong className="text-slate-700 dark:text-slate-300">
                {activeCampaign.productName}:
              </strong>{" "}
              {activeCampaign.productBrief}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-1 dark:border-[#1F2230] dark:bg-[#090A0F]">
            <button
              type="button"
              onClick={() => setViewMode("KANBAN")}
              className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition ${
                viewMode === "KANBAN"
                  ? "bg-white text-slate-900 shadow-sm dark:bg-[#1F2230] dark:text-[#25F4EE]"
                  : "text-slate-500 dark:text-[#8A90A6]"
              }`}
            >
              <Kanban className="h-3.5 w-3.5" />
              Kanban
            </button>
            <button
              type="button"
              onClick={() => setViewMode("TABLE")}
              className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition ${
                viewMode === "TABLE"
                  ? "bg-white text-slate-900 shadow-sm dark:bg-[#1F2230] dark:text-[#25F4EE]"
                  : "text-slate-500 dark:text-[#8A90A6]"
              }`}
            >
              <Table2 className="h-3.5 w-3.5" />
              Table
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              if (allCreators.length > 0) {
                setSelectedCreatorId(allCreators[0].id);
                setCustomFeeUsd(allCreators[0].estimatedRateUsd);
              }
              setShowAssignModal(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-800 hover:border-[#25F4EE] dark:border-[#1F2230] dark:bg-[#090A0F] dark:text-[#F3F5F8]"
          >
            <UserPlus className="h-3.5 w-3.5 text-[#25F4EE]" />
            Add Creator to Campaign
          </button>

          <button
            type="button"
            onClick={() => setShowNewCampaignModal(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#FE2C55] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#FE2C55]/90"
          >
            <Plus className="h-3.5 w-3.5" />
            New Campaign
          </button>
        </div>
      </div>

      {/* Budget & Seeding Summary Bar */}
      {activeCampaign && (
        <div className="grid gap-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-[#1F2230] dark:bg-[#11131A] sm:grid-cols-4">
          <div>
            <span className="text-[11px] text-slate-500 dark:text-[#8A90A6]">
              Campaign Budget Allocation
            </span>
            <p className="font-mono text-base font-bold text-slate-900 dark:text-[#F3F5F8]">
              {formatCurrencyUsd(committedSpend)} / {formatCurrencyUsd(activeCampaign.budgetUsd)}
            </p>
          </div>
          <div>
            <span className="text-[11px] text-slate-500 dark:text-[#8A90A6]">
              Enrolled TikTok Creators
            </span>
            <p className="font-mono text-base font-bold text-[#25F4EE]">
              {activeCampaign.entries.length} creators
            </p>
          </div>
          <div>
            <span className="text-[11px] text-slate-500 dark:text-[#8A90A6]">
              PR Kits Shipped / Delivered
            </span>
            <p className="font-mono text-base font-bold text-emerald-400">
              {
                activeCampaign.entries.filter((e) => e.shippingStatus !== "PENDING")
                  .length
              }{" "}
              / {activeCampaign.entries.length}
            </p>
          </div>
          <div>
            <span className="text-[11px] text-slate-500 dark:text-[#8A90A6]">
              Live TikTok Posts
            </span>
            <p className="font-mono text-base font-bold text-[#FE2C55]">
              {activeCampaign.entries.filter((e) => e.stage === "LIVE").length} live
            </p>
          </div>
        </div>
      )}

      {/* Kanban Board View */}
      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-xs text-slate-400 dark:border-[#1F2230] dark:bg-[#11131A]">
          Loading TikTok campaign pipeline...
        </div>
      ) : !activeCampaign ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-xs text-slate-400 dark:border-[#1F2230] dark:bg-[#11131A]">
          No campaigns found in this workspace.
        </div>
      ) : viewMode === "KANBAN" ? (
        <div className="flex gap-3.5 overflow-x-auto pb-4">
          {PIPELINE_STAGES.map((stage) => {
            const stageEntries = activeCampaign.entries.filter(
              (e) => e.stage === stage.id
            );
            return (
              <div
                key={stage.id}
                className="flex w-72 shrink-0 flex-col rounded-xl border border-slate-200 bg-slate-100/70 p-3 dark:border-[#1F2230] dark:bg-[#11131A]/90"
              >
                <div className="mb-3 flex items-center justify-between px-1">
                  <span
                    className={`rounded-md border px-2 py-0.5 font-mono text-[11px] font-semibold ${stage.color}`}
                  >
                    {stage.label}
                  </span>
                  <span className="font-mono text-xs font-bold text-slate-500 dark:text-[#8A90A6]">
                    {stageEntries.length}
                  </span>
                </div>

                <div className="space-y-2.5">
                  {stageEntries.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-slate-200 p-4 text-center text-[11px] text-slate-400 dark:border-[#1F2230]">
                      No creators in stage
                    </div>
                  ) : (
                    stageEntries.map((entry) => {
                      const nextStage = getNextStage(entry.stage);
                      return (
                        <div
                          key={entry.id}
                          className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm dark:border-[#1F2230] dark:bg-[#090A0F]"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="text-xs font-bold text-slate-900 dark:text-[#F3F5F8]">
                                {entry.creator.displayName}
                              </p>
                              <a
                                href={entry.creator.profileUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-0.5 font-mono text-[11px] text-[#25F4EE] hover:underline"
                              >
                                @{entry.creator.tiktokHandle}
                                <ExternalLink className="h-2.5 w-2.5" />
                              </a>
                            </div>
                            <span className="font-mono text-xs font-bold text-emerald-400">
                              {formatCurrencyUsd(entry.agreedRateUsd)}
                            </span>
                          </div>

                          <div className="mt-2 flex items-center gap-2 font-mono text-[10px] text-slate-500 dark:text-[#8A90A6]">
                            <span>{formatCompactNumber(entry.creator.followerCount)} flw</span>
                            <span>•</span>
                            <span className="text-[#25F4EE]">
                              {entry.creator.engagementRate}% ER
                            </span>
                            <span>•</span>
                            <span className="inline-flex items-center gap-0.5">
                              <Package className="h-3 w-3" />
                              {entry.shippingStatus}
                            </span>
                          </div>

                          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5 dark:border-[#1F2230]">
                            <a
                              href={`/portal/${entry.magicLinkToken}`}
                              target="_blank"
                              rel="noreferrer"
                              className="font-mono text-[10px] text-slate-400 hover:text-[#25F4EE]"
                            >
                              Portal Link ↗
                            </a>
                            {nextStage && (
                              <button
                                type="button"
                                onClick={() => handleUpdateStage(entry.id, nextStage)}
                                className="inline-flex items-center gap-1 rounded bg-[#25F4EE]/15 px-2 py-1 font-mono text-[10px] font-semibold text-[#0891B2] hover:bg-[#25F4EE]/25 dark:text-[#25F4EE]"
                              >
                                Advance
                                <ArrowRight className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* High-Density Table View */
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-[#1F2230] dark:bg-[#11131A]">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] uppercase tracking-wider text-slate-500 dark:border-[#1F2230] dark:bg-[#090A0F]/60 dark:text-[#8A90A6]">
                  <th className="px-4 py-3 font-medium">Creator</th>
                  <th className="px-4 py-3 font-medium">Pipeline Stage</th>
                  <th className="px-4 py-3 font-medium">Agreed Fee</th>
                  <th className="px-4 py-3 font-medium">PR Seeding</th>
                  <th className="px-4 py-3 font-medium">Payout</th>
                  <th className="px-4 py-3 text-right font-medium">Creator Portal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-[#1F2230]">
                {activeCampaign.entries.map((entry) => (
                  <tr key={entry.id}>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-900 dark:text-[#F3F5F8]">
                        {entry.creator.displayName}
                      </p>
                      <span className="font-mono text-[11px] text-[#25F4EE]">
                        @{entry.creator.tiktokHandle}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        aria-label="Update Creator Stage"
                        value={entry.stage}
                        onChange={(e) =>
                          handleUpdateStage(entry.id, e.target.value as PipelineStageId)
                        }
                        className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 font-mono text-xs dark:border-[#1F2230] dark:bg-[#090A0F]"
                      >
                        {PIPELINE_STAGES.map((st) => (
                          <option key={st.id} value={st.id}>
                            {st.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 font-mono font-semibold text-emerald-400">
                      {formatCurrencyUsd(entry.agreedRateUsd)}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        aria-label="Update Shipping Status"
                        value={entry.shippingStatus}
                        onChange={(e) =>
                          handleUpdateLogistics(entry.id, {
                            shippingStatus: e.target.value as
                              | "PENDING"
                              | "SHIPPED"
                              | "DELIVERED"
                          })
                        }
                        className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 font-mono text-[11px] dark:border-[#1F2230] dark:bg-[#090A0F]"
                      >
                        <option value="PENDING">PENDING</option>
                        <option value="SHIPPED">SHIPPED</option>
                        <option value="DELIVERED">DELIVERED</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        aria-label="Update Payout Status"
                        value={entry.payoutStatus}
                        onChange={(e) =>
                          handleUpdateLogistics(entry.id, {
                            payoutStatus: e.target.value as
                              | "UNPAID"
                              | "SCHEDULED"
                              | "PAID"
                          })
                        }
                        className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 font-mono text-[11px] dark:border-[#1F2230] dark:bg-[#090A0F]"
                      >
                        <option value="UNPAID">UNPAID</option>
                        <option value="SCHEDULED">SCHEDULED</option>
                        <option value="PAID">PAID</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <a
                        href={`/portal/${entry.magicLinkToken}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 rounded-md border border-[#25F4EE]/40 bg-[#25F4EE]/10 px-2.5 py-1 font-mono text-[11px] text-[#25F4EE] hover:bg-[#25F4EE]/20"
                      >
                        Open Portal ↗
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Campaign Modal */}
      {showNewCampaignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-xl dark:border-[#1F2230] dark:bg-[#11131A]">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[#FE2C55]" />
                <h3 className="text-base font-semibold">Launch New TikTok Campaign</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowNewCampaignModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCampaign} className="space-y-3.5">
              <div>
                <label className="mb-1 block text-xs font-medium">Campaign Name *</label>
                <input
                  type="text"
                  required
                  value={campName}
                  onChange={(e) => setCampName(e.target.value)}
                  placeholder="Spring SPF Mist Seeding & Spark Wave"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs dark:border-[#1F2230] dark:bg-[#090A0F]"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium">Featured Product *</label>
                <input
                  type="text"
                  required
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="SolarDew Invisible SPF 50 Setting Mist"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs dark:border-[#1F2230] dark:bg-[#090A0F]"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium">
                  Creator Deliverable Brief
                </label>
                <textarea
                  rows={2}
                  value={productBrief}
                  onChange={(e) => setProductBrief(e.target.value)}
                  placeholder="Apply over full makeup in natural sunlight to show zero white cast..."
                  className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-xs dark:border-[#1F2230] dark:bg-[#090A0F]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div>
                  <label className="mb-1 block text-[11px] text-slate-400">
                    Budget (USD)
                  </label>
                  <input
                    type="number"
                    value={budgetUsd}
                    onChange={(e) => setBudgetUsd(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 font-mono text-xs dark:border-[#1F2230] dark:bg-[#090A0F]"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] text-slate-400">
                    Default Fee
                  </label>
                  <input
                    type="number"
                    value={defaultFeeUsd}
                    onChange={(e) => setDefaultFeeUsd(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 font-mono text-xs dark:border-[#1F2230] dark:bg-[#090A0F]"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] text-slate-400">
                    Usage Days
                  </label>
                  <input
                    type="number"
                    value={usageRightsDays}
                    onChange={(e) => setUsageRightsDays(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 font-mono text-xs dark:border-[#1F2230] dark:bg-[#090A0F]"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] text-slate-400">
                    Exclusivity (d)
                  </label>
                  <input
                    type="number"
                    value={exclusivityDays}
                    onChange={(e) => setExclusivityDays(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 font-mono text-xs dark:border-[#1F2230] dark:bg-[#090A0F]"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium">Target Niche</label>
                <input
                  type="text"
                  value={targetNiche}
                  onChange={(e) => setTargetNiche(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs dark:border-[#1F2230] dark:bg-[#090A0F]"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewCampaignModal(false)}
                  className="rounded-lg border border-slate-300 px-3.5 py-2 text-xs dark:border-[#1F2230]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingCampaign}
                  className="rounded-lg bg-[#FE2C55] px-4 py-2 text-xs font-semibold text-white hover:bg-[#FE2C55]/90"
                >
                  {creatingCampaign ? "Creating..." : "Create Campaign"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Creator Modal */}
      {showAssignModal && activeCampaign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl dark:border-[#1F2230] dark:bg-[#11131A]">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold">
                Add Creator to {activeCampaign.name}
              </h3>
              <button
                type="button"
                onClick={() => setShowAssignModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleAssignCreator} className="space-y-3.5">
              <div>
                <label className="mb-1 block text-xs font-medium">
                  Select TikTok Creator
                </label>
                <select
                  value={selectedCreatorId}
                  onChange={(e) => {
                    const id = e.target.value;
                    setSelectedCreatorId(id);
                    const found = allCreators.find((c) => c.id === id);
                    if (found) setCustomFeeUsd(found.estimatedRateUsd);
                  }}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs dark:border-[#1F2230] dark:bg-[#090A0F]"
                >
                  {allCreators.map((c) => (
                    <option key={c.id} value={c.id}>
                      @{c.tiktokHandle} ({c.displayName}) — Est. ${c.estimatedRateUsd}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium">
                  Offer Flat Fee (USD)
                </label>
                <input
                  type="number"
                  value={customFeeUsd}
                  onChange={(e) => setCustomFeeUsd(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-xs dark:border-[#1F2230] dark:bg-[#090A0F]"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="rounded-lg border border-slate-300 px-3.5 py-2 text-xs dark:border-[#1F2230]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={assigningCreator}
                  className="rounded-lg bg-[#FE2C55] px-4 py-2 text-xs font-semibold text-white hover:bg-[#FE2C55]/90"
                >
                  {assigningCreator ? "Assigning..." : "Add & Generate AI Pitch"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
