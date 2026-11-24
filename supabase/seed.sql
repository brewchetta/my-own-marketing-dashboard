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

-- ---------------------------------------------------------------------------
-- Analytics snapshots: six weeks of fake GA4 numbers (Mon–Sun weeks).
-- There's a story in here for the insights feature to find:
--   * week of Oct 26: a dip across the board
--   * week of Nov 9: a big spike driven by the Email channel (a campaign send)
--   * week of Nov 16: settles back down, but higher than before the campaign
-- Rates are fractions (0.58 = 58%). averageSessionDuration is in seconds.
-- bounceRate = 1 - engagementRate, as in GA4. trafficSources sum to sessions.

insert into public.analytics_snapshots (period, metrics, pulled_at) values
(
  '2026-10-12/2026-10-18',
  '{
    "sessions": 4120, "totalUsers": 3180, "newUsers": 2210, "screenPageViews": 11240,
    "engagementRate": 0.58, "bounceRate": 0.42, "averageSessionDuration": 94.2, "keyEvents": 96,
    "trafficSources": [
      {"channel": "Organic Search", "sessions": 1730},
      {"channel": "Direct",         "sessions": 1030},
      {"channel": "Organic Social", "sessions": 620},
      {"channel": "Email",          "sessions": 410},
      {"channel": "Referral",       "sessions": 330}
    ],
    "topPages": [
      {"path": "/",                    "views": 3920},
      {"path": "/shop",                "views": 2610},
      {"path": "/blog/getting-started", "views": 1180}
    ]
  }'::jsonb,
  '2026-10-19 09:00:00+00'
),
(
  '2026-10-19/2026-10-25',
  '{
    "sessions": 4310, "totalUsers": 3290, "newUsers": 2280, "screenPageViews": 11870,
    "engagementRate": 0.59, "bounceRate": 0.41, "averageSessionDuration": 97.8, "keyEvents": 104,
    "trafficSources": [
      {"channel": "Organic Search", "sessions": 1810},
      {"channel": "Direct",         "sessions": 1060},
      {"channel": "Organic Social", "sessions": 660},
      {"channel": "Email",          "sessions": 430},
      {"channel": "Referral",       "sessions": 350}
    ],
    "topPages": [
      {"path": "/",                    "views": 4080},
      {"path": "/shop",                "views": 2790},
      {"path": "/blog/getting-started", "views": 1240}
    ]
  }'::jsonb,
  '2026-10-26 09:00:00+00'
),
(
  '2026-10-26/2026-11-01',
  '{
    "sessions": 3890, "totalUsers": 3010, "newUsers": 2050, "screenPageViews": 10420,
    "engagementRate": 0.55, "bounceRate": 0.45, "averageSessionDuration": 88.5, "keyEvents": 82,
    "trafficSources": [
      {"channel": "Organic Search", "sessions": 1690},
      {"channel": "Direct",         "sessions": 980},
      {"channel": "Organic Social", "sessions": 540},
      {"channel": "Email",          "sessions": 360},
      {"channel": "Referral",       "sessions": 320}
    ],
    "topPages": [
      {"path": "/",                    "views": 3710},
      {"path": "/shop",                "views": 2330},
      {"path": "/blog/getting-started", "views": 1050}
    ]
  }'::jsonb,
  '2026-11-02 09:00:00+00'
),
(
  '2026-11-02/2026-11-08',
  '{
    "sessions": 4450, "totalUsers": 3410, "newUsers": 2390, "screenPageViews": 12360,
    "engagementRate": 0.60, "bounceRate": 0.40, "averageSessionDuration": 99.1, "keyEvents": 112,
    "trafficSources": [
      {"channel": "Organic Search", "sessions": 1860},
      {"channel": "Direct",         "sessions": 1090},
      {"channel": "Organic Social", "sessions": 700},
      {"channel": "Email",          "sessions": 450},
      {"channel": "Referral",       "sessions": 350}
    ],
    "topPages": [
      {"path": "/",                    "views": 4210},
      {"path": "/shop",                "views": 2960},
      {"path": "/blog/getting-started", "views": 1300}
    ]
  }'::jsonb,
  '2026-11-09 09:00:00+00'
),
(
  '2026-11-09/2026-11-15',
  '{
    "sessions": 6230, "totalUsers": 4870, "newUsers": 3720, "screenPageViews": 17910,
    "engagementRate": 0.64, "bounceRate": 0.36, "averageSessionDuration": 112.6, "keyEvents": 188,
    "trafficSources": [
      {"channel": "Organic Search", "sessions": 1920},
      {"channel": "Direct",         "sessions": 1180},
      {"channel": "Organic Social", "sessions": 860},
      {"channel": "Email",          "sessions": 1910},
      {"channel": "Referral",       "sessions": 360}
    ],
    "topPages": [
      {"path": "/shop",                "views": 5480},
      {"path": "/",                    "views": 4930},
      {"path": "/holiday-sale",        "views": 3120}
    ]
  }'::jsonb,
  '2026-11-16 09:00:00+00'
),
(
  '2026-11-16/2026-11-22',
  '{
    "sessions": 4980, "totalUsers": 3820, "newUsers": 2640, "screenPageViews": 13750,
    "engagementRate": 0.61, "bounceRate": 0.39, "averageSessionDuration": 101.3, "keyEvents": 131,
    "trafficSources": [
      {"channel": "Organic Search", "sessions": 1940},
      {"channel": "Direct",         "sessions": 1140},
      {"channel": "Organic Social", "sessions": 780},
      {"channel": "Email",          "sessions": 740},
      {"channel": "Referral",       "sessions": 380}
    ],
    "topPages": [
      {"path": "/",                    "views": 4460},
      {"path": "/shop",                "views": 3570},
      {"path": "/holiday-sale",        "views": 1390}
    ]
  }'::jsonb,
  '2026-11-23 09:00:00+00'
);

