-- Migration: fix_profiles_rls_circular_reference
-- Created at: 1762406958

-- Drop the problematic policy that creates circular reference
DROP POLICY IF EXISTS "Users can view own profile and organization profiles" ON profiles;

-- Create a simple, non-circular SELECT policy
-- Users can view their own profile directly without subquery
CREATE POLICY "Enable read access for users to own profile"
  ON profiles FOR SELECT
  USING (
    id = auth.uid()
  );

-- Add a separate policy for service role access
CREATE POLICY "Enable read access for service role"
  ON profiles FOR SELECT
  USING (
    auth.role() = 'service_role'
  );;