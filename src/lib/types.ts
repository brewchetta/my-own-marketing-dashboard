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

export type CampaignStatus = "draft" | "scheduled" | "sent";

export type Campaign = {
  id: string;
  name: string;
  brief: string | null;
  brand_kit_id: string | null;
  subject: string | null; // written by Claude
  body: string | null; // written by Claude
  status: CampaignStatus;
  scheduled_at: string | null; // required unless status is "draft"
  created_at: string | null;
};

export type CalendarChannel = "email" | "social" | "sms";
export type CalendarEntryStatus = "scheduled" | "sent" | "cancelled";

export type CalendarEntry = {
  id: string;
  campaign_id: string;
  scheduled_date: string; // "YYYY-MM-DD"
  channel: CalendarChannel;
  status: CalendarEntryStatus;
};

export type Asset = {
  id: string;
  prompt: string;
  image_url: string; // public URL in the "marketing-assets" storage bucket
  campaign_id: string | null;
  created_at: string;
};
