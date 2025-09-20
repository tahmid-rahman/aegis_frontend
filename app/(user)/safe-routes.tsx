// app/user/safe-routes.tsx
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../providers/ThemeProvider';

export default function SafeRoutes() {
  const router = useRouter();
  const { effectiveTheme } = useTheme();
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null);
  const [liveSharing, setLiveSharing] = useState(false);
  const [destination, setDestination] = useState('');
  const [isFindingRoute, setIsFindingRoute] = useState(false);

  // Mock data of previous emergency activation locations (would come from backend)
  const emergencyHistory = [
    { id: 1, location: "Gulshan 1", type: "harassment", timestamp: "3 days ago", lat: 23.7806, lng: 90.4143 },
    { id: 2, location: "Farmgate", type: "robbery", timestamp: "1 week ago", lat: 23.7550, lng: 90.3840 },
    { id: 3, location: "Mohakhali", type: "stalking", timestamp: "2 weeks ago", lat: 23.7779, lng: 90.4053 },
    { id: 4, location: "Mirpur 10", type: "assault", timestamp: "5 days ago", lat: 23.8056, lng: 90.3685 }
  ];

  // Mock safe routes that avoid emergency locations
  const safeRoutes = [
    {
      id: 'route-1',
      name: 'Safe Route to Dhanmondi',
      destination: 'Dhanmondi, Dhaka',
      distance: '12 km',
      time: '35 min',
      safetyRating: 4.8,
      features: ['Avoids high-risk areas', 'Well-lit roads', 'Police patrols', 'Emergency call boxes'],
      avoidedLocations: ['Gulshan 1', 'Farmgate'],
      waypoints: ['Gulshan 2', 'Badda', 'Rampura', 'Malibagh', 'Dhanmondi']
    },
    {
      id: 'route-2',
      name: 'Alternative Office Route',
      destination: 'Motijheel, Dhaka',
      distance: '18 km',
      time: '45 min',
      safetyRating: 4.5,
      features: ['Main roads', 'Avoids previous incident zones', 'Frequent public transport'],
      avoidedLocations: ['Mohakhali'],
      waypoints: ['Uttara', 'Airport Road', 'Kuril', 'Badda', 'Moghbazar', 'Motijheel']
    }
  ];

  const safeLocations = [
    { id: 'home', name: 'Home', address: 'Gulshan 2, Dhaka', icon: '🏠', type: 'home' },
    { id: 'college', name: 'University', address: 'Dhanmondi, Dhaka', icon: '🎓', type: 'education' },
    { id: 'office', name: 'Office', address: 'Motijheel, Dhaka', icon: '🏢', type: 'work' },
    { id: 'parents', name: "Parents' House", address: 'Uttara, Dhaka', icon: '👨‍👩‍👧', type: 'family' }
  ];

  const handleFindSafeRoute = () => {
    if (!destination.trim()) {
      Alert.alert("Destination Required", "Please enter your destination to find a safe route.");
      return;
    }

    setIsFindingRoute(true);
    
    // Simulate route finding process
    setTimeout(() => {
      setIsFindingRoute(false);
      Alert.alert(
        "Safe Route Found", 
        `Found a route to ${destination} that avoids ${emergencyHistory.length} high-risk areas based on emergency history.`,
        [{ text: "View Route", onPress: () => setSelectedRoute('route-1') }]
      );
    }, 2000);
  };

  const handleSetDestination = (locationName: string, locationAddress: string) => {
    setDestination(locationAddress);
    Alert.alert("Destination Set", `${locationName} has been set as your destination.`);
  };

  const handleStartNavigation = (routeId: string) => {
    const route = safeRoutes.find(r => r.id === routeId);
    Alert.alert(
      "Start Safe Navigation",
      `Start navigation to ${route?.destination}? This route avoids ${route?.avoidedLocations.length} high-risk areas.`,
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Start Navigation",
          onPress: () => {
            setSelectedRoute(routeId);
            setLiveSharing(true);
            Alert.alert(
              "Safe Navigation Started", 
              "Your trusted contacts will be notified of your safe route and estimated arrival time.",
              [{ text: "OK" }]
            );
          }
        }
      ]
    );
  };

  const handleShareLiveLocation = () => {
    Alert.alert(
      "Live Location Sharing",
      "Share your live location and safe route with trusted contacts?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Share",
          onPress: () => {
            setLiveSharing(true);
            Alert.alert("Sharing Active", "Your safe route and location are now being shared with emergency contacts.");
          }
        }
      ]
    );
  };

  const handleAddSafeLocation = () => {
    Alert.alert(
      "Add Safe Location", 
      "Would you like to add a new safe location?",
      [
        {
          text: "Choose from Map",
          onPress: () => Alert.alert("Map Picker", "This would open a map to select a location")
        },
        {
          text: "Enter Address",
          onPress: () => Alert.alert("Address Input", "This would open a form to enter address details")
        },
        {
          text: "Cancel",
          style: "cancel"
        }
      ]
    );
  };

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
            <Text className="text-headline text-on-surface">Safe Routes</Text>
          </View>
          <Text className="text-body text-on-surface-variant">
            Smart routing that avoids previous emergency locations
          </Text>
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
            />
            <TouchableOpacity
              className="bg-primary px-6 rounded-r-xl justify-center"
              onPress={handleFindSafeRoute}
              disabled={isFindingRoute}
            >
              <Text className="text-on-primary font-semibold">
                {isFindingRoute ? '...' : 'Find Route'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Safe Locations */}
        <View className="px-6 mb-6">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-title text-on-surface">My Safe Locations</Text>
            <TouchableOpacity 
              className="bg-primary/20 px-3 py-1 rounded-full"
              onPress={handleAddSafeLocation}
            >
              <Text className="text-primary text-sm">+ Add</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="space-x-3">
            {safeLocations.map((location) => (
              <TouchableOpacity 
                key={location.id} 
                className="bg-surface-variant w-32 p-4 rounded-xl items-center"
                onPress={() => handleSetDestination(location.name, location.address)}
              >
                <View className={`p-3 rounded-full mb-2 ${
                  location.type === 'home' ? 'bg-primary/20' : 
                  location.type === 'work' ? 'bg-secondary/20' : 
                  location.type === 'education' ? 'bg-tertiary/20' : 'bg-accent/20'
                }`}>
                  <Text className={`text-lg ${
                    location.type === 'home' ? 'text-primary' : 
                    location.type === 'work' ? 'text-secondary' : 
                    location.type === 'education' ? 'text-tertiary' : 'text-accent'
                  }`}>
                    {location.icon}
                  </Text>
                </View>
                <Text className="text-on-surface font-medium text-center">{location.name}</Text>
                <Text className="text-label text-on-surface-variant text-center mt-1">{location.address}</Text>
                <TouchableOpacity 
                  className={`mt-2 px-2 py-1 rounded-full ${
                    location.type === 'home' ? 'bg-primary/10' : 
                    location.type === 'work' ? 'bg-secondary/10' : 
                    location.type === 'education' ? 'bg-tertiary/10' : 'bg-accent/10'
                  }`}
                  onPress={() => handleSetDestination(location.name, location.address)}
                >
                  <Text className={`text-xs ${
                    location.type === 'home' ? 'text-primary' : 
                    location.type === 'work' ? 'text-secondary' : 
                    location.type === 'education' ? 'text-tertiary' : 'text-accent'
                  }`}>
                    Set as Destination
                  </Text>
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
            
            {/* Add New Location Button */}
            <TouchableOpacity 
              className="bg-surface-variant w-32 p-4 rounded-xl items-center justify-center border-2 border-dashed border-outline"
              onPress={handleAddSafeLocation}
            >
              <Text className="text-2xl mb-2 text-on-surface-variant">+</Text>
              <Text className="text-on-surface-variant text-center text-sm">Add Safe Location</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Recommended Safe Routes */}
        <View className="px-6 mb-8">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-title text-on-surface">Recommended Safe Routes</Text>
            <TouchableOpacity>
              <Text className="text-primary">View All</Text>
            </TouchableOpacity>
          </View>

          <View className="space-y-4">
            {safeRoutes.map((route) => (
              <View key={route.id} className="bg-surface-variant rounded-xl p-4">
                <View className="flex-row justify-between items-start mb-2">
                  <View className="flex-1">
                    <Text className="text-on-surface font-semibold">{route.name}</Text>
                    <Text className="text-label text-on-surface-variant">{route.destination}</Text>
                  </View>
                  <View className="bg-primary/20 px-2 py-1 rounded-full">
                    <Text className="text-primary text-xs">⭐ {route.safetyRating}</Text>
                  </View>
                </View>

                <View className="flex-row justify-between mb-3">
                  <Text className="text-label text-on-surface-variant">🚗 {route.distance}</Text>
                  <Text className="text-label text-on-surface-variant">⏱️ {route.time}</Text>
                </View>

                {route.avoidedLocations.length > 0 && (
                  <View className="mb-3">
                    <Text className="text-on-surface text-sm font-medium mb-1">✅ Avoiding:</Text>
                    <View className="flex-row flex-wrap">
                      {route.avoidedLocations.map((location, index) => (
                        <View key={index} className="bg-green-500/10 px-2 py-1 rounded-full mr-2 mb-2">
                          <Text className="text-green-500 text-xs">✓ {location}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                <View className="mb-3">
                  <Text className="text-on-surface text-sm font-medium mb-1">🛡️ Safety Features:</Text>
                  <View className="flex-row flex-wrap">
                    {route.features.map((feature, index) => (
                      <View key={index} className="bg-blue-500/10 px-2 py-1 rounded-full mr-2 mb-2">
                        <Text className="text-blue-500 text-xs">🛡️ {feature}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                <TouchableOpacity
                  className={`p-3 rounded-lg ${selectedRoute === route.id ? 'bg-primary/20' : 'bg-primary'}`}
                  onPress={() => handleStartNavigation(route.id)}
                >
                  <Text className={`text-center font-medium ${selectedRoute === route.id ? 'text-primary' : 'text-on-primary'}`}>
                    {selectedRoute === route.id ? 'Navigation Active' : 'Start Safe Navigation'}
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        {/* Emergency History */}
        <View className="px-6 mb-8">
          <Text className="text-title text-on-surface mb-3">Recent Emergency Locations</Text>
          <View className="bg-surface-variant rounded-xl p-4">
            <Text className="text-on-surface-variant text-sm mb-3">
              These locations are automatically avoided in your routes:
            </Text>
            {emergencyHistory.slice(0, 3).map((emergency, index) => (
              <View key={emergency.id} className={`flex-row items-center py-2 ${index < 2 ? 'border-b border-outline' : ''}`}>
                <View className={`w-3 h-3 rounded-full mr-3 ${emergency.type === 'harassment' ? 'bg-red-500' : emergency.type === 'robbery' ? 'bg-orange-500' : 'bg-yellow-500'}`} />
                <View className="flex-1">
                  <Text className="text-on-surface">{emergency.location}</Text>
                  <Text className="text-label text-on-surface-variant">{emergency.type} • {emergency.timestamp}</Text>
                </View>
              </View>
            ))}
            {emergencyHistory.length > 3 && (
              <TouchableOpacity className="pt-2">
                <Text className="text-primary text-center">View all {emergencyHistory.length} locations</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Safety Tips */}
        <View className="px-6 mb-10">
          <Text className="text-title text-on-surface mb-3">Safety Tips</Text>
          <View className="bg-surface-variant rounded-xl p-4">
            <View className="flex-row items-start mb-3">
              <Text className="text-primary mr-2">•</Text>
              <Text className="text-on-surface flex-1">Save your frequently visited locations for quick route planning</Text>
            </View>
            <View className="flex-row items-start mb-3">
              <Text className="text-primary mr-2">•</Text>
              <Text className="text-on-surface flex-1">Routes automatically avoid areas with previous emergency activations</Text>
            </View>
            <View className="flex-row items-start">
              <Text className="text-primary mr-2">•</Text>
              <Text className="text-on-surface flex-1">Add safe locations like home, work, or family houses for easy access</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Live Sharing Indicator */}
      {liveSharing && (
        <View className="absolute top-4 right-4 bg-primary/90 px-3 py-2 rounded-full">
          <Text className="text-on-primary text-sm">📍 Safe Route Active</Text>
        </View>
      )}
    </View>
  );
}