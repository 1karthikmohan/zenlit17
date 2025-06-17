import React from 'react';
import { Post } from '../../types';

interface Props {
  post: Post;
  onUserClick?: () => void;
}

export const PostCard: React.FC<Props> = ({ post, onUserClick }) => {
  return (
    <div className="bg-gray-900 rounded-lg overflow-hidden">
      {/* Clickable header area - optimized */}
      <button
        onClick={onUserClick}
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
        <p className="text-gray-200">{post.caption}</p>
      </div>
    </div>
  );
};