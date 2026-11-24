import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import PageHeader from "@/components/PageHeader";
import {
  listEntriesBetween,
  monthGrid,
  monthLabel,
  monthParam,
  parseMonth,
  todayIso,
  type CalendarEntryWithCampaign,
} from "@/lib/calendar";
import type { CalendarChannel } from "@/lib/types";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const CHANNEL_STYLES: Record<CalendarChannel, string> = {
  email: "bg-blue-100 text-blue-900 hover:bg-blue-200",
  social: "bg-purple-100 text-purple-900 hover:bg-purple-200",
  sms: "bg-amber-100 text-amber-900 hover:bg-amber-200",
};

const CHANNEL_LABELS: Record<CalendarChannel, string> = {
  email: "Email",
  social: "Social",
  sms: "SMS",
};

export default function CalendarPage({ searchParams }: PageProps<"/calendar">) {
  return (
    <>
      <PageHeader title="Calendar" description="What's planned, scheduled, and sent, by day." />
      <Suspense fallback={<p className="text-sm text-gray-500">Loading calendar…</p>}>
        {searchParams.then(({ month }) => (
          <MonthView month={month} />
        ))}
      </Suspense>
    </>
  );
}

async function MonthView({ month: monthValue }: { month: string | string[] | undefined }) {
  await connection(); // "today" and the default month depend on the request time
  const { year, month } = parseMonth(monthValue);
  const { days, start, end } = monthGrid(year, month);
  const entries = await listEntriesBetween(start, end);
  const today = todayIso();

  const byDate = new Map<string, CalendarEntryWithCampaign[]>();
  for (const entry of entries) {
    byDate.set(entry.scheduled_date, [...(byDate.get(entry.scheduled_date) ?? []), entry]);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">{monthLabel(year, month)}</h2>
        <nav className="flex items-center gap-2 text-sm">
          <NavLink href={`/calendar?month=${monthParam(year, month - 1)}`}>← Previous</NavLink>
          <NavLink href="/calendar">Today</NavLink>
          <NavLink href={`/calendar?month=${monthParam(year, month + 1)}`}>Next →</NavLink>
        </nav>
      </div>

      <Legend />

      <div className="overflow-x-auto">
        <div className="grid min-w-[700px] grid-cols-7 border-l border-t border-gray-200 text-sm">
          {WEEKDAYS.map((d) => (
            <div
              key={d}
              className="border-b border-r border-gray-200 bg-gray-50 px-2 py-1 text-xs font-medium text-gray-500"
            >
              {d}
            </div>
          ))}
          {days.map(({ date, day, inMonth }) => (
            <div
              key={date}
              className={`flex min-h-28 flex-col gap-1 border-b border-r border-gray-200 p-1.5 ${
                inMonth ? "" : "bg-gray-50 text-gray-400"
              }`}
            >
              <span
                className={`self-start rounded-full px-1.5 text-xs ${
                  date === today ? "bg-gray-900 font-semibold text-white" : ""
                }`}
              >
                {day}
              </span>
              {(byDate.get(date) ?? []).map((entry) => (
                <EntryChip key={entry.id} entry={entry} />
              ))}
            </div>
          ))}
        </div>
      </div>

      {entries.length === 0 && (
        <p className="text-sm text-gray-500">
          Nothing on the calendar this month. Schedule a campaign from its page to add it here.
        </p>
      )}
    </div>
  );
}

// One entry in a day cell. Links to its campaign.
function EntryChip({ entry }: { entry: CalendarEntryWithCampaign }) {
  const name = entry.campaigns?.name ?? "Untitled campaign";
  const isDraft = entry.campaigns?.status === "draft" && entry.status === "scheduled";
  const statusLabel =
    entry.status === "cancelled"
      ? "Cancelled"
      : entry.status === "sent"
        ? "Sent"
        : isDraft
          ? "Planned (draft)"
          : "Scheduled";

  return (
    <Link
      href={`/campaigns/${entry.campaign_id}`}
      title={`${name} · ${CHANNEL_LABELS[entry.channel]} · ${statusLabel}`}
      className={`block truncate rounded px-1.5 py-0.5 text-xs ${CHANNEL_STYLES[entry.channel]} ${
        entry.status === "cancelled" ? "line-through opacity-50" : ""
      } ${isDraft ? "border border-dashed border-current" : ""}`}
    >
      {entry.status === "sent" && "✓ "}
      {name}
    </Link>
  );
}

function Legend() {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600">
      {(Object.keys(CHANNEL_LABELS) as CalendarChannel[]).map((channel) => (
        <li key={channel} className="flex items-center gap-1.5">
          <span className={`inline-block h-3 w-3 rounded ${CHANNEL_STYLES[channel]}`} />
          {CHANNEL_LABELS[channel]}
        </li>
      ))}
      <li>✓ Sent</li>
      <li className="flex items-center gap-1.5">
        <span className="inline-block h-3 w-3 rounded border border-dashed border-gray-500" />
        Planned, email not ready yet
      </li>
      <li className="line-through opacity-60">Cancelled</li>
    </ul>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="rounded border border-gray-300 px-3 py-1 hover:bg-gray-100">
      {children}
    </Link>
  );
}
