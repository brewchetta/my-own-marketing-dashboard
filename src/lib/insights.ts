import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { getSupabase } from "@/lib/supabase/server";
import type { AnalyticsSnapshot } from "@/lib/types";

// Turns analytics snapshots into plain-English insights with Claude.
// Needs ANTHROPIC_API_KEY in .env.local.

const MODEL = "claude-sonnet-5-5";

// Metrics a snapshot is expected to have. Anything absent is reported as missing.
const EXPECTED_METRICS = [
  "sessions",
  "totalUsers",
  "newUsers",
  "screenPageViews",
  "engagementRate",
  "bounceRate",
  "averageSessionDuration",
  "keyEvents",
  "trafficSources",
  "topPages",
] as const;

const SYSTEM_PROMPT = `You explain website analytics to a solo marketer who runs one brand. They are busy and are not a data analyst, so write in plain, friendly English and keep it short.

Rules:
- Never make up numbers. Use only the figures in the data you are given. Do not estimate, extrapolate, or invent benchmarks or industry averages.
- Explain only the provided figures. Do not comment on metrics, channels, or pages that are not in the data.
- Acknowledge missing metrics explicitly. If a metric is listed as missing, or a value is null or absent, say so plainly instead of working around it.
- When you mention a change, quote the actual numbers (e.g. "visits fell from 6,230 to 4,980, down 20%").

Structure your answer as:
1. whatChanged: the most important changes from the previous period to the latest one, most important first (3 to 5 items).
2. hypothesis: your best guess at why these changes happened, based only on the data. Say it is a hypothesis, and point to the figures that support it.
3. considerations: one or two things the marketer should consider or look into next because of these results.
4. missingMetrics: the names of any expected metrics that are missing. Use an empty list if none are missing.

Data notes: rates (engagementRate, bounceRate) are fractions, so 0.58 means 58%. averageSessionDuration is in seconds. keyEvents counts goals the marketer tracks, such as sign-ups or purchases. Periods are ISO date ranges (start/end).`;

// Structured output: guarantees the response is JSON in this shape.
const INSIGHT_SCHEMA = {
  type: "object",
  properties: {
    whatChanged: {
      type: "array",
      items: {
        type: "object",
        properties: {
          metric: { type: "string", description: "Short plain-English name, e.g. 'Visits'." },
          detail: { type: "string", description: "One or two sentences quoting the numbers." },
        },
        required: ["metric", "detail"],
        additionalProperties: false,
      },
    },
    hypothesis: { type: "string" },
    considerations: { type: "array", items: { type: "string" } },
    missingMetrics: { type: "array", items: { type: "string" } },
  },
  required: ["whatChanged", "hypothesis", "considerations", "missingMetrics"],
  additionalProperties: false,
} as const;

// What gets stored (as JSON) in insights.summary.
export type InsightContent = {
  previousPeriod: string | null;
  whatChanged: { metric: string; detail: string }[];
  hypothesis: string;
  considerations: string[];
  missingMetrics: string[];
};

// An insights row joined with its snapshot's period, with summary parsed.
export type Insight = {
  id: string;
  snapshotId: string;
  period: string;
  createdAt: string | null;
  content: InsightContent;
};

function missingMetrics(snapshot: AnalyticsSnapshot): string[] {
  const metrics = (snapshot.metrics ?? {}) as Record<string, unknown>;
  return EXPECTED_METRICS.filter((key) => metrics[key] === undefined || metrics[key] === null);
}

