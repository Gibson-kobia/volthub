-- =============================================================================
-- Profiles Wholesale Vetting Migration
-- Adds vetting fields to profiles table for wholesale registration flow
-- Migration date: 2026-04-23
-- =============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'account_type_enum') THEN
    CREATE TYPE account_type_enum AS ENUM ('retail', 'wholesale_general', 'wholesale_school');
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'application_status_enum') THEN
    CREATE TYPE application_status_enum AS ENUM ('none', 'pending', 'approved', 'rejected');
  END IF;
END$$;

-- Add columns to profiles table
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS account_type account_type_enum DEFAULT 'retail',
  ADD COLUMN IF NOT EXISTS is_verified_wholesale BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS institution_name TEXT,
  ADD COLUMN IF NOT EXISTS rep_role TEXT,
  ADD COLUMN IF NOT EXISTS application_status application_status_enum DEFAULT 'none';

-- Index to quickly find pending wholesale applications
CREATE INDEX IF NOT EXISTS idx_profiles_application_status ON public.profiles(application_status);

-- Basic backfill: set any existing wholesale-like profiles to pending (if you prefer manual verification remove this)
-- NOTE: This updates nobody automatically; it's conservative and commented out by default.
-- UPDATE public.profiles SET application_status = 'pending' WHERE account_type <> 'retail' AND application_status = 'none';

-- Helpful check query (run manually to validate)
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'profiles' AND column_name IN ('account_type','is_verified_wholesale','institution_name','rep_role','application_status');
