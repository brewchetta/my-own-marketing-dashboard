-- Calendar entries: when and where a campaign goes out. One campaign can have
-- several entries (e.g. the email on Tuesday, a social post on Wednesday).
-- Deleting a campaign deletes its calendar entries.
--
-- To add a channel later, drop and re-add calendar_entries_channel_check
-- with the new value in the list.

create table if not exists public.calendar_entries (
  id             uuid primary key default gen_random_uuid(),
  campaign_id    uuid not null references public.campaigns (id) on delete cascade,
  scheduled_date date not null,
  channel        text not null
                      constraint calendar_entries_channel_check
                      check (channel in ('email', 'social', 'sms')),
  status         text not null default 'scheduled'
                      check (status in ('scheduled', 'sent', 'cancelled'))
);

-- The calendar view queries by date range; campaign pages look up by campaign.
create index if not exists calendar_entries_scheduled_date_idx on public.calendar_entries (scheduled_date);
create index if not exists calendar_entries_campaign_id_idx on public.calendar_entries (campaign_id);

-- Same lockdown as the other tables: RLS on, no policies, server-only access.
alter table public.calendar_entries enable row level security;
