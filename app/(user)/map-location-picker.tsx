// app/user/map-location-picker.tsx
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';
import { useAuth } from '../../providers/AuthProvider';
import { useTheme } from '../../providers/ThemeProvider';
import { api } from '../../services/api';

export default function MapLocationPicker() {
  const router = useRouter();
  const { effectiveTheme } = useTheme();
  const { user } = useAuth();
  
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [address, setAddress] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [mapRegion, setMapRegion] = useState<Region>({
    latitude: 23.8103,
    longitude: 90.4125,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });

  // Get current location and set initial map region
  const initializeMap = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is required to pick locations from map');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;
      
      setMapRegion({
        latitude,
        longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });
      
      // Set initial selected location to current location
      setSelectedLocation({ lat: latitude, lng: longitude });
      await reverseGeocode(latitude, longitude);
      
    } catch (error) {
      console.error('Error initializing map:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Reverse geocode coordinates to get address
  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const response = await api.post('/aegis/reverse-geocode/', {
        latitude: lat,
        longitude: lng
      });

      if (response.data.success) {
        setAddress(response.data.data.address);
      }
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      setAddress(`Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
    }
  };

  // Handle map press to select location
  const handleMapPress = (event: any) => {
    const { coordinate } = event.nativeEvent;
    setSelectedLocation({
      lat: coordinate.latitude,
      lng: coordinate.longitude
    });
    reverseGeocode(coordinate.latitude, coordinate.longitude);
  };

  // Save the selected location
  const handleSaveLocation = async () => {
    if (!selectedLocation || !address) {
      Alert.alert('Error', 'Please select a location on the map');
      return;
    }

    setIsSaving(true);
    try {
      router.push({
        pathname: '/add-safe-location',
        params: {
          latitude: selectedLocation.lat.toFixed(6),
          longitude: selectedLocation.lng.toFixed(6),
          address: address
        }
      });
    } catch (error) {
      console.error('Error saving location:', error);
      Alert.alert('Error', 'Failed to save location');
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    initializeMap();
  }, []);

  if (isLoading) {
    return (
      <View className="flex-1 bg-background justify-center items-center">
        <ActivityIndicator size="large" color="rgb(var(--color-primary))" />
        <Text className="text-on-surface mt-4">Loading map...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View className="px-6 pt-6 pb-4 bg-surface">
        <View className="flex-row items-center mb-2">
          <TouchableOpacity 
            onPress={() => router.back()}
            className="p-2 rounded-full bg-surface-variant mr-3"
          >
            <Text className="text-lg">←</Text>
          </TouchableOpacity>
          <Text className="text-headline text-on-surface">Pick Location from Map</Text>
        </View>
        <Text className="text-body text-on-surface-variant">
          Tap on the map to select a location for your safe place
        </Text>
      </View>

      {/* Map */}
      <View className="flex-1">
        <MapView
          style={{ flex: 1 }}
          region={mapRegion}
          onPress={handleMapPress}
          showsUserLocation={true}
          showsMyLocationButton={true}
        >
          {selectedLocation && (
            <Marker
              coordinate={{
                latitude: selectedLocation.lat,
                longitude: selectedLocation.lng,
              }}
              title="Selected Location"
              pinColor="rgb(var(--color-primary))"
            />
          )}
        </MapView>
      </View>

      {/* Selected Location Info */}
      <View className="p-6 bg-surface-variant">
        <Text className="text-title text-on-surface mb-2">Selected Location</Text>
        <Text className="text-body text-on-surface-variant mb-4">
          {address || 'Tap on map to select a location'}
        </Text>
        
        <View className="flex-row space-x-3">
          <TouchableOpacity
            className="flex-1 bg-outline py-3 rounded-xl"
            onPress={() => router.back()}
          >
            <Text className="text-on-surface text-center font-medium">Cancel</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            className="flex-1 bg-primary py-3 rounded-xl"
            onPress={handleSaveLocation}
            disabled={!selectedLocation || isSaving}
          >
            <Text className="text-on-primary text-center font-medium">
              {isSaving ? '...' : 'Use This Location'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}