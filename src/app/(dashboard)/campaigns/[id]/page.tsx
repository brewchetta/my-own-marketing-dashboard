import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import Placeholder from "@/components/Placeholder";
import { listEntriesForCampaign } from "@/lib/calendar";
import { dateOf } from "@/lib/campaign-schedule";
import { getCampaign } from "@/lib/campaigns";
import { formatDate } from "@/lib/format";
import type { CalendarEntry } from "@/lib/types";
import StatusBadge from "../StatusBadge";
import ScheduleControls from "./ScheduleControls";

export default function CampaignDetailPage({ params }: PageProps<"/campaigns/[id]">) {
  return (
    <>
      <Link href="/campaigns" className="mb-4 inline-block text-sm text-gray-600 hover:underline">
        ← All campaigns
      </Link>
      <Suspense fallback={<p className="text-sm text-gray-500">Loading campaign…</p>}>
        {params.then(({ id }) => (
          <CampaignDetail id={id} />
        ))}
      </Suspense>
    </>
  );
}

async function CampaignDetail({ id }: { id: string }) {
  const [campaign, entries] = await Promise.all([getCampaign(id), listEntriesForCampaign(id)]);
  if (!campaign) notFound();

  const hasEmail = Boolean(campaign.subject || campaign.body);

  return (
    <>
      <PageHeader title={campaign.name}>
        <div className="flex items-start gap-2">
          <Link
            href={`/campaigns/${campaign.id}/edit`}
            className="rounded border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-100"
          >
            {hasEmail ? "Edit" : "Write email"}
          </Link>
          <ScheduleControls
            campaignId={campaign.id}
            status={campaign.status}
            scheduledDate={campaign.scheduled_at ? dateOf(campaign.scheduled_at) : null}
            hasEmail={Boolean(campaign.subject && campaign.body)}
          />
        </div>
      </PageHeader>

      <div className="flex max-w-3xl flex-col gap-8">
        <dl className="flex flex-wrap gap-x-10 gap-y-3 text-sm">
          <Meta label="Status">
            <StatusBadge status={campaign.status} />
          </Meta>
          <Meta label="Send date">{formatDate(campaign.scheduled_at) ?? "Not set"}</Meta>
          <Meta label="Brand">
            {campaign.brand_kit_id && campaign.brand_kits ? (
              <Link href={`/brand-kit/${campaign.brand_kit_id}`} className="hover:underline">
                {campaign.brand_kits.name}
              </Link>
            ) : (
              "None"
            )}
          </Meta>
        </dl>

        <Section title="Brief">
          {campaign.brief ? (
            <p className="whitespace-pre-line text-sm text-gray-800">{campaign.brief}</p>
          ) : (
            <Empty>No brief.</Empty>
          )}
        </Section>

        <Section title="Email">
          {hasEmail ? (
            <div className="rounded border border-gray-200">
              <p className="border-b border-gray-200 px-4 py-3 text-sm">
                <span className="text-gray-500">Subject: </span>
                <span className="font-medium">{campaign.subject ?? "(none)"}</span>
              </p>
              <p className="whitespace-pre-line px-4 py-4 text-sm text-gray-800">
                {campaign.body ?? "(no body)"}
              </p>
            </div>
          ) : (
            <Placeholder>
              The email hasn&apos;t been written yet.{" "}
              <Link
                href={`/campaigns/${campaign.id}/edit`}
                className="font-medium text-gray-900 underline"
              >
                Write it with Claude
              </Link>
            </Placeholder>
          )}
        </Section>

        <Section title="On the calendar">
          <CalendarEntries entries={entries} />
        </Section>
      </div>
    </>
  );
}

const CHANNEL_LABELS = { email: "Email", social: "Social", sms: "SMS" } as const;
const ENTRY_STATUS_LABELS = { scheduled: "Scheduled", sent: "Sent", cancelled: "Cancelled" } as const;

function CalendarEntries({ entries }: { entries: CalendarEntry[] }) {
  if (entries.length === 0) {
    return <Empty>Not on the calendar. Schedule the campaign to add its email.</Empty>;
  }
  return (
    <ul className="divide-y divide-gray-200 rounded border border-gray-200">
      {entries.map((entry) => (
        <li key={entry.id}>
          <Link
            href={`/calendar?month=${entry.scheduled_date.slice(0, 7)}`}
            className={`flex items-center justify-between gap-4 px-4 py-2 text-sm hover:bg-gray-50 ${
              entry.status === "cancelled" ? "text-gray-400 line-through" : ""
            }`}
          >
            <span>
              {formatDate(entry.scheduled_date)} · {CHANNEL_LABELS[entry.channel]}
            </span>
            <span className="text-gray-500">{ENTRY_STATUS_LABELS[entry.status]}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function Meta({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-xs uppercase tracking-wide text-gray-500">{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">{title}</h2>
      {children}
    </section>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="text-sm italic text-gray-400">{children}</p>;
}
