"use client";

/*
Author: Domonick Mack
Date: 2026-11-15
Description: Brand Contract Builder, E-Signature Audit Ledger, and TikTok Deliverable & Usage-Rights Review Manager.
*/

import React, { useCallback, useEffect, useState } from "react";
import {
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  FileSignature,
  FileText,
  Plus,
  ShieldCheck,
  Sparkles,
  Video,
  X
} from "lucide-react";
import {
  ContractRecord,
  ContractTemplateRecord,
  CreatorRecord,
  DeliverableRecord
} from "@/lib/types";
import { formatCurrencyUsd } from "@/lib/utils";

interface ContractPipelineItem {
  campaignCreatorId: string;
  campaignId: string;
  campaignName: string;
  productName: string;
  stage: string;
  agreedRateUsd: number;
  magicLinkToken: string;
  payoutStatus: string;
  creator: CreatorRecord;
  contract: ContractRecord | null;
  deliverables: DeliverableRecord[];
}

interface ContractDeliverableManagerProps {
  workspaceId: string;
}

export function ContractDeliverableManager({
  workspaceId
}: ContractDeliverableManagerProps) {
  const [items, setItems] = useState<ContractPipelineItem[]>([]);
  const [templates, setTemplates] = useState<ContractTemplateRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const [showBuilderModal, setShowBuilderModal] = useState(false);
  const [inspectedItem, setInspectedItem] = useState<ContractPipelineItem | null>(
    null
  );
  const [feedbackBanner, setFeedbackBanner] = useState<string | null>(null);

  // Contract Builder states
  const [targetCampaignCreatorId, setTargetCampaignCreatorId] = useState("");
  const [agreedRateUsd, setAgreedRateUsd] = useState(200);
  const [deliverableCount, setDeliverableCount] = useState(1);
  const [usageRightsDays, setUsageRightsDays] = useState(90);
  const [sparkAdsRequired, setSparkAdsRequired] = useState(true);
  const [exclusivityDays, setExclusivityDays] = useState(30);
  const [revisionRounds, setRevisionRounds] = useState(1);
  const [paymentTerms, setPaymentTerms] = useState(
    "Net 7 via ACH/PayPal upon live TikTok URL & Spark Ad authorization code"
  );
  const [generatingContract, setGeneratingContract] = useState(false);

  // Deliverable Review states
  const [reviewNotes, setReviewNotes] = useState("");
  const [reviewBusy, setReviewBusy] = useState(false);

  const fetchContractsAndDeliverables = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/contracts?workspaceId=${encodeURIComponent(workspaceId)}`
      );
      if (res.ok) {
        const data = await res.json();
        setItems(data.items);
        setTemplates(data.templates);
        if (data.items.length > 0 && !targetCampaignCreatorId) {
          setTargetCampaignCreatorId(data.items[0].campaignCreatorId);
          setAgreedRateUsd(data.items[0].agreedRateUsd);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [workspaceId, targetCampaignCreatorId]);

  useEffect(() => {
    fetchContractsAndDeliverables();
  }, [fetchContractsAndDeliverables]);

  const handleGenerateContract = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetCampaignCreatorId) return;
    setGeneratingContract(true);
    try {
      const res = await fetch("/api/contracts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate_contract",
          campaignCreatorId: targetCampaignCreatorId,
          agreedRateUsd,
          deliverableCount,
          usageRightsDays,
          sparkAdsRequired,
          exclusivityRequired: exclusivityDays > 0,
          exclusivityDays,
          revisionRounds,
          paymentTerms
        })
      });
      if (res.ok) {
        setShowBuilderModal(false);
        setFeedbackBanner(
          "TikTok Creator Agreement generated and attached to the creator's Magic-Link Portal."
        );
        await fetchContractsAndDeliverables();
      }
    } finally {
      setGeneratingContract(false);
    }
  };

  const handleReviewAction = async (
    campaignCreatorId: string,
    reviewAction:
      | "APPROVE_SCRIPT"
      | "REQUEST_SCRIPT_REVISION"
      | "APPROVE_DRAFT"
      | "REQUEST_DRAFT_REVISION"
  ) => {
    setReviewBusy(true);
    try {
      const res = await fetch("/api/contracts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "review_deliverable",
          campaignCreatorId,
          reviewAction,
          feedback: reviewNotes
        })
      });
      if (res.ok) {
        setReviewNotes("");
        setFeedbackBanner(`Deliverable review saved (${reviewAction}).`);
        await fetchContractsAndDeliverables();
        setInspectedItem(null);
      }
    } finally {
      setReviewBusy(false);
    }
  };

  const copyToClipboard = async (text: string, label: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      setFeedbackBanner(`Copied ${label} to clipboard.`);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 rounded-xl border border-slate-200 bg-white p-5 dark:border-[#1F2230] dark:bg-[#11131A] sm:flex-row sm:items-center">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-[#F3F5F8]">
            TikTok Contract Builder & Deliverable Tracker
          </h2>
          <p className="text-xs text-slate-500 dark:text-[#8A90A6]">
            Generate Spark Ads & usage-rights agreements, capture magic-link e-signatures, and review scripts, drafts & live TikTok posts.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowBuilderModal(true)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#FE2C55] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#FE2C55]/90"
        >
          <Plus className="h-3.5 w-3.5" />
          Generate Creator Contract
        </button>
      </div>

      {feedbackBanner && (
        <div className="flex items-center justify-between rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-xs text-emerald-400">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            {feedbackBanner}
          </span>
          <button
            type="button"
            onClick={() => setFeedbackBanner(null)}
            className="text-slate-400 hover:text-white"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Contracts & Deliverables Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-[#1F2230] dark:bg-[#11131A]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] uppercase tracking-wider text-slate-500 dark:border-[#1F2230] dark:bg-[#090A0F]/60 dark:text-[#8A90A6]">
                <th className="px-4 py-3 font-medium">Creator & Campaign</th>
                <th className="px-4 py-3 font-medium">Contract Status</th>
                <th className="px-4 py-3 font-medium">Terms & Usage Rights</th>
                <th className="px-4 py-3 font-medium">Deliverable Status</th>
                <th className="px-4 py-3 font-medium">Live TikTok / Spark Code</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-[#1F2230]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    Loading contracts & deliverables...
                  </td>
                </tr>
              ) : (
                items.map((item) => {
                  const del = item.deliverables[0] || null;
                  return (
                    <tr key={item.campaignCreatorId}>
                      <td className="px-4 py-3.5">
                        <p className="font-semibold text-slate-900 dark:text-[#F3F5F8]">
                          {item.creator.displayName}{" "}
                          <span className="font-mono text-[#25F4EE]">
                            @{item.creator.tiktokHandle}
                          </span>
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-[#8A90A6]">
                          {item.campaignName} •{" "}
                          <span className="font-mono text-emerald-400">
                            {formatCurrencyUsd(item.agreedRateUsd)}
                          </span>
                        </p>
                      </td>

                      <td className="px-4 py-3.5">
                        {!item.contract ? (
                          <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-[10px] text-slate-500 dark:bg-[#090A0F]">
                            NOT GENERATED
                          </span>
                        ) : item.contract.status === "SIGNED" ? (
                          <div>
                            <span className="inline-flex items-center gap-1 rounded bg-emerald-500/15 px-2 py-0.5 font-mono text-[10px] font-semibold text-emerald-400">
                              <ShieldCheck className="h-3 w-3" />
                              SIGNED BY {item.contract.signerFullName?.toUpperCase()}
                            </span>
                            <p className="mt-0.5 font-mono text-[10px] text-slate-400">
                              IP: {item.contract.signerIpAddress} •{" "}
                              {item.contract.signedAt
                                ? new Date(item.contract.signedAt).toLocaleDateString()
                                : ""}
                            </p>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded bg-amber-500/15 px-2 py-0.5 font-mono text-[10px] font-semibold text-amber-400">
                            <Clock className="h-3 w-3" />
                            AWAITING E-SIGN
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 font-mono text-[11px] text-slate-600 dark:text-slate-300">
                        {item.contract ? (
                          <>
                            <p>
                              {item.contract.deliverableCount}x Video •{" "}
                              {item.contract.usageRightsDays}d Paid Usage
                            </p>
                            <p className="text-[10px] text-slate-400">
                              {item.contract.sparkAdsRequired
                                ? "Spark Ads Required"
                                : "Organic Only"}{" "}
                              • {item.contract.exclusivityDays}d Exclusivity
                            </p>
                          </>
                        ) : (
                          <span className="text-slate-400">Default Campaign Terms</span>
                        )}
                      </td>

                      <td className="px-4 py-3.5">
                        {!del ? (
                          <span className="font-mono text-[10px] text-slate-400">
                            No deliverable slot
                          </span>
                        ) : (
                          <div>
                            <span
                              className={`rounded px-2 py-0.5 font-mono text-[10px] font-semibold ${
                                del.status === "LIVE"
                                  ? "bg-emerald-500/15 text-emerald-400"
                                  : del.status === "DRAFT_SUBMITTED" ||
                                      del.status === "SCRIPT_SUBMITTED"
                                    ? "bg-[#FE2C55]/15 text-[#FE2C55]"
                                    : "bg-[#25F4EE]/15 text-[#25F4EE]"
                              }`}
                            >
                              {del.status}
                            </span>
                            {del.usageExpiresAt && (
                              <p className="mt-1 font-mono text-[10px] text-amber-400">
                                Rights Exp:{" "}
                                {new Date(del.usageExpiresAt).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3.5">
                        {del?.tiktokPostUrl ? (
                          <div className="space-y-1">
                            <a
                              href={del.tiktokPostUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 font-mono text-[11px] text-[#25F4EE] hover:underline"
                            >
                              <Video className="h-3 w-3" />
                              Live TikTok Video ↗
                            </a>
                            {del.sparkAdCode && (
                              <div className="flex items-center gap-1.5">
                                <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] dark:bg-[#090A0F]">
                                  {del.sparkAdCode}
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    copyToClipboard(del.sparkAdCode, "Spark Ad code")
                                  }
                                  className="text-slate-400 hover:text-[#25F4EE]"
                                >
                                  <Copy className="h-3 w-3" />
                                </button>
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="font-mono text-[11px] text-slate-400">
                            Pending publication
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <a
                            href={`/portal/${item.magicLinkToken}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 font-mono text-[11px] text-slate-700 hover:border-[#25F4EE] dark:border-[#1F2230] dark:bg-[#090A0F] dark:text-[#F3F5F8]"
                          >
                            Portal
                            <ExternalLink className="h-3 w-3" />
                          </a>
                          <button
                            type="button"
                            onClick={() => setInspectedItem(item)}
                            className="inline-flex items-center gap-1 rounded-lg bg-[#25F4EE] px-2.5 py-1.5 text-xs font-semibold text-[#090A0F] hover:bg-[#25F4EE]/90"
                          >
                            <FileText className="h-3.5 w-3.5" />
                            Review
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Generate Contract Modal */}
      {showBuilderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-xl border border-slate-200 bg-white p-6 shadow-xl dark:border-[#1F2230] dark:bg-[#11131A]">
            <div className="mb-4 flex items-center justify-between border-b border-slate-200 pb-3 dark:border-[#1F2230]">
              <div className="flex items-center gap-2">
                <FileSignature className="h-4 w-4 text-[#25F4EE]" />
                <h3 className="text-base font-semibold">
                  TikTok Creator Agreement & Spark Ads Contract Builder
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowBuilderModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleGenerateContract} className="space-y-3.5">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium">
                    Campaign Creator
                  </label>
                  <select
                    value={targetCampaignCreatorId}
                    onChange={(e) => {
                      const id = e.target.value;
                      setTargetCampaignCreatorId(id);
                      const found = items.find((i) => i.campaignCreatorId === id);
                      if (found) setAgreedRateUsd(found.agreedRateUsd);
                    }}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs dark:border-[#1F2230] dark:bg-[#090A0F]"
                  >
                    {items.map((item) => (
                      <option
                        key={item.campaignCreatorId}
                        value={item.campaignCreatorId}
                      >
                        @{item.creator.tiktokHandle} — {item.campaignName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium">
                    Template Preset ({templates.length})
                  </label>
                  <select
                    onChange={(e) => {
                      const tpl = templates.find((t) => t.id === e.target.value);
                      if (tpl) {
                        setDeliverableCount(tpl.deliverableCount);
                        setUsageRightsDays(tpl.usageRightsDays);
                        setSparkAdsRequired(tpl.sparkAdsRequired);
                        setExclusivityDays(tpl.exclusivityDays);
                        setRevisionRounds(tpl.revisionRounds);
                        setPaymentTerms(tpl.paymentTerms);
                      }
                    }}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs dark:border-[#1F2230] dark:bg-[#090A0F]"
                  >
                    {templates.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div>
                  <label className="mb-1 block text-[11px] text-slate-400">
                    Flat Fee (USD)
                  </label>
                  <input
                    type="number"
                    value={agreedRateUsd}
                    onChange={(e) => setAgreedRateUsd(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 font-mono text-xs dark:border-[#1F2230] dark:bg-[#090A0F]"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] text-slate-400">
                    TikTok Videos
                  </label>
                  <input
                    type="number"
                    value={deliverableCount}
                    onChange={(e) => setDeliverableCount(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 font-mono text-xs dark:border-[#1F2230] dark:bg-[#090A0F]"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] text-slate-400">
                    Usage Rights (Days)
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
                    Exclusivity (Days)
                  </label>
                  <input
                    type="number"
                    value={exclusivityDays}
                    onChange={(e) => setExclusivityDays(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 font-mono text-xs dark:border-[#1F2230] dark:bg-[#090A0F]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium">
                    Revision Rounds Included
                  </label>
                  <input
                    type="number"
                    value={revisionRounds}
                    onChange={(e) => setRevisionRounds(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-xs dark:border-[#1F2230] dark:bg-[#090A0F]"
                  />
                </div>
                <div className="flex items-end pb-2">
                  <label className="flex items-center gap-2 text-xs font-medium">
                    <input
                      type="checkbox"
                      checked={sparkAdsRequired}
                      onChange={(e) => setSparkAdsRequired(e.target.checked)}
                      className="rounded border-slate-300"
                    />
                    Require TikTok Spark Ads Code
                  </label>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium">
                  Payment Schedule & Terms
                </label>
                <input
                  type="text"
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs dark:border-[#1F2230] dark:bg-[#090A0F]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBuilderModal(false)}
                  className="rounded-lg border border-slate-300 px-3.5 py-2 text-xs dark:border-[#1F2230]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={generatingContract}
                  className="rounded-lg bg-[#FE2C55] px-4 py-2 text-xs font-semibold text-white hover:bg-[#FE2C55]/90"
                >
                  {generatingContract
                    ? "Generating..."
                    : "Generate & Send to Creator Portal"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Slide-Over Contract & Deliverable Review Drawer */}
      {inspectedItem && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
          <div className="flex h-full w-full max-w-xl flex-col justify-between overflow-y-auto border-l border-slate-200 bg-white p-6 shadow-2xl dark:border-[#1F2230] dark:bg-[#11131A]">
            <div className="space-y-5">
              <div className="flex items-start justify-between border-b border-slate-200 pb-4 dark:border-[#1F2230]">
                <div>
                  <span className="font-mono text-xs text-[#25F4EE]">
                    @{inspectedItem.creator.tiktokHandle}
                  </span>
                  <h3 className="text-lg font-bold">
                    {inspectedItem.creator.displayName} — Deliverable & Contract Review
                  </h3>
                  <p className="text-xs text-slate-400">
                    {inspectedItem.campaignName} •{" "}
                    {formatCurrencyUsd(inspectedItem.agreedRateUsd)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setInspectedItem(null)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Deliverable Review Section */}
              {inspectedItem.deliverables.map((del) => (
                <div
                  key={del.id}
                  className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-[#1F2230] dark:bg-[#090A0F]"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900 dark:text-[#F3F5F8]">
                      {del.title}
                    </span>
                    <span className="rounded bg-[#25F4EE]/15 px-2 py-0.5 font-mono text-[10px] font-semibold text-[#25F4EE]">
                      {del.status}
                    </span>
                  </div>

                  <div>
                    <span className="font-mono text-[10px] uppercase tracking-wider text-slate-400">
                      Submitted Video Script / Hook Concept
                    </span>
                    <p className="mt-1 rounded border border-slate-200 bg-white p-2.5 text-xs dark:border-[#1F2230] dark:bg-[#11131A]">
                      {del.scriptContent || "Creator has not submitted a script yet."}
                    </p>
                  </div>

                  <div>
                    <span className="font-mono text-[10px] uppercase tracking-wider text-slate-400">
                      Submitted Draft Video Link
                    </span>
                    <p className="mt-1 font-mono text-xs text-[#25F4EE]">
                      {del.draftVideoUrl ? (
                        <a
                          href={del.draftVideoUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="underline"
                        >
                          {del.draftVideoUrl} ↗
                        </a>
                      ) : (
                        <span className="text-slate-400">No draft link submitted yet.</span>
                      )}
                    </p>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium">
                      Brand Review Notes / Revision Feedback
                    </label>
                    <textarea
                      rows={2}
                      value={reviewNotes}
                      onChange={(e) => setReviewNotes(e.target.value)}
                      placeholder="Optional feedback for the creator (visible in their Magic-Link Portal)..."
                      className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-xs dark:border-[#1F2230] dark:bg-[#11131A]"
                    />
                  </div>

                  <div className="flex flex-wrap gap-2 pt-1">
                    <button
                      type="button"
                      disabled={reviewBusy}
                      onClick={() =>
                        handleReviewAction(
                          inspectedItem.campaignCreatorId,
                          "APPROVE_SCRIPT"
                        )
                      }
                      className="rounded-lg bg-emerald-500/20 px-3 py-1.5 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/30"
                    >
                      Approve Script
                    </button>
                    <button
                      type="button"
                      disabled={reviewBusy}
                      onClick={() =>
                        handleReviewAction(
                          inspectedItem.campaignCreatorId,
                          "APPROVE_DRAFT"
                        )
                      }
                      className="rounded-lg bg-[#25F4EE] px-3 py-1.5 text-xs font-semibold text-[#090A0F] hover:bg-[#25F4EE]/90"
                    >
                      Approve Draft to Post
                    </button>
                    <button
                      type="button"
                      disabled={reviewBusy}
                      onClick={() =>
                        handleReviewAction(
                          inspectedItem.campaignCreatorId,
                          "REQUEST_DRAFT_REVISION"
                        )
                      }
                      className="rounded-lg bg-[#FE2C55]/20 px-3 py-1.5 text-xs font-semibold text-[#FE2C55] hover:bg-[#FE2C55]/30"
                    >
                      Request Revision
                    </button>
                  </div>
                </div>
              ))}

              {/* Contract Markdown Preview */}
              {inspectedItem.contract && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] uppercase tracking-wider text-slate-400">
                      Rendered Legal Agreement ({inspectedItem.contract.status})
                    </span>
                    <Sparkles className="h-3.5 w-3.5 text-[#25F4EE]" />
                  </div>
                  <pre className="max-h-72 overflow-y-auto whitespace-pre-wrap rounded-xl border border-slate-200 bg-slate-50 p-4 font-mono text-[11px] leading-relaxed text-slate-700 dark:border-[#1F2230] dark:bg-[#090A0F] dark:text-slate-300">
                    {inspectedItem.contract.renderedBodyMarkdown}
                  </pre>
                </div>
              )}
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-slate-200 pt-4 dark:border-[#1F2230]">
              <a
                href={`/portal/${inspectedItem.magicLinkToken}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#25F4EE] hover:underline"
              >
                Open Creator Magic-Link Portal (/portal/{inspectedItem.magicLinkToken}) ↗
              </a>
              <button
                type="button"
                onClick={() => setInspectedItem(null)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-xs dark:border-[#1F2230]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
