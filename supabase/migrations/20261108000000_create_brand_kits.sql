-- Brand kits: the single brand's name, voice, palette, and do's/don'ts.
-- Reused by the email-writing and image-generation tools.

create table if not exists public.brand_kits (
  id         uuid        primary key default gen_random_uuid(),
  name       text        not null,
  voice      text,
  palette    jsonb       default '[]'::jsonb,
  dos        text,
  donts      text,
  created_at timestamptz default now()
);

-- Lock the table down. With RLS on and no policies, the public
-- (anon/publishable) key can't read or write it. The app talks to the
-- database only from the server, using the secret key, which bypasses RLS.
alter table public.brand_kits enable row level security;
