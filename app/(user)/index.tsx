// app/user/index.tsx
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../providers/AuthProvider';
import { useTheme } from '../../providers/ThemeProvider';
import { api } from '../../services/api';

interface UserProfile {
  id: number;
  name: string;
  email: string;
  user_type: string;
  profile_picture?: string;
  phone: string;
  location: string;
}

interface SafetyScore {
  score: number;
  created_at: string;
  updated_at: string;
}

interface Notification {
  id: number;
  title: string;
  message: string;
  notification_type: string;
  is_read: boolean;
  created_at: string;
}

interface NotificationsResponse {
  success: boolean;
  unread_count: number;
  data: Notification[];
}

export default function Dashboard() {
  const router = useRouter();
  const { effectiveTheme } = useTheme();
  const { user: authUser } = useAuth();
  
  const [locationStatus, setLocationStatus] = useState('Active');
  const [emergencyContacts, setEmergencyContacts] = useState(3);
  const [safetyScore, setSafetyScore] = useState(85);
  const [isStealthMode, setIsStealthMode] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const baseUrl = process.env.EXPO_PUBLIC_URL;

  // Fetch user data
  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      
      // Fetch user profile
      const profileResponse = await api.get('/auth/profile/');
      setUserProfile(profileResponse.data);
      console.log(profileResponse.data)

      // Fetch safety score
      try {
        const scoreResponse = await api.get('/auth/safety-scores/my-score/');
        setSafetyScore(scoreResponse.data.score);
      } catch (error) {
        console.log('Safety score not found, using default');
      }

      // Fetch notifications
      const notificationsResponse = await api.get<NotificationsResponse>('/aegis/notifications/');
      setNotifications(notificationsResponse.data.data);
      setUnreadCount(notificationsResponse.data.unread_count);

    } catch (error) {
      console.error('Error fetching user data:', error);
      Alert.alert('Error', 'Failed to load user data');
    } finally {
      setLoading(false);
    }
  };

  const markNotificationAsRead = async (notificationId: number) => {
    try {
      await api.post(`/aegis/notifications/${notificationId}/read/`);
      // Update local state
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId ? { ...notif, is_read: true } : notif
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const toggleStealthMode = () => {
    setIsStealthMode(!isStealthMode);
    Alert.alert('Stealth Mode', isStealthMode ? 'Stealth mode deactivated' : 'Stealth mode activated. App will appear as a calculator to others.');
  };

  const getProfilePictureUrl = () => {
    if (!userProfile?.profile_picture) return null;
    
    if (userProfile.profile_picture.startsWith('http')) {
      return userProfile.profile_picture;
    }
    
    // Assuming the profile_picture is a relative path
    return `${baseUrl}${userProfile.profile_picture}`;
  };

  const quickActions = [
    { 
      title: 'Emergency Alert', 
      description: 'Trigger immediate help',
      icon: '🚨', 
      color: 'bg-panic', 
      textColor: 'text-white',
      action: () => router.push('/(user)/panic-confirm'),
      emergency: true
    },
    { 
      title: 'Stealth Mode', 
      description: 'Discreet safety features',
      icon: isStealthMode ? '🕶️' : '👁️', 
      color: isStealthMode ? 'bg-green-500' : 'bg-surface-variant', 
      textColor: isStealthMode ? 'text-white' : 'text-on-surface',
      action: toggleStealthMode
    },
    { 
      title: 'Silent Capture', 
      description: 'Record evidence discreetly',
      icon: '📸', 
      color: 'bg-secondary', 
      textColor: 'text-on-secondary',
      action: () => router.push('/(user)/silent-capture') 
    },
    { 
      title: 'Safety Check', 
      description: 'Confirm your safety status',
      icon: '✅', 
      color: 'bg-tertiary', 
      textColor: 'text-on-tertiary',
      action: () => router.push('/(user)/safety-check') 
    },
    { 
      title: 'Report Incident', 
      description: 'Submit anonymous report',
      icon: '📝', 
      color: 'bg-primary', 
      textColor: 'text-on-primary',
      action: () => router.push('/(user)/report') 
    },
    { 
      title: 'Safe Routes', 
      description: 'View safe paths home',
      icon: '🗺️', 
      color: 'bg-accent', 
      textColor: 'text-on-accent',
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

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} mins ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`;
    return `${Math.floor(diffInMinutes / 1440)} days ago`;
  };

  if (loading) {
    return (
      <View className="flex-1 bg-background justify-center items-center">
        <Text className="text-on-surface">Loading...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header Section */}
        <View className="px-6 pt-6 pb-4">
          <View className="flex-row justify-between items-center mb-2">
            <View>
              <Text className="text-headline text-on-surface">
                Hello, {userProfile?.name || 'User'}
              </Text>
              <Text className="text-body text-on-surface-variant">
                Your safety is our priority
              </Text>
            </View>
            <TouchableOpacity 
              className="bg-surface-variant p-1 rounded-full"
              onPress={() => router.push('/(user)/profile')}
            >
              {getProfilePictureUrl() ? (
                <Image 
                  source={{ uri: getProfilePictureUrl()! }}
                  className="w-10 h-10 rounded-full"
                />
              ) : (
                <Text className="text-xl">👤</Text>
              )}
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
                className={`w-[48%] mb-4 p-4 rounded-xl ${
                  action.emergency 
                    ? 'bg-panic border border-panic' 
                    : 'bg-surface-variant border border-outline'
                }`}
                onPress={action.action}
                activeOpacity={0.8}
              >
                <View className="flex-row items-center">
                  <View className={`p-2 rounded-full mr-3 ${action.color}`}>
                    <Text className={`text-lg ${action.textColor}`}>{action.icon}</Text>
                  </View>
                  <View className="flex-1">
                    <Text 
                      className={`font-medium ${
                        action.emergency ? 'text-white' : 'text-on-surface'
                      }`}
                    >
                      {action.title}
                    </Text>
                    <Text 
                      className={`text-label mt-1 ${
                        action.emergency ? 'text-white/80' : 'text-on-surface-variant'
                      }`}
                    >
                      {action.description}
                    </Text>
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
                  <Text className="text-lg text-on-surface">{resource.icon}</Text>
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

        {/* Recent Activity / Notifications */}
        <View className="px-6 mt-6 mb-10">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-title text-on-surface">
              Recent Activity {unreadCount > 0 && `(${unreadCount} unread)`}
            </Text>
            <TouchableOpacity 
              onPress={() => router.push('/(user)/notifications')}
            >
              <Text className="text-primary">See All</Text>
            </TouchableOpacity>
          </View>
          
          {notifications.length > 0 ? (
            <View className="bg-surface-variant rounded-xl overflow-hidden">
              {notifications.slice(0, 5).map((notification, index) => (
                <TouchableOpacity
                  key={notification.id}
                  className={`flex-row items-center py-4 px-5 ${index < Math.min(notifications.length - 1, 4) ? 'border-b border-outline' : ''} ${!notification.is_read ? 'bg-primary/5' : ''}`}
                  onPress={() => markNotificationAsRead(notification.id)}
                  activeOpacity={0.7}
                >
                  <View className={`p-2 rounded-full mr-4 ${notification.is_read ? 'bg-surface' : 'bg-primary/20'}`}>
                    <Text className={notification.is_read ? 'text-on-surface-variant' : 'text-primary'}>
                      {notification.notification_type === 'alert_activated' ? '🚨' : 
                       notification.notification_type === 'alert_resolved' ? '✅' : '📢'}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text className={`text-on-surface ${!notification.is_read ? 'font-medium' : ''}`}>
                      {notification.title || 'Notification'}
                    </Text>
                    <Text className="text-label text-on-surface-variant">
                      {notification.message}
                    </Text>
                    <Text className="text-label text-on-surface-variant mt-1">
                      {formatTime(notification.created_at)}
                    </Text>
                  </View>
                  {!notification.is_read && (
                    <View className="w-2 h-2 bg-primary rounded-full" />
                  )}
                </TouchableOpacity>
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