"use client";

/*
Author: Domonick Mack
Date: 2026-11-15
Description: Linear/Attio-inspired Dark/Light SaaS shell with multi-brand workspace switcher and navigation sidebar.
*/

import React, { useEffect, useState } from "react";
import {
  Building2,
  ChevronDown,
  FileSignature,
  Kanban,
  LayoutDashboard,
  Moon,
  Send,
  ShieldCheck,
  Sun,
  Users
} from "lucide-react";
import { WorkspaceRecord } from "@/lib/types";
import { DashboardMetricsData, OverviewDashboard } from "../dashboard/OverviewDashboard";
import { CreatorDirectory } from "../creators/CreatorDirectory";

export type ActiveTabId = "overview" | "creators" | "campaigns" | "outreach" | "contracts";

interface AppShellProps {
  initialWorkspace: WorkspaceRecord;
  initialWorkspaces: WorkspaceRecord[];
  initialMetrics: DashboardMetricsData;
  userEmail: string;
  userFullName: string;
  renderCreatorsTab?: (workspaceId: string) => React.ReactNode;
  renderCampaignsTab?: (workspaceId: string) => React.ReactNode;
  renderOutreachTab?: (workspaceId: string) => React.ReactNode;
  renderContractsTab?: (workspaceId: string) => React.ReactNode;
}

const NAV_ITEMS: Array<{
  id: ActiveTabId;
  label: string;
  badgeKey?: keyof DashboardMetricsData;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: "overview", label: "Command Overview", icon: LayoutDashboard },
  { id: "creators", label: "TikTok Creators", badgeKey: "totalCreators", icon: Users },
  { id: "campaigns", label: "Campaign Pipeline", badgeKey: "activeCampaigns", icon: Kanban },
  { id: "outreach", label: "Outreach & DM Queue", badgeKey: "dmQueueCount", icon: Send },
  {
    id: "contracts",
    label: "Contracts & Deliverables",
    badgeKey: "signedContractsCount",
    icon: FileSignature
  }
];

