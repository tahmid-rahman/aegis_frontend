// app/user/panic-active.tsx
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, BackHandler, KeyboardAvoidingView, Platform, Text, TextInput, TouchableOpacity, View } from 'react-native';

// Pre-set security PIN (would be set by user during setup)
const EMERGENCY_DEACTIVATION_PIN = "2580"; // Simple PIN for emergency situations

export default function PanicActive() {
  const router = useRouter();
  const [timeActive, setTimeActive] = useState(0);
  const [respondersNotified, setRespondersNotified] = useState(0);
  const [showFakeScreen, setShowFakeScreen] = useState(true); // Start with fake screen
  const [pinInput, setPinInput] = useState("");
  const [incorrectAttempts, setIncorrectAttempts] = useState(0);
  const [isRecording, setIsRecording] = useState(false);

  // Mock emergency data
  const emergencyData = {
    alertId: 'EMG-2024-0012',
    timestamp: new Date().toISOString(),
    status: 'active',
    responders: [
      { id: 'R1', name: 'Local Police', status: 'dispatched', eta: '3 min' },
      { id: 'R2', name: 'Community Responder', status: 'en_route', eta: '5 min' },
      { id: 'R3', name: 'Emergency NGO', status: 'notified', eta: '8 min' }
    ],
    contactsNotified: 3
  };

  // Block hardware back button during emergency
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      // Prevent going back during emergency
      return true;
    });

    return () => backHandler.remove();
  }, []);

  // Simulate background processes
  useEffect(() => {
    // Start emergency processes
    setIsRecording(true);
    console.log("Emergency activated - location sharing and media recording started");

    // Update timer
    const timer = setInterval(() => {
      setTimeActive(prev => prev + 1);
    }, 1000);

    // Simulate responders being notified
    const responderTimer = setInterval(() => {
      if (respondersNotified < emergencyData.responders.length) {
        setRespondersNotified(prev => prev + 1);
      }
    }, 2000);

    return () => {
      clearInterval(timer);
      clearInterval(responderTimer);
    };
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePinSubmit = () => {
    if (pinInput === EMERGENCY_DEACTIVATION_PIN) {
      // Correct PIN - show the real emergency screen
      setShowFakeScreen(false);
    } else {
      // Incorrect PIN - show fake error but keep emergency active
      setIncorrectAttempts(prev => prev + 1);
      setPinInput("");
      
      if (incorrectAttempts >= 2) {
        Alert.alert(
          "Too Many Attempts",
          "Emergency system locked for 30 seconds. Help is on the way.",
          [{ text: "OK" }]
        );
        // This would actually send an alert that someone tried to disable emergency
        console.log("Multiple failed deactivation attempts detected");
      } else {
        Alert.alert(
          "Incorrect PIN",
          "Please try again. Emergency services are being notified.",
          [{ text: "OK" }]
        );
      }
    }
  };

  const handleStopAlert = () => {
    // Actually deactivate emergency
    Alert.alert(
      "Emergency Deactivated",
      "Your emergency alert has been cancelled and responders have been notified.",
      [{ text: "OK", onPress: () => router.replace('/') }]
    );
  };

  const handleFakeCall = () => {
    // Fake call function - doesn't actually call
    Alert.alert(
      "Calling Emergency Contact...",
      "This would appear to make a call but actually does nothing",
      [{ text: "OK" }]
    );
  };

  const handleFakeMessage = () => {
    // Fake message function
    Alert.alert(
      "Message Sent",
      "This would appear to send a message but actually does nothing",
      [{ text: "OK" }]
    );
  };

  if (showFakeScreen) {
    // Fake "App Crash" Screen (first thing user sees)
    return (
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 bg-gray-800 justify-center items-center p-6"
      >
        <View className="items-center">
          <Text className="text-6xl mb-4">😵</Text>
          <Text className="text-white text-2xl font-bold mb-2">App Not Responding</Text>
          <Text className="text-gray-400 text-center mb-8">
            The application has encountered an unexpected error and needs to close.
          </Text>

          <View className="w-full mb-6">
            <Text className="text-white mb-3">Enter security code to attempt recovery:</Text>
            <TextInput
              className="bg-gray-700 text-white p-4 rounded-xl mb-2"
              placeholder="Enter PIN"
              placeholderTextColor="#9CA3AF"
              value={pinInput}
              onChangeText={setPinInput}
              keyboardType="number-pad"
              secureTextEntry
            />
            <TouchableOpacity
              className="bg-blue-500 p-4 rounded-xl"
              onPress={handlePinSubmit}
            >
              <Text className="text-white text-center font-semibold">Attempt Recovery</Text>
            </TouchableOpacity>
          </View>

          <View className="flex-row space-x-3">
            <TouchableOpacity
              className="bg-gray-700 px-6 py-3 rounded-xl"
              onPress={handleFakeCall}
            >
              <Text className="text-white">📞 Call Support</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="bg-gray-700 px-6 py-3 rounded-xl"
              onPress={handleFakeMessage}
            >
              <Text className="text-white">✉️ Send Error Report</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Hidden emergency status - still active in background */}
        <View className="absolute bottom-4 left-4 opacity-0">
          <Text>Emergency Active: {formatTime(timeActive)}</Text>
        </View>
      </KeyboardAvoidingView>
    );
  }

  // Real Emergency Active Screen (only shown after correct PIN)
  return (
    <View className="flex-1 bg-background">
      {/* Header Status Bar - NO BACK BUTTON */}
      <View className="bg-panic px-6 py-4">
        <View className="flex-row justify-between items-center">
          <View>
            <Text className="text-white font-bold">EMERGENCY ACTIVE</Text>
            <Text className="text-white text-sm">Alert ID: {emergencyData.alertId}</Text>
          </View>
          <Text className="text-white font-bold">{formatTime(timeActive)}</Text>
        </View>
      </View>

      <View className="flex-1">
        {/* Emergency Information */}
        <View className="px-6 py-4">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-title text-on-surface">Emergency Response Activated</Text>
            <View className="bg-green-500/20 px-3 py-1 rounded-full">
              <Text className="text-green-500">LIVE</Text>
            </View>
          </View>

          {/* Response Status */}
          <View className="bg-surface-variant rounded-xl p-4 mb-4">
            <Text className="text-on-surface font-medium mb-3">Help is Coming</Text>
            
            {emergencyData.responders.slice(0, respondersNotified).map((responder, index) => (
              <View key={responder.id} className={`flex-row justify-between items-center py-2 ${index < respondersNotified - 1 ? 'border-b border-outline' : ''}`}>
                <View className="flex-1">
                  <Text className="text-on-surface">{responder.name}</Text>
                  <Text className="text-label text-on-surface-variant capitalize">{responder.status.replace('_', ' ')}</Text>
                </View>
                <Text className="text-on-surface font-semibold">ETA: {responder.eta}</Text>
              </View>
            ))}

            {respondersNotified < emergencyData.responders.length && (
              <View className="flex-row items-center py-2">
                <View className="w-4 h-4 rounded-full bg-red-500 animate-pulse mr-2" />
                <Text className="text-on-surface-variant">Notifying additional responders...</Text>
              </View>
            )}
          </View>

          {/* Status Information */}
          <View className="bg-surface-variant rounded-xl p-4 mb-4">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-on-surface font-medium">Location Sharing</Text>
              <View className="bg-green-500/20 px-2 py-1 rounded-full">
                <Text className="text-green-500 text-xs">ACTIVE</Text>
              </View>
            </View>
            <Text className="text-label text-on-surface-variant">
              Your location is being shared with emergency services
            </Text>
          </View>

          <View className="bg-surface-variant rounded-xl p-4 mb-4">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-on-surface font-medium">Media Recording</Text>
              <View className="bg-green-500/20 px-2 py-1 rounded-full">
                <Text className="text-green-500 text-xs">ACTIVE</Text>
              </View>
            </View>
            <Text className="text-label text-on-surface-variant">
              Audio and video are being recorded discreetly
            </Text>
          </View>
        </View>
      </View>

      {/* Emergency Actions Footer */}
      <View className="px-6 pb-8 pt-4 bg-surface">
        <TouchableOpacity
          className="bg-green-500 py-4 rounded-xl mb-3"
          onPress={handleStopAlert}
        >
          <Text className="text-white text-center font-semibold">Stop Alert</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="bg-surface-variant py-3 rounded-xl"
          onPress={() => Alert.alert("Emergency Info", "Help is on the way. Stay on this screen.")}
        >
          <Text className="text-on-surface text-center">Emergency Information</Text>
        </TouchableOpacity>
      </View>

      {/* Hidden media recording indicator */}
      {isRecording && (
        <View className="absolute top-2 right-2 bg-red-500/20 px-2 py-1 rounded-full">
          <Text className="text-red-500 text-xs">● REC</Text>
        </View>
      )}
    </View>
  );
}