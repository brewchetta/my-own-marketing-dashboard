import "server-only";
import { getSupabase } from "@/lib/supabase/server";
import type { Asset } from "@/lib/types";

// An asset with its campaign's name, for the assets page.
export type AssetWithCampaign = Asset & { campaigns: { name: string } | null };

// Saved campaign images. The file goes in the "marketing-assets" storage
// bucket (public), and a row in `assets` records its URL and prompt.

const BUCKET = "marketing-assets";

const EXTENSIONS: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

export const SAVEABLE_IMAGE_TYPES = Object.keys(EXTENSIONS);

export async function saveAsset(input: {
  prompt: string;
  mimeType: string;
  bytes: Buffer;
  campaignId?: string | null;
}): Promise<Asset> {
  const extension = EXTENSIONS[input.mimeType];
  if (!extension) throw new Error(`Unsupported image type: ${input.mimeType}`);

  const supabase = getSupabase();
  const path = `${crypto.randomUUID()}.${extension}`;

  const upload = await supabase.storage
    .from(BUCKET)
    .upload(path, input.bytes, { contentType: input.mimeType });
  if (upload.error) throw new Error(`Couldn't upload image: ${upload.error.message}`);

  const imageUrl = supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;

  const { data, error } = await supabase
    .from("assets")
    .insert({ prompt: input.prompt, image_url: imageUrl, campaign_id: input.campaignId ?? null })
    .select()
    .single<Asset>();

  if (error) {
    // Don't leave an orphaned file in the bucket.
    await supabase.storage.from(BUCKET).remove([path]);
    throw new Error(`Couldn't save asset: ${error.message}`);
  }
  return data;
}

// All saved assets, newest first.
export async function listAssets(): Promise<AssetWithCampaign[]> {
  const { data, error } = await getSupabase()
    .from("assets")
    .select("*, campaigns(name)")
    .order("created_at", { ascending: false })
    .overrideTypes<AssetWithCampaign[], { merge: false }>();

  if (error) throw new Error(`Couldn't load assets: ${error.message}`);
  return data;
}

// The newest `limit` assets attached to a campaign, plus how many it has in all.
export async function listAssetsForCampaign(
  campaignId: string,
  limit = 5,
): Promise<{ assets: Asset[]; total: number }> {
  const { data, count, error } = await getSupabase()
    .from("assets")
    .select("*", { count: "exact" })
    .eq("campaign_id", campaignId)
    .order("created_at", { ascending: false })
    .limit(limit)
    .overrideTypes<Asset[], { merge: false }>();

  if (error) throw new Error(`Couldn't load campaign assets: ${error.message}`);
  return { assets: data, total: count ?? data.length };
}

// Attaches an asset to a campaign, or detaches it when campaignId is null.
export async function setAssetCampaign(assetId: string, campaignId: string | null): Promise<void> {
  const { error } = await getSupabase()
    .from("assets")
    .update({ campaign_id: campaignId })
    .eq("id", assetId);

  if (error) throw new Error(`Couldn't update asset: ${error.message}`);
}
