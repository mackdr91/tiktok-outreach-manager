/*
Author: Domonick Mack
Date: 2026-11-15
Description: TikTok contract generation engine, e-signature audit recorder, live TikTok URL validator, and deliverable state machine.
*/

import {
  ContractRecord,
  DeliverableRecord
} from "./types";
import {
  DEFAULT_CONTRACT_MARKDOWN,
  getPortalContextByToken,
  getStore,
  getWorkspaceById
} from "./store";

export interface GenerateContractParams {
  campaignCreatorId: string;
  agreedRateUsd: number;
  deliverableCount: number;
  usageRightsDays: number;
  sparkAdsRequired: boolean;
  exclusivityRequired: boolean;
  exclusivityDays: number;
  revisionRounds: number;
  paymentTerms: string;
}

/**
 * Validates whether a URL is a valid TikTok video post link and extracts the video ID if present.
 */
export function validateTikTokVideoUrl(rawUrl: string): {
  valid: boolean;
  normalizedUrl: string;
  videoId: string | null;
} {
  const trimmed = rawUrl.trim();
  const fullMatch = trimmed.match(
    /^https?:\/\/(www\.|vm\.|vt\.)?tiktok\.com\/(@[a-zA-Z0-9._-]+\/video\/(\d+)|[A-Za-z0-9_-]+)/i
  );

  if (!fullMatch) {
    return { valid: false, normalizedUrl: trimmed, videoId: null };
  }

  const videoId = fullMatch[3] || fullMatch[2] || null;
  return {
    valid: true,
    normalizedUrl: trimmed,
    videoId
  };
}

/**
 * Generates and attaches a customized TikTok creator contract and initializes a deliverable slot.
 */
export function generateCreatorContract(params: GenerateContractParams): ContractRecord {
  const store = getStore();
  const entry = store.campaignCreators.find((cc) => cc.id === params.campaignCreatorId);
  if (!entry) {
    throw new Error("Campaign creator entry not found.");
  }

  const campaign = store.campaigns.find((c) => c.id === entry.campaignId);
  const creator = store.creators.find((c) => c.id === entry.creatorId);
  if (!campaign || !creator) {
    throw new Error("Campaign or creator record missing.");
  }

  const workspace = getWorkspaceById(campaign.workspaceId);
  const currentDate = new Date().toISOString().slice(0, 10);

  const sparkAdsClause = params.sparkAdsRequired
    ? `Creator shall generate and provide a valid ${params.usageRightsDays}-day TikTok Spark Ads authorization code within 24 hours of publishing.`
    : "Organic TikTok post only; Spark Ads code is not required.";

  const exclusivityClause = params.exclusivityRequired
    ? `Creator agrees not to publish sponsored TikTok content for direct category competitors of ${campaign.productName} for ${params.exclusivityDays} days following publication.`
    : "No category exclusivity restrictions apply.";

  const renderedBodyMarkdown = DEFAULT_CONTRACT_MARKDOWN.replace("{{currentDate}}", currentDate)
    .replace("{{brandName}}", workspace.name)
    .replace("{{brandWebsite}}", workspace.brandWebsite)
    .replace("{{creatorName}}", creator.displayName)
    .replace(/\{\{tiktokHandle\}\}/g, creator.tiktokHandle)
    .replace("{{campaignName}}", campaign.name)
    .replace(/\{\{productName\}\}/g, campaign.productName)
    .replace("{{productBrief}}", campaign.productBrief)
    .replace("{{deliverableCount}}", String(params.deliverableCount))
    .replace("{{revisionRounds}}", String(params.revisionRounds))
    .replace("{{usageRightsDays}}", String(params.usageRightsDays))
    .replace("{{sparkAdsClause}}", sparkAdsClause)
    .replace("{{exclusivityClause}}", exclusivityClause)
    .replace("{{agreedRateUsd}}", String(params.agreedRateUsd))
    .replace("{{paymentTerms}}", params.paymentTerms)
    .replace("{{brandSlug}}", workspace.slug);

  const contract: ContractRecord = {
    id: entry.contract?.id || `con_${creator.tiktokHandle}_${Date.now().toString(36)}`,
    campaignCreatorId: entry.id,
    templateId: "tpl_standard_spark",
    status: "SENT",
    renderedBodyMarkdown,
    agreedRateUsd: params.agreedRateUsd,
    deliverableCount: params.deliverableCount,
    usageRightsDays: params.usageRightsDays,
    sparkAdsRequired: params.sparkAdsRequired,
    exclusivityRequired: params.exclusivityRequired,
    exclusivityDays: params.exclusivityDays,
    revisionRounds: params.revisionRounds,
    paymentTerms: params.paymentTerms,
    signerFullName: null,
    signerEmail: null,
    signerIpAddress: null,
    signerUserAgent: null,
    signedAt: null,
    sentAt: new Date().toISOString()
  };

  entry.agreedRateUsd = params.agreedRateUsd;
  entry.contract = contract;
  entry.stage = "CONTRACT_SENT";

  if (entry.deliverables.length === 0) {
    entry.deliverables.push({
      id: `del_${creator.tiktokHandle}_${Date.now().toString(36)}`,
      campaignCreatorId: entry.id,
      title: `${params.deliverableCount}x TikTok Video + ${params.usageRightsDays}d Spark Rights`,
      status: "PENDING_SCRIPT",
      scriptContent: "",
      scriptFeedback: "",
      draftVideoUrl: "",
      draftFeedback: "",
      tiktokPostUrl: "",
      sparkAdCode: "",
      viewsCount: 0,
      likesCount: 0,
      commentsCount: 0,
      sharesCount: 0,
      postedAt: null,
      usageExpiresAt: null
    });
  }

  return contract;
}

