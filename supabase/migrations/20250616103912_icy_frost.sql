/*
  # Add username field to profiles table

  1. Changes
    - Add `username` column (text, unique, not null)
    - Create unique index on username
    - Add constraint to ensure username is lowercase and alphanumeric with underscores/dots
    - Remove location field (optional - can be done later)

  2. Security
    - Username must be unique across all users
    - Username validation for format
*/

-- Add username column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS username text;

-- Create unique index on username (case-insensitive)
CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_unique_idx ON profiles (LOWER(username));

-- Add constraint for username format (lowercase letters, numbers, underscores, dots, 3-30 chars)
ALTER TABLE profiles ADD CONSTRAINT IF NOT EXISTS username_format_check 
  CHECK (username ~ '^[a-z0-9._]{3,30}$');

-- Make username not null (after adding the column)
-- Note: This will be handled in the application logic for existing users