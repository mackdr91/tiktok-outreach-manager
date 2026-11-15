/*
Author: Domonick Mack
Date: 2026-11-15
Description: Unified data store and repository layer for multi-brand workspaces, TikTok creators, campaigns, outreach, contracts, and deliverables.
*/

import {
  CampaignCreatorRecord,
  CampaignRecord,
  ContractTemplateRecord,
  CreatorRecord,
  OutreachSequenceRecord,
  PipelineStageId,
  WorkspaceMemberRecord,
  WorkspaceRecord
} from "./types";
import {
  buildTikTokProfileUrl,
  calculateEngagementRate,
  estimateCreatorRateUsd,
  normalizeTikTokHandle
} from "./utils";

interface PlatformState {
  workspaces: WorkspaceRecord[];
  creators: CreatorRecord[];
  campaigns: CampaignRecord[];
  campaignCreators: CampaignCreatorRecord[];
  sequences: OutreachSequenceRecord[];
  contractTemplates: ContractTemplateRecord[];
}

const DEFAULT_CONTRACT_MARKDOWN = `# TIKTOK MICRO-INFLUENCER CONTENT & SPARK ADS AGREEMENT

**Agreement Date**: {{currentDate}}
**Brand**: {{brandName}} ({{brandWebsite}})
**Creator**: {{creatorName}} (TikTok: @{{tiktokHandle}})
**Campaign**: {{campaignName}} — {{productName}}

---

### 1. Scope of Deliverables
Creator agrees to produce and publish **{{deliverableCount}} original short-form vertical video(s)** on their primary TikTok account (@{{tiktokHandle}}) featuring **{{productName}}** in accordance with the Campaign Brief:
> {{productBrief}}

- **Script / Hook Approval**: Creator will submit a brief hook/script concept via the Creator Portal prior to filming.
- **Revisions**: Up to **{{revisionRounds}} round(s)** of reasonable factual edits prior to publishing.
- **Organic Retention**: Published video(s) must remain live on Creator's public TikTok profile for a minimum of **90 days**.

### 2. Paid Usage Rights & Spark Ads Authorization
- **Paid Usage Window**: Creator grants Brand non-exclusive paid digital amplification and whitelisting rights for **{{usageRightsDays}} days** starting from the live publication date.
- **TikTok Spark Ads Code**: {{sparkAdsClause}}

### 3. Category Exclusivity
- {{exclusivityClause}}

### 4. Compensation & Payment Schedule
- **Total Flat Fee**: **\${{agreedRateUsd}} USD** (inclusive of product gifting).
- **Payment Terms**: {{paymentTerms}}.

### 5. Mandatory FTC Disclosure
Creator must clearly disclose the material partnership by including **#ad** or **#{{brandSlug}}partner** in the video caption and enabling TikTok's built-in **Commercial Content Disclosure** toggle.
`;

