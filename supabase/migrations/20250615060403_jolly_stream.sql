/*
  # Create profiles table

  1. New Tables
    - `profiles`
      - `id` (uuid, primary key, references auth.users)
      - `updated_at` (timestamp with time zone)
      - `name` (text)
      - `bio` (text)
      - `email` (text)
      - `date_of_birth` (date)
      - `gender` (text)
      - `location` (text)
      - `interests` (text array)
      - `profile_photo_url` (text)
      - `profile_completed` (boolean, default false)
      - Social verification fields for Instagram, Facebook, LinkedIn, Twitter, Google
      - `created_at` (timestamp with time zone, default now())

  2. Security
    - Enable RLS on `profiles` table
    - Add policy for authenticated users to view all profiles
    - Add policy for users to insert their own profile
    - Add policy for users to update their own profile
    - Add policy for users to delete their own profile

  3. Functions
    - Create trigger to automatically create profile on user signup
*/

-- Create the profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
  updated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  name text,
  email text,
  bio text DEFAULT 'New to Zenlit! 👋',
  date_of_birth date,
  gender text,
  location text,
  interests text[],
  profile_photo_url text,
  profile_completed boolean DEFAULT false,
  instagram_url text,
  instagram_verified boolean DEFAULT false,
  facebook_url text,
  facebook_verified boolean DEFAULT false,
  linked_in_url text,
  linked_in_verified boolean DEFAULT false,
  twitter_url text,
  twitter_verified boolean DEFAULT false,
  google_url text,
  google_verified boolean DEFAULT false
);

-- Enable Row Level Security (RLS) for the profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to view all profiles
CREATE POLICY "Public profiles are viewable by authenticated users"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Allow users to insert their own profile
CREATE POLICY "Users can insert their own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Policy: Allow users to update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Policy: Allow users to delete their own profile
CREATE POLICY "Users can delete own profile"
  ON profiles
  FOR DELETE
  TO authenticated
  USING (auth.uid() = id);

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, created_at)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', 'New User'),
    new.email,
    now()
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at timestamp
CREATE TRIGGER handle_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();