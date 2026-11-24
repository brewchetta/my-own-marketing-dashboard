import "server-only";
import { getSupabase } from "@/lib/supabase/server";
import type { Campaign, CalendarEntryStatus } from "@/lib/types";

// Keeps a campaign and its email calendar entry in step. Every status change
// goes through here, so the two never disagree:
//
//   campaign            email calendar entry
//   ------------------  --------------------------------------
//   scheduled on date   scheduled, on that date
//   back to draft       cancelled (stays on the calendar, struck out)
//   sent                sent
//
// A campaign has at most one email entry that isn't sent; it's reused when the
// campaign is rescheduled, so moving the date moves the entry. Social and SMS
// entries are separate posts and aren't touched.
//
// Scheduling is by day for now. scheduled_at gets a fixed time of day
// (14:00 UTC, the same as the seed data) until real sending decides send times.

const SEND_TIME_UTC = "14:00:00Z";

export const scheduledAtFor = (date: string) => `${date}T${SEND_TIME_UTC}`;
export const dateOf = (scheduledAt: string) => scheduledAt.slice(0, 10);

type CampaignPatch = Pick<Campaign, "status" | "scheduled_at">;

// The email entry this campaign's schedule controls: the latest one not yet sent.
async function openEmailEntry(campaignId: string) {
  const { data, error } = await getSupabase()
    .from("calendar_entries")
    .select("id")
    .eq("campaign_id", campaignId)
    .eq("channel", "email")
    .neq("status", "sent")
    .order("scheduled_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(`Couldn't load the calendar entry: ${error.message}`);
  return data as { id: string } | null;
}

// Updates the campaign, then its email entry. If the entry update fails, the
// campaign is put back so the two stay in step.
async function applyChange(
  campaign: Campaign,
  patch: CampaignPatch,
  entry: { status: CalendarEntryStatus; date: string } | null,
) {
  const supabase = getSupabase();
  const previous: CampaignPatch = { status: campaign.status, scheduled_at: campaign.scheduled_at };

  const { error } = await supabase.from("campaigns").update(patch).eq("id", campaign.id);
  if (error) throw new Error(`Couldn't update the campaign: ${error.message}`);

  try {
    const existing = await openEmailEntry(campaign.id);
    if (existing) {
      const { error } = await supabase
        .from("calendar_entries")
        .update(entry ? { status: entry.status, scheduled_date: entry.date } : { status: "cancelled" })
        .eq("id", existing.id);
      if (error) throw new Error(`Couldn't update the calendar entry: ${error.message}`);
    } else if (entry) {
      const { error } = await supabase.from("calendar_entries").insert({
        campaign_id: campaign.id,
        channel: "email",
        scheduled_date: entry.date,
        status: entry.status,
      });
      if (error) throw new Error(`Couldn't add the calendar entry: ${error.message}`);
    }
  } catch (error) {
    await supabase.from("campaigns").update(previous).eq("id", campaign.id);
    throw error;
  }
}

// Schedules (or reschedules) the campaign's email for `date` ("YYYY-MM-DD").
export function scheduleCampaign(campaign: Campaign, date: string) {
  return applyChange(
    campaign,
    { status: "scheduled", scheduled_at: scheduledAtFor(date) },
    { status: "scheduled", date },
  );
}

// Back to draft. The email entry is cancelled rather than deleted.
export function unscheduleCampaign(campaign: Campaign) {
  return applyChange(campaign, { status: "draft", scheduled_at: null }, null);
}

// Records that the email went out on its scheduled day. There's no real
// sending yet, so the marketer marks it by hand.
export function markCampaignSent(campaign: Campaign) {
  if (!campaign.scheduled_at) throw new Error("Only a scheduled campaign can be marked as sent.");
  return applyChange(
    campaign,
    { status: "sent", scheduled_at: campaign.scheduled_at },
    { status: "sent", date: dateOf(campaign.scheduled_at) },
  );
}
