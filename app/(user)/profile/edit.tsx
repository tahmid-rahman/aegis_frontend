// app/user/profile-edit.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
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
  user_type: string;
  blood_group?: string;
  address?: string;
  emergency_medical_note?: string;
}

export default function EditProfile() {
  const router = useRouter();
  const { effectiveTheme } = useTheme();
  
  const [userData, setUserData] = useState<User>({
    id: '',
    name: '',
    email: '',
    gender: 'male',
    phone: '',
    id_type: 'nid',
    id_number: '',
    dob: '',
    user_type: 'user',
    blood_group: '',
    address: '',
    emergency_medical_note: ''
  });

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [originalData, setOriginalData] = useState<User | null>(null);

  // Fetch user data on component mount
  useEffect(() => {
    fetchUserProfile();
  }, []);

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
      
      setUserData(user);
      setOriginalData(user);
      
    } catch (error: any) {
      console.error('Error fetching profile:', error);
      Alert.alert('Error', 'Failed to load profile data. Please try again.');
      
      // If unauthorized, redirect to login
      if (error.response?.status === 401) {
        router.replace('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | Date) => {
    setUserData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      
      const token = await AsyncStorage.getItem('auth_token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      api.defaults.headers.Authorization = `Token ${token}`;
      
      // Prepare data for API (convert Date object to string if needed)
      const dataToSend = {
        ...userData,
        dob: userData.dob instanceof Date ? userData.dob.toISOString().split('T')[0] : userData.dob
      };
      
      // Update user profile via API
      const response = await api.put('/auth/profile/', dataToSend);
      
      Alert.alert(
        "Success", 
        "Your profile has been updated successfully",
        [{ text: "OK", onPress: () => router.back() }]
      );
      
    } catch (error: any) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (hasChanges()) {
      Alert.alert(
        "Discard Changes?",
        "Are you sure you want to discard your changes?",
        [
          { text: "Keep Editing", style: "cancel" },
          { text: "Discard", onPress: () => router.back(), style: "destructive" }
        ]
      );
    } else {
      router.back();
    }
  };

  const hasChanges = () => {
    if (!originalData) return false;
    
    return JSON.stringify(userData) !== JSON.stringify(originalData);
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      handleInputChange('dob', selectedDate.toISOString().split('T')[0]);
    }
  };

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const genders = ['male', 'female', 'other'];
  const idTypes = ['nid', 'birth'];

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Select date of birth';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return 'Select date of birth';
    }
  };

  const formatGender = (gender: string) => {
    const genderMap: { [key: string]: string } = {
      male: 'Male',
      female: 'Female',
      other: 'Other',
    };
    return genderMap[gender] || gender;
  };

  const formatIdType = (idType: string) => {
    const idTypeMap: { [key: string]: string } = {
      nid: 'National ID (NID)',
      birth: 'Birth Certificate',
    };
    return idTypeMap[idType] || idType;
  };

  if (loading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color={effectiveTheme === 'dark' ? '#fff' : '#000'} />
        <Text className="text-on-surface mt-4">Loading profile...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-background"
    >
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-6 pt-6 pb-4 flex-row justify-between items-center">
          <View>
            <Text className="text-2xl font-bold text-on-surface">Edit Profile</Text>
            <Text className="text-on-surface-variant mt-1">Update your personal information</Text>
          </View>
        </View>

        {/* Personal Information Form */}
        <View className="px-6 mb-6">
          <View className="bg-surface-variant rounded-xl p-6">
            <Text className="text-lg font-semibold text-on-surface mb-4">Personal Information</Text>
            
            {/* Name */}
            <View className="mb-5">
              <Text className="text-label text-on-surface-variant mb-2">Full Name</Text>
              <TextInput
                className="bg-surface rounded-xl p-4 text-on-surface border border-outline"
                value={userData.name}
                onChangeText={(text) => handleInputChange('name', text)}
                placeholder="Enter your full name"
                placeholderTextColor="rgb(var(--color-on-surface-variant))"
              />
            </View>

            {/* Phone Number */}
            <View className="mb-5">
              <Text className="text-label text-on-surface-variant mb-2">Phone Number</Text>
              <TextInput
                className="bg-surface rounded-xl p-4 text-on-surface border border-outline"
                value={userData.phone}
                onChangeText={(text) => handleInputChange('phone', text)}
                placeholder="Enter phone number"
                placeholderTextColor="rgb(var(--color-on-surface-variant))"
                keyboardType="phone-pad"
              />
            </View>

            {/* Email */}
            <View className="mb-5">
              <Text className="text-label text-on-surface-variant mb-2">Email Address</Text>
              <TextInput
                className="bg-surface rounded-xl p-4 text-on-surface border border-outline"
                value={userData.email}
                onChangeText={(text) => handleInputChange('email', text)}
                placeholder="Enter email address"
                placeholderTextColor="rgb(var(--color-on-surface-variant))"
                keyboardType="email-address"
                autoCapitalize="none"
                editable={false} // Email should not be editable usually
                style={{ opacity: 0.7 }}
              />
            </View>

            {/* ID Type Selection */}
            <View className="mb-5">
              <Text className="text-label text-on-surface-variant mb-2">ID Type</Text>
              <View className="bg-surface rounded-xl border border-outline">
                <Picker
                  selectedValue={userData.id_type}
                  onValueChange={(value) => handleInputChange('id_type', value)}
                  dropdownIconColor="rgb(var(--color-on-surface-variant))"
                >
                  {idTypes.map((idType) => (
                    <Picker.Item 
                      key={idType} 
                      label={formatIdType(idType)} 
                      value={idType} 
                    />
                  ))}
                </Picker>
              </View>
            </View>

            {/* ID Number */}
            <View className="mb-5">
              <Text className="text-label text-on-surface-variant mb-2">
                {userData.id_type === 'nid' ? 'NID Number' : 'Birth Certificate Number'}
              </Text>
              <TextInput
                className="bg-surface rounded-xl p-4 text-on-surface border border-outline"
                value={userData.id_number}
                onChangeText={(text) => handleInputChange('id_number', text)}
                placeholder={userData.id_type === 'nid' ? 'Enter NID number' : 'Enter birth certificate number'}
                placeholderTextColor="rgb(var(--color-on-surface-variant))"
                keyboardType="numeric"
              />
            </View>

            {/* Date of Birth */}
            <View className="mb-5">
              <Text className="text-label text-on-surface-variant mb-2">Date of Birth</Text>
              <TouchableOpacity
                className="bg-surface rounded-xl p-4 border border-outline"
                onPress={() => setShowDatePicker(true)}
              >
                <Text className="text-on-surface">{formatDate(userData.dob)}</Text>
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={userData.dob ? new Date(userData.dob) : new Date()}
                  mode="date"
                  display="default"
                  onChange={onDateChange}
                  maximumDate={new Date()}
                />
              )}
            </View>

            {/* Gender */}
            <View className="mb-5">
              <Text className="text-label text-on-surface-variant mb-2">Gender</Text>
              <View className="bg-surface rounded-xl border border-outline">
                <Picker
                  selectedValue={userData.gender}
                  onValueChange={(value) => handleInputChange('gender', value)}
                  dropdownIconColor="rgb(var(--color-on-surface-variant))"
                >
                  {genders.map((gender) => (
                    <Picker.Item 
                      key={gender} 
                      label={formatGender(gender)} 
                      value={gender} 
                    />
                  ))}
                </Picker>
              </View>
            </View>

            {/* Blood Group */}
            <View className="mb-5">
              <Text className="text-label text-on-surface-variant mb-2">Blood Group</Text>
              <View className="bg-surface rounded-xl border border-outline">
                <Picker
                  selectedValue={userData.blood_group || ''}
                  onValueChange={(value) => handleInputChange('blood_group', value)}
                  dropdownIconColor="rgb(var(--color-on-surface-variant))"
                >
                  <Picker.Item label="Select blood group" value="" />
                  {bloodGroups.map((group) => (
                    <Picker.Item 
                      key={group} 
                      label={group} 
                      value={group} 
                    />
                  ))}
                </Picker>
              </View>
            </View>

            {/* Address */}
            <View className="mb-5">
              <Text className="text-label text-on-surface-variant mb-2">Address</Text>
              <TextInput
                className="bg-surface rounded-xl p-4 text-on-surface border border-outline"
                value={userData.address || ''}
                onChangeText={(text) => handleInputChange('address', text)}
                placeholder="Enter your address"
                placeholderTextColor="rgb(var(--color-on-surface-variant))"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            {/* Emergency Medical Notes */}
            <View className="mb-5">
              <Text className="text-label text-on-surface-variant mb-2">
                Emergency Medical Notes
                <Text className="text-on-surface-variant text-xs"> (Optional)</Text>
              </Text>
              <TextInput
                className="bg-surface rounded-xl p-4 text-on-surface border border-outline"
                value={userData.emergency_medical_note || ''}
                onChangeText={(text) => handleInputChange('emergency_medical_note', text)}
                placeholder="Any medical conditions, allergies, or important information for emergency responders"
                placeholderTextColor="rgb(var(--color-on-surface-variant))"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View className="px-6 mb-10">
          <View className="flex-row justify-between space-x-4">
            <TouchableOpacity
              className="bg-surface-variant py-4 rounded-xl flex-1"
              onPress={handleCancel}
              disabled={isSaving}
            >
              <Text className="text-on-surface text-center font-semibold">Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              className="bg-primary py-4 rounded-xl flex-1"
              onPress={handleSave}
              disabled={isSaving || !hasChanges()}
              style={{ opacity: isSaving || !hasChanges() ? 0.5 : 1 }}
            >
              <Text className="text-on-primary text-center font-semibold">
                {isSaving ? "Saving..." : "Save Changes"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}