// `snapshots` must be newest first. The first is explained against the second;
// up to six earlier weeks are included for context on the trend.
export async function generateInsight(snapshots: AnalyticsSnapshot[]): Promise<InsightContent> {
  const [latest, previous] = snapshots;
  if (!latest) throw new Error("No analytics snapshots to analyze.");

  const missing = {
    latest: missingMetrics(latest),
    previous: previous ? missingMetrics(previous) : [],
  };

  const data = {
    latest: { period: latest.period, metrics: latest.metrics },
    previous: previous ? { period: previous.period, metrics: previous.metrics } : null,
    earlierWeeks: snapshots.slice(2, 8).map((s) => ({ period: s.period, metrics: s.metrics })),
    expectedMetrics: EXPECTED_METRICS,
    missingMetrics: missing,
  };

  const prompt = previous
    ? "Explain what changed between the previous period and the latest period."
    : "There is no previous period to compare against. Say so, and describe the latest period on its own.";

  const client = new Anthropic(); // reads ANTHROPIC_API_KEY
  const response = await client.beta.messages.create({
    model: MODEL,
    max_tokens: 16000,
    // If Sonnet 5.5's safety checks decline, the API retries on a suitable model.
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: {
      effort: "medium",
      format: { type: "json_schema", schema: INSIGHT_SCHEMA },
    },
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `${prompt}\n\n<analytics_data>\n${JSON.stringify(data, null, 2)}\n</analytics_data>`,
      },
    ],
  });

  if (response.stop_reason === "refusal") {
    throw new Error(
      `Claude declined to analyze this data (${response.stop_details?.category ?? "no category"}).`,
    );
  }
  if (response.stop_reason === "max_tokens") {
    throw new Error("Claude's response was cut off before it finished.");
  }

  const text = response.content.find((block) => block.type === "text")?.text;
  if (!text) throw new Error("Claude returned no text.");

  const parsed = JSON.parse(text) as Omit<InsightContent, "previousPeriod">;
  return {
    previousPeriod: previous?.period ?? null,
    whatChanged: parsed.whatChanged,
    hypothesis: parsed.hypothesis,
    considerations: parsed.considerations.slice(0, 2),
    // Trust our own check over the model's if they differ.
    missingMetrics: Array.from(new Set([...missing.latest, ...parsed.missingMetrics])),
  };
}

// ---------------------------------------------------------------------------
// Database

type InsightRow = {
  id: string;
  snapshot_id: string;
  summary: string;
  created_at: string | null;
  analytics_snapshots: { period: string } | null;
};

// summary is JSON written by saveInsight. If it was edited by hand into plain
// text, show it as the hypothesis rather than failing.
function parseSummary(summary: string): InsightContent {
  try {
    const parsed = JSON.parse(summary) as Partial<InsightContent>;
    return {
      previousPeriod: parsed.previousPeriod ?? null,
      whatChanged: parsed.whatChanged ?? [],
      hypothesis: parsed.hypothesis ?? "",
      considerations: parsed.considerations ?? [],
      missingMetrics: parsed.missingMetrics ?? [],
    };
  } catch {
    return {
      previousPeriod: null,
      whatChanged: [],
      hypothesis: summary,
      considerations: [],
      missingMetrics: [],
    };
  }
}

function toInsight(row: InsightRow): Insight {
  return {
    id: row.id,
    snapshotId: row.snapshot_id,
    period: row.analytics_snapshots?.period ?? "",
    createdAt: row.created_at,
    content: parseSummary(row.summary),
  };
}

const INSIGHT_COLUMNS = "id, snapshot_id, summary, created_at, analytics_snapshots(period)";

export async function saveInsight(snapshotId: string, content: InsightContent): Promise<void> {
  const { error } = await getSupabase()
    .from("insights")
    .insert({ snapshot_id: snapshotId, summary: JSON.stringify(content) });

  if (error) throw new Error(`Couldn't save insight: ${error.message}`);
}

export async function hasInsightForSnapshot(snapshotId: string): Promise<boolean> {
  const { count, error } = await getSupabase()
    .from("insights")
    .select("id", { count: "exact", head: true })
    .eq("snapshot_id", snapshotId);

  if (error) throw new Error(`Couldn't check insights: ${error.message}`);
  return (count ?? 0) > 0;
}

// All insights, newest period first (newest insight first within a period).
export async function listInsights(): Promise<Insight[]> {
  const { data, error } = await getSupabase()
    .from("insights")
    .select(INSIGHT_COLUMNS)
    .order("created_at", { ascending: false })
    .overrideTypes<InsightRow[], { merge: false }>();

  if (error) throw new Error(`Couldn't load insights: ${error.message}`);
  return data.map(toInsight).sort((a, b) => b.period.localeCompare(a.period));
}