function createInitialState(): PlatformState {
  const workspaces: WorkspaceRecord[] = [
    {
      id: "ws_glowbotanics",
      name: "GlowBotanics Skincare",
      slug: "glowbotanics",
      brandWebsite: "https://glowbotanics.co",
      productCategory: "Clean Beauty & Skincare",
      defaultSenderName: "Domonick from GlowBotanics",
      defaultSenderEmail: "collabs@glowbotanics.co",
      members: [
        {
          id: "mem_1",
          workspaceId: "ws_glowbotanics",
          inviteEmail: "domonick@glowbotanics.co",
          fullName: "Domonick Mack",
          role: "OWNER",
          status: "ACTIVE",
          createdAt: "2026-10-01T10:00:00.000Z"
        },
        {
          id: "mem_2",
          workspaceId: "ws_glowbotanics",
          inviteEmail: "sierra@glowbotanics.co",
          fullName: "Sierra Vance",
          role: "ADMIN",
          status: "ACTIVE",
          createdAt: "2026-10-04T14:30:00.000Z"
        },
        {
          id: "mem_3",
          workspaceId: "ws_glowbotanics",
          inviteEmail: "jordan@glowbotanics.co",
          fullName: "Jordan Patel",
          role: "MEMBER",
          status: "INVITED",
          createdAt: "2026-11-10T09:15:00.000Z"
        }
      ]
    },
    {
      id: "ws_kettlecrunch",
      name: "KettleCrunch Protein Crisps",
      slug: "kettlecrunch",
      brandWebsite: "https://kettlecrunch.io",
      productCategory: "High-Protein Functional Snacks",
      defaultSenderName: "Domonick at KettleCrunch",
      defaultSenderEmail: "creators@kettlecrunch.io",
      members: [
        {
          id: "mem_4",
          workspaceId: "ws_kettlecrunch",
          inviteEmail: "domonick@glowbotanics.co",
          fullName: "Domonick Mack",
          role: "OWNER",
          status: "ACTIVE",
          createdAt: "2026-10-12T11:00:00.000Z"
        }
      ]
    }
  ];

  const creators: CreatorRecord[] = [
    {
      id: "cr_maya",
      workspaceId: "ws_glowbotanics",
      tiktokHandle: "glowwithmaya",
      displayName: "Maya Lin",
      email: "maya@glowwithmaya.com",
      bio: "Esthetician in training ✨ Barrier repair, glass skin routines & honest shelfie reviews 📍LA | collabs: maya@glowwithmaya.com",
      followerCount: 42800,
      avgViews: 28500,
      avgLikes: 2150,
      avgComments: 190,
      avgShares: 145,
      engagementRate: 8.72,
      estimatedRateUsd: 265,
      nicheTags: ["skincare", "glass-skin", "esthetician", "clean-beauty", "grwm"],
      profileUrl: "https://www.tiktok.com/@glowwithmaya",
      enrichmentSource: "AI_ENRICHED",
      notes: "High save-to-view ratio on serum texture videos. Very responsive on email.",
      createdAt: "2026-10-15T12:00:00.000Z"
    },
    {
      id: "cr_chloe",
      workspaceId: "ws_glowbotanics",
      tiktokHandle: "skincarebychloe",
      displayName: "Chloe Ramirez",
      email: "chloe.ugc@gmail.com",
      bio: "Sensitive skin girly 🌿 Derm-approved routines under $35 | UGC & TikTok Shop creator 💌 chloe.ugc@gmail.com",
      followerCount: 19400,
      avgViews: 14200,
      avgLikes: 980,
      avgComments: 88,
      avgShares: 62,
      engagementRate: 7.96,
      estimatedRateUsd: 165,
      nicheTags: ["skincare", "sensitive-skin", "ugc-creator", "affordable-beauty"],
      profileUrl: "https://www.tiktok.com/@skincarebychloe",
      enrichmentSource: "AI_ENRICHED",
      notes: "Great lighting and close-up dropper application shots.",
      createdAt: "2026-10-18T15:20:00.000Z"
    },
    {
      id: "cr_zoe",
      workspaceId: "ws_glowbotanics",
      tiktokHandle: "wellnesswithzoe",
      displayName: "Zoe Brooks",
      email: "zoe@wellnesswithzoe.co",
      bio: "5am morning routines 🍵 pilates + holistic glow + non-toxic swaps | NYC | inquiries: zoe@wellnesswithzoe.co",
      followerCount: 68500,
      avgViews: 39000,
      avgLikes: 2400,
      avgComments: 160,
      avgShares: 210,
      engagementRate: 7.1,
      estimatedRateUsd: 315,
      nicheTags: ["wellness", "morning-routine", "pilates", "clean-beauty", "lifestyle"],
      profileUrl: "https://www.tiktok.com/@wellnesswithzoe",
      enrichmentSource: "OEMBED",
      notes: "Strong fit for morning routine integration.",
      createdAt: "2026-10-20T09:10:00.000Z"
    },
    {
      id: "cr_nina",
      workspaceId: "ws_glowbotanics",
      tiktokHandle: "unboxwithnina",
      displayName: "Nina K.",
      email: "ninakcreates@outlook.com",
      bio: "ASMR restocks, vanity organization & viral beauty tests 🫧 30k fam! PR/Collabs: ninakcreates@outlook.com",
      followerCount: 31200,
      avgViews: 21000,
      avgLikes: 1540,
      avgComments: 110,
      avgShares: 95,
      engagementRate: 8.31,
      estimatedRateUsd: 240,
      nicheTags: ["asmr", "unboxing", "beauty-restock", "skincare"],
      profileUrl: "https://www.tiktok.com/@unboxwithnina",
      enrichmentSource: "CSV",
      notes: "ASMR tapping hooks perform consistently well for Spark Ads.",
      createdAt: "2026-10-22T11:45:00.000Z"
    },
    {
      id: "cr_kayla",
      workspaceId: "ws_glowbotanics",
      tiktokHandle: "dailybrewkayla",
      displayName: "Kayla Jenkins",
      email: "kayla@dailybrewmedia.com",
      bio: "iced matcha, post-gym skincare & corporate 9-5 vlogs 💻✨ Austin TX | kayla@dailybrewmedia.com",
      followerCount: 14800,
      avgViews: 9600,
      avgLikes: 610,
      avgComments: 54,
      avgShares: 31,
      engagementRate: 7.24,
      estimatedRateUsd: 110,
      nicheTags: ["lifestyle", "post-gym-skincare", "vlog", "grwm"],
      profileUrl: "https://www.tiktok.com/@dailybrewkayla",
      enrichmentSource: "MANUAL",
      notes: "Micro-creator with very authentic comment section.",
      createdAt: "2026-10-25T16:00:00.000Z"
    },
    {
      id: "cr_leo",
      workspaceId: "ws_kettlecrunch",
      tiktokHandle: "fitchefleo",
      displayName: "Leo Santoro",
      email: "leo@fitchefleo.com",
      bio: "High-protein macro hacks & honest gym snack taste tests 💪🍳 190g protein/day | business: leo@fitchefleo.com",
      followerCount: 54000,
      avgViews: 34000,
      avgLikes: 2600,
      avgComments: 240,
      avgShares: 310,
      engagementRate: 9.26,
      estimatedRateUsd: 295,
      nicheTags: ["fitness", "high-protein", "snack-review", "macro-friendly"],
      profileUrl: "https://www.tiktok.com/@fitchefleo",
      enrichmentSource: "AI_ENRICHED",
      notes: "Top converter for savory high-protein snacks.",
      createdAt: "2026-10-19T10:00:00.000Z"
    }
  ];

  const campaigns: CampaignRecord[] = [
    {
      id: "camp_barrier_serum",
      workspaceId: "ws_glowbotanics",
      name: "Q4 Cica Barrier Serum Seeding & Spark Ads",
      productName: "CloudDew Cica + Ceramide Barrier Serum (30ml)",
      productBrief:
        "Show a close-up texture shot of the milky CloudDew serum within the first 3 seconds. Highlight how it calms redness overnight without feeling sticky under makeup.",
      budgetUsd: 3500,
      defaultFeeUsd: 200,
      usageRightsDays: 90,
      sparkAdsRequired: true,
      exclusivityDays: 30,
      targetNiche: "Skincare & GRWM",
      status: "ACTIVE",
      createdAt: "2026-10-20T10:00:00.000Z"
    },
    {
      id: "camp_holiday_balm",
      workspaceId: "ws_glowbotanics",
      name: "Holiday Peptide Lip Glaze Trio Launch",
      productName: "Peptide Berry Glaze Trio Gift Set",
      productBrief:
        "Unbox the holiday tin and apply the Berry Glaze shade on camera with natural daylight. Mention the non-sticky cushion finish and $28 bundle value.",
      budgetUsd: 2000,
      defaultFeeUsd: 150,
      usageRightsDays: 60,
      sparkAdsRequired: true,
      exclusivityDays: 14,
      targetNiche: "Beauty & Unboxing",
      status: "ACTIVE",
      createdAt: "2026-11-01T09:00:00.000Z"
    },
    {
      id: "camp_protein_crisps",
      workspaceId: "ws_kettlecrunch",
      name: "Spicy Queso Protein Crisp Taste-Test Wave",
      productName: "KettleCrunch Variety 12-Pack (32g Protein/Bag)",
      productBrief:
        "Do an authentic crunch test on mic and show the nutrition label (32g protein, 140 calories) right after the first bite.",
      budgetUsd: 4000,
      defaultFeeUsd: 250,
      usageRightsDays: 90,
      sparkAdsRequired: true,
      exclusivityDays: 30,
      targetNiche: "Fitness & High-Protein Snacks",
      status: "ACTIVE",
      createdAt: "2026-10-25T12:00:00.000Z"
    }
  ];

  const contractTemplates: ContractTemplateRecord[] = [
    {
      id: "tpl_standard_spark",
      workspaceId: "ws_glowbotanics",
      name: "Standard 1x TikTok Video + 90-Day Spark Ads Agreement",
      deliverableCount: 1,
      usageRightsDays: 90,
      sparkAdsRequired: true,
      exclusivityDays: 30,
      revisionRounds: 1,
      paymentTerms: "Net 7 via ACH/PayPal upon live TikTok URL & Spark Ad authorization code",
      bodyMarkdown: DEFAULT_CONTRACT_MARKDOWN,
      isDefault: true
    },
    {
      id: "tpl_ugc_bundle",
      workspaceId: "ws_glowbotanics",
      name: "2x TikTok Video Bundle + 365-Day Whitelisting",
      deliverableCount: 2,
      usageRightsDays: 365,
      sparkAdsRequired: true,
      exclusivityDays: 60,
      revisionRounds: 2,
      paymentTerms: "50% upon contract signature, 50% Net 7 upon final live TikTok URLs",
      bodyMarkdown: DEFAULT_CONTRACT_MARKDOWN,
      isDefault: false
    }
  ];

  const sequences: OutreachSequenceRecord[] = [
    {
      id: "seq_barrier_drip",
      workspaceId: "ws_glowbotanics",
      campaignId: "camp_barrier_serum",
      name: "3-Step Skincare Creator Pitch + TikTok DM Nudge",
      isActive: true,
      steps: [
        {
          id: "step_1",
          stepOrder: 1,
          channel: "EMAIL",
          delayHours: 0,
          subjectTemplate: "Paid TikTok Collab with GlowBotanics x @{{tiktokHandle}} ✨",
          bodyTemplate:
            "Hi {{firstName}},\n\n{{customHook}}\n\nWe're selecting 12 skincare creators for our {{productName}} TikTok campaign. We have a ${{agreedRateUsd}} flat budget for 1 vertical TikTok video (including 90-day Spark Ads rights) + a full-size PR box.\n\nWould you be open to reviewing the brief and agreement via your creator portal link below?"
        },
        {
          id: "step_2",
          stepOrder: 2,
          channel: "TIKTOK_DM",
          delayHours: 24,
          subjectTemplate: "TikTok DM Nudge",
          bodyTemplate:
            "Hey {{firstName}}! Just sent an email to {{creatorEmail}} about a paid ${{agreedRateUsd}} TikTok collab for our CloudDew Cica Barrier Serum 🌿 Let me know if you want me to send the brief link here!"
        },
        {
          id: "step_3",
          stepOrder: 3,
          channel: "EMAIL",
          delayHours: 72,
          subjectTemplate: "Re: Paid TikTok Collab with GlowBotanics x @{{tiktokHandle}}",
          bodyTemplate:
            "Hi {{firstName}},\n\nBumping this to the top of your inbox as we're shipping out our final Cica Barrier Serum PR kits this Thursday. Let us know if you'd like to lock in a spot at ${{agreedRateUsd}}!"
        }
      ]
    }
  ];

  const campaignCreators: CampaignCreatorRecord[] = [
    {
      id: "cc_maya_serum",
      campaignId: "camp_barrier_serum",
      creatorId: "cr_maya",
      stage: "LIVE",
      agreedRateUsd: 265,
      magicLinkToken: "tok_maya_barrier_2026",
      customHook:
        "Loved your recent barrier repair breakdown on winter sensitivity—your close-up serum texture shots are exactly our vibe.",
      dmScript:
        "Hey Maya! Just emailed maya@glowwithmaya.com a $265 paid TikTok collab offer for our CloudDew Cica Serum ✨ Can't wait to hear what you think!",
      dmCopiedAt: "2026-10-21T14:00:00.000Z",
      lastContactedAt: "2026-10-21T13:30:00.000Z",
      replied: true,
      shippingStatus: "DELIVERED",
      trackingNumber: "1Z999AA10123456784",
      payoutStatus: "PAID",
      messages: [
        {
          id: "msg_1",
          campaignCreatorId: "cc_maya_serum",
          channel: "EMAIL",
          stepOrder: 1,
          subject: "Paid TikTok Collab with GlowBotanics x @glowwithmaya ✨",
          body: "Hi Maya, Loved your recent barrier repair breakdown on winter sensitivity...",
          status: "REPLIED",
          sentAt: "2026-10-21T13:30:00.000Z"
        }
      ],
      contract: {
        id: "con_maya_1",
        campaignCreatorId: "cc_maya_serum",
        templateId: "tpl_standard_spark",
        status: "SIGNED",
        renderedBodyMarkdown: DEFAULT_CONTRACT_MARKDOWN.replace("{{currentDate}}", "2026-10-22")
          .replace("{{brandName}}", "GlowBotanics Skincare")
          .replace("{{brandWebsite}}", "https://glowbotanics.co")
          .replace("{{creatorName}}", "Maya Lin")
          .replace(/\{\{tiktokHandle\}\}/g, "glowwithmaya")
          .replace("{{campaignName}}", "Q4 Cica Barrier Serum Seeding & Spark Ads")
          .replace(/\{\{productName\}\}/g, "CloudDew Cica + Ceramide Barrier Serum (30ml)")
          .replace(
            "{{productBrief}}",
            "Show a close-up texture shot of the milky CloudDew serum within the first 3 seconds."
          )
          .replace("{{deliverableCount}}", "1")
          .replace("{{revisionRounds}}", "1")
          .replace("{{usageRightsDays}}", "90")
          .replace(
            "{{sparkAdsClause}}",
            "Creator shall generate and provide a valid 90-day TikTok Spark Ads authorization code within 24 hours of publishing."
          )
          .replace(
            "{{exclusivityClause}}",
            "Creator agrees not to promote competing standalone Cica/Ceramide barrier serums on TikTok for 30 days following publication."
          )
          .replace("{{agreedRateUsd}}", "265")
          .replace(
            "{{paymentTerms}}",
            "Net 7 via ACH/PayPal upon live TikTok URL & Spark Ad authorization code"
          )
          .replace("{{brandSlug}}", "glowbotanics"),
        agreedRateUsd: 265,
        deliverableCount: 1,
        usageRightsDays: 90,
        sparkAdsRequired: true,
        exclusivityRequired: true,
        exclusivityDays: 30,
        revisionRounds: 1,
        paymentTerms: "Net 7 via ACH/PayPal upon live TikTok URL & Spark Ad authorization code",
        signerFullName: "Maya Lin",
        signerEmail: "maya@glowwithmaya.com",
        signerIpAddress: "172.56.21.89",
        signerUserAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)",
        signedAt: "2026-10-22T18:12:00.000Z",
        sentAt: "2026-10-22T10:00:00.000Z"
      },
      deliverables: [
        {
          id: "del_maya_1",
          campaignCreatorId: "cc_maya_serum",
          title: "1x Vertical TikTok Video + 90d Spark Code",
          status: "LIVE",
          scriptContent:
            "Hook (0-3s): 'If tretinoin wrecked your moisture barrier this fall, stop scrolling.' Body: Apply 2 drops of CloudDew milky serum on damp skin, show instant redness relief before SPF.",
          scriptFeedback: "Approved! Love the tretinoin barrier hook.",
          draftVideoUrl: "https://drive.google.com/file/d/maya-clouddew-draft-v1",
          draftFeedback: "Lighting and texture shot look incredible. Cleared to post!",
          tiktokPostUrl: "https://www.tiktok.com/@glowwithmaya/video/7431982341098234112",
          sparkAdCode: "SPARK-GLOW-99281-MAYA",
          viewsCount: 46200,
          likesCount: 3890,
          commentsCount: 245,
          sharesCount: 310,
          postedAt: "2026-11-01T17:00:00.000Z",
          usageExpiresAt: "2026-11-22T17:00:00.000Z"
        }
      ]
    },
    {
      id: "cc_chloe_serum",
      campaignId: "camp_barrier_serum",
      creatorId: "cr_chloe",
      stage: "DRAFT_REVIEW",
      agreedRateUsd: 175,
      magicLinkToken: "tok_chloe_barrier_2026",
      customHook:
        "Your 'derm-approved routines under $35' series is spot-on for our $29 CloudDew Cica Serum launch.",
      dmScript:
        "Hey Chloe! Sent an email to chloe.ugc@gmail.com about a $175 TikTok collab for our CloudDew Cica Barrier Serum 🌿 Let me know if you saw it!",
      dmCopiedAt: "2026-10-24T11:20:00.000Z",
      lastContactedAt: "2026-10-24T11:00:00.000Z",
      replied: true,
      shippingStatus: "DELIVERED",
      trackingNumber: "1Z999AA10123456991",
      payoutStatus: "SCHEDULED",
      messages: [
        {
          id: "msg_2",
          campaignCreatorId: "cc_chloe_serum",
          channel: "EMAIL",
          stepOrder: 1,
          subject: "Paid TikTok Collab with GlowBotanics x @skincarebychloe ✨",
          body: "Hi Chloe, Your 'derm-approved routines under $35' series is spot-on...",
          status: "REPLIED",
          sentAt: "2026-10-24T11:00:00.000Z"
        }
      ],
      contract: {
        id: "con_chloe_1",
        campaignCreatorId: "cc_chloe_serum",
        templateId: "tpl_standard_spark",
        status: "SIGNED",
        renderedBodyMarkdown: DEFAULT_CONTRACT_MARKDOWN.replace("{{currentDate}}", "2026-10-26")
          .replace("{{brandName}}", "GlowBotanics Skincare")
          .replace("{{brandWebsite}}", "https://glowbotanics.co")
          .replace("{{creatorName}}", "Chloe Ramirez")
          .replace(/\{\{tiktokHandle\}\}/g, "skincarebychloe")
          .replace("{{campaignName}}", "Q4 Cica Barrier Serum Seeding & Spark Ads")
          .replace(/\{\{productName\}\}/g, "CloudDew Cica + Ceramide Barrier Serum (30ml)")
          .replace(
            "{{productBrief}}",
            "Show a close-up texture shot of the milky CloudDew serum within the first 3 seconds."
          )
          .replace("{{deliverableCount}}", "1")
          .replace("{{revisionRounds}}", "1")
          .replace("{{usageRightsDays}}", "90")
          .replace(
            "{{sparkAdsClause}}",
            "Creator shall generate and provide a valid 90-day TikTok Spark Ads authorization code within 24 hours of publishing."
          )
          .replace(
            "{{exclusivityClause}}",
            "Creator agrees not to promote competing standalone Cica/Ceramide barrier serums on TikTok for 30 days following publication."
          )
          .replace("{{agreedRateUsd}}", "175")
          .replace(
            "{{paymentTerms}}",
            "Net 7 via ACH/PayPal upon live TikTok URL & Spark Ad authorization code"
          )
          .replace("{{brandSlug}}", "glowbotanics"),
        agreedRateUsd: 175,
        deliverableCount: 1,
        usageRightsDays: 90,
        sparkAdsRequired: true,
        exclusivityRequired: true,
        exclusivityDays: 30,
        revisionRounds: 1,
        paymentTerms: "Net 7 via ACH/PayPal upon live TikTok URL & Spark Ad authorization code",
        signerFullName: "Chloe Ramirez",
        signerEmail: "chloe.ugc@gmail.com",
        signerIpAddress: "108.44.19.12",
        signerUserAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5)",
        signedAt: "2026-10-26T15:40:00.000Z",
        sentAt: "2026-10-25T09:00:00.000Z"
      },
      deliverables: [
        {
          id: "del_chloe_1",
          campaignCreatorId: "cc_chloe_serum",
          title: "1x Sensitive Skin GRWM TikTok + Spark Code",
          status: "DRAFT_SUBMITTED",
          scriptContent:
            "Hook: '3 products that saved my reactive skin without breaking the bank.' Feature CloudDew serum at 0:04 with macro dropper shot.",
          scriptFeedback: "Approved! Please keep the caption under 150 chars with #ad.",
          draftVideoUrl: "https://www.dropbox.com/s/chloe-clouddew-draft-cut1.mp4",
          draftFeedback: "",
          tiktokPostUrl: "",
          sparkAdCode: "",
          viewsCount: 0,
          likesCount: 0,
          commentsCount: 0,
          sharesCount: 0,
          postedAt: null,
          usageExpiresAt: null
        }
      ]
    },
    {
      id: "cc_nina_serum",
      campaignId: "camp_barrier_serum",
      creatorId: "cr_nina",
      stage: "CONTRACT_SENT",
      agreedRateUsd: 225,
      magicLinkToken: "tok_nina_barrier_2026",
      customHook:
        "Your glass bottle ASMR vanity restocks are mesmerizing—our frosted glass CloudDew dropper bottle was practically made for your setup.",
      dmScript:
        "Hey Nina! Just sent your $225 contract link for the CloudDew Cica Serum ASMR video to ninakcreates@outlook.com 🫧 Let me know once you've peeked at the portal!",
      dmCopiedAt: null,
      lastContactedAt: "2026-11-10T10:15:00.000Z",
      replied: true,
      shippingStatus: "SHIPPED",
      trackingNumber: "1Z999AA10123457210",
      payoutStatus: "UNPAID",
      messages: [
        {
          id: "msg_3",
          campaignCreatorId: "cc_nina_serum",
          channel: "EMAIL",
          stepOrder: 1,
          subject: "Contract Ready: GlowBotanics x @unboxwithnina ($225)",
          body: "Hi Nina, Here is your magic portal link to e-sign the 1x TikTok agreement...",
          status: "SENT",
          sentAt: "2026-11-10T10:15:00.000Z"
        }
      ],
      contract: {
        id: "con_nina_1",
        campaignCreatorId: "cc_nina_serum",
        templateId: "tpl_standard_spark",
        status: "SENT",
        renderedBodyMarkdown: DEFAULT_CONTRACT_MARKDOWN.replace("{{currentDate}}", "2026-11-10")
          .replace("{{brandName}}", "GlowBotanics Skincare")
          .replace("{{brandWebsite}}", "https://glowbotanics.co")
          .replace("{{creatorName}}", "Nina K.")
          .replace(/\{\{tiktokHandle\}\}/g, "unboxwithnina")
          .replace("{{campaignName}}", "Q4 Cica Barrier Serum Seeding & Spark Ads")
          .replace(/\{\{productName\}\}/g, "CloudDew Cica + Ceramide Barrier Serum (30ml)")
          .replace(
            "{{productBrief}}",
            "Show a close-up texture shot of the milky CloudDew serum within the first 3 seconds."
          )
          .replace("{{deliverableCount}}", "1")
          .replace("{{revisionRounds}}", "1")
          .replace("{{usageRightsDays}}", "90")
          .replace(
            "{{sparkAdsClause}}",
            "Creator shall generate and provide a valid 90-day TikTok Spark Ads authorization code within 24 hours of publishing."
          )
          .replace(
            "{{exclusivityClause}}",
            "Creator agrees not to promote competing standalone Cica/Ceramide barrier serums on TikTok for 30 days following publication."
          )
          .replace("{{agreedRateUsd}}", "225")
          .replace(
            "{{paymentTerms}}",
            "Net 7 via ACH/PayPal upon live TikTok URL & Spark Ad authorization code"
          )
          .replace("{{brandSlug}}", "glowbotanics"),
        agreedRateUsd: 225,
        deliverableCount: 1,
        usageRightsDays: 90,
        sparkAdsRequired: true,
        exclusivityRequired: true,
        exclusivityDays: 30,
        revisionRounds: 1,
        paymentTerms: "Net 7 via ACH/PayPal upon live TikTok URL & Spark Ad authorization code",
        signerFullName: null,
        signerEmail: null,
        signerIpAddress: null,
        signerUserAgent: null,
        signedAt: null,
        sentAt: "2026-11-10T10:15:00.000Z"
      },
      deliverables: [
        {
          id: "del_nina_1",
          campaignCreatorId: "cc_nina_serum",
          title: "1x ASMR Skincare Restock TikTok + Spark Code",
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
        }
      ]
    },
    {
      id: "cc_zoe_serum",
      campaignId: "camp_barrier_serum",
      creatorId: "cr_zoe",
      stage: "OUTREACH_QUEUED",
      agreedRateUsd: 300,
      magicLinkToken: "tok_zoe_barrier_2026",
      customHook:
        "Your 5am pilates + holistic morning glow vlogs are so calming—we'd love to feature CloudDew as your post-pilates hydration step.",
      dmScript:
        "Hey Zoe! Just sent an email to zoe@wellnesswithzoe.co for a $300 paid TikTok integration in your 5am morning routine 🍵✨ Would love to send you our CloudDew Cica Serum!",
      dmCopiedAt: null,
      lastContactedAt: null,
      replied: false,
      shippingStatus: "PENDING",
      trackingNumber: "",
      payoutStatus: "UNPAID",
      messages: [],
      contract: null,
      deliverables: []
    },
    {
      id: "cc_kayla_serum",
      campaignId: "camp_barrier_serum",
      creatorId: "cr_kayla",
      stage: "CONTACTED",
      agreedRateUsd: 125,
      magicLinkToken: "tok_kayla_barrier_2026",
      customHook:
        "Your post-gym skincare & iced matcha vlogs in Austin feel like FaceTiming a best friend—CloudDew is amazing for post-workout redness.",
      dmScript:
        "Hey Kayla! Sent a quick note to kayla@dailybrewmedia.com about a $125 paid post-gym skincare TikTok collab with GlowBotanics 💻🌿 Let me know if you're down!",
      dmCopiedAt: null,
      lastContactedAt: "2026-11-12T15:00:00.000Z",
      replied: false,
      shippingStatus: "PENDING",
      trackingNumber: "",
      payoutStatus: "UNPAID",
      messages: [
        {
          id: "msg_4",
          campaignCreatorId: "cc_kayla_serum",
          channel: "EMAIL",
          stepOrder: 1,
          subject: "Paid TikTok Collab with GlowBotanics x @dailybrewkayla ✨",
          body: "Hi Kayla, Your post-gym skincare & iced matcha vlogs in Austin...",
          status: "SENT",
          sentAt: "2026-11-12T15:00:00.000Z"
        }
      ],
      contract: null,
      deliverables: []
    }
  ];

  return {
    workspaces,
    creators,
    campaigns,
    campaignCreators,
    sequences,
    contractTemplates
  };
}

