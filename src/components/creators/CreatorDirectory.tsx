"use client";

/*
Author: Domonick Mack
Date: 2026-11-15
Description: TikTok Creator Directory with multi-facet filtering, Add-by-@handle AI Bio Analyzer, CSV Bulk Importer, and Engagement Calculator.
*/

import React, { useCallback, useEffect, useState } from "react";
import {
  Calculator,
  CheckCircle2,
  ExternalLink,
  FileSpreadsheet,
  Filter,
  Plus,
  Search,
  Sparkles,
  UserPlus,
  X
} from "lucide-react";
import { CreatorRecord } from "@/lib/types";
import { SAMPLE_TIKTOK_CREATORS_CSV } from "@/lib/tiktok-discovery";
import {
  calculateEngagementRate,
  estimateCreatorRateUsd,
  formatCompactNumber,
  formatCurrencyUsd
} from "@/lib/utils";

interface CreatorDirectoryProps {
  workspaceId: string;
}

interface CampaignOption {
  id: string;
  name: string;
  defaultFeeUsd: number;
}

export function CreatorDirectory({ workspaceId }: CreatorDirectoryProps) {
  const [creators, setCreators] = useState<CreatorRecord[]>([]);
  const [uniqueNiches, setUniqueNiches] = useState<string[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignOption[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [search, setSearch] = useState("");
  const [selectedNiche, setSelectedNiche] = useState("ALL");
  const [minEngagement, setMinEngagement] = useState<number>(0);
  const [maxRateUsd, setMaxRateUsd] = useState<number>(0);

  // Modals & Inspector
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCsvModal, setShowCsvModal] = useState(false);
  const [inspectedCreator, setInspectedCreator] = useState<CreatorRecord | null>(null);

  // Add by @handle form states
  const [handleInput, setHandleInput] = useState("");
  const [displayNameInput, setDisplayNameInput] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [bioInput, setBioInput] = useState(
    "Esthetician & skincare minimalist ✨ glass skin tips + barrier repair routines | collabs: sienna@glowstudio.co"
  );
  const [followersInput, setFollowersInput] = useState(34000);
  const [viewsInput, setViewsInput] = useState(22000);
  const [likesInput, setLikesInput] = useState(1650);
  const [commentsInput, setCommentsInput] = useState(140);
  const [sharesInput, setSharesInput] = useState(95);
  const [nicheTagsInput, setNicheTagsInput] = useState("skincare, glass-skin, grwm");
  const [assignCampaignId, setAssignCampaignId] = useState("");
  const [aiHookPreview, setAiHookPreview] = useState<string | null>(null);
  const [analyzingBio, setAnalyzingBio] = useState(false);
  const [savingCreator, setSavingCreator] = useState(false);

  // CSV Import states
  const [csvText, setCsvText] = useState(SAMPLE_TIKTOK_CREATORS_CSV);
  const [csvBusy, setCsvBusy] = useState(false);
  const [csvResultBanner, setCsvResultBanner] = useState<string | null>(null);

  const fetchCreators = useCallback(async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({ workspaceId });
      if (search.trim()) query.set("search", search.trim());
      if (selectedNiche !== "ALL") query.set("niche", selectedNiche);
      if (minEngagement > 0) query.set("minEngagementRate", String(minEngagement));
      if (maxRateUsd > 0) query.set("maxRateUsd", String(maxRateUsd));

      const res = await fetch(`/api/creators?${query.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setCreators(data.creators);
        setUniqueNiches(data.uniqueNiches);
        setCampaigns(data.campaigns);
      }
    } finally {
      setLoading(false);
    }
  }, [workspaceId, search, selectedNiche, minEngagement, maxRateUsd]);

  useEffect(() => {
    fetchCreators();
  }, [fetchCreators]);

  const liveEngagementPreview = calculateEngagementRate({
    likes: likesInput,
    comments: commentsInput,
    shares: sharesInput,
    views: viewsInput
  });

  const liveRatePreview = estimateCreatorRateUsd({
    followerCount: followersInput,
    avgViews: viewsInput,
    engagementRate: liveEngagementPreview
  });

  const handleRunAiBioAnalyzer = async () => {
    if (!handleInput.trim()) return;
    setAnalyzingBio(true);
    try {
      const res = await fetch("/api/creators", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "analyze_bio",
          tiktokHandle: handleInput,
          displayName: displayNameInput,
          bio: bioInput,
          followerCount: followersInput,
          avgViews: viewsInput,
          avgLikes: likesInput,
          avgComments: commentsInput,
          avgShares: sharesInput
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.bioAnalysis?.nicheTags) {
          setNicheTagsInput(data.bioAnalysis.nicheTags.join(", "));
        }
        if (data.bioAnalysis?.extractedEmail && !emailInput.trim()) {
          setEmailInput(data.bioAnalysis.extractedEmail);
        }
        if (data.bioAnalysis?.personalizedHook) {
          setAiHookPreview(data.bioAnalysis.personalizedHook);
        }
      }
    } finally {
      setAnalyzingBio(false);
    }
  };

  const handleAddCreatorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!handleInput.trim()) return;
    setSavingCreator(true);
    try {
      const tags = nicheTagsInput
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean);

      const res = await fetch("/api/creators", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add_creator",
          workspaceId,
          tiktokHandle: handleInput,
          displayName: displayNameInput,
          email: emailInput,
          bio: bioInput,
          followerCount: followersInput,
          avgViews: viewsInput,
          avgLikes: likesInput,
          avgComments: commentsInput,
          avgShares: sharesInput,
          nicheTags: tags,
          notes: aiHookPreview || undefined,
          assignToCampaignId: assignCampaignId || undefined
        })
      });

      if (res.ok) {
        setShowAddModal(false);
        setHandleInput("");
        setDisplayNameInput("");
        setEmailInput("");
        setAiHookPreview(null);
        await fetchCreators();
      }
    } finally {
      setSavingCreator(false);
    }
  };

  const handleCsvImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvText.trim()) return;
    setCsvBusy(true);
    setCsvResultBanner(null);
    try {
      const res = await fetch("/api/creators", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "import_csv",
          workspaceId,
          csvText
        })
      });
      if (res.ok) {
        const data = await res.json();
        setCsvResultBanner(
          `Imported ${data.importedCount} TikTok creators (${data.skippedCount} skipped) with auto-calculated engagement & rates.`
        );
        await fetchCreators();
      }
    } finally {
      setCsvBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header & Action Buttons */}
      <div className="flex flex-col justify-between gap-4 rounded-xl border border-slate-200 bg-white p-5 dark:border-[#1F2230] dark:bg-[#11131A] sm:flex-row sm:items-center">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-[#F3F5F8]">
            TikTok Micro-Influencer Directory ({creators.length})
          </h2>
          <p className="text-xs text-slate-500 dark:text-[#8A90A6]">
            Discover by @handle, import CSV rosters, extract emails from bios, and model view-based CPV rates.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              setCsvResultBanner(null);
              setShowCsvModal(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-slate-50 px-3.5 py-2 text-xs font-medium text-slate-800 transition hover:border-[#25F4EE] dark:border-[#1F2230] dark:bg-[#090A0F] dark:text-[#F3F5F8]"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-[#25F4EE]" />
            CSV Bulk Import
          </button>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#FE2C55] px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[#FE2C55]/90"
          >
            <Plus className="h-3.5 w-3.5" />
            Add by @handle + AI Enrich
          </button>
        </div>
      </div>

      {/* Multi-Facet Filter Bar */}
      <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-[#1F2230] dark:bg-[#11131A] sm:grid-cols-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search @handle, bio, or niche..."
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-8 pr-3 text-xs text-slate-900 focus:border-[#25F4EE] focus:outline-none dark:border-[#1F2230] dark:bg-[#090A0F] dark:text-[#F3F5F8]"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-3.5 w-3.5 shrink-0 text-slate-400" />
          <select
            aria-label="Filter by Niche Tag"
            value={selectedNiche}
            onChange={(e) => setSelectedNiche(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-[#25F4EE] focus:outline-none dark:border-[#1F2230] dark:bg-[#090A0F] dark:text-[#F3F5F8]"
          >
            <option value="ALL">All Niches ({uniqueNiches.length})</option>
            {uniqueNiches.map((niche) => (
              <option key={niche} value={niche}>
                #{niche}
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            aria-label="Filter by Minimum Engagement Rate"
            value={minEngagement}
            onChange={(e) => setMinEngagement(Number(e.target.value))}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-[#25F4EE] focus:outline-none dark:border-[#1F2230] dark:bg-[#090A0F] dark:text-[#F3F5F8]"
          >
            <option value={0}>Min Engagement: Any</option>
            <option value={5}>5.0%+ Engagement</option>
            <option value={7}>7.0%+ High Engagement</option>
            <option value={8}>8.0%+ Viral Micro Tier</option>
          </select>
        </div>

        <div>
          <select
            aria-label="Filter by Max Estimated Deliverable Rate"
            value={maxRateUsd}
            onChange={(e) => setMaxRateUsd(Number(e.target.value))}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-[#25F4EE] focus:outline-none dark:border-[#1F2230] dark:bg-[#090A0F] dark:text-[#F3F5F8]"
          >
            <option value={0}>Max Est. Fee: Any Budget</option>
            <option value={150}>Under $150 / video</option>
            <option value={250}>Under $250 / video</option>
            <option value={350}>Under $350 / video</option>
          </select>
        </div>
      </div>

      {/* High-Density Creator Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-[#1F2230] dark:bg-[#11131A]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] uppercase tracking-wider text-slate-500 dark:border-[#1F2230] dark:bg-[#090A0F]/60 dark:text-[#8A90A6]">
                <th className="px-4 py-3 font-medium">TikTok Creator</th>
                <th className="px-4 py-3 font-medium">Followers</th>
                <th className="px-4 py-3 font-medium">Avg Views</th>
                <th className="px-4 py-3 font-medium">Engagement</th>
                <th className="px-4 py-3 font-medium">Est. Fair Fee</th>
                <th className="px-4 py-3 font-medium">AI Niche Tags</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-[#1F2230]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                    Loading TikTok creator directory...
                  </td>
                </tr>
              ) : creators.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                    No TikTok creators match the current filters.
                  </td>
                </tr>
              ) : (
                creators.map((creator) => (
                  <tr
                    key={creator.id}
                    className="transition hover:bg-slate-50/80 dark:hover:bg-[#1F2230]/30"
                  >
                    <td className="px-4 py-3.5">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-slate-900 dark:text-[#F3F5F8]">
                              {creator.displayName}
                            </span>
                            <a
                              href={creator.profileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-0.5 font-mono text-xs text-[#0891B2] hover:underline dark:text-[#25F4EE]"
                            >
                              @{creator.tiktokHandle}
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                          <p className="mt-0.5 line-clamp-1 max-w-xs text-[11px] text-slate-500 dark:text-[#8A90A6]">
                            {creator.bio}
                          </p>
                          <p className="mt-0.5 font-mono text-[11px] text-slate-400">
                            {creator.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 font-mono font-medium text-slate-900 dark:text-[#F3F5F8]">
                      {formatCompactNumber(creator.followerCount)}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-slate-700 dark:text-slate-300">
                      {formatCompactNumber(creator.avgViews)}
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex items-center rounded-md px-2 py-0.5 font-mono text-xs font-semibold ${
                          creator.engagementRate >= 7.5
                            ? "bg-[#25F4EE]/15 text-[#0891B2] dark:text-[#25F4EE]"
                            : "bg-slate-100 text-slate-700 dark:bg-[#090A0F] dark:text-slate-300"
                        }`}
                      >
                        {creator.engagementRate}%
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-mono font-semibold text-emerald-500">
                      {formatCurrencyUsd(creator.estimatedRateUsd)}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex flex-wrap gap-1">
                        {creator.nicheTags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-mono text-[10px] text-slate-600 dark:border-[#1F2230] dark:bg-[#090A0F] dark:text-[#8A90A6]"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => setInspectedCreator(creator)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-700 transition hover:border-[#25F4EE] dark:border-[#1F2230] dark:bg-[#090A0F] dark:text-[#F3F5F8]"
                      >
                        <Calculator className="h-3.5 w-3.5 text-[#25F4EE]" />
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add by @handle + AI Bio Analyzer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-slate-200 bg-white p-6 shadow-xl dark:border-[#1F2230] dark:bg-[#11131A]">
            <div className="mb-4 flex items-center justify-between border-b border-slate-200 pb-3 dark:border-[#1F2230]">
              <div className="flex items-center gap-2">
                <UserPlus className="h-4 w-4 text-[#25F4EE]" />
                <h3 className="text-base font-semibold text-slate-900 dark:text-[#F3F5F8]">
                  Add TikTok Creator by @handle & AI Bio Enrichment
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAddCreatorSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
                    TikTok @handle or URL *
                  </label>
                  <input
                    type="text"
                    required
                    value={handleInput}
                    onChange={(e) => setHandleInput(e.target.value)}
                    placeholder="@glowwithsienna"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-xs text-slate-900 dark:border-[#1F2230] dark:bg-[#090A0F] dark:text-[#F3F5F8]"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Creator Display Name
                  </label>
                  <input
                    type="text"
                    value={displayNameInput}
                    onChange={(e) => setDisplayNameInput(e.target.value)}
                    placeholder="Sienna Park"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 dark:border-[#1F2230] dark:bg-[#090A0F] dark:text-[#F3F5F8]"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Contact Email (Auto-extracted)
                  </label>
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="sienna@glowstudio.co"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-xs text-slate-900 dark:border-[#1F2230] dark:bg-[#090A0F] dark:text-[#F3F5F8]"
                  />
                </div>
              </div>

              <div>
                <div className="mb-1 flex items-center justify-between">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    TikTok Bio Text (Paste creator bio to extract email, niche tags & hook)
                  </label>
                  <button
                    type="button"
                    onClick={handleRunAiBioAnalyzer}
                    disabled={analyzingBio || !handleInput.trim()}
                    className="inline-flex items-center gap-1 rounded-md bg-[#25F4EE]/15 px-2.5 py-1 font-mono text-[11px] font-semibold text-[#0891B2] hover:bg-[#25F4EE]/25 disabled:opacity-50 dark:text-[#25F4EE]"
                  >
                    <Sparkles className="h-3 w-3" />
                    {analyzingBio ? "Analyzing Bio..." : "Run AI Bio Analyzer"}
                  </button>
                </div>
                <textarea
                  rows={2}
                  value={bioInput}
                  onChange={(e) => setBioInput(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-xs text-slate-900 dark:border-[#1F2230] dark:bg-[#090A0F] dark:text-[#F3F5F8]"
                />
              </div>

              {/* Metrics & Live Engagement Calculator */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                <div>
                  <label className="mb-1 block text-[11px] text-slate-500">Followers</label>
                  <input
                    type="number"
                    value={followersInput}
                    onChange={(e) => setFollowersInput(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 font-mono text-xs dark:border-[#1F2230] dark:bg-[#090A0F]"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] text-slate-500">Avg Views</label>
                  <input
                    type="number"
                    value={viewsInput}
                    onChange={(e) => setViewsInput(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 font-mono text-xs dark:border-[#1F2230] dark:bg-[#090A0F]"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] text-slate-500">Avg Likes</label>
                  <input
                    type="number"
                    value={likesInput}
                    onChange={(e) => setLikesInput(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 font-mono text-xs dark:border-[#1F2230] dark:bg-[#090A0F]"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] text-slate-500">Avg Comments</label>
                  <input
                    type="number"
                    value={commentsInput}
                    onChange={(e) => setCommentsInput(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 font-mono text-xs dark:border-[#1F2230] dark:bg-[#090A0F]"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] text-slate-500">Avg Shares</label>
                  <input
                    type="number"
                    value={sharesInput}
                    onChange={(e) => setSharesInput(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 font-mono text-xs dark:border-[#1F2230] dark:bg-[#090A0F]"
                  />
                </div>
              </div>

              {/* Live Calculated Engagement & Fair Rate Banner */}
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[#25F4EE]/30 bg-[#25F4EE]/5 p-3.5">
                <div>
                  <span className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-[#8A90A6]">
                    Calculated TikTok Engagement Rate
                  </span>
                  <p className="font-mono text-lg font-bold text-[#0891B2] dark:text-[#25F4EE]">
                    {liveEngagementPreview}%{" "}
                    <span className="text-xs font-normal text-slate-500">
                      ((Likes + Comments + Shares) / Views)
                    </span>
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-[#8A90A6]">
                    Recommended Flat Deliverable Fee
                  </span>
                  <p className="font-mono text-lg font-bold text-emerald-400">
                    {formatCurrencyUsd(liveRatePreview)} / video
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Niche Tags (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={nicheTagsInput}
                    onChange={(e) => setNicheTagsInput(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-xs dark:border-[#1F2230] dark:bg-[#090A0F]"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Assign Directly to Campaign (Optional)
                  </label>
                  <select
                    value={assignCampaignId}
                    onChange={(e) => setAssignCampaignId(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs dark:border-[#1F2230] dark:bg-[#090A0F]"
                  >
                    <option value="">Directory Only (Do not assign yet)</option>
                    {campaigns.map((camp) => (
                      <option key={camp.id} value={camp.id}>
                        {camp.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {aiHookPreview && (
                <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3 text-xs">
                  <span className="font-semibold text-emerald-400">
                    AI Generated Outreach Icebreaker:
                  </span>
                  <p className="mt-1 italic text-slate-600 dark:text-slate-300">
                    &ldquo;{aiHookPreview}&rdquo;
                  </p>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-medium dark:border-[#1F2230]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingCreator}
                  className="rounded-lg bg-[#FE2C55] px-4 py-2 text-xs font-semibold text-white hover:bg-[#FE2C55]/90 disabled:opacity-50"
                >
                  {savingCreator ? "Saving Creator..." : "Save TikTok Creator"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSV Bulk Import Modal */}
      {showCsvModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-xl border border-slate-200 bg-white p-6 shadow-xl dark:border-[#1F2230] dark:bg-[#11131A]">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4 text-[#25F4EE]" />
                <h3 className="text-base font-semibold text-slate-900 dark:text-[#F3F5F8]">
                  Bulk CSV TikTok Creator Importer
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCsvModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mb-3 text-xs text-slate-500 dark:text-[#8A90A6]">
              Paste CSV rows with columns like <code className="font-mono">tiktok_handle,display_name,email,bio,follower_count,avg_views,avg_likes,avg_comments,avg_shares,niche_tags</code>. Missing emails are automatically extracted from creator bios!
            </p>

            <form onSubmit={handleCsvImportSubmit} className="space-y-3">
              <textarea
                rows={7}
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-slate-50 p-3 font-mono text-[11px] text-slate-900 dark:border-[#1F2230] dark:bg-[#090A0F] dark:text-[#F3F5F8]"
              />

              {csvResultBanner && (
                <div className="flex items-center gap-2 rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-3 text-xs text-emerald-400">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>{csvResultBanner}</span>
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setCsvText(SAMPLE_TIKTOK_CREATORS_CSV)}
                  className="text-xs font-medium text-[#25F4EE] hover:underline"
                >
                  Reset to Sample 4-Creator CSV
                </button>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCsvModal(false)}
                    className="rounded-lg border border-slate-300 px-3.5 py-2 text-xs font-medium dark:border-[#1F2230]"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    disabled={csvBusy}
                    className="rounded-lg bg-[#FE2C55] px-4 py-2 text-xs font-semibold text-white hover:bg-[#FE2C55]/90 disabled:opacity-50"
                  >
                    {csvBusy ? "Importing CSV..." : "Import & Enrich Creators"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Slide-over Creator Inspector Drawer */}
      {inspectedCreator && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
          <div className="flex h-full w-full max-w-md flex-col justify-between border-l border-slate-200 bg-white p-6 shadow-2xl dark:border-[#1F2230] dark:bg-[#11131A]">
            <div className="space-y-5 overflow-y-auto">
              <div className="flex items-start justify-between border-b border-slate-200 pb-4 dark:border-[#1F2230]">
                <div>
                  <span className="rounded bg-[#25F4EE]/15 px-2 py-0.5 font-mono text-[10px] font-semibold text-[#25F4EE]">
                    {inspectedCreator.enrichmentSource}
                  </span>
                  <h3 className="mt-1.5 text-lg font-bold text-slate-900 dark:text-[#F3F5F8]">
                    {inspectedCreator.displayName}
                  </h3>
                  <a
                    href={inspectedCreator.profileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 font-mono text-xs text-[#25F4EE] hover:underline"
                  >
                    @{inspectedCreator.tiktokHandle} on TikTok
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
                <button
                  type="button"
                  onClick={() => setInspectedCreator(null)}
                  className="rounded-lg p-1 text-slate-400 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  TikTok Bio & Contact
                </h4>
                <p className="mt-1.5 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs leading-relaxed dark:border-[#1F2230] dark:bg-[#090A0F]">
                  {inspectedCreator.bio}
                </p>
                <p className="mt-2 font-mono text-xs text-slate-500 dark:text-[#8A90A6]">
                  Verified Outreach Email:{" "}
                  <span className="text-slate-900 dark:text-white">{inspectedCreator.email}</span>
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-slate-200 p-3 dark:border-[#1F2230] dark:bg-[#090A0F]">
                  <span className="text-[11px] text-slate-400">Followers</span>
                  <p className="font-mono text-base font-bold">
                    {inspectedCreator.followerCount.toLocaleString()}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-200 p-3 dark:border-[#1F2230] dark:bg-[#090A0F]">
                  <span className="text-[11px] text-slate-400">Avg Video Views</span>
                  <p className="font-mono text-base font-bold">
                    {inspectedCreator.avgViews.toLocaleString()}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-200 p-3 dark:border-[#1F2230] dark:bg-[#090A0F]">
                  <span className="text-[11px] text-slate-400">Engagement Rate</span>
                  <p className="font-mono text-base font-bold text-[#25F4EE]">
                    {inspectedCreator.engagementRate}%
                  </p>
                </div>
                <div className="rounded-lg border border-slate-200 p-3 dark:border-[#1F2230] dark:bg-[#090A0F]">
                  <span className="text-[11px] text-slate-400">Est. Flat Rate</span>
                  <p className="font-mono text-base font-bold text-emerald-400">
                    {formatCurrencyUsd(inspectedCreator.estimatedRateUsd)}
                  </p>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  AI Niche & Content Tags
                </h4>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {inspectedCreator.nicheTags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-md border border-[#25F4EE]/30 bg-[#25F4EE]/10 px-2 py-1 font-mono text-xs text-[#25F4EE]"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>

              {inspectedCreator.notes && (
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Outreach Notes / Hook
                  </h4>
                  <p className="mt-1 text-xs text-slate-600 dark:text-[#8A90A6]">
                    {inspectedCreator.notes}
                  </p>
                </div>
              )}
            </div>

            <div className="border-t border-slate-200 pt-4 dark:border-[#1F2230]">
              <a
                href={inspectedCreator.profileUrl}
                target="_blank"
                rel="noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#FE2C55] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#FE2C55]/90"
              >
                Open @{inspectedCreator.tiktokHandle} on TikTok ↗
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
