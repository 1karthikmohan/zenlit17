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
  createDebouncedLocationUpdate,
  calculateDistance
} from '../lib/location';

interface Props {
  userGender: 'male' | 'female';
  onNavigate: (tab: string) => void;
  onViewProfile: (user: User) => void;
  onMessageUser?: (user: User) => void;
}

// Default locations for major cities (for demo/fallback purposes)
const DEFAULT_LOCATIONS = [
  { lat: 40.7128, lng: -74.0060, name: 'New York' },
  { lat: 34.0522, lng: -118.2437, name: 'Los Angeles' },
  { lat: 41.8781, lng: -87.6298, name: 'Chicago' },
  { lat: 29.7604, lng: -95.3698, name: 'Houston' },
  { lat: 39.9526, lng: -75.1652, name: 'Philadelphia' },
  { lat: 33.4484, lng: -112.0740, name: 'Phoenix' },
  { lat: 29.4241, lng: -98.4936, name: 'San Antonio' },
  { lat: 32.7767, lng: -96.7970, name: 'Dallas' },
  { lat: 37.3382, lng: -121.8863, name: 'San Jose' },
  { lat: 30.2672, lng: -97.7431, name: 'Austin' }
];

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
  const [useDefaultLocation, setUseDefaultLocation] = useState(false);

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

  const getRandomDefaultLocation = (): UserLocation => {
    const location = DEFAULT_LOCATIONS[Math.floor(Math.random() * DEFAULT_LOCATIONS.length)];
    // Add some random offset within 1km radius
    const offsetLat = (Math.random() - 0.5) * 0.018; // ~1km in latitude
    const offsetLng = (Math.random() - 0.5) * 0.018; // ~1km in longitude
    
    return {
      latitude: location.lat + offsetLat,
      longitude: location.lng + offsetLng,
      timestamp: Date.now()
    };
  };

  const initializeRadar = async () => {
    try {
      console.log('🚀 RADAR DEBUG: Initializing radar screen');
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.error('🚀 RADAR DEBUG: User not found:', userError);
        setIsLoading(false);
        return;
      }

      console.log('🚀 RADAR DEBUG: Current user found:', user.id);

      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError || !profile) {
        console.error('🚀 RADAR DEBUG: Profile not found:', profileError);
        setIsLoading(false);
        return;
      }

      console.log('🚀 RADAR DEBUG: User profile loaded:', {
        id: profile.id,
        name: profile.name,
        hasLocation: !!(profile.latitude && profile.longitude),
        latitude: profile.latitude,
        longitude: profile.longitude
      });

      setCurrentUser(profile);

      // Check if user already has location data
      if (profile.latitude && profile.longitude) {
        console.log('🚀 RADAR DEBUG: User has existing location data');
        const userLocation: UserLocation = {
          latitude: profile.latitude,
          longitude: profile.longitude,
          timestamp: Date.now()
        };
        setCurrentLocation(userLocation);
        setLocationPermission({ granted: true, denied: false, pending: false });
        await loadNearbyUsersWithFallback(user.id, userLocation);
        
        // Start location tracking for dynamic updates
        startLocationTracking(user.id);
      } else {
        console.log('🚀 RADAR DEBUG: User has no location data, trying to get location');
        // Try to get real location first
        const permissionStatus = await checkLocationPermission();
        setLocationPermission(permissionStatus);
        
        if (permissionStatus.granted && isGeolocationSupported() && isSecureContext()) {
          // Try to get real location
          try {
            await handleRequestLocation();
          } catch (error) {
            console.log('🚀 RADAR DEBUG: Real location failed, using default location');
            await useDefaultLocationFallback(user.id);
          }
        } else {
          // Use default location immediately for better UX
          console.log('🚀 RADAR DEBUG: Location not available, using default location');
          await useDefaultLocationFallback(user.id);
        }
      }
    } catch (error) {
      console.error('🚀 RADAR DEBUG: Error initializing radar:', error);
      // Even if there's an error, try to show users with default location
      if (currentUser) {
        await useDefaultLocationFallback(currentUser.id);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const useDefaultLocationFallback = async (userId: string) => {
    try {
      console.log('🚀 RADAR DEBUG: Using default location fallback');
      const defaultLocation = getRandomDefaultLocation();
      console.log('🚀 RADAR DEBUG: Generated default location:', defaultLocation);
      
      setCurrentLocation(defaultLocation);
      setUseDefaultLocation(true);
      setLocationPermission({ granted: false, denied: false, pending: false });
      
      // Save default location to profile if not exists
      try {
        await saveUserLocation(userId, defaultLocation);
        console.log('🚀 RADAR DEBUG: Default location saved to profile');
      } catch (error) {
        console.warn('🚀 RADAR DEBUG: Could not save default location:', error);
      }
      
      // Load users with default location
      await loadNearbyUsersWithFallback(userId, defaultLocation);
    } catch (error) {
      console.error('🚀 RADAR DEBUG: Error using default location:', error);
    }
  };

  // Enhanced function to load nearby users with better fallback logic
  const loadNearbyUsersWithFallback = async (currentUserId: string, location: UserLocation) => {
    try {
      console.log('🔄 RADAR DEBUG: Starting loadNearbyUsersWithFallback');
      console.log('🔄 RADAR DEBUG: Current user ID:', currentUserId);
      console.log('🔄 RADAR DEBUG: Location:', location);
      
      if (!isUpdatingUsers) {
        setIsLoading(true);
      }

      // First try the location-based approach
      console.log('🔄 RADAR DEBUG: Calling getNearbyUsers...');
      let result = await getNearbyUsers(currentUserId, location, 50, 20);
      
      console.log('🔄 RADAR DEBUG: getNearbyUsers result:', result);
      
      const shouldUseFallback = !result.success || !result.users || result.users.length === 0;
      console.log('🔄 RADAR DEBUG: Should use fallback?', shouldUseFallback);
      
      if (shouldUseFallback) {
        console.log('🔄 RADAR DEBUG: No location-based users found, loading all users as fallback');
        
        // Fallback: Get all users and simulate distances
        const { data: profiles, error } = await supabase
          .from('profiles')
          .select('*')
          .neq('id', currentUserId)
          .not('name', 'is', null)
          .not('bio', 'is', null)
          .limit(20);

        console.log('🔄 RADAR DEBUG: Fallback profiles from database:', profiles);
        console.log('🔄 RADAR DEBUG: Fallback database error:', error);

        if (error) {
          console.error('Error loading fallback users:', error);
          if (mountedRef.current) {
            setUsers([]);
          }
          return;
        }

        // Transform profiles and assign random distances within 1km
        const transformedUsers: User[] = (profiles || []).map(profile => {
          const user = transformProfileToUser(profile);
          
          // If user has location, calculate real distance
          if (profile.latitude && profile.longitude) {
            user.distance = calculateDistance(
              location.latitude,
              location.longitude,
              profile.latitude,
              profile.longitude
            );
            console.log(`🔄 RADAR DEBUG: Real distance for ${user.name}: ${user.distance}km`);
          } else {
            // Assign random distance within 1km for users without location
            user.distance = Math.random() * 1; // 0-1km
            console.log(`🔄 RADAR DEBUG: Random distance for ${user.name}: ${user.distance}km`);
          }
          
          return user;
        }).filter(user => {
          const withinRange = user.distance <= 1;
          console.log(`🔄 RADAR DEBUG: User ${user.name} within 1km range: ${withinRange}`);
          return withinRange;
        }) // Only show users within 1km
          .sort((a, b) => a.distance - b.distance); // Sort by distance

        console.log('🔄 RADAR DEBUG: Final transformed users (fallback):', transformedUsers);

        if (mountedRef.current) {
          setUsers(transformedUsers);
          console.log(`🔄 RADAR DEBUG: Set ${transformedUsers.length} users (fallback mode)`);
        }
      } else {
        // Use location-based results - FIXED: Proper type checking
        console.log('🔄 RADAR DEBUG: Using location-based results');
        
        // Ensure result.users exists and is an array before mapping
        if (result.success && result.users && Array.isArray(result.users)) {
          const transformedUsers: User[] = result.users.map(profile => ({
            ...transformProfileToUser(profile),
            distance: profile.distance
          }));

          console.log('🔄 RADAR DEBUG: Final transformed users (location-based):', transformedUsers);

          if (mountedRef.current) {
            setUsers(transformedUsers);
            console.log(`🔄 RADAR DEBUG: Set ${transformedUsers.length} users (location-based)`);
          }
        } else {
          console.warn('🔄 RADAR DEBUG: result.users is not a valid array, falling back to empty array');
          if (mountedRef.current) {
            setUsers([]);
          }
        }
      }
    } catch (error) {
      console.error('🔄 RADAR DEBUG: Error in loadNearbyUsersWithFallback:', error);
      if (mountedRef.current) {
        setUsers([]);
      }
    } finally {
      if (mountedRef.current && !isUpdatingUsers) {
        setIsLoading(false);
      }
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
        await loadNearbyUsersWithFallback(currentUser.id, location);
        
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
    return loadNearbyUsersWithFallback(currentUserId, location);
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
        setUseDefaultLocation(false);
        
        // Load nearby users with the new location
        await loadNearbyUsers(currentUser.id, result.location);
        
        // Start location tracking for dynamic updates
        startLocationTracking(currentUser.id);
      } else {
        console.error('Failed to get location:', result.error);
        setLocationError(result.error || 'Failed to get location');
        
        // Use default location as fallback
        await useDefaultLocationFallback(currentUser.id);
        
        // Update permission status based on error
        if (result.error?.includes('denied')) {
          setLocationPermission({ granted: false, denied: true, pending: false });
        }
      }
    } catch (error) {
      console.error('Location request error:', error);
      setLocationError('Failed to get location. Using approximate location.');
      
      // Use default location as fallback
      await useDefaultLocationFallback(currentUser.id);
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
    if (isGeolocationSupported() && isSecureContext()) {
      setShowLocationModal(true);
    } else {
      // Just refresh with default location
      handleRefreshLocation();
    }
  };

  const handleRefreshLocation = async () => {
    if (!currentUser || isRequestingLocation) return;
    
    setLocationError(null);
    
    if (isGeolocationSupported() && isSecureContext()) {
      await handleRequestLocation();
    } else {
      // Refresh with new default location
      await useDefaultLocationFallback(currentUser.id);
    }
  };

  const handleEnablePreciseLocation = () => {
    setShowLocationModal(true);
  };

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
                  <MapPinIcon className={`w-4 h-4 ${
                    isLocationTracking ? 'text-green-500' : 
                    useDefaultLocation ? 'text-yellow-500' : 'text-gray-500'
                  }`} />
                  <span className={`text-xs ${
                    isLocationTracking ? 'text-green-400' : 
                    useDefaultLocation ? 'text-yellow-400' : 'text-gray-400'
                  }`}>
                    {isLocationTracking ? 'Live tracking' : 
                     useDefaultLocation ? 'Approximate location' : 'Static location'}
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
      {useDefaultLocation && (
        <div className="px-4 py-2 bg-yellow-900/20 border-b border-yellow-700/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
              <span className="text-xs text-yellow-400">
                Using approximate location - enable precise location for better results
              </span>
            </div>
            {isGeolocationSupported() && isSecureContext() && (
              <button
                onClick={handleEnablePreciseLocation}
                className="text-xs text-blue-400 hover:text-blue-300 underline"
              >
                Enable
              </button>
            )}
          </div>
        </div>
      )}

      {isLocationTracking && (
        <div className="px-4 py-2 bg-green-900/20 border-b border-green-700/30">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-xs text-green-400">
              Precise location tracking active - radar updates automatically as you move
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
              Try refreshing or check back later for new connections!
            </p>
            {useDefaultLocation && (
              <div className="mt-4">
                <button
                  onClick={handleEnablePreciseLocation}
                  className="text-blue-400 hover:text-blue-300 text-sm underline"
                >
                  Enable precise location for better results
                </button>
              </div>
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