/**
 * Executes a legal e-signature on a creator's contract via their Magic-Link Portal token.
 */
export function signCreatorContractByToken(params: {
  magicLinkToken: string;
  signerFullName: string;
  signerEmail: string;
  signerIpAddress: string;
  signerUserAgent: string;
}): ContractRecord {
  const portalContext = getPortalContextByToken(params.magicLinkToken);
  if (!portalContext) {
    throw new Error("Invalid or expired creator portal link.");
  }

  const { entry } = portalContext;
  if (!entry.contract) {
    generateCreatorContract({
      campaignCreatorId: entry.id,
      agreedRateUsd: entry.agreedRateUsd,
      deliverableCount: 1,
      usageRightsDays: portalContext.campaign.usageRightsDays,
      sparkAdsRequired: portalContext.campaign.sparkAdsRequired,
      exclusivityRequired: portalContext.campaign.exclusivityDays > 0,
      exclusivityDays: portalContext.campaign.exclusivityDays,
      revisionRounds: 1,
      paymentTerms: "Net 7 upon live TikTok URL & Spark Ad code submission"
    });
  }

  const contract = entry.contract!;
  contract.status = "SIGNED";
  contract.signerFullName = params.signerFullName.trim();
  contract.signerEmail = params.signerEmail.trim().toLowerCase();
  contract.signerIpAddress = params.signerIpAddress;
  contract.signerUserAgent = params.signerUserAgent;
  contract.signedAt = new Date().toISOString();

  entry.stage = "CONTRACT_SIGNED";
  entry.replied = true;

  return contract;
}

/**
 * Handles creator deliverable submissions (script, draft link, or final live TikTok URL + Spark Ad code)
 * from the Magic-Link Creator Portal.
 */
