// app/user/index.tsx
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../providers/ThemeProvider';

export default function Dashboard() {
  const router = useRouter();
  const { effectiveTheme } = useTheme();
  const [locationStatus, setLocationStatus] = useState('Active');
  const [emergencyContacts, setEmergencyContacts] = useState(3);
  const [safetyScore, setSafetyScore] = useState(85);
  const [isStealthMode, setIsStealthMode] = useState(false);

  // Mock data for recent alerts
  const recentAlerts = [
    { id: 1, type: 'panic', time: '2 mins ago', status: 'active' },
    { id: 2, type: 'test', time: '1 hour ago', status: 'completed' },
  ];

  const quickActions = [
    { 
      title: 'Emergency Alert', 
      description: 'Trigger immediate help',
      icon: '🚨', 
      color: 'bg-panic', 
      action: () => router.push('/(user)/panic-confirm'),
      emergency: true
    },
    { 
      title: 'Stealth Mode', 
      description: 'Discreet safety features',
      icon: isStealthMode ? '🕶️' : '👁️', 
      color: isStealthMode ? 'bg-green-500' : 'bg-surface-variant', 
      action: () => {
        setIsStealthMode(!isStealthMode);
        Alert.alert('Stealth Mode', isStealthMode ? 'Stealth mode deactivated' : 'Stealth mode activated');
      }
    },
    { 
      title: 'Silent Capture', 
      description: 'Record evidence discreetly',
      icon: '📸', 
      color: 'bg-secondary', 
      action: () => router.push('/(user)/silent-capture') 
    },
    { 
      title: 'Safety Check', 
      description: 'Confirm your safety status',
      icon: '✅', 
      color: 'bg-tertiary', 
      action: () => router.push('/(user)/safety-check') 
    },
    { 
      title: 'Report Incident', 
      description: 'Submit anonymous report',
      icon: '📝', 
      color: 'bg-primary', 
      action: () => router.push('/(user)/report') 
    },
    { 
      title: 'Safe Routes', 
      description: 'View safe paths home',
      icon: '🗺️', 
      color: 'bg-accent', 
      action: () => router.push('/(user)/safe-routes') 
    },
  ];

  const safetyResources = [
    { 
      title: 'Emergency Contacts', 
      description: `${emergencyContacts} contacts set up`, 
      icon: '👥',
      action: () => router.push('/(user)/contacts')
    },
    { 
      title: 'Self-Defense Guides', 
      description: 'Learn protective techniques', 
      icon: '🥋',
      action: () => router.push('/(user)/learn')
    },
    { 
      title: 'Legal Rights', 
      description: 'Know your legal protections', 
      icon: '📖',
      action: () => router.push('/(user)/legal-rights')
    },
  ];

  const toggleStealthMode = () => {
    setIsStealthMode(!isStealthMode);
    Alert.alert('Stealth Mode', isStealthMode ? 'Stealth mode deactivated' : 'Stealth mode activated. App will appear as a calculator to others.');
  };

  return (
    <View className="flex-1 bg-background">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header Section */}
        <View className="px-6 pt-6 pb-4">
          <View className="flex-row justify-between items-center mb-2">
            <View>
              <Text className="text-headline text-on-surface">Hello, User</Text>
              <Text className="text-body text-on-surface-variant">Your safety is our priority</Text>
            </View>
            <TouchableOpacity 
              className="bg-surface-variant p-3 rounded-full"
              onPress={() => router.push('/(user)/profile')}
            >
              <Text className="text-xl">👤</Text>
            </TouchableOpacity>
          </View>

          {/* Safety Status Card */}
          <View className="bg-primary/10 p-4 rounded-xl mt-4">
            <View className="flex-row justify-between items-center">
              <View>
                <Text className="text-title text-on-surface">Safety Status</Text>
                <View className="flex-row items-center mt-1">
                  <View className={`w-3 h-3 rounded-full mr-2 ${locationStatus === 'Active' ? 'bg-green-500' : 'bg-accent'}`} />
                  <Text className="text-on-surface-variant">
                    Location: <Text className="text-on-surface font-medium">{locationStatus}</Text>
                  </Text>
                </View>
              </View>
              <View className="items-end">
                <Text className="text-headline font-bold text-primary">{safetyScore}</Text>
                <Text className="text-label text-on-surface-variant">Safety Score</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Quick Actions Grid */}
        <View className="px-6 mt-2">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-title text-on-surface">Quick Actions</Text>
            <TouchableOpacity onPress={toggleStealthMode} className="flex-row items-center">
              <Text className={`text-lg mr-1 ${isStealthMode ? "text-green-500" : "text-on-surface-variant"}`}>
                {isStealthMode ? "🕶️" : "👁️"}
              </Text>
              <Text className={`text-label ${isStealthMode ? "text-green-500" : "text-on-surface-variant"}`}>
                {isStealthMode ? "Stealth On" : "Stealth Off"}
              </Text>
            </TouchableOpacity>
          </View>
          
          <View className="flex-row flex-wrap justify-between">
            {quickActions.map((action, index) => (
              <TouchableOpacity
                key={index}
                className={`w-[48%] mb-4 p-4 rounded-xl ${action.emergency ? 'border border-panic' : 'border border-outline'}`}
                onPress={action.action}
                activeOpacity={0.8}
                style={{ backgroundColor: action.emergency ? 'rgba(220, 38, 38, 0.1)' : 'rgb(var(--color-surface-variant))' }}
              >
                <View className="flex-row items-center">
                  <View className={`p-2 rounded-full mr-3 ${action.color}`}>
                    <Text className="text-lg">{action.icon}</Text>
                  </View>
                  <View className="flex-1">
                    <Text 
                      className="text-on-surface font-medium" 
                      style={{ color: action.emergency ? 'rgb(var(--color-error))' : 'rgb(var(--color-on-surface))' }}
                    >
                      {action.title}
                    </Text>
                    <Text className="text-label text-on-surface-variant mt-1">{action.description}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Safety Resources */}
        <View className="px-6 mt-4">
          <Text className="text-title text-on-surface mb-3">Safety Resources</Text>
          <View className="bg-surface-variant rounded-xl overflow-hidden">
            {safetyResources.map((resource, index) => (
              <TouchableOpacity
                key={index}
                className={`flex-row items-center py-4 px-5 ${index < safetyResources.length - 1 ? 'border-b border-outline' : ''}`}
                onPress={resource.action}
                activeOpacity={0.7}
              >
                <View className="bg-primary/20 p-2 rounded-full mr-4">
                  <Text className="text-lg">{resource.icon}</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-on-surface font-medium">{resource.title}</Text>
                  <Text className="text-label text-on-surface-variant">{resource.description}</Text>
                </View>
                <Text className="text-primary">→</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recent Activity */}
        <View className="px-6 mt-6 mb-10">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-title text-on-surface">Recent Activity</Text>
            <TouchableOpacity>
              <Text className="text-primary">See All</Text>
            </TouchableOpacity>
          </View>
          
          {recentAlerts.length > 0 ? (
            <View className="bg-surface-variant rounded-xl overflow-hidden">
              {recentAlerts.map((alert, index) => (
                <View 
                  key={alert.id} 
                  className={`flex-row items-center py-4 px-5 ${index < recentAlerts.length - 1 ? 'border-b border-outline' : ''}`}
                >
                  <View className={`p-2 rounded-full mr-4 ${alert.status === 'active' ? 'bg-error/20' : 'bg-green-500/20'}`}>
                    <Text className={alert.status === 'active' ? 'text-error' : 'text-green-500'}>
                      {alert.type === 'panic' ? '🚨' : '✅'}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-on-surface">
                      {alert.type === 'panic' ? 'Emergency alert activated' : 'Safety test completed'}
                    </Text>
                    <Text className="text-label text-on-surface-variant">{alert.time}</Text>
                  </View>
                  <Text className="text-on-surface-variant">→</Text>
                </View>
              ))}
            </View>
          ) : (
            <View className="bg-surface-variant rounded-xl p-8 items-center">
              <Text className="text-4xl mb-2">📋</Text>
              <Text className="text-on-surface text-center">No recent activity</Text>
              <Text className="text-label text-on-surface-variant text-center mt-1">
                Your safety activities will appear here
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}