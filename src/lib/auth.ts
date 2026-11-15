/*
Author: Domonick Mack
Date: 2026-11-15
Description: JWT session authentication, password hashing, and multi-brand workspace context helpers.
*/

import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";

export const SESSION_COOKIE_NAME = "tokreach_session";
export const WORKSPACE_COOKIE_NAME = "tokreach_workspace_id";

export interface SessionPayload {
  userId: string;
  email: string;
  fullName: string;
  activeWorkspaceId: string;
}

function getSecretKey(): Uint8Array {
  const secret = process.env.JWT_SECRET || "tokreach-super-secret-jwt-signing-key-change-in-production";
  return new TextEncoder().encode(secret);
}

/**
 * Hashes a plaintext password using bcrypt with 10 salt rounds.
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

/**
 * Verifies a plaintext password against a stored bcrypt hash.
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Signs a JWT session token valid for 7 days.
 */
export async function signSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecretKey());
}

/**
 * Verifies a JWT session token and returns the decoded SessionPayload or null.
 */
export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    if (
      typeof payload.userId === "string" &&
      typeof payload.email === "string" &&
      typeof payload.fullName === "string" &&
      typeof payload.activeWorkspaceId === "string"
    ) {
      return {
        userId: payload.userId,
        email: payload.email,
        fullName: payload.fullName,
        activeWorkspaceId: payload.activeWorkspaceId
      };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Reads the active session from HTTP cookies, or returns the default demo session
 * so brand teams can immediately explore the workspace.
 */
export async function getActiveSession(): Promise<SessionPayload> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    const workspaceCookie = cookieStore.get(WORKSPACE_COOKIE_NAME)?.value;

    if (token) {
      const verified = await verifySessionToken(token);
      if (verified) {
        return {
          ...verified,
          activeWorkspaceId: workspaceCookie || verified.activeWorkspaceId
        };
      }
    }

    return {
      userId: "user_founder_1",
      email: "domonick@glowbotanics.co",
      fullName: "Domonick Mack",
      activeWorkspaceId: workspaceCookie || "ws_glowbotanics"
    };
  } catch {
    return {
      userId: "user_founder_1",
      email: "domonick@glowbotanics.co",
      fullName: "Domonick Mack",
      activeWorkspaceId: "ws_glowbotanics"
    };
  }
}
