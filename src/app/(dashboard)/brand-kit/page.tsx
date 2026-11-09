import { Suspense } from "react";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import Placeholder from "@/components/Placeholder";
import { listBrandKits } from "@/lib/brand-kits";

export default function BrandKitPage() {
  return (
    <>
      <PageHeader title="Brand Kit" description="Voice, palette, and do's and don'ts.">
        <Link
          href="/brand-kit/new"
          className="rounded bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
        >
          New brand kit
        </Link>
      </PageHeader>
      <Suspense fallback={<p className="text-sm text-gray-500">Loading brand kits…</p>}>
        <BrandKitList />
      </Suspense>
    </>
  );
}

async function BrandKitList() {
  const kits = await listBrandKits();

  if (kits.length === 0) {
    return <Placeholder>No brand kit yet. Create one to get started.</Placeholder>;
  }

  return (
    <ul className="max-w-2xl divide-y divide-gray-200 rounded border border-gray-200">
      {kits.map((kit) => (
        <li key={kit.id}>
          <Link
            href={`/brand-kit/${kit.id}`}
            className="flex items-center justify-between px-4 py-3 text-sm hover:bg-gray-50"
          >
            <span className="font-medium">{kit.name}</span>
            <span className="text-gray-400">View →</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
