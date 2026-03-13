-- Personalization Engine Migration
-- Creates user_profiles, expense_history, and country_news tables

-- ═══════════════════════════════════════════════════════════════════════
-- User profiles (core personalization data)
-- ═══════════════════════════════════════════════════════════════════════
create table if not exists user_profiles (
  id uuid primary key default gen_random_uuid(),
  session_id text unique not null,

  -- Basic info (from Inflation Clock Phase 1)
  country text,
  country_code text,
  region text,
  city text,
  birth_year int,
  age int,
  monthly_income numeric,
  currency text,
  language text default 'en',

  -- Detailed expenses (from expense tracker)
  monthly_rent numeric,
  monthly_groceries numeric,
  monthly_transport numeric,
  monthly_utilities numeric,
  monthly_healthcare numeric,
  monthly_education numeric,
  monthly_other numeric,
  expenses_updated_at timestamp,

  -- Family data
  family_members jsonb,

  -- Calculated fields (updated on each visit)
  lifetime_loss numeric,
  daily_loss numeric,
  monthly_loss numeric,
  yearly_loss numeric,
  btc_comparison numeric,
  last_inflation_rate numeric,

  -- Engagement
  modules_completed text[],
  last_visit timestamp,
  visit_count int default 1,
  total_chat_messages int default 0,
  referral_code text,

  -- Alert preferences (for future use)
  alerts_enabled boolean default false,
  alert_email text,
  alert_frequency text default 'monthly',
  last_alert_sent timestamp,

  -- Metadata
  device_type text,
  created_at timestamp default now(),
  updated_at timestamp default now()
);

-- ═══════════════════════════════════════════════════════════════════════
-- Expense history (track changes over time)
-- ═══════════════════════════════════════════════════════════════════════
create table if not exists expense_history (
  id uuid primary key default gen_random_uuid(),
  session_id text not null,
  snapshot_date date not null,
  monthly_rent numeric,
  monthly_groceries numeric,
  monthly_transport numeric,
  monthly_utilities numeric,
  monthly_healthcare numeric,
  monthly_education numeric,
  monthly_other numeric,
  total_monthly numeric,
  created_at timestamp default now()
);

-- ═══════════════════════════════════════════════════════════════════════
-- Country news cache (placeholder for future feature)
-- ═══════════════════════════════════════════════════════════════════════
create table if not exists country_news (
  id uuid primary key default gen_random_uuid(),
  country_code text not null,
  title text not null,
  title_es text,
  summary text,
  summary_es text,
  source text not null,
  url text not null,
  category text,
  published_at timestamp,
  fetched_at timestamp default now()
);

-- ═══════════════════════════════════════════════════════════════════════
-- Indexes
-- ═══════════════════════════════════════════════════════════════════════
create index if not exists idx_profiles_session on user_profiles(session_id);
create index if not exists idx_profiles_country on user_profiles(country_code);
create index if not exists idx_profiles_alerts on user_profiles(alerts_enabled) where alerts_enabled = true;
create index if not exists idx_news_country on country_news(country_code);
create index if not exists idx_news_published on country_news(published_at);
create index if not exists idx_expense_session on expense_history(session_id);

-- ═══════════════════════════════════════════════════════════════════════
-- Row Level Security
-- ═══════════════════════════════════════════════════════════════════════
alter table user_profiles enable row level security;
alter table expense_history enable row level security;
alter table country_news enable row level security;

-- Service role (API routes) can do everything
create policy "Service role full access on user_profiles"
  on user_profiles for all
  using (true)
  with check (true);

create policy "Service role full access on expense_history"
  on expense_history for all
  using (true)
  with check (true);

create policy "Service role full access on country_news"
  on country_news for all
  using (true)
  with check (true);
