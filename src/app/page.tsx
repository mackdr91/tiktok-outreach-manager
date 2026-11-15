/*
Author: Domonick Mack
Date: 2026-11-15
Description: Root application page hydrating the multi-brand SaaS shell with active session, workspaces, and KPIs.
*/

import { getActiveSession } from "@/lib/auth";
import {
  getWorkspaceById,
  getWorkspaceDashboardMetrics,
  listWorkspaces
} from "@/lib/store";
import { AppShell } from "@/components/shell/AppShell";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await getActiveSession();
  const workspaces = listWorkspaces();
  const activeWorkspace = getWorkspaceById(session.activeWorkspaceId);
  const metrics = getWorkspaceDashboardMetrics(activeWorkspace.id);

  return (
    <AppShell
      initialWorkspace={activeWorkspace}
      initialWorkspaces={workspaces}
      initialMetrics={metrics}
      userEmail={session.email}
      userFullName={session.fullName}
    />
  );
}
