"use server";

import { revalidatePath } from "next/cache";
import {
  createSnapshot,
  hasSnapshotForPeriod,
  lastFullWeek,
  listSnapshots,
} from "@/lib/analytics-snapshots";
import { generateInsight, hasInsightForSnapshot, saveInsight } from "@/lib/insights";
import { fetchGa4Metrics, isGoogleAnalyticsConfigured } from "@/lib/google-analytics";

export type PullState = {
  status?: "saved" | "exists" | "no-data" | "error";
  message?: string;
};

// Pulls last week's numbers from Google Analytics and saves them as a snapshot.
// Skips the API call if that week is already saved, and saves nothing if
// Google Analytics has no data for it.
export async function pullLatestAnalytics(): Promise<PullState> {
  // TODO: check the logged-in user here once auth is implemented.
  const { start, end, period } = lastFullWeek();

  if (!isGoogleAnalyticsConfigured()) {
    return {
      status: "error",
      message: "Google Analytics isn't connected yet. Add the GA4 settings to .env.local.",
    };
  }

  try {
    if (await hasSnapshotForPeriod(period)) {
      return { status: "exists", message: "Last week's numbers are already saved." };
    }

    const metrics = await fetchGa4Metrics(start, end);
    if (!metrics) {
      return {
        status: "no-data",
        message: "Google Analytics has no visits recorded for last week, so nothing was saved.",
      };
    }

    await createSnapshot({ period, metrics });
  } catch (error) {
    console.error("pullLatestAnalytics failed:", error);
    return {
      status: "error",
      message: "Couldn't pull from Google Analytics. Check the server logs for details.",
    };
  }

  revalidatePath("/analytics");
  return { status: "saved", message: "Saved last week's numbers from Google Analytics." };
}

export type InsightState = {
  error?: string;
};

// Generates and saves an insight for the latest snapshot, unless it already
// has one. The page re-renders and shows the saved insight.
export async function generateInsights(): Promise<InsightState> {
  // TODO: check the logged-in user here once auth is implemented.
  if (!process.env.ANTHROPIC_API_KEY) {
    return { error: "The Anthropic API isn't connected yet. Add ANTHROPIC_API_KEY to .env.local." };
  }

  try {
    const snapshots = await listSnapshots();
    const latest = snapshots[0];
    if (!latest) return { error: "There are no analytics snapshots to analyze yet." };

    if (!(await hasInsightForSnapshot(latest.id))) {
      const content = await generateInsight(snapshots);
      await saveInsight(latest.id, content);
    }
  } catch (error) {
    console.error("generateInsights failed:", error);
    return { error: "Couldn't generate insights. Check the server logs for details." };
  }

  revalidatePath("/analytics");
  return {};
}
