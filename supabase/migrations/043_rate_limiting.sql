-- Rate Limiting Tables and Functions
-- This migration creates database-backed rate limiting for API endpoints
-- Replaces in-memory rate limiting for better scalability and persistence

-- ============================================================================
-- RATE LIMIT TABLE
-- ============================================================================

-- Table to store rate limit entries with sliding window buckets
CREATE TABLE IF NOT EXISTS rate_limit_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Key format: "ip:{ip}", "apikey:{key_id}", "webhook:{webhook_id}"
  key TEXT NOT NULL,
  -- Start of the time bucket (floored to minute)
  bucket_start TIMESTAMPTZ NOT NULL,
  -- Number of requests in this bucket
  request_count INTEGER DEFAULT 1,
  -- Timestamp for cleanup
  created_at TIMESTAMPTZ DEFAULT NOW(),
  -- Unique constraint to enable upsert
  UNIQUE(key, bucket_start)
);

-- Index for fast lookups by key and bucket
CREATE INDEX IF NOT EXISTS idx_rate_limit_key_bucket ON rate_limit_entries(key, bucket_start);

-- Index for cleanup queries (delete old entries)
CREATE INDEX IF NOT EXISTS idx_rate_limit_created_at ON rate_limit_entries(bucket_start);

-- ============================================================================
-- RATE LIMIT FUNCTIONS
-- ============================================================================

-- Atomic increment function that checks and updates rate limit in one query
-- Returns whether the request is allowed, remaining requests, and reset time
CREATE OR REPLACE FUNCTION increment_rate_limit(
  p_key TEXT,
  p_limit INTEGER,
  p_window_seconds INTEGER DEFAULT 60
)
RETURNS TABLE(allowed BOOLEAN, remaining INTEGER, reset_at TIMESTAMPTZ) AS $$
DECLARE
  v_bucket_start TIMESTAMPTZ;
  v_current_count INTEGER;
  v_reset_at TIMESTAMPTZ;
BEGIN
  -- Calculate bucket start (floor to the start of the current minute)
  v_bucket_start := date_trunc('minute', NOW());
  v_reset_at := v_bucket_start + (p_window_seconds || ' seconds')::INTERVAL;

  -- Upsert: insert new entry or increment existing count atomically
  INSERT INTO rate_limit_entries (key, bucket_start, request_count)
  VALUES (p_key, v_bucket_start, 1)
  ON CONFLICT (key, bucket_start)
  DO UPDATE SET request_count = rate_limit_entries.request_count + 1
  RETURNING request_count INTO v_current_count;

  -- Return results
  RETURN QUERY SELECT
    v_current_count <= p_limit AS allowed,
    GREATEST(0, p_limit - v_current_count) AS remaining,
    v_reset_at;
END;
$$ LANGUAGE plpgsql;

-- Cleanup function to remove old rate limit entries
-- Should be called periodically (e.g., every 5 minutes via Inngest cron)
CREATE OR REPLACE FUNCTION cleanup_rate_limit_entries()
RETURNS void AS $$
BEGIN
  -- Delete entries older than 5 minutes (gives buffer beyond 1-minute windows)
  DELETE FROM rate_limit_entries
  WHERE bucket_start < NOW() - INTERVAL '5 minutes';
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE rate_limit_entries IS 'Stores rate limit counters for API requests with sliding window buckets';
COMMENT ON FUNCTION increment_rate_limit(TEXT, INTEGER, INTEGER) IS 'Atomically increments rate limit counter and returns whether request is allowed';
COMMENT ON FUNCTION cleanup_rate_limit_entries() IS 'Removes expired rate limit entries (call via scheduled job)';
