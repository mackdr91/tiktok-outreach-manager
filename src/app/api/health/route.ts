/*
Author: Domonick Mack
Date: 2026-11-15
Description: Healthcheck API route returning application uptime and environment readiness.
*/

import { NextResponse } from "next/server";

export interface HealthResponsePayload {
  status: "healthy";
  service: string;
  version: string;
  timestamp: string;
  uptimeSeconds: number;
}

/**
 * Builds a structured health payload for monitoring and container readiness probes.
 */
export function buildHealthPayload(): HealthResponsePayload {
  return {
    status: "healthy",
    service: "tokreach-web",
    version: "0.1.0",
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime())
  };
}

export async function GET(): Promise<NextResponse<HealthResponsePayload>> {
  return NextResponse.json(buildHealthPayload(), { status: 200 });
}
