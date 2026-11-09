import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import { getBrandKit } from "@/lib/brand-kits";
import BrandKitForm from "../../BrandKitForm";
import { updateBrandKit } from "../../actions";

export default function EditBrandKitPage({ params }: PageProps<"/brand-kit/[id]/edit">) {
  return (
    <Suspense fallback={<p className="text-sm text-gray-500">Loading brand kit…</p>}>
      {params.then(({ id }) => (
        <EditBrandKit id={id} />
      ))}
    </Suspense>
  );
}

async function EditBrandKit({ id }: { id: string }) {
  const kit = await getBrandKit(id);
  if (!kit) notFound();

  return (
    <>
      <Link
        href={`/brand-kit/${id}`}
        className="mb-4 inline-block text-sm text-gray-600 hover:underline"
      >
        ← Back to {kit.name}
      </Link>
      <PageHeader title={`Edit ${kit.name}`} />
      <BrandKitForm
        action={updateBrandKit.bind(null, id)}
        kit={kit}
        submitLabel="Save changes"
        cancelHref={`/brand-kit/${id}`}
      />
    </>
  );
}
