/*
Author: Domonick Mack
Date: 2026-11-15
Description: Hybrid TikTok creator discovery engine with AI bio/niche analysis, email extraction, engagement calculator, and CSV bulk parser.
*/

import Papa from "papaparse";
import { GoogleGenAI } from "@google/genai";
import { CreatorRecord } from "./types";
import { upsertCreator } from "./store";
import {
  buildTikTokProfileUrl,
  calculateEngagementRate,
  estimateCreatorRateUsd,
  normalizeTikTokHandle
} from "./utils";

export interface BioAnalysisResult {
  nicheTags: string[];
  extractedEmail: string | null;
  personalizedHook: string;
  suggestedTier: "NANO_5K_15K" | "MICRO_15K_50K" | "MID_MICRO_50K_150K";
  source: "GEMINI_AI" | "RULE_ENGINE";
}

const NICHE_KEYWORD_MAP: Array<{ tag: string; keywords: string[] }> = [
  { tag: "skincare", keywords: ["skin", "serum", "esthetician", "spf", "retinol", "tretinoin", "barrier", "derm", "acne"] },
  { tag: "clean-beauty", keywords: ["clean beauty", "non-toxic", "botanical", "glow", "makeup", "lip", "sephora", "beauty"] },
  { tag: "grwm", keywords: ["grwm", "morning routine", "night routine", "get ready", "routine", "vlog"] },
  { tag: "ugc-creator", keywords: ["ugc", "tiktok shop", "creator", "collabs", "pr", "inquiries", "gifting"] },
  { tag: "fitness", keywords: ["gym", "workout", "pilates", "fitness", "protein", "macros", "running", "lifting"] },
  { tag: "wellness", keywords: ["wellness", "holistic", "matcha", "gut health", "supplements", "self-care", "mindful"] },
  { tag: "asmr", keywords: ["asmr", "unboxing", "restock", "organizing", "shelfie", "tapping"] },
  { tag: "food-snack", keywords: ["recipe", "chef", "snack", "taste test", "foodie", "cooking", "protein"] }
];

/**
 * Extracts an email address embedded in a TikTok creator bio if present.
 */
export function extractEmailFromBio(bio: string): string | null {
  const match = bio.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  return match ? match[0].toLowerCase() : null;
}

/**
 * Determines the micro-influencer follower tier classification.
 */
export function classifyFollowerTier(
  followerCount: number
): "NANO_5K_15K" | "MICRO_15K_50K" | "MID_MICRO_50K_150K" {
  if (followerCount < 15000) {
    return "NANO_5K_15K";
  }
  if (followerCount <= 50000) {
    return "MICRO_15K_50K";
  }
  return "MID_MICRO_50K_150K";
}

/**
 * Deterministic rule-based bio analyzer used when GEMINI_API_KEY is not configured.
 */
export function analyzeBioDeterministically(params: {
  tiktokHandle: string;
  displayName?: string;
  bio: string;
  followerCount: number;
}): BioAnalysisResult {
  const handle = normalizeTikTokHandle(params.tiktokHandle, false);
  const lowerBio = params.bio.toLowerCase();
  const matchedTags = new Set<string>();

  for (const entry of NICHE_KEYWORD_MAP) {
    if (entry.keywords.some((kw) => lowerBio.includes(kw))) {
      matchedTags.add(entry.tag);
    }
  }

  if (matchedTags.size === 0) {
    matchedTags.add("lifestyle");
    matchedTags.add("tiktok-creator");
  }

  const tagsArray = Array.from(matchedTags).slice(0, 5);
  const extractedEmail = extractEmailFromBio(params.bio);
  const primaryNiche = tagsArray[0].replace(/-/g, " ");
  const creatorLabel = params.displayName?.trim() || `@${handle}`;

  const personalizedHook = params.bio.trim()
    ? `Loved your recent ${primaryNiche} TikToks on @${handle}—your content style (${params.bio
        .slice(0, 65)
        .trim()}...) is a natural fit for our upcoming campaign.`
    : `We've been following @${handle} (${creatorLabel}) and love your authentic short-form TikTok style.`;

  return {
    nicheTags: tagsArray,
    extractedEmail,
    personalizedHook,
    suggestedTier: classifyFollowerTier(params.followerCount),
    source: "RULE_ENGINE"
  };
}

/**
 * Analyzes a TikTok creator's bio using Google Gemini AI when GEMINI_API_KEY is present,
 * falling back cleanly to the deterministic analyzer.
 */
