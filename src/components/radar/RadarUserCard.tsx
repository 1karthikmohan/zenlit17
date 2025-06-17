import React, { useState } from 'react';
import { User } from '../../types';
import { IconBrandInstagram, IconBrandLinkedin, IconBrandX } from '@tabler/icons-react';
import { ChatBubbleLeftIcon, UserIcon, MapPinIcon, ClockIcon } from '@heroicons/react/24/outline';
import { UserProfileModal } from './UserProfileModal';

interface Props {
  user: User;
  onMessage: (user: User) => void;
  onViewProfile: () => void;
}

export const RadarUserCard: React.FC<Props> = ({ user, onMessage, onViewProfile }) => {
  const [showModal, setShowModal] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Check if bio is longer than approximately 2-3 lines (around 100 characters)
  const shouldTruncate = user.bio.length > 100;
  const displayBio = shouldTruncate && !isExpanded 
    ? user.bio.substring(0, 100) 
    : user.bio;

  // Format distance display with more detailed ranges
  const formatDistance = (distance: number): string => {
    if (distance < 0.1) {
      return 'Very close (< 100m)';
    } else if (distance < 0.5) {
      return `${Math.round(distance * 1000)}m away`;
    } else if (distance < 1) {
      return `${(distance * 1000).toFixed(0)}m away`;
    } else if (distance < 5) {
      return `${distance.toFixed(1)} km away`;
    } else if (distance < 10) {
      return `${distance.toFixed(1)} km away`;
    } else {
      return `${Math.round(distance)} km away`;
    }
  };

  // Get distance color based on proximity
  const getDistanceColor = (distance: number): string => {
    if (distance < 1) return 'text-green-400';
    if (distance < 5) return 'text-yellow-400';
    if (distance < 15) return 'text-orange-400';
    return 'text-gray-400';
  };

  // Get distance icon based on proximity
  const getDistanceIcon = (distance: number) => {
    if (distance < 1) {
      return <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />;
    }
    return <MapPinIcon className="w-4 h-4" />;
  };

  return (
    <>
      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden transition-all duration-300 ease-in-out hover:shadow-xl hover:border-gray-700">
        <div className="p-4">
          {/* Top section: Photo, Name, and Distance */}
          <div className="flex items-start space-x-4 mb-3">
            <button 
              onClick={() => setShowModal(true)} 
              className="flex-shrink-0 active:scale-95 transition-transform"
            >
              <div className="relative">
                <img
                  src={user.dpUrl}
                  alt={user.name}
                  className="w-14 h-14 rounded-full object-cover ring-2 ring-blue-500"
                />
                {/* Online indicator for very close users */}
                {user.distance < 0.5 && (
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-gray-900 flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full" />
                  </div>
                )}
              </div>
            </button>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between mb-1">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-lg text-white truncate">{user.name}</h3>
                  {user.username && (
                    <p className="text-sm text-gray-400">@{user.username}</p>
                  )}
                </div>
                
                {/* Enhanced distance indicator */}
                <div className={`flex items-center gap-1 text-sm flex-shrink-0 ml-3 ${getDistanceColor(user.distance)}`}>
                  {getDistanceIcon(user.distance)}
                  <span className="font-medium">{formatDistance(user.distance)}</span>
                </div>
              </div>
              
              {/* Bio section with smooth expansion */}
              <div className="text-gray-300 text-sm">
                <div 
                  className={`transition-all duration-300 ease-in-out overflow-hidden ${
                    isExpanded ? 'max-h-96' : 'max-h-12'
                  }`}
                >
                  <span className="leading-relaxed">{displayBio}</span>
                  {shouldTruncate && !isExpanded && <span>...</span>}
                </div>
                {shouldTruncate && (
                  <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="mt-1 text-gray-500 hover:text-gray-400 transition-colors text-xs"
                  >
                    {isExpanded ? 'show less' : '+ read more'}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Interests (if available) */}
          {user.interests && user.interests.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {user.interests.slice(0, 3).map((interest) => (
                <span
                  key={interest}
                  className="px-2 py-1 bg-blue-600/20 text-blue-400 text-xs rounded-full"
                >
                  {interest}
                </span>
              ))}
              {user.interests.length > 3 && (
                <span className="px-2 py-1 bg-gray-600/20 text-gray-400 text-xs rounded-full">
                  +{user.interests.length - 3} more
                </span>
              )}
            </div>
          )}

          {/* Location-based insights */}
          {user.distance < 2 && (
            <div className="bg-green-900/20 border border-green-700/30 rounded-lg p-3 mb-4">
              <div className="flex items-center gap-2">
                <MapPinIcon className="w-4 h-4 text-green-400" />
                <span className="text-sm text-green-300">
                  {user.distance < 0.5 ? 'Very close by!' : 'Nearby - perfect for meeting up!'}
                </span>
              </div>
            </div>
          )}

          {/* Bottom section: Social Links and Action Buttons */}
          <div className="flex items-center justify-between">
            {/* Social Links - Left side */}
            <div className="flex gap-4">
              {user.twitterUrl && (
                <a
                  href={user.twitterUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative text-gray-400 hover:text-white transition-colors active:scale-95"
                >
                  <IconBrandX size={24} />
                  {user.twitterVerified && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full" />
                  )}
                </a>
              )}
              {user.instagramUrl && (
                <a
                  href={user.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative text-gray-400 hover:text-white transition-colors active:scale-95"
                >
                  <IconBrandInstagram size={24} />
                  {user.instagramVerified && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full" />
                  )}
                </a>
              )}
              {user.linkedInUrl && (
                <a
                  href={user.linkedInUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative text-gray-400 hover:text-white transition-colors active:scale-95"
                >
                  <IconBrandLinkedin size={24} />
                  {user.linkedInVerified && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full" />
                  )}
                </a>
              )}
            </div>

            {/* Action Buttons - Right side */}
            <div className="flex gap-2">
              <button
                onClick={onViewProfile}
                className="bg-gray-700 text-white px-4 py-3 rounded-xl hover:bg-gray-600 active:scale-95 transition-all"
                title="View full profile"
              >
                <UserIcon className="w-5 h-5" />
              </button>
              <button
                onClick={() => onMessage(user)}
                className={`text-white px-4 py-3 rounded-xl active:scale-95 transition-all ${
                  user.distance < 1 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
                title={user.distance < 1 ? 'Send message (nearby!)' : 'Send message'}
              >
                <ChatBubbleLeftIcon className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Last seen indicator for very close users */}
          {user.distance < 0.1 && (
            <div className="mt-3 pt-3 border-t border-gray-700">
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <ClockIcon className="w-3 h-3" />
                <span>Active now</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <UserProfileModal
          user={user}
          onClose={() => setShowModal(false)}
          onViewProfile={() => {
            setShowModal(false);
            onViewProfile();
          }}
        />
      )}
    </>
  );
};