// app/user/profile-edit.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
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
  location?: string;
  latitude?: number;
  longitude?: number;
  profile_picture?: string;
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
    emergency_medical_note: '',
    location: '',
    latitude: undefined,
    longitude: undefined,
    profile_picture: ''
  });

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [originalData, setOriginalData] = useState<User | null>(null);
  const [uploadingPicture, setUploadingPicture] = useState(false);

  // Fetch user data on component mount
  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      
      const token = await AsyncStorage.getItem('auth_token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      api.defaults.headers.Authorization = `Token ${token}`;
      
      const response = await api.get('/auth/profile/');
      const user = response.data;
      
      const transformedUser: User = {
        id: user.id,
        name: user.name || user.full_name || '',
        email: user.email,
        gender: user.gender || 'male',
        phone: user.phone || '',
        id_type: user.id_type || 'nid',
        id_number: user.id_number || '',
        dob: user.dob || '',
        user_type: user.user_type || 'user',
        blood_group: user.blood_group || '',
        address: user.address || '',
        emergency_medical_note: user.emergency_medical_note || '',
        location: user.location || '',
        latitude: user.latitude,
        longitude: user.longitude,
        profile_picture: user.profile_picture || ''
      };
      
      setUserData(transformedUser);
      setOriginalData(transformedUser);
      
    } catch (error: any) {
      console.error('Error fetching profile:', error);
      Alert.alert('Error', 'Failed to load profile data. Please try again.');
      
      if (error.response?.status === 401) {
        router.replace('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | Date | number | undefined) => {
    setUserData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Profile Picture Functions
  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Sorry, we need camera roll permissions to change your profile picture.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        await uploadImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const uploadImage = async (uri: string) => {
    try {
      setUploadingPicture(true);

      const token = await AsyncStorage.getItem('auth_token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const formData = new FormData();
      
      // @ts-ignore - React Native FormData append works with this syntax
      formData.append('profile_picture', {
        uri,
        type: 'image/jpeg',
        name: 'profile-picture.jpg',
      });

      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Token ${token}`,
        },
      };

      const response = await api.patch('/auth/profile/picture/', formData, config);
      
      // Update local state with new profile picture
      setUserData(prev => ({
        ...prev,
        profile_picture: response.data.user.profile_picture
      }));
      
      Alert.alert('Success', 'Profile picture updated successfully');
      
    } catch (error: any) {
      console.error('Error uploading image:', error);
      const errorMessage = error.response?.data?.profile_picture?.[0] || 'Failed to upload image. Please try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      setUploadingPicture(false);
    }
  };

  const deleteProfilePicture = async () => {
    try {
      setUploadingPicture(true);
      
      const token = await AsyncStorage.getItem('auth_token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      api.defaults.headers.Authorization = `Token ${token}`;
      
      await api.delete('/auth/profile/picture/delete/');
      
      // Update local state
      setUserData(prev => ({
        ...prev,
        profile_picture: ''
      }));
      
      Alert.alert('Success', 'Profile picture removed successfully');
      
    } catch (error: any) {
      console.error('Error deleting profile picture:', error);
      Alert.alert('Error', 'Failed to remove profile picture. Please try again.');
    } finally {
      setUploadingPicture(false);
    }
  };

  // Profile Data Functions
  const handleSave = async () => {
    try {
      setIsSaving(true);
      
      const token = await AsyncStorage.getItem('auth_token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      api.defaults.headers.Authorization = `Token ${token}`;
      
      const dataToSend: any = {
        name: userData.name,
        gender: userData.gender,
        phone: userData.phone,
        id_type: userData.id_type,
        id_number: userData.id_number,
        blood_group: userData.blood_group || '',
        address: userData.address || '',
        emergency_medical_note: userData.emergency_medical_note || '',
        location: userData.location || '',
      };

      if (userData.latitude !== undefined) {
        dataToSend.latitude = userData.latitude;
      }
      if (userData.longitude !== undefined) {
        dataToSend.longitude = userData.longitude;
      }

      if (userData.dob) {
        if (userData.dob instanceof Date) {
          dataToSend.dob = userData.dob.toISOString().split('T')[0];
        } else {
          dataToSend.dob = userData.dob;
        }
      }

      console.log('Sending data:', dataToSend);
      
      const response = await api.put('/auth/profile/', dataToSend);
      
      Alert.alert(
        "Success", 
        "Your profile has been updated successfully",
        [{ text: "OK", onPress: () => router.back() }]
      );
      
    } catch (error: any) {
      console.error('Error updating profile:', error);
      const errorMessage = error.response?.data 
        ? Object.values(error.response.data).flat().join(', ')
        : 'Failed to update profile. Please try again.';
      Alert.alert('Error', errorMessage);
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

        {/* Profile Picture Section */}
        <View className="px-6 mb-6">
          <View className="bg-surface-variant rounded-xl p-6 items-center">
            <Text className="text-lg font-semibold text-on-surface mb-4 self-start">Profile Picture</Text>
            
            {uploadingPicture ? (
              <View className="items-center justify-center p-4">
                <ActivityIndicator size="large" color={effectiveTheme === 'dark' ? '#fff' : '#000'} />
                <Text className="text-on-surface-variant mt-2">Uploading...</Text>
              </View>
            ) : (
              <>
                <TouchableOpacity onPress={pickImage} className="items-center">
                  <View className="w-32 h-32 rounded-full bg-surface items-center justify-center overflow-hidden border-2 border-outline">
                    {userData.profile_picture ? (
                      <Image 
                        source={{ uri: userData.profile_picture }} 
                        className="w-full h-full rounded-full"
                        resizeMode="cover"
                      />
                    ) : (
                      <Text className="text-on-surface-variant text-lg">Add Photo</Text>
                    )}
                  </View>
                </TouchableOpacity>
                
                <View className="flex-row mt-4 space-x-3">
                  <TouchableOpacity 
                    onPress={pickImage} 
                    className="bg-primary px-4 py-2 rounded-lg"
                  >
                    <Text className="text-on-primary font-semibold">
                      {userData.profile_picture ? 'Change Photo' : 'Add Photo'}
                    </Text>
                  </TouchableOpacity>
                  
                  {userData.profile_picture && (
                    <TouchableOpacity 
                      onPress={deleteProfilePicture} 
                      className="bg-error px-4 py-2 rounded-lg"
                    >
                      <Text className="text-on-error font-semibold">Remove</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </>
            )}
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
                editable={false}
                placeholder="Enter email address"
                placeholderTextColor="rgb(var(--color-on-surface-variant))"
                style={{ opacity: 0.7 }}
              />
              <Text className="text-xs text-on-surface-variant mt-1">
                Email cannot be changed
              </Text>
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
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
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

            {/* Location */}
            <View className="mb-5">
              <Text className="text-label text-on-surface-variant mb-2">Location</Text>
              <TextInput
                className="bg-surface rounded-xl p-4 text-on-surface border border-outline"
                value={userData.location || ''}
                onChangeText={(text) => handleInputChange('location', text)}
                placeholder="Enter your location"
                placeholderTextColor="rgb(var(--color-on-surface-variant))"
              />
            </View>

            {/* Address */}
            <View className="mb-5">
              <Text className="text-label text-on-surface-variant mb-2">Address</Text>
              <TextInput
                className="bg-surface rounded-xl p-4 text-on-surface border border-outline"
                value={userData.address || ''}
                onChangeText={(text) => handleInputChange('address', text)}
                placeholder="Enter your full address"
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
              disabled={isSaving || uploadingPicture}
            >
              <Text className="text-on-surface text-center font-semibold">Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              className="bg-primary py-4 rounded-xl flex-1"
              onPress={handleSave}
              disabled={isSaving || uploadingPicture || !hasChanges()}
              style={{ opacity: (isSaving || uploadingPicture || !hasChanges()) ? 0.5 : 1 }}
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