<!--
Author: Domonick Mack
Date: 2026-11-15
Description: Project documentation for TokReach - TikTok Micro-Influencer Outreach & Contract Manager.
-->

# TokReach — TikTok Micro-Influencer Outreach & Contract Manager

**TokReach** is a niche-focused, lightweight SaaS platform built for small consumer brands to discover, contact, contract, and track deliverables with **TikTok micro-influencers** (5K–150K followers) without the enterprise bloat or \$2,000+/month pricing of legacy influencer suites.

---

## Core Capabilities

1. **Hybrid TikTok Creator Discovery & Enrichment**
   - Add creators by `@handle` or bulk CSV import with automatic column mapping and deduplication.
   - Real-time TikTok engagement calculator ($\frac{\text{Likes} + \text{Comments} + \text{Shares}}{\text{Views}} \times 100$) and fair CPV/flat-fee estimator.
   - AI-powered bio & niche tag extraction (via Google Gemini API with deterministic keyword fallback) and pluggable TikTok metadata enrichment.

2. **Dual-Channel Outreach Automation**
   - **Automated Email Drip Sequences**: Multi-step scheduled sequences with merge variables (`{{firstName}}`, `{{tiktokHandle}}`, `{{niche}}`, `{{productName}}`), AI-personalized hooks, and BullMQ background execution.
   - **Guided TikTok DM Queue**: Rapid outreach queue with 1-click AI script copy and direct `https://www.tiktok.com/@handle` profile deeplinks.

3. **TikTok Contract Builder & E-Signature**
   - Parameterized legal templates tailored for TikTok collaborations: deliverable count, paid usage rights duration (30/90/365 days), Spark Ads authorization codes, niche exclusivity, revision rounds, and mandatory FTC `#ad` disclosures.
   - Cryptographic audit trail recording signer full name, email, IP address, user agent, and timestamp.

4. **Passwordless Magic-Link Creator Portal (`/portal/[token]`)**
   - Zero-login mobile-ready portal where creators review campaign briefs, legally e-sign agreements, submit video scripts/hooks, share draft links, and submit live TikTok post URLs + Spark Ad codes.

5. **Deliverable Pipeline & Usage-Rights Tracker**
   - Switchable **Kanban Board** and **High-Density Table View** across every collaboration stage (`DISCOVERED` → `OUTREACH_QUEUED` → `CONTACTED` → `NEGOTIATING` → `CONTRACT_SENT` → `CONTRACT_SIGNED` → `SCRIPT_PENDING` → `DRAFT_REVIEW` → `LIVE` → `COMPLETED`).
   - Automated tracking of paid content usage windows with expiration alerts.

---

## Tech Stack

- **Framework**: Next.js 15 (App Router, TypeScript, React 19)
- **Styling**: Tailwind CSS, Radix UI / shadcn-inspired components, Lucide Icons (Linear/Attio-style Dark & Light theme with TikTok `#25F4EE` Cyan & `#FE2C55` Rose accents)
- **Database & ORM**: PostgreSQL 16 + Prisma ORM
- **Background Jobs**: Redis 7 + BullMQ Worker
- **AI Personalization**: Google Gemini SDK (`@google/genai`)
- **Email Delivery**: Nodemailer / Resend SMTP transport
- **Testing & Quality**: Vitest, TypeScript strict mode, ESLint
- **DevOps & Deployment**: Docker, Docker Compose, GitHub Actions CI/CD, Railway

---

## Quick Start (Docker Compose)

```bash
# 1. Copy environment variables
cp .env.example .env

# 2. Build and start all services (App, BullMQ Worker, PostgreSQL 16, Redis 7)
docker compose up --build
```

The application will be available at `http://localhost:3000`.

---

## Local Development (Node.js)

```bash
# 1. Install dependencies
npm install

# 2. Generate Prisma Client & push schema
npx prisma generate
npx prisma db push
npm run db:seed

# 3. Start Next.js development server
npm run dev

# 4. Start BullMQ outreach & usage-rights worker (in a separate terminal)
npm run worker
```

---

## License

Copyright © 2026 Domonick Mack. All rights reserved.