const globalForStore = globalThis as unknown as {
  tokreachState: PlatformState | undefined;
};

export function getStore(): PlatformState {
  if (!globalForStore.tokreachState) {
    globalForStore.tokreachState = createInitialState();
  }
  return globalForStore.tokreachState;
}

/**
 * Resets the store to initial seeded state (useful for deterministic testing).
 */
export function resetStore(): PlatformState {
  globalForStore.tokreachState = createInitialState();
  return globalForStore.tokreachState;
}

/**
 * Lists all workspaces available to the current user.
 */
export function listWorkspaces(): WorkspaceRecord[] {
  return getStore().workspaces;
}

/**
 * Retrieves a single workspace by ID, falling back to the primary workspace.
 */
export function getWorkspaceById(workspaceId: string): WorkspaceRecord {
  const store = getStore();
  return (
    store.workspaces.find((ws) => ws.id === workspaceId) ??
    store.workspaces[0]
  );
}

/**
 * Creates a new brand workspace and assigns the creator as OWNER.
 */
export function createWorkspace(input: {
  name: string;
  brandWebsite: string;
  productCategory: string;
  defaultSenderName: string;
  defaultSenderEmail: string;
  ownerEmail: string;
  ownerName: string;
}): WorkspaceRecord {
  const store = getStore();
  const slug = input.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const id = `ws_${slug}_${Date.now().toString(36)}`;

  const newWorkspace: WorkspaceRecord = {
    id,
    name: input.name.trim(),
    slug,
    brandWebsite: input.brandWebsite.trim() || `https://${slug}.com`,
    productCategory: input.productCategory.trim() || "Consumer Brand",
    defaultSenderName: input.defaultSenderName.trim() || `${input.ownerName} (${input.name})`,
    defaultSenderEmail: input.defaultSenderEmail.trim() || input.ownerEmail,
    members: [
      {
        id: `mem_${Date.now().toString(36)}`,
        workspaceId: id,
        inviteEmail: input.ownerEmail,
        fullName: input.ownerName,
        role: "OWNER",
        status: "ACTIVE",
        createdAt: new Date().toISOString()
      }
    ]
  };

  store.workspaces.push(newWorkspace);
  store.contractTemplates.push({
    id: `tpl_${Date.now().toString(36)}`,
    workspaceId: id,
    name: "Standard 1x TikTok Video + 90-Day Spark Ads Agreement",
    deliverableCount: 1,
    usageRightsDays: 90,
    sparkAdsRequired: true,
    exclusivityDays: 30,
    revisionRounds: 1,
    paymentTerms: "Net 7 upon live TikTok URL & Spark Ad code submission",
    bodyMarkdown: DEFAULT_CONTRACT_MARKDOWN,
    isDefault: true
  });

  return newWorkspace;
}

