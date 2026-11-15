/*
Author: Domonick Mack
Date: 2026-11-15
Description: Database seed script populating initial multi-brand workspaces, TikTok micro-influencers, and campaigns.
*/

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { getStore } from "../src/lib/store";

const prisma = new PrismaClient();

async function main(): Promise<void> {
  await prisma.systemHealth.upsert({
    where: { service: "tokreach-core" },
    update: { status: "operational" },
    create: {
      service: "tokreach-core",
      status: "operational"
    }
  });

  const passwordHash = await bcrypt.hash("TokReach2026!", 10);
  const founder = await prisma.user.upsert({
    where: { email: "domonick@glowbotanics.co" },
    update: { fullName: "Domonick Mack" },
    create: {
      id: "user_founder_1",
      email: "domonick@glowbotanics.co",
      passwordHash,
      fullName: "Domonick Mack"
    }
  });

  const initialStore = getStore();

  for (const ws of initialStore.workspaces) {
    await prisma.workspace.upsert({
      where: { id: ws.id },
      update: {
        name: ws.name,
        brandWebsite: ws.brandWebsite,
        productCategory: ws.productCategory,
        defaultSenderName: ws.defaultSenderName,
        defaultSenderEmail: ws.defaultSenderEmail
      },
      create: {
        id: ws.id,
        name: ws.name,
        slug: ws.slug,
        brandWebsite: ws.brandWebsite,
        productCategory: ws.productCategory,
        defaultSenderName: ws.defaultSenderName,
        defaultSenderEmail: ws.defaultSenderEmail
      }
    });

    for (const member of ws.members) {
      await prisma.workspaceMember.upsert({
        where: {
          workspaceId_inviteEmail: {
            workspaceId: ws.id,
            inviteEmail: member.inviteEmail
          }
        },
        update: {
          role: member.role,
          status: member.status
        },
        create: {
          id: member.id,
          workspaceId: ws.id,
          userId: member.inviteEmail === founder.email ? founder.id : null,
          inviteEmail: member.inviteEmail,
          role: member.role,
          status: member.status
        }
      });
    }
  }

  for (const cr of initialStore.creators) {
    await prisma.creator.upsert({
      where: {
        workspaceId_tiktokHandle: {
          workspaceId: cr.workspaceId,
          tiktokHandle: cr.tiktokHandle
        }
      },
      update: {
        displayName: cr.displayName,
        email: cr.email,
        bio: cr.bio,
        followerCount: cr.followerCount,
        avgViews: cr.avgViews,
        avgLikes: cr.avgLikes,
        avgComments: cr.avgComments,
        avgShares: cr.avgShares,
        engagementRate: cr.engagementRate,
        estimatedRateUsd: cr.estimatedRateUsd,
        nicheTags: cr.nicheTags,
        profileUrl: cr.profileUrl,
        enrichmentSource: cr.enrichmentSource,
        notes: cr.notes
      },
      create: {
        id: cr.id,
        workspaceId: cr.workspaceId,
        tiktokHandle: cr.tiktokHandle,
        displayName: cr.displayName,
        email: cr.email,
        bio: cr.bio,
        followerCount: cr.followerCount,
        avgViews: cr.avgViews,
        avgLikes: cr.avgLikes,
        avgComments: cr.avgComments,
        avgShares: cr.avgShares,
        engagementRate: cr.engagementRate,
        estimatedRateUsd: cr.estimatedRateUsd,
        nicheTags: cr.nicheTags,
        profileUrl: cr.profileUrl,
        enrichmentSource: cr.enrichmentSource,
        notes: cr.notes
      }
    });
  }

  console.info("[TokReach Seed] Multi-brand workspaces and TikTok creator directory seeded.");
}

main()
  .catch((error) => {
    console.error("[TokReach Seed] Failed to seed database:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
