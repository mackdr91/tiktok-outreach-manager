"use client";

/*
Author: Domonick Mack
Date: 2026-11-15
Description: Interactive Magic-Link Creator Portal client for passwordless contract e-signature and TikTok deliverable submissions.
*/

import React, { useState } from "react";
import {
  CheckCircle2,
  ExternalLink,
  FileSignature,
  Package,
  ShieldCheck,
  Sparkles,
  Video
} from "lucide-react";
import {
  CampaignCreatorRecord,
  CampaignRecord,
  CreatorRecord,
  WorkspaceRecord
} from "@/lib/types";
import { formatCurrencyUsd } from "@/lib/utils";

interface PortalContextData {
  entry: CampaignCreatorRecord;
  campaign: CampaignRecord;
  creator: CreatorRecord;
  workspace: WorkspaceRecord;
}

interface CreatorPortalClientProps {
  token: string;
  initialData: PortalContextData;
}

export function CreatorPortalClient({
  token,
  initialData
}: CreatorPortalClientProps) {
  const [portalData, setPortalData] = useState<PortalContextData>(initialData);
  const { entry, campaign, creator, workspace } = portalData;
  const deliverable = entry.deliverables[0] || null;

  // E-Signature states
  const [signerName, setSignerName] = useState(creator.displayName);
  const [signerEmail, setSignerEmail] = useState(creator.email);
  const [signingBusy, setSigningBusy] = useState(false);

  // Deliverable submission states
  const [scriptText, setScriptText] = useState(deliverable?.scriptContent || "");
  const [draftUrl, setDraftUrl] = useState(deliverable?.draftVideoUrl || "");
  const [tiktokPostUrl, setTiktokPostUrl] = useState(
    deliverable?.tiktokPostUrl || ""
  );
  const [sparkAdCode, setSparkAdCode] = useState(
    deliverable?.sparkAdCode || ""
  );
  const [submitBusy, setSubmitBusy] = useState(false);
  const [portalBanner, setPortalBanner] = useState<string | null>(null);
  const [portalError, setPortalError] = useState<string | null>(null);

  const handleSignContract = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signerName.trim() || !signerEmail.trim()) return;
    setSigningBusy(true);
    setPortalBanner(null);
    setPortalError(null);
    try {
      const res = await fetch(`/api/portal/${encodeURIComponent(token)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "sign_contract",
          signerFullName: signerName.trim(),
          signerEmail: signerEmail.trim()
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setPortalError(data.error || "Failed to sign contract.");
      } else {
        setPortalData(data.portalData);
        setPortalBanner(
          "Agreement legally e-signed! You can now submit your TikTok video script and deliverables below."
        );
      }
    } finally {
      setSigningBusy(false);
    }
  };

  const handleSubmitDeliverable = async (
    submissionType: "SCRIPT" | "DRAFT" | "LIVE_POST"
  ) => {
    setSubmitBusy(true);
    setPortalBanner(null);
    setPortalError(null);
    try {
      const res = await fetch(`/api/portal/${encodeURIComponent(token)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "submit_deliverable",
          submissionType,
          scriptContent: scriptText,
          draftVideoUrl: draftUrl,
          tiktokPostUrl,
          sparkAdCode
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setPortalError(data.error || "Submission failed.");
      } else {
        setPortalData(data.portalData);
        setPortalBanner(
          submissionType === "LIVE_POST"
            ? "Live TikTok post URL & Spark Ad code verified! Payout has been scheduled."
            : `${submissionType} submitted to ${workspace.name} for review.`
        );
      }
    } finally {
      setSubmitBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#090A0F] px-4 py-10 text-[#F3F5F8]">
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Top Brand Collaboration Header */}
        <header className="flex flex-col justify-between gap-4 rounded-2xl border border-[#1F2230] bg-[#11131A] p-6 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-[#25F4EE]/15 px-2.5 py-0.5 font-mono text-xs font-semibold text-[#25F4EE]">
                CREATOR COLLABORATION PORTAL
              </span>
              <span className="font-mono text-xs text-[#8A90A6]">
                @{creator.tiktokHandle}
              </span>
            </div>
            <h1 className="mt-2 text-2xl font-bold tracking-tight">
              {workspace.name} × {creator.displayName}
            </h1>
            <p className="text-xs text-[#8A90A6]">
              Campaign: <strong className="text-white">{campaign.name}</strong>
            </p>
          </div>

          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-right">
            <span className="block font-mono text-[10px] uppercase tracking-wider text-emerald-300">
              Agreed Deliverable Fee
            </span>
            <span className="font-mono text-2xl font-bold text-emerald-400">
              {formatCurrencyUsd(entry.agreedRateUsd)}
            </span>
            <span className="block font-mono text-[10px] text-[#8A90A6]">
              Payout: {entry.payoutStatus}
            </span>
          </div>
        </header>

        {portalBanner && (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-xs text-emerald-300">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
            <span>{portalBanner}</span>
          </div>
        )}

        {portalError && (
          <div className="rounded-xl border border-[#FE2C55]/40 bg-[#FE2C55]/10 p-4 text-xs text-[#FE2C55]">
            {portalError}
          </div>
        )}

        {/* Section 1: Campaign Brief & Product Seeding Status */}
        <section className="rounded-2xl border border-[#1F2230] bg-[#11131A] p-6">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[#25F4EE]" />
              <h2 className="text-base font-bold">
                1. TikTok Deliverable Brief & PR Seeding
              </h2>
            </div>
            <span className="inline-flex items-center gap-1 rounded-md border border-[#1F2230] bg-[#090A0F] px-2.5 py-1 font-mono text-xs text-[#25F4EE]">
              <Package className="h-3.5 w-3.5" />
              Shipment: {entry.shippingStatus}
              {entry.trackingNumber ? ` (${entry.trackingNumber})` : ""}
            </span>
          </div>

          <div className="rounded-xl border border-[#1F2230] bg-[#090A0F] p-4">
            <p className="text-xs font-semibold text-[#25F4EE]">
              Featured Product: {campaign.productName}
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-200">
              {campaign.productBrief}
            </p>
            <div className="mt-3 flex flex-wrap gap-2 border-t border-[#1F2230] pt-3 font-mono text-[11px] text-[#8A90A6]">
              <span>• {campaign.usageRightsDays} Days Paid Usage Rights</span>
              <span>
                • {campaign.sparkAdsRequired ? "Spark Ads Code Required" : "Organic Only"}
              </span>
              <span>• {campaign.exclusivityDays} Days Category Exclusivity</span>
              <span>• Mandatory #ad FTC Disclosure</span>
            </div>
          </div>
        </section>

        {/* Section 2: Legal Contract & E-Signature */}
        <section className="rounded-2xl border border-[#1F2230] bg-[#11131A] p-6">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileSignature className="h-4 w-4 text-[#FE2C55]" />
              <h2 className="text-base font-bold">
                2. Creator Agreement & Digital E-Signature
              </h2>
            </div>
            {entry.contract?.status === "SIGNED" ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-3 py-1 font-mono text-xs font-semibold text-emerald-400">
                <ShieldCheck className="h-3.5 w-3.5" />
                SIGNED & EXECUTED
              </span>
            ) : (
              <span className="rounded-full bg-amber-500/15 px-3 py-1 font-mono text-xs font-semibold text-amber-400">
                SIGNATURE REQUIRED
              </span>
            )}
          </div>

          {entry.contract && (
            <pre className="mb-5 max-h-64 overflow-y-auto whitespace-pre-wrap rounded-xl border border-[#1F2230] bg-[#090A0F] p-4 font-mono text-[11px] leading-relaxed text-slate-300">
              {entry.contract.renderedBodyMarkdown}
            </pre>
          )}

          {entry.contract?.status === "SIGNED" ? (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 font-mono text-xs text-emerald-300">
              <p className="font-semibold">
                Digitally Signed by: {entry.contract.signerFullName} ({entry.contract.signerEmail})
              </p>
              <p className="mt-1 text-[11px] text-[#8A90A6]">
                Executed At: {new Date(entry.contract.signedAt!).toLocaleString()} • IP:{" "}
                {entry.contract.signerIpAddress}
              </p>
            </div>
          ) : (
            <form onSubmit={handleSignContract} className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-300">
                    Type Full Legal Name to E-Sign *
                  </label>
                  <input
                    type="text"
                    required
                    value={signerName}
                    onChange={(e) => setSignerName(e.target.value)}
                    className="w-full rounded-lg border border-[#1F2230] bg-[#090A0F] px-3 py-2 text-xs text-white focus:border-[#25F4EE] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-300">
                    Confirm Signer Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={signerEmail}
                    onChange={(e) => setSignerEmail(e.target.value)}
                    className="w-full rounded-lg border border-[#1F2230] bg-[#090A0F] px-3 py-2 font-mono text-xs text-white focus:border-[#25F4EE] focus:outline-none"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={signingBusy}
                className="w-full rounded-xl bg-[#FE2C55] py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#FE2C55]/90 disabled:opacity-50"
              >
                {signingBusy
                  ? "Executing Legal E-Signature..."
                  : `Accept & E-Sign Agreement (${formatCurrencyUsd(entry.agreedRateUsd)})`}
              </button>
            </form>
          )}
        </section>

        {/* Section 3: Deliverable Submission Pipeline */}
        <section className="space-y-5 rounded-2xl border border-[#1F2230] bg-[#11131A] p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Video className="h-4 w-4 text-[#25F4EE]" />
              <h2 className="text-base font-bold">
                3. Deliverable Submissions & Spark Ad Code
              </h2>
            </div>
            {deliverable && (
              <span className="rounded-md bg-[#25F4EE]/15 px-2.5 py-1 font-mono text-xs font-semibold text-[#25F4EE]">
                Status: {deliverable.status}
              </span>
            )}
          </div>

          {deliverable?.scriptFeedback && (
            <div className="rounded-xl border border-[#25F4EE]/30 bg-[#25F4EE]/5 p-3 text-xs">
              <strong className="text-[#25F4EE]">Brand Script Feedback:</strong>{" "}
              {deliverable.scriptFeedback}
            </div>
          )}

          {deliverable?.draftFeedback && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 text-xs">
              <strong className="text-amber-400">Brand Draft Feedback:</strong>{" "}
              {deliverable.draftFeedback}
            </div>
          )}

          {/* Step A: Script / Hook Submission */}
          <div className="space-y-2 rounded-xl border border-[#1F2230] bg-[#090A0F] p-4">
            <label className="block text-xs font-semibold text-slate-200">
              Step A — Submit TikTok 3-Second Hook & Script Outline
            </label>
            <textarea
              rows={2}
              value={scriptText}
              onChange={(e) => setScriptText(e.target.value)}
              placeholder="Hook (0-3s): Show close-up serum texture... Body: Explain overnight redness relief..."
              className="w-full rounded-lg border border-[#1F2230] bg-[#11131A] p-2.5 text-xs text-white focus:border-[#25F4EE] focus:outline-none"
            />
            <div className="flex justify-end">
              <button
                type="button"
                disabled={submitBusy || !scriptText.trim()}
                onClick={() => handleSubmitDeliverable("SCRIPT")}
                className="rounded-lg bg-[#25F4EE] px-3.5 py-1.5 text-xs font-semibold text-[#090A0F] hover:bg-[#25F4EE]/90 disabled:opacity-50"
              >
                Submit Script for Approval
              </button>
            </div>
          </div>

          {/* Step B: Draft Video Link Submission */}
          <div className="space-y-2 rounded-xl border border-[#1F2230] bg-[#090A0F] p-4">
            <label className="block text-xs font-semibold text-slate-200">
              Step B — Submit Unlisted Draft Video Link (Google Drive / Dropbox / Frame.io)
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={draftUrl}
                onChange={(e) => setDraftUrl(e.target.value)}
                placeholder="https://drive.google.com/file/d/..."
                className="flex-1 rounded-lg border border-[#1F2230] bg-[#11131A] px-3 py-2 font-mono text-xs text-white focus:border-[#25F4EE] focus:outline-none"
              />
              <button
                type="button"
                disabled={submitBusy || !draftUrl.trim()}
                onClick={() => handleSubmitDeliverable("DRAFT")}
                className="rounded-lg bg-[#25F4EE] px-4 py-2 text-xs font-semibold text-[#090A0F] hover:bg-[#25F4EE]/90 disabled:opacity-50"
              >
                Submit Draft
              </button>
            </div>
          </div>

          {/* Step C: Final Live TikTok Video URL & Spark Ad Code */}
          <div className="space-y-3 rounded-xl border border-[#FE2C55]/30 bg-[#FE2C55]/5 p-4">
            <label className="block text-xs font-semibold text-[#FE2C55]">
              Step C — Submit Live TikTok Post URL & Spark Ads Authorization Code
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <span className="mb-1 block font-mono text-[10px] text-[#8A90A6]">
                  Live TikTok Post URL *
                </span>
                <input
                  type="url"
                  value={tiktokPostUrl}
                  onChange={(e) => setTiktokPostUrl(e.target.value)}
                  placeholder={`https://www.tiktok.com/@${creator.tiktokHandle}/video/743198234109`}
                  className="w-full rounded-lg border border-[#1F2230] bg-[#090A0F] px-3 py-2 font-mono text-xs text-white focus:border-[#25F4EE] focus:outline-none"
                />
              </div>
              <div>
                <span className="mb-1 block font-mono text-[10px] text-[#8A90A6]">
                  TikTok Spark Ads Code ({campaign.usageRightsDays}d)
                </span>
                <input
                  type="text"
                  value={sparkAdCode}
                  onChange={(e) => setSparkAdCode(e.target.value)}
                  placeholder="SPARK-AUTH-99182"
                  className="w-full rounded-lg border border-[#1F2230] bg-[#090A0F] px-3 py-2 font-mono text-xs text-white focus:border-[#25F4EE] focus:outline-none"
                />
              </div>
            </div>
            <div className="flex items-center justify-between pt-1">
              {deliverable?.tiktokPostUrl ? (
                <a
                  href={deliverable.tiktokPostUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 font-mono text-xs text-[#25F4EE] hover:underline"
                >
                  Verified Live Video ↗
                  <ExternalLink className="h-3 w-3" />
                </a>
              ) : (
                <span className="font-mono text-[11px] text-[#8A90A6]">
                  Triggers automatic Net-7 payout scheduling
                </span>
              )}
              <button
                type="button"
                disabled={submitBusy || !tiktokPostUrl.trim()}
                onClick={() => handleSubmitDeliverable("LIVE_POST")}
                className="rounded-lg bg-[#FE2C55] px-4 py-2 text-xs font-bold text-white hover:bg-[#FE2C55]/90 disabled:opacity-50"
              >
                Verify Live TikTok URL & Complete Deliverable
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
