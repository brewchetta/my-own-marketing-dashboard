import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import Placeholder from "@/components/Placeholder";

export default function CampaignsPage() {
  return (
    <>
      <PageHeader title="Campaigns" description="Email campaigns for your brand.">
        <Link
          href="/campaigns/new"
          className="rounded bg-gray-900 px-3 py-2 text-sm text-white hover:bg-gray-700"
        >
          New campaign
        </Link>
      </PageHeader>
      <Placeholder>No campaigns yet.</Placeholder>
    </>
  );
}
