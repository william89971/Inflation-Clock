-- ============================================================================
-- Admin Stats Aggregation Functions
-- Replaces in-memory JS aggregation (which loaded up to 100k rows)
-- with efficient server-side SQL aggregations.
-- Run this migration in the Supabase SQL editor.
-- ============================================================================

-- Total distinct sessions across all time
CREATE OR REPLACE FUNCTION get_distinct_session_count()
RETURNS bigint AS $$
  SELECT COUNT(DISTINCT session_id) FROM analytics_events;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Distinct sessions in the last N days
CREATE OR REPLACE FUNCTION get_recent_session_count(days_ago integer)
RETURNS bigint AS $$
  SELECT COUNT(DISTINCT session_id)
  FROM analytics_events
  WHERE created_at >= NOW() - (days_ago || ' days')::interval;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Top 5 countries by distinct session count
CREATE OR REPLACE FUNCTION get_top_countries(limit_n integer DEFAULT 5)
RETURNS TABLE(country text, sessions bigint) AS $$
  SELECT country, COUNT(DISTINCT session_id) AS sessions
  FROM analytics_events
  WHERE country IS NOT NULL
  GROUP BY country
  ORDER BY sessions DESC
  LIMIT limit_n;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Grant execute to the service role (used by server-side Supabase client)
GRANT EXECUTE ON FUNCTION get_distinct_session_count() TO service_role;
GRANT EXECUTE ON FUNCTION get_recent_session_count(integer) TO service_role;
GRANT EXECUTE ON FUNCTION get_top_countries(integer) TO service_role;
