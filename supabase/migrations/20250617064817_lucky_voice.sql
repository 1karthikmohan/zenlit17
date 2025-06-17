-- Update the trigger function to handle profile creation more robustly
-- This fixes the race condition and RLS policy issues

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Insert profile with better error handling and conflict resolution
  INSERT INTO public.profiles (id, name, email, bio, created_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    'New to Zenlit! 👋',
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    -- Update existing profile if it exists but has missing data
    name = COALESCE(profiles.name, EXCLUDED.name),
    email = COALESCE(profiles.email, EXCLUDED.email),
    bio = COALESCE(profiles.bio, EXCLUDED.bio),
    updated_at = now()
  WHERE profiles.name IS NULL OR profiles.email IS NULL;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Also ensure the trigger exists and is properly configured
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions to ensure the trigger can write to profiles
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.profiles TO postgres, anon, authenticated, service_role;