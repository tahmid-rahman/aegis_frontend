// app/user/profile.tsx
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../../providers/ThemeProvider';

export default function Profile() {
  const router = useRouter();
  const { effectiveTheme } = useTheme();
  
  const [userData, setUserData] = useState({
    name: 'Sarah Ahmed',
    phone: '+880 1712 345678',
    email: 'sarah.ahmed@example.com',
    nidNumber: '1990123456789',
    dateOfBirth: '15 June 1990',
    gender: 'Female',
    bloodGroup: 'A+',
  });

  const [emergencyInfo, setEmergencyInfo] = useState({
    emergencyContacts: 3,
    lastLocationShare: '2 minutes ago',
    safetyScore: 85,
    panicActivated: 0,
  });

  const handleEditProfile = () => {
    router.push('/profile/edit');
  };

  const handleViewEmergencyContacts = () => {
    router.push('/contacts');
  };

  const handleViewActivityHistory = () => {
    router.push('/activity');
  };

  const profileSections = [
    {
      title: "Personal Information",
      icon: "👤",
      items: [
        { icon: "📝", label: "Full Name", value: userData.name },
        { icon: "📞", label: "Phone Number", value: userData.phone },
        { icon: "📧", label: "Email Address", value: userData.email },
        { icon: "🆔", label: "NID Number", value: userData.nidNumber },
        { icon: "🎂", label: "Date of Birth", value: userData.dateOfBirth },
        { icon: "🚻", label: "Gender", value: userData.gender },
        { icon: "🩸", label: "Blood Group", value: userData.bloodGroup },
      ]
    },
    {
      title: "Emergency Preparedness",
      icon: "🛡️",
      items: [
        { 
          icon: "👥", 
          label: "Emergency Contacts", 
          value: `${emergencyInfo.emergencyContacts} contacts`,
          action: handleViewEmergencyContacts
        },
        { 
          icon: "📍", 
          label: "Location Sharing", 
          value: emergencyInfo.lastLocationShare,
          status: "active"
        },
        { 
          icon: "⭐", 
          label: "Safety Score", 
          value: `${emergencyInfo.safetyScore}/100`,
          status: "good"
        },
        { 
          icon: "🚨", 
          label: "Panic Activated", 
          value: `${emergencyInfo.panicActivated} times`,
          status: emergencyInfo.panicActivated > 0 ? "warning" : "neutral"
        },
      ]
    }
  ];

  return (
    <View className="flex-1 bg-background">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-6 pt-6 pb-4">
          <Text className="text-2xl font-bold text-on-surface">My Profile</Text>
          <Text className="text-on-surface-variant mt-1">Your personal safety information</Text>
        </View>

        {/* User Profile Card */}
        <View className="px-6 mb-6">
          <View className="bg-surface-variant rounded-xl p-6">
            <View className="items-center mb-4">
              <View className="w-20 h-20 bg-primary rounded-full items-center justify-center mb-3">
                <Text className="text-3xl text-on-primary">SA</Text>
              </View>
              <Text className="text-xl font-semibold text-on-surface">{userData.name}</Text>
              <Text className="text-on-surface-variant">{userData.phone}</Text>
              
              {/* Safety Status Badge */}
              <View className="bg-primary/20 px-3 py-1 rounded-full mt-2">
                <Text className="text-primary text-sm font-medium">Protected</Text>
              </View>
            </View>
            
            <TouchableOpacity 
              className="bg-primary py-3 rounded-lg mt-4"
              onPress={handleEditProfile}
              activeOpacity={0.8}
            >
              <Text className="text-on-primary text-center font-semibold">Edit Profile</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Profile Information Sections */}
        {profileSections.map((section, sectionIndex) => (
          <View key={sectionIndex} className="mb-6">
            <View className="px-6 mb-3">
              <Text className="text-lg font-semibold text-on-surface flex-row items-center">
                <Text className="mr-2">{section.icon}</Text>
                {section.title}
              </Text>
            </View>

            <View className="bg-surface-variant rounded-xl mx-6 overflow-hidden">
              {section.items.map((item, itemIndex) => (
                <TouchableOpacity
                  key={itemIndex}
                  className={`flex-row items-center p-4 ${
                    itemIndex < section.items.length - 1 ? 'border-b border-outline' : ''
                  } ${item.action ? 'active:bg-hover' : ''}`}
                  onPress={item.action || undefined}
                  disabled={!item.action}
                  activeOpacity={0.7}
                >
                  <Text className="text-xl mr-4">{item.icon}</Text>
                  
                  <View className="flex-1">
                    <Text className="text-on-surface font-medium">{item.label}</Text>
                    <Text className="text-on-surface-variant text-sm mt-1">{item.value}</Text>
                  </View>
                  
                  {/* Status Indicator */}
                  {item.status === "active" && (
                    <View className="bg-accent/20 px-2 py-1 rounded-full">
                      <Text className="text-accent text-xs">Active</Text>
                    </View>
                  )}
                  
                  {item.status === "good" && (
                    <View className="bg-green-500/20 px-2 py-1 rounded-full">
                      <Text className="text-green-500 text-xs">Good</Text>
                    </View>
                  )}
                  
                  {item.status === "warning" && (
                    <View className="bg-yellow-500/20 px-2 py-1 rounded-full">
                      <Text className="text-yellow-500 text-xs">Alert</Text>
                    </View>
                  )}
                  
                  {item.action && !item.status && (
                    <Text className="text-primary">→</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* Quick Actions */}
        <View className="px-6 mb-6">
          <Text className="text-lg font-semibold text-on-surface mb-3">Quick Actions</Text>
          <View className="flex-row flex-wrap justify-between">
            <TouchableOpacity 
              className="bg-surface-variant w-[48%] p-4 rounded-xl mb-4 items-center"
              onPress={() => router.push('/user/activity')}
            >
              <Text className="text-2xl mb-2">📊</Text>
              <Text className="text-on-surface text-center">Activity History</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              className="bg-surface-variant w-[48%] p-4 rounded-xl mb-4 items-center"
              onPress={() => router.push('/user/settings')}
            >
              <Text className="text-2xl mb-2">⚙️</Text>
              <Text className="text-on-surface text-center">App Settings</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              className="bg-surface-variant w-[48%] p-4 rounded-xl items-center"
              onPress={() => router.push('/emergency-info')}
            >
              <Text className="text-2xl mb-2">📋</Text>
              <Text className="text-on-surface text-center">Emergency Info</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              className="bg-surface-variant w-[48%] p-4 rounded-xl items-center"
              onPress={() => router.push('/user/help')}
            >
              <Text className="text-2xl mb-2">❓</Text>
              <Text className="text-on-surface text-center">Help & Support</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}