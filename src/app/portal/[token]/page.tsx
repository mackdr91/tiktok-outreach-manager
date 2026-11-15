/*
Author: Domonick Mack
Date: 2026-11-15
Description: Public Magic-Link Creator Portal server page resolving collaboration details by token.
*/

import Link from "next/link";
import { getPortalContextByToken } from "@/lib/store";
import { CreatorPortalClient } from "@/components/portal/CreatorPortalClient";

export const dynamic = "force-dynamic";

export default async function CreatorPortalPage({
  params
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const portalData = getPortalContextByToken(token);

  if (!portalData) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-[#090A0F] p-6 text-center text-[#F3F5F8]">
        <div className="max-w-md rounded-2xl border border-[#1F2230] bg-[#11131A] p-8">
          <span className="font-mono text-xs text-[#FE2C55]">PORTAL LINK NOT FOUND</span>
          <h1 className="mt-2 text-xl font-bold">
            Invalid or Expired Creator Portal Link
          </h1>
          <p className="mt-2 text-xs text-[#8A90A6]">
            Please ask your brand partnership coordinator for an updated magic link.
          </p>
          <Link
            href="/"
            className="mt-6 inline-block rounded-lg bg-[#25F4EE] px-4 py-2 text-xs font-semibold text-[#090A0F]"
          >
            Return to Brand Workspace
          </Link>
        </div>
      </main>
    );
  }

  return <CreatorPortalClient token={token} initialData={portalData} />;
}
