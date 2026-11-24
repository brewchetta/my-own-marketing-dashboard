import "server-only";
import { JWT } from "google-auth-library";
import type { AnalyticsMetrics } from "@/lib/types";

// Pulls numbers from the Google Analytics 4 Data API using a service account.
// Needs GA4_PROPERTY_ID, GOOGLE_CLIENT_EMAIL and GOOGLE_PRIVATE_KEY in .env.local.

const SCOPE = "https://www.googleapis.com/auth/analytics.readonly";

const TOTAL_METRICS = [
  "sessions",
  "totalUsers",
  "newUsers",
  "screenPageViews",
  "engagementRate",
  "bounceRate",
  "averageSessionDuration",
  "keyEvents",
] as const;

type ReportRow = {
  dimensionValues?: { value: string }[];
  metricValues?: { value: string }[];
};
type BatchResponse = { reports?: { rows?: ReportRow[] }[] };

function config() {
  const propertyId = process.env.GA4_PROPERTY_ID;
  const email = process.env.GOOGLE_CLIENT_EMAIL;
  // .env files usually store the key on one line with literal "\n"s.
  const key = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!propertyId || !email || !key) return null;
  return { propertyId, email, key };
}

export function isGoogleAnalyticsConfigured(): boolean {
  return config() !== null;
}

// Fetches totals, traffic sources and top pages for a date range (YYYY-MM-DD,
// inclusive). Returns null when the property has no data for that range.
// Throws if credentials are missing or the API call fails.
export async function fetchGa4Metrics(
  startDate: string,
  endDate: string,
): Promise<AnalyticsMetrics | null> {
  const cfg = config();
  if (!cfg) {
    throw new Error(
      "Missing GA4_PROPERTY_ID, GOOGLE_CLIENT_EMAIL or GOOGLE_PRIVATE_KEY. Add them to .env.local.",
    );
  }

  const auth = new JWT({ email: cfg.email, key: cfg.key, scopes: [SCOPE] });
  const { token } = await auth.getAccessToken();
  if (!token) throw new Error("Couldn't get a Google access token for the service account.");

  const dateRanges = [{ startDate, endDate }];
  const res = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${cfg.propertyId}:batchRunReports`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify({
        requests: [
          { dateRanges, metrics: TOTAL_METRICS.map((name) => ({ name })) },
          {
            dateRanges,
            dimensions: [{ name: "sessionDefaultChannelGroup" }],
            metrics: [{ name: "sessions" }],
            orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
            limit: 10,
          },
          {
            dateRanges,
            dimensions: [{ name: "pagePath" }],
            metrics: [{ name: "screenPageViews" }],
            orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
            limit: 5,
          },
        ],
      }),
    },
  );

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Google Analytics API error ${res.status}: ${detail.slice(0, 500)}`);
  }

  const [totals, channels, pages] = ((await res.json()) as BatchResponse).reports ?? [];
  const totalRow = totals?.rows?.[0];
  if (!totalRow?.metricValues) return null;

  const values = Object.fromEntries(
    TOTAL_METRICS.map((name, i) => [name, Number(totalRow.metricValues?.[i]?.value ?? 0)]),
  ) as Record<(typeof TOTAL_METRICS)[number], number>;

  // A range with zero visits counts as "no data".
  if (values.sessions === 0) return null;

  return {
    ...values,
    trafficSources: (channels?.rows ?? []).map((row) => ({
      channel: row.dimensionValues?.[0]?.value ?? "(unknown)",
      sessions: Number(row.metricValues?.[0]?.value ?? 0),
    })),
    topPages: (pages?.rows ?? []).map((row) => ({
      path: row.dimensionValues?.[0]?.value ?? "(unknown)",
      views: Number(row.metricValues?.[0]?.value ?? 0),
    })),
  };
}
