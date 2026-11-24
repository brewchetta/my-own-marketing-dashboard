import "server-only";
import { getSupabase } from "@/lib/supabase/server";
import type { Campaign } from "@/lib/types";

// A campaign with its brand kit's name, for lists and headers.
export type CampaignWithBrand = Campaign & { brand_kits: { name: string } | null };

const COLUMNS = "*, brand_kits(name)";

export async function listCampaigns(): Promise<CampaignWithBrand[]> {
  const { data, error } = await getSupabase()
    .from("campaigns")
    .select(COLUMNS)
    .order("created_at", { ascending: false })
    .overrideTypes<CampaignWithBrand[], { merge: false }>();

  if (error) throw new Error(`Couldn't load campaigns: ${error.message}`);
  return data;
}

// Returns null when no campaign has this id (including ids that aren't valid UUIDs).
export async function getCampaign(id: string): Promise<CampaignWithBrand | null> {
  const { data, error } = await getSupabase()
    .from("campaigns")
    .select(COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    // 22P02 = invalid_text_representation, i.e. the id isn't a UUID. Treat as not found.
    if (error.code === "22P02") return null;
    throw new Error(`Couldn't load campaign: ${error.message}`);
  }
  return data as CampaignWithBrand | null;
}

// Groups campaigns for the list page: drafts (newest first), scheduled
// (soonest first), sent (most recent first).
export function groupByStatus(campaigns: CampaignWithBrand[]) {
  const byTime = (c: CampaignWithBrand) => (c.scheduled_at ? Date.parse(c.scheduled_at) : 0);
  return {
    draft: campaigns.filter((c) => c.status === "draft"),
    scheduled: campaigns
      .filter((c) => c.status === "scheduled")
      .sort((a, b) => byTime(a) - byTime(b)),
    sent: campaigns.filter((c) => c.status === "sent").sort((a, b) => byTime(b) - byTime(a)),
  };
}

export async function listCampaignsForBrandKit(
  brandKitId: string,
): Promise<Pick<Campaign, "id" | "name" | "status" | "scheduled_at">[]> {
  const { data, error } = await getSupabase()
    .from("campaigns")
    .select("id, name, status, scheduled_at")
    .eq("brand_kit_id", brandKitId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Couldn't load campaigns: ${error.message}`);
  return data;
}

// Just ids and names, newest first, for "attach to campaign" pickers.
export type CampaignOption = Pick<Campaign, "id" | "name">;

export async function listCampaignOptions(): Promise<CampaignOption[]> {
  const { data, error } = await getSupabase()
    .from("campaigns")
    .select("id, name")
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Couldn't load campaigns: ${error.message}`);
  return data;
}
