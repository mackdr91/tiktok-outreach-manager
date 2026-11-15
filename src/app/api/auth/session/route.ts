/*
Author: Domonick Mack
Date: 2026-11-15
Description: Authentication and workspace switching API endpoint with JWT session cookies.
*/

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  getActiveSession,
  SESSION_COOKIE_NAME,
  signSessionToken,
  WORKSPACE_COOKIE_NAME
} from "@/lib/auth";
import { getWorkspaceById, listWorkspaces } from "@/lib/store";

const AuthActionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("switch_workspace"),
    workspaceId: z.string().min(1)
  }),
  z.object({
    action: z.literal("login"),
    email: z.string().email(),
    fullName: z.string().min(1).optional(),
    workspaceId: z.string().optional()
  })
]);

export async function GET(): Promise<NextResponse> {
  const session = await getActiveSession();
  const workspaces = listWorkspaces();
  const activeWorkspace = getWorkspaceById(session.activeWorkspaceId);

  return NextResponse.json({
    session: {
      ...session,
      activeWorkspaceId: activeWorkspace.id
    },
    activeWorkspace,
    workspaces
  });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const rawBody = await request.json();
    const parsed = AuthActionSchema.safeParse(rawBody);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid authentication request payload.", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const currentSession = await getActiveSession();
    const data = parsed.data;

    if (data.action === "switch_workspace") {
      const targetWorkspace = getWorkspaceById(data.workspaceId);
      const updatedSession = {
        ...currentSession,
        activeWorkspaceId: targetWorkspace.id
      };
      const token = await signSessionToken(updatedSession);
      const response = NextResponse.json({
        session: updatedSession,
        activeWorkspace: targetWorkspace
      });

      response.cookies.set(SESSION_COOKIE_NAME, token, {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7
      });
      response.cookies.set(WORKSPACE_COOKIE_NAME, targetWorkspace.id, {
        httpOnly: false,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 30
      });

      return response;
    }

    const targetWorkspace = getWorkspaceById(
      data.workspaceId || currentSession.activeWorkspaceId
    );
    const updatedSession = {
      userId: `user_${data.email.replace(/[^a-z0-9]/gi, "_").toLowerCase()}`,
      email: data.email.toLowerCase(),
      fullName: data.fullName?.trim() || data.email.split("@")[0],
      activeWorkspaceId: targetWorkspace.id
    };

    const token = await signSessionToken(updatedSession);
    const response = NextResponse.json({
      session: updatedSession,
      activeWorkspace: targetWorkspace
    });

    response.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7
    });

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Authentication error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
