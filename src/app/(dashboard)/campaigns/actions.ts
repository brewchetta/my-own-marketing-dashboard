"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getBrandKit } from "@/lib/brand-kits";
import { generateEmail, type GeneratedEmail } from "@/lib/email-writer";
import { getSupabase } from "@/lib/supabase/server";

export type CampaignFormValues = {
  name: string;
  brandKitId: string;
  brief: string;
  subject: string;
  body: string;
};

export type CampaignFormState = {
  error?: string;
  fieldErrors?: Partial<Record<"name" | "brandKitId", string>>;
  // Echo back what was submitted so the form keeps its values after an error.
  values?: CampaignFormValues;
};

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function formValues(formData: FormData): CampaignFormValues {
  return {
    name: text(formData, "name"),
    brandKitId: text(formData, "brandKitId"),
    brief: text(formData, "brief"),
    subject: text(formData, "subject"),
    body: text(formData, "body"),
  };
}

// Reads and checks the form. Returns either the columns to save or the error state.
function validate(formData: FormData) {
  const values = formValues(formData);
  const fieldErrors: CampaignFormState["fieldErrors"] = {};
  if (!values.name) fieldErrors.name = "Give the campaign a name.";
  if (!values.brandKitId) fieldErrors.brandKitId = "Pick the brand this campaign is for.";

  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false as const, state: { fieldErrors, values } };
  }
  return {
    ok: true as const,
    row: {
      name: values.name,
      brand_kit_id: values.brandKitId,
      brief: values.brief || null,
      subject: values.subject || null,
      body: values.body || null,
    },
    values,
  };
}

export async function createCampaign(
  _prev: CampaignFormState,
  formData: FormData,
): Promise<CampaignFormState> {
  // TODO: check the logged-in user here once auth is implemented.
  const result = validate(formData);
  if (!result.ok) return result.state;

  // New campaigns always start as drafts. Scheduling comes with the calendar.
  const { data, error } = await getSupabase()
    .from("campaigns")
    .insert({ ...result.row, status: "draft" })
    .select("id")
    .single();

  if (error) {
    console.error("createCampaign failed:", error);
    return { error: "Couldn't save the campaign. Please try again.", values: result.values };
  }

  revalidatePath("/campaigns");
  redirect(`/campaigns/${data.id}`);
}

// Bound to a campaign id on the edit page: updateCampaign.bind(null, id).
export async function updateCampaign(
  id: string,
  _prev: CampaignFormState,
  formData: FormData,
): Promise<CampaignFormState> {
  // TODO: check the logged-in user here once auth is implemented.
  const result = validate(formData);
  if (!result.ok) return result.state;

  const { data, error } = await getSupabase()
    .from("campaigns")
    .update(result.row)
    .eq("id", id)
    .select("id");

  if (error || data.length === 0) {
    console.error("updateCampaign failed:", error ?? `no campaign with id ${id}`);
    return { error: "Couldn't save your changes. Please try again.", values: result.values };
  }

  revalidatePath("/campaigns");
  revalidatePath(`/campaigns/${id}`);
  redirect(`/campaigns/${id}`);
}

export type WriteEmailResult = { email: GeneratedEmail } | { error: string };

// Writes a subject and body with Claude from the form's current brief and
// brand kit. Saves nothing: the form fills in the fields so the marketer can
// edit them before saving.
export async function writeEmail(input: {
  name: string;
  brief: string;
  brandKitId: string;
}): Promise<WriteEmailResult> {
  // TODO: check the logged-in user here once auth is implemented.
  if (!process.env.ANTHROPIC_API_KEY) {
    return { error: "The Anthropic API isn't connected yet. Add ANTHROPIC_API_KEY to .env.local." };
  }
  if (!input.brief.trim()) {
    return { error: "Write a brief first, so Claude knows what the email is about." };
  }
  if (!input.brandKitId) {
    return { error: "Pick a brand kit first, so the email matches your brand's voice." };
  }

  try {
    const brandKit = await getBrandKit(input.brandKitId);
    if (!brandKit) return { error: "That brand kit no longer exists. Pick another one." };

    const email = await generateEmail({
      name: input.name.trim(),
      brief: input.brief.trim(),
      brandKit,
    });
    return { email };
  } catch (error) {
    console.error("writeEmail failed:", error);
    return { error: "Couldn't write the email. Check the server logs for details." };
  }
}
