import { Suspense } from "react";
import PageHeader from "@/components/PageHeader";
import Placeholder from "@/components/Placeholder";
import { listSnapshots } from "@/lib/analytics-snapshots";
import type { AnalyticsMetrics, AnalyticsSnapshot } from "@/lib/types";
import PullButton from "./PullButton";

export default function AnalyticsPage() {
  return (
    <>
      <PageHeader title="Analytics" description="How your website did, week by week.">
        <PullButton />
      </PageHeader>
      <Suspense fallback={<p className="text-sm text-gray-500">Loading analytics…</p>}>
        <AnalyticsView />
      </Suspense>
    </>
  );
}

async function AnalyticsView() {
  const snapshots = await listSnapshots();

  if (snapshots.length === 0) {
    return (
      <Placeholder>
        No analytics snapshots yet. Pull last week from Google Analytics to get started.
      </Placeholder>
    );
  }

  const [latest, previous] = snapshots;

  return (
    <div className="flex max-w-5xl flex-col gap-10">
      <Section
        title={`Last week: ${formatPeriod(latest.period)}`}
        note={previous ? `Compared with ${formatPeriod(previous.period)}.` : undefined}
      >
        <KpiGrid current={latest.metrics} previous={previous?.metrics} />
      </Section>

      <div className="grid gap-10 md:grid-cols-2">
        <Section title="Where visits came from">
          <TrafficSources metrics={latest.metrics} />
        </Section>
        <Section title="Most viewed pages">
          <TopPages metrics={latest.metrics} />
        </Section>
      </div>

      <Section title="Week by week">
        <History snapshots={snapshots} />
      </Section>

      <Section title="Insights">
        {/* TODO: plain-English insights from the Anthropic API, stored in `insights`. */}
        <Placeholder>No insights yet.</Placeholder>
      </Section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// KPIs

type Kpi = {
  label: string;
  explain: string;
  value: (m: AnalyticsMetrics) => number;
  format: (n: number) => string;
  // Rates change in percentage points; counts change in percent.
  kind: "count" | "rate";
};

const KPIS: Kpi[] = [
  {
    label: "Visits",
    explain: "Times someone came to your site.",
    value: (m) => m.sessions,
    format: formatNumber,
    kind: "count",
  },
  {
    label: "Visitors",
    explain: "Different people who visited.",
    value: (m) => m.totalUsers,
    format: formatNumber,
    kind: "count",
  },
  {
    label: "New visitors",
    explain: "People visiting for the first time.",
    value: (m) => m.newUsers,
    format: formatNumber,
    kind: "count",
  },
  {
    label: "Page views",
    explain: "Pages viewed across all visits.",
    value: (m) => m.screenPageViews,
    format: formatNumber,
    kind: "count",
  },
  {
    label: "Engaged visits",
    explain: "Share of visits where people stuck around or clicked.",
    value: (m) => m.engagementRate,
    format: formatPercent,
    kind: "rate",
  },
  {
    label: "Avg. visit length",
    explain: "How long a typical visit lasted.",
    value: (m) => m.averageSessionDuration,
    format: formatDuration,
    kind: "count",
  },
  {
    label: "Key actions",
    explain: "Sign-ups, purchases, and other goals you track.",
    value: (m) => m.keyEvents,
    format: formatNumber,
    kind: "count",
  },
];

function KpiGrid({ current, previous }: { current: AnalyticsMetrics; previous?: AnalyticsMetrics }) {
  return (
    <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {KPIS.map((kpi) => {
        const now = kpi.value(current);
        const before = previous ? kpi.value(previous) : undefined;
        return (
          <li key={kpi.label} className="flex flex-col gap-1 rounded border border-gray-200 p-4">
            <span className="text-sm text-gray-600">{kpi.label}</span>
            <span className="text-2xl font-semibold">{kpi.format(now)}</span>
            {before !== undefined && <Change now={now} before={before} kind={kpi.kind} />}
            <span className="text-xs text-gray-500">{kpi.explain}</span>
          </li>
        );
      })}
    </ul>
  );
}

function Change({ now, before, kind }: { now: number; before: number; kind: Kpi["kind"] }) {
  let text: string;
  let diff: number;
  if (kind === "rate") {
    diff = Math.round((now - before) * 100);
    text = `${Math.abs(diff)} pts`;
  } else {
    if (before === 0) return null;
    diff = Math.round(((now - before) / before) * 100);
    text = `${Math.abs(diff)}%`;
  }

  if (diff === 0) return <span className="text-xs text-gray-500">No change</span>;
  const up = diff > 0;
  return (
    <span className={`text-xs font-medium ${up ? "text-green-700" : "text-red-700"}`}>
      {up ? "▲ Up" : "▼ Down"} {text}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Breakdowns

function TrafficSources({ metrics }: { metrics: AnalyticsMetrics }) {
  const sources = metrics.trafficSources ?? [];
  if (sources.length === 0) return <Empty>No traffic source data.</Empty>;

  const total = sources.reduce((sum, s) => sum + s.sessions, 0) || 1;
  return (
    <ul className="flex flex-col gap-3">
      {sources.map((source) => {
        const share = source.sessions / total;
        return (
          <li key={source.channel} className="flex flex-col gap-1 text-sm">
            <div className="flex justify-between">
              <span>{source.channel}</span>
              <span className="text-gray-600">
                {formatNumber(source.sessions)} visits · {formatPercent(share)}
              </span>
            </div>
            <div className="h-2 rounded bg-gray-100">
              <div className="h-2 rounded bg-gray-700" style={{ width: `${share * 100}%` }} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function TopPages({ metrics }: { metrics: AnalyticsMetrics }) {
  const pages = metrics.topPages ?? [];
  if (pages.length === 0) return <Empty>No page data.</Empty>;

  return (
    <ol className="divide-y divide-gray-200 rounded border border-gray-200 text-sm">
      {pages.map((page) => (
        <li key={page.path} className="flex justify-between gap-4 px-4 py-2">
          <span className="truncate font-mono text-gray-800">{page.path}</span>
          <span className="shrink-0 text-gray-600">{formatNumber(page.views)} views</span>
        </li>
      ))}
    </ol>
  );
}

function History({ snapshots }: { snapshots: AnalyticsSnapshot[] }) {
  return (
    <div className="overflow-x-auto rounded border border-gray-200">
      <table className="w-full text-left text-sm">
        <thead className="bg-gray-50 text-gray-600">
          <tr>
            <th className="px-4 py-2 font-medium">Week</th>
            <th className="px-4 py-2 text-right font-medium">Visits</th>
            <th className="px-4 py-2 text-right font-medium">Visitors</th>
            <th className="px-4 py-2 text-right font-medium">Engaged</th>
            <th className="px-4 py-2 text-right font-medium">Key actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {snapshots.map((s) => (
            <tr key={s.id}>
              <td className="px-4 py-2">{formatPeriod(s.period)}</td>
              <td className="px-4 py-2 text-right">{formatNumber(s.metrics.sessions)}</td>
              <td className="px-4 py-2 text-right">{formatNumber(s.metrics.totalUsers)}</td>
              <td className="px-4 py-2 text-right">{formatPercent(s.metrics.engagementRate)}</td>
              <td className="px-4 py-2 text-right">{formatNumber(s.metrics.keyEvents)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Layout + formatting helpers

function Section({
  title,
  note,
  children,
}: {
  title: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">{title}</h2>
        {note && <p className="text-xs text-gray-500">{note}</p>}
      </div>
      {children}
    </section>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="text-sm italic text-gray-400">{children}</p>;
}

function formatNumber(n: number) {
  return new Intl.NumberFormat("en-US").format(Math.round(n));
}

function formatPercent(n: number) {
  return `${Math.round(n * 100)}%`;
}

function formatDuration(seconds: number) {
  const s = Math.round(seconds);
  const m = Math.floor(s / 60);
  return m > 0 ? `${m}m ${s % 60}s` : `${s}s`;
}

// "2026-11-16/2026-11-22" → "Nov 16 – Nov 22, 2026"
function formatPeriod(period: string) {
  const [start, end] = period.split("/");
  if (!start || !end) return period;
  const fmt = (d: string, opts: Intl.DateTimeFormatOptions) =>
    new Date(`${d}T00:00:00Z`).toLocaleDateString("en-US", { timeZone: "UTC", ...opts });
  return `${fmt(start, { month: "short", day: "numeric" })} – ${fmt(end, {
    month: "short",
    day: "numeric",
    year: "numeric",
  })}`;
}
