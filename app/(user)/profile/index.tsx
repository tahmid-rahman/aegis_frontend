// app/user/profile.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, AlertButton, Image, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../../providers/ThemeProvider';
import { api } from '../../../services/api';

interface User {
  id: string;
  name: string;
  email: string;
  gender: string;
  phone: string;
  id_type: string;
  id_number: string;
  dob: string;
  user_type: 'user' | 'agent';
  blood_group?: string;
  profile_picture?: string;
}

interface EmergencyInfo {
  emergencyContacts: number;
  safetyScore: number;
  panicActivated: number;
}

// Helper function to construct full image URL
const getFullImageUrl = (relativePath: string | null) => {
  if (!relativePath) return '';

  const baseUrl = process.env.EXPO_PUBLIC_URL;

  if (relativePath.startsWith('http')) {
    return relativePath;
  }
  
  return `${baseUrl}${relativePath}`;
};

export default function Profile() {
  const router = useRouter();
  const { effectiveTheme } = useTheme();
  
  const [userData, setUserData] = useState({
    name: '',
    phone: '',
    email: '',
    id_type: '',
    nidNumber: '',
    dateOfBirth: '',
    gender: '',
    bloodGroup: '',
    address: '',
    medical_info: '',
    profile_picture: '',
  });

  const [emergencyInfo, setEmergencyInfo] = useState({
    emergencyContacts: 0,
    safetyScore: 0,
    panicActivated: 0,
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [uploading, setUploading] = useState(false);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      
      // Get token from AsyncStorage
      const token = await AsyncStorage.getItem('auth_token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      // Set authorization header
      api.defaults.headers.Authorization = `Token ${token}`;
      
      // Fetch user profile from API
      const response = await api.get('/auth/profile/');
      const user = response.data;
      
      // Construct full URL for profile picture using helper function
      const profilePictureUrl = getFullImageUrl(user.profile_picture);

      // Transform API data to match your UI structure
      setUserData({
        name: user.name,
        phone: user.phone || '+880 1*** ******',
        email: user.email,
        id_type: user.id_type,
        nidNumber: user.id_number || '1990123456789',
        dateOfBirth: user.dob ? formatDate(user.dob) : '15 June 1990',
        gender: user.gender ? user.gender.charAt(0).toUpperCase() + user.gender.slice(1) : 'Female',
        bloodGroup: user.blood_group || 'Not Mentioned',
        address: user.address || 'Not Mentioned',
        medical_info: user.emergency_medical_note || 'Not Mentioned',
        profile_picture: profilePictureUrl,
      });
      
      // Fetch emergency info (mock data for now)
      const emergencyData = await fetchEmergencyInfo();
      setEmergencyInfo(emergencyData);
      
    } catch (error: any) {
      console.error('Error fetching profile:', error);
      Alert.alert('Error', 'Failed to load profile data. Please try again.');
      
      // If unauthorized, redirect to login
      if (error.response?.status === 401) {
        router.replace('/login');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const pickImage = async () => {
    try {
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Please allow access to your photos to upload a profile picture.');
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        await uploadImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const uploadImage = async (uri: string) => {
    try {
      setUploading(true);
      
      const token = await AsyncStorage.getItem('auth_token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Create form data
      const formData = new FormData();
      formData.append('profile_picture', {
        uri,
        name: 'profile.jpg',
        type: 'image/jpeg',
      } as any);

      // Upload image to the new endpoint
      const response = await api.patch('/auth/profile/picture/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Token ${token}`,
        },
      });

      // Construct full URL for the new profile picture using helper function
      const fullImageUrl = getFullImageUrl(response.data.user.profile_picture);

      // Update local state with new profile picture (full URL)
      setUserData(prev => ({
        ...prev,
        profile_picture: fullImageUrl,
      }));

      Alert.alert('Success', 'Profile picture updated successfully!');
    } catch (error: any) {
      console.error('Error uploading image:', error);
      Alert.alert('Error', 'Failed to upload profile picture. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const removeProfilePicture = async () => {
    try {
      setUploading(true);
      
      const token = await AsyncStorage.getItem('auth_token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Send DELETE request to remove profile picture
      const response = await api.delete('/auth/profile/picture/delete/', {
        headers: {
          'Authorization': `Token ${token}`,
        },
      });

      // Update local state - clear the profile picture
      setUserData(prev => ({
        ...prev,
        profile_picture: '',
      }));

      Alert.alert('Success', 'Profile picture removed successfully!');
    } catch (error: any) {
      console.error('Error removing profile picture:', error);
      Alert.alert('Error', 'Failed to remove profile picture. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const showImageOptions = () => {
    const buttons: AlertButton[] = [
      {
        text: "Take Photo",
        onPress: () => takePhoto(),
      },
      {
        text: "Choose from Gallery",
        onPress: () => pickImage(),
      },
      ...(userData.profile_picture
        ? [
            {
              text: "Remove Current Photo",
              onPress: () => removeProfilePicture(),
              style: "destructive" as const,
            },
          ]
        : []),
      {
      text: "Cancel",
      onPress: () => {},
      style: "default" as const,
    },
    ];

    Alert.alert("Profile Picture", "Choose an option", buttons);
  };

  const takePhoto = async () => {
    try {
      // Request camera permissions
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Please allow camera access to take a photo.');
        return;
      }

      // Launch camera
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        await uploadImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const fetchEmergencyInfo = async (): Promise<EmergencyInfo> => {

    try {
      const emergencyResponse = await api.get('/aegis/user-stastics/');
      
      console.log('Emergency Info Response:', emergencyResponse.data);

      
      return {
        emergencyContacts: emergencyResponse.data.data.contact || 0,
        safetyScore: emergencyResponse.data.data.score || 0,
        panicActivated: emergencyResponse.data.data.activated || 0,
      };
    } catch (error: any) {
      console.error('Error fetching emergency info:', error);
      
      return {
        emergencyContacts: 0,
        safetyScore: 0,
        panicActivated: 0,
      };
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchUserProfile();
  };

  const handleEditProfile = () => {
    router.push('/profile/edit');
  };

  const handleViewEmergencyContacts = () => {
    router.push('/contacts');
  };

  const handleViewActivityHistory = () => {
    // router.push('/activity');
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  if (loading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color={effectiveTheme === 'dark' ? '#fff' : '#000'} />
        <Text className="text-on-surface mt-4">Loading profile...</Text>
      </View>
    );
  }

  const profileSections = [
    {
      title: "Personal Information",
      icon: "👤",
      items: [
        { icon: "📝", label: "Full Name", value: userData.name },
        { icon: "📞", label: "Phone Number", value: userData.phone },
        { icon: "📧", label: "Email Address", value: userData.email },
        { icon: "🆔", 
          label: userData.id_type === "nid" 
            ? "NID Number" 
            : userData.id_type === "birth" 
            ? "Birth Certificate" 
            : "ID Number", 
          value: userData.nidNumber 
        },
        { icon: "🎂", label: "Date of Birth", value: userData.dateOfBirth },
        { icon: "🚻", label: "Gender", value: userData.gender },
        { icon: "🩸", label: "Blood Group", value: userData.bloodGroup },
        { icon: "🏠︎", label: "Address", value: userData.address},
        { icon: "🏥", label: "Medical note", value: userData.medical_info},
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
        // { 
        //   icon: "📍", 
        //   label: "Location Sharing", 
        //   value: emergencyInfo.lastLocationShare,
        //   status: "active"
        // },
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
      <ScrollView 
        className="flex-1" 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[effectiveTheme === 'dark' ? '#fff' : '#000']}
          />
        }
      >
        {/* Header */}
        <View className="px-6 pt-6 pb-4">
          <Text className="text-2xl font-bold text-on-surface">My Profile</Text>
          <Text className="text-on-surface-variant mt-1">Your personal safety information</Text>
        </View>

        {/* User Profile Card */}
        <View className="px-6 mb-6">
          <View className="bg-surface-variant rounded-xl p-6">
            <View className="items-center mb-4">
              <TouchableOpacity 
                onPress={showImageOptions}
                activeOpacity={0.8}
                disabled={uploading}
                className="items-center"
              >
                <View className="w-20 h-20 bg-primary rounded-full items-center justify-center mb-3 overflow-hidden">
                  {userData.profile_picture ? (
                    <Image
                      source={{ uri: userData.profile_picture }}
                      className="w-full h-full rounded-full"
                      resizeMode="cover"
                    />
                  ) : (
                    <Text className="text-3xl text-on-primary">
                      {userData.name ? getInitials(userData.name) : 'SA'}
                    </Text>
                  )}
                  
                  {/* Uploading overlay */}
                  {uploading && (
                    <View className="absolute inset-0 bg-black/50 items-center justify-center">
                      <ActivityIndicator color="#fff" />
                    </View>
                  )}
                </View>
              </TouchableOpacity>
              
              <Text className="text-xl font-semibold text-on-surface">{userData.name || ''}</Text>
              <Text className="text-on-surface-variant">{userData.phone || '+880 0000 0000'}</Text>
              
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
        {/* <View className="px-6 mb-6">
          <Text className="text-lg font-semibold text-on-surface mb-3">Quick Actions</Text>
          <View className="flex-row flex-wrap justify-between">
            <TouchableOpacity 
              className="bg-surface-variant w-[48%] p-4 rounded-xl mb-4 items-center"
              // onPress={() => router.push('/activity')}
            >
              <Text className="text-2xl mb-2">📊</Text>
              <Text className="text-on-surface text-center">Activity History</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              className="bg-surface-variant w-[48%] p-4 rounded-xl mb-4 items-center"
              onPress={() => router.push('/settings')}
            >
              <Text className="text-2xl mb-2">⚙️</Text>
              <Text className="text-on-surface text-center">App Settings</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              className="bg-surface-variant w-[48%] p-4 rounded-xl items-center"
              // onPress={() => router.push('/emergency-info')}
            >
              <Text className="text-2xl mb-2">📋</Text>
              <Text className="text-on-surface text-center">Emergency Info</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              className="bg-surface-variant w-[48%] p-4 rounded-xl items-center"
              // onPress={() => router.push('/help')}
            >
              <Text className="text-2xl mb-2">❓</Text>
              <Text className="text-on-surface text-center">Help & Support</Text>
            </TouchableOpacity>
          </View>
        </View>  */}
      </ScrollView>
    </View>
  );
}