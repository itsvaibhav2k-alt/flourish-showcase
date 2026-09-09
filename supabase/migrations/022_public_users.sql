-- Create public.users table to enable PostgREST joins
-- This table syncs with auth.users and provides user data for the application

-- Table: public.users
-- Mirrors essential fields from auth.users for PostgREST joins
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view all users (needed for joins)
CREATE POLICY "Users can view all users"
  ON public.users
  FOR SELECT
  USING (true);

-- RLS Policy: Users can only update their own record
CREATE POLICY "Users can update own profile"
  ON public.users
  FOR UPDATE
  USING (auth.uid() = id);

-- Function to sync user data from auth.users to public.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, avatar_url, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1)
    ),
    NEW.raw_user_meta_data->>'avatar_url',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = COALESCE(
      EXCLUDED.name,
      public.users.name
    ),
    avatar_url = COALESCE(
      EXCLUDED.avatar_url,
      public.users.avatar_url
    ),
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create/update public.users when auth.users changes
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Populate existing users from auth.users
INSERT INTO public.users (id, email, name, avatar_url, created_at, updated_at)
SELECT
  id,
  email,
  COALESCE(
    raw_user_meta_data->>'full_name',
    raw_user_meta_data->>'name',
    split_part(email, '@', 1)
  ) as name,
  raw_user_meta_data->>'avatar_url' as avatar_url,
  created_at,
  NOW()
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- Update the foreign key references in major_gift_prospects to reference public.users
-- Note: We keep the original foreign key to auth.users for data integrity,
-- but add a foreign key to public.users for PostgREST joins

-- First, drop the existing foreign key constraint if it exists
DO $$
BEGIN
  -- Check if constraint exists before dropping
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'major_gift_prospects_assigned_to_fkey'
    AND table_name = 'major_gift_prospects'
  ) THEN
    ALTER TABLE major_gift_prospects DROP CONSTRAINT major_gift_prospects_assigned_to_fkey;
  END IF;
END $$;

-- Add foreign key to public.users instead (for PostgREST joins)
ALTER TABLE major_gift_prospects
  ADD CONSTRAINT major_gift_prospects_assigned_to_fkey
  FOREIGN KEY (assigned_to) REFERENCES public.users(id) ON DELETE SET NULL;

-- Do the same for cultivation_moves.logged_by
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'cultivation_moves_logged_by_fkey'
    AND table_name = 'cultivation_moves'
  ) THEN
    ALTER TABLE cultivation_moves DROP CONSTRAINT cultivation_moves_logged_by_fkey;
  END IF;
END $$;

ALTER TABLE cultivation_moves
  ADD CONSTRAINT cultivation_moves_logged_by_fkey
  FOREIGN KEY (logged_by) REFERENCES public.users(id) ON DELETE SET NULL;
