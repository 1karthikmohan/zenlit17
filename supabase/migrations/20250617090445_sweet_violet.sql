/*
  # Add location fields to profiles table

  1. Changes
    - Add `latitude` column (real)
    - Add `longitude` column (real)
    - Add index for efficient location queries

  2. Security
    - Location data is optional and user-controlled
    - No additional RLS policies needed (covered by existing profile policies)
*/

-- Add latitude and longitude columns to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS latitude real;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS longitude real;

-- Create index for efficient location-based queries
CREATE INDEX IF NOT EXISTS profiles_location_idx ON profiles(latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- Add a function to calculate distance between two points using Haversine formula
CREATE OR REPLACE FUNCTION calculate_distance(
  lat1 real, lon1 real, lat2 real, lon2 real
) RETURNS real AS $$
DECLARE
  dlat real;
  dlon real;
  a real;
  c real;
  r real := 6371; -- Earth's radius in kilometers
BEGIN
  -- Convert degrees to radians
  dlat := radians(lat2 - lat1);
  dlon := radians(lon2 - lon1);
  
  -- Haversine formula
  a := sin(dlat/2) * sin(dlat/2) + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon/2) * sin(dlon/2);
  c := 2 * atan2(sqrt(a), sqrt(1-a));
  
  RETURN r * c; -- Distance in kilometers
END;
$$ LANGUAGE plpgsql IMMUTABLE;