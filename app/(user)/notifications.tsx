import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Appearance,
    RefreshControl,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useAuth } from '../../providers/AuthProvider';
import { api } from '../../services/api';

interface Notification {
  id: number;
  title: string;
  message: string;
  notification_type: string;
  is_read: boolean;
  created_at: string;
  data?: any;
}

interface NotificationsResponse {
  success: boolean;
  unread_count: number;
  data: Notification[];
}

export default function NotificationsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [markingRead, setMarkingRead] = useState<number | null>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const response = await api.get<NotificationsResponse>('/aegis/notifications/');
      setNotifications(response.data.data);
      setUnreadCount(response.data.unread_count);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      Alert.alert('Error', 'Failed to load notifications');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchNotifications();
  }, [fetchNotifications]);

  const markAsRead = async (notificationId: number) => {
    try {
      setMarkingRead(notificationId);
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
      Alert.alert('Error', 'Failed to mark notification as read');
    } finally {
      setMarkingRead(null);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(notif => !notif.is_read);
      
      // Mark all unread notifications as read
      for (const notification of unreadNotifications) {
        await api.post(`/aegis/notifications/${notification.id}/read/`);
      }
      
      // Update local state
      setNotifications(prev =>
        prev.map(notif => ({ ...notif, is_read: true }))
      );
      setUnreadCount(0);
      
      Alert.alert('Success', 'All notifications marked as read');
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      Alert.alert('Error', 'Failed to mark all notifications as read');
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'alert_activated':
        return '🚨';
      case 'alert_resolved':
        return '✅';
      case 'responder_assigned':
        return '👮';
      case 'status_update':
        return '📊';
      case 'location_update':
        return '📍';
      case 'media_uploaded':
        return '📸';
      case 'safety_check':
        return '🛡️';
      case 'alert_test':
        return '🧪';
      case 'update_profile':
        return '👤';
      default:
        return '📢';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'alert_activated':
        return 'bg-red-100 border-red-200';
      case 'alert_resolved':
        return 'bg-green-100 border-green-200';
      case 'safety_check':
        return 'bg-blue-100 border-blue-200';
      default:
        return 'bg-gray-100 border-gray-200';
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hr ago`;
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  const groupNotificationsByDate = (notifs: Notification[]) => {
    const groups: { [key: string]: Notification[] } = {};
    
    notifs.forEach(notification => {
      const date = new Date(notification.created_at);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      let key: string;
      
      if (date.toDateString() === today.toDateString()) {
        key = 'Today';
      } else if (date.toDateString() === yesterday.toDateString()) {
        key = 'Yesterday';
      } else {
        key = date.toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
      }
      
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(notification);
    });
    
    return groups;
  };

  if (loading) {
    return (
      <View className="flex-1 bg-background justify-center items-center">
        <ActivityIndicator size="large" color="rgb(var(--color-primary))" />
        <Text className="text-on-surface mt-4">Loading notifications...</Text>
      </View>
    );
  }

  const groupedNotifications = groupNotificationsByDate(notifications);

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View className="px-6 pt-12 pb-4 bg-surface border-b border-outline">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <TouchableOpacity 
              onPress={() => router.back()}
              className="mr-4 p-2"
            >
              <Text className="text-2xl">←</Text>
            </TouchableOpacity>
            <View>
              <Text className="text-headline text-on-surface">Notifications</Text>
              <Text className="text-label text-on-surface-variant">
                {unreadCount} unread {unreadCount === 1 ? 'message' : 'messages'}
              </Text>
            </View>
          </View>
          
          {unreadCount > 0 && (
            <TouchableOpacity
              onPress={markAllAsRead}
              className="bg-primary px-4 py-2 rounded-lg"
            >
              <Text className="text-white font-medium">Mark all read</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[
                Appearance.getColorScheme() === "dark"
                ? "rgb(208, 188, 255)"
                : "rgb(103, 80, 164)"
            ]}
            tintColor={
                Appearance.getColorScheme() === "dark"
                ? "rgb(208, 188, 255)"
                : "rgb(103, 80, 164)"
            }
          />
        }
      >
        {notifications.length === 0 ? (
          <View className="flex-1 justify-center items-center py-20 px-6">
            <Text className="text-6xl mb-4">📭</Text>
            <Text className="text-title text-on-surface text-center mb-2">
              No notifications yet
            </Text>
            <Text className="text-body text-on-surface-variant text-center">
              Your notifications will appear here when you have new alerts or updates.
            </Text>
          </View>
        ) : (
          <View className="p-4">
            {Object.entries(groupedNotifications).map(([date, dateNotifications]) => (
              <View key={date} className="mb-6">
                <Text className="text-label text-on-surface-variant mb-3 px-2">
                  {date}
                </Text>
                
                {dateNotifications.map((notification, index) => (
                  <TouchableOpacity
                    key={notification.id}
                    className={`flex-row items-start p-4 mb-2 rounded-xl border ${
                      notification.is_read 
                        ? 'bg-surface border-outline' 
                        : 'bg-primary/5 border-primary/20'
                    }`}
                    onPress={() => !notification.is_read && markAsRead(notification.id)}
                    activeOpacity={0.7}
                    disabled={notification.is_read || markingRead === notification.id}
                  >
                    <View className={`p-3 rounded-full mr-4 ${
                      notification.is_read ? 'bg-surface-variant' : 'bg-primary/20'
                    }`}>
                      <Text className="text-lg">
                        {getNotificationIcon(notification.notification_type)}
                      </Text>
                    </View>
                    
                    <View className="flex-1">
                      <View className="flex-row justify-between items-start mb-1">
                        <Text className={`flex-1 font-medium ${
                          notification.is_read ? 'text-on-surface' : 'text-on-surface'
                        }`}>
                          {notification.title || 
                            (notification.notification_type === 'alert_activated' ? 'Emergency Alert' :
                             notification.notification_type === 'alert_resolved' ? 'Alert Resolved' :
                             notification.notification_type === 'safety_check' ? 'Safety Check' :
                             'Notification')}
                        </Text>
                        
                        {markingRead === notification.id ? (
                          <ActivityIndicator size="small" color="rgb(var(--color-primary))" />
                        ) : !notification.is_read && (
                          <View className="w-2 h-2 bg-primary rounded-full ml-2 mt-2" />
                        )}
                      </View>
                      
                      <Text className="text-body text-on-surface-variant mb-2">
                        {notification.message}
                      </Text>
                      
                      <Text className="text-label text-on-surface-variant">
                        {formatTime(notification.created_at)}
                      </Text>
                      
                      {notification.data && Object.keys(notification.data).length > 0 && (
                        <View className="mt-2 p-2 bg-surface-variant rounded-lg">
                          <Text className="text-label text-on-surface-variant">
                            Additional data available
                          </Text>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            ))}
          </View>
        )}
        
        <View className="h-20" />
      </ScrollView>
    </View>
  );
}