import { Suspense } from "react";
import PageHeader from "@/components/PageHeader";
import Placeholder from "@/components/Placeholder";
import { listAssets } from "@/lib/assets";
import { listCampaignOptions } from "@/lib/campaigns";
import { formatDate } from "@/lib/format";
import AssetCampaignPicker from "./AssetCampaignPicker";
import ImageGenerator from "./ImageGenerator";

export default function AssetsPage({ searchParams }: PageProps<"/assets">) {
  return (
    <>
      <PageHeader title="Assets" description="Imagery generated for your campaigns." />
      <div className="flex flex-col gap-10">
        <Suspense fallback={<p className="text-sm text-gray-500">Loading…</p>}>
          {searchParams.then(({ campaign }) => (
            <Generator campaignParam={typeof campaign === "string" ? campaign : undefined} />
          ))}
        </Suspense>
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
            Saved images
          </h2>
          <Suspense fallback={<p className="text-sm text-gray-500">Loading saved images…</p>}>
            <SavedAssets />
          </Suspense>
        </section>
      </div>
    </>
  );
}

async function Generator({ campaignParam }: { campaignParam?: string }) {
  const campaigns = await listCampaignOptions();
  // Only pre-select ids that are real campaigns.
  const defaultCampaignId = campaigns.some((c) => c.id === campaignParam)
    ? campaignParam
    : undefined;
  return <ImageGenerator campaigns={campaigns} defaultCampaignId={defaultCampaignId} />;
}

async function SavedAssets() {
  const [assets, campaigns] = await Promise.all([listAssets(), listCampaignOptions()]);

  if (assets.length === 0) {
    return <Placeholder>No saved images yet. Generate one above and save it.</Placeholder>;
  }

  return (
    <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {assets.map((asset) => (
        <li key={asset.id} className="flex flex-col gap-2">
          <a href={asset.image_url} target="_blank" rel="noreferrer">
            {/* eslint-disable-next-line @next/next/no-img-element -- Supabase Storage URL; no next/image remote config yet */}
            <img
              src={asset.image_url}
              alt={asset.prompt}
              loading="lazy"
              className="aspect-square w-full rounded border border-gray-200 object-cover"
            />
          </a>
          <p className="line-clamp-2 text-sm text-gray-700" title={asset.prompt}>
            {asset.prompt}
          </p>
          <p className="text-xs text-gray-500">{formatDate(asset.created_at)}</p>
          <AssetCampaignPicker
            assetId={asset.id}
            campaignId={asset.campaign_id}
            campaigns={campaigns}
          />
        </li>
      ))}
    </ul>
  );
}
