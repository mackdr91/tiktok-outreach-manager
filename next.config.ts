/*
Author: Domonick Mack
Date: 2026-11-15
Description: Next.js 15 configuration for standalone Docker production builds and server external packages.
*/

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ["bullmq", "ioredis", "bcryptjs", "nodemailer"]
};

export default nextConfig;
