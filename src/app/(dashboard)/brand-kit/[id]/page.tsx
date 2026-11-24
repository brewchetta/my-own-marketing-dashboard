import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import Placeholder from "@/components/Placeholder";
import { brandKitToText, getBrandKit, lines } from "@/lib/brand-kits";
import { listCampaignsForBrandKit } from "@/lib/campaigns";
import { formatDate } from "@/lib/format";
import StatusBadge from "../../campaigns/StatusBadge";
import CopyBrandKit from "./CopyBrandKit";

export default function BrandKitDetailPage({ params }: PageProps<"/brand-kit/[id]">) {
  return (
    <>
      <Link href="/brand-kit" className="mb-4 inline-block text-sm text-gray-600 hover:underline">
        ← All brand kits
      </Link>
      <Suspense fallback={<p className="text-sm text-gray-500">Loading brand kit…</p>}>
        {params.then(({ id }) => (
          <BrandKitDetail id={id} />
        ))}
      </Suspense>
    </>
  );
}

async function BrandKitDetail({ id }: { id: string }) {
  const kit = await getBrandKit(id);
  if (!kit) notFound();

  const palette = kit.palette ?? [];
  const dos = lines(kit.dos);
  const donts = lines(kit.donts);

  return (
    <>
      <PageHeader title={kit.name}>
        <Link
          href={`/brand-kit/${kit.id}/edit`}
          className="rounded border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-100"
        >
          Edit
        </Link>
      </PageHeader>

      <div className="flex max-w-3xl flex-col gap-8">
        <Section title="Voice">
          {kit.voice ? (
            <p className="whitespace-pre-line text-sm text-gray-800">{kit.voice}</p>
          ) : (
            <Empty>No voice set.</Empty>
          )}
        </Section>

        <Section title="Palette">
          {palette.length > 0 ? (
            <ul className="flex flex-wrap gap-4">
              {palette.map((color, i) => (
                <li key={i} className="flex w-28 flex-col gap-1">
                  <div
                    className="h-16 rounded border border-gray-200"
                    style={{ backgroundColor: color.hex }}
                  />
                  <span className="text-sm font-medium">{color.name || "Unnamed"}</span>
                  <span className="font-mono text-xs text-gray-500">{color.hex}</span>
                </li>
              ))}
            </ul>
          ) : (
            <Empty>No colors set.</Empty>
          )}
        </Section>

        <div className="grid gap-8 sm:grid-cols-2">
          <Section title="Do's">
            <List items={dos} empty="No do's set." />
          </Section>
          <Section title="Don'ts">
            <List items={donts} empty="No don'ts set." />
          </Section>
        </div>

        <Section title="Campaigns">
          <Suspense fallback={<p className="text-sm text-gray-500">Loading campaigns…</p>}>
            <BrandCampaigns brandKitId={kit.id} brandName={kit.name} />
          </Suspense>
        </Section>

        <CopyBrandKit text={brandKitToText(kit)} />
      </div>
    </>
  );
}

async function BrandCampaigns({ brandKitId, brandName }: { brandKitId: string; brandName: string }) {
  const campaigns = await listCampaignsForBrandKit(brandKitId);

  if (campaigns.length === 0) {
    return (
      <Placeholder>
        No campaigns for {brandName} yet.{" "}
        <Link href="/campaigns/new" className="font-medium text-gray-900 underline">
          Create one
        </Link>
      </Placeholder>
    );
  }

  return (
    <ul className="divide-y divide-gray-200 rounded border border-gray-200">
      {campaigns.map((c) => (
        <li key={c.id}>
          <Link
            href={`/campaigns/${c.id}`}
            className="flex items-center justify-between gap-4 px-4 py-2 text-sm hover:bg-gray-50"
          >
            <span className="font-medium">{c.name}</span>
            <span className="flex items-center gap-3 text-gray-500">
              {formatDate(c.scheduled_at)}
              <StatusBadge status={c.status} />
            </span>
          </Link>
        </li>
      ))}
    </ul>
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

function List({ items, empty }: { items: string[]; empty: string }) {
  if (items.length === 0) return <Empty>{empty}</Empty>;
  return (
    <ul className="list-disc space-y-1 pl-5 text-sm text-gray-800">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="text-sm italic text-gray-400">{children}</p>;
}
