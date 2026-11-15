"use client";

/*
Author: Domonick Mack
Date: 2026-11-15
Description: Dual-channel Outreach Studio combining the Guided TikTok DM Queue (1-click copy + @handle deeplink) and Automated Email Drip Sequences.
*/

import React, { useCallback, useEffect, useState } from "react";
import {
  CheckCircle2,
  Copy,
  ExternalLink,
  Mail,
  MessageSquare,
  Send,
  Sparkles
} from "lucide-react";
import {
  CreatorRecord,
  OutreachMessageRecord,
  OutreachSequenceRecord
} from "@/lib/types";
import { formatCompactNumber, formatCurrencyUsd } from "@/lib/utils";

interface OutreachTarget {
  campaignCreatorId: string;
  campaignId: string;
  campaignName: string;
  productName: string;
  stage: string;
  agreedRateUsd: number;
  magicLinkToken: string;
  customHook: string;
  dmScript: string;
  dmCopiedAt: string | null;
  lastContactedAt: string | null;
  replied: boolean;
  creator: CreatorRecord;
  messages: OutreachMessageRecord[];
}

interface RecentMessageItem extends OutreachMessageRecord {
  tiktokHandle: string;
  creatorEmail: string;
  campaignName: string;
}

interface OutreachStudioProps {
  workspaceId: string;
}

