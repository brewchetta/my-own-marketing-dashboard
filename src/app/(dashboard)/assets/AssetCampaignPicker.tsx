"use client";

import { useState, useTransition } from "react";
import type { CampaignOption } from "@/lib/campaigns";
import { linkAssetToCampaign } from "./actions";
import CampaignSelect from "./CampaignSelect";

// Changes which campaign a saved image is attached to, as soon as a new one is picked.
export default function AssetCampaignPicker({
  assetId,
  campaignId,
  campaigns,
}: {
  assetId: string;
  campaignId: string | null;
  campaigns: CampaignOption[];
}) {
  const [value, setValue] = useState(campaignId ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function change(next: string) {
    const previous = value;
    setValue(next);
    setError(null);
    startTransition(async () => {
      const result = await linkAssetToCampaign(assetId, next);
      if (result.error) {
        setValue(previous);
        setError(result.error);
      }
    });
  }

  return (
    <div className="flex flex-col gap-1">
      <CampaignSelect
        campaigns={campaigns}
        value={value}
        onChange={(e) => change(e.target.value)}
        disabled={pending}
        aria-label="Campaign"
      />
      {error && (
        <p role="alert" className="text-xs text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
