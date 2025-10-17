// app/user/add-safe-location.tsx
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../providers/AuthProvider';
import { useTheme } from '../../providers/ThemeProvider';
import { api } from '../../services/api';

const LOCATION_TYPES = [
  { value: 'home', label: '🏠 Home', description: 'Your residence' },
  { value: 'work', label: '🏢 Work', description: 'Workplace or office' },
  { value: 'education', label: '🎓 Education', description: 'School, college, or university' },
  { value: 'family', label: '👨‍👩‍👧 Family', description: "Family member's house" },
  { value: 'other', label: '📍 Other', description: 'Other safe location' },
];

export default function AddSafeLocation() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { effectiveTheme } = useTheme();
  const { user } = useAuth();
  
  const [name, setName] = useState('');
  const [address, setAddress] = useState(params.address as string || '');
  const [locationType, setLocationType] = useState('home');
  const [latitude, setLatitude] = useState(params.latitude as string || '');
  const [longitude, setLongitude] = useState(params.longitude as string || '');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Validate form
  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!address.trim()) {
      newErrors.address = 'Address is required';
    }

    if (!latitude || !longitude) {
      newErrors.location = 'Please select a location from map';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Save safe location
  const handleSaveLocation = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const response = await api.post('/aegis/safe-locations/create/', {
        name: name.trim(),
        address: address.trim(),
        location_type: locationType,
        latitude: parseFloat(latitude).toFixed(6),
        longitude: parseFloat(longitude).toFixed(6),
      });

      if (response.data.success) {
        Alert.alert(
          'Success',
          'Safe location added successfully!',
          [{ text: 'OK', onPress: () => router.back() }]
        );
      } else {
        Alert.alert('Error', response.data.errors || 'Failed to save location');
      }
    } catch (error: any) {
      console.error('Error saving location:', error);
      const errorMessage = error.response?.data?.errors || error.response?.data?.error || 'Failed to save location';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Use map-selected location if available
  useEffect(() => {
    if (params.latitude && params.longitude) {
      setLatitude(params.latitude as string);
      setLongitude(params.longitude as string);
    }
  }, [params]);

  return (
    <View className="flex-1 bg-background">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-6 pt-6 pb-4">
          <View className="flex-row items-center mb-2">
            <TouchableOpacity 
              onPress={() => router.back()}
              className="p-2 rounded-full bg-surface-variant mr-3"
            >
              <Text className="text-lg">←</Text>
            </TouchableOpacity>
            <Text className="text-headline text-on-surface">Add Safe Location</Text>
          </View>
          <Text className="text-body text-on-surface-variant">
            Add a frequently visited location for quick route planning
          </Text>
        </View>

        {/* Form */}
        <View className="px-6 space-y-6">
          {/* Location Name */}
          <View>
            <Text className="text-title text-on-surface mb-3">Location Name</Text>
            <TextInput
              className={`bg-surface-variant rounded-xl p-4 text-on-surface border ${
                errors.name ? 'border-error' : 'border-outline'
              }`}
              placeholder="e.g., Home, Office, University"
              placeholderTextColor="rgb(var(--color-on-surface-variant))"
              value={name}
              onChangeText={(text) => {
                setName(text);
                if (errors.name) setErrors({ ...errors, name: '' });
              }}
            />
            {errors.name && (
              <Text className="text-error mt-2 text-sm">{errors.name}</Text>
            )}
          </View>

          {/* Address */}
          <View>
            <Text className="text-title text-on-surface mb-3">Address</Text>
            <TextInput
              className={`bg-surface-variant rounded-xl p-4 text-on-surface border ${
                errors.address ? 'border-error' : 'border-outline'
              }`}
              placeholder="Full address"
              placeholderTextColor="rgb(var(--color-on-surface-variant))"
              value={address}
              onChangeText={(text) => {
                setAddress(text);
                if (errors.address) setErrors({ ...errors, address: '' });
              }}
              multiline
              numberOfLines={3}
            />
            {errors.address && (
              <Text className="text-error mt-2 text-sm">{errors.address}</Text>
            )}
          </View>

          {/* Location Type */}
          <View>
            <Text className="text-title text-on-surface mb-3">Location Type</Text>
            <View className="space-y-2">
              {LOCATION_TYPES.map((type) => (
                <TouchableOpacity
                  key={type.value}
                  className={`p-4 rounded-xl border-2 ${
                    locationType === type.value 
                      ? 'bg-primary/10 border-primary' 
                      : 'bg-surface-variant border-outline'
                  }`}
                  onPress={() => setLocationType(type.value)}
                >
                  <View className="flex-row items-center">
                    <Text className="text-lg mr-3">{type.label.split(' ')[0]}</Text>
                    <View className="flex-1">
                      <Text className="text-on-surface font-medium">
                        {type.label.split(' ').slice(1).join(' ')}
                      </Text>
                      <Text className="text-on-surface-variant text-sm mt-1">
                        {type.description}
                      </Text>
                    </View>
                    {locationType === type.value && (
                      <Text className="text-primary text-lg">✓</Text>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Location Coordinates */}
          <View>
            <Text className="text-title text-on-surface mb-3">Location Coordinates</Text>
            <View className="bg-surface-variant rounded-xl p-4">
              {latitude && longitude ? (
                <View>
                  <Text className="text-on-surface">
                    📍 Selected Location
                  </Text>
                  <Text className="text-on-surface-variant text-sm mt-1">
                    Lat: {parseFloat(latitude).toFixed(6)}, Lng: {parseFloat(longitude).toFixed(6)}
                  </Text>
                  <Text className="text-on-surface-variant text-sm mt-1">
                    {address}
                  </Text>
                </View>
              ) : (
                <Text className="text-on-surface-variant">
                  No location selected
                </Text>
              )}
            </View>
            {errors.location && (
              <Text className="text-error mt-2 text-sm">{errors.location}</Text>
            )}
            
            <TouchableOpacity
              className="bg-primary/10 p-4 rounded-xl mt-3 border border-primary/30"
              onPress={() => router.push('/map-location-picker')}
            >
              <Text className="text-primary text-center font-medium">
                {latitude && longitude ? 'Change Location on Map' : 'Select Location on Map'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Spacer */}
        <View className="h-20" />
      </ScrollView>

      {/* Save Button */}
      <View className="absolute bottom-0 left-0 right-0 p-6 bg-background border-t border-outline">
        <TouchableOpacity
          className="bg-primary py-4 rounded-xl"
          onPress={handleSaveLocation}
          disabled={isLoading}
        >
          <Text className="text-on-primary text-center font-medium text-lg">
            {isLoading ? 'Saving...' : 'Save Safe Location'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}