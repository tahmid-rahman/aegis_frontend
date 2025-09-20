// app/user/settings.tsx
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../../providers/AuthProvider'; // Import your AuthProvider
import { useTheme } from '../../../providers/ThemeProvider';

export default function Settings() {
  const router = useRouter();
  const { theme, effectiveTheme, setTheme } = useTheme();
  const { logout } = useAuth(); // Get the logout function from AuthProvider
  
  const [settings, setSettings] = useState({
    locationSharing: true,
    silentMode: false,
    autoRecord: true,
    notifications: true,
    biometricAuth: false,
  });

  const handleToggleSetting = (setting: keyof typeof settings) => {
    setSettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
  };

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
  };

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
            // Call the logout function from AuthProvider
            logout();
          },
          style: "destructive"
        }
      ]
    );
  };

  const settingsSections = [
    {
      title: "Privacy & Safety",
      icon: "🛡️",
      items: [
        { 
          label: "Location Sharing", 
          description: "Share your location during emergencies",
          type: "switch",
          value: settings.locationSharing,
          action: () => handleToggleSetting('locationSharing')
        },
        { 
          label: "Silent Mode", 
          description: "Disable all sounds during emergencies",
          type: "switch",
          value: settings.silentMode,
          action: () => handleToggleSetting('silentMode')
        },
        { 
          label: "Auto Recording", 
          description: "Automatically record during emergencies",
          type: "switch",
          value: settings.autoRecord,
          action: () => handleToggleSetting('autoRecord')
        },
      ]
    },
    {
      title: "Notifications",
      icon: "🔔",
      items: [
        { 
          label: "Push Notifications", 
          description: "Receive important alerts and updates",
          type: "switch",
          value: settings.notifications,
          action: () => handleToggleSetting('notifications')
        },
        { 
          label: "Emergency Alerts", 
          description: "Critical safety notifications",
          type: "switch",
          value: true,
          action: () => {}
        },
      ]
    },
    {
      title: "Appearance",
      icon: "🎨",
      items: [
        { 
          label: "Theme", 
          description: "Change app appearance",
          type: "theme",
          value: theme,
          action: handleThemeChange
        },
      ]
    },
    {
      title: "Security",
      icon: "🔐",
      items: [
        { 
          label: "Biometric Authentication", 
          description: "Use fingerprint or face ID to unlock",
          type: "switch",
          value: settings.biometricAuth,
          action: () => handleToggleSetting('biometricAuth')
        },
        { 
          label: "Change Password", 
          description: "Update your login password",
          type: "navigation",
          action: () => router.push('/user/change-password')
        },
      ]
    }
  ];

  return (
    <View className="flex-1 bg-background">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-6 pt-6 pb-4">
          <Text className="text-2xl font-bold text-on-surface">Settings</Text>
          <Text className="text-on-surface-variant mt-1">Customize your safety app experience</Text>
        </View>

        {settingsSections.map((section, sectionIndex) => (
          <View key={sectionIndex} className="mb-6">
            <View className="px-6 mb-3">
              <Text className="text-lg font-semibold text-on-surface flex-row items-center">
                <Text className="mr-2">{section.icon}</Text>
                {section.title}
              </Text>
            </View>

            <View className="bg-surface-variant rounded-xl mx-6 overflow-hidden">
              {section.items.map((item, itemIndex) => (
                <View
                  key={itemIndex}
                  className={`p-4 ${itemIndex < section.items.length - 1 ? 'border-b border-outline' : ''}`}
                >
                  <View className="flex-row justify-between items-center">
                    <View className="flex-1">
                      <Text className="text-on-surface font-medium">{item.label}</Text>
                      <Text className="text-on-surface-variant text-sm mt-1">{item.description}</Text>
                    </View>
                    
                    {item.type === "switch" && (
                      <Switch
                        value={item.value}
                        onValueChange={item.action}
                        trackColor={{ false: '#767577', true: '#6750A4' }}
                        thumbColor={item.value ? '#f4f3f4' : '#f4f3f4'}
                      />
                    )}
                    
                    {item.type === "navigation" && (
                      <TouchableOpacity onPress={item.action}>
                        <Text className="text-primary">→</Text>
                      </TouchableOpacity>
                    )}
                    
                    {item.type === "theme" && (
                      <View className="flex-row bg-surface rounded-full p-1">
                        {['light', 'dark', 'system'].map((themeOption) => (
                          <TouchableOpacity
                            key={themeOption}
                            className={`px-3 py-1 rounded-full ${
                              item.value === themeOption ? 'bg-primary' : ''
                            }`}
                            onPress={() => item.action(themeOption as 'light' | 'dark' | 'system')}
                          >
                            <Text className={
                              item.value === themeOption ? 'text-on-primary' : 'text-on-surface'
                            }>
                              {themeOption.charAt(0).toUpperCase() + themeOption.slice(1)}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>
                </View>
              ))}
            </View>
          </View>
        ))}
        
        {/* Logout Button */}
        <View className="mx-6 mt-4 mb-8">
          <TouchableOpacity 
            className="bg-error rounded-xl p-4 items-center"
            onPress={handleLogout}
          >
            <Text className="text-on-error font-semibold">Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}