export function AppShell({
  initialWorkspace,
  initialWorkspaces,
  initialMetrics,
  userEmail,
  userFullName,
  renderCreatorsTab,
  renderCampaignsTab,
  renderOutreachTab,
  renderContractsTab
}: AppShellProps) {
  const [activeTab, setActiveTab] = useState<ActiveTabId>("overview");
  const [darkMode, setDarkMode] = useState(true);
  const [workspaces, setWorkspaces] = useState<WorkspaceRecord[]>(initialWorkspaces);
  const [activeWorkspace, setActiveWorkspace] = useState<WorkspaceRecord>(initialWorkspace);
  const [metrics, setMetrics] = useState<DashboardMetricsData>(initialMetrics);

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [darkMode]);

  const refreshWorkspaceData = async (workspaceId: string) => {
    const res = await fetch(`/api/workspaces?workspaceId=${encodeURIComponent(workspaceId)}`);
    if (!res.ok) return;
    const data = await res.json();
    setActiveWorkspace(data.activeWorkspace);
    setWorkspaces(data.workspaces);
    setMetrics(data.metrics);
  };

  const handleSwitchWorkspace = async (workspaceId: string) => {
    await fetch("/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "switch_workspace",
        workspaceId
      })
    });
    await refreshWorkspaceData(workspaceId);
  };

  const handleInviteMember = async (payload: {
    inviteEmail: string;
    fullName: string;
    role: "ADMIN" | "MEMBER";
  }) => {
    const res = await fetch("/api/workspaces", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "invite_member",
        workspaceId: activeWorkspace.id,
        ...payload
      })
    });
    if (res.ok) {
      await refreshWorkspaceData(activeWorkspace.id);
    }
  };

  const handleCreateWorkspace = async (payload: {
    name: string;
    brandWebsite: string;
    productCategory: string;
    defaultSenderName: string;
    defaultSenderEmail: string;
  }) => {
    const res = await fetch("/api/workspaces", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "create_workspace",
        ...payload
      })
    });
    if (res.ok) {
      const data = await res.json();
      setWorkspaces(data.workspaces);
      setActiveWorkspace(data.workspace);
      setMetrics(data.metrics);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 dark:bg-[#090A0F] dark:text-[#F3F5F8]">
      {/* Left Sidebar */}
      <aside className="flex w-64 shrink-0 flex-col justify-between border-r border-slate-200 bg-white p-4 dark:border-[#1F2230] dark:bg-[#11131A]">
        <div className="space-y-6">
          {/* Brand Logo */}
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 ring-1 ring-slate-700 dark:bg-[#090A0F] dark:ring-[#1F2230]">
                <span className="bg-gradient-to-r from-[#25F4EE] to-[#FE2C55] bg-clip-text font-mono text-sm font-bold text-transparent">
                  TR
                </span>
              </div>
              <div>
                <span className="text-sm font-bold tracking-tight">TokReach</span>
                <span className="ml-1.5 rounded bg-[#FE2C55]/15 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-[#FE2C55]">
                  TIKTOK ONLY
                </span>
              </div>
            </div>
          </div>

          {/* Multi-Brand Workspace Switcher */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 dark:border-[#1F2230] dark:bg-[#090A0F]">
            <label className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-[#8A90A6]">
              <Building2 className="h-3 w-3 text-[#25F4EE]" />
              Active Brand Workspace
            </label>
            <div className="relative">
              <select
                aria-label="Select Active Brand Workspace"
                value={activeWorkspace.id}
                onChange={(e) => handleSwitchWorkspace(e.target.value)}
                className="w-full appearance-none rounded-lg border border-slate-200 bg-white py-1.5 pl-2.5 pr-7 text-xs font-semibold text-slate-900 focus:border-[#25F4EE] focus:outline-none dark:border-[#1F2230] dark:bg-[#11131A] dark:text-[#F3F5F8]"
              >
                {workspaces.map((ws) => (
                  <option key={ws.id} value={ws.id}>
                    {ws.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-2 h-3.5 w-3.5 text-slate-400" />
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              const badgeVal = item.badgeKey ? metrics[item.badgeKey] : null;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition ${
                    isActive
                      ? "bg-slate-900 text-white dark:bg-[#1F2230] dark:text-[#25F4EE]"
                      : "text-slate-600 hover:bg-slate-100 dark:text-[#8A90A6] dark:hover:bg-[#1F2230]/50 dark:hover:text-[#F3F5F8]"
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </span>
                  {typeof badgeVal === "number" && (
                    <span
                      className={`rounded-full px-1.5 py-0.5 font-mono text-[10px] ${
                        isActive
                          ? "bg-[#25F4EE]/20 text-[#25F4EE]"
                          : "bg-slate-200 text-slate-700 dark:bg-[#090A0F] dark:text-[#8A90A6]"
                      }`}
                    >
                      {badgeVal}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Footer & Theme Switcher */}
        <div className="space-y-3 border-t border-slate-200 pt-4 dark:border-[#1F2230]">
          <button
            type="button"
            onClick={() => setDarkMode((prev) => !prev)}
            className="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 transition hover:border-[#25F4EE] dark:border-[#1F2230] dark:bg-[#090A0F] dark:text-[#8A90A6]"
          >
            <span>Theme Mode</span>
            <span className="inline-flex items-center gap-1.5 font-mono text-slate-900 dark:text-[#F3F5F8]">
              {darkMode ? (
                <>
                  <Moon className="h-3.5 w-3.5 text-[#25F4EE]" /> Dark
                </>
              ) : (
                <>
                  <Sun className="h-3.5 w-3.5 text-amber-500" /> Light
                </>
              )}
            </span>
          </button>

          <div className="flex items-center gap-2.5 px-1">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-[#25F4EE] to-[#FE2C55] font-mono text-xs font-bold text-[#090A0F]">
              {userFullName
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-slate-900 dark:text-[#F3F5F8]">
                {userFullName}
              </p>
              <p className="truncate font-mono text-[11px] text-slate-500 dark:text-[#8A90A6]">
                {userEmail}
              </p>
            </div>
            <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-400" />
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-x-hidden">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3.5 dark:border-[#1F2230] dark:bg-[#11131A]">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs uppercase tracking-wider text-slate-400 dark:text-[#8A90A6]">
              {activeWorkspace.slug}
            </span>
            <span className="text-slate-300 dark:text-[#1F2230]">/</span>
            <h1 className="text-sm font-semibold text-slate-900 dark:text-[#F3F5F8]">
              {NAV_ITEMS.find((i) => i.id === activeTab)?.label}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="/portal/tok_nina_barrier_2026"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#25F4EE]/40 bg-[#25F4EE]/10 px-3 py-1.5 font-mono text-xs font-medium text-[#0891B2] transition hover:bg-[#25F4EE]/20 dark:text-[#25F4EE]"
            >
              Preview Magic-Link Creator Portal ↗
            </a>
          </div>
        </header>

        <main className="flex-1 p-6">
          {activeTab === "overview" && (
            <OverviewDashboard
              workspace={activeWorkspace}
              metrics={metrics}
              onNavigateTab={(tab) => setActiveTab(tab as ActiveTabId)}
              onInviteMember={handleInviteMember}
              onCreateWorkspace={handleCreateWorkspace}
            />
          )}

          {activeTab === "creators" &&
            (renderCreatorsTab ? (
              renderCreatorsTab(activeWorkspace.id)
            ) : (
              <CreatorDirectory workspaceId={activeWorkspace.id} />
            ))}

          {activeTab === "campaigns" &&
            (renderCampaignsTab ? (
              renderCampaignsTab(activeWorkspace.id)
            ) : (
              <div className="rounded-xl border border-slate-200 bg-white p-8 text-center dark:border-[#1F2230] dark:bg-[#11131A]">
                <p className="text-sm font-medium">
                  Campaign Kanban & Pipeline Module (Phase 4)
                </p>
              </div>
            ))}

          {activeTab === "outreach" &&
            (renderOutreachTab ? (
              renderOutreachTab(activeWorkspace.id)
            ) : (
              <div className="rounded-xl border border-slate-200 bg-white p-8 text-center dark:border-[#1F2230] dark:bg-[#11131A]">
                <p className="text-sm font-medium">
                  Automated Email Drip & Guided TikTok DM Queue Module (Phase 4)
                </p>
              </div>
            ))}

          {activeTab === "contracts" &&
            (renderContractsTab ? (
              renderContractsTab(activeWorkspace.id)
            ) : (
              <div className="rounded-xl border border-slate-200 bg-white p-8 text-center dark:border-[#1F2230] dark:bg-[#11131A]">
                <p className="text-sm font-medium">
                  TikTok Contract Builder & Deliverable Review Module (Phase 5)
                </p>
              </div>
            ))}
        </main>
      </div>
    </div>
  );
}
