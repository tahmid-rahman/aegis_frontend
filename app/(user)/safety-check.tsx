// app/user/safety-check.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../providers/ThemeProvider';
import { api } from '../../services/api';

interface SafetySettings {
  id: number;
  is_enabled: boolean;
  check_in_frequency: number;
  frequency_display: string;
  notify_emergency_contacts: boolean;
  share_location: boolean;
  created_at: string;
  updated_at: string;
}

interface SafetyStatistics {
  total_check_ins: number;
  successful_check_ins: number;
  missed_check_ins: number;
  emergency_alerts: number;
  response_rate: number;
  last_check_in: string | null;
  next_check_in: string | null;
}

const frequencyOptions = [
  { value: 30, label: '30 minutes' },
  { value: 60, label: '1 hour' },
  { value: 120, label: '2 hours' },
  { value: 240, label: '4 hours' },
  { value: 480, label: '8 hours' },
];

export default function SafetyCheck() {
  const router = useRouter();
  const { effectiveTheme } = useTheme();
  
  const [settings, setSettings] = useState<SafetySettings | null>(null);
  const [statistics, setStatistics] = useState<SafetyStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const fetchSafetyData = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('auth_token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      api.defaults.headers.Authorization = `Token ${token}`;
      
      // Fetch settings and statistics in parallel
      const [settingsResponse, statsResponse] = await Promise.all([
        api.get('/aegis/safety/settings/'),
        api.get('/aegis/safety/statistics/')
      ]);

      setSettings(settingsResponse.data);
      setStatistics(statsResponse.data);
      
    } catch (error: any) {
      console.error('Error fetching safety data:', error);
      Alert.alert('Error', 'Failed to load safety data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (updates: Partial<SafetySettings>) => {
    try {
      setUpdating(true);
      const token = await AsyncStorage.getItem('auth_token');
      if (!token) return;

      api.defaults.headers.Authorization = `Token ${token}`;
      const response = await api.put('/aegis/safety/settings/', updates);
      setSettings(response.data);
      
    } catch (error: any) {
      console.error('Error updating settings:', error);
      Alert.alert('Error', 'Failed to update settings. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  const handleManualCheckIn = async () => {
    Alert.alert(
      "Safety Check-In",
      "Are you safe and sound?",
      [
        {
          text: "I need help",
          style: "destructive",
          onPress: () => router.push('/panic-confirm')
        },
        {
          text: "I'm safe",
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('auth_token');
              if (!token) return;

              api.defaults.headers.Authorization = `Token ${token}`;
              const response = await api.post('/aegis/safety/check-in/manual/', {
                notes: 'Manual safety check-in'
              });
              // Refresh statistics
              fetchSafetyData();
              
              Alert.alert('Success', response.data.message);
            } catch (error: any) {
              console.error('Error during check-in:', error);
              Alert.alert('Error', 'Failed to record check-in. Please try again.');
            }
          }
        }
      ]
    );
  };

  const handleTestEmergency = async () => {
    Alert.alert(
      "Test Emergency Alert",
      "This will send a test alert to your emergency contacts. Continue?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Test Alert",
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('auth_token');
              if (!token) return;

              api.defaults.headers.Authorization = `Token ${token}`;
              await api.post('/aegis/safety/alert/test/', {
                message: "This is a test emergency alert from the safety check system"
              });

              // Refresh statistics
              fetchSafetyData();
              
              Alert.alert("Test Sent", "A test alert has been sent to your emergency contacts.");
            } catch (error: any) {
              console.error('Error sending test alert:', error);
              Alert.alert('Error', 'Failed to send test alert. Please try again.');
            }
          }
        }
      ]
    );
  };

  const formatTimeAgo = (dateString: string | null) => {
    if (!dateString) return 'Never';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)} hours ago`;
    return `${Math.floor(diffMins / 1440)} days ago`;
  };

  useEffect(() => {
    fetchSafetyData();
  }, []);

  if (loading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color={effectiveTheme === 'dark' ? '#fff' : '#000'} />
        <Text className="text-on-surface mt-4">Loading safety data...</Text>
      </View>
    );
  }

  if (!settings || !statistics) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <Text className="text-on-surface">Failed to load safety data</Text>
        <TouchableOpacity onPress={fetchSafetyData} className="mt-4 bg-primary px-6 py-3 rounded-lg">
          <Text className="text-on-primary">Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-6 pt-6 pb-4">
          <Text className="text-headline text-on-surface">Safety Check</Text>
          <Text className="text-body text-on-surface-variant mt-2">
            Set up automatic safety confirmations and emergency protocols
          </Text>
        </View>

        {/* Manual Check-In Card */}
        <View className="px-6 mb-6">
          <TouchableOpacity 
            className="bg-primary p-5 rounded-xl items-center shadow-sm"
            onPress={handleManualCheckIn}
            activeOpacity={0.8}
            disabled={updating}
          >
            <Text className="text-3xl mb-2">✅</Text>
            <Text className="text-on-primary font-bold text-lg">I'm Safe - Check In</Text>
            <Text className="text-on-primary text-sm mt-1">Confirm your safety manually</Text>
          </TouchableOpacity>
        </View>

        {/* Automatic Safety Check */}
        <View className="px-6 mb-6">
          <View className="bg-surface-variant rounded-xl p-5">
            <View className="flex-row justify-between items-center mb-4">
              <View className="flex-1">
                <Text className="text-title text-on-surface">Automatic Safety Checks</Text>
                <Text className="text-body text-on-surface-variant mt-1">
                  Regular automatic check-ins for continuous protection
                </Text>
              </View>
              <Switch
                value={settings.is_enabled}
                onValueChange={(value) => updateSettings({ is_enabled: value })}
                trackColor={{ false: '#767577', true: 'rgb(var(--color-primary))' }}
                thumbColor={settings.is_enabled ? '#f4f3f4' : '#f4f3f4'}
                disabled={updating}
              />
            </View>

            {settings.is_enabled && (
              <View className="mt-4">
                <Text className="text-label text-on-surface-variant mb-2">Check-in Frequency</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
                  <View className="flex-row space-x-2">
                    {frequencyOptions.map((option) => (
                      <TouchableOpacity
                        key={option.value}
                        className={`px-4 py-2 rounded-full ${
                          settings.check_in_frequency === option.value ? 'bg-primary' : 'bg-surface'
                        }`}
                        onPress={() => updateSettings({ check_in_frequency: option.value })}
                        disabled={updating}
                      >
                        <Text className={
                          settings.check_in_frequency === option.value ? 'text-on-primary' : 'text-on-surface'
                        }>
                          {option.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>

                <View className="flex-row justify-between items-center mb-4">
                  <View className="flex-1">
                    <Text className="text-on-surface">Notify emergency contacts if I don't respond</Text>
                  </View>
                  <Switch
                    value={settings.notify_emergency_contacts}
                    onValueChange={(value) => updateSettings({ notify_emergency_contacts: value })}
                    trackColor={{ false: '#767577', true: 'rgb(var(--color-primary))' }}
                    thumbColor={settings.notify_emergency_contacts ? '#f4f3f4' : '#f4f3f4'}
                    disabled={updating}
                  />
                </View>

                <View className="flex-row justify-between items-center">
                  <View className="flex-1">
                    <Text className="text-on-surface">Share location during check-ins</Text>
                  </View>
                  <Switch
                    value={settings.share_location}
                    onValueChange={(value) => updateSettings({ share_location: value })}
                    trackColor={{ false: '#767577', true: 'rgb(var(--color-primary))' }}
                    thumbColor={settings.share_location ? '#f4f3f4' : '#f4f3f4'}
                    disabled={updating}
                  />
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Emergency Protocols */}
        <View className="px-6 mb-6">
          <Text className="text-title text-on-surface mb-3">Emergency Protocols</Text>
          
          <TouchableOpacity 
            className="bg-surface-variant p-4 rounded-xl mb-3 flex-row items-center"
            onPress={handleTestEmergency}
            disabled={updating}
          >
            <Text className="text-2xl mr-4">🔔</Text>
            <View className="flex-1">
              <Text className="text-on-surface font-medium">Test Emergency Alert</Text>
              <Text className="text-on-surface-variant text-sm">Send a test to your contacts</Text>
            </View>
            <Text className="text-primary">→</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            className="bg-surface-variant p-4 rounded-xl mb-3 flex-row items-center"
            onPress={() => router.push('/contacts')}
          >
            <Text className="text-2xl mr-4">👥</Text>
            <View className="flex-1">
              <Text className="text-on-surface font-medium">Emergency Contacts</Text>
              <Text className="text-on-surface-variant text-sm">Manage who gets notified</Text>
            </View>
            <Text className="text-primary">→</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            className="bg-surface-variant p-4 rounded-xl flex-row items-center"
            onPress={() => router.push('/learn')}
          >
            <Text className="text-2xl mr-4">📚</Text>
            <View className="flex-1">
              <Text className="text-on-surface font-medium">Safety Procedures</Text>
              <Text className="text-on-surface-variant text-sm">Review emergency protocols</Text>
            </View>
            <Text className="text-primary">→</Text>
          </TouchableOpacity>
        </View>

        {/* Statistics */}
        <View className="px-6 mb-10">
          <Text className="text-title text-on-surface mb-3">Safety Statistics</Text>
          <View className="bg-surface-variant rounded-xl p-5">
            <View className="flex-row justify-between mb-4">
              <View className="items-center">
                <Text className="text-3xl font-bold text-primary">{statistics.successful_check_ins}</Text>
                <Text className="text-on-surface-variant text-sm">Successful Check-ins</Text>
              </View>
              <View className="items-center">
                <Text className="text-3xl font-bold text-tertiary">{statistics.emergency_alerts}</Text>
                <Text className="text-on-surface-variant text-sm">Tests Conducted</Text>
              </View>
              <View className="items-center">
                <Text className="text-3xl font-bold text-green-500">{statistics.response_rate}%</Text>
                <Text className="text-on-surface-variant text-sm">Response Rate</Text>
              </View>
            </View>
            <View className="bg-surface rounded-full h-2 w-full overflow-hidden">
              <View 
                className="bg-primary h-2" 
                style={{ width: `${statistics.response_rate}%` }} 
              />
            </View>
            <Text className="text-on-surface-variant text-xs mt-2 text-center">
              Last check-in: {formatTimeAgo(statistics.last_check_in)}
              {statistics.next_check_in && ` • Next: ${formatTimeAgo(statistics.next_check_in)}`}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Loading Overlay */}
      {updating && (
        <View className="absolute inset-0 bg-black/50 items-center justify-center">
          <ActivityIndicator size="large" color="#fff" />
          <Text className="text-white mt-2">Updating settings...</Text>
        </View>
      )}
    </View>
  );
}