export async function analyzeCreatorBioWithAi(params: {
  tiktokHandle: string;
  displayName?: string;
  bio: string;
  followerCount: number;
}): Promise<BioAnalysisResult> {
  const fallback = analyzeBioDeterministically(params);
  const apiKey = process.env.GEMINI_API_KEY?.trim();

  if (!apiKey || !params.bio.trim()) {
    return fallback;
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `Analyze this TikTok micro-influencer bio and return JSON with keys:
- "nicheTags": array of 3 to 5 lowercase hyphenated niche tags
- "personalizedHook": a warm 1-sentence outreach icebreaker referencing their specific TikTok bio
Handle: @${normalizeTikTokHandle(params.tiktokHandle)}
Bio: ${params.bio}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt
    });

    const rawText = response.text || "";
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]) as {
        nicheTags?: string[];
        personalizedHook?: string;
      };
      return {
        nicheTags:
          Array.isArray(parsed.nicheTags) && parsed.nicheTags.length > 0
            ? parsed.nicheTags.map((t) => String(t).toLowerCase())
            : fallback.nicheTags,
        extractedEmail: fallback.extractedEmail,
        personalizedHook:
          typeof parsed.personalizedHook === "string" && parsed.personalizedHook.trim()
            ? parsed.personalizedHook.trim()
            : fallback.personalizedHook,
        suggestedTier: fallback.suggestedTier,
        source: "GEMINI_AI"
      };
    }

    return fallback;
  } catch {
    return fallback;
  }
}

export interface CsvImportSummary {
  importedCount: number;
  skippedCount: number;
  creators: CreatorRecord[];
  errors: string[];
}

/**
 * Parses a CSV string of TikTok creators, normalizes handles, extracts bio emails,
 * computes engagement rates & fair fees, and upserts them into the workspace.
 */
export async function parseAndImportCreatorCsv(params: {
  workspaceId: string;
  csvText: string;
}): Promise<CsvImportSummary> {
  const parsed = Papa.parse<Record<string, string>>(params.csvText.trim(), {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim().toLowerCase().replace(/\s+/g, "_")
  });

  const importedCreators: CreatorRecord[] = [];
  const errors: string[] = [];
  let skippedCount = 0;

  for (let idx = 0; idx < parsed.data.length; idx++) {
    const row = parsed.data[idx];
    const rawHandle =
      row.tiktok_handle ||
      row.handle ||
      row.username ||
      row["@handle"] ||
      row.profile_url ||
      "";

    const normalizedHandle = normalizeTikTokHandle(rawHandle, false);
    if (!normalizedHandle) {
      skippedCount++;
      errors.push(`Row ${idx + 1}: Missing TikTok handle.`);
      continue;
    }

    const bio = (row.bio || row.description || "").trim();
    const followerCount = Number(
      String(row.followers || row.follower_count || "15000").replace(/[^0-9.]/g, "")
    ) || 15000;
    const avgViews = Number(
      String(row.avg_views || row.views || Math.round(followerCount * 0.55)).replace(/[^0-9.]/g, "")
    ) || Math.round(followerCount * 0.55);
    const avgLikes = Number(
      String(row.avg_likes || row.likes || Math.round(avgViews * 0.065)).replace(/[^0-9.]/g, "")
    ) || Math.round(avgViews * 0.065);
    const avgComments = Number(
      String(row.avg_comments || row.comments || Math.round(avgViews * 0.006)).replace(/[^0-9.]/g, "")
    ) || Math.round(avgViews * 0.006);
    const avgShares = Number(
      String(row.avg_shares || row.shares || Math.round(avgViews * 0.004)).replace(/[^0-9.]/g, "")
    ) || Math.round(avgViews * 0.004);

    const analysis = analyzeBioDeterministically({
      tiktokHandle: normalizedHandle,
      displayName: row.display_name || row.name,
      bio,
      followerCount
    });

    const explicitTags = (row.niche || row.niche_tags || row.tags || "")
      .split(/[,;|]/)
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);

    const nicheTags = explicitTags.length > 0 ? explicitTags : analysis.nicheTags;
    const email =
      (row.email || row.contact_email || "").trim().toLowerCase() ||
      analysis.extractedEmail ||
      `${normalizedHandle}@creatorcollab.co`;

    const record = upsertCreator({
      workspaceId: params.workspaceId,
      tiktokHandle: normalizedHandle,
      displayName: row.display_name || row.name || `@${normalizedHandle}`,
      email,
      bio,
      followerCount,
      avgViews,
      avgLikes,
      avgComments,
      avgShares,
      nicheTags,
      enrichmentSource: "CSV",
      notes: row.notes || `Imported via CSV (${analysis.suggestedTier})`
    });

    importedCreators.push(record);
  }

  return {
    importedCount: importedCreators.length,
    skippedCount,
    creators: importedCreators,
    errors
  };
}

/**
 * Sample CSV template for 1-click testing and user download in the UI.
 */
export const SAMPLE_TIKTOK_CREATORS_CSV = `tiktok_handle,display_name,email,bio,follower_count,avg_views,avg_likes,avg_comments,avg_shares,niche_tags
@glowbysamira,Samira Khan,,Esthetician & barrier repair routines ✨ sensitive skin tips | collabs: samira@glowbysamira.co,29400,21500,1620,145,110,"skincare,barrier-repair,grwm"
@matchawithlena,Lena Cho,lena@matchawithlena.com,iced oat matcha + clean girl morning vlogs 🍵 NYC | TikTok Shop & UGC creator,48200,32000,2480,190,175,"wellness,morning-routine,ugc-creator"
@dermdiaries_mia,Mia Chen,, Cosmetic chemist breaking down viral TikTok serums 🧪📩 mia@dermdiaries.io,63000,44000,3400,310,290,"skincare,ingredient-science,clean-beauty"
@vanityasmr_ava,Ava Morales,ava.asmr@gmail.com,ASMR skincare restocks & mini fridge organization 🫧 18k besties!,18600,15400,1190,85,92,"asmr,unboxing,skincare"`;

export { buildTikTokProfileUrl, calculateEngagementRate, estimateCreatorRateUsd };
