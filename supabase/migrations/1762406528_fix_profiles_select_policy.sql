-- Migration: fix_profiles_select_policy
-- Created at: 1762406528

-- Drop the problematic SELECT policy
DROP POLICY IF EXISTS "Users can view profiles in their organization" ON profiles;

-- Create a simpler SELECT policy that allows users to view their own profile
-- and other profiles in their organization
CREATE POLICY "Users can view own profile and organization profiles"
  ON profiles FOR SELECT
  USING (
    id = auth.uid()  -- Can always view own profile
    OR 
    auth.role() = ANY (ARRAY['anon'::text, 'service_role'::text])  -- Service role can view all
    OR
    organization_id IN (  -- Can view others in same organization
      SELECT organization_id 
      FROM profiles 
      WHERE id = auth.uid()
    )
  );;