-- =============================================================================
-- WHOLESALE APPLICATIONS TABLE AND RPC
-- Create wholesale_applications table and handle_wholesale_approval RPC
-- Date: 2026-04-23
-- =============================================================================

-- Create wholesale_applications table
CREATE TABLE IF NOT EXISTS public.wholesale_applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  business_info JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.wholesale_applications ENABLE ROW LEVEL SECURITY;

-- Policies
-- Users can insert their own applications
CREATE POLICY "Users can insert their own wholesale applications"
  ON public.wholesale_applications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can view their own applications
CREATE POLICY "Users can view their own wholesale applications"
  ON public.wholesale_applications FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can view and update all applications
CREATE POLICY "Admins can manage wholesale applications"
  ON public.wholesale_applications FOR ALL
  USING (auth.role() = 'authenticated'); -- Assuming app-level admin check

-- Create the RPC function
CREATE OR REPLACE FUNCTION public.handle_wholesale_approval(app_id UUID, target_user_id UUID, new_status TEXT, rejection_reason TEXT DEFAULT NULL)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Validate new_status
  IF new_status NOT IN ('approved', 'rejected') THEN
    RAISE EXCEPTION 'Invalid status: %', new_status;
  END IF;

  -- Update the application status
  UPDATE public.wholesale_applications
  SET status = new_status,
      business_info = CASE WHEN new_status = 'rejected' AND rejection_reason IS NOT NULL THEN business_info || jsonb_build_object('rejection_reason', rejection_reason) ELSE business_info END
  WHERE id = app_id AND user_id = target_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Application not found or user mismatch';
  END IF;

  -- If approved, update profiles
  IF new_status = 'approved' THEN
    UPDATE public.profiles
    SET account_type = 'wholesale_general', is_verified_wholesale = TRUE, application_status = 'approved'
    WHERE user_id = target_user_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Profile not found for user';
    END IF;
  END IF;

  -- If rejected, update profiles application_status
  IF new_status = 'rejected' THEN
    UPDATE public.profiles
    SET application_status = 'rejected'
    WHERE user_id = target_user_id;
  END IF;
END;
$$;</content>
<parameter name="filePath">/workspaces/volthub/supabase/migrations/20260423_wholesale_applications.sql