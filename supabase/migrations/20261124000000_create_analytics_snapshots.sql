-- Analytics snapshots: one row per pull of Google Analytics (GA4) numbers.
-- `period` is the date range the numbers cover, as an ISO 8601 interval
-- (e.g. '2026-11-16/2026-11-22'). `metrics` holds the numbers, keyed by
-- GA4 metric names so a real API pull can drop straight in later.

create table if not exists public.analytics_snapshots (
  id        uuid        primary key default gen_random_uuid(),
  period    text        not null,
  metrics   jsonb       not null,
  pulled_at timestamptz not null default now()
);

-- The dashboard usually wants the most recent snapshot(s).
create index if not exists analytics_snapshots_pulled_at_idx
  on public.analytics_snapshots (pulled_at desc);

-- Same lockdown as brand_kits: RLS on, no policies. Only the server
-- (secret key, which bypasses RLS) can read or write.
alter table public.analytics_snapshots enable row level security;
