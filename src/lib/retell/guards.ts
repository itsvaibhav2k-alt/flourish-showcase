/**
 * Voice Call Guards
 *
 * Calling hours enforcement, budget checks, and scheduling helpers
 * for voice call safety and compliance.
 */

import { getMonthlyVoiceSpend } from './cost-tracker';

interface OrgVoiceSettings {
  voice_call_hours_start: number; // 0-23
  voice_call_hours_end: number; // 0-23
  voice_monthly_budget: number;
}

/**
 * Check if the current time is within the org's configured calling hours.
 * Uses the server's local time by default.
 */
export function isWithinCallingHours(org: OrgVoiceSettings): boolean {
  const now = new Date();
  const currentHour = now.getHours();

  const start = org.voice_call_hours_start ?? 9;
  const end = org.voice_call_hours_end ?? 20;

  // Handle same-day window (e.g., 9-20)
  if (start <= end) {
    return currentHour >= start && currentHour < end;
  }

  // Handle overnight window (e.g., 20-9) - unlikely but supported
  return currentHour >= start || currentHour < end;
}

/**
 * Check if the organization is within their monthly voice call budget
 */
export async function checkVoiceBudget(
  orgId: string,
  budget: number,
): Promise<{
  withinBudget: boolean;
  currentSpend: number;
  budget: number;
  remainingBudget: number;
}> {
  const { totalCost } = await getMonthlyVoiceSpend(orgId);

  return {
    withinBudget: totalCost < budget,
    currentSpend: totalCost,
    budget,
    remainingBudget: Math.max(0, budget - totalCost),
  };
}

/**
 * Calculate the next valid calling window start time.
 * If currently within calling hours, returns now.
 * Otherwise returns the start of the next calling window.
 */
export function scheduleForNextWindow(org: OrgVoiceSettings): Date {
  const now = new Date();
  const currentHour = now.getHours();

  const start = org.voice_call_hours_start ?? 9;
  const end = org.voice_call_hours_end ?? 20;

  // If within hours, return now
  if (start <= end) {
    if (currentHour >= start && currentHour < end) {
      return now;
    }
  } else {
    if (currentHour >= start || currentHour < end) {
      return now;
    }
  }

  // Schedule for next window start
  const nextWindow = new Date(now);
  nextWindow.setMinutes(0, 0, 0);

  if (currentHour >= end || (start <= end && currentHour < start)) {
    // Later today or tomorrow
    if (currentHour < start) {
      // Later today
      nextWindow.setHours(start);
    } else {
      // Tomorrow
      nextWindow.setDate(nextWindow.getDate() + 1);
      nextWindow.setHours(start);
    }
  } else {
    // Tomorrow
    nextWindow.setDate(nextWindow.getDate() + 1);
    nextWindow.setHours(start);
  }

  return nextWindow;
}
