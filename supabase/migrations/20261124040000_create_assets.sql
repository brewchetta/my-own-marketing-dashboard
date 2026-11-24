-- Assets: images generated with Gemini for the brand's campaigns.
-- The image file lives in the "marketing-assets" Supabase Storage bucket;
-- `image_url` points at it. `prompt` is the text that generated the image.
-- An asset can stand alone (campaign_id null) or be attached to a campaign.
-- Deleting a campaign keeps its assets (campaign_id becomes null).

create table if not exists public.assets (
  id          uuid        primary key default gen_random_uuid(),
  prompt      text        not null,
  image_url   text        not null,
  campaign_id uuid        references public.campaigns (id) on delete set null,
  created_at  timestamptz not null default now()
);

-- Campaign pages look up their assets; the assets page lists newest first.
create index if not exists assets_campaign_id_idx on public.assets (campaign_id);
create index if not exists assets_created_at_idx on public.assets (created_at desc);

-- Same lockdown as the other tables: RLS on, no policies, server-only access.
alter table public.assets enable row level security;
