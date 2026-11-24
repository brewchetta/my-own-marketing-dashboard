import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import { listBrandKits } from "@/lib/brand-kits";
import { getCampaign } from "@/lib/campaigns";
import CampaignForm from "../../CampaignForm";
import { updateCampaign } from "../../actions";

export default function EditCampaignPage({ params }: PageProps<"/campaigns/[id]/edit">) {
  return (
    <Suspense fallback={<p className="text-sm text-gray-500">Loading campaign…</p>}>
      {params.then(({ id }) => (
        <EditCampaign id={id} />
      ))}
    </Suspense>
  );
}

async function EditCampaign({ id }: { id: string }) {
  const [campaign, brandKits] = await Promise.all([getCampaign(id), listBrandKits()]);
  if (!campaign) notFound();

  return (
    <>
      <Link
        href={`/campaigns/${id}`}
        className="mb-4 inline-block text-sm text-gray-600 hover:underline"
      >
        ← Back to {campaign.name}
      </Link>
      <PageHeader title={`Edit ${campaign.name}`} />
      <CampaignForm
        action={updateCampaign.bind(null, id)}
        brandKits={brandKits}
        campaign={campaign}
        submitLabel="Save changes"
        cancelHref={`/campaigns/${id}`}
      />
    </>
  );
}
