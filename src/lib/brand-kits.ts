import "server-only";
import { getSupabase } from "@/lib/supabase/server";
import type { BrandKit } from "@/lib/types";

export async function listBrandKits(): Promise<Pick<BrandKit, "id" | "name" | "created_at">[]> {
  const { data, error } = await getSupabase()
    .from("brand_kits")
    .select("id, name, created_at")
    .order("name");

  if (error) throw new Error(`Couldn't load brand kits: ${error.message}`);
  return data;
}

// Returns null when no brand kit has this id (including ids that aren't valid UUIDs).
export async function getBrandKit(id: string): Promise<BrandKit | null> {
  const { data, error } = await getSupabase()
    .from("brand_kits")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    // 22P02 = invalid_text_representation, i.e. the id isn't a UUID. Treat as not found.
    if (error.code === "22P02") return null;
    throw new Error(`Couldn't load brand kit: ${error.message}`);
  }
  return data;
}

// Splits a "one per line" field (dos / donts) into trimmed, non-empty items.
export function lines(value: string | null): string[] {
  return (value ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

// Plain-text version of a brand kit, for pasting into other tools.
export function brandKitToText(kit: BrandKit): string {
  const sections = [`Brand: ${kit.name}`];

  if (kit.voice) sections.push(`Voice:\n${kit.voice}`);

  const palette = kit.palette ?? [];
  if (palette.length > 0) {
    sections.push(
      `Palette:\n${palette.map((c) => `- ${c.name ? `${c.name}: ` : ""}${c.hex}`).join("\n")}`,
    );
  }

  const dos = lines(kit.dos);
  if (dos.length > 0) sections.push(`Do's:\n${dos.map((d) => `- ${d}`).join("\n")}`);

  const donts = lines(kit.donts);
  if (donts.length > 0) sections.push(`Don'ts:\n${donts.map((d) => `- ${d}`).join("\n")}`);

  return sections.join("\n\n");
}
