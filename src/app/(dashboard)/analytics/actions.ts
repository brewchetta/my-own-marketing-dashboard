"use server";

import { revalidatePath } from "next/cache";
import { createSnapshot, hasSnapshotForPeriod, lastFullWeek } from "@/lib/analytics-snapshots";
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
