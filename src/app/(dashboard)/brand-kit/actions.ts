"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSupabase } from "@/lib/supabase/server";
import type { PaletteColor } from "@/lib/types";

export type BrandKitFormState = {
  error?: string;
  fieldErrors?: Partial<Record<"name" | "palette", string>>;
  // Echo back what was submitted so the form keeps its values after an error.
  values?: { name: string; voice: string; dos: string; donts: string };
};

const HEX = /^#[0-9a-f]{6}$/i;

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function parsePalette(raw: string): PaletteColor[] | null {
  try {
    const parsed: unknown = JSON.parse(raw || "[]");
    if (!Array.isArray(parsed)) return null;
    const colors: PaletteColor[] = [];
    for (const item of parsed) {
      if (typeof item !== "object" || item === null) return null;
      const { name, hex } = item as Record<string, unknown>;
      if (typeof hex !== "string" || !HEX.test(hex)) return null;
      colors.push({ name: typeof name === "string" ? name.trim() : "", hex: hex.toUpperCase() });
    }
    return colors;
  } catch {
    return null;
  }
}

type ValidatedBrandKit = {
  name: string;
  voice: string | null;
  palette: PaletteColor[];
  dos: string | null;
  donts: string | null;
};

// Reads and checks the form. Returns either the row to save or the error state to show.
function validate(
  formData: FormData,
): { ok: true; row: ValidatedBrandKit } | { ok: false; state: BrandKitFormState } {
  const values = formValues(formData);

  const fieldErrors: BrandKitFormState["fieldErrors"] = {};
  if (!values.name) fieldErrors.name = "Give your brand a name.";

  const palette = parsePalette(text(formData, "palette"));
  if (!palette) fieldErrors.palette = "Each color needs a valid hex code, like #1A2B3C.";

  if (!palette || Object.keys(fieldErrors).length > 0) {
    return { ok: false, state: { fieldErrors, values } };
  }

  return {
    ok: true,
    row: {
      name: values.name,
      voice: values.voice || null,
      palette,
      dos: values.dos || null,
      donts: values.donts || null,
    },
  };
}

function formValues(formData: FormData): NonNullable<BrandKitFormState["values"]> {
  return {
    name: text(formData, "name"),
    voice: text(formData, "voice"),
    dos: text(formData, "dos"),
    donts: text(formData, "donts"),
  };
}

export async function createBrandKit(
  _prev: BrandKitFormState,
  formData: FormData,
): Promise<BrandKitFormState> {
  // TODO: check the logged-in user here once auth is implemented.
  const result = validate(formData);
  if (!result.ok) return result.state;

  const { data, error } = await getSupabase()
    .from("brand_kits")
    .insert(result.row)
    .select("id")
    .single();

  if (error) {
    console.error("createBrandKit failed:", error);
    return { error: "Couldn't save the brand kit. Please try again.", values: formValues(formData) };
  }

  revalidatePath("/brand-kit");
  redirect(`/brand-kit/${data.id}`);
}

// Bound to a kit id on the edit page: updateBrandKit.bind(null, id).
export async function updateBrandKit(
  id: string,
  _prev: BrandKitFormState,
  formData: FormData,
): Promise<BrandKitFormState> {
  // TODO: check the logged-in user here once auth is implemented.
  const result = validate(formData);
  if (!result.ok) return result.state;

  const { data, error } = await getSupabase()
    .from("brand_kits")
    .update(result.row)
    .eq("id", id)
    .select("id");

  if (error || data.length === 0) {
    console.error("updateBrandKit failed:", error ?? `no brand kit with id ${id}`);
    return {
      error: "Couldn't save your changes. Please try again.",
      values: formValues(formData),
    };
  }

  revalidatePath("/brand-kit");
  revalidatePath(`/brand-kit/${id}`);
  redirect(`/brand-kit/${id}`);
}
