import "server-only";
import { getSupabase } from "@/lib/supabase/server";
import type { CalendarEntry, CampaignStatus } from "@/lib/types";

// A calendar entry with the name and status of its campaign.
export type CalendarEntryWithCampaign = CalendarEntry & {
  campaigns: { name: string; status: CampaignStatus } | null;
};

const COLUMNS = "*, campaigns(name, status)";

// Entries from `start` to `end` inclusive (both "YYYY-MM-DD").
export async function listEntriesBetween(
  start: string,
  end: string,
): Promise<CalendarEntryWithCampaign[]> {
  const { data, error } = await getSupabase()
    .from("calendar_entries")
    .select(COLUMNS)
    .gte("scheduled_date", start)
    .lte("scheduled_date", end)
    .order("scheduled_date")
    .order("channel")
    .overrideTypes<CalendarEntryWithCampaign[], { merge: false }>();

  if (error) throw new Error(`Couldn't load the calendar: ${error.message}`);
  return data;
}

export async function listEntriesForCampaign(campaignId: string): Promise<CalendarEntry[]> {
  const { data, error } = await getSupabase()
    .from("calendar_entries")
    .select("*")
    .eq("campaign_id", campaignId)
    .order("scheduled_date")
    .order("channel");

  if (error) throw new Error(`Couldn't load calendar entries: ${error.message}`);
  return data;
}

// ---------------------------------------------------------------------------
// Month grid. All dates are "YYYY-MM-DD" strings and the math is done in UTC,
// so the server and browser always agree on which day an entry falls on.

const MONTH = /^(\d{4})-(0[1-9]|1[0-2])$/;

const iso = (d: Date) => d.toISOString().slice(0, 10);
const utc = (y: number, m: number, d: number) => new Date(Date.UTC(y, m, d));

export function todayIso() {
  return iso(new Date());
}

// "2026-11" → { year: 2026, month: 10 } (month is 0-based). Falls back to the
// current month when the value is missing or malformed.
export function parseMonth(value: string | string[] | undefined) {
  const match = typeof value === "string" ? MONTH.exec(value) : null;
  if (match) return { year: Number(match[1]), month: Number(match[2]) - 1 };
  const now = new Date();
  return { year: now.getUTCFullYear(), month: now.getUTCMonth() };
}

export function monthParam(year: number, month: number) {
  return iso(utc(year, month, 1)).slice(0, 7);
}

export function monthLabel(year: number, month: number) {
  return utc(year, month, 1).toLocaleDateString("en-US", {
    timeZone: "UTC",
    month: "long",
    year: "numeric",
  });
}

// Every day shown in the month view: whole weeks (Sunday to Saturday) that
// cover the month, including the trailing/leading days of nearby months.
export function monthGrid(year: number, month: number) {
  const first = utc(year, month, 1);
  const last = utc(year, month + 1, 0);
  const start = utc(year, month, 1 - first.getUTCDay());
  const end = utc(year, month + 1, 0 + (6 - last.getUTCDay()));

  const days: { date: string; day: number; inMonth: boolean }[] = [];
  for (let d = start; d <= end; d = utc(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1)) {
    days.push({ date: iso(d), day: d.getUTCDate(), inMonth: d.getUTCMonth() === month });
  }
  return { days, start: days[0].date, end: days[days.length - 1].date };
}
