// app/user/index.tsx
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../providers/ThemeProvider';

export default function Dashboard() {
  const router = useRouter();
  const { effectiveTheme } = useTheme();
  const [locationStatus, setLocationStatus] = useState('Active');
  const [emergencyContacts, setEmergencyContacts] = useState(3);
  const [safetyScore, setSafetyScore] = useState(85);

  // Mock data for recent alerts
  const recentAlerts = [
    { id: 1, type: 'location', time: '2 mins ago', status: 'active' },
    { id: 2, type: 'test', time: '1 hour ago', status: 'completed' },
  ];

  const quickActions = [
    { 
      title: 'Emergency Alert', 
      icon: '🚨', 
      color: 'bg-panic', 
      action: () => router.push('/panic-confirm') 
    },
    { 
      title: 'Share Location', 
      icon: '📍', 
      color: 'bg-secondary', 
      action: () => Alert.alert('Location', 'Sharing your live location with trusted contacts') 
    },
    { 
      title: 'Quick Report', 
      icon: '📝', 
      color: 'bg-tertiary', 
      action: () => router.push('/report') 
    },
    { 
      title: 'Safety Check', 
      icon: '✅', 
      color: 'bg-primary', 
      action: () => router.push('/safety-check') 
    },
  ];

  const safetyTips = [
    { title: 'Emergency Contacts', description: '3 contacts set up', icon: '👥' },
    { title: 'Safe Routes', description: '2 routes saved', icon: '🗺️' },
    { title: 'Recent Alerts', description: '1 alert this week', icon: '🔔' },
  ];

  return (
    <View className="flex-1 bg-background">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header Section */}
        <View className="px-6 pt-6 pb-4">
          <View className="flex-row justify-between items-center mb-2">
            <View>
              <Text className="text-2xl font-bold text-on-surface">Hello, User</Text>
              <Text className="text-on-surface-variant">Your safety is our priority</Text>
            </View>
            <TouchableOpacity
              className="bg-surface-variant rounded-full overflow-hidden"
              onPress={() => router.push('/profile')}
            >
              <Image
                  source={require('../../assets/images/welcome.png')}
                  style={{ width: 40, height: 40, borderRadius: 20 }}
                />

            </TouchableOpacity>
          </View>

          {/* Safety Status Card */}
          <View className="bg-primary/10 p-4 rounded-xl mt-4">
            <View className="flex-row justify-between items-center">
              <View>
                <Text className="text-lg font-semibold text-on-surface">Safety Status</Text>
                <Text className="text-on-surface-variant">Location sharing: <Text className="text-accent">{locationStatus}</Text></Text>
              </View>
              <View className="items-end">
                <Text className="text-3xl font-bold text-primary">{safetyScore}</Text>
                <Text className="text-on-surface-variant text-xs">Safety Score</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Quick Actions Grid */}
        <View className="px-6 mt-2">
          <Text className="text-lg font-semibold text-on-surface mb-3">Quick Actions</Text>
          <View className="flex-row flex-wrap justify-between">
            {quickActions.map((action, index) => (
              <TouchableOpacity
                key={index}
                className={`${action.color} w-[48%] mb-4 p-5 rounded-xl items-center justify-center`}
                onPress={action.action}
                activeOpacity={0.8}
              >
                <Text className="text-2xl mb-2">{action.icon}</Text>
                <Text className="text-on-primary font-semibold text-center">{action.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Safety Overview */}
        <View className="px-6 mt-4">
          <Text className="text-lg font-semibold text-on-surface mb-3">Safety Overview</Text>
          <View className="bg-surface-variant rounded-xl p-4">
            {safetyTips.map((tip, index) => (
              <View key={index} className={`flex-row items-center py-3 ${index < safetyTips.length - 1 ? 'border-b border-outline' : ''}`}>
                <Text className="text-2xl mr-4">{tip.icon}</Text>
                <View className="flex-1">
                  <Text className="text-on-surface font-medium">{tip.title}</Text>
                  <Text className="text-on-surface-variant text-sm">{tip.description}</Text>
                </View>
                <TouchableOpacity>
                  <Text className="text-primary">View</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        {/* Recent Activity */}
        <View className="px-6 mt-6 mb-10">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-lg font-semibold text-on-surface">Recent Activity</Text>
            <TouchableOpacity>
              <Text className="text-primary">See All</Text>
            </TouchableOpacity>
          </View>
          
          {recentAlerts.length > 0 ? (
            <View className="bg-surface-variant rounded-xl p-4">
              {recentAlerts.map((alert) => (
                <View key={alert.id} className="flex-row items-center py-3">
                  <View className={`w-3 h-3 rounded-full mr-3 ${alert.status === 'active' ? 'bg-accent' : 'bg-green-500'}`} />
                  <View className="flex-1">
                    <Text className="text-on-surface">
                      {alert.type === 'location' ? 'Location shared' : 'Safety test completed'}
                    </Text>
                    <Text className="text-on-surface-variant text-xs">{alert.time}</Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View className="bg-surface-variant rounded-xl p-8 items-center">
              <Text className="text-4xl mb-2">📋</Text>
              <Text className="text-on-surface text-center">No recent activity</Text>
              <Text className="text-on-surface-variant text-center text-sm mt-1">
                Your safety activities will appear here
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

    </View>
  );
}