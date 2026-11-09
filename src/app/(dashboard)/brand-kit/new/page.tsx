import PageHeader from "@/components/PageHeader";
import BrandKitForm from "../BrandKitForm";
import { createBrandKit } from "../actions";

export default function NewBrandKitPage() {
  return (
    <>
      <PageHeader
        title="New brand kit"
        description="Set your brand's name, voice, and colors once. The writing and image tools reuse them."
      />
      <BrandKitForm action={createBrandKit} />
    </>
  );
}