/**
 * Invites a team member to a workspace.
 */
export function inviteWorkspaceMember(input: {
  workspaceId: string;
  inviteEmail: string;
  fullName: string;
  role: "ADMIN" | "MEMBER";
}): WorkspaceMemberRecord {
  const workspace = getWorkspaceById(input.workspaceId);
  const existing = workspace.members.find(
    (m) => m.inviteEmail.toLowerCase() === input.inviteEmail.trim().toLowerCase()
  );
  if (existing) {
    return existing;
  }

  const member: WorkspaceMemberRecord = {
    id: `mem_${Date.now().toString(36)}`,
    workspaceId: workspace.id,
    inviteEmail: input.inviteEmail.trim().toLowerCase(),
    fullName: input.fullName.trim() || input.inviteEmail.split("@")[0],
    role: input.role,
    status: "INVITED",
    createdAt: new Date().toISOString()
  };

  workspace.members.push(member);
  return member;
}

/**
 * Computes executive KPI metrics for a given workspace.
 */
export function getWorkspaceDashboardMetrics(workspaceId: string) {
  const store = getStore();
  const creators = store.creators.filter((c) => c.workspaceId === workspaceId);
  const campaigns = store.campaigns.filter((c) => c.workspaceId === workspaceId);
  const campaignIds = new Set(campaigns.map((c) => c.id));
  const pipelineItems = store.campaignCreators.filter((cc) => campaignIds.has(cc.campaignId));

  const contactedCount = pipelineItems.filter((cc) => cc.stage !== "DISCOVERED" && cc.stage !== "OUTREACH_QUEUED").length;
  const repliedCount = pipelineItems.filter((cc) => cc.replied).length;
  const signedContractsCount = pipelineItems.filter((cc) => cc.contract?.status === "SIGNED").length;
  const pendingDraftsCount = pipelineItems.filter((cc) =>
    cc.deliverables.some((d) => d.status === "DRAFT_SUBMITTED" || d.status === "SCRIPT_SUBMITTED")
  ).length;
  const dmQueueCount = pipelineItems.filter(
    (cc) => (cc.stage === "OUTREACH_QUEUED" || cc.stage === "CONTACTED") && !cc.dmCopiedAt
  ).length;

  const now = Date.now();
  const fourteenDaysMs = 14 * 24 * 60 * 60 * 1000;
  const expiringUsageRights = pipelineItems.flatMap((cc) => {
    const creator = creators.find((c) => c.id === cc.creatorId);
    return cc.deliverables
      .filter((d) => {
        if (!d.usageExpiresAt) return false;
        const expiresMs = new Date(d.usageExpiresAt).getTime();
        return expiresMs - now <= fourteenDaysMs;
      })
      .map((d) => ({
        deliverableId: d.id,
        creatorHandle: creator?.tiktokHandle ?? "unknown",
        tiktokPostUrl: d.tiktokPostUrl,
        sparkAdCode: d.sparkAdCode,
        usageExpiresAt: d.usageExpiresAt!
      }));
  });

  const avgEngagementRate =
    creators.length > 0
      ? Number(
          (creators.reduce((acc, c) => acc + c.engagementRate, 0) / creators.length).toFixed(2)
        )
      : 0;

  return {
    totalCreators: creators.length,
    activeCampaigns: campaigns.filter((c) => c.status === "ACTIVE").length,
    contactedCount,
    replyRatePercent:
      contactedCount > 0 ? Math.round((repliedCount / contactedCount) * 100) : 0,
    signedContractsCount,
    pendingDraftsCount,
    dmQueueCount,
    avgEngagementRate,
    expiringUsageRights,
    pipelineStageCounts: {
      DISCOVERED: pipelineItems.filter((i) => i.stage === "DISCOVERED").length,
      OUTREACH_QUEUED: pipelineItems.filter((i) => i.stage === "OUTREACH_QUEUED").length,
      CONTACTED: pipelineItems.filter((i) => i.stage === "CONTACTED").length,
      NEGOTIATING: pipelineItems.filter((i) => i.stage === "NEGOTIATING").length,
      CONTRACT_SENT: pipelineItems.filter((i) => i.stage === "CONTRACT_SENT").length,
      CONTRACT_SIGNED: pipelineItems.filter((i) => i.stage === "CONTRACT_SIGNED").length,
      DRAFT_REVIEW: pipelineItems.filter((i) => i.stage === "DRAFT_REVIEW").length,
      LIVE: pipelineItems.filter((i) => i.stage === "LIVE").length
    }
  };
}

