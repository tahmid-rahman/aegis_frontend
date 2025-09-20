// app/user/safety-check.tsx
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../providers/ThemeProvider';

export default function SafetyCheck() {
  const router = useRouter();
  const { effectiveTheme } = useTheme();
  const [isSafetyCheckEnabled, setIsSafetyCheckEnabled] = useState(true);
  const [checkInFrequency, setCheckInFrequency] = useState('1 hour');
  const [emergencyContactsNotified, setEmergencyContactsNotified] = useState(true);
  const [shareLocation, setShareLocation] = useState(true);

  const frequencyOptions = ['30 minutes', '1 hour', '2 hours', '4 hours', '8 hours'];

  const handleManualCheckIn = () => {
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
          onPress: () => {
            Alert.alert("Thank you!", "Your safety status has been updated.");
          }
        }
      ]
    );
  };

  const handleTestEmergency = () => {
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
          onPress: () => {
            Alert.alert("Test Sent", "A test alert has been sent to your emergency contacts.");
          }
        }
      ]
    );
  };

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
                value={isSafetyCheckEnabled}
                onValueChange={setIsSafetyCheckEnabled}
                trackColor={{ false: '#767577', true: 'rgb(var(--color-primary))' }}
                thumbColor={isSafetyCheckEnabled ? '#f4f3f4' : '#f4f3f4'}
              />
            </View>

            {isSafetyCheckEnabled && (
              <View className="mt-4">
                <Text className="text-label text-on-surface-variant mb-2">Check-in Frequency</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
                  <View className="flex-row space-x-2">
                    {frequencyOptions.map((option) => (
                      <TouchableOpacity
                        key={option}
                        className={`px-4 py-2 rounded-full ${
                          checkInFrequency === option ? 'bg-primary' : 'bg-surface'
                        }`}
                        onPress={() => setCheckInFrequency(option)}
                      >
                        <Text className={
                          checkInFrequency === option ? 'text-on-primary' : 'text-on-surface'
                        }>
                          {option}
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
                    value={emergencyContactsNotified}
                    onValueChange={setEmergencyContactsNotified}
                    trackColor={{ false: '#767577', true: 'rgb(var(--color-primary))' }}
                    thumbColor={emergencyContactsNotified ? '#f4f3f4' : '#f4f3f4'}
                  />
                </View>

                <View className="flex-row justify-between items-center">
                  <View className="flex-1">
                    <Text className="text-on-surface">Share location during check-ins</Text>
                  </View>
                  <Switch
                    value={shareLocation}
                    onValueChange={setShareLocation}
                    trackColor={{ false: '#767577', true: 'rgb(var(--color-primary))' }}
                    thumbColor={shareLocation ? '#f4f3f4' : '#f4f3f4'}
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
                <Text className="text-3xl font-bold text-primary">28</Text>
                <Text className="text-on-surface-variant text-sm">Successful Check-ins</Text>
              </View>
              <View className="items-center">
                <Text className="text-3xl font-bold text-tertiary">1</Text>
                <Text className="text-on-surface-variant text-sm">Tests Conducted</Text>
              </View>
              <View className="items-center">
                <Text className="text-3xl font-bold text-green-500">100%</Text>
                <Text className="text-on-surface-variant text-sm">Response Rate</Text>
              </View>
            </View>
            <View className="bg-surface rounded-full h-2 w-full overflow-hidden">
              <View className="bg-primary h-2" style={{ width: '100%' }} />
            </View>
            <Text className="text-on-surface-variant text-xs mt-2 text-center">
              Last check-in: 15 minutes ago
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}