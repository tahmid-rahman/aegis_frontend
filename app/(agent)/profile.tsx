// app/agent/profile.tsx
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Image, Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { api } from '../../services/api';

interface ProfileData {
  id: number;
  name: string;
  email: string;
  phone: string;
  gender: string;
  blood_group: string;
  address: string;
  nid_number: string;
  profile_picture: string | null;
  dob: string;
  user_type: string;
  agent_id?: string;
  responder_type?: string;
  emergency_medical_note?: string;
  id_type?: string;
  id_number?: string;
}

const getFullImageUrl = (relativePath: string | null) => {
  if (!relativePath) return '';

  const baseUrl = process.env.EXPO_PUBLIC_URL;

  if (relativePath.startsWith('http')) {
    return relativePath;
  }
  
  return `${baseUrl}${relativePath}`;
};

interface EmergencyContact {
  id: number;
  name: string;
  phone: string;
  email: string;
  relationship: string;
  is_emergency_contact: boolean;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}

interface ProfileStats {
  safety_checkins: number;
  reports_filed: number;
  days_active: number;
  profile_completeness: number;
  response_time_avg: string;
  cases_resolved: number;
}

export default function Profile() {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileData>({
    id: 0,
    name: '',
    phone: '',
    email: '',
    gender: '',
    blood_group: '',
    address: '',
    nid_number: '',
    profile_picture: null,
    dob: '',
    user_type: 'user',
    emergency_medical_note: '',
    id_type: 'nid',
    id_number: ''
  });
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([]);
  const [stats, setStats] = useState<ProfileStats>({
    safety_checkins: 0,
    reports_filed: 0,
    days_active: 0,
    profile_completeness: 0,
    response_time_avg: '0 mins',
    cases_resolved: 0
  });
  const [editData, setEditData] = useState<Partial<ProfileData>>({});
  
  // Emergency Contact Modal States
  const [showAddContact, setShowAddContact] = useState(false);
  const [newContact, setNewContact] = useState({
    name: '',
    phone: '',
    email: '',
    relationship: 'family',
    is_primary: false
  });
  const [isAddingContact, setIsAddingContact] = useState(false);

  // Password Change Modal States
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordStep, setPasswordStep] = useState(1);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Load profile data and emergency contacts
  useEffect(() => {
    loadProfileData();
    loadEmergencyContacts();
    loadProfileStats();
  }, []);

  const loadProfileData = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/auth/profile/');
      setProfile(response.data);
      setEditData(response.data);
    } catch (error) {
      console.error('Error loading profile:', error);
      Alert.alert('Error', 'Failed to load profile data');
    } finally {
      setIsLoading(false);
    }
  };

  const loadEmergencyContacts = async () => {
    try {
      const response = await api.get('/aegis/contacts/');
      setEmergencyContacts(response.data);
    } catch (error) {
      console.error('Error loading emergency contacts:', error);
    }
  };

  const loadProfileStats = async () => {
    try {
      const response = await api.get('/auth/auth-status/');
      setStats(response.data);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);
      // Remove profile_picture from editData to avoid file upload issues
      const { profile_picture, ...dataToUpdate } = editData;
      
      const response = await api.put('/auth/profile/', dataToUpdate);
      
      setProfile(response.data.user);
      setIsEditing(false);
      Alert.alert('Success', response.data.message || 'Profile updated successfully');
    } catch (error: any) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setEditData(profile);
    setIsEditing(false);
  };

  const handleChange = (field: string, value: string) => {
    setEditData(prev => ({ ...prev, [field]: value }));
  };

  // Emergency Contact Functions
  const handleAddContact = async () => {
    if (!newContact.name || !newContact.phone) {
      Alert.alert('Error', 'Please fill in at least name and phone number');
      return;
    }

    try {
      setIsAddingContact(true);
      const response = await api.post('/aegis/contacts/', newContact);
      
      setEmergencyContacts(prev => [...prev, response.data]);
      setShowAddContact(false);
      setNewContact({
        name: '',
        phone: '',
        email: '',
        relationship: 'family',
        is_primary: false
      });
      Alert.alert('Success', 'Emergency contact added successfully');
    } catch (error: any) {
      console.error('Error adding contact:', error);
      Alert.alert('Error', error.response?.data?.error || 'Failed to add emergency contact');
    } finally {
      setIsAddingContact(false);
    }
  };

  const handleDeleteContact = async (contactId: number) => {
    Alert.alert(
      'Delete Contact',
      'Are you sure you want to delete this emergency contact?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/aegis/contacts/${contactId}/`);
              setEmergencyContacts(prev => prev.filter(contact => contact.id !== contactId));
              Alert.alert('Success', 'Contact deleted successfully');
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.error || 'Failed to delete contact');
            }
          }
        }
      ]
    );
  };

  const handleSetPrimary = async (contactId: number) => {
    try {
      const response = await api.patch(`/aegis/contacts/${contactId}/`, {
        is_primary: true
      });
      
      // Update the contacts list
      const updatedContacts = emergencyContacts.map(contact => ({
        ...contact,
        is_primary: contact.id === contactId
      }));
      
      setEmergencyContacts(updatedContacts);
      Alert.alert('Success', 'Primary contact updated');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to update primary contact');
    }
  };

  const handleTestAlert = async (contactId: number) => {
    try {
      const response = await api.post(`/aegis/contacts/${contactId}/test-alert/`);
      Alert.alert('Success', response.data.message);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to send test alert');
    }
  };

  // Password Change Functions
  const handleChangePassword = () => {
    setShowChangePassword(true);
    setPasswordStep(1);
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
  };

  const handlePasswordStep = async () => {
    if (passwordStep === 1) {
      if (!passwordData.currentPassword) {
        Alert.alert('Error', 'Please enter your current password');
        return;
      }
      setPasswordStep(2);
    } else if (passwordStep === 2) {
      if (!passwordData.newPassword) {
        Alert.alert('Error', 'Please enter your new password');
        return;
      }
      
      if (passwordData.newPassword.length < 6) {
        Alert.alert('Error', 'Password must be at least 6 characters long');
        return;
      }
      
      setPasswordStep(3);
    } else if (passwordStep === 3) {
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        Alert.alert('Error', 'Passwords do not match');
        return;
      }

      try {
        setIsChangingPassword(true);
        const response = await api.post('/auth/profile/change-password/', {
          old_password: passwordData.currentPassword,
          new_password: passwordData.newPassword,
          confirm_password: passwordData.confirmPassword,
        });
        
        Alert.alert('Success', response.data.message || 'Password changed successfully');
        setShowChangePassword(false);
        setPasswordStep(1);
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } catch (error: any) {
        console.error('Password change error:', error);
        console.error('Error response:', error.response?.data); // Add this line

        Alert.alert(
          'Error', 
          error.response?.data?.message || 
          error.response?.data?.error || 
          JSON.stringify(error.response?.data) || 
          'Failed to change password'
        );
      } finally {
        setIsChangingPassword(false);
      }
    }
  };

  const handlePasswordBack = () => {
    if (passwordStep === 1) {
      setShowChangePassword(false);
    } else {
      setPasswordStep(passwordStep - 1);
    }
  };

  const getPasswordTitle = () => {
    switch (passwordStep) {
      case 1: return 'Change Password';
      case 2: return 'New Password';
      case 3: return 'Confirm Password';
      default: return 'Change Password';
    }
  };

  const getPasswordDescription = () => {
    switch (passwordStep) {
      case 1: return 'Enter your current password';
      case 2: return 'Enter your new password';
      case 3: return 'Confirm your new password';
      default: return '';
    }
  };

  const getPasswordButtonText = () => {
    switch (passwordStep) {
      case 1: return 'Next';
      case 2: return 'Next';
      case 3: return isChangingPassword ? 'Changing...' : 'Change Password';
      default: return 'Next';
    }
  };

  const getPasswordPlaceholder = () => {
    switch (passwordStep) {
      case 1: return 'Current password';
      case 2: return 'New password';
      case 3: return 'Confirm new password';
      default: return '';
    }
  };

  const getPasswordValue = () => {
    switch (passwordStep) {
      case 1: return passwordData.currentPassword;
      case 2: return passwordData.newPassword;
      case 3: return passwordData.confirmPassword;
      default: return '';
    }
  };

  const setPasswordValue = (value: string) => {
    switch (passwordStep) {
      case 1:
        setPasswordData(prev => ({ ...prev, currentPassword: value }));
        break;
      case 2:
        setPasswordData(prev => ({ ...prev, newPassword: value }));
        break;
      case 3:
        setPasswordData(prev => ({ ...prev, confirmPassword: value }));
        break;
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Sorry, we need camera roll permissions to change your profile picture.');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      await uploadProfilePicture(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Sorry, we need camera permissions to take a profile picture.');
      return;
    }

    let result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      await uploadProfilePicture(result.assets[0].uri);
    }
  };

  const uploadProfilePicture = async (imageUri: string) => {
    try {
      setIsLoading(true);
      
      // Create FormData for file upload
      const formData = new FormData();
      
      // @ts-ignore - React Native FormData append with file object
      formData.append('profile_picture', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'profile_picture.jpg',
      });

      console.log('Uploading profile picture...');
      
      const response = await api.post('/auth/profile/picture/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        transformRequest: (data) => {
          return data;
        },
      });

      // Refresh profile data to get updated picture
      await loadProfileData();
      Alert.alert('Success', 'Profile picture updated successfully');
    } catch (error: any) {
      console.error('Error uploading profile picture:', error);
      Alert.alert(
        'Error', 
        error.response?.data?.message || 
        error.response?.data?.profile_picture?.[0] || 
        'Failed to upload profile picture'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePhoto = () => {
    Alert.alert(
      'Change Profile Photo',
      'Choose an option',
      [
        {
          text: 'Take Photo',
          onPress: takePhoto
        },
        {
          text: 'Choose from Gallery',
          onPress: pickImage
        },
        {
          text: 'Cancel',
          style: 'cancel'
        }
      ]
    );
  };

  const handleVerificationStatus = () => {
    Alert.alert(
      'Account Verification',
      `Your account is verified with ${profile.id_type === 'nid' ? 'NID' : 'Birth Certificate'}.\n\nVerification Status: ✅ Verified\n${profile.id_type === 'nid' ? 'NID' : 'Birth Certificate'}: ${profile.id_number}`,
      [{ text: 'OK' }]
    );
  };

  const handleEmergencyProfile = () => {
    const primaryContact = emergencyContacts.find(contact => contact.is_primary);
    
    Alert.alert(
      'Emergency Profile',
      'This information is shared with emergency services:\n\n' +
      `Name: ${profile.name}\n` +
      `Blood Group: ${profile.blood_group || 'Not specified'}\n` +
      `Primary Contact: ${primaryContact ? `${primaryContact.name} (${primaryContact.phone})` : 'Not set'}\n` +
      `Medical Info: ${profile.emergency_medical_note || 'None specified'}`,
      [{ text: 'OK' }]
    );
  };

  if (isLoading && !profile.id) {
    return (
      <View className="flex-1 bg-background justify-center items-center">
        <Text className="text-on-surface">Loading profile...</Text>
      </View>
    );
  }

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
            <Text className="text-headline text-on-surface">My Profile</Text>
          </View>
          <Text className="text-body text-on-surface-variant">
            Manage your personal information and safety profile
          </Text>
        </View>

        {/* Profile Photo & Basic Info */}
        <View className="px-6 mb-6">
          <View className="bg-surface-variant rounded-xl p-6 items-center">
            <TouchableOpacity onPress={handleChangePhoto}>
              <View className="w-24 h-24 rounded-full bg-primary/20 items-center justify-center mb-4 border-4 border-primary/30">
                {profile.profile_picture ? (
                  <Image 
                    source={{ uri: getFullImageUrl(profile.profile_picture) }} 
                    className="w-20 h-20 rounded-full"
                  />
                ) : (
                  <Text className="text-3xl text-primary">👤</Text>
                )}
              </View>
            </TouchableOpacity>

            <Text className="text-title text-on-surface text-center mb-1">
              {isEditing ? editData.name : profile.name}
            </Text>
            <Text className="text-body text-on-surface-variant text-center mb-4">
              {profile.phone}
            </Text>

            {profile.agent_id && (
              <View className="bg-primary/20 px-3 py-1 rounded-full mb-4">
                <Text className="text-primary text-sm font-medium">
                  {profile.responder_type} • {profile.agent_id}
                </Text>
              </View>
            )}

            {/* Edit/Save Buttons */}
            {!isEditing ? (
              <TouchableOpacity
                className="bg-primary px-6 py-3 rounded-lg"
                onPress={() => setIsEditing(true)}
                disabled={isLoading}
              >
                <Text className="text-white font-semibold">
                  {isLoading ? 'Loading...' : 'Edit Profile'}
                </Text>
              </TouchableOpacity>
            ) : (
              <View className="flex-row space-x-3">
                <TouchableOpacity
                  className="bg-surface px-6 py-3 rounded-lg"
                  onPress={handleCancel}
                  disabled={isLoading}
                >
                  <Text className="text-on-surface font-semibold">Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="bg-primary px-6 py-3 rounded-lg"
                  onPress={handleSave}
                  disabled={isLoading}
                >
                  <Text className="text-white font-semibold">
                    {isLoading ? 'Saving...' : 'Save Changes'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* Emergency Contacts Section */}
        <View className="px-6 mb-6">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-title text-on-surface">Emergency Contacts</Text>
            <TouchableOpacity 
              className="bg-primary px-4 py-2 rounded-lg"
              onPress={() => setShowAddContact(true)}
            >
              <Text className="text-white font-semibold">Add Contact</Text>
            </TouchableOpacity>
          </View>
          
          {emergencyContacts.length === 0 ? (
            <View className="bg-surface-variant rounded-xl p-6 items-center">
              <Text className="text-on-surface-variant text-center mb-3">
                No emergency contacts added yet
              </Text>
              <Text className="text-on-surface-variant text-sm text-center">
                Add trusted contacts who will be notified in case of emergencies
              </Text>
            </View>
          ) : (
            <View className="bg-surface-variant rounded-xl overflow-hidden">
              {emergencyContacts.map((contact, index) => (
                <View 
                  key={contact.id}
                  className={`p-4 ${index < emergencyContacts.length - 1 ? 'border-b border-outline' : ''}`}
                >
                  <View className="flex-row justify-between items-start mb-2">
                    <View className="flex-1">
                      <View className="flex-row items-center mb-1">
                        <Text className="text-on-surface text-lg font-medium mr-2">
                          {contact.name}
                        </Text>
                        {contact.is_primary && (
                          <View className="bg-green-500 px-2 py-1 rounded-full">
                            <Text className="text-white text-xs font-medium">Primary</Text>
                          </View>
                        )}
                      </View>
                      <Text className="text-on-surface-variant mb-1">{contact.phone}</Text>
                      <Text className="text-on-surface-variant text-sm capitalize">
                        {contact.relationship}
                      </Text>
                    </View>
                    
                    <View className="flex-row space-x-2">
                      {!contact.is_primary && (
                        <TouchableOpacity
                          onPress={() => handleSetPrimary(contact.id)}
                          className="bg-green-500 px-3 py-1 rounded"
                        >
                          <Text className="text-white text-xs">Set Primary</Text>
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity
                        onPress={() => handleTestAlert(contact.id)}
                        className="bg-blue-500 px-3 py-1 rounded"
                      >
                        <Text className="text-white text-xs">Test</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleDeleteContact(contact.id)}
                        className="bg-red-500 px-3 py-1 rounded"
                      >
                        <Text className="text-white text-xs">Delete</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Personal Information */}
        <View className="px-6 mb-6">
          <Text className="text-title text-on-surface mb-3">Personal Information</Text>
          <View className="bg-surface-variant rounded-xl overflow-hidden">
            {/* Name */}
            <View className="p-4 border-b border-outline">
              <Text className="text-label text-on-surface-variant mb-1">Full Name</Text>
              {isEditing ? (
                <TextInput
                  className="text-on-surface text-lg font-medium bg-surface rounded-lg p-3"
                  value={editData.name || ''}
                  onChangeText={(value) => handleChange('name', value)}
                  placeholder="Enter your full name"
                  placeholderTextColor="#9CA3AF"
                />
              ) : (
                <Text className="text-on-surface text-lg font-medium">{profile.name}</Text>
              )}
            </View>

            {/* Phone */}
            <View className="p-4 border-b border-outline">
              <Text className="text-label text-on-surface-variant mb-1">Phone Number</Text>
              {isEditing ? (
                <TextInput
                  className="text-on-surface text-lg font-medium bg-surface rounded-lg p-3"
                  value={editData.phone || ''}
                  onChangeText={(value) => handleChange('phone', value)}
                  placeholder="Enter phone number"
                  keyboardType="phone-pad"
                  placeholderTextColor="#9CA3AF"
                />
              ) : (
                <Text className="text-on-surface text-lg font-medium">{profile.phone}</Text>
              )}
            </View>

            {/* Email */}
            <View className="p-4 border-b border-outline">
              <Text className="text-label text-on-surface-variant mb-1">Email Address</Text>
              <Text className="text-on-surface text-lg font-medium">{profile.email}</Text>
              <Text className="text-label text-on-surface-variant text-sm mt-1">
                Email cannot be changed
              </Text>
            </View>

            {/* Date of Birth */}
            <View className="p-4 border-b border-outline">
              <Text className="text-label text-on-surface-variant mb-1">Date of Birth</Text>
              {isEditing ? (
                <TextInput
                  className="text-on-surface text-lg font-medium bg-surface rounded-lg p-3"
                  value={editData.dob || ''}
                  onChangeText={(value) => handleChange('dob', value)}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#9CA3AF"
                />
              ) : (
                <Text className="text-on-surface text-lg font-medium">{profile.dob}</Text>
              )}
            </View>

            {/* Gender */}
            <View className="p-4 border-b border-outline">
              <Text className="text-label text-on-surface-variant mb-1">Gender</Text>
              {isEditing ? (
                <View className="flex-row space-x-3">
                  {['male', 'female', 'other'].map((gender) => (
                    <TouchableOpacity
                      key={gender}
                      onPress={() => handleChange('gender', gender)}
                      className={`px-4 py-2 rounded-lg ${
                        editData.gender === gender ? 'bg-primary' : 'bg-surface'
                      }`}
                    >
                      <Text className={
                        editData.gender === gender ? 'text-white' : 'text-on-surface'
                      }>
                        {gender.charAt(0).toUpperCase() + gender.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <Text className="text-on-surface text-lg font-medium capitalize">{profile.gender}</Text>
              )}
            </View>

            {/* Blood Group */}
            <View className="p-4">
              <Text className="text-label text-on-surface-variant mb-1">Blood Group</Text>
              {isEditing ? (
                <View className="flex-row flex-wrap gap-2">
                  {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((group) => (
                    <TouchableOpacity
                      key={group}
                      onPress={() => handleChange('blood_group', group)}
                      className={`px-3 py-2 rounded-lg ${
                        editData.blood_group === group ? 'bg-primary' : 'bg-surface'
                      }`}
                    >
                      <Text className={
                        editData.blood_group === group ? 'text-white' : 'text-on-surface'
                      }>
                        {group}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <Text className="text-on-surface text-lg font-medium">{profile.blood_group}</Text>
              )}
            </View>
          </View>
        </View>

        {/* Address & Identification */}
        <View className="px-6 mb-6">
          <Text className="text-title text-on-surface mb-3">Address & Identification</Text>
          <View className="bg-surface-variant rounded-xl overflow-hidden">
            {/* Address */}
            <View className="p-4 border-b border-outline">
              <Text className="text-label text-on-surface-variant mb-1">Address</Text>
              {isEditing ? (
                <TextInput
                  className="text-on-surface text-lg font-medium bg-surface rounded-lg p-3 min-h-[80px]"
                  value={editData.address || ''}
                  onChangeText={(value) => handleChange('address', value)}
                  placeholder="Your complete address"
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  placeholderTextColor="#9CA3AF"
                />
              ) : (
                <Text className="text-on-surface text-lg font-medium">{profile.address}</Text>
              )}
            </View>

            {/* ID Type */}
            <View className="p-4 border-b border-outline">
              <Text className="text-label text-on-surface-variant mb-1">ID Type</Text>
              {isEditing ? (
                <View className="flex-row space-x-3">
                  {['nid', 'birth'].map((idType) => (
                    <TouchableOpacity
                      key={idType}
                      onPress={() => handleChange('id_type', idType)}
                      className={`px-4 py-2 rounded-lg ${
                        editData.id_type === idType ? 'bg-primary' : 'bg-surface'
                      }`}
                    >
                      <Text className={
                        editData.id_type === idType ? 'text-white' : 'text-on-surface'
                      }>
                        {idType === 'nid' ? 'National ID' : 'Birth Certificate'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <Text className="text-on-surface text-lg font-medium">
                  {profile.id_type === 'nid' ? 'National ID' : 'Birth Certificate'}
                </Text>
              )}
            </View>

            {/* ID Number */}
            <View className="p-4">
              <Text className="text-label text-on-surface-variant mb-1">
                {isEditing ? (editData.id_type === 'nid' ? 'NID Number' : 'Birth Certificate Number') : 
                 (profile.id_type === 'nid' ? 'NID Number' : 'Birth Certificate Number')}
              </Text>
              {isEditing ? (
                <TextInput
                  className="text-on-surface text-lg font-medium bg-surface rounded-lg p-3"
                  value={editData.id_number || ''}
                  onChangeText={(value) => handleChange('id_number', value)}
                  placeholder={editData.id_type === 'nid' ? 'Enter NID number' : 'Enter birth certificate number'}
                  keyboardType="numeric"
                  placeholderTextColor="#9CA3AF"
                />
              ) : (
                <View className="flex-row justify-between items-center">
                  <Text className="text-on-surface text-lg font-medium">{profile.id_number}</Text>
                  <TouchableOpacity onPress={handleVerificationStatus}>
                    <Text className="text-green-500 text-sm font-medium">✅ Verified</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Emergency Medical Information */}
        <View className="px-6 mb-6">
          <Text className="text-title text-on-surface mb-3">Emergency Medical Information</Text>
          <View className="bg-surface-variant rounded-xl overflow-hidden">
            <View className="p-4">
              
              {isEditing ? (
                <TextInput
                  className="text-on-surface text-lg font-medium bg-surface rounded-lg p-3 min-h-[100px]"
                  value={editData.emergency_medical_note || ''}
                  onChangeText={(value) => handleChange('emergency_medical_note', value)}
                  placeholder="Enter any important medical information (allergies, conditions, medications, etc.) that emergency services should know"
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  placeholderTextColor="#9CA3AF"
                />
              ) : (
                <Text className="text-on-surface text-lg font-medium">
                  {profile.emergency_medical_note || 'No medical information provided'}
                </Text>
              )}
              <Text className="text-label text-on-surface-variant text-sm mt-2">
                This information will be shared with emergency responders in case of an emergency
              </Text>
            </View>
          </View>
        </View>

        {/* Account Actions */}
        <View className="px-6 mb-6">
          <Text className="text-title text-on-surface mb-3">Account Settings</Text>
          <View className="bg-surface-variant rounded-xl overflow-hidden">
            <TouchableOpacity 
              className="flex-row justify-between items-center p-4 border-b border-outline"
              onPress={handleChangePassword}
            >
              <Text className="text-on-surface">Change Password</Text>
              <Text className="text-primary">→</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              className="flex-row justify-between items-center p-4 border-b border-outline"
              onPress={handleEmergencyProfile}
            >
              <Text className="text-on-surface">Emergency Profile</Text>
              <Text className="text-primary">→</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              className="flex-row justify-between items-center p-4"
              onPress={() => router.push('/(agent)/settings')}
            >
              <Text className="text-on-surface">App Settings</Text>
              <Text className="text-primary">→</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Statistics */}
        <View className="px-6 mb-6">
          <Text className="text-title text-on-surface mb-3">Safety Statistics</Text>
          <View className="bg-surface-variant rounded-xl p-4">
            <View className="flex-row justify-between mb-4">
              <View className="items-center">
                <Text className="text-headline font-bold text-primary">{stats.safety_checkins}</Text>
                <Text className="text-label text-on-surface-variant">Safety Check-ins</Text>
              </View>
              <View className="items-center">
                <Text className="text-headline font-bold text-green-500">{stats.reports_filed}</Text>
                <Text className="text-label text-on-surface-variant">Reports Filed</Text>
              </View>
              <View className="items-center">
                <Text className="text-headline font-bold text-secondary">{stats.days_active}</Text>
                <Text className="text-label text-on-surface-variant">Days Active</Text>
              </View>
            </View>
            <View className="bg-surface rounded-full h-2 w-full overflow-hidden">
              <View 
                className="bg-primary h-2" 
                style={{ width: `${stats.profile_completeness}%` }} 
              />
            </View>
            <Text className="text-label text-on-surface-variant text-center mt-2">
              Profile Completeness: {stats.profile_completeness}%
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Add Emergency Contact Modal */}
      <Modal
        visible={showAddContact}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddContact(false)}
      >
        <View className="flex-1 bg-black/50 justify-center items-center p-6">
          <View className="bg-surface rounded-xl w-full max-w-sm p-6">
            <Text className="text-title text-on-surface mb-4">Add Emergency Contact</Text>
            
            <TextInput
              className="bg-surface-variant rounded-lg p-3 mb-3 text-on-surface"
              placeholder="Full Name"
              value={newContact.name}
              onChangeText={(text) => setNewContact(prev => ({ ...prev, name: text }))}
            />
            
            <TextInput
              className="bg-surface-variant rounded-lg p-3 mb-3 text-on-surface"
              placeholder="Phone Number"
              value={newContact.phone}
              onChangeText={(text) => setNewContact(prev => ({ ...prev, phone: text }))}
              keyboardType="phone-pad"
            />
            
            <TextInput
              className="bg-surface-variant rounded-lg p-3 mb-3 text-on-surface"
              placeholder="Email (Optional)"
              value={newContact.email}
              onChangeText={(text) => setNewContact(prev => ({ ...prev, email: text }))}
              keyboardType="email-address"
            />
            
            <View className="mb-4">
              <Text className="text-label text-on-surface-variant mb-2">Relationship</Text>
              <View className="flex-row flex-wrap gap-2">
                {['family', 'friend', 'colleague', 'neighbor', 'emergency_service', 'other'].map((rel) => (
                  <TouchableOpacity
                    key={rel}
                    onPress={() => setNewContact(prev => ({ ...prev, relationship: rel }))}
                    className={`px-3 py-2 rounded-lg ${
                      newContact.relationship === rel ? 'bg-primary' : 'bg-surface-variant'
                    }`}
                  >
                    <Text className={
                      newContact.relationship === rel ? 'text-white' : 'text-on-surface'
                    }>
                      {rel.charAt(0).toUpperCase() + rel.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            <TouchableOpacity
              className="flex-row items-center mb-4"
              onPress={() => setNewContact(prev => ({ ...prev, is_primary: !prev.is_primary }))}
            >
              <View className={`w-6 h-6 rounded border-2 mr-2 ${
                newContact.is_primary ? 'bg-primary border-primary' : 'border-outline'
              }`}>
                {newContact.is_primary && <Text className="text-white text-center">✓</Text>}
              </View>
              <Text className="text-on-surface">Set as primary contact</Text>
            </TouchableOpacity>
            
            <View className="flex-row space-x-3">
              <TouchableOpacity
                className="flex-1 bg-surface-variant py-3 rounded-lg"
                onPress={() => setShowAddContact(false)}
                disabled={isAddingContact}
              >
                <Text className="text-on-surface text-center font-semibold">Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                className="flex-1 bg-primary py-3 rounded-lg"
                onPress={handleAddContact}
                disabled={isAddingContact}
              >
                <Text className="text-white text-center font-semibold">
                  {isAddingContact ? 'Adding...' : 'Add Contact'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Change Password Modal */}
      <Modal
        visible={showChangePassword}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowChangePassword(false)}
      >
        <View className="flex-1 bg-black/50 justify-center items-center p-6">
          <View className="bg-surface rounded-xl w-full max-w-sm p-6">
            <Text className="text-title text-on-surface mb-2">{getPasswordTitle()}</Text>
            <Text className="text-body text-on-surface-variant mb-4">
              {getPasswordDescription()}
            </Text>
            
            <TextInput
              className="bg-surface-variant rounded-lg p-3 mb-4 text-on-surface"
              placeholder={getPasswordPlaceholder()}
              value={getPasswordValue()}
              onChangeText={setPasswordValue}
              secureTextEntry
              autoFocus
            />

            {passwordStep === 2 && (
              <View className="bg-warning/20 p-3 rounded-lg mb-4">
                <Text className="text-warning text-sm">
                  Password must be at least 6 characters long
                </Text>
              </View>
            )}

            {passwordStep === 3 && passwordData.newPassword !== passwordData.confirmPassword && (
              <View className="bg-error/20 p-3 rounded-lg mb-4">
                <Text className="text-error text-sm">
                  Passwords do not match
                </Text>
              </View>
            )}
            
            <View className="flex-row space-x-3">
              <TouchableOpacity
                className="flex-1 bg-surface-variant py-3 rounded-lg"
                onPress={handlePasswordBack}
                disabled={isChangingPassword}
              >
                <Text className="text-on-surface text-center font-semibold">
                  {passwordStep === 1 ? 'Cancel' : 'Back'}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                className="flex-1 bg-primary py-3 rounded-lg"
                onPress={handlePasswordStep}
                disabled={isChangingPassword}
              >
                <Text className="text-white text-center font-semibold">
                  {getPasswordButtonText()}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Progress indicator */}
            <View className="flex-row justify-center mt-4">
              {[1, 2, 3].map((step) => (
                <View
                  key={step}
                  className={`w-2 h-2 rounded-full mx-1 ${
                    step === passwordStep ? 'bg-primary' : 
                    step < passwordStep ? 'bg-primary/50' : 'bg-outline'
                  }`}
                />
              ))}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}