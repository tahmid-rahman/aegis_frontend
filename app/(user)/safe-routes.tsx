// app/user/safe-routes.tsx
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, RefreshControl, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { useAuth } from '../../providers/AuthProvider';
import { useTheme } from '../../providers/ThemeProvider';
import { api } from '../../services/api';

interface SafeLocation {
  id: string;
  name: string;
  address: string;
  location_type: string;
  latitude?: number;
  longitude?: number;
  created_at: string;
  icon?: string;
}

interface EmergencyLocation {
  id: number;
  location: string;
  type: string;
  timestamp: string;
  lat: number;
  lng: number;
}

interface SafeRoute {
  route_id: string;
  destination: string;
  distance: string;
  duration: string;
  safety_rating: number;
  features: string[];
  avoided_locations: {
    address: string;
    type: string;
    lat: number;
    lng: number;
  }[];
  waypoints: string[];
  route_path: number[][];
  start_location: number[];
  end_location: number[];
  bounds?: number[];
}

interface LocationCoords {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

export default function SafeRoutes() {
  const router = useRouter();
  const { user } = useAuth();
  const { effectiveTheme } = useTheme();
  
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null);
  const [liveSharing, setLiveSharing] = useState(false);
  const [destination, setDestination] = useState('');
  const [isFindingRoute, setIsFindingRoute] = useState(false);
  const [safeLocations, setSafeLocations] = useState<SafeLocation[]>([]);
  const [emergencyHistory, setEmergencyHistory] = useState<EmergencyLocation[]>([]);
  const [safeRoutes, setSafeRoutes] = useState<SafeRoute[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingLocation, setIsAddingLocation] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<LocationCoords | null>(null);
  const [locationPermission, setLocationPermission] = useState<boolean>(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [selectedRouteData, setSelectedRouteData] = useState<SafeRoute | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Debug state
  const [debugInfo, setDebugInfo] = useState<string>('');

  // Load initial data and get location
  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      setIsLoading(true);
      await requestLocationPermission();
      await loadInitialData();
    } catch (error) {
      console.log('Error initializing app:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const requestLocationPermission = async () => {
    try {
      setIsGettingLocation(true);
      setDebugInfo('Requesting location permission...');
      
      let { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status === 'granted') {
        setLocationPermission(true);
        setDebugInfo('Location permission granted');
        await getCurrentLocation();
      } else {
        setLocationPermission(false);
        setDebugInfo('Location permission denied');
        // Set default location (Dhaka)
        setCurrentLocation({
          latitude: 23.8103,
          longitude: 90.4125,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        });
        
        Alert.alert(
          'Location Permission Required',
          'Safe Routes needs location access to find routes from your current location.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.log('Error requesting location permission:', error);
      setLocationPermission(false);
      setDebugInfo('Location permission error');
    } finally {
      setIsGettingLocation(false);
    }
  };

  const getCurrentLocation = async () => {
    try {
      setIsGettingLocation(true);
      setDebugInfo('Getting current location...');
      
      let location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const newLocation = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };

      setCurrentLocation(newLocation);
      setDebugInfo(`Location: ${newLocation.latitude}, ${newLocation.longitude}`);

      console.log('Current location:', location.coords);
    } catch (error) {
      console.log('Error getting current location:', error);
      setDebugInfo('Failed to get location, using default');
      // Set default to Dhaka if location fails
      setCurrentLocation({
        latitude: 23.8103,
        longitude: 90.4125,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });
    } finally {
      setIsGettingLocation(false);
    }
  };

  const loadInitialData = async () => {
    try {
      setRefreshing(true);
      setDebugInfo('Loading initial data...');
      
      // Load safe locations
      await loadSafeLocations();
      
      // Load emergency history
      await loadEmergencyHistory();
      
      setDebugInfo('Data loaded successfully');
    } catch (error) {
      console.log('Error loading initial data:', error);
      setDebugInfo('Error loading data');
    } finally {
      setRefreshing(false);
    }
  };

  const loadSafeLocations = async () => {
    try {
      console.log('Loading safe locations...');
      const response = await api.get('/aegis/safe-locations/');
      console.log('Safe locations API response:', response.data);
      
      if (response.data.success) {
        setSafeLocations(response.data.data || []);
        console.log(`Loaded ${response.data.data?.length || 0} safe locations`);
      } else {
        console.log('Safe locations API error:', response.data.error);
        setSafeLocations([]);
      }
    } catch (error: any) {
      console.log('Error loading safe locations:', error);
      console.log('Error details:', error.response?.data);
      setSafeLocations([]);
    }
  };

  const loadEmergencyHistory = async () => {
    try {
      console.log('Loading emergency history...');
      const response = await api.get('/aegis/emergency-history-location/');
      console.log('Emergency history API response:', response.data);
      
      if (response.data.success) {
        setEmergencyHistory(response.data.data || []);
        console.log(`Loaded ${response.data.data?.length || 0} emergency locations`);
      } else {
        console.log('Emergency history API error:', response.data.error);
        setEmergencyHistory([]);
      }
    } catch (error: any) {
      console.log('Error loading emergency history:', error);
      console.log('Error details:', error.response?.data);
      setEmergencyHistory([]);
    }
  };

  const handleFindSafeRoute = async () => {
    if (!destination.trim()) {
      Alert.alert("Destination Required", "Please enter your destination to find a safe route.");
      return;
    }

    if (!currentLocation) {
      Alert.alert("Location Required", "Please allow location access to find routes from your current location.");
      await requestLocationPermission();
      return;
    }

    setIsFindingRoute(true);
    setDebugInfo('Finding safe route...');
    
    try {
      const payload = {
        destination: destination.trim(),
        current_lat: currentLocation.latitude,
        current_lng: currentLocation.longitude
      };

      console.log('Sending route request with payload:', payload);
      
      const response = await api.post('/aegis/find-safe-route/', payload);
      console.log('Find route API response:', response.data);

      if (response.data.success) {
        const routeData = response.data.data;
        console.log('Route data received:', routeData);
        
        setSafeRoutes([routeData]);
        setSelectedRoute(routeData.route_id);
        setSelectedRouteData(routeData);
        setDebugInfo(`Route found to ${routeData.destination}`);
        
        Alert.alert(
          "Safe Route Found", 
          `Found a route to ${routeData.destination} that avoids ${routeData.avoided_locations?.length || 0} high-risk areas.`,
          [{ text: "OK" }]
        );
      } else {
        const errorMsg = response.data.error || "Failed to find route";
        setDebugInfo(`Route error: ${errorMsg}`);
        Alert.alert("Error", errorMsg);
      }
    } catch (error: any) {
      console.log('Error finding route:', error);
      const errorDetails = error.response?.data;
      console.log('Error details:', errorDetails);
      
      const errorMessage = errorDetails?.error || error.message || "Failed to find route. Please try again.";
      setDebugInfo(`Route error: ${errorMessage}`);
      Alert.alert("Error", errorMessage);
    } finally {
      setIsFindingRoute(false);
    }
  };

  const handleSetDestination = (locationName: string, locationAddress: string) => {
    setDestination(locationAddress);
    Alert.alert("Destination Set", `${locationName} has been set as your destination.`);
  };

  const handleStartNavigation = async (routeId: string) => {
    const route = safeRoutes.find(r => r.route_id === routeId);
    
    if (!route) {
      Alert.alert("Error", "Route not found");
      return;
    }

    Alert.alert(
      "Start Safe Navigation",
      `Start navigation to ${route.destination}? This route avoids ${route.avoided_locations.length} high-risk areas.`,
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Start Navigation",
          onPress: async () => {
            try {
              setDebugInfo('Starting navigation...');
              const response = await api.post('/aegis/start-navigation/', { 
                route_id: routeId 
              });

              console.log('Start navigation response:', response.data);

              if (response.data.success) {
                setSelectedRoute(routeId);
                setLiveSharing(true);
                setDebugInfo('Navigation started');
                Alert.alert(
                  "Safe Navigation Started", 
                  response.data.message || "Navigation started successfully!",
                  [{ text: "OK" }]
                );
              } else {
                setDebugInfo(`Navigation error: ${response.data.error}`);
                Alert.alert("Error", response.data.error || "Failed to start navigation");
              }
            } catch (error: any) {
              console.log('Error starting navigation:', error);
              const errorMsg = error.response?.data?.error || error.message || "Failed to start navigation";
              setDebugInfo(`Navigation error: ${errorMsg}`);
              Alert.alert("Error", errorMsg);
            }
          }
        }
      ]
    );
  };

