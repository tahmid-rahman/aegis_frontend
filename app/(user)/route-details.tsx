// app/user/route-details.tsx
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Dimensions, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { useAuth } from '../../providers/AuthProvider';
import { useTheme } from '../../providers/ThemeProvider';
import { api } from '../../services/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface RouteDetails {
  id: number;
  destination: string;
  distance: string;
  duration: string;
  safety_rating: number;
  features: string[];
  avoided_locations: any[];
  waypoints: string[];
  route_path: number[][];
  start_location: number[];
  end_location: number[];
  bounds: number[];
  summary?: any;
}

export default function RouteDetails() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { effectiveTheme } = useTheme();
  const { user } = useAuth();
  
  const [route, setRoute] = useState<RouteDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStartingNavigation, setIsStartingNavigation] = useState(false);
  
  const [mapRegion, setMapRegion] = useState({
    latitude: 23.8103,
    longitude: 90.4125,
    latitudeDelta: 0.1,
    longitudeDelta: 0.1,
  });

  const routeId = params.routeId as string;

  // Process route path for map display
  const processRoutePath = (routePath: number[][]) => {
    if (!routePath || routePath.length === 0) return [];
    
    return routePath.map(coord => ({
      latitude: coord[1],
      longitude: coord[0],
    }));
  };

  // Calculate optimal map region
  const calculateMapRegion = (route: RouteDetails) => {
    if (route.bounds && route.bounds.length === 4) {
      return {
        latitude: (route.bounds[1] + route.bounds[3]) / 2,
        longitude: (route.bounds[0] + route.bounds[2]) / 2,
        latitudeDelta: Math.abs(route.bounds[3] - route.bounds[1]) * 1.2,
        longitudeDelta: Math.abs(route.bounds[2] - route.bounds[0]) * 1.2,
      };
    }
    
    if (route.route_path && route.route_path.length > 0) {
      const routePath = processRoutePath(route.route_path);
      const latitudes = routePath.map(coord => coord.latitude);
      const longitudes = routePath.map(coord => coord.longitude);
      
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
    }
    
    return mapRegion;
  };

  const fetchRouteDetails = async () => {
    try {
      if (params.routeData) {
        const routeData = JSON.parse(params.routeData as string);
        setRoute(routeData);
        
        const region = calculateMapRegion(routeData);
        setMapRegion(region);
      }
    } catch (error) {
      console.error('Error fetching route details:', error);
      Alert.alert('Error', 'Failed to load route details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartNavigation = async () => {
    if (!route) return;

    try {
      setIsStartingNavigation(true);
      const response = await api.post('/aegis/start-navigation/', {
        route_id: route.id
      });

      if (response.data.success) {
        Alert.alert(
          "🛡️ Safe Navigation Started", 
          "Your trusted contacts have been notified and can track your journey in real-time.",
          [
            {
              text: "View Progress",
              onPress: () => router.back()
            },
            {
              text: "OK",
              style: "default"
            }
          ]
        );
      } else {
        Alert.alert("Navigation Error", response.data.error || "Failed to start navigation");
      }
    } catch (error: any) {
      console.error('Navigation error:', error);
      Alert.alert("Error", error.response?.data?.error || "Failed to start navigation");
    } finally {
      setIsStartingNavigation(false);
    }
  };

  const handleShareRoute = () => {
    Alert.alert(
      "Share Safe Route",
      "Share this safe route with friends or family",
      [
        {
          text: "Copy Route Link",
          onPress: () => console.log("Copy pressed")
        },
        {
          text: "Share via Message",
          onPress: () => console.log("Share pressed")
        },
        {
          text: "Cancel",
          style: "cancel"
        }
      ]
    );
  };

  useEffect(() => {
    fetchRouteDetails();
  }, [routeId]);

  if (!route) {
    return (
      <View className="flex-1 bg-background justify-center items-center">
        <Ionicons name="alert-circle" size={60} color="rgb(var(--color-on-surface-variant))" />
        <Text className="text-title text-on-surface mt-4 font-semibold">Route Not Found</Text>
        <Text className="text-body text-on-surface-variant mt-2 text-center px-8">
          The route you're looking for couldn't be loaded.
        </Text>
        <TouchableOpacity 
          onPress={() => router.back()} 
          className="bg-primary px-6 py-3 rounded-2xl mt-6"
        >
          <Text className="text-on-primary font-medium">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      {/* Enhanced Header */}
      <View className="px-6 pt-12 pb-6 bg-surface rounded-b-3xl shadow-lg">
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-row items-center">
            <TouchableOpacity 
              onPress={() => router.back()}
              className="p-3 rounded-2xl bg-surface-variant mr-3 shadow-sm"
            >
              <Ionicons name="chevron-back" size={20} color="rgb(var(--color-on-surface))" />
            </TouchableOpacity>
            <View>
              <Text className="text-headline text-on-surface font-bold">Route Details</Text>
              <Text className="text-body text-on-surface-variant mt-1">
                Safe path to {route.destination}
              </Text>
            </View>
          </View>
          <TouchableOpacity 
            className="p-3 rounded-2xl bg-primary/10"
            onPress={handleShareRoute}
          >
            <Ionicons name="share-outline" size={20} color="rgb(var(--color-primary))" />
          </TouchableOpacity>
        </View>

        {/* Quick Stats */}
        <View className="flex-row justify-between items-center">
          <View className="items-center">
            <Ionicons name="time-outline" size={20} color="rgb(var(--color-primary))" />
            <Text className="text-on-surface font-semibold mt-1">{route.duration}</Text>
            <Text className="text-label text-on-surface-variant text-xs">Duration</Text>
          </View>
          <View className="items-center">
            <Ionicons name="distance-outline" size={20} color="rgb(var(--color-primary))" />
            <Text className="text-on-surface font-semibold mt-1">{route.distance}</Text>
            <Text className="text-label text-on-surface-variant text-xs">Distance</Text>
          </View>
          <View className="items-center">
            <Ionicons name="shield-checkmark" size={20} color="rgb(var(--color-primary))" />
            <Text className="text-on-surface font-semibold mt-1">{route.safety_rating}/5</Text>
            <Text className="text-label text-on-surface-variant text-xs">Safety</Text>
          </View>
          <View className="items-center">
            <Ionicons name="warning-outline" size={20} color="rgb(var(--color-primary))" />
            <Text className="text-on-surface font-semibold mt-1">{route.avoided_locations.length}</Text>
            <Text className="text-label text-on-surface-variant text-xs">Avoided</Text>
          </View>
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Enhanced Map */}
        <View className="h-80 mx-6 mt-6 rounded-3xl overflow-hidden shadow-2xl border border-outline/20">
          <MapView
            style={{ flex: 1 }}
            region={mapRegion}
            showsUserLocation={true}
            showsScale={true}
            showsCompass={true}
            mapType="standard"
          >
            {/* Route Path with Enhanced Styling */}
            {route.route_path && route.route_path.length > 0 && (
              <Polyline
                coordinates={processRoutePath(route.route_path)}
                strokeColor="#007AFF"
                strokeWidth={6}
                lineCap="round"
                lineJoin="round"
              />
            )}

            {/* Start Marker */}
            {route.start_location && (
              <Marker
                coordinate={{
                  latitude: route.start_location[1],
                  longitude: route.start_location[0],
                }}
                title="Start Location"
                description="Your starting point"
              >
                <View className="bg-blue-500 w-10 h-10 rounded-full justify-center items-center border-4 border-white shadow-lg">
                  <Ionicons name="location" size={16} color="white" />
                </View>
              </Marker>
            )}

            {/* End Marker */}
            {route.end_location && (
              <Marker
                coordinate={{
                  latitude: route.end_location[1],
                  longitude: route.end_location[0],
                }}
                title={`Destination: ${route.destination}`}
                description={`${route.distance} • ${route.duration}`}
              >
                <View className="bg-red-500 w-10 h-10 rounded-full justify-center items-center border-4 border-white shadow-lg">
                  <Ionicons name="flag" size={16} color="white" />
                </View>
              </Marker>
            )}

            {/* Avoided Locations */}
            {route.avoided_locations.map((location, index) => (
              <Marker
                key={index}
                coordinate={{
                  latitude: location.lat || location.latitude,
                  longitude: location.lng || location.longitude,
                }}
                title={`Avoided: ${location.address || location.location}`}
                description={location.type || 'Emergency location'}
              >
                <View className="bg-orange-500 w-8 h-8 rounded-full justify-center items-center border-3 border-white shadow-lg">
                  <Ionicons name="warning" size={12} color="white" />
                </View>
              </Marker>
            ))}
          </MapView>
        </View>

        {/* Route Information Cards */}
        <View className="px-6 mt-6 space-y-4">
          {/* Safety Features Card */}
          <View className="bg-surface rounded-3xl p-5 shadow-lg border border-outline/10">
            <View className="flex-row items-center mb-4">
              <Ionicons name="shield-checkmark" size={24} color="rgb(var(--color-primary))" />
              <Text className="text-on-surface font-bold text-lg ml-2">Safety Features</Text>
            </View>
            <View className="flex-row flex-wrap">
              {route.features.map((feature, index) => (
                <View key={index} className="bg-primary/10 px-4 py-3 rounded-2xl mr-3 mb-3">
                  <Text className="text-primary font-medium text-sm">🛡️ {feature}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Avoided Locations Card */}
          {route.avoided_locations.length > 0 && (
            <View className="bg-surface rounded-3xl p-5 shadow-lg border border-outline/10">
              <View className="flex-row items-center mb-4">
                <Ionicons name="warning" size={24} color="rgb(var(--color-orange-500))" />
                <Text className="text-on-surface font-bold text-lg ml-2">
                  Avoided Locations ({route.avoided_locations.length})
                </Text>
              </View>
              <View className="space-y-3">
                {route.avoided_locations.map((location, index) => (
                  <View key={index} className="bg-orange-500/10 p-4 rounded-2xl">
                    <View className="flex-row items-start">
                      <Ionicons name="close-circle" size={16} color="rgb(var(--color-orange-500))" className="mt-1 mr-2" />
                      <View className="flex-1">
                        <Text className="text-orange-500 font-medium text-sm">
                          {location.address || location.location}
                        </Text>
                        <Text className="text-on-surface-variant text-xs mt-1 capitalize">
                          {location.type} • Previously reported emergency
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Route Waypoints Card */}
          {route.waypoints.length > 0 && (
            <View className="bg-surface rounded-3xl p-5 shadow-lg border border-outline/10">
              <View className="flex-row items-center mb-4">
                <Ionicons name="list" size={24} color="rgb(var(--color-primary))" />
                <Text className="text-on-surface font-bold text-lg ml-2">Route Overview</Text>
              </View>
              <View className="space-y-3">
                {route.waypoints.map((waypoint, index) => (
                  <View key={index} className="flex-row items-center p-3">
                    <View className={`w-8 h-8 rounded-full justify-center items-center mr-4 ${
                      index === 0 ? 'bg-blue-500' : 
                      index === route.waypoints.length - 1 ? 'bg-red-500' : 'bg-primary/20'
                    }`}>
                      {index === 0 ? (
                        <Ionicons name="play" size={14} color="white" />
                      ) : index === route.waypoints.length - 1 ? (
                        <Ionicons name="flag" size={14} color="white" />
                      ) : (
                        <Text className="text-primary font-semibold text-xs">{index}</Text>
                      )}
                    </View>
                    <Text className="text-on-surface flex-1">{waypoint}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* Bottom Spacer for Action Button */}
        <View className="h-28" />
      </ScrollView>

      {/* Enhanced Action Button */}
      <View className="absolute bottom-0 left-0 right-0 p-6 bg-background/95 backdrop-blur-sm border-t border-outline/10">
        <TouchableOpacity
          className="bg-primary py-5 rounded-2xl shadow-2xl"
          onPress={handleStartNavigation}
          disabled={isStartingNavigation}
        >
          <View className="flex-row items-center justify-center">
            {isStartingNavigation ? (
              <Ionicons name="ellipsis-horizontal" size={20} color="white" />
            ) : (
              <Ionicons name="navigate" size={20} color="white" />
            )}
            <Text className="text-on-primary text-center font-semibold text-lg ml-2">
              {isStartingNavigation ? 'Starting Navigation...' : 'Start Safe Navigation'}
            </Text>
          </View>
          <Text className="text-on-primary/80 text-center text-sm mt-1">
            Your contacts will be notified and can track your journey
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}