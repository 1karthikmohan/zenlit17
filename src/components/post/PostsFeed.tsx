import React from 'react';
import { Post } from '../../types';

interface Props {
  posts: Post[];
  onUserClick?: (userId: string) => void;
}

export const PostsFeed: React.FC<Props> = ({ posts, onUserClick }) => {
  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <div key={post.id} className="bg-gray-900 rounded-lg overflow-hidden">
          {/* Clickable header area - optimized */}
          <button
            onClick={() => onUserClick?.(post.userId)}
            className="w-full px-3 py-2 flex items-center space-x-2 hover:bg-gray-800 active:bg-gray-700 transition-colors text-left"
          >
            <img
              src={post.userDpUrl}
              alt={post.userName}
              className="w-8 h-8 rounded-full object-cover"
            />
            <h3 className="font-medium text-base">{post.userName}</h3>
          </button>

          <img
            src={post.mediaUrl}
            alt={post.title}
            className="w-full aspect-video object-cover"
          />

          <div className="p-3">
            <p className="text-gray-300">{post.caption}</p>
          </div>
        </div>
      ))}
    </div>
  );
};