// app/user/safe-routes.tsx
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { useAuth } from '../../providers/AuthProvider';
import { useTheme } from '../../providers/ThemeProvider';
import { api } from '../../services/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Types
interface SafeLocation {
  id: number;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  location_type: string;
  icon: string;
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
  id: number;
  destination: string;
  distance: string;
  duration: string;
  safety_rating?: number;
  features?: string[];
  avoided_locations: any[];
  waypoints?: string[];
  route_path: number[][];
  start_location: number[];
  end_location: number[];
  bounds?: number[];
  geojson?: any;
  summary?: any;
}

export default function SafeRoutes() {
  const router = useRouter();
  const { effectiveTheme } = useTheme();
  const { user } = useAuth();
  
  const [selectedRoute, setSelectedRoute] = useState<SafeRoute | null>(null);
  const [liveSharing, setLiveSharing] = useState(false);
  const [destination, setDestination] = useState('');
  const [isFindingRoute, setIsFindingRoute] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [safeLocations, setSafeLocations] = useState<SafeLocation[]>([]);
  const [emergencyHistory, setEmergencyHistory] = useState<EmergencyLocation[]>([]);
  const [safeRoutes, setSafeRoutes] = useState<SafeRoute[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  
  const [mapRegion, setMapRegion] = useState({
    latitude: 23.8103,
    longitude: 90.4125,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });

  // Get current location with better error handling
  const getCurrentLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Location Permission Required',
          'Safe routing requires location access to find the best routes for you.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Enable', onPress: () => Location.requestForegroundPermissionsAsync() }
          ]
        );
        return null;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      
      const { latitude, longitude } = location.coords;
      const newLocation = { lat: latitude, lng: longitude };
      
      setCurrentLocation(newLocation);
      setMapRegion({
        latitude,
        longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      });
      
      return newLocation;
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Location Error', 'Unable to get your current location. Please try again.');
      return null;
    }
  };

  // Load initial data
  const loadInitialData = async () => {
    try {
      setIsLoading(true);
      await getCurrentLocation();
      await Promise.all([
        fetchSafeLocations(),
        fetchEmergencyHistory(),
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load initial data');
    } finally {
      setIsLoading(false);
    }
  };

  // Pull to refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await loadInitialData();
    setRefreshing(false);
  };

  // Fetch safe locations
  const fetchSafeLocations = async () => {
    try {
      const response = await api.get('/aegis/safe-locations/');
      if (response.data.success) {
        const locationsWithIcons = response.data.data.map((loc: any) => ({
          ...loc,
          icon: getLocationIcon(loc.location_type),
          latitude: parseFloat(loc.latitude),
          longitude: parseFloat(loc.longitude),
        }));
        setSafeLocations(locationsWithIcons);
      }
    } catch (error) {
      console.error('Error fetching safe locations:', error);
    }
  };

  // Fetch emergency history
  const fetchEmergencyHistory = async () => {
    try {
      const response = await api.get('/aegis/emergency-history-location/');
      if (response.data.success) {
        setEmergencyHistory(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching emergency history:', error);
    }
  };

  // Process route path for map display
  const processRoutePath = (routePath: number[][]) => {
    if (!routePath || routePath.length === 0) return [];
    
    return routePath.map(coord => ({
      latitude: coord[1],
      longitude: coord[0],
    }));
  };

  // Calculate map region to fit route
  const calculateMapRegionForRoute = (routePath: number[][]) => {
    if (!routePath || routePath.length === 0) return null;

    const latitudes = routePath.map(coord => coord[1]);
    const longitudes = routePath.map(coord => coord[0]);
    
    const minLat = Math.min(...latitudes);
    const maxLat = Math.max(...latitudes);
    const minLng = Math.min(...longitudes);
    const maxLng = Math.max(...longitudes);
    
    const padding = 0.01;
    
    return {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLng + maxLng) / 2,
      latitudeDelta: (maxLat - minLat) + padding,
      longitudeDelta: (maxLng - minLng) + padding,
    };
  };

  // Find safe route
  const handleFindSafeRoute = async () => {
    if (!destination.trim()) {
      Alert.alert("Destination Required", "Please enter where you want to go to find the safest route.");
      return;
    }

    let userLocation = currentLocation;
    if (!userLocation) {
      userLocation = await getCurrentLocation();
      if (!userLocation) {
        Alert.alert(
          "Location Required", 
          "Please enable location services to find safe routes tailored to your location.",
          [{ text: "OK" }]
        );
        return;
      }
    }

    try {
      setIsFindingRoute(true);
      
      const response = await api.post('/aegis/find-safe-route/', {
        destination: destination.trim(),
        current_lat: userLocation.lat,
        current_lng: userLocation.lng,
      });

      console.log('Route API Response:', response.data);

      if (response.data.success) {
        const backendData = response.data;
        
        // Extract route path
        let routePath: number[][] = [];
        if (backendData.geojson?.features?.[0]?.geometry?.coordinates) {
          routePath = backendData.geojson.features[0].geometry.coordinates;
        } else if (backendData.route_path) {
          routePath = backendData.route_path;
        }

        // Create route object
        const route: SafeRoute = {
          id: backendData.route_id || Date.now(),
          destination: backendData.summary?.destination || destination,
          distance: backendData.summary?.distance || 'Calculating...',
          duration: backendData.summary?.duration || 'Calculating...',
          safety_rating: backendData.summary?.safety_rating || 4.5,
          features: backendData.summary?.features || ['Emergency location avoidance', 'Well-lit paths', 'Populated areas'],
          avoided_locations: backendData.summary?.avoided_locations || [],
          waypoints: backendData.summary?.waypoints || ['Current Location', destination],
          route_path: routePath,
          start_location: [userLocation.lng, userLocation.lat],
          end_location: routePath.length > 0 ? routePath[routePath.length - 1] : [0, 0],
          bounds: backendData.bounds,
          geojson: backendData.geojson,
          summary: backendData.summary
        };

        setSafeRoutes([route]);
        setSelectedRoute(route);
        
        // Update map to show route
        const newRegion = calculateMapRegionForRoute(routePath);
        if (newRegion) {
          setMapRegion(newRegion);
        }
        
        Alert.alert(
          "🎉 Safe Route Found!", 
          `We've found a secure path to ${route.destination} that avoids ${route.avoided_locations.length} risky locations.`,
          [{ text: "View Route", style: "default" }]
        );
      } else {
        Alert.alert("Route Not Found", response.data.error || "Unable to find a safe route to this destination.");
      }
    } catch (error: any) {
      console.error('Error finding route:', error);
      const errorMessage = error.response?.data?.error || "We couldn't find a safe route. Please check your connection and try again.";
      
      if (errorMessage.includes('Could not find location') || errorMessage.includes('Destination not found')) {
        Alert.alert(
          "📍 Location Not Found", 
          `We couldn't find "${destination}". Try:\n• A more specific address\n• Adding city name\n• Checking spelling`,
          [{ text: "Try Again" }]
        );
      } else if (errorMessage.includes('Unable to calculate route')) {
        Alert.alert(
          "🚧 Route Calculation Failed",
          "We're having trouble calculating your route. Please check your internet connection.",
          [{ text: "OK" }]
        );
      } else {
        Alert.alert("Error", errorMessage);
      }
    } finally {
      setIsFindingRoute(false);
    }
  };

  // Start navigation
  const handleStartNavigation = async (route: SafeRoute) => {
    try {
      const response = await api.post('/aegis/start-navigation/', {
        route_id: route.id
      });

      if (response.data.success) {
        setSelectedRoute(route);
        setLiveSharing(true);
        Alert.alert(
          "🛡️ Safe Navigation Started", 
          "Your trusted contacts have been notified. They can track your safe journey and estimated arrival.",
          [
            {
              text: "Share Status",
              onPress: () => console.log("Share pressed")
            },
            {
              text: "OK",
              style: "default"
            }
          ]
        );
      } else {
        Alert.alert("Navigation Error", response.data.error || "Couldn't start navigation mode.");
      }
    } catch (error: any) {
      console.error('Navigation error:', error);
      Alert.alert("Error", error.response?.data?.error || "Failed to start navigation");
    }
  };

  // Add safe location
  const handleAddSafeLocation = () => {
    Alert.alert(
      "➕ Add Safe Location", 
      "Choose how you'd like to add a new safe location:",
      [
        {
          text: "📍 Choose from Map",
          onPress: () => router.push('/map-location-picker')
        },
        {
          text: "📝 Enter Address",
          onPress: () => router.push('/add-safe-location')
        },
        {
          text: "Cancel",
          style: "cancel"
        }
      ]
    );
  };

  // Set destination from safe location
  const handleSetDestination = (location: SafeLocation) => {
    setDestination(location.address);
    Alert.alert(
      "Destination Set ✅", 
      `${location.name} has been set as your destination. Tap "Find Route" to get directions.`
    );
  };

  // Get icon for location type
  const getLocationIcon = (type: string) => {
    const iconMap: { [key: string]: string } = {
      'home': '🏠',
      'work': '🏢',
      'education': '🎓',
      'family': '👨‍👩‍👧‍👦',
      'friend': '👫',
      'other': '📍'
    };
    return iconMap[type] || '📍';
  };

  // Get emergency type icon
  const getEmergencyIcon = (type: string) => {
    const iconMap: { [key: string]: string } = {
      'harassment': '🚨',
      'robbery': '💰',
      'assault': '👊',
      'theft': '📱',
      'other': '⚠️'
    };
    return iconMap[type] || '⚠️';
  };

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  if (isLoading) {
    return (
      <View className="flex-1 bg-background justify-center items-center">
        <View className="items-center">
          <ActivityIndicator size="large" color="rgb(var(--color-primary))" />
          <Text className="text-title text-on-surface mt-4 font-semibold">Finding Your Location</Text>
          <Text className="text-body text-on-surface-variant mt-2 text-center px-8">
            Setting up safe routing with your current location...
          </Text>
        </View>
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
            onRefresh={onRefresh}
            // colors={['rgb(var(--color-primary))']}
            // tintColor="rgb(var(--color-primary))"
          />
        }
      >
        {/* Header */}
        <View className="px-6 pt-12 pb-4 bg-surface rounded-b-3xl shadow-lg">
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center">
              <TouchableOpacity 
                onPress={() => router.back()}
                className="p-3 rounded-2xl bg-surface-variant mr-3 shadow-sm"
              >
                <Ionicons name="chevron-back" size={20} color="rgb(var(--color-on-surface))" />
              </TouchableOpacity>
              <View>
                <Text className="text-headline text-on-surface font-bold">Safe Routes</Text>
                <Text className="text-body text-on-surface-variant mt-1">
                  Smart routing that avoids emergency hotspots
                </Text>
              </View>
            </View>
            <TouchableOpacity className="p-3 rounded-2xl bg-primary/10">
              <Ionicons name="shield-checkmark" size={20} color="rgb(var(--color-primary))" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Map View */}
        <View className="h-80 mx-6 mt-6 mb-2 rounded-3xl overflow-hidden shadow-2xl border border-outline/20">
          <MapView
            style={{ flex: 1 }}
            region={mapRegion}
            showsUserLocation={true}
            showsMyLocationButton={true}
            showsCompass={true}
            showsScale={true}
            onMapReady={() => setMapReady(true)}
            mapType="standard"
          >
            {/* Current Location Marker */}
            {currentLocation && (
              <Marker
                coordinate={{
                  latitude: currentLocation.lat,
                  longitude: currentLocation.lng,
                }}
                title="Your Location"
                description="Starting point"
                pinColor="#007AFF"
              />
            )}

            {/* Safe Route Path */}
            {selectedRoute && selectedRoute.route_path && selectedRoute.route_path.length > 0 && (
              <Polyline
                coordinates={processRoutePath(selectedRoute.route_path)}
                strokeColor="#007AFF"
                strokeWidth={5}
                lineCap="round"
                lineJoin="round"
              />
            )}

            {/* Destination Marker */}
            {selectedRoute && selectedRoute.end_location && (
              <Marker
                coordinate={{
                  latitude: selectedRoute.end_location[1],
                  longitude: selectedRoute.end_location[0],
                }}
                title={`Destination: ${selectedRoute.destination}`}
                description={`${selectedRoute.distance} • ${selectedRoute.duration}`}
                pinColor="#FF3B30"
              />
            )}

            {/* Emergency Locations */}
            {emergencyHistory.map(emergency => (
              <Marker
                key={emergency.id}
                coordinate={{
                  latitude: emergency.lat,
                  longitude: emergency.lng,
                }}
                title={`Reported: ${emergency.type}`}
                description={emergency.location}
                pinColor="#FF9500"
              />
            ))}

            {/* Safe Locations */}
            {safeLocations.map(location => (
              <Marker
                key={location.id}
                coordinate={{
                  latitude: location.latitude,
                  longitude: location.longitude,
                }}
                title={location.name}
                description={location.address}
                pinColor="#34C759"
              />
            ))}
          </MapView>
        </View>

        {/* Destination Input Card */}
        <View className="mx-6 mb-6 mt-4">
          <View className="bg-surface rounded-3xl p-5 shadow-lg border border-outline/10">
            <Text className="text-title text-on-surface font-bold mb-4">Where would you like to go?</Text>
            <View className="flex-row items-center">
              <View className="flex-1 bg-surface-variant rounded-2xl p-3 border border-outline/20">
                <TextInput
                  className="text-on-surface text-body"
                  placeholder="Enter destination address..."
                  placeholderTextColor="rgb(var(--color-on-surface-variant))"
                  value={destination}
                  onChangeText={setDestination}
                  onSubmitEditing={handleFindSafeRoute}
                />
              </View>
              <TouchableOpacity
                className="ml-3 bg-primary rounded-2xl px-6 py-4 shadow-lg"
                onPress={handleFindSafeRoute}
                disabled={isFindingRoute}
              >
                {isFindingRoute ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Ionicons name="navigate" size={20} color="white" />
                )}
              </TouchableOpacity>
            </View>
            <Text className="text-label text-on-surface-variant mt-3 text-center">
              We'll find the safest route avoiding emergency locations
            </Text>
          </View>
        </View>

        {/* Quick Access - Safe Locations */}
        <View className="mx-6 mb-6">
          <View className="flex-row justify-between items-center mb-4">
            <View>
              <Text className="text-title text-on-surface font-bold">My Safe Places</Text>
              <Text className="text-label text-on-surface-variant">Quickly set destinations</Text>
            </View>
            <TouchableOpacity 
              className="bg-primary/10 px-4 py-2 rounded-2xl flex-row items-center"
              onPress={handleAddSafeLocation}
            >
              <Ionicons name="add" size={16} color="rgb(var(--color-primary))" />
              <Text className="text-primary font-medium ml-1">Add</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            className="space-x-4"
            contentContainerStyle={{ paddingRight: 20 }}
          >
            {safeLocations.map((location) => (
              <TouchableOpacity 
                key={location.id} 
                className="bg-surface-variant w-40 p-4 rounded-2xl shadow-sm border border-outline/10"
                onPress={() => handleSetDestination(location)}
              >
                <View className={`p-3 rounded-2xl mb-3 bg-primary/10 items-center`}>
                  <Text className={`text-xl`}>
                    {location.icon}
                  </Text>
                </View>
                <Text className="text-on-surface font-semibold text-center mb-1">{location.name}</Text>
                <Text className="text-label text-on-surface-variant text-center text-xs" numberOfLines={2}>
                  {location.address}
                </Text>
                <TouchableOpacity 
                  className={`mt-3 px-3 py-2 rounded-xl bg-primary/5 items-center`}
                  onPress={() => handleSetDestination(location)}
                >
                  <Text className={`text-xs text-primary font-medium`}>
                    Set Destination
                  </Text>
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
            
            {/* Add New Location Card */}
            <TouchableOpacity 
              className="bg-surface-variant w-40 p-4 rounded-2xl items-center justify-center border-2 border-dashed border-outline/30"
              onPress={handleAddSafeLocation}
            >
              <View className="w-12 h-12 rounded-2xl bg-primary/10 items-center justify-center mb-3">
                <Ionicons name="add" size={24} color="rgb(var(--color-primary))" />
              </View>
              <Text className="text-on-surface font-medium text-center mb-1">Add Safe Location</Text>
              <Text className="text-on-surface-variant text-center text-xs">Tap to add new place</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Safe Routes Results */}
        {safeRoutes.length > 0 && safeRoutes.map((route) => (
          <View key={route.id} className="mx-6 mb-6">
            <Text className="text-title text-on-surface font-bold mb-4">Recommended Safe Route</Text>
            <View className="bg-surface rounded-3xl p-5 shadow-lg border border-outline/10">
              <View className="flex-row justify-between items-start mb-4">
                <View className="flex-1">
                  <Text className="text-on-surface font-bold text-lg mb-1">To {route.destination}</Text>
                  <View className="flex-row items-center">
                    <Ionicons name="time-outline" size={14} color="rgb(var(--color-on-surface-variant))" />
                    <Text className="text-label text-on-surface-variant ml-1">{route.duration}</Text>
                    <Text className="text-label text-on-surface-variant mx-2">•</Text>
                    <Ionicons name="distance-outline" size={14} color="rgb(var(--color-on-surface-variant))" />
                    <Text className="text-label text-on-surface-variant ml-1">{route.distance}</Text>
                  </View>
                </View>
                <View className="bg-primary/10 px-3 py-2 rounded-2xl">
                  <Text className="text-primary font-semibold text-sm">⭐ {route.safety_rating || 4.5}/5</Text>
                </View>
              </View>

              {/* Safety Features */}
              <View className="mb-4">
                <Text className="text-on-surface font-medium mb-2">Safety Features</Text>
                <View className="flex-row flex-wrap">
                  {(route.features || ['Emergency location avoidance', 'Well-lit paths', 'Populated areas']).map((feature, index) => (
                    <View key={index} className="bg-green-500/10 px-3 py-2 rounded-2xl mr-2 mb-2">
                      <Text className="text-green-500 text-xs font-medium">🛡️ {feature}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Avoided Locations */}
              {route.avoided_locations.length > 0 && (
                <View className="mb-4">
                  <Text className="text-on-surface font-medium mb-2">Avoiding {route.avoided_locations.length} Risky Locations</Text>
                  <View className="space-y-2">
                    {route.avoided_locations.slice(0, 3).map((location, index) => (
                      <View key={index} className="bg-orange-500/10 p-3 rounded-2xl">
                        <Text className="text-orange-500 text-sm font-medium">⚠️ {location.address || location.location}</Text>
                        <Text className="text-on-surface-variant text-xs mt-1">
                          {location.type} • Previously reported
                        </Text>
                      </View>
                    ))}
                    {route.avoided_locations.length > 3 && (
                      <Text className="text-on-surface-variant text-xs text-center">
                        +{route.avoided_locations.length - 3} more locations avoided
                      </Text>
                    )}
                  </View>
                </View>
              )}

              {/* Action Button */}
              <TouchableOpacity
                className={`p-4 rounded-2xl ${
                  selectedRoute?.id === route.id ? 'bg-primary/20' : 'bg-primary'
                } shadow-lg`}
                onPress={() => handleStartNavigation(route)}
              >
                <View className="flex-row items-center justify-center">
                  <Ionicons 
                    name={selectedRoute?.id === route.id ? "checkmark-circle" : "navigate"} 
                    size={20} 
                    color={selectedRoute?.id === route.id ? "rgb(var(--color-primary))" : "white"} 
                  />
                  <Text className={`ml-2 font-semibold text-lg ${
                    selectedRoute?.id === route.id ? 'text-primary' : 'text-white'
                  }`}>
                    {selectedRoute?.id === route.id ? 'Navigation Active' : 'Start Safe Navigation'}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {/* Emergency History Section */}
        <View className="mx-6 mb-8">
          <View className="flex-row justify-between items-center mb-4">
            <View>
              <Text className="text-title text-on-surface font-bold">Emergency Hotspots</Text>
              <Text className="text-label text-on-surface-variant">Automatically avoided in your routes</Text>
            </View>
            <View className="bg-red-500/10 px-3 py-1 rounded-2xl">
              <Text className="text-red-500 text-sm font-medium">{emergencyHistory.length} locations</Text>
            </View>
          </View>
          
          <View className="bg-surface rounded-3xl p-5 shadow-lg border border-outline/10">
            {emergencyHistory.slice(0, 4).map((emergency, index) => (
              <View 
                key={emergency.id} 
                className={`flex-row items-center py-3 ${index < 3 ? 'border-b border-outline/10' : ''}`}
              >
                <View className={`w-10 h-10 rounded-2xl bg-red-500/10 justify-center items-center mr-3`}>
                  <Text className="text-red-500 text-lg">{getEmergencyIcon(emergency.type)}</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-on-surface font-medium">{emergency.location}</Text>
                  <View className="flex-row items-center mt-1">
                    <Text className="text-label text-on-surface-variant text-xs capitalize">{emergency.type}</Text>
                    <Text className="text-label text-on-surface-variant text-xs mx-2">•</Text>
                    <Text className="text-label text-on-surface-variant text-xs">{formatTimestamp(emergency.timestamp)}</Text>
                  </View>
                </View>
              </View>
            ))}
            {emergencyHistory.length > 4 && (
              <TouchableOpacity className="pt-3 items-center">
                <Text className="text-primary font-medium">View all {emergencyHistory.length} locations</Text>
              </TouchableOpacity>
            )}
            {emergencyHistory.length === 0 && (
              <View className="items-center py-4">
                <Ionicons name="checkmark-done" size={40} color="rgb(var(--color-green-500))" />
                <Text className="text-on-surface font-medium mt-2">No emergency locations in your area</Text>
                <Text className="text-on-surface-variant text-center mt-1 text-sm">
                  Great! Your area appears to be safe with no recent emergency reports.
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Bottom Spacer */}
        <View className="h-6" />
      </ScrollView>

      {/* Live Sharing Indicator */}
      {liveSharing && (
        <View className="absolute top-16 right-6 bg-primary/95 px-4 py-3 rounded-2xl shadow-2xl flex-row items-center">
          <View className="w-2 h-2 bg-green-400 rounded-full mr-2" />
          <Text className="text-on-primary font-medium text-sm">📍 Live Sharing Active</Text>
        </View>
      )}
    </View>
  );
}