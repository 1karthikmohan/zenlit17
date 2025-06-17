import React, { useState } from 'react';
import { User, SocialProvider, OAuthState } from '../../types';
import { SocialAuthButton } from './SocialAuthButton';
import { 
  IconBrandInstagram, 
  IconBrandLinkedin, 
  IconBrandX, 
  IconBrandFacebook,
  IconBrandGoogle 
} from '@tabler/icons-react';

interface Props {
  user: User;
  onUserUpdate: (updatedUser: User) => void;
}

export const SocialAccountsSection: React.FC<Props> = ({ user, onUserUpdate }) => {
  const [oauthStates, setOauthStates] = useState<Record<string, OAuthState>>({});

  const socialProviders: SocialProvider[] = [
    {
      id: 'instagram',
      name: 'Instagram',
      color: 'pink',
      icon: IconBrandInstagram
    },
    {
      id: 'facebook',
      name: 'Facebook',
      color: 'blue',
      icon: IconBrandFacebook
    },
    {
      id: 'linkedin',
      name: 'LinkedIn',
      color: 'blue',
      icon: IconBrandLinkedin
    },
    {
      id: 'twitter',
      name: 'X (Twitter)',
      color: 'gray',
      icon: IconBrandX
    },
    {
      id: 'google',
      name: 'Google',
      color: 'red',
      icon: IconBrandGoogle
    }
  ];

  const getProviderData = (providerId: string) => {
    switch (providerId) {
      case 'instagram':
        return {
          isConnected: !!user.instagramUrl,
          isVerified: !!user.instagramVerified,
          profileUrl: user.instagramUrl
        };
      case 'facebook':
        return {
          isConnected: !!user.facebookUrl,
          isVerified: !!user.facebookVerified,
          profileUrl: user.facebookUrl
        };
      case 'linkedin':
        return {
          isConnected: !!user.linkedInUrl,
          isVerified: !!user.linkedInVerified,
          profileUrl: user.linkedInUrl
        };
      case 'twitter':
        return {
          isConnected: !!user.twitterUrl,
          isVerified: !!user.twitterVerified,
          profileUrl: user.twitterUrl
        };
      case 'google':
        return {
          isConnected: !!user.googleUrl,
          isVerified: !!user.googleVerified,
          profileUrl: user.googleUrl
        };
      default:
        return {
          isConnected: false,
          isVerified: false,
          profileUrl: undefined
        };
    }
  };

  const setOAuthState = (providerId: string, state: Partial<OAuthState>) => {
    setOauthStates(prev => ({
      ...prev,
      [providerId]: {
        ...prev[providerId],
        ...state
      }
    }));
  };

  const initiateOAuth = async (providerId: string) => {
    setOAuthState(providerId, {
      isConnecting: true,
      error: null,
      provider: providerId
    });

    try {
      // Simulate OAuth flow - In real implementation, this would:
      // 1. Redirect to backend endpoint (e.g., /auth/instagram)
      // 2. Backend redirects to provider's OAuth page
      // 3. User authorizes the app
      // 4. Provider redirects back to backend callback
      // 5. Backend exchanges code for access token
      // 6. Backend fetches user's profile URL
      // 7. Backend updates user record and redirects back to frontend
      
      console.log(`Initiating OAuth for ${providerId}`);
      
      // For demo purposes, simulate the OAuth process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simulate successful OAuth response
      const mockProfileUrls = {
        instagram: 'https://instagram.com/verified_user',
        facebook: 'https://facebook.com/verified.user',
        linkedin: 'https://linkedin.com/in/verified-user',
        twitter: 'https://twitter.com/verified_user',
        google: 'https://plus.google.com/verified.user'
      };

      const profileUrl = mockProfileUrls[providerId as keyof typeof mockProfileUrls];
      
      // Update user with verified social account
      const updatedUser = {
        ...user,
        [`${providerId}Url`]: profileUrl,
        [`${providerId}Verified`]: true
      };

      onUserUpdate(updatedUser);
      
      setOAuthState(providerId, {
        isConnecting: false,
        error: null,
        provider: null
      });

    } catch (error) {
      console.error(`OAuth failed for ${providerId}:`, error);
      
      setOAuthState(providerId, {
        isConnecting: false,
        error: error instanceof Error ? error.message : 'Failed to connect account. Please try again.',
        provider: null
      });
    }
  };

  const handleConnect = (providerId: string) => {
    // In a real implementation, this would redirect to:
    // window.location.href = `/auth/${providerId}`;
    initiateOAuth(providerId);
  };

  const handleReconnect = (providerId: string) => {
    // Clear existing connection and reconnect
    const updatedUser = {
      ...user,
      [`${providerId}Url`]: undefined,
      [`${providerId}Verified`]: false
    };
    onUserUpdate(updatedUser);
    
    // Initiate new OAuth flow
    setTimeout(() => {
      initiateOAuth(providerId);
    }, 500);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Verify Social Accounts</h2>
        <div className="text-sm text-gray-400">
          {socialProviders.filter(p => getProviderData(p.id).isVerified).length} of {socialProviders.length} verified
        </div>
      </div>
      
      <p className="text-sm text-gray-400 mb-6">
        Connect and verify your social media accounts to build trust with other users and get a verified badge.
      </p>

      <div className="space-y-4">
        {socialProviders.map((provider) => {
          const providerData = getProviderData(provider.id);
          const oauthState = oauthStates[provider.id] || {
            isConnecting: false,
            error: null,
            provider: null
          };

          return (
            <SocialAuthButton
              key={provider.id}
              provider={provider}
              isConnected={providerData.isConnected}
              isVerified={providerData.isVerified}
              profileUrl={providerData.profileUrl}
              isConnecting={oauthState.isConnecting}
              error={oauthState.error}
              onConnect={() => handleConnect(provider.id)}
              onReconnect={() => handleReconnect(provider.id)}
            />
          );
        })}
      </div>

      <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-4 mt-6">
        <div className="flex items-start gap-3">
          <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-medium text-blue-300 mb-1">Why verify your accounts?</h3>
            <ul className="text-xs text-blue-200 space-y-1">
              <li>• Verify your identity to other users</li>
              <li>• Build trust in the community</li>
              <li>• Show your authentic social presence</li>
              <li>• Get a verified badge on your profile</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};