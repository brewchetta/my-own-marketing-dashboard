import { Suspense } from "react";
import PageHeader from "@/components/PageHeader";
import Placeholder from "@/components/Placeholder";

// With cacheComponents enabled, reading `params` must happen inside <Suspense>.
async function CampaignId({ params }: { params: PageProps<"/campaigns/[id]">["params"] }) {
  const { id } = await params;
  return <span>Campaign {id}</span>;
}

export default function CampaignDetailPage({ params }: PageProps<"/campaigns/[id]">) {
  return (
    <>
      <PageHeader title="Campaign">
        <Suspense fallback={null}>
          <p className="text-sm text-gray-600">
            <CampaignId params={params} />
          </p>
        </Suspense>
      </PageHeader>
      <Placeholder>The subject, body, assets, and schedule will go here.</Placeholder>
    </>
  );
}
