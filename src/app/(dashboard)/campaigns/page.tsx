import { Suspense } from "react";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import Placeholder from "@/components/Placeholder";
import { groupByStatus, listCampaigns, type CampaignWithBrand } from "@/lib/campaigns";
import { formatDate } from "@/lib/format";

export default function CampaignsPage() {
  return (
    <>
      <PageHeader title="Campaigns" description="Email campaigns for your brand.">
        <Link
          href="/campaigns/new"
          className="rounded bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
        >
          New campaign
        </Link>
      </PageHeader>
      <Suspense fallback={<p className="text-sm text-gray-500">Loading campaigns…</p>}>
        <CampaignList />
      </Suspense>
    </>
  );
}

async function CampaignList() {
  const campaigns = await listCampaigns();

  if (campaigns.length === 0) {
    return <Placeholder>No campaigns yet. Create one to write your first email.</Placeholder>;
  }

  const { draft, scheduled, sent } = groupByStatus(campaigns);

  return (
    <div className="flex max-w-3xl flex-col gap-8">
      <Group title="Drafts" campaigns={draft} empty="No drafts." />
      <Group title="Scheduled" campaigns={scheduled} empty="Nothing scheduled." />
      <Group title="Sent" campaigns={sent} empty="Nothing sent yet." />
    </div>
  );
}

function Group({
  title,
  campaigns,
  empty,
}: {
  title: string;
  campaigns: CampaignWithBrand[];
  empty: string;
}) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
        {title} <span className="font-normal">({campaigns.length})</span>
      </h2>
      {campaigns.length === 0 ? (
        <p className="text-sm italic text-gray-400">{empty}</p>
      ) : (
        <ul className="divide-y divide-gray-200 rounded border border-gray-200">
          {campaigns.map((c) => (
            <li key={c.id}>
              <Link
                href={`/campaigns/${c.id}`}
                className="flex items-center justify-between gap-4 px-4 py-3 text-sm hover:bg-gray-50"
              >
                <div className="min-w-0">
                  <p className="font-medium">{c.name}</p>
                  <p className="truncate text-gray-500">
                    {c.subject ?? <span className="italic text-amber-700">Email not written yet</span>}
                  </p>
                </div>
                <div className="shrink-0 text-right text-gray-500">
                  <p>{c.brand_kits?.name ?? "No brand"}</p>
                  <p>{formatDate(c.scheduled_at) ?? "No date"}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