export function submitDeliverableByToken(params: {
  magicLinkToken: string;
  submissionType: "SCRIPT" | "DRAFT" | "LIVE_POST";
  scriptContent?: string;
  draftVideoUrl?: string;
  tiktokPostUrl?: string;
  sparkAdCode?: string;
}): DeliverableRecord {
  const portalContext = getPortalContextByToken(params.magicLinkToken);
  if (!portalContext) {
    throw new Error("Invalid or expired creator portal link.");
  }

  const { entry, campaign, creator } = portalContext;
  if (entry.deliverables.length === 0) {
    entry.deliverables.push({
      id: `del_${creator.tiktokHandle}_${Date.now().toString(36)}`,
      campaignCreatorId: entry.id,
      title: `1x TikTok Video (${campaign.productName})`,
      status: "PENDING_SCRIPT",
      scriptContent: "",
      scriptFeedback: "",
      draftVideoUrl: "",
      draftFeedback: "",
      tiktokPostUrl: "",
      sparkAdCode: "",
      viewsCount: 0,
      likesCount: 0,
      commentsCount: 0,
      sharesCount: 0,
      postedAt: null,
      usageExpiresAt: null
    });
  }

  const deliverable = entry.deliverables[0];

  if (params.submissionType === "SCRIPT") {
    if (!params.scriptContent?.trim()) {
      throw new Error("Script content cannot be empty.");
    }
    deliverable.scriptContent = params.scriptContent.trim();
    deliverable.status = "SCRIPT_SUBMITTED";
    entry.stage = "DRAFT_REVIEW";
    return deliverable;
  }

  if (params.submissionType === "DRAFT") {
    if (!params.draftVideoUrl?.trim()) {
      throw new Error("Draft video URL cannot be empty.");
    }
    deliverable.draftVideoUrl = params.draftVideoUrl.trim();
    deliverable.status = "DRAFT_SUBMITTED";
    entry.stage = "DRAFT_REVIEW";
    return deliverable;
  }

  if (!params.tiktokPostUrl?.trim()) {
    throw new Error("Live TikTok video URL is required.");
  }

  const validation = validateTikTokVideoUrl(params.tiktokPostUrl);
  if (!validation.valid) {
    throw new Error(
      "Please provide a valid TikTok video URL (e.g., https://www.tiktok.com/@handle/video/123456789)."
    );
  }

  const now = new Date();
  const usageDays = entry.contract?.usageRightsDays ?? campaign.usageRightsDays ?? 90;
  const expiresDate = new Date(now.getTime() + usageDays * 24 * 60 * 60 * 1000);

  deliverable.tiktokPostUrl = validation.normalizedUrl;
  deliverable.sparkAdCode = params.sparkAdCode?.trim() || deliverable.sparkAdCode;
  deliverable.status = "LIVE";
  deliverable.postedAt = now.toISOString();
  deliverable.usageExpiresAt = expiresDate.toISOString();
  if (deliverable.viewsCount === 0) {
    deliverable.viewsCount = creator.avgViews;
    deliverable.likesCount = creator.avgLikes;
    deliverable.commentsCount = creator.avgComments;
    deliverable.sharesCount = creator.avgShares;
  }

  entry.stage = "LIVE";
  entry.payoutStatus = entry.payoutStatus === "PAID" ? "PAID" : "SCHEDULED";

  return deliverable;
}

/**
 * Allows the Brand Manager to approve or request revisions on a creator's script or draft video.
 */
export function reviewDeliverableByBrand(params: {
  campaignCreatorId: string;
  reviewAction:
    | "APPROVE_SCRIPT"
    | "REQUEST_SCRIPT_REVISION"
    | "APPROVE_DRAFT"
    | "REQUEST_DRAFT_REVISION";
  feedback: string;
}): DeliverableRecord {
  const store = getStore();
  const entry = store.campaignCreators.find((cc) => cc.id === params.campaignCreatorId);
  if (!entry || entry.deliverables.length === 0) {
    throw new Error("Deliverable record not found for this creator.");
  }

  const deliverable = entry.deliverables[0];

  if (params.reviewAction === "APPROVE_SCRIPT") {
    deliverable.status = "SCRIPT_APPROVED";
    deliverable.scriptFeedback =
      params.feedback.trim() || "Script approved! Cleared to film.";
  } else if (params.reviewAction === "REQUEST_SCRIPT_REVISION") {
    deliverable.status = "REVISION_REQUESTED";
    deliverable.scriptFeedback =
      params.feedback.trim() || "Please adjust the opening 3-second hook.";
  } else if (params.reviewAction === "APPROVE_DRAFT") {
    deliverable.status = "APPROVED_TO_POST";
    deliverable.draftFeedback =
      params.feedback.trim() ||
      "Draft approved! Please publish on TikTok with #ad and paste the live URL + Spark Ad code.";
  } else if (params.reviewAction === "REQUEST_DRAFT_REVISION") {
    deliverable.status = "REVISION_REQUESTED";
    deliverable.draftFeedback =
      params.feedback.trim() || "Please revise the draft based on our brand notes.";
  }

  return deliverable;
}
