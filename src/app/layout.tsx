/*
Author: Domonick Mack
Date: 2026-11-15
Description: Root application layout configuring metadata, dark mode defaults, and typography.
*/

import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TokReach — TikTok Micro-Influencer Outreach & Contract Manager",
  description:
    "Discover TikTok micro-influencers, automate personalized email & DM outreach, and track contracts & deliverables in one streamlined workspace.",
  icons: {
    icon: "/favicon.svg"
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#090A0F] text-[#F3F5F8] antialiased selection:bg-[#25F4EE]/20 selection:text-[#25F4EE]">
        {children}
      </body>
    </html>
  );
}
