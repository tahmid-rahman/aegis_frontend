// app/(agent)/index.tsx
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';

export default function ResponderDashboard() {
  const router = useRouter();
  const [activeEmergency, setActiveEmergency] = useState(null);
  const [responderStatus, setResponderStatus] = useState('available'); // available, busy, offline
  const [responseTime, setResponseTime] = useState('--:--');
  const [todayStats, setTodayStats] = useState({
    assigned: 0,
    completed: 0,
    averageTime: '0min'
  });

  // Mock data for active emergencies
  const activeEmergencies = [
    {
      id: 'EMG-2024-0012',
      type: 'harassment',
      priority: 'high',
      location: 'Gulshan 1, Dhaka',
      distance: '1.2 km',
      eta: '3 min',
      victimInfo: 'Female, 25',
      timeElapsed: '2 min ago',
      status: 'assigned'
    },
    {
      id: 'EMG-2024-0013',
      type: 'robbery',
      priority: 'critical',
      location: 'Dhanmondi, Dhaka',
      distance: '3.5 km',
      eta: '8 min',
      victimInfo: 'Anonymous',
      timeElapsed: '1 min ago',
      status: 'pending'
    }
  ];

  // Mock available tasks
  const availableTasks = [
    {
      id: 'TASK-001',
      type: 'harassment',
      location: 'Banani, Dhaka',
      distance: '0.8 km',
      timeSince: '30 sec ago',
      priority: 'medium'
    },
    {
      id: 'TASK-002',
      type: 'stalking',
      location: 'Uttara, Dhaka',
      distance: '5.2 km',
      timeSince: '1 min ago',
      priority: 'low'
    }
  ];

  useEffect(() => {
    // Simulate receiving emergency alerts
    const emergencyCheck = setInterval(() => {
      // This would check for new assignments from control center
      console.log("Checking for new emergencies...");
    }, 10000);

    return () => clearInterval(emergencyCheck);
  }, []);

  const handleStatusChange = (newStatus: string) => {
    setResponderStatus(newStatus);
    Alert.alert('Status Updated', `You are now ${newStatus.toUpperCase()}`);
    
    // This would notify control center of status change
    console.log(`Responder status changed to: ${newStatus}`);
  };

  const handleAcceptTask = (taskId: string) => {
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
          onPress: () => {
            setResponderStatus('busy');
            router.push(`/emergency-details?taskId=${taskId}`);
          }
        }
      ]
    );
  };

  const handleViewEmergency = (emergencyId: string) => {
    router.push(`/emergency-details?emergencyId=${emergencyId}`);
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

  return (
    <View className="flex-1 bg-background">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header with Status */}
        <View className="px-6 pt-6 pb-4">
          <View className="flex-row justify-between items-center mb-4">
            <View>
              <Text className="text-headline text-on-surface">Hello, Responder</Text>
              <Text className="text-body text-on-surface-variant">Emergency Response Unit</Text>
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
              }`}
              onPress={() => handleStatusChange('available')}
            >
              <Text className={`text-center ${
                responderStatus === 'available' ? 'text-white' : 'text-on-surface'
              }`}>
                Available
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={`flex-1 py-2 rounded-lg ${
                responderStatus === 'busy' ? 'bg-orange-500' : 'bg-surface-variant'
              }`}
              onPress={() => handleStatusChange('busy')}
            >
              <Text className={`text-center ${
                responderStatus === 'busy' ? 'text-white' : 'text-on-surface'
              }`}>
                Busy
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={`flex-1 py-2 rounded-lg ${
                responderStatus === 'offline' ? 'bg-gray-500' : 'bg-surface-variant'
              }`}
              onPress={() => handleStatusChange('offline')}
            >
              <Text className={`text-center ${
                responderStatus === 'offline' ? 'text-white' : 'text-on-surface'
              }`}>
                Offline
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

        {/* Active Emergency Assignment */}
        {activeEmergencies.filter(e => e.status === 'assigned').length > 0 && (
          <View className="px-6 mb-6">
            <Text className="text-title text-on-surface mb-3">Active Emergency</Text>
            {activeEmergencies.filter(e => e.status === 'assigned').map((emergency) => (
              <TouchableOpacity
                key={emergency.id}
                className="bg-surface-variant rounded-xl p-4 mb-3 border-l-4 border-orange-500"
                onPress={() => handleViewEmergency(emergency.id)}
              >
                <View className="flex-row justify-between items-start mb-2">
                  <View className="flex-1">
                    <Text className="text-on-surface font-semibold">Emergency #{emergency.id}</Text>
                    <Text className="text-label text-on-surface-variant">{emergency.type.toUpperCase()}</Text>
                  </View>
                  <View className={`px-2 py-1 rounded-full ${getPriorityColor(emergency.priority)}`}>
                    <Text className="text-white text-xs">{emergency.priority.toUpperCase()}</Text>
                  </View>
                </View>
                
                <View className="flex-row items-center mb-2">
                  <Text className="text-lg mr-2">{getTypeIcon(emergency.type)}</Text>
                  <Text className="text-on-surface flex-1">{emergency.location}</Text>
                </View>

                <View className="flex-row justify-between">
                  <Text className="text-label text-on-surface-variant">🚗 {emergency.distance} • ⏱️ {emergency.eta}</Text>
                  <Text className="text-label text-on-surface-variant">{emergency.timeElapsed}</Text>
                </View>

                <TouchableOpacity
                  className="bg-orange-500 py-3 rounded-lg mt-3"
                  onPress={() => handleViewEmergency(emergency.id)}
                >
                  <Text className="text-white text-center font-semibold">Navigate to Victim</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Available Tasks */}
        <View className="px-6 mb-6">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-title text-on-surface">Available Tasks</Text>
            <TouchableOpacity>
              <Text className="text-primary">Refresh</Text>
            </TouchableOpacity>
          </View>

          {availableTasks.length > 0 ? (
            <View className="space-y-3">
              {availableTasks.map((task) => (
                <TouchableOpacity
                  key={task.id}
                  className="bg-surface-variant rounded-xl p-4 border-l-4 border-blue-500"
                  onPress={() => handleAcceptTask(task.id)}
                >
                  <View className="flex-row justify-between items-start mb-2">
                    <View className="flex-1">
                      <Text className="text-on-surface font-semibold">Task #{task.id}</Text>
                      <Text className="text-label text-on-surface-variant">{task.type.toUpperCase()}</Text>
                    </View>
                    <View className={`px-2 py-1 rounded-full ${getPriorityColor(task.priority)}`}>
                      <Text className="text-white text-xs">{task.priority.toUpperCase()}</Text>
                    </View>
                  </View>
                  
                  <View className="flex-row items-center mb-2">
                    <Text className="text-lg mr-2">{getTypeIcon(task.type)}</Text>
                    <Text className="text-on-surface flex-1">{task.location}</Text>
                  </View>

                  <View className="flex-row justify-between">
                    <Text className="text-label text-on-surface-variant">📏 {task.distance}</Text>
                    <Text className="text-label text-on-surface-variant">🕒 {task.timeSince}</Text>
                  </View>

                  <TouchableOpacity
                    className="bg-primary py-3 rounded-lg mt-3"
                    onPress={() => handleAcceptTask(task.id)}
                  >
                    <Text className="text-white text-center font-semibold">Accept Task</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View className="bg-surface-variant rounded-xl p-8 items-center">
              <Text className="text-4xl mb-2">📋</Text>
              <Text className="text-on-surface text-center">No available tasks</Text>
              <Text className="text-label text-on-surface-variant text-center mt-1">
                New tasks will appear here
              </Text>
            </View>
          )}
        </View>

        {/* Quick Actions */}
        <View className="px-6 mb-8">
          <Text className="text-title text-on-surface mb-3">Quick Actions</Text>
          <View className="flex-row flex-wrap justify-between">
            <TouchableOpacity className="bg-surface-variant w-[48%] p-4 rounded-xl items-center mb-3">
              <Text className="text-2xl mb-2">🗺️</Text>
              <Text className="text-on-surface text-center">Area Map</Text>
            </TouchableOpacity>
            
            <TouchableOpacity className="bg-surface-variant w-[48%] p-4 rounded-xl items-center mb-3">
              <Text className="text-2xl mb-2">📊</Text>
              <Text className="text-on-surface text-center">My Stats</Text>
            </TouchableOpacity>
            
            <TouchableOpacity className="bg-surface-variant w-[48%] p-4 rounded-xl items-center">
              <Text className="text-2xl mb-2">📞</Text>
              <Text className="text-on-surface text-center">Control Center</Text>
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