export function OutreachStudio({ workspaceId }: OutreachStudioProps) {
  const [subTab, setSubTab] = useState<"DM_QUEUE" | "EMAIL_DRIP" | "ACTIVITY">(
    "DM_QUEUE"
  );
  const [targets, setTargets] = useState<OutreachTarget[]>([]);
  const [sequences, setSequences] = useState<OutreachSequenceRecord[]>([]);
  const [recentMessages, setRecentMessages] = useState<RecentMessageItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [statusFeedback, setStatusFeedback] = useState<string | null>(null);

  const fetchOutreachData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/outreach?workspaceId=${encodeURIComponent(workspaceId)}`
      );
      if (res.ok) {
        const data = await res.json();
        setTargets(data.outreachTargets);
        setSequences(data.sequences);
        setRecentMessages(data.recentMessages);
      }
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    fetchOutreachData();
  }, [fetchOutreachData]);

  const handleCopyTikTokDm = async (target: OutreachTarget) => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(target.dmScript);
      }
      setCopiedId(target.campaignCreatorId);
      await fetch("/api/outreach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "copy_tiktok_dm",
          campaignCreatorId: target.campaignCreatorId,
          dmScript: target.dmScript
        })
      });
      setStatusFeedback(
        `Copied DM script for @${target.creator.tiktokHandle} and marked stage as CONTACTED.`
      );
      await fetchOutreachData();
      setTimeout(() => setCopiedId(null), 2500);
    } catch {
      setStatusFeedback("Failed to copy TikTok DM script.");
    }
  };

  const handleDispatchEmail = async (target: OutreachTarget, stepOrder = 1) => {
    setSendingId(target.campaignCreatorId);
    setStatusFeedback(null);
    try {
      const res = await fetch("/api/outreach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "send_email_step",
          campaignCreatorId: target.campaignCreatorId,
          stepOrder
        })
      });
      if (res.ok) {
        setStatusFeedback(
          `Dispatched Step #${stepOrder} outreach email to ${target.creator.email} (@${target.creator.tiktokHandle}).`
        );
        await fetchOutreachData();
      }
    } finally {
      setSendingId(null);
    }
  };

  const handleRegenerateAiPitch = async (target: OutreachTarget) => {
    setGeneratingId(target.campaignCreatorId);
    try {
      const res = await fetch("/api/outreach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate_ai_pitch",
          campaignCreatorId: target.campaignCreatorId
        })
      });
      if (res.ok) {
        setStatusFeedback(
          `Refreshed AI personalized hook & DM script for @${target.creator.tiktokHandle}.`
        );
        await fetchOutreachData();
      }
    } finally {
      setGeneratingId(null);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header & Mode Switcher */}
      <div className="flex flex-col justify-between gap-4 rounded-xl border border-slate-200 bg-white p-5 dark:border-[#1F2230] dark:bg-[#11131A] sm:flex-row sm:items-center">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-[#F3F5F8]">
            Dual-Channel Outreach Automation Studio
          </h2>
          <p className="text-xs text-slate-500 dark:text-[#8A90A6]">
            Pair automated multi-step email sequences (BullMQ) with a 1-click Guided TikTok DM Queue.
          </p>
        </div>

        <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-1 dark:border-[#1F2230] dark:bg-[#090A0F]">
          <button
            type="button"
            onClick={() => setSubTab("DM_QUEUE")}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition ${
              subTab === "DM_QUEUE"
                ? "bg-white text-slate-900 shadow-sm dark:bg-[#1F2230] dark:text-[#25F4EE]"
                : "text-slate-500 dark:text-[#8A90A6]"
            }`}
          >
            <MessageSquare className="h-3.5 w-3.5" />
            TikTok DM Queue ({targets.filter((t) => !t.dmCopiedAt).length})
          </button>
          <button
            type="button"
            onClick={() => setSubTab("EMAIL_DRIP")}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition ${
              subTab === "EMAIL_DRIP"
                ? "bg-white text-slate-900 shadow-sm dark:bg-[#1F2230] dark:text-[#25F4EE]"
                : "text-slate-500 dark:text-[#8A90A6]"
            }`}
          >
            <Mail className="h-3.5 w-3.5" />
            Email Drip Sequences ({sequences.length})
          </button>
          <button
            type="button"
            onClick={() => setSubTab("ACTIVITY")}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition ${
              subTab === "ACTIVITY"
                ? "bg-white text-slate-900 shadow-sm dark:bg-[#1F2230] dark:text-[#25F4EE]"
                : "text-slate-500 dark:text-[#8A90A6]"
            }`}
          >
            <Send className="h-3.5 w-3.5" />
            Sent Log ({recentMessages.length})
          </button>
        </div>
      </div>

      {statusFeedback && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-xs text-emerald-400">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{statusFeedback}</span>
        </div>
      )}

      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-xs text-slate-400 dark:border-[#1F2230] dark:bg-[#11131A]">
          Loading outreach queue...
        </div>
      ) : subTab === "DM_QUEUE" ? (
        /* Guided TikTok DM Queue + 1-Click Email Trigger */
        <div className="grid gap-4 lg:grid-cols-2">
          {targets.map((target) => (
            <div
              key={target.campaignCreatorId}
              className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 dark:border-[#1F2230] dark:bg-[#11131A]"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-[#F3F5F8]">
                        {target.creator.displayName}
                      </h3>
                      <a
                        href={target.creator.profileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-0.5 font-mono text-xs text-[#25F4EE] hover:underline"
                      >
                        @{target.creator.tiktokHandle}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-[#8A90A6]">
                      Campaign: <span className="font-medium">{target.campaignName}</span> •{" "}
                      <span className="font-mono text-emerald-400">
                        {formatCurrencyUsd(target.agreedRateUsd)} offer
                      </span>
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-[10px] dark:bg-[#090A0F]">
                      {formatCompactNumber(target.creator.followerCount)} flw
                    </span>
                    <span className="rounded bg-[#25F4EE]/15 px-2 py-0.5 font-mono text-[10px] font-semibold text-[#25F4EE]">
                      {target.creator.engagementRate}% ER
                    </span>
                  </div>
                </div>

                {/* AI Personalized Email Icebreaker */}
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-[#1F2230] dark:bg-[#090A0F]">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="font-mono text-[10px] uppercase tracking-wider text-slate-400">
                      AI Email Icebreaker ({target.creator.email})
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRegenerateAiPitch(target)}
                      disabled={generatingId === target.campaignCreatorId}
                      className="inline-flex items-center gap-1 font-mono text-[10px] text-[#25F4EE] hover:underline disabled:opacity-50"
                    >
                      <Sparkles className="h-3 w-3" />
                      {generatingId === target.campaignCreatorId
                        ? "Regenerating..."
                        : "Refresh AI Hook"}
                    </button>
                  </div>
                  <p className="text-xs italic text-slate-700 dark:text-slate-300">
                    &ldquo;{target.customHook}&rdquo;
                  </p>
                </div>

                {/* Guided TikTok DM Script Box */}
                <div className="rounded-lg border border-[#FE2C55]/30 bg-[#FE2C55]/5 p-3">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-[#FE2C55]">
                      TikTok Direct Message Script
                    </span>
                    {target.dmCopiedAt && (
                      <span className="font-mono text-[10px] text-emerald-400">
                        ✓ DM Copied {new Date(target.dmCopiedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-800 dark:text-slate-200">
                    {target.dmScript}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 pt-3.5 dark:border-[#1F2230]">
                <button
                  type="button"
                  onClick={() => handleDispatchEmail(target, 1)}
                  disabled={sendingId === target.campaignCreatorId}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-800 hover:border-[#25F4EE] disabled:opacity-50 dark:border-[#1F2230] dark:bg-[#090A0F] dark:text-[#F3F5F8]"
                >
                  <Mail className="h-3.5 w-3.5 text-[#25F4EE]" />
                  {sendingId === target.campaignCreatorId
                    ? "Sending..."
                    : "Send Email Pitch"}
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopyTikTokDm(target)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#25F4EE] px-3 py-1.5 text-xs font-semibold text-[#090A0F] hover:bg-[#25F4EE]/90"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    {copiedId === target.campaignCreatorId
                      ? "Copied!"
                      : "1-Click Copy DM"}
                  </button>
                  <a
                    href={target.creator.profileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 rounded-lg bg-[#FE2C55] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#FE2C55]/90"
                  >
                    Open TikTok ↗
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : subTab === "EMAIL_DRIP" ? (
        /* Multi-Step Email Drip Sequence Templates */
        <div className="space-y-4">
          {sequences.map((seq) => (
            <div
              key={seq.id}
              className="rounded-xl border border-slate-200 bg-white p-5 dark:border-[#1F2230] dark:bg-[#11131A]"
            >
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <span className="rounded bg-emerald-500/15 px-2 py-0.5 font-mono text-[10px] font-semibold text-emerald-400">
                    ACTIVE BULLMQ DRIP SEQUENCE
                  </span>
                  <h3 className="mt-1 text-base font-bold text-slate-900 dark:text-[#F3F5F8]">
                    {seq.name}
                  </h3>
                </div>
                <div className="flex flex-wrap gap-1.5 font-mono text-[10px] text-slate-400">
                  <span className="rounded border border-slate-200 px-2 py-0.5 dark:border-[#1F2230]">
                    {"{{firstName}}"}
                  </span>
                  <span className="rounded border border-slate-200 px-2 py-0.5 dark:border-[#1F2230]">
                    {"{{tiktokHandle}}"}
                  </span>
                  <span className="rounded border border-slate-200 px-2 py-0.5 dark:border-[#1F2230]">
                    {"{{customHook}}"}
                  </span>
                  <span className="rounded border border-slate-200 px-2 py-0.5 dark:border-[#1F2230]">
                    {"{{agreedRateUsd}}"}
                  </span>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                {seq.steps.map((step) => (
                  <div
                    key={step.id}
                    className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-[#1F2230] dark:bg-[#090A0F]"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-[#25F4EE]">
                        Step #{step.stepOrder} ({step.channel})
                      </span>
                      <span className="font-mono text-[11px] text-slate-500">
                        {step.delayHours === 0
                          ? "Immediate"
                          : `+${step.delayHours}h delay`}
                      </span>
                    </div>
                    {step.subjectTemplate && (
                      <p className="mb-1.5 font-mono text-[11px] font-semibold text-slate-800 dark:text-slate-200">
                        Subj: {step.subjectTemplate}
                      </p>
                    )}
                    <p className="whitespace-pre-line text-xs leading-relaxed text-slate-600 dark:text-[#8A90A6]">
                      {step.bodyTemplate}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Sent Outreach Activity Log */
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-[#1F2230] dark:bg-[#11131A]">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] uppercase tracking-wider text-slate-500 dark:border-[#1F2230] dark:bg-[#090A0F]/60 dark:text-[#8A90A6]">
                  <th className="px-4 py-3 font-medium">Creator</th>
                  <th className="px-4 py-3 font-medium">Channel</th>
                  <th className="px-4 py-3 font-medium">Subject / Preview</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-[#1F2230]">
                {recentMessages.map((msg) => (
                  <tr key={msg.id}>
                    <td className="px-4 py-3">
                      <span className="font-mono font-semibold text-[#25F4EE]">
                        @{msg.tiktokHandle}
                      </span>
                      <p className="font-mono text-[11px] text-slate-400">
                        {msg.creatorEmail}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded px-2 py-0.5 font-mono text-[10px] font-semibold ${
                          msg.channel === "TIKTOK_DM"
                            ? "bg-[#FE2C55]/15 text-[#FE2C55]"
                            : "bg-[#25F4EE]/15 text-[#25F4EE]"
                        }`}
                      >
                        {msg.channel}
                      </span>
                    </td>
                    <td className="max-w-md px-4 py-3">
                      <p className="font-semibold text-slate-900 dark:text-[#F3F5F8]">
                        {msg.subject}
                      </p>
                      <p className="line-clamp-1 text-[11px] text-slate-500 dark:text-[#8A90A6]">
                        {msg.body}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-[11px] text-emerald-400">
                        {msg.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-[11px] text-slate-400">
                      {new Date(msg.sentAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
