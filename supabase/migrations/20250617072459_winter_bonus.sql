/*
  # Fix email storage in profiles table

  1. Changes
    - Update the trigger function to ensure email is always stored
    - Add better error handling and logging
    - Ensure the trigger runs with proper permissions
    - Add a function to backfill missing emails for existing users

  2. Security
    - Maintain existing RLS policies
    - Ensure trigger has proper permissions to write to profiles table
*/

-- Create an improved trigger function that ensures email is always stored
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Log the trigger execution for debugging
  RAISE LOG 'Creating profile for user: % with email: %', NEW.id, NEW.email;
  
  -- Insert profile with comprehensive data
  INSERT INTO public.profiles (
    id, 
    name, 
    email, 
    bio, 
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name', 
      NEW.raw_user_meta_data->>'name', 
      NEW.raw_user_meta_data->>'first_name',
      split_part(NEW.email, '@', 1),
      'New User'
    ),
    NEW.email, -- Explicitly store the email
    'New to Zenlit! 👋',
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    -- Update existing profile if it exists but has missing data
    name = CASE 
      WHEN profiles.name IS NULL OR profiles.name = '' 
      THEN EXCLUDED.name 
      ELSE profiles.name 
    END,
    email = CASE 
      WHEN profiles.email IS NULL OR profiles.email = '' 
      THEN EXCLUDED.email 
      ELSE profiles.email 
    END,
    bio = CASE 
      WHEN profiles.bio IS NULL OR profiles.bio = '' 
      THEN EXCLUDED.bio 
      ELSE profiles.bio 
    END,
    updated_at = now();
  
  RAISE LOG 'Profile created/updated for user: %', NEW.id;
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log any errors but don't fail the user creation
    RAISE LOG 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger to ensure it's properly configured
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions to ensure the trigger can write to profiles
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.profiles TO postgres, anon, authenticated, service_role;

-- Create a function to backfill missing emails for existing users
CREATE OR REPLACE FUNCTION public.backfill_missing_emails()
RETURNS void AS $$
BEGIN
  -- Update profiles that are missing emails by looking up the auth.users table
  UPDATE public.profiles 
  SET 
    email = auth_users.email,
    updated_at = now()
  FROM auth.users AS auth_users
  WHERE 
    profiles.id = auth_users.id 
    AND (profiles.email IS NULL OR profiles.email = '');
    
  RAISE LOG 'Backfilled emails for profiles missing email data';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Run the backfill function to fix existing users
SELECT public.backfill_missing_emails();

-- Create a function to manually create profile if needed (for emergency use)
CREATE OR REPLACE FUNCTION public.ensure_profile_exists(user_id uuid)
RETURNS void AS $$
DECLARE
  user_record auth.users%ROWTYPE;
BEGIN
  -- Get user data from auth.users
  SELECT * INTO user_record FROM auth.users WHERE id = user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found: %', user_id;
  END IF;
  
  -- Insert or update profile
  INSERT INTO public.profiles (
    id, 
    name, 
    email, 
    bio, 
    created_at,
    updated_at
  )
  VALUES (
    user_record.id,
    COALESCE(
      user_record.raw_user_meta_data->>'full_name', 
      user_record.raw_user_meta_data->>'name', 
      user_record.raw_user_meta_data->>'first_name',
      split_part(user_record.email, '@', 1),
      'New User'
    ),
    user_record.email,
    'New to Zenlit! 👋',
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    name = CASE 
      WHEN profiles.name IS NULL OR profiles.name = '' 
      THEN EXCLUDED.name 
      ELSE profiles.name 
    END,
    email = CASE 
      WHEN profiles.email IS NULL OR profiles.email = '' 
      THEN EXCLUDED.email 
      ELSE profiles.email 
    END,
    updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;