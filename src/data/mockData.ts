// This file now only contains utility functions for managing posts
import { Post, Message } from '../types';
import { generateId } from '../utils/generateId';

// Generate messages for real users only
const messageContents = [
  'Hey, how are you?',
  'Would you like to grab coffee sometime?',
  'Nice to meet you!',
  'I saw we have similar interests!',
  'Have you been to any good restaurants lately?',
  'What brings you to Zenlit?',
  'Love your travel photos!',
  'Any recommendations for hiking trails?',
  'Are you going to the upcoming tech meetup?',
  'Would love to connect!'
];

export function generateMessages(currentUserId: string, users: any[]): Message[] {
  return Array.from({ length: 20 }, () => {
    const otherUser = users[Math.floor(Math.random() * users.length)];
    return {
      id: generateId(),
      senderId: Math.random() > 0.5 ? currentUserId : otherUser.id,
      receiverId: Math.random() > 0.5 ? otherUser.id : currentUserId,
      content: messageContents[Math.floor(Math.random() * messageContents.length)],
      timestamp: new Date(Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)).toISOString(),
      read: Math.random() > 0.3
    };
  });
}