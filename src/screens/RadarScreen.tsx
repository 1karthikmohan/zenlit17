import React, { useState, useEffect, useRef, useCallback } from 'react';
import { RadarUserCard } from '../components/radar/RadarUserCard';
import { LocationPermissionModal } from '../components/radar/LocationPermissionModal';
import { User, UserLocation, LocationPermissionStatus } from '../types';
import { MapPinIcon, ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { supabase } from '../lib/supabase';
import { transformProfileToUser } from '../../lib/utils';
import { 
  requestLocationAndSave, 
  getNearbyUsers, 
  checkLocationPermission,
  isGeolocationSupported,
  isSecureContext,
  watchUserLocation,
  stopWatchingLocation,
  hasLocationChangedSignificantly,
  saveUserLocation,
  createDebouncedLocationUpdate
} from '../lib/location';

interface Props {
  userGender: 'male' | 'female';
  onNavigate: (tab: string) => void;
  onViewProfile: (user: User) => void;
  onMessageUser?: (user: User) => void;
}

export const RadarScreen: React.FC<Props> = ({ 
  userGender, 
  onNavigate, 
  onViewProfile, 
  onMessageUser 
}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentLocation, setCurrentLocation] = useState<UserLocation | null>(null);
  const [locationPermission, setLocationPermission] = useState<LocationPermissionStatus>({
    granted: false,
    denied: false,
    pending: true
  });
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [isRequestingLocation, setIsRequestingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLocationTracking, setIsLocationTracking] = useState(false);
  const [lastLocationUpdate, setLastLocationUpdate] = useState<number>(0);
  const [isUpdatingUsers, setIsUpdatingUsers] = useState(false);

  // Refs for cleanup
  const locationWatchId = useRef<number | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    initializeRadar();

    // Cleanup on unmount
    return () => {
      mountedRef.current = false;
      if (locationWatchId.current !== null) {
        stopWatchingLocation(locationWatchId.current);
        locationWatchId.current = null;
      }
    };
  }, []);

  const initializeRadar = async () => {
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.error('User not found:', userError);
        setIsLoading(false);
        return;
      }

      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError || !profile) {
        console.error('Profile not found:', profileError);
        setIsLoading(false);
        return;
      }

      setCurrentUser(profile);

      // Check if user already has location data
      if (profile.latitude && profile.longitude) {
        console.log('User has existing location data');
        const userLocation: UserLocation = {
          latitude: profile.latitude,
          longitude: profile.longitude,
          timestamp: Date.now()
        };
        setCurrentLocation(userLocation);
        setLocationPermission({ granted: true, denied: false, pending: false });
        await loadNearbyUsers(user.id, userLocation);
        
        // Start location tracking for dynamic updates
        startLocationTracking(user.id);
      } else {
        // Check location permission status
        const permissionStatus = await checkLocationPermission();
        setLocationPermission(permissionStatus);
        
        if (permissionStatus.granted) {
          // Permission already granted, try to get location
          await handleRequestLocation();
        } else if (!permissionStatus.denied) {
          // Show location permission modal
          setShowLocationModal(true);
        }
      }
    } catch (error) {
      console.error('Error initializing radar:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Debounced function to update users when location changes
  const debouncedUpdateUsers = useCallback(
    createDebouncedLocationUpdate(async (location: UserLocation) => {
      if (!currentUser || !mountedRef.current) return;
      
      console.log('Location changed significantly, updating nearby users...');
      setIsUpdatingUsers(true);
      
      try {
        // Save new location to profile
        await saveUserLocation(currentUser.id, location);
        
        // Update nearby users
        await loadNearbyUsers(currentUser.id, location);
        
        setLastLocationUpdate(Date.now());
      } catch (error) {
        console.error('Error updating users after location change:', error);
      } finally {
        if (mountedRef.current) {
          setIsUpdatingUsers(false);
        }
      }
    }, 3000), // 3 second debounce
    [currentUser]
  );

  const startLocationTracking = (userId: string) => {
    if (locationWatchId.current !== null) {
      stopWatchingLocation(locationWatchId.current);
    }

    console.log('Starting dynamic location tracking...');
    setIsLocationTracking(true);

    const watchId = watchUserLocation(
      (newLocation: UserLocation) => {
        if (!mountedRef.current) return;

        setCurrentLocation(prevLocation => {
          // Check if location has changed significantly
          if (prevLocation && hasLocationChangedSignificantly(prevLocation, newLocation, 0.1)) {
            console.log('Significant location change detected');
            debouncedUpdateUsers(newLocation);
          }
          
          return newLocation;
        });
      },
      (error: string) => {
        if (!mountedRef.current) return;
        
        console.error('Location tracking error:', error);
        setLocationError(error);
        setIsLocationTracking(false);
        
        if (locationWatchId.current !== null) {
          stopWatchingLocation(locationWatchId.current);
          locationWatchId.current = null;
        }
      }
    );

    if (watchId !== null) {
      locationWatchId.current = watchId;
    } else {
      setIsLocationTracking(false);
    }
  };

  const loadNearbyUsers = async (currentUserId: string, location: UserLocation) => {
    try {
      console.log('Loading nearby users...');
      if (!isUpdatingUsers) {
        setIsLoading(true);
      }

      const result = await getNearbyUsers(currentUserId, location, 50, 20);
      
      if (result.success && result.users) {
        // Transform database profiles to User type
        const transformedUsers: User[] = result.users.map(profile => ({
          ...transformProfileToUser(profile),
          distance: profile.distance // Use calculated distance from location service
        }));

        if (mountedRef.current) {
          setUsers(transformedUsers);
          console.log(`Loaded ${transformedUsers.length} nearby users`);
        }
      } else {
        console.error('Failed to load nearby users:', result.error);
        if (mountedRef.current) {
          setUsers([]);
        }
      }
    } catch (error) {
      console.error('Error loading nearby users:', error);
      if (mountedRef.current) {
        setUsers([]);
      }
    } finally {
      if (mountedRef.current && !isUpdatingUsers) {
        setIsLoading(false);
      }
    }
  };

  const handleRequestLocation = async () => {
    if (!currentUser) return;

    setIsRequestingLocation(true);
    setLocationError(null);

    try {
      const result = await requestLocationAndSave(currentUser.id, currentUser.location);
      
      if (result.success && result.location) {
        console.log('Location obtained and saved successfully');
        setCurrentLocation(result.location);
        setLocationPermission({ granted: true, denied: false, pending: false });
        setShowLocationModal(false);
        
        // Load nearby users with the new location
        await loadNearbyUsers(currentUser.id, result.location);
        
        // Start location tracking for dynamic updates
        startLocationTracking(currentUser.id);
      } else {
        console.error('Failed to get location:', result.error);
        setLocationError(result.error || 'Failed to get location');
        
        // Update permission status based on error
        if (result.error?.includes('denied')) {
          setLocationPermission({ granted: false, denied: true, pending: false });
        }
      }
    } catch (error) {
      console.error('Location request error:', error);
      setLocationError('Failed to get location. Please try again.');
    } finally {
      setIsRequestingLocation(false);
    }
  };

  const handleViewProfile = (user: User) => {
    onViewProfile(user);
    onNavigate('profile');
  };

  const handleMessage = (user: User) => {
    if (onMessageUser) {
      onMessageUser(user);
    }
    onNavigate('messages');
  };

  const handleRetryLocation = () => {
    setLocationError(null);
    setShowLocationModal(true);
  };

  const handleRefreshLocation = async () => {
    if (!currentUser || isRequestingLocation) return;
    
    setLocationError(null);
    await handleRequestLocation();
  };

  // Check if location services are available
  const isLocationAvailable = isGeolocationSupported() && isSecureContext();

  if (isLoading) {
    return (
      <div className="min-h-full bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Finding people nearby...</p>
        </div>
      </div>
    );
  }

  // Show location unavailable message
  if (!isLocationAvailable) {
    return (
      <div className="min-h-full bg-black">
        <div className="px-4 py-3 bg-black border-b border-gray-800">
          <h1 className="text-xl font-bold text-white">Nearby People</h1>
        </div>
        
        <div className="flex items-center justify-center h-96">
          <div className="text-center max-w-md px-4">
            <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <ExclamationTriangleIcon className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Location Not Available</h2>
            <p className="text-gray-400 mb-4">
              Location services are not available. This feature requires HTTPS or localhost.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show location permission required
  if (!locationPermission.granted && !currentLocation) {
    return (
      <div className="min-h-full bg-black">
        <div className="px-4 py-3 bg-black border-b border-gray-800">
          <h1 className="text-xl font-bold text-white">Nearby People</h1>
        </div>
        
        <div className="flex items-center justify-center h-96">
          <div className="text-center max-w-md px-4">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <MapPinIcon className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Location Required</h2>
            <p className="text-gray-400 mb-6">
              To find people near you, we need access to your location. Your exact location is never shared with other users.
            </p>
            
            {locationError && (
              <div className="bg-red-900/30 border border-red-700 rounded-lg p-3 mb-4">
                <p className="text-red-400 text-sm">{locationError}</p>
              </div>
            )}
            
            <div className="space-y-3">
              <button
                onClick={handleRetryLocation}
                disabled={isRequestingLocation}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 active:scale-95 transition-all disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isRequestingLocation ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Getting Location...
                  </>
                ) : (
                  <>
                    <MapPinIcon className="w-5 h-5" />
                    Enable Location
                  </>
                )}
              </button>
              
              {locationPermission.denied && (
                <p className="text-xs text-gray-500">
                  Location access was denied. Please enable location permissions in your browser settings and refresh the page.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Location Permission Modal */}
        <LocationPermissionModal
          isOpen={showLocationModal}
          onClose={() => setShowLocationModal(false)}
          onRequestLocation={handleRequestLocation}
          isRequesting={isRequestingLocation}
          error={locationError || undefined}
        />
      </div>
    );
  }

  return (
    <div className="min-h-full bg-black">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-black/90 backdrop-blur-sm border-b border-gray-800">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-white">Nearby People</h1>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex items-center gap-1">
                  <MapPinIcon className={`w-4 h-4 ${isLocationTracking ? 'text-green-500' : 'text-yellow-500'}`} />
                  <span className={`text-xs ${isLocationTracking ? 'text-green-400' : 'text-yellow-400'}`}>
                    {isLocationTracking ? 'Live tracking' : 'Static location'}
                  </span>
                </div>
                {isUpdatingUsers && (
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs text-blue-400">Updating...</span>
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-400">
                {users.length > 0 ? `${users.length} people found nearby` : 'Searching for people nearby...'}
              </p>
            </div>
            
            {/* Refresh location button */}
            <button
              onClick={handleRefreshLocation}
              disabled={isRequestingLocation}
              className="p-2 bg-gray-800 rounded-full hover:bg-gray-700 active:scale-95 transition-all disabled:bg-gray-600"
              title="Refresh location and update nearby users"
            >
              {isRequestingLocation ? (
                <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              ) : (
                <ArrowPathIcon className="w-5 h-5 text-gray-400" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Location Status Info */}
      {isLocationTracking && (
        <div className="px-4 py-2 bg-green-900/20 border-b border-green-700/30">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-xs text-green-400">
              Location tracking active - radar updates automatically as you move
            </span>
          </div>
        </div>
      )}

      {/* Users List */}
      <div className="px-4 py-4 space-y-4 pb-20">
        {users.length > 0 ? (
          users.map((user) => (
            <RadarUserCard
              key={user.id}
              user={user}
              onMessage={handleMessage}
              onViewProfile={() => handleViewProfile(user)}
            />
          ))
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <MapPinIcon className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-400 mb-2">No people found nearby</p>
            <p className="text-gray-500 text-sm">
              Try moving to a different area or check back later for new connections!
            </p>
            {isLocationTracking && (
              <p className="text-gray-500 text-xs mt-2">
                The radar will automatically update as you move around
              </p>
            )}
          </div>
        )}
      </div>

      {/* Location Permission Modal */}
      <LocationPermissionModal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        onRequestLocation={handleRequestLocation}
        isRequesting={isRequestingLocation}
        error={locationError || undefined}
      />
    </div>
  );
};