import React from 'react';
import { CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { SocialProvider } from '../../types';

interface Props {
  provider: SocialProvider;
  isConnected: boolean;
  isVerified: boolean;
  profileUrl?: string;
  isConnecting: boolean;
  error?: string | null;
  onConnect: () => void;
  onReconnect: () => void;
}

export const SocialAuthButton: React.FC<Props> = ({
  provider,
  isConnected,
  isVerified,
  profileUrl,
  isConnecting,
  error,
  onConnect,
  onReconnect
}) => {
  const IconComponent = provider.icon;

  const getButtonText = () => {
    if (isConnecting) return 'Connecting...';
    if (isConnected && isVerified) return 'Verified';
    if (isConnected && !isVerified) return 'Reconnect';
    return `Connect ${provider.name}`;
  };

  const getButtonStyle = () => {
    if (isConnected && isVerified) {
      return 'bg-green-600 hover:bg-green-700 border-green-500';
    }
    if (isConnected && !isVerified) {
      return 'bg-yellow-600 hover:bg-yellow-700 border-yellow-500';
    }
    return 'bg-blue-600 hover:bg-blue-700 border-blue-500';
  };

  const handleClick = () => {
    if (isConnecting) return;
    
    if (isConnected && !isVerified) {
      onReconnect();
    } else if (!isConnected) {
      onConnect();
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between p-4 bg-gray-800 border border-gray-600 rounded-lg">
        <div className="flex items-center space-x-3">
          <IconComponent size={24} className="text-gray-300" />
          <div className="min-w-0 flex-1">
            <h3 className="font-medium text-white">{provider.name}</h3>
            {isConnected && isVerified && profileUrl && (
              <p className="text-sm text-green-400 truncate">
                ✓ {profileUrl.replace('https://', '')}
              </p>
            )}
            {isConnected && !isVerified && (
              <p className="text-sm text-yellow-400">
                ⚠ Connection expired
              </p>
            )}
            {!isConnected && (
              <p className="text-sm text-gray-500">
                Not connected
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2 flex-shrink-0">
          {isConnected && isVerified && (
            <CheckCircleIcon className="w-5 h-5 text-green-500" />
          )}
          
          {isConnected && !isVerified && (
            <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500" />
          )}

          <button
            onClick={handleClick}
            disabled={isConnecting || (isConnected && isVerified)}
            className={`px-4 py-2 rounded-lg font-medium text-white transition-all active:scale-95 disabled:cursor-not-allowed flex items-center gap-2 text-sm ${getButtonStyle()}`}
          >
            {isConnecting && (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            {getButtonText()}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-700 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <ExclamationTriangleIcon className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-400 text-sm font-medium">Connection Failed</p>
              <p className="text-red-300 text-xs mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};