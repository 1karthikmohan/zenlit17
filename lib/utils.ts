import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { User } from '../src/types'
import { uploadProfileImage } from '../src/lib/storage'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Transform Supabase profile data to User type
export function transformProfileToUser(profile: any): User {
  return {
    id: profile.id,
    name: profile.name,
    username: profile.username, // Include username
    dpUrl: profile.profile_photo_url || `https://i.pravatar.cc/300?img=${profile.id}`,
    bio: profile.bio,
    gender: profile.gender,
    age: profile.date_of_birth ? 
      new Date().getFullYear() - new Date(profile.date_of_birth).getFullYear() : 25,
    distance: Math.floor(Math.random() * 50) + 1,
    interests: profile.interests || [],
    links: {
      Twitter: profile.twitter_url || '#',
      Instagram: profile.instagram_url || '#',
      LinkedIn: profile.linked_in_url || '#',
    },
    latitude: profile.latitude,
    longitude: profile.longitude,
    instagramUrl: profile.instagram_url,
    instagramVerified: profile.instagram_verified,
    facebookUrl: profile.facebook_url,
    facebookVerified: profile.facebook_verified,
    linkedInUrl: profile.linked_in_url,
    linkedInVerified: profile.linked_in_verified,
    twitterUrl: profile.twitter_url,
    twitterVerified: profile.twitter_verified,
    googleUrl: profile.google_url,
    googleVerified: profile.google_verified,
  }
}

// Re-export uploadProfileImage for backward compatibility
export { uploadProfileImage }