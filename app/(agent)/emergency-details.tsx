// app/(agent)/emergency-details.tsx
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Linking, ScrollView, Text, TouchableOpacity, View } from 'react-native';

export default function EmergencyDetails() {
  const router = useRouter();
  const { taskId, emergencyId } = useLocalSearchParams();
  const [emergency, setEmergency] = useState(null);
  const [responderStatus, setResponderStatus] = useState('assigned'); // assigned, en_route, reached, completed
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [eta, setEta] = useState('5 min');

  // Mock emergency data - would come from API
  const mockEmergencyData = {
    id: emergencyId || taskId || 'EMG-2024-0012',
    type: 'harassment',
    priority: 'high',
    location: 'Gulshan 1, Road 45, Dhaka',
    exactLocation: { lat: 23.7806, lng: 90.4143 },
    distance: '1.2 km',
    eta: '3 min',
    victimInfo: {
      gender: 'Female',
      age: '25',
      isAnonymous: false,
      phone: '+8801XXX-XXXXXX'
    },
    incidentDetails: 'Victim reporting verbal harassment and stalking by unknown individual near shopping area.',
    mediaAvailable: true,
    audioRecording: true,
    imagesCaptured: 2,
    timeReported: '14:23',
    duration: '2 minutes ago',
    assignedResponder: 'You',
    controlCenterContact: '+8802-XXXXXXX'
  };

  useEffect(() => {
    // Load emergency details
    setEmergency(mockEmergencyData);
    
    // Start timer
    const timer = setInterval(() => {
      setTimeElapsed(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleStatusUpdate = (newStatus: string) => {
    setResponderStatus(newStatus);
    
    let message = '';
    switch (newStatus) {
      case 'en_route':
        message = 'Control center notified that you are en route to the victim.';
        break;
      case 'reached':
        message = 'Control center notified that you have reached the victim location.';
        break;
      case 'completed':
        message = 'Emergency marked as completed. Please provide incident notes.';
        break;
    }
    
    Alert.alert('Status Updated', message);
    
    // This would notify control center
    console.log(`Responder status updated to: ${newStatus}`);
  };

  const handleCallVictim = () => {
    if (emergency?.victimInfo?.phone && !emergency.victimInfo.isAnonymous) {
      Alert.alert(
        "Call Victim",
        `Call ${emergency.victimInfo.phone}?`,
        [
          {
            text: "Cancel",
            style: "cancel"
          },
          {
            text: "Call",
            onPress: () => Linking.openURL(`tel:${emergency.victimInfo.phone}`)
          }
        ]
      );
    } else {
      Alert.alert(
        "Cannot Call Victim",
        "Victim phone number is not available or victim chose to remain anonymous.",
        [{ text: "OK" }]
      );
    }
  };

  const handleCallControlCenter = () => {
    Alert.alert(
      "Call Control Center",
      `Call ${emergency?.controlCenterContact || 'Emergency Hotline'}?`,
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Call",
          onPress: () => Linking.openURL(`tel:${emergency?.controlCenterContact || '999'}`)
        }
      ]
    );
  };

  const handleNavigateToLocation = () => {
    // This would open maps with navigation to victim location
    const location = emergency?.exactLocation;
    if (location) {
      const url = `https://maps.google.com/?q=${location.lat},${location.lng}`;
      Linking.openURL(url).catch(err => 
        Alert.alert('Error', 'Could not open maps application.')
      );
    } else {
      Alert.alert('Location Error', 'Victim location not available for navigation.');
    }
  };

  const handleCompleteEmergency = () => {
    Alert.alert(
      "Complete Emergency",
      "Are you sure you want to mark this emergency as completed?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Complete",
          onPress: () => {
            handleStatusUpdate('completed');
            setTimeout(() => {
              Alert.alert(
                "Emergency Completed",
                "Thank you for your response. Please submit your incident report.",
                [
                  {
                    text: "Submit Report",
                    onPress: () => router.push('/(agent)/incident-report')
                  },
                  {
                    text: "Back to Dashboard",
                    onPress: () => router.back()
                  }
                ]
              );
            }, 1000);
          }
        }
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'assigned': return 'bg-blue-500';
      case 'en_route': return 'bg-orange-500';
      case 'reached': return 'bg-purple-500';
      case 'completed': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'harassment': return '🚨';
      case 'robbery': return '💰';
      case 'stalking': return '👁️';
      case 'assault': return '👊';
      default: return '⚠️';
    }
  };

  if (!emergency) {
    return (
      <View className="flex-1 bg-background justify-center items-center">
        <Text className="text-on-surface">Loading emergency details...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-6 pt-6 pb-4">
          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-headline text-on-surface">Emergency Details</Text>
            <View className={`px-3 py-1 rounded-full ${getPriorityColor(emergency.priority)}`}>
              <Text className="text-white text-sm">{emergency.priority.toUpperCase()}</Text>
            </View>
          </View>
          <Text className="text-body text-on-surface-variant">
            Emergency #{emergency.id} • {emergency.duration}
          </Text>
        </View>

        {/* Emergency Status Progress */}
        <View className="px-6 mb-6">
          <Text className="text-title text-on-surface mb-3">Response Status</Text>
          <View className="bg-surface-variant rounded-xl p-4">
            <View className="flex-row justify-between mb-4">
              {['assigned', 'en_route', 'reached', 'completed'].map((status, index) => (
                <View key={status} className="items-center flex-1">
                  <View className={`w-8 h-8 rounded-full items-center justify-center ${
                    responderStatus === status ? getStatusColor(status) : 'bg-gray-300'
                  }`}>
                    <Text className="text-white text-sm">{index + 1}</Text>
                  </View>
                  <Text className={`text-xs mt-1 text-center ${
                    responderStatus === status ? 'text-on-surface font-medium' : 'text-on-surface-variant'
                  }`}>
                    {status.replace('_', ' ').toUpperCase()}
                  </Text>
                </View>
              ))}
            </View>
            
            {/* Status Action Buttons */}
            <View className="flex-row space-x-2">
              {responderStatus === 'assigned' && (
                <TouchableOpacity
                  className="flex-1 bg-orange-500 py-3 rounded-lg"
                  onPress={() => handleStatusUpdate('en_route')}
                >
                  <Text className="text-white text-center font-semibold">Start Navigation</Text>
                </TouchableOpacity>
              )}
              
              {responderStatus === 'en_route' && (
                <TouchableOpacity
                  className="flex-1 bg-purple-500 py-3 rounded-lg"
                  onPress={() => handleStatusUpdate('reached')}
                >
                  <Text className="text-white text-center font-semibold">Mark as Reached</Text>
                </TouchableOpacity>
              )}
              
              {responderStatus === 'reached' && (
                <TouchableOpacity
                  className="flex-1 bg-green-500 py-3 rounded-lg"
                  onPress={handleCompleteEmergency}
                >
                  <Text className="text-white text-center font-semibold">Complete Emergency</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        {/* Location Information */}
        <View className="px-6 mb-6">
          <Text className="text-title text-on-surface mb-3">Location Details</Text>
          <View className="bg-surface-variant rounded-xl p-4">
            <View className="flex-row items-start mb-3">
              <Text className="text-2xl mr-3">📍</Text>
              <View className="flex-1">
                <Text className="text-on-surface font-medium">{emergency.location}</Text>
                <Text className="text-label text-on-surface-variant mt-1">
                  {emergency.distance} away • ETA: {emergency.eta}
                </Text>
              </View>
            </View>
            
            <TouchableOpacity
              className="bg-primary py-3 rounded-lg mt-2"
              onPress={handleNavigateToLocation}
            >
              <Text className="text-white text-center font-semibold">Open in Maps</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Victim Information */}
        <View className="px-6 mb-6">
          <Text className="text-title text-on-surface mb-3">Victim Information</Text>
          <View className="bg-surface-variant rounded-xl p-4">
            <View className="flex-row justify-between items-center mb-3">
              <View>
                <Text className="text-on-surface font-medium">
                  {emergency.victimInfo.gender}, {emergency.victimInfo.age}
                </Text>
                <Text className="text-label text-on-surface-variant">
                  {emergency.victimInfo.isAnonymous ? 'Anonymous Report' : 'Identified User'}
                </Text>
              </View>
              {!emergency.victimInfo.isAnonymous && (
                <TouchableOpacity
                  className="bg-green-500 px-4 py-2 rounded-lg"
                  onPress={handleCallVictim}
                >
                  <Text className="text-white font-semibold">Call Victim</Text>
                </TouchableOpacity>
              )}
            </View>
            
            {emergency.victimInfo.phone && !emergency.victimInfo.isAnonymous && (
              <Text className="text-label text-on-surface-variant">
                Phone: {emergency.victimInfo.phone}
              </Text>
            )}
          </View>
        </View>

        {/* Incident Details */}
        <View className="px-6 mb-6">
          <Text className="text-title text-on-surface mb-3">Incident Details</Text>
          <View className="bg-surface-variant rounded-xl p-4">
            <Text className="text-on-surface mb-4">{emergency.incidentDetails}</Text>
            
            <View className="flex-row space-x-4">
              {emergency.audioRecording && (
                <View className="flex-row items-center">
                  <Text className="text-green-500 mr-1">🎵</Text>
                  <Text className="text-label text-on-surface-variant">Audio Available</Text>
                </View>
              )}
              {emergency.imagesCaptured > 0 && (
                <View className="flex-row items-center">
                  <Text className="text-blue-500 mr-1">📸</Text>
                  <Text className="text-label text-on-surface-variant">
                    {emergency.imagesCaptured} Images
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Emergency Media (if available) */}
        {emergency.mediaAvailable && (
          <View className="px-6 mb-6">
            <Text className="text-title text-on-surface mb-3">Emergency Media</Text>
            <View className="bg-surface-variant rounded-xl p-4">
              <Text className="text-on-surface mb-2">Available evidence from victim:</Text>
              <View className="flex-row space-x-2">
                <TouchableOpacity className="bg-primary/20 px-3 py-2 rounded-lg">
                  <Text className="text-primary text-center">Listen to Audio</Text>
                </TouchableOpacity>
                <TouchableOpacity className="bg-secondary/20 px-3 py-2 rounded-lg">
                  <Text className="text-secondary text-center">View Images</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Quick Actions */}
        <View className="px-6 mb-8">
          <Text className="text-title text-on-surface mb-3">Quick Actions</Text>
          <View className="flex-row space-x-3">
            <TouchableOpacity
              className="flex-1 bg-surface-variant py-4 rounded-xl items-center"
              onPress={handleCallControlCenter}
            >
              <Text className="text-2xl mb-1">📞</Text>
              <Text className="text-on-surface font-semibold">Control Center</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              className="flex-1 bg-surface-variant py-4 rounded-xl items-center"
              onPress={() => Alert.alert("Request Backup", "This would request additional responders")}
            >
              <Text className="text-2xl mb-1">🆘</Text>
              <Text className="text-on-surface font-semibold">Request Backup</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              className="flex-1 bg-surface-variant py-4 rounded-xl items-center"
              onPress={() => router.push('/(agent)/incident-report')}
            >
              <Text className="text-2xl mb-1">📝</Text>
              <Text className="text-on-surface font-semibold">Incident Report</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Response Time Indicator */}
      <View className="absolute top-4 right-4 bg-panic/90 px-3 py-2 rounded-full">
        <Text className="text-green-500 text-sm">Response: {timeElapsed}s</Text>
      </View>
    </View>
  );
}