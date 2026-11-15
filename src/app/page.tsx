/*
Author: Domonick Mack
Date: 2026-11-15
Description: Root application entry page displaying TokReach architecture status and core modules.
*/

import { CheckCircle2, FileSignature, Send, Sparkles, Users } from "lucide-react";

const CORE_CAPABILITIES = [
  {
    title: "Hybrid TikTok Creator Discovery",
    description:
      "Import creators by @handle or CSV, calculate true view-based engagement rates, and auto-tag niches via AI bio analysis.",
    icon: Users,
    accent: "text-[#25F4EE]"
  },
  {
    title: "Email Drip + Guided TikTok DM Queue",
    description:
      "Run multi-step automated email sequences with BullMQ while executing 1-click TikTok DM scripts with direct profile deeplinks.",
    icon: Send,
    accent: "text-[#FE2C55]"
  },
  {
    title: "Contract Builder & Magic-Link E-Sign",
    description:
      "Generate TikTok-specific agreements covering Spark Ads, usage rights windows, exclusivity, and FTC disclosures.",
    icon: FileSignature,
    accent: "text-[#25F4EE]"
  },
  {
    title: "Deliverable & Usage-Rights Pipeline",
    description:
      "Review creator scripts and drafts, verify live TikTok post URLs, and track paid usage expiration countdowns.",
    icon: Sparkles,
    accent: "text-[#FE2C55]"
  }
];

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col justify-between px-6 py-12">
      <header className="flex items-center justify-between border-b border-[#1F2230] pb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#11131A] ring-1 ring-[#1F2230]">
            <span className="bg-gradient-to-r from-[#25F4EE] to-[#FE2C55] bg-clip-text font-mono text-lg font-bold text-transparent">
              TR
            </span>
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-[#F3F5F8]">TokReach</h1>
            <p className="text-xs text-[#8A90A6]">TikTok Micro-Influencer Outreach & Contract CRM</p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-[#1F2230] bg-[#11131A] px-3 py-1.5 text-xs text-[#8A90A6]">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
          <span>System Online</span>
        </div>
      </header>

      <section className="my-16 space-y-10">
        <div className="max-w-3xl space-y-4">
          <span className="inline-flex items-center rounded-full border border-[#25F4EE]/30 bg-[#25F4EE]/10 px-3 py-1 font-mono text-xs text-[#25F4EE]">
            BUILT FOR SMALL CONSUMER BRANDS
          </span>
          <h2 className="text-4xl font-bold tracking-tight text-[#F3F5F8] sm:text-5xl">
            Scale TikTok micro-influencer seeding, outreach, and contracts without enterprise bloat.
          </h2>
          <p className="text-base leading-relaxed text-[#8A90A6]">
            Manage 5K–150K follower TikTok creators from initial discovery to signed Spark Ad agreements and live video deliverables.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {CORE_CAPABILITIES.map((feature) => {
            const IconComponent = feature.icon;
            return (
              <div
                key={feature.title}
                className="rounded-xl border border-[#1F2230] bg-[#11131A] p-6 transition hover:border-[#25F4EE]/40"
              >
                <div className="mb-3 flex items-center gap-2.5">
                  <IconComponent className={`h-5 w-5 ${feature.accent}`} />
                  <h3 className="font-semibold text-[#F3F5F8]">{feature.title}</h3>
                </div>
                <p className="text-sm leading-relaxed text-[#8A90A6]">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      <footer className="flex items-center justify-between border-t border-[#1F2230] pt-6 text-xs text-[#8A90A6]">
        <span>TokReach v0.1.0 — Containerized with Docker & Railway Ready</span>
        <span className="font-mono">@mackdr91/tiktok-outreach-manager</span>
      </footer>
    </main>
  );
}
