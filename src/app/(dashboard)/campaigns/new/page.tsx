import { Suspense } from "react";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import Placeholder from "@/components/Placeholder";
import { listBrandKits } from "@/lib/brand-kits";
import CampaignForm from "../CampaignForm";
import { createCampaign } from "../actions";

export default function NewCampaignPage() {
  return (
    <>
      <PageHeader
        title="New campaign"
        description="Write a brief, and Claude drafts the email in your brand's voice. Edit anything before you save."
      />
      <Suspense fallback={<p className="text-sm text-gray-500">Loading…</p>}>
        <NewCampaign />
      </Suspense>
    </>
  );
}

async function NewCampaign() {
  const brandKits = await listBrandKits();

  if (brandKits.length === 0) {
    return (
      <Placeholder>
        Campaigns are written in your brand&apos;s voice, so you need a brand kit first.{" "}
        <Link href="/brand-kit/new" className="font-medium text-gray-900 underline">
          Create a brand kit
        </Link>
      </Placeholder>
    );
  }

  return <CampaignForm action={createCampaign} brandKits={brandKits} />;
}
