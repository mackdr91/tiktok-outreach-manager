/*
Author: Domonick Mack
Date: 2026-11-15
Description: Core utility functions for class merging, TikTok handle normalization, and engagement metrics.
*/

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges conditional Tailwind CSS classes cleanly without style conflicts.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Normalizes a TikTok handle to lowercase without a leading '@' symbol,
 * or returns a formatted '@handle' when prefix is requested.
 */
export function normalizeTikTokHandle(rawHandle: string, includeAtPrefix = false): string {
  const cleaned = rawHandle
    .trim()
    .replace(/^https?:\/\/(www\.)?tiktok\.com\/@/i, "")
    .replace(/\?.*$/, "")
    .replace(/\/.*$/, "")
    .replace(/^@+/, "")
    .toLowerCase();

  if (!cleaned) {
    return "";
  }

  return includeAtPrefix ? `@${cleaned}` : cleaned;
}

/**
 * Builds a canonical TikTok profile URL from a handle.
 */
export function buildTikTokProfileUrl(handle: string): string {
  const normalized = normalizeTikTokHandle(handle, false);
  if (!normalized) {
    return "https://www.tiktok.com";
  }
  return `https://www.tiktok.com/@${normalized}`;
}

/**
 * Computes TikTok engagement rate as ((Likes + Comments + Shares) / Views) * 100,
 * rounded to two decimal places.
 */
export function calculateEngagementRate(params: {
  likes: number;
  comments: number;
  shares: number;
  views: number;
}): number {
  const { likes, comments, shares, views } = params;
  if (views <= 0) {
    return 0;
  }
  const totalInteractions = Math.max(0, likes) + Math.max(0, comments) + Math.max(0, shares);
  const rawRate = (totalInteractions / views) * 100;
  return Number(rawRate.toFixed(2));
}

/**
 * Estimates a fair flat deliverable rate (USD) for a TikTok micro-influencer
 * based on average views and engagement rate multiplier.
 */
export function estimateCreatorRateUsd(params: {
  followerCount: number;
  avgViews: number;
  engagementRate: number;
}): number {
  const { followerCount, avgViews, engagementRate } = params;
  const baseCpv = 0.025; // $25 CPM baseline for TikTok micro-creators
  const engagementMultiplier =
    engagementRate >= 8 ? 1.35 : engagementRate >= 5 ? 1.15 : engagementRate >= 3 ? 1.0 : 0.85;

  const viewBasedEstimate = avgViews * baseCpv * engagementMultiplier;
  const followerFloor = Math.min(250, Math.max(50, followerCount * 0.004));
  const combined = Math.max(followerFloor, viewBasedEstimate);

  return Math.round(combined / 5) * 5;
}

/**
 * Formats a number in compact social notation (e.g., 24.5K, 1.2M).
 */
export function formatCompactNumber(value: number): string {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1
  }).format(value);
}

/**
 * Formats a numeric USD amount as currency.
 */
export function formatCurrencyUsd(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(amount);
}