-- ---------------------------------------------------------------------------
-- Insights for two earlier weeks, so "Past insights" has something to show.
-- The latest week (Nov 16–22) is left without one so you can generate it.
-- Every number below comes from the snapshots above.

insert into public.insights (snapshot_id, summary, created_at) values
(
  (select id from public.analytics_snapshots where period = '2026-11-09/2026-11-15'),
  '{
    "previousPeriod": "2026-11-02/2026-11-08",
    "whatChanged": [
      {"metric": "Visits", "detail": "Sessions rose from 4,450 to 6,230, up 40%."},
      {"metric": "Email traffic", "detail": "Email sessions jumped from 450 to 1,910. That is 1,460 of the 1,780 extra sessions."},
      {"metric": "Key events", "detail": "Key events rose from 112 to 188, up 68%."},
      {"metric": "Engagement", "detail": "Engagement rate improved from 60% to 64%."}
    ],
    "hypothesis": "This is a hypothesis: an email campaign promoting the holiday sale drove most of the growth. Email sessions more than quadrupled, and /holiday-sale appeared in the top pages with 3,120 views. Other channels grew only slightly.",
    "considerations": [
      "Note what this email did differently (timing, subject, offer) so you can repeat it.",
      "Watch next week to see how much of this lift holds once the campaign is over."
    ],
    "missingMetrics": []
  }',
  '2026-11-16 09:05:00+00'
),
(
  (select id from public.analytics_snapshots where period = '2026-10-26/2026-11-01'),
  '{
    "previousPeriod": "2026-10-19/2026-10-25",
    "whatChanged": [
      {"metric": "Visits", "detail": "Sessions fell from 4,310 to 3,890, down 10%."},
      {"metric": "Key events", "detail": "Key events fell from 104 to 82, down 21%."},
      {"metric": "Engagement", "detail": "Engagement rate dropped from 59% to 55%."},
      {"metric": "Organic Social", "detail": "Organic Social sessions fell from 660 to 540, down 18%, the biggest drop of any channel."}
    ],
    "hypothesis": "This is a hypothesis: a quieter week across the board rather than one broken channel. Every channel lost sessions (Organic Search 1,810 to 1,690, Direct 1,060 to 980, Email 430 to 360, Referral 350 to 320), which points to something seasonal or a lighter posting and sending schedule.",
    "considerations": [
      "Check whether you posted or emailed less than usual that week.",
      "Key events fell faster than visits, so look at whether anything changed on your sign-up or checkout pages."
    ],
    "missingMetrics": []
  }',
  '2026-11-02 09:05:00+00'
);
