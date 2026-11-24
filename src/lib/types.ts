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

// The numbers stored in analytics_snapshots.metrics (jsonb). Keys use GA4
// metric names so a real Google Analytics pull can map straight onto this.
// Rates are fractions (0.58 = 58%); averageSessionDuration is in seconds.
export type AnalyticsMetrics = {
  sessions: number;
  totalUsers: number;
  newUsers: number;
  screenPageViews: number;
  engagementRate: number;
  bounceRate: number;
  averageSessionDuration: number;
  keyEvents: number;
  trafficSources: { channel: string; sessions: number }[];
  topPages: { path: string; views: number }[];
};

export type AnalyticsSnapshot = {
  id: string;
  period: string; // ISO 8601 date interval, "YYYY-MM-DD/YYYY-MM-DD"
  metrics: AnalyticsMetrics;
  pulled_at: string;
};