  const handleViewRouteOnMap = (route: SafeRoute) => {
    setSelectedRouteData(route);
    setShowMap(true);
  };

  const handleAddSafeLocation = async (locationData: {
    name: string;
    address: string;
    location_type: string;
    latitude?: number;
    longitude?: number;
  }) => {
    try {
      setIsAddingLocation(true);
      setDebugInfo('Adding safe location...');
      
      console.log('Creating safe location with data:', locationData);
      
      // Prepare payload matching backend serializer
      const payload: any = {
        name: locationData.name.trim(),
        address: locationData.address.trim(),
        location_type: locationData.location_type,
      };

      // Only include coordinates if they exist
      if (locationData.latitude && locationData.longitude) {
        payload.latitude = locationData.latitude.toString();
        payload.longitude = locationData.longitude.toString();
      }

      console.log('Sending location payload:', payload);
      
      const response = await api.post('/aegis/safe-locations/create/', payload);
      console.log('Create location response:', response.data);

      if (response.data.success) {
        setDebugInfo('Location added successfully');
        Alert.alert("Success", "Safe location added successfully");
        
        // Refresh safe locations list
        await loadSafeLocations();
      } else {
        const errorMsg = response.data.errors ? 
          Object.values(response.data.errors).flat().join(', ') : 
          response.data.error || "Failed to add location";
        
        setDebugInfo(`Location error: ${errorMsg}`);
        Alert.alert("Error", errorMsg);
      }
    } catch (error: any) {
      console.log('Error creating safe location:', error);
      const errorDetails = error.response?.data;
      console.log('Error details:', errorDetails);
      
      const errorMsg = errorDetails?.error || errorDetails?.errors || error.message || "Failed to add location";
      setDebugInfo(`Location error: ${errorMsg}`);
      Alert.alert("Error", errorMsg);
    } finally {
      setIsAddingLocation(false);
    }
  };

