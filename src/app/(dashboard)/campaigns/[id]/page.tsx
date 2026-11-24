import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import Placeholder from "@/components/Placeholder";
import { getCampaign } from "@/lib/campaigns";
import { formatDate } from "@/lib/format";
import StatusBadge from "../StatusBadge";

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
  const campaign = await getCampaign(id);
  if (!campaign) notFound();

  const hasEmail = Boolean(campaign.subject || campaign.body);

  return (
    <>
      <PageHeader title={campaign.name}>
        <Link
          href={`/campaigns/${campaign.id}/edit`}
          className="rounded border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-100"
        >
          {hasEmail ? "Edit" : "Write email"}
        </Link>
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
      </div>
    </>
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
