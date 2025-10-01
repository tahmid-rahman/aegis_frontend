// app/user/settings.tsx
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from "../../providers/AuthProvider";
import { useTheme } from '../../providers/ThemeProvider';


export default function Settings() {
  const router = useRouter();
  const { effectiveTheme, toggleTheme } = useTheme();
  const [settings, setSettings] = useState({
    // Emergency Settings
    locationSharing: true,
    mediaCapture: true,
    stealthMode: false,
    emergencyContacts: true,
    
    // Notification Settings
    pushNotifications: true,
    emailNotifications: false,
    smsAlerts: true,
    soundAlerts: true,
    vibration: true,
    
    // Privacy Settings
    anonymousReporting: true,
    dataRetention: '30days', // 7days, 30days, 90days, never
    analyticsSharing: false,
    
    // Security Settings
    biometricAuth: false,
    autoLock: true,
    panicButtonSensitivity: 'medium', // low, medium, high
  });

  const handleSettingToggle = (setting: string, value: boolean) => {
    setSettings(prev => ({ ...prev, [setting]: value }));
    
    // Special handling for critical settings
    if (setting === 'locationSharing' && !value) {
      Alert.alert(
        "Location Sharing Disabled",
        "Emergency services will not receive your location during emergencies.",
        [{ text: "OK" }]
      );
    }
    
    if (setting === 'mediaCapture' && !value) {
      Alert.alert(
        "Media Capture Disabled",
        "Audio and image capture will be turned off during emergencies.",
        [{ text: "OK" }]
      );
    }
  };
  const { user, logout } = useAuth();
  
    const handleLogout = () => {
      Alert.alert(
        "Logout",
        "Are you sure you want to logout?",
        [
          {
            text: "Cancel",
            style: "cancel"
          },
          { 
            text: "Logout", 
            onPress: () => {
              logout();
              router.replace("/login");
            },
            style: "destructive"
          }
        ]
      );
    };
  

  const handleDataRetentionChange = (value: string) => {
    setSettings(prev => ({ ...prev, dataRetention: value }));
    Alert.alert("Data Retention Updated", `Emergency data will be stored for ${value}.`);
  };

  const handlePanicSensitivityChange = (value: string) => {
    setSettings(prev => ({ ...prev, panicButtonSensitivity: value }));
    Alert.alert("Sensitivity Updated", `Panic button sensitivity set to ${value}.`);
  };

  const handlePrivacyPolicy = () => {
    Alert.alert("Privacy Policy", "Open privacy policy document");
  };

  const handleTermsOfService = () => {
    Alert.alert("Terms of Service", "Open terms of service document");
  };

  const handleExportData = () => {
    Alert.alert(
      "Export Data",
      "Export your emergency history and settings?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Export", onPress: () => console.log("Data export initiated") }
      ]
    );
  };


  const handleTestEmergency = () => {
    Alert.alert(
      "Test Emergency",
      "Send a test emergency alert to verify the system?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Test", 
          onPress: () => {
            Alert.alert("Test Sent", "Test emergency alert sent successfully to control center.");
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
          <View className="flex-row items-center mb-2">
            <TouchableOpacity 
              onPress={() => router.back()}
              className="p-2 rounded-full bg-surface-variant mr-3"
            >
              <Text className="text-lg">←</Text>
            </TouchableOpacity>
            <Text className="text-headline text-on-surface">Settings</Text>
          </View>
          <Text className="text-body text-on-surface-variant">
            Manage your safety preferences and app settings
          </Text>
        </View>

        {/* Emergency Settings */}
        <View className="px-6 mb-6">
          <Text className="text-title text-on-surface mb-3">Emergency Settings</Text>
          <View className="bg-surface-variant rounded-xl overflow-hidden">
            <View className="flex-row justify-between items-center p-4 border-b border-outline">
              <View className="flex-1">
                <Text className="text-on-surface font-medium">Location Sharing</Text>
                <Text className="text-label text-on-surface-variant">
                  Share location during emergencies
                </Text>
              </View>
              <Switch
                value={settings.locationSharing}
                onValueChange={(value) => handleSettingToggle('locationSharing', value)}
                trackColor={{ false: '#767577', true: 'rgb(var(--color-primary))' }}
              />
            </View>

            <View className="flex-row justify-between items-center p-4 border-b border-outline">
              <View className="flex-1">
                <Text className="text-on-surface font-medium">Media Capture</Text>
                <Text className="text-label text-on-surface-variant">
                  Record audio and images during emergencies
                </Text>
              </View>
              <Switch
                value={settings.mediaCapture}
                onValueChange={(value) => handleSettingToggle('mediaCapture', value)}
                trackColor={{ false: '#767577', true: 'rgb(var(--color-primary))' }}
              />
            </View>

            <View className="flex-row justify-between items-center p-4 border-b border-outline">
              <View className="flex-1">
                <Text className="text-on-surface font-medium">Stealth Mode</Text>
                <Text className="text-label text-on-surface-variant">
                  Disguise app as calculator when active
                </Text>
              </View>
              <Switch
                value={settings.stealthMode}
                onValueChange={(value) => handleSettingToggle('stealthMode', value)}
                trackColor={{ false: '#767577', true: 'rgb(var(--color-primary))' }}
              />
            </View>
          </View>
        </View>

        {/* Panic Button Settings */}
        <View className="px-6 mb-6">
          <Text className="text-title text-on-surface mb-3">Panic Button Settings</Text>
          <View className="bg-surface-variant rounded-xl p-4">
            <Text className="text-on-surface font-medium mb-3">Sensitivity Level</Text>
            <View className="flex-row space-x-2">
              {['low', 'medium', 'high'].map((level) => (
                <TouchableOpacity
                  key={level}
                  className={`flex-1 py-2 rounded-lg ${
                    settings.panicButtonSensitivity === level ? 'bg-primary' : 'bg-surface'
                  }`}
                  onPress={() => handlePanicSensitivityChange(level)}
                >
                  <Text className={`text-center ${
                    settings.panicButtonSensitivity === level ? 'text-white' : 'text-on-surface'
                  }`}>
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text className="text-label text-on-surface-variant mt-2">
              {settings.panicButtonSensitivity === 'low' && 'Requires deliberate button press'}
              {settings.panicButtonSensitivity === 'medium' && 'Balanced sensitivity for safety'}
              {settings.panicButtonSensitivity === 'high' && 'Quick activation, may trigger accidentally'}
            </Text>
          </View>
        </View>

        {/* Notification Settings */}
        <View className="px-6 mb-6">
          <Text className="text-title text-on-surface mb-3">Notifications</Text>
          <View className="bg-surface-variant rounded-xl overflow-hidden">
            <View className="flex-row justify-between items-center p-4 border-b border-outline">
              <View className="flex-1">
                <Text className="text-on-surface font-medium">Push Notifications</Text>
                <Text className="text-label text-on-surface-variant">
                  Receive app notifications
                </Text>
              </View>
              <Switch
                value={settings.pushNotifications}
                onValueChange={(value) => handleSettingToggle('pushNotifications', value)}
                trackColor={{ false: '#767577', true: 'rgb(var(--color-primary))' }}
              />
            </View>

            <View className="flex-row justify-between items-center p-4 border-b border-outline">
              <View className="flex-1">
                <Text className="text-on-surface font-medium">SMS Alerts</Text>
                <Text className="text-label text-on-surface-variant">
                  Get SMS during emergencies
                </Text>
              </View>
              <Switch
                value={settings.smsAlerts}
                onValueChange={(value) => handleSettingToggle('smsAlerts', value)}
                trackColor={{ false: '#767577', true: 'rgb(var(--color-primary))' }}
              />
            </View>

            <View className="flex-row justify-between items-center p-4">
              <View className="flex-1">
                <Text className="text-on-surface font-medium">Sound & Vibration</Text>
                <Text className="text-label text-on-surface-variant">
                  Audible alerts during emergencies
                </Text>
              </View>
              <Switch
                value={settings.soundAlerts}
                onValueChange={(value) => handleSettingToggle('soundAlerts', value)}
                trackColor={{ false: '#767577', true: 'rgb(var(--color-primary))' }}
              />
            </View>
          </View>
        </View>

        {/* Privacy Settings */}
        <View className="px-6 mb-6">
          <Text className="text-title text-on-surface mb-3">Privacy</Text>
          <View className="bg-surface-variant rounded-xl overflow-hidden">
            <View className="flex-row justify-between items-center p-4 border-b border-outline">
              <View className="flex-1">
                <Text className="text-on-surface font-medium">Anonymous Reporting</Text>
                <Text className="text-label text-on-surface-variant">
                  Submit reports without personal info
                </Text>
              </View>
              <Switch
                value={settings.anonymousReporting}
                onValueChange={(value) => handleSettingToggle('anonymousReporting', value)}
                trackColor={{ false: '#767577', true: 'rgb(var(--color-primary))' }}
              />
            </View>

            <View className="p-4 border-b border-outline">
              <Text className="text-on-surface font-medium mb-2">Data Retention</Text>
              <View className="flex-row space-x-2">
                {['7days', '30days', '90days', 'never'].map((period) => (
                  <TouchableOpacity
                    key={period}
                    className={`flex-1 py-2 rounded-lg ${
                      settings.dataRetention === period ? 'bg-primary' : 'bg-surface'
                    }`}
                    onPress={() => handleDataRetentionChange(period)}
                  >
                    <Text className={`text-center text-xs ${
                      settings.dataRetention === period ? 'text-white' : 'text-on-surface'
                    }`}>
                      {period === 'never' ? 'Never' : period.replace('days', ' Days')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View className="flex-row justify-between items-center p-4">
              <View className="flex-1">
                <Text className="text-on-surface font-medium">Share Analytics</Text>
                <Text className="text-label text-on-surface-variant">
                  Help improve safety services
                </Text>
              </View>
              <Switch
                value={settings.analyticsSharing}
                onValueChange={(value) => handleSettingToggle('analyticsSharing', value)}
                trackColor={{ false: '#767577', true: 'rgb(var(--color-primary))' }}
              />
            </View>
          </View>
        </View>

        {/* App Preferences */}
        <View className="px-6 mb-6">
          <Text className="text-title text-on-surface mb-3">App Preferences</Text>
          <View className="bg-surface-variant rounded-xl overflow-hidden">
            <TouchableOpacity 
              className="flex-row justify-between items-center p-4 border-b border-outline"
              onPress={toggleTheme}
            >
              <View className="flex-1">
                <Text className="text-on-surface font-medium">Theme</Text>
                <Text className="text-label text-on-surface-variant">
                  {effectiveTheme === 'dark' ? 'Dark Mode' : 'Light Mode'}
                </Text>
              </View>
              <Text className="text-primary">Switch</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* System Testing */}
        <View className="px-6 mb-6">
          <Text className="text-title text-on-surface mb-3">System Testing</Text>
          <TouchableOpacity
            className="bg-surface-variant p-4 rounded-xl items-center"
            onPress={handleTestEmergency}
          >
            <Text className="text-on-surface font-medium">Test Emergency System</Text>
            <Text className="text-label text-on-surface-variant mt-1">
              Verify that emergency alerts work properly
            </Text>
          </TouchableOpacity>
        </View>

        {/* Legal & Support */}
        <View className="px-6 mb-6">
          <Text className="text-title text-on-surface mb-3">Legal & Support</Text>
          <View className="bg-surface-variant rounded-xl overflow-hidden">
            <TouchableOpacity 
              className="flex-row justify-between items-center p-4 border-b border-outline"
              onPress={handlePrivacyPolicy}
            >
              <Text className="text-on-surface">Privacy Policy</Text>
              <Text className="text-primary">→</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              className="flex-row justify-between items-center p-4 border-b border-outline"
              onPress={handleTermsOfService}
            >
              <Text className="text-on-surface">Terms of Service</Text>
              <Text className="text-primary">→</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              className="flex-row justify-between items-center p-4"
              onPress={handleExportData}
            >
              <Text className="text-on-surface">Export My Data</Text>
              <Text className="text-primary">→</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Account Actions */}
        <View className="px-6 mb-10">
          <Text className="text-title text-on-surface mb-3">Account</Text>
          <View className="bg-surface-variant rounded-xl overflow-hidden">
            <TouchableOpacity 
              className="flex-row justify-between items-center p-4 border-b border-outline"
              onPress={() => router.push('/(agent)/profile')}
            >
              <Text className="text-on-surface">Edit Profile</Text>
              <Text className="text-primary">→</Text>
            </TouchableOpacity>
            
          </View>
          <TouchableOpacity
                className="bg-error py-[10px] rounded-xl my-3"
                onPress={handleLogout}
            >
                <Text className="text-on-error text-center font-bold text-lg">
                Logout
                </Text>
            </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}