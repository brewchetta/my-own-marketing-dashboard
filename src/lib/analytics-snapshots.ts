import "server-only";
import { getSupabase } from "@/lib/supabase/server";
import type { AnalyticsMetrics, AnalyticsSnapshot } from "@/lib/types";

const PERIOD = /^(\d{4}-\d{2}-\d{2})\/(\d{4}-\d{2}-\d{2})$/;

// Accepts "YYYY-MM-DD/YYYY-MM-DD" where both are real dates and start <= end.
function isValidPeriod(period: string): boolean {
  const match = PERIOD.exec(period);
  if (!match) return false;
  const [, start, end] = match;
  const isRealDate = (d: string) => {
    const date = new Date(`${d}T00:00:00Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(d);
  };
  return isRealDate(start) && isRealDate(end) && start <= end;
}

// Saves one pull of analytics numbers. Call it with metrics already mapped
// into the AnalyticsMetrics shape (from the GA4 API later; seed data for now).
// pulled_at is set by the database. Throws if the period is malformed or the
// insert fails.
export async function createSnapshot(input: {
  period: string;
  metrics: AnalyticsMetrics;
}): Promise<AnalyticsSnapshot> {
  // TODO: check the logged-in user here once auth is implemented.
  if (!isValidPeriod(input.period)) {
    throw new Error(
      `Invalid snapshot period "${input.period}". Use "YYYY-MM-DD/YYYY-MM-DD" with the start on or before the end.`,
    );
  }

  const { data, error } = await getSupabase()
    .from("analytics_snapshots")
    .insert({ period: input.period, metrics: input.metrics })
    .select("*")
    .single();

  if (error) throw new Error(`Couldn't save analytics snapshot: ${error.message}`);
  return data;
}

// All snapshots, newest period first. Periods start with the start date, so
// sorting the text sorts by date.
export async function listSnapshots(): Promise<AnalyticsSnapshot[]> {
  const { data, error } = await getSupabase()
    .from("analytics_snapshots")
    .select("*")
    .order("period", { ascending: false })
    .order("pulled_at", { ascending: false });

  if (error) throw new Error(`Couldn't load analytics snapshots: ${error.message}`);
  return data;
}

export async function hasSnapshotForPeriod(period: string): Promise<boolean> {
  const { count, error } = await getSupabase()
    .from("analytics_snapshots")
    .select("id", { count: "exact", head: true })
    .eq("period", period);

  if (error) throw new Error(`Couldn't check analytics snapshots: ${error.message}`);
  return (count ?? 0) > 0;
}

// The most recent full Monday–Sunday week before `today`, as a snapshot period.
export function lastFullWeek(today = new Date()): { start: string; end: string; period: string } {
  const day = today.getUTCDay(); // 0 = Sunday
  const end = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  end.setUTCDate(end.getUTCDate() - (day === 0 ? 7 : day)); // back to last Sunday
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - 6);
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  return { start: iso(start), end: iso(end), period: `${iso(start)}/${iso(end)}` };
}
