-- =============================================================================
-- WHOLESALE APPLICATION FLOW MIGRATION
-- Update profiles table for wholesale vetting and application status
-- Date: 2026-04-22
-- =============================================================================

-- Add new columns to profiles table for wholesale application flow
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_verified_wholesale BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS institution_name TEXT,
ADD COLUMN IF NOT EXISTS rep_role TEXT,
ADD COLUMN IF NOT EXISTS application_status TEXT DEFAULT 'none' CHECK (application_status IN ('none', 'pending', 'approved', 'rejected'));

-- Update account_type enum to match new requirements
ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_account_type_check;

ALTER TABLE public.profiles
ADD CONSTRAINT profiles_account_type_check
CHECK (account_type IN ('retail', 'wholesale_general', 'wholesale_school'));

-- Update existing records to map old values to new ones
UPDATE public.profiles
SET account_type = 'wholesale_school'
WHERE account_type = 'school';

UPDATE public.profiles
SET account_type = 'wholesale_general'
WHERE account_type IN ('wholesaler', 'bulk_buyer');

-- Migrate school_name and business_name to institution_name
UPDATE public.profiles
SET institution_name = COALESCE(school_name, business_name)
WHERE institution_name IS NULL AND (school_name IS NOT NULL OR business_name IS NOT NULL);

-- Add index for wholesale verification queries
CREATE INDEX IF NOT EXISTS idx_profiles_wholesale_verified ON public.profiles(is_verified_wholesale, application_status);

-- Add index for institution name searches
CREATE INDEX IF NOT EXISTS idx_profiles_institution_name ON public.profiles(institution_name) WHERE institution_name IS NOT NULL;
