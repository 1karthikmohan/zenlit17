import React from 'react';
import { User } from '../../types';
import { Avatar } from '../common/Avatar';
import { SocialLinks } from '../common/SocialLinks';
import { generatePosts } from '../../utils/mockDataGenerator';

interface Props {
  user: User;
}

export const UserProfile: React.FC<Props> = ({ user }) => {
  const posts = generatePosts(user);

  return (
    <div className="min-h-screen bg-black">
      {/* Cover Image */}
      <div className="relative h-48 bg-gradient-to-b from-blue-900 to-black">
        <img
          src={`https://picsum.photos/1200/400?random=${user.id}`}
          alt="Cover"
          className="w-full h-full object-cover opacity-50"
        />
      </div>

      {/* Profile Info */}
      <div className="relative px-4 pb-4">
        <div className="flex flex-col items-center -mt-16">
          <Avatar
            src={user.dpUrl}
            alt={user.name}
            size="lg"
          />
          <h1 className="text-2xl font-bold mt-4">{user.name}</h1>
          <p className="text-gray-400 mt-2">{user.bio}</p>
          
          {/* Social Links */}
          <div className="mt-6">
            <SocialLinks links={user.links} className="justify-center" />
          </div>
        </div>

        {/* Posts Grid */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Posts</h2>
          <div className="grid grid-cols-3 gap-1">
            {posts.map((post) => (
              <div key={post.id} className="aspect-square relative group">
                <img
                  src={post.mediaUrl}
                  alt={post.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-300 flex items-center justify-center">
                  <p className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-white text-sm text-center px-2">
                    {post.caption}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};