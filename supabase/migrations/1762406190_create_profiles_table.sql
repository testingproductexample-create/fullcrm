-- Migration: create_profiles_table
-- Created at: 1762406190

-- Create profiles table for user metadata
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  organization_id UUID,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS profiles_organization_id_idx ON profiles(organization_id);

-- Function to automatically create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, organization_id)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.id  -- Use user id as organization_id for simplicity
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on new user
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create profile for existing test user if it doesn't exist
DO $$
DECLARE
  test_user_id UUID;
BEGIN
  -- Get the most recent user ID
  SELECT id INTO test_user_id
  FROM auth.users
  ORDER BY created_at DESC
  LIMIT 1;
  
  IF test_user_id IS NOT NULL THEN
    INSERT INTO profiles (id, email, full_name, organization_id)
    SELECT 
      id,
      email,
      COALESCE(raw_user_meta_data->>'full_name', split_part(email, '@', 1)),
      id
    FROM auth.users
    WHERE id = test_user_id
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;;