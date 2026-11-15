/*
Author: Domonick Mack
Date: 2026-11-15
Description: Database seed script verifying baseline Prisma connectivity and system status.
*/

import { PrismaClient } from "@prisma/client";

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
  console.info("[TokReach Seed] Baseline system health record initialized.");
}

main()
  .catch((error) => {
    console.error("[TokReach Seed] Failed to seed database:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