/**
 * Lists creators belonging to a workspace with optional filter criteria.
 */
export function listCreators(params: {
  workspaceId: string;
  search?: string;
  niche?: string;
  minFollowers?: number;
  maxFollowers?: number;
  minEngagementRate?: number;
  maxRateUsd?: number;
}): CreatorRecord[] {
  const store = getStore();
  return store.creators
    .filter((c) => c.workspaceId === params.workspaceId)
    .filter((c) => {
      if (params.search) {
        const q = params.search.toLowerCase();
        const matches =
          c.tiktokHandle.toLowerCase().includes(q) ||
          c.displayName.toLowerCase().includes(q) ||
          c.bio.toLowerCase().includes(q) ||
          c.nicheTags.some((t) => t.toLowerCase().includes(q));
        if (!matches) return false;
      }
      if (params.niche && params.niche !== "ALL") {
        if (!c.nicheTags.some((t) => t.toLowerCase() === params.niche!.toLowerCase())) {
          return false;
        }
      }
      if (typeof params.minFollowers === "number" && c.followerCount < params.minFollowers) {
        return false;
      }
      if (typeof params.maxFollowers === "number" && params.maxFollowers > 0 && c.followerCount > params.maxFollowers) {
        return false;
      }
      if (
        typeof params.minEngagementRate === "number" &&
        c.engagementRate < params.minEngagementRate
      ) {
        return false;
      }
      if (
        typeof params.maxRateUsd === "number" &&
        params.maxRateUsd > 0 &&
        c.estimatedRateUsd > params.maxRateUsd
      ) {
        return false;
      }
      return true;
    })
    .sort((a, b) => b.engagementRate - a.engagementRate);
}

