// Row shapes for Supabase tables. Mirrors supabase/migrations/.

// One brand color. Stored as an array of these in brand_kits.palette (jsonb).
export type PaletteColor = {
  name: string; // e.g. "Primary", "Accent"
  hex: string; // "#RRGGBB"
};

export type BrandKit = {
  id: string;
  name: string;
  voice: string | null;
  palette: PaletteColor[] | null;
  dos: string | null;
  donts: string | null;
  created_at: string | null;
};
