-- Campaigns: one email campaign for the brand. The marketer writes the
-- `brief`; Claude writes `subject` and `body` from the brief and the brand
-- kit's voice, so both start empty on a new draft.
-- Deleting a brand kit keeps its campaigns (brand_kit_id becomes null).

create table if not exists public.campaigns (
  id           uuid        primary key default gen_random_uuid(),
  name         text        not null,
  brief        text,
  brand_kit_id uuid        references public.brand_kits (id) on delete set null,
  subject      text,
  body         text,
  status       text        not null default 'draft'
                           check (status in ('draft', 'scheduled', 'sent')),
  scheduled_at timestamptz,
  created_at   timestamptz default now(),

  -- A scheduled or sent campaign needs a send time. Drafts may have one or not.
  constraint campaigns_scheduled_at_required
    check (status = 'draft' or scheduled_at is not null)
);

create index if not exists campaigns_brand_kit_id_idx on public.campaigns (brand_kit_id);
create index if not exists campaigns_scheduled_at_idx on public.campaigns (scheduled_at);

-- Same lockdown as the other tables: RLS on, no policies, server-only access.
alter table public.campaigns enable row level security;