/**
 * Upserts a creator into a workspace, normalizing the TikTok handle and calculating engagement & fee estimates.
 */
export function upsertCreator(input: {
  workspaceId: string;
  tiktokHandle: string;
  displayName?: string;
  email?: string;
  bio?: string;
  followerCount: number;
  avgViews: number;
  avgLikes: number;
  avgComments: number;
  avgShares: number;
  nicheTags: string[];
  enrichmentSource?: "MANUAL" | "CSV" | "OEMBED" | "AI_ENRICHED";
  notes?: string;
}): CreatorRecord {
  const store = getStore();
  const handle = normalizeTikTokHandle(input.tiktokHandle, false);
  if (!handle) {
    throw new Error("A valid TikTok @handle is required.");
  }

  const engagementRate = calculateEngagementRate({
    likes: input.avgLikes,
    comments: input.avgComments,
    shares: input.avgShares,
    views: input.avgViews
  });

  const estimatedRateUsd = estimateCreatorRateUsd({
    followerCount: input.followerCount,
    avgViews: input.avgViews,
    engagementRate
  });

  const existingIndex = store.creators.findIndex(
    (c) => c.workspaceId === input.workspaceId && c.tiktokHandle === handle
  );

  const record: CreatorRecord = {
    id: existingIndex >= 0 ? store.creators[existingIndex].id : `cr_${handle}_${Date.now().toString(36)}`,
    workspaceId: input.workspaceId,
    tiktokHandle: handle,
    displayName: input.displayName?.trim() || `@${handle}`,
    email: input.email?.trim() || `${handle}@creatorcollab.co`,
    bio: input.bio?.trim() || "",
    followerCount: input.followerCount,
    avgViews: input.avgViews,
    avgLikes: input.avgLikes,
    avgComments: input.avgComments,
    avgShares: input.avgShares,
    engagementRate,
    estimatedRateUsd,
    nicheTags: input.nicheTags.length > 0 ? input.nicheTags : ["tiktok-creator"],
    profileUrl: buildTikTokProfileUrl(handle),
    enrichmentSource: input.enrichmentSource ?? "MANUAL",
    notes: input.notes?.trim() ?? "",
    createdAt:
      existingIndex >= 0 ? store.creators[existingIndex].createdAt : new Date().toISOString()
  };

  if (existingIndex >= 0) {
    store.creators[existingIndex] = record;
  } else {
    store.creators.unshift(record);
  }

  return record;
}

