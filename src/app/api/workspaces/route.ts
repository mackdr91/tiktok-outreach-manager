/*
Author: Domonick Mack
Date: 2026-11-15
Description: API endpoint for managing multi-brand workspaces, team invites, and executive dashboard KPIs.
*/

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getActiveSession } from "@/lib/auth";
import {
  createWorkspace,
  getWorkspaceById,
  getWorkspaceDashboardMetrics,
  inviteWorkspaceMember,
  listWorkspaces
} from "@/lib/store";

const WorkspacePostSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("create_workspace"),
    name: z.string().min(2),
    brandWebsite: z.string().optional().default(""),
    productCategory: z.string().min(2),
    defaultSenderName: z.string().min(2),
    defaultSenderEmail: z.string().email()
  }),
  z.object({
    action: z.literal("invite_member"),
    workspaceId: z.string().min(1),
    inviteEmail: z.string().email(),
    fullName: z.string().min(1),
    role: z.enum(["ADMIN", "MEMBER"]).default("MEMBER")
  })
]);

export async function GET(request: NextRequest): Promise<NextResponse> {
  const session = await getActiveSession();
  const requestedId = request.nextUrl.searchParams.get("workspaceId") || session.activeWorkspaceId;
  const activeWorkspace = getWorkspaceById(requestedId);
  const metrics = getWorkspaceDashboardMetrics(activeWorkspace.id);

  return NextResponse.json({
    activeWorkspace,
    workspaces: listWorkspaces(),
    metrics
  });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const rawBody = await request.json();
    const parsed = WorkspacePostSchema.safeParse(rawBody);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid workspace request payload.", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const session = await getActiveSession();
    const data = parsed.data;

    if (data.action === "create_workspace") {
      const created = createWorkspace({
        name: data.name,
        brandWebsite: data.brandWebsite,
        productCategory: data.productCategory,
        defaultSenderName: data.defaultSenderName,
        defaultSenderEmail: data.defaultSenderEmail,
        ownerEmail: session.email,
        ownerName: session.fullName
      });

      return NextResponse.json(
        {
          workspace: created,
          workspaces: listWorkspaces(),
          metrics: getWorkspaceDashboardMetrics(created.id)
        },
        { status: 201 }
      );
    }

    const invitedMember = inviteWorkspaceMember({
      workspaceId: data.workspaceId,
      inviteEmail: data.inviteEmail,
      fullName: data.fullName,
      role: data.role
    });

    return NextResponse.json(
      {
        member: invitedMember,
        activeWorkspace: getWorkspaceById(data.workspaceId)
      },
      { status: 201 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Workspace operation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
