-- ============================================================================
-- Phase 3 Migration — The Inflation Clock
-- Creates all Phase 3 tables: analytics, referrals, newsletter, reactions,
-- premium waitlist, embeds, A/B tests, and updates to affiliate_clicks.
-- ============================================================================

-- ── Analytics Events ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS analytics_events (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  session_id    TEXT NOT NULL,
  event_type    TEXT NOT NULL,
  event_data    JSONB DEFAULT '{}'::jsonb,
  country       TEXT,
  language      TEXT DEFAULT 'en',
  device_type   TEXT DEFAULT 'desktop',
  referral_source TEXT,
  page_path     TEXT,
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_analytics_events_session
  ON analytics_events (session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_type
  ON analytics_events (event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created
  ON analytics_events (created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_events_country
  ON analytics_events (country);

-- ── Newsletter Subscribers ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email           TEXT NOT NULL UNIQUE,
  country         TEXT,
  language        TEXT DEFAULT 'en',
  source          TEXT DEFAULT 'website',
  is_active       BOOLEAN DEFAULT true,
  subscribed_at   TIMESTAMPTZ DEFAULT now(),
  unsubscribed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_newsletter_email
  ON newsletter_subscribers (email);
CREATE INDEX IF NOT EXISTS idx_newsletter_active
  ON newsletter_subscribers (is_active);

-- ── Referrals ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS referrals (
  id                    BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  referrer_session_id   TEXT NOT NULL,
  referred_session_id   TEXT,
  referral_code         TEXT NOT NULL UNIQUE,
  status                TEXT DEFAULT 'active' CHECK (status IN ('active', 'converted', 'expired')),
  converted_at          TIMESTAMPTZ,
  created_at            TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_referrals_code
  ON referrals (referral_code);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer
  ON referrals (referrer_session_id);
CREATE INDEX IF NOT EXISTS idx_referrals_status
  ON referrals (status);

-- ── Referral Rewards ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS referral_rewards (
  id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  referral_id     BIGINT NOT NULL REFERENCES referrals (id) ON DELETE CASCADE,
  reward_type     TEXT NOT NULL CHECK (reward_type IN ('referrer', 'referred')),
  reward_value    TEXT NOT NULL,
  claimed         BOOLEAN DEFAULT false,
  claimed_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_referral_rewards_referral
  ON referral_rewards (referral_id);

-- ── User Reactions ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_reactions (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  session_id    TEXT NOT NULL,
  module_slug   TEXT NOT NULL,
  section_index INTEGER DEFAULT 0,
  reaction      TEXT NOT NULL CHECK (reaction IN ('mind_blown', 'angry', 'sad', 'hopeful', 'skeptical')),
  created_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE (session_id, module_slug, section_index)
);

CREATE INDEX IF NOT EXISTS idx_reactions_module
  ON user_reactions (module_slug);
CREATE INDEX IF NOT EXISTS idx_reactions_session
  ON user_reactions (session_id);

-- ── Premium Waitlist ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS premium_waitlist (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  session_id    TEXT NOT NULL,
  email         TEXT,
  country       TEXT,
  modules_completed INTEGER DEFAULT 0,
  feature_interest  TEXT[],
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_waitlist_session
  ON premium_waitlist (session_id);
CREATE INDEX IF NOT EXISTS idx_waitlist_email
  ON premium_waitlist (email);

-- ── Embed Sites ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS embed_sites (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  domain        TEXT NOT NULL,
  session_id    TEXT,
  country       TEXT,
  embed_type    TEXT DEFAULT 'clock' CHECK (embed_type IN ('clock', 'ticker', 'chart')),
  loads         INTEGER DEFAULT 1,
  first_seen_at TIMESTAMPTZ DEFAULT now(),
  last_seen_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_embed_domain
  ON embed_sites (domain);
CREATE UNIQUE INDEX IF NOT EXISTS idx_embed_domain_type
  ON embed_sites (domain, embed_type);

-- ── A/B Tests ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ab_tests (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  test_name     TEXT NOT NULL,
  variant       TEXT NOT NULL,
  session_id    TEXT NOT NULL,
  converted     BOOLEAN DEFAULT false,
  conversion_event TEXT,
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ab_tests_name
  ON ab_tests (test_name);
CREATE INDEX IF NOT EXISTS idx_ab_tests_session
  ON ab_tests (session_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_ab_tests_unique_assignment
  ON ab_tests (test_name, session_id);

-- ── Update affiliate_clicks (add any missing columns) ──────────────────────
-- The table already exists with: session_id, platform, country, module_slug
-- Add tracking columns if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'affiliate_clicks' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE affiliate_clicks ADD COLUMN created_at TIMESTAMPTZ DEFAULT now();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'affiliate_clicks' AND column_name = 'converted'
  ) THEN
    ALTER TABLE affiliate_clicks ADD COLUMN converted BOOLEAN DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'affiliate_clicks' AND column_name = 'conversion_value'
  ) THEN
    ALTER TABLE affiliate_clicks ADD COLUMN conversion_value NUMERIC;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'affiliate_clicks' AND column_name = 'device_type'
  ) THEN
    ALTER TABLE affiliate_clicks ADD COLUMN device_type TEXT;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_session
  ON affiliate_clicks (session_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_platform
  ON affiliate_clicks (platform);
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_created
  ON affiliate_clicks (created_at);

-- ── Enable Row Level Security on new tables ────────────────────────────────
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE premium_waitlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE embed_sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_tests ENABLE ROW LEVEL SECURITY;

-- Allow service role full access (API routes use service role key)
CREATE POLICY "Service role full access on analytics_events"
  ON analytics_events FOR ALL
  USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on newsletter_subscribers"
  ON newsletter_subscribers FOR ALL
  USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on referrals"
  ON referrals FOR ALL
  USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on referral_rewards"
  ON referral_rewards FOR ALL
  USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on user_reactions"
  ON user_reactions FOR ALL
  USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on premium_waitlist"
  ON premium_waitlist FOR ALL
  USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on embed_sites"
  ON embed_sites FOR ALL
  USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on ab_tests"
  ON ab_tests FOR ALL
  USING (true) WITH CHECK (true);
