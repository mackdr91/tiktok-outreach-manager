/*
Author: Domonick Mack
Date: 2026-11-15
Description: Shared TypeScript domain interfaces and pipeline stage constants for TokReach.
*/

export const PIPELINE_STAGES = [
  { id: "DISCOVERED", label: "Discovered", color: "border-slate-500/40 text-slate-300 bg-slate-500/10" },
  { id: "OUTREACH_QUEUED", label: "Outreach Queued", color: "border-sky-500/40 text-sky-300 bg-sky-500/10" },
  { id: "CONTACTED", label: "Contacted", color: "border-[#25F4EE]/40 text-[#25F4EE] bg-[#25F4EE]/10" },
  { id: "NEGOTIATING", label: "Negotiating", color: "border-amber-500/40 text-amber-300 bg-amber-500/10" },
  { id: "CONTRACT_SENT", label: "Contract Sent", color: "border-purple-500/40 text-purple-300 bg-purple-500/10" },
  { id: "CONTRACT_SIGNED", label: "Contract Signed", color: "border-indigo-500/40 text-indigo-300 bg-indigo-500/10" },
  { id: "DRAFT_REVIEW", label: "Script / Draft Review", color: "border-pink-500/40 text-pink-300 bg-pink-500/10" },
  { id: "LIVE", label: "Live on TikTok", color: "border-emerald-500/40 text-emerald-300 bg-emerald-500/10" }
] as const;

export type PipelineStageId = (typeof PIPELINE_STAGES)[number]["id"];

export interface WorkspaceMemberRecord {
  id: string;
  workspaceId: string;
  inviteEmail: string;
  fullName: string;
  role: "OWNER" | "ADMIN" | "MEMBER";
  status: "ACTIVE" | "INVITED";
  createdAt: string;
}

export interface WorkspaceRecord {
  id: string;
  name: string;
  slug: string;
  brandWebsite: string;
  productCategory: string;
  defaultSenderName: string;
  defaultSenderEmail: string;
  members: WorkspaceMemberRecord[];
}

export interface CreatorRecord {
  id: string;
  workspaceId: string;
  tiktokHandle: string;
  displayName: string;
  email: string;
  bio: string;
  followerCount: number;
  avgViews: number;
  avgLikes: number;
  avgComments: number;
  avgShares: number;
  engagementRate: number;
  estimatedRateUsd: number;
  nicheTags: string[];
  profileUrl: string;
  enrichmentSource: "MANUAL" | "CSV" | "OEMBED" | "AI_ENRICHED";
  notes: string;
  createdAt: string;
}

export interface DeliverableRecord {
  id: string;
  campaignCreatorId: string;
  title: string;
  status:
    | "PENDING_SCRIPT"
    | "SCRIPT_SUBMITTED"
    | "SCRIPT_APPROVED"
    | "DRAFT_SUBMITTED"
    | "REVISION_REQUESTED"
    | "APPROVED_TO_POST"
    | "LIVE"
    | "EXPIRED";
  scriptContent: string;
  scriptFeedback: string;
  draftVideoUrl: string;
  draftFeedback: string;
  tiktokPostUrl: string;
  sparkAdCode: string;
  viewsCount: number;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  postedAt: string | null;
  usageExpiresAt: string | null;
}

export interface ContractRecord {
  id: string;
  campaignCreatorId: string;
  templateId: string;
  status: "DRAFT" | "SENT" | "SIGNED";
  renderedBodyMarkdown: string;
  agreedRateUsd: number;
  deliverableCount: number;
  usageRightsDays: number;
  sparkAdsRequired: boolean;
  exclusivityRequired: boolean;
  exclusivityDays: number;
  revisionRounds: number;
  paymentTerms: string;
  signerFullName: string | null;
  signerEmail: string | null;
  signerIpAddress: string | null;
  signerUserAgent: string | null;
  signedAt: string | null;
  sentAt: string;
}

export interface OutreachMessageRecord {
  id: string;
  campaignCreatorId: string;
  channel: "EMAIL" | "TIKTOK_DM";
  stepOrder: number;
  subject: string;
  body: string;
  status: "QUEUED" | "SENT" | "COPIED_FOR_DM" | "REPLIED";
  sentAt: string;
}

export interface CampaignCreatorRecord {
  id: string;
  campaignId: string;
  creatorId: string;
  stage: PipelineStageId;
  agreedRateUsd: number;
  magicLinkToken: string;
  customHook: string;
  dmScript: string;
  dmCopiedAt: string | null;
  lastContactedAt: string | null;
  replied: boolean;
  shippingStatus: "PENDING" | "SHIPPED" | "DELIVERED";
  trackingNumber: string;
  payoutStatus: "UNPAID" | "SCHEDULED" | "PAID";
  messages: OutreachMessageRecord[];
  contract: ContractRecord | null;
  deliverables: DeliverableRecord[];
}

export interface OutreachStepRecord {
  id: string;
  stepOrder: number;
  channel: "EMAIL" | "TIKTOK_DM";
  delayHours: number;
  subjectTemplate: string;
  bodyTemplate: string;
}

export interface OutreachSequenceRecord {
  id: string;
  workspaceId: string;
  campaignId: string;
  name: string;
  isActive: boolean;
  steps: OutreachStepRecord[];
}

export interface CampaignRecord {
  id: string;
  workspaceId: string;
  name: string;
  productName: string;
  productBrief: string;
  budgetUsd: number;
  defaultFeeUsd: number;
  usageRightsDays: number;
  sparkAdsRequired: boolean;
  exclusivityDays: number;
  targetNiche: string;
  status: "ACTIVE" | "PAUSED" | "COMPLETED";
  createdAt: string;
}

export interface ContractTemplateRecord {
  id: string;
  workspaceId: string;
  name: string;
  deliverableCount: number;
  usageRightsDays: number;
  sparkAdsRequired: boolean;
  exclusivityDays: number;
  revisionRounds: number;
  paymentTerms: string;
  bodyMarkdown: string;
  isDefault: boolean;
}
