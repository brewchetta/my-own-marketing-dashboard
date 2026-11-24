-- Insights: Claude's plain-English explanation of one analytics snapshot.
-- `summary` holds the insight as JSON text:
--   {"previousPeriod": "...", "whatChanged": [{"metric", "detail"}], "hypothesis": "...",
--    "considerations": ["..."], "missingMetrics": ["..."]}
-- Deleting a snapshot deletes its insights.

create table if not exists public.insights (
  id          uuid        primary key default gen_random_uuid(),
  snapshot_id uuid        not null references public.analytics_snapshots (id) on delete cascade,
  summary     text        not null,
  created_at  timestamptz default now()
);

-- Looking up the insight for a snapshot is the main query.
create index if not exists insights_snapshot_id_idx on public.insights (snapshot_id);

-- Same lockdown as the other tables: RLS on, no policies, server-only access.
alter table public.insights enable row level security;
