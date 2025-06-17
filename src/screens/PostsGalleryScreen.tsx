import React from 'react';
import { User, Post } from '../types';
import { ChevronLeftIcon } from '@heroicons/react/24/outline';
import { generatePosts } from '../utils/mockDataGenerator';
import { formatPostDate } from '../utils/dateUtils';

interface Props {
  user: User;
  posts?: Post[];
  onBack: () => void;
  onUserClick?: (userId: string) => void;
}

export const PostsGalleryScreen: React.FC<Props> = ({ user, posts, onBack, onUserClick }) => {
  // Use provided posts or generate mock posts
  const displayPosts = posts || generatePosts(user);

  return (
    <div className="h-full bg-black overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-black/90 backdrop-blur-sm border-b border-gray-800">
        <div className="flex items-center px-4 py-3">
          <button
            onClick={onBack}
            className="mr-3 p-2 rounded-full hover:bg-gray-800 active:scale-95 transition-all"
          >
            <ChevronLeftIcon className="w-5 h-5 text-white" />
          </button>
          <div className="flex items-center">
            <img
              src={user.dpUrl}
              alt={user.name}
              className="w-8 h-8 rounded-full object-cover ring-2 ring-blue-500 mr-3"
            />
            <div>
              <h1 className="text-lg font-semibold text-white">{user.name}'s Posts</h1>
              {displayPosts.length > 0 && (
                <p className="text-xs text-gray-400">
                  {displayPosts.length} post{displayPosts.length !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Posts Feed */}
      <div className="px-4 py-4">
        {displayPosts.length > 0 ? (
          <div className="space-y-6">
            {displayPosts.map((post) => (
              <div key={post.id} className="bg-gray-900 rounded-lg overflow-hidden">
                {/* Post Header */}
                <button
                  onClick={() => onUserClick?.(post.userId)}
                  className="w-full px-4 py-3 flex items-center space-x-3 hover:bg-gray-800 active:bg-gray-700 transition-colors text-left"
                >
                  <img
                    src={post.userDpUrl}
                    alt={post.userName}
                    className="w-10 h-10 rounded-full object-cover ring-2 ring-blue-500"
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold text-white">{post.userName}</h3>
                    <p className="text-xs text-gray-400">
                      {formatPostDate(post.timestamp)}
                    </p>
                  </div>
                </button>

                {/* Post Image */}
                <img
                  src={post.mediaUrl}
                  alt={post.title}
                  className="w-full aspect-square object-cover"
                />

                {/* Post Content */}
                <div className="p-4">
                  <p className="text-gray-200 leading-relaxed">{post.caption}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-gray-400 mb-2">No posts yet</p>
            <p className="text-gray-500 text-sm">Posts will appear here when shared</p>
          </div>
        )}
      </div>
    </div>
  );
};