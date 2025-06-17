// This file is now empty as we only use real user data from the database
// All user data comes from Supabase profiles table

import { Post } from '../types';
import { generateId } from './generateId';

// Only keep post generation for real users
const postCaptions = [
  'Living my best life! 🌟',
  'Another beautiful day in paradise 🌅',
  'Can\'t beat this view 😍',
  'Weekend vibes 🎉',
  'Making memories 📸',
  'Adventure awaits 🌎',
  'Good times with great people 🥰',
  'Living in the moment ✨',
  'Blessed and grateful 🙏',
  'Dreams do come true 💫'
];

export function generatePosts(user: any): Post[] {
  return Array.from({ length: 6 }, () => ({
    id: generateId(),
    userId: user.id,
    userName: user.name,
    userDpUrl: user.profile_photo_url || `https://i.pravatar.cc/300?img=${user.id}`,
    title: `Post by ${user.name}`,
    mediaUrl: `https://picsum.photos/800/600?random=${generateId()}`,
    caption: postCaptions[Math.floor(Math.random() * postCaptions.length)],
    timestamp: new Date().toISOString()
  }));
}