  const handleAddCurrentLocation = async () => {
    if (!locationPermission) {
      Alert.alert("Location Access Required", "Please allow location access to add your current location.");
      await requestLocationPermission();
      return;
    }

    if (!currentLocation) {
      Alert.alert("Location Not Available", "Unable to get your current location. Please try again.");
      return;
    }

    try {
      setDebugInfo('Getting address for current location...');
      const address = await reverseGeocode(currentLocation.latitude, currentLocation.longitude);
      
      Alert.prompt(
        "Add Current Location",
        `Save your current location as a safe place?\n\nAddress: ${address}`,
        [
          {
            text: "Cancel",
            style: "cancel"
          },
          {
            text: "Save",
            onPress: async (name) => {
              if (name && name.trim()) {
                await handleAddSafeLocation({
                  name: name.trim(),
                  address: address,
                  location_type: 'other',
                  latitude: currentLocation.latitude,
                  longitude: currentLocation.longitude
                });
              } else {
                Alert.alert("Error", "Please enter a name for this location");
              }
            }
          }
        ],
        'plain-text',
        'My Current Location'
      );
    } catch (error) {
      console.log('Error getting address:', error);
      setDebugInfo('Error getting address');
      Alert.alert("Error", "Failed to get address from your location");
    }
  };

  const handleAddDestinationLocation = () => {
    if (!destination.trim()) {
      Alert.alert("Error", "Please enter a destination first");
      return;
    }

    Alert.prompt(
      "Add Safe Location",
      `Save this destination as a safe location?\n\nAddress: ${destination}`,
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Save",
          onPress: async (name) => {
            if (name && name.trim()) {
              await handleAddSafeLocation({
                name: name.trim(),
                address: destination.trim(),
                location_type: 'other'
              });
            } else {
              Alert.alert("Error", "Please enter a name for this location");
            }
          }
        }
      ],
      'plain-text',
      'My Destination'
    );
  };

  const handleQuickAddLocation = (type: string) => {
    const quickLocations = {
      home: { name: 'Home', icon: '🏠', address: 'Enter your home address' },
      work: { name: 'Work', icon: '🏢', address: 'Enter your work address' },
      education: { name: 'University', icon: '🎓', address: 'Enter your university address' },
      family: { name: "Family", icon: '👨‍👩‍👧', address: 'Enter family address' }
    };

    const location = quickLocations[type as keyof typeof quickLocations];
    
    if (!location) {
      Alert.alert("Error", "Invalid location type");
      return;
    }

    Alert.prompt(
      `Add ${location.name}`,
      `Enter your ${location.name.toLowerCase()} address:`,
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Save",
          onPress: async (address) => {
            if (address && address.trim()) {
              await handleAddSafeLocation({
                name: location.name,
                address: address.trim(),
                location_type: type
              });
            } else {
              Alert.alert("Error", `Please enter your ${location.name.toLowerCase()} address`);
            }
          }
        }
      ],
      'plain-text',
      location.address
    );
  };

  const reverseGeocode = async (latitude: number, longitude: number): Promise<string> => {
    try {
      setDebugInfo('Reverse geocoding...');
      const response = await api.post('/aegis/reverse-geocode/', {
        latitude,
        longitude
      });

      console.log('Reverse geocode response:', response.data);

      if (response.data.success) {
        return response.data.data.address;
      }
      return `Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;
    } catch (error) {
      console.log('Error reverse geocoding:', error);
      return `Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;
    }
  };

  const getLocationIcon = (type: string) => {
    const iconMap: { [key: string]: string } = {
      'home': '🏠',
      'work': '🏢',
      'education': '🎓',
      'family': '👨‍👩‍👧',
      'other': '📍'
    };
    return iconMap[type] || '📍';
  };

  const getEmergencyTypeColor = (type: string) => {
    const colorMap: { [key: string]: string } = {
      'harassment': 'bg-red-500',
      'robbery': 'bg-orange-500',
      'assault': 'bg-purple-500',
      'medical': 'bg-blue-500',
      'fire': 'bg-yellow-500',
      'general': 'bg-gray-500'
    };
    return colorMap[type] || 'bg-gray-500';
  };

  const formatAddress = (address: string, maxLength: number = 25) => {
    return address.length > maxLength ? `${address.substring(0, maxLength)}...` : address;
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-background justify-center items-center">
        <ActivityIndicator size="large" color="rgb(var(--color-primary))" />
        <Text className="text-on-surface mt-4">Loading safe routes...</Text>
        {debugInfo ? <Text className="text-on-surface-variant mt-2 text-xs">{debugInfo}</Text> : null}
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <ScrollView 
        className="flex-1" 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={loadInitialData}
            colors={['rgb(var(--color-primary))']}
          />
        }
      >
        {/* Header */}
        <View className="px-6 pt-6 pb-4">
          <View className="flex-row items-center mb-2">
            <TouchableOpacity 
              onPress={() => router.back()}
              className="p-2 rounded-full bg-surface-variant mr-3"
            >
              <Text className="text-lg">←</Text>
            </TouchableOpacity>
            <View className="flex-1">
              <Text className="text-headline text-on-surface">Safe Routes</Text>
              <Text className="text-body text-on-surface-variant">
                Smart routing that avoids previous emergency locations
              </Text>
            </View>
            <TouchableOpacity 
              onPress={getCurrentLocation}
              disabled={isGettingLocation}
              className="p-2 rounded-full bg-surface-variant"
            >
              {isGettingLocation ? (
                <ActivityIndicator size="small" color="rgb(var(--color-primary))" />
              ) : (
                <Text className="text-lg">📍</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Debug Info - Remove in production */}
          {__DEV__ && debugInfo ? (
            <View className="bg-blue-500/10 p-2 rounded-lg mt-2">
              <Text className="text-blue-500 text-xs">{debugInfo}</Text>
            </View>
          ) : null}

          {!locationPermission && (
            <View className="bg-yellow-500/20 p-3 rounded-lg mt-2">
              <Text className="text-yellow-500 text-sm">
                Location access required for accurate route planning
              </Text>
              <TouchableOpacity onPress={requestLocationPermission} className="mt-2">
                <Text className="text-yellow-500 text-sm font-semibold">Grant Permission</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Destination Input */}
        <View className="px-6 mb-6">
          <Text className="text-title text-on-surface mb-3">Enter Destination</Text>
          <View className="flex-row">
            <TextInput
              className="flex-1 bg-surface-variant rounded-l-xl p-4 text-on-surface border border-outline"
              placeholder="Where do you want to go?"
              placeholderTextColor="rgb(var(--color-on-surface-variant))"
              value={destination}
              onChangeText={setDestination}
              onSubmitEditing={handleFindSafeRoute}
              returnKeyType="search"
            />
            <TouchableOpacity
              className="bg-primary px-6 rounded-r-xl justify-center"
              onPress={handleFindSafeRoute}
              disabled={isFindingRoute || !destination.trim()}
            >
              {isFindingRoute ? (
                <ActivityIndicator size="small" color="rgb(var(--color-on-primary))" />
              ) : (
                <Text className="text-on-primary font-semibold">Find Route</Text>
              )}
            </TouchableOpacity>
          </View>
          {!locationPermission && (
            <Text className="text-red-500 text-sm mt-2">
              Please allow location access to find routes
            </Text>
          )}
        </View>

        {/* Safe Locations */}
        <View className="px-6 mb-6">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-title text-on-surface">My Safe Locations</Text>
            <TouchableOpacity 
              className="bg-primary/20 px-3 py-1 rounded-full"
              onPress={() => {
                Alert.alert(
                  "Add Safe Location",
                  "How would you like to add a safe location?",
                  [
                    {
                      text: "Use Current Location",
                      onPress: handleAddCurrentLocation
                    },
                    {
                      text: "Use Destination",
                      onPress: handleAddDestinationLocation
                    },
                    {
                      text: "Quick Add",
                      onPress: () => {
                        Alert.alert(
                          "Quick Add",
                          "Select location type:",
                          [
                            { text: "🏠 Home", onPress: () => handleQuickAddLocation('home') },
                            { text: "🏢 Work", onPress: () => handleQuickAddLocation('work') },
                            { text: "🎓 University", onPress: () => handleQuickAddLocation('education') },
                            { text: "👨‍👩‍👧 Family", onPress: () => handleQuickAddLocation('family') },
                            { text: "Cancel", style: "cancel" }
                          ]
                        );
                      }
                    },
                    {
                      text: "Cancel",
                      style: "cancel"
                    }
                  ]
                );
              }}
              disabled={isAddingLocation}
            >
              {isAddingLocation ? (
                <ActivityIndicator size="small" color="rgb(var(--color-primary))" />
              ) : (
                <Text className="text-primary text-sm">+ Add</Text>
              )}
            </TouchableOpacity>
          </View>
          
          {safeLocations.length === 0 ? (
            <View className="bg-surface-variant rounded-xl p-6 items-center">
              <Text className="text-on-surface-variant text-center mb-2">
                No safe locations yet
              </Text>
              <Text className="text-label text-on-surface-variant text-center">
                Add your frequently visited places for quick route planning
              </Text>
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="space-x-3">
              {safeLocations.map((location) => (
                <TouchableOpacity 
                  key={location.id} 
                  className="bg-surface-variant w-32 p-4 rounded-xl items-center"
                  onPress={() => handleSetDestination(location.name, location.address)}
                >
                  <View className="p-3 rounded-full mb-2 bg-primary/20">
                    <Text className="text-lg text-primary">
                      {location.icon || getLocationIcon(location.location_type)}
                    </Text>
                  </View>
                  <Text className="text-on-surface font-medium text-center">{location.name}</Text>
                  <Text className="text-label text-on-surface-variant text-center mt-1 text-xs">
                    {formatAddress(location.address)}
                  </Text>
                  <TouchableOpacity 
                    className="mt-2 px-2 py-1 rounded-full bg-primary/10"
                    onPress={() => handleSetDestination(location.name, location.address)}
                  >
                    <Text className="text-xs text-primary">
                      Set as Destination
                    </Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
              
              {/* Add New Location Button */}
              <TouchableOpacity 
                className="bg-surface-variant w-32 p-4 rounded-xl items-center justify-center border-2 border-dashed border-outline"
                onPress={() => {
                  Alert.alert(
                    "Add Safe Location",
                    "How would you like to add a safe location?",
                    [
                      {
                        text: "Use Current Location",
                        onPress: handleAddCurrentLocation
                      },
                      {
                        text: "Use Destination",
                        onPress: handleAddDestinationLocation
                      },
                      {
                        text: "Cancel",
                        style: "cancel"
                      }
                    ]
                  );
                }}
                disabled={isAddingLocation}
              >
                {isAddingLocation ? (
                  <ActivityIndicator size="small" color="rgb(var(--color-on-surface-variant))" />
                ) : (
                  <>
                    <Text className="text-2xl mb-2 text-on-surface-variant">+</Text>
                    <Text className="text-on-surface-variant text-center text-sm">Add Safe Location</Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>

        {/* Safe Routes */}
        <View className="px-6 mb-8">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-title text-on-surface">
              {safeRoutes.length > 0 ? 'Recommended Safe Routes' : 'Find a Safe Route'}
            </Text>
            <TouchableOpacity onPress={loadInitialData} disabled={refreshing}>
              <Text className="text-primary">Refresh</Text>
            </TouchableOpacity>
          </View>

          <View className="space-y-4">
            {safeRoutes.length > 0 ? (
              safeRoutes.map((route) => (
                <View key={route.route_id} className="bg-surface-variant rounded-xl p-4">
                  <View className="flex-row justify-between items-start mb-2">
                    <View className="flex-1">
                      <Text className="text-on-surface font-semibold">Safe Route to {route.destination}</Text>
                      <Text className="text-label text-on-surface-variant">{formatAddress(route.destination, 35)}</Text>
                    </View>
                    <View className="bg-primary/20 px-2 py-1 rounded-full">
                      <Text className="text-primary text-xs">⭐ {route.safety_rating.toFixed(1)}</Text>
                    </View>
                  </View>

                  <View className="flex-row justify-between mb-3">
                    <Text className="text-label text-on-surface-variant">🚗 {route.distance}</Text>
                    <Text className="text-label text-on-surface-variant">⏱️ {route.duration}</Text>
                  </View>

                  {route.avoided_locations.length > 0 && (
                    <View className="mb-3">
                      <Text className="text-on-surface text-sm font-medium mb-1">✅ Avoiding:</Text>
                      <View className="flex-row flex-wrap">
                        {route.avoided_locations.slice(0, 3).map((location, index) => (
                          <View key={index} className="bg-green-500/10 px-2 py-1 rounded-full mr-2 mb-2">
                            <Text className="text-green-500 text-xs">
                              ✓ {formatAddress(location.address.split(',')[0], 15)}
                            </Text>
                          </View>
                        ))}
                        {route.avoided_locations.length > 3 && (
                          <View className="bg-green-500/10 px-2 py-1 rounded-full mr-2 mb-2">
                            <Text className="text-green-500 text-xs">
                              +{route.avoided_locations.length - 3} more
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                  )}

                  <View className="flex-row space-x-2">
                    <TouchableOpacity
                      className="flex-1 p-3 rounded-lg bg-primary"
                      onPress={() => handleStartNavigation(route.route_id)}
                    >
                      <Text className="text-on-primary text-center font-medium">
                        Start Navigation
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      className="p-3 rounded-lg bg-secondary"
                      onPress={() => handleViewRouteOnMap(route)}
                    >
                      <Text className="text-on-secondary text-center font-medium">
                        View Map
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            ) : (
              <View className="bg-surface-variant rounded-xl p-6 items-center">
                <Text className="text-on-surface-variant text-center mb-2">
                  {locationPermission 
                    ? "Enter a destination to find safe routes that avoid your emergency locations"
                    : "Allow location access and enter a destination to find safe routes"
                  }
                </Text>
                <Text className="text-label text-on-surface-variant text-center">
                  We'll automatically avoid areas where you've previously had emergencies
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Emergency History */}
        <View className="px-6 mb-8">
          <Text className="text-title text-on-surface mb-3">Recent Emergency Locations</Text>
          <View className="bg-surface-variant rounded-xl p-4">
            <Text className="text-on-surface-variant text-sm mb-3">
              These locations are automatically avoided in your routes:
            </Text>
            {emergencyHistory.length > 0 ? (
              <>
                {emergencyHistory.slice(0, 3).map((emergency, index) => (
                  <View key={emergency.id} className={`flex-row items-center py-2 ${index < 2 ? 'border-b border-outline' : ''}`}>
                    <View 
                      className={`w-3 h-3 rounded-full mr-3 ${getEmergencyTypeColor(emergency.type)}`} 
                    />
                    <View className="flex-1">
                      <Text className="text-on-surface">{formatAddress(emergency.location, 30)}</Text>
                      <Text className="text-label text-on-surface-variant">
                        {emergency.type} • {emergency.timestamp}
                      </Text>
                    </View>
                  </View>
                ))}
                {emergencyHistory.length > 3 && (
                  <TouchableOpacity className="pt-2" onPress={loadInitialData}>
                    <Text className="text-primary text-center">
                      View all {emergencyHistory.length} locations
                    </Text>
                  </TouchableOpacity>
                )}
              </>
            ) : (
              <Text className="text-on-surface-variant text-center py-4">
                No emergency locations found. Your routes will use standard safety measures.
              </Text>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Map Modal */}
      <Modal
        visible={showMap}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowMap(false)}
      >
        <View className="flex-1 bg-background">
          <View className="px-6 pt-6 pb-4 bg-surface border-b border-outline">
            <View className="flex-row items-center justify-between">
              <Text className="text-headline text-on-surface">Route Map</Text>
              <TouchableOpacity 
                onPress={() => setShowMap(false)}
                className="p-2 rounded-full bg-surface-variant"
              >
                <Text className="text-lg">✕</Text>
              </TouchableOpacity>
            </View>
            {selectedRouteData && (
              <Text className="text-body text-on-surface-variant mt-2">
                Route to {selectedRouteData.destination} • {selectedRouteData.distance} • {selectedRouteData.duration}
              </Text>
            )}
          </View>
          
          {selectedRouteData && currentLocation && (
            <MapView
              className="flex-1"
              initialRegion={currentLocation}
              region={currentLocation}
              showsUserLocation={true}
              showsMyLocationButton={true}
              showsCompass={true}
              showsScale={true}
            >
              {/* Route Polyline */}
              {selectedRouteData.route_path && selectedRouteData.route_path.length > 0 && (
                <Polyline
                  coordinates={selectedRouteData.route_path.map(coord => ({
                    latitude: coord[1],
                    longitude: coord[0],
                  }))}
                  strokeColor="#007AFF"
                  strokeWidth={5}
                  lineCap="round"
                  lineJoin="round"
                />
              )}
              
              {/* Start Marker */}
              <Marker
                coordinate={{
                  latitude: currentLocation.latitude,
                  longitude: currentLocation.longitude,
                }}
                title="Start Location"
                description="Your current location"
                pinColor="blue"
              />
              
              {/* End Marker */}
              {selectedRouteData.end_location && (
                <Marker
                  coordinate={{
                    latitude: selectedRouteData.end_location[1],
                    longitude: selectedRouteData.end_location[0],
                  }}
                  title="Destination"
                  description={selectedRouteData.destination}
                  pinColor="green"
                />
              )}
              
              {/* Avoided Locations */}
              {selectedRouteData.avoided_locations.map((location, index) => (
                <Marker
                  key={index}
                  coordinate={{
                    latitude: location.lat,
                    longitude: location.lng,
                  }}
                  title={`Avoided: ${location.type}`}
                  description={formatAddress(location.address, 40)}
                  pinColor="red"
                />
              ))}
            </MapView>
          )}
        </View>
      </Modal>

      {/* Live Sharing Indicator */}
      {liveSharing && (
        <View className="absolute top-4 right-4 bg-primary/90 px-3 py-2 rounded-full">
          <Text className="text-on-primary text-sm">📍 Safe Route Active</Text>
        </View>
      )}
    </View>
  );
}