/**
 * Lists campaigns for a workspace along with enriched creator pipeline entries.
 */
export function listCampaignsForWorkspace(workspaceId: string) {
  const store = getStore();
  const campaigns = store.campaigns.filter((c) => c.workspaceId === workspaceId);
  return campaigns.map((campaign) => {
    const entries = store.campaignCreators
      .filter((cc) => cc.campaignId === campaign.id)
      .map((cc) => ({
        ...cc,
        creator: store.creators.find((cr) => cr.id === cc.creatorId)!
      }))
      .filter((cc) => Boolean(cc.creator));

    return {
      ...campaign,
      entries
    };
  });
}

/**
 * Updates a campaign creator's stage or details.
 */
export function updateCampaignCreatorStage(params: {
  campaignCreatorId: string;
  stage: PipelineStageId;
}): CampaignCreatorRecord | null {
  const store = getStore();
  const entry = store.campaignCreators.find((cc) => cc.id === params.campaignCreatorId);
  if (!entry) return null;
  entry.stage = params.stage;
  return entry;
}

/**
 * Finds a CampaignCreator entry by its public Magic-Link Token for the Creator Portal.
 */
export function getPortalContextByToken(token: string) {
  const store = getStore();
  const entry = store.campaignCreators.find((cc) => cc.magicLinkToken === token);
  if (!entry) return null;

  const campaign = store.campaigns.find((c) => c.id === entry.campaignId);
  const creator = store.creators.find((c) => c.id === entry.creatorId);
  if (!campaign || !creator) return null;

  const workspace = getWorkspaceById(campaign.workspaceId);
  return {
    entry,
    campaign,
    creator,
    workspace
  };
}

export { DEFAULT_CONTRACT_MARKDOWN };
