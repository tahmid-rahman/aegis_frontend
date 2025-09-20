// app/user/panic-confirm.tsx
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, BackHandler, Text, TouchableOpacity, View } from 'react-native';

export default function PanicConfirm() {
  const router = useRouter();
  const [isActivating, setIsActivating] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [mediaStatus, setMediaStatus] = useState({
    audio: 'pending',
    images: 'pending',
    location: 'pending'
  });

  // Block hardware back button during emergency confirmation
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (isActivating) {
        // Prevent going back during activation countdown
        return true;
      }
      // Allow back when not activating
      return false;
    });

    return () => backHandler.remove();
  }, [isActivating]);

  // Simulate emergency data collection
  useEffect(() => {
    if (isActivating) {
      // Get current location
      (async () => {
        try {
          let { status } = await Location.requestForegroundPermissionsAsync();
          if (status !== 'granted') {
            setMediaStatus(prev => ({ ...prev, location: 'failed' }));
            return;
          }

          let currentLocation = await Location.getCurrentPositionAsync({});
          setLocation(currentLocation);
          setMediaStatus(prev => ({ ...prev, location: 'captured' }));
        } catch (error) {
          setMediaStatus(prev => ({ ...prev, location: 'failed' }));
        }
      })();

      // Simulate media capture process
      const mediaTimer = setTimeout(() => {
        setMediaStatus({
          audio: 'captured',
          images: 'captured',
          location: mediaStatus.location === 'pending' ? 'captured' : mediaStatus.location
        });
      }, 2000);

      return () => clearTimeout(mediaTimer);
    }
  }, [isActivating]);

  useEffect(() => {
    if (isActivating && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      activatePanicAlert();
    }
  }, [isActivating, countdown]);

  const activatePanicAlert = () => {
    // Simulate sending data to control center
    const emergencyData = {
      userId: 'user_12345',
      timestamp: new Date().toISOString(),
      location: location || { coords: { latitude: 0, longitude: 0 } },
      media: {
        audio: mediaStatus.audio === 'captured',
        images: mediaStatus.images === 'captured'
      },
      status: 'activated'
    };

    console.log('Emergency alert sent:', emergencyData);
    
    // Navigate to active panic screen (which will show fake screen first)
    router.replace('/panic-active');
  };

  const handleCancel = () => {
    if (isActivating) {
      setIsActivating(false);
      setCountdown(5);
      setMediaStatus({ audio: 'pending', images: 'pending', location: 'pending' });
      Alert.alert('Alert Cancelled', 'Emergency alert has been cancelled.');
    } else {
      router.back();
    }
  };

  const handleConfirm = () => {
    setIsActivating(true);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'captured': return '✅';
      case 'failed': return '❌';
      case 'pending': return '⏳';
      default: return '⏳';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'captured': return 'text-green-500';
      case 'failed': return 'text-red-500';
      case 'pending': return 'text-yellow-500';
      default: return 'text-gray-500';
    }
  };

  return (
    <View className="flex-1 bg-background justify-between">
      {/* Header - No back button */}
      <View className="px-6 pt-12 pb-6 items-center">
        <Text className="text-headline text-on-surface text-center">Emergency Alert</Text>
        <Text className="text-body text-on-surface-variant text-center mt-2">
          {isActivating ? 'Activating emergency response...' : 'Confirm emergency alert activation'}
        </Text>
      </View>

      {/* Main Content */}
      <View className="px-6 flex-1 justify-center">
        {isActivating ? (
          // Activation in progress
          <View className="items-center">
            <View className="bg-panic/20 w-32 h-32 rounded-full items-center justify-center mb-8">
              <Text className="text-4xl">🚨</Text>
            </View>

            <Text className="text-title text-on-surface text-center mb-6">
              Alert activating in {countdown}
            </Text>

            {/* Data Collection Status */}
            <View className="w-full mb-8">
              <Text className="text-on-surface font-medium mb-3">Collecting emergency data:</Text>
              
              <View className="bg-surface-variant rounded-xl p-4 space-y-3">
                <View className="flex-row justify-between items-center">
                  <Text className="text-on-surface">Location Tracking</Text>
                  <Text className={`font-medium ${getStatusColor(mediaStatus.location)}`}>
                    {getStatusIcon(mediaStatus.location)} {mediaStatus.location.toUpperCase()}
                  </Text>
                </View>
                
                <View className="flex-row justify-between items-center">
                  <Text className="text-on-surface">Audio Recording</Text>
                  <Text className={`font-medium ${getStatusColor(mediaStatus.audio)}`}>
                    {getStatusIcon(mediaStatus.audio)} {mediaStatus.audio.toUpperCase()}
                  </Text>
                </View>
                
                <View className="flex-row justify-between items-center">
                  <Text className="text-on-surface">Images Capture</Text>
                  <Text className={`font-medium ${getStatusColor(mediaStatus.images)}`}>
                    {getStatusIcon(mediaStatus.images)} {mediaStatus.images.toUpperCase()}
                  </Text>
                </View>
              </View>
            </View>

            <TouchableOpacity
              className="bg-surface-variant px-8 py-4 rounded-xl"
              onPress={handleCancel}
            >
              <Text className="text-red-500 font-semibold">CANCEL EMERGENCY</Text>
            </TouchableOpacity>
          </View>
        ) : (
          // Confirmation screen
          <View className="items-center">
            <View className="bg-red-100 w-40 h-40 rounded-full items-center justify-center mb-8">
              <Text className="text-5xl">⚠️</Text>
            </View>

            <Text className="text-title text-on-surface text-center mb-4">
              Activate Emergency Alert?
            </Text>

            <Text className="text-body text-on-surface-variant text-center mb-2">
              This will immediately:
            </Text>

            <View className="bg-surface-variant rounded-xl p-4 w-full mb-8">
              <View className="flex-row items-center mb-3">
                <Text className="text-red-500 mr-2">•</Text>
                <Text className="text-on-surface flex-1">Send your location to emergency services</Text>
              </View>
              <View className="flex-row items-center mb-3">
                <Text className="text-red-500 mr-2">•</Text>
                <Text className="text-on-surface flex-1">Notify your emergency contacts</Text>
              </View>
              <View className="flex-row items-center mb-3">
                <Text className="text-red-500 mr-2">•</Text>
                <Text className="text-on-surface flex-1">Capture audio and images discreetly</Text>
              </View>
              <View className="flex-row items-center">
                <Text className="text-red-500 mr-2">•</Text>
                <Text className="text-on-surface flex-1">Alert nearby Aegis responders</Text>
              </View>
            </View>

            <View className="flex-row space-x-4 w-full">
              <TouchableOpacity
                className="flex-1 bg-surface-variant px-6 py-4 rounded-xl"
                onPress={handleCancel}
              >
                <Text className="text-on-surface text-center font-semibold">Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="flex-1 bg-panic px-6 py-4 rounded-xl"
                onPress={handleConfirm}
              >
                <Text className="text-white text-center font-semibold">Activate</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* Footer Information */}
      <View className="px-6 pb-8">
        <Text className="text-label text-on-surface-variant text-center">
          {isActivating 
            ? 'Emergency services will be notified automatically'
            : 'Only activate in genuine emergencies'
          }
        </Text>
      </View>
    </View>
  );
}