-- Test brand kits for local development. Not real brands.
-- The Supabase CLI runs this after migrations on `supabase db reset`.
-- Varied on purpose: different palette sizes, and one kit with empty optional fields.

insert into public.brand_kits (name, voice, palette, dos, donts) values
(
  'Gravy Boat Co.',
  'Grandiose and overly formal, like a Victorian butler who is very serious about gravy. Never admits gravy could be anything less than essential.',
  '[
    {"name": "Mahogany", "hex": "#6B3E26"},
    {"name": "Gravy Gold", "hex": "#C8963E"},
    {"name": "Fine China", "hex": "#F7F3E8"}
  ]'::jsonb,
  E'Address the reader as "esteemed diner"\nRefer to gravy as "the sauce of kings"\nMention a fictional 1887 gravy patent',
  E'Never say "sauce" without "gravy" nearby\nNo slang\nNo admitting that mashed potatoes are fine on their own'
),
(
  'Sock Goblin',
  'Chaotic, gleeful, slightly unhinged. A goblin who steals one sock from every pair and now sells them back as "curated singles."',
  '[
    {"name": "Goblin Green", "hex": "#5FBF3A"},
    {"name": "Lint", "hex": "#B9B4AA"},
    {"name": "Dryer Purple", "hex": "#7B3FA0"},
    {"name": "Hot Mustard", "hex": "#F2C230"},
    {"name": "Cave Black", "hex": "#1B1B1F"}
  ]'::jsonb,
  E'Lowercase subject lines\nCelebrate mismatched pairs\nUse at least one "heh heh"',
  E'Never sell socks in pairs\nNo mention of the dryer (it knows what it did)'
),
(
  'Calm Pebble',
  'Very, very relaxed. Short sentences. Lots of breathing room. A meditation app for people who find meditation too stressful.',
  '[
    {"name": "Pebble", "hex": "#A8A39A"}
  ]'::jsonb,
  null,
  null
);
