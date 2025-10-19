// app/(agent)/index.tsx
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from "../../providers/AuthProvider";
import { api } from '../../services/api';

interface EmergencyAlert {
  alert_id: string;
  user_info: {
    full_name: string;
    phone: string;
  };
  emergency_type: string;
  initial_address: string;
  initial_latitude: number;
  initial_longitude: number;
  severity_level: string;
  activated_at: string;
  status: string;
}

interface EmergencyResponse {
  id: number;
  alert_id: string;
  alert_info: EmergencyAlert;
  status: string;
  eta_minutes: number;
  notified_at: string;
  responder_info: {
    full_name: string;
    responder_type: string;
  };
}

interface ResponderStats {
  assigned: number;
  completed: number;
  averageTime: string;
}

export default function ResponderDashboard() {
  const router = useRouter();
  const { user, updateUser } = useAuth();
  const [activeResponses, setActiveResponses] = useState<EmergencyResponse[]>([]);
  const [availableEmergencies, setAvailableEmergencies] = useState<EmergencyAlert[]>([]);
  const [responderStatus, setResponderStatus] = useState(user?.status || 'available');
  const [todayStats, setTodayStats] = useState<ResponderStats>({
    assigned: 0,
    completed: 0,
    averageTime: '0min'
  });
  const [refreshing, setRefreshing] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Fetch user profile to get latest data
  const fetchUserProfile = async () => {
    try {
      const response = await api.get('/auth/profile/');
      if (response.data.success) {
        const userData = response.data.data;
        setResponderStatus(userData.status || 'offline');
        updateUser(userData);
        return userData;
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      // Fallback to current user data
      if (user) {
        setResponderStatus(user.status || 'offline');
      }
    }
  };

  // Fetch responder assignments and available emergencies
  const fetchData = async () => {
    try {
      setRefreshing(true);
      
      // Fetch user profile first to get latest status
      await fetchUserProfile();
      
      // Fetch responder's active assignments
      const assignmentsResponse = await api.get('/aegis/responder/assignments/');
      if (assignmentsResponse.data.success) {
        setActiveResponses(assignmentsResponse.data.data);
      }

      // Fetch available emergencies (not assigned to this responder)
      const emergenciesResponse = await api.get('/aegis/emergency/active/');
      if (emergenciesResponse.data.success) {
        // Filter out emergencies already assigned to this responder
        const assignedAlertIds = new Set(assignmentsResponse.data.data.map((r: EmergencyResponse) => r.alert_info.alert_id));
        const available = emergenciesResponse.data.data.filter((alert: EmergencyAlert) => 
          !assignedAlertIds.has(alert.alert_id)
        );
        setAvailableEmergencies(available);
      }

      // Calculate today's stats
      calculateTodayStats(assignmentsResponse.data.data);

    } catch (error) {
      console.error('Error fetching data:', error);
      Alert.alert('Error', 'Failed to fetch emergency data');
    } finally {
      setRefreshing(false);
    }
  };

  const calculateTodayStats = (responses: EmergencyResponse[]) => {
    const today = new Date().toDateString();
    const todayResponses = responses.filter(response => 
      new Date(response.notified_at).toDateString() === today
    );

    const completed = todayResponses.filter(r => r.status === 'completed').length;
    const assigned = todayResponses.length;
    
    // Calculate average response time (simplified)
    const avgTime = assigned > 0 ? Math.round(assigned * 12) : 0;

    setTodayStats({
      assigned,
      completed,
      averageTime: `${avgTime}min`
    });
  };

  useEffect(() => {
    if (user) {
      setResponderStatus(user.status || 'available');
      fetchData();
    }
  }, [user]);

  useEffect(() => {
    // Set up polling for new emergencies
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleStatusChange = async (newStatus: string) => {
    if (isUpdatingStatus) return;
    
    if (responderStatus === newStatus) return;

    try {
      setIsUpdatingStatus(true);
      
      if (!user?.id) {
        Alert.alert('Error', 'User not authenticated');
        return;
      }
      
      let locationData = {};
      
      // If status is available or busy, get current location
      if (newStatus === 'available' || newStatus === 'busy') {
        try {
          // Request location permissions
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status !== 'granted') {
            Alert.alert('Permission Denied', 'Location permission is required to set status as available/busy');
            return;
          }

          // Get current location
          const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });

          // Get address from coordinates
          const [address] = await Location.reverseGeocodeAsync({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          });

          locationData = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            location: address ? 
              `${address.street || ''} ${address.city || ''} ${address.region || ''}`.trim() 
              : 'Current Location',
          };

        } catch (locationError) {
          console.error('Error getting location:', locationError);
          Alert.alert(
            'Location Error', 
            'Failed to get current location. You can still update status without location.',
            [
              {
                text: 'Update Without Location',
                onPress: () => sendStatusUpdate(newStatus, {}),
              },
              {
                text: 'Cancel',
                style: 'cancel',
              }
            ]
          );
          return;
        }
      }

      // Send status update with location data - USING YOUR EXISTING ENDPOINT
      await sendStatusUpdate(newStatus, locationData);

    } catch (error) {
      console.error('Error updating status:', error);
      Alert.alert('Error', 'Failed to update status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // KEEPING YOUR EXISTING ENDPOINT - NO CHANGES HERE
  const sendStatusUpdate = async (newStatus: string, locationData: any) => {
    try {
      const requestData = {
        status: newStatus,
        ...locationData,
      };

      // USING YOUR EXISTING ENDPOINT - NO CHANGES
      const response = await api.patch(`/auth/responders/${user!.id}/status/`, requestData);

      if (response.status === 200) {
        // Update local state immediately for better UX
        setResponderStatus(newStatus);
        
        // Also update the user in auth context
        if (user) {
          const updatedUser = { ...user, status: newStatus, ...locationData };
          updateUser(updatedUser);
        }
        
        Alert.alert('Status Updated', `You are now ${newStatus.toUpperCase()}`);
        
        // Refresh user profile to get latest data from server
        await fetchUserProfile();
      }
    } catch (error) {
      console.error('Error sending status update:', error);
      Alert.alert('Error', 'Failed to update status');
      // Revert local state on error
      setResponderStatus(responderStatus);
    }
  };

  const handleAcceptTask = async (alertId: string) => {
    if (!user?.id) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    Alert.alert(
      "Accept Emergency Task",
      "Are you ready to respond to this emergency?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Accept Task",
          onPress: async () => {
            try {
              // Update local status first
              setResponderStatus('busy');
              
              // Update backend status using existing endpoint
              await handleStatusChange('busy');
              
              // Assign responder to emergency
              const response = await api.post('/aegis/emergency/assign-responder/', {
                alert_id: alertId,
                responder_id: user.id,
                notes: "Responder accepted the task"
              });

              if (response.data.success) {
                // Update response status to accepted
                await api.post('/aegis/responder/update-status/', {
                  response_id: response.data.response_id,
                  status: 'accepted',
                  notes: 'Responder accepted the emergency'
                });

                Alert.alert('Task Accepted', 'You have been assigned to this emergency');
                router.push(`/emergency-details?alertId=${alertId}`);
                fetchData(); // Refresh data
              }
            } catch (error) {
              console.error('Error accepting task:', error);
              Alert.alert('Error', 'Failed to accept task');
            }
          }
        }
      ]
    );
  };

  const handleUpdateResponseStatus = async (responseId: number, newStatus: string, notes?: string) => {
    try {
      const response = await api.post('/aegis/responder/update-status/', {
        response_id: responseId,
        status: newStatus,
        notes: notes || '',
        eta_minutes: calculateETA(newStatus)
      });

      if (response.data.success) {
        Alert.alert('Status Updated', `Response status updated to ${newStatus}`);
        fetchData(); // Refresh data
        
        // If completing the response, set status back to available
        if (newStatus === 'completed') {
          await handleStatusChange('available');
        }
      }
    } catch (error) {
      console.error('Error updating response status:', error);
      Alert.alert('Error', 'Failed to update response status');
    }
  };

  const handleViewEmergency = (alertId: string) => {
    router.push(`/emergency-details?alertId=${alertId}`);
  };

  const calculateETA = (status: string): number => {
    switch (status) {
      case 'en_route': return 5;
      case 'on_scene': return 2;
      default: return 0;
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
      case 'medical': return '🏥';
      case 'fire': return '🔥';
      default: return '⚠️';
    }
  };

  const formatTimeElapsed = (timestamp: string) => {
    const now = new Date();
    const then = new Date(timestamp);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  };

  // Show loading if user data is not available
  if (!user) {
    return (
      <View className="flex-1 bg-background justify-center items-center">
        <Text className="text-on-surface">Loading...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <ScrollView 
        className="flex-1" 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={fetchData} />
        }
      >
        {/* Header with Status */}
        <View className="px-6 pt-6 pb-4">
          <View className="flex-row justify-between items-center mb-4">
            <View>
              <Text className="text-headline text-on-surface">Hello, {user.name}</Text>
              <Text className="text-body text-on-surface-variant">
                {/* {user.responder_type ? `${user.responder_type} Unit` : 'Emergency Response Unit'} */}
                {user.badge_number ? `Badge no. ${user.badge_number} `: 'unknown'}
              </Text>
            </View>
            <View className={`px-3 py-1 rounded-full ${
              responderStatus === 'available' ? 'bg-green-500/20' : 
              responderStatus === 'busy' ? 'bg-orange-500/20' : 'bg-gray-500/20'
            }`}>
              <Text className={
                responderStatus === 'available' ? 'text-green-500' : 
                responderStatus === 'busy' ? 'text-orange-500' : 'text-gray-500'
              }>
                {responderStatus.toUpperCase()}
              </Text>
            </View>
          </View>

          {/* Quick Status Toggle */}
          <View className="flex-row space-x-2 mb-4">
            <TouchableOpacity
              className={`flex-1 py-2 rounded-lg ${
                responderStatus === 'available' ? 'bg-green-500' : 'bg-surface-variant'
              } ${isUpdatingStatus ? 'opacity-50' : ''}`}
              onPress={() => handleStatusChange('available')}
              disabled={isUpdatingStatus || responderStatus === 'available'}
            >
              <Text className={`text-center ${
                responderStatus === 'available' ? 'text-white' : 'text-on-surface'
              }`}>
                {isUpdatingStatus && responderStatus === 'available' ? 'Updating...' : 'Available'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={`flex-1 py-2 rounded-lg ${
                responderStatus === 'busy' ? 'bg-orange-500' : 'bg-surface-variant'
              } ${isUpdatingStatus ? 'opacity-50' : ''}`}
              onPress={() => handleStatusChange('busy')}
              disabled={isUpdatingStatus || responderStatus === 'busy'}
            >
              <Text className={`text-center ${
                responderStatus === 'busy' ? 'text-white' : 'text-on-surface'
              }`}>
                {isUpdatingStatus && responderStatus === 'busy' ? 'Updating...' : 'Busy'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={`flex-1 py-2 rounded-lg ${
                responderStatus === 'offline' ? 'bg-gray-500' : 'bg-surface-variant'
              } ${isUpdatingStatus ? 'opacity-50' : ''}`}
              onPress={() => handleStatusChange('offline')}
              disabled={isUpdatingStatus || responderStatus === 'offline'}
            >
              <Text className={`text-center ${
                responderStatus === 'offline' ? 'text-white' : 'text-on-surface'
              }`}>
                {isUpdatingStatus && responderStatus === 'offline' ? 'Updating...' : 'Offline'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Today's Stats */}
          <View className="bg-primary/10 rounded-xl p-4">
            <Text className="text-title text-on-surface mb-3">Today's Response</Text>
            <View className="flex-row justify-between">
              <View className="items-center">
                <Text className="text-headline font-bold text-primary">{todayStats.assigned}</Text>
                <Text className="text-label text-on-surface-variant">Assigned</Text>
              </View>
              <View className="items-center">
                <Text className="text-headline font-bold text-green-500">{todayStats.completed}</Text>
                <Text className="text-label text-on-surface-variant">Completed</Text>
              </View>
              <View className="items-center">
                <Text className="text-headline font-bold text-secondary">{todayStats.averageTime}</Text>
                <Text className="text-label text-on-surface-variant">Avg. Time</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Active Emergency Assignments */}
        {activeResponses.length > 0 && (
          <View className="px-6 mb-6">
            <Text className="text-title text-on-surface mb-3">Active Emergency</Text>
            {activeResponses.map((response) => (
              <TouchableOpacity
                key={response.id}
                className="bg-surface-variant rounded-xl p-4 mb-3 border-l-4 border-orange-500"
                onPress={() => handleViewEmergency(response.alert_info.alert_id)}
              >
                <View className="flex-row justify-between items-start mb-2">
                  <View className="flex-1">
                    <Text className="text-on-surface font-semibold">Emergency #{response.alert_info.alert_id}</Text>
                    <Text className="text-label text-on-surface-variant">
                      {response.alert_info.emergency_type.toUpperCase()}
                    </Text>
                  </View>
                  <View className={`px-2 py-1 rounded-full ${getPriorityColor(response.alert_info.severity_level)}`}>
                    <Text className="text-white text-xs">{response.alert_info.severity_level.toUpperCase()}</Text>
                  </View>
                </View>
                
                <View className="flex-row items-center mb-2">
                  <Text className="text-lg mr-2">{getTypeIcon(response.alert_info.emergency_type)}</Text>
                  <Text className="text-on-surface flex-1">{response.alert_info.initial_address}</Text>
                </View>

                <View className="flex-row justify-between mb-2">
                  <Text className="text-label text-on-surface-variant">
                    👤 {response.alert_info.user_info.full_name}
                  </Text>
                  <Text className="text-label text-on-surface-variant">
                    {formatTimeElapsed(response.alert_info.activated_at)}
                  </Text>
                </View>

                <View className="flex-row space-x-2">
                  <TouchableOpacity
                    className="flex-1 bg-orange-500 py-2 rounded-lg"
                    onPress={() => handleViewEmergency(response.alert_info.alert_id)}
                  >
                    <Text className="text-white text-center font-semibold">View Details</Text>
                  </TouchableOpacity>
                  
                  {response.status === 'accepted' && (
                    <TouchableOpacity
                      className="flex-1 bg-green-500 py-2 rounded-lg"
                      onPress={() => handleUpdateResponseStatus(response.id, 'en_route', 'Heading to location')}
                    >
                      <Text className="text-white text-center font-semibold">Start Route</Text>
                    </TouchableOpacity>
                  )}
                  
                  {response.status === 'en_route' && (
                    <TouchableOpacity
                      className="flex-1 bg-blue-500 py-2 rounded-lg"
                      onPress={() => handleUpdateResponseStatus(response.id, 'on_scene', 'Arrived at location')}
                    >
                      <Text className="text-white text-center font-semibold">Arrived</Text>
                    </TouchableOpacity>
                  )}
                  
                  {response.status === 'on_scene' && (
                    <TouchableOpacity
                      className="flex-1 bg-purple-500 py-2 rounded-lg"
                      onPress={() => handleUpdateResponseStatus(response.id, 'completed', 'Emergency resolved')}
                    >
                      <Text className="text-white text-center font-semibold">Complete</Text>
                    </TouchableOpacity>
                  )}
                </View>

                <Text className="text-label text-on-surface-variant text-center mt-2">
                  Current Status: <Text className="font-semibold">{response.status.replace('_', ' ').toUpperCase()}</Text>
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Available Emergencies */}
        <View className="px-6 mb-6">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-title text-on-surface">Available Emergencies</Text>
            <TouchableOpacity onPress={fetchData}>
              <Text className="text-primary">Refresh</Text>
            </TouchableOpacity>
          </View>

          {availableEmergencies.length > 0 ? (
            <View className="space-y-3">
              {availableEmergencies.map((emergency) => (
                <TouchableOpacity
                  key={emergency.alert_id}
                  className="bg-surface-variant rounded-xl p-4 border-l-4 border-blue-500"
                  onPress={() => handleAcceptTask(emergency.alert_id)}
                >
                  <View className="flex-row justify-between items-start mb-2">
                    <View className="flex-1">
                      <Text className="text-on-surface font-semibold">Emergency #{emergency.alert_id}</Text>
                      <Text className="text-label text-on-surface-variant">
                        {emergency.emergency_type.toUpperCase()}
                      </Text>
                    </View>
                    <View className={`px-2 py-1 rounded-full ${getPriorityColor(emergency.severity_level)}`}>
                      <Text className="text-white text-xs">{emergency.severity_level.toUpperCase()}</Text>
                    </View>
                  </View>
                  
                  <View className="flex-row items-center mb-2">
                    <Text className="text-lg mr-2">{getTypeIcon(emergency.emergency_type)}</Text>
                    <Text className="text-on-surface flex-1">{emergency.initial_address}</Text>
                  </View>

                  <View className="flex-row justify-between mb-2">
                    <Text className="text-label text-on-surface-variant">
                      👤 {emergency.user_info.full_name}
                    </Text>
                    <Text className="text-label text-on-surface-variant">
                      {formatTimeElapsed(emergency.activated_at)}
                    </Text>
                  </View>

                  <TouchableOpacity
                    className="bg-primary py-3 rounded-lg"
                    onPress={() => handleAcceptTask(emergency.alert_id)}
                  >
                    <Text className="text-white text-center font-semibold">Accept Emergency</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View className="bg-surface-variant rounded-xl p-8 items-center">
              <Text className="text-4xl mb-2">📋</Text>
              <Text className="text-on-surface text-center">No available emergencies</Text>
              <Text className="text-label text-on-surface-variant text-center mt-1">
                New emergencies will appear here when available
              </Text>
            </View>
          )}
        </View>

        {/* Quick Actions */}
        <View className="px-6 mb-8">
          <Text className="text-title text-on-surface mb-3">Quick Actions</Text>
          <View className="flex-row flex-wrap justify-between">
            {/* <TouchableOpacity 
              className="bg-surface-variant w-[48%] p-4 rounded-xl items-center mb-3"
              onPress={() => router.push('/(agent)/messages')}
            >
              <Text className="text-2xl mb-2">💬</Text>
              <Text className="text-on-surface text-center">Messages</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              className="bg-surface-variant w-[48%] p-4 rounded-xl items-center mb-3"
              onPress={() => router.push('/(agent)/stats')}
            >
              <Text className="text-2xl mb-2">📊</Text>
              <Text className="text-on-surface text-center">My Stats</Text>
            </TouchableOpacity>
             */}
            {/* <TouchableOpacity 
              className="bg-surface-variant w-[48%] p-4 rounded-xl items-center"
            >
              <Text className="text-2xl mb-2">📞</Text>
              <Text className="text-on-surface text-center">Control Center</Text>
            </TouchableOpacity> */}

            <TouchableOpacity 
              className="bg-surface-variant w-[48%] p-4 rounded-xl items-center"
              onPress={() => router.push('/(agent)/notifications')}
            >
              <Text className="text-2xl mb-2">🔔</Text>
              <Text className="text-on-surface text-center">Notification</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              className="bg-surface-variant w-[48%] p-4 rounded-xl items-center"
              onPress={() => router.push('/(agent)/settings')}
            >
              <Text className="text-2xl mb-2">⚙️</Text>
              <Text className="text-on-surface text-center">Settings</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}