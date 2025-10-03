// app/agent/profile.tsx
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Image, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function Profile() {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState({
    name: 'Ayesha Rahman',
    phone: '+880 1712-345678',
    email: 'ayesha.rahman@email.com',
    dateOfBirth: '1995-08-15',
    gender: 'Female',
    bloodGroup: 'B+',
    emergencyContactName: 'Rahim Rahman',
    emergencyContactPhone: '+880 1712-987654',
    address: 'House 45, Road 12, Gulshan 1, Dhaka',
    nidNumber: '1234567890123',
    profilePhoto: null,
  });

  const [editData, setEditData] = useState(profile);

  const handleSave = () => {
    setProfile(editData);
    setIsEditing(false);
    Alert.alert('Profile Updated', 'Your profile has been successfully updated.');
  };

  const handleCancel = () => {
    setEditData(profile);
    setIsEditing(false);
  };

  const handleChange = (field: string, value: string) => {
    setEditData(prev => ({ ...prev, [field]: value }));
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
      setEditData(prev => ({ ...prev, profilePhoto: result.assets[0].uri }));
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
      setEditData(prev => ({ ...prev, profilePhoto: result.assets[0].uri }));
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

  const handleChangePassword = () => {
    Alert.alert('Change Password', 'This would open change password flow');
  };

  const handleVerificationStatus = () => {
    Alert.alert(
      'Account Verification',
      'Your account is verified with NID.\n\nVerification Status: ✅ Verified\nVerified On: 2024-01-15',
      [{ text: 'OK' }]
    );
  };


  const handleEmergencyProfile = () => {
    Alert.alert(
      'Emergency Profile',
      'This information is shared with emergency services:\n\n' +
      `Name: ${profile.name}\n` +
      `Blood Group: ${profile.bloodGroup}\n` +
      `Emergency Contact: ${profile.emergencyContactName}\n` +
      `Medical Info: None specified`,
      [{ text: 'OK' }]
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
            <Text className="text-headline text-on-surface">My Profile</Text>
          </View>
          <Text className="text-body text-on-surface-variant">
            Manage your personal information and safety profile
          </Text>
        </View>

        {/* Profile Photo & Basic Info */}
        <View className="px-6 mb-6">
          <View className="bg-surface-variant rounded-xl p-6 items-center">
            <TouchableOpacity onPress={isEditing ? handleChangePhoto : undefined}>
              <View className="w-24 h-24 rounded-full bg-primary/20 items-center justify-center mb-4 border-4 border-primary/30">
                {editData.profilePhoto ? (
                  <Image 
                    source={{ uri: editData.profilePhoto }} 
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


            {/* Edit/Save Buttons */}
            {!isEditing ? (
              <TouchableOpacity
                className="bg-primary px-6 py-3 rounded-lg"
                onPress={() => setIsEditing(true)}
              >
                <Text className="text-white font-semibold">Edit Profile</Text>
              </TouchableOpacity>
            ) : (
              <View className="flex-row space-x-3">
                <TouchableOpacity
                  className="bg-surface px-6 py-3 rounded-lg"
                  onPress={handleCancel}
                >
                  <Text className="text-on-surface font-semibold">Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="bg-primary px-6 py-3 rounded-lg"
                  onPress={handleSave}
                >
                  <Text className="text-white font-semibold">Save Changes</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
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
                  className="text-on-surface text-lg font-medium"
                  value={editData.name}
                  onChangeText={(value) => handleChange('name', value)}
                  placeholder="Enter your full name"
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
                  className="text-on-surface text-lg font-medium"
                  value={editData.phone}
                  onChangeText={(value) => handleChange('phone', value)}
                  placeholder="Enter phone number"
                  keyboardType="phone-pad"
                />
              ) : (
                <Text className="text-on-surface text-lg font-medium">{profile.phone}</Text>
              )}
            </View>

            {/* Email */}
            <View className="p-4 border-b border-outline">
              <Text className="text-label text-on-surface-variant mb-1">Email Address</Text>
              {isEditing ? (
                <TextInput
                  className="text-on-surface text-lg font-medium"
                  value={editData.email}
                  onChangeText={(value) => handleChange('email', value)}
                  placeholder="Enter email address"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              ) : (
                <Text className="text-on-surface text-lg font-medium">{profile.email}</Text>
              )}
            </View>

            {/* Date of Birth */}
            <View className="p-4 border-b border-outline">
              <Text className="text-label text-on-surface-variant mb-1">Date of Birth</Text>
              {isEditing ? (
                <TextInput
                  className="text-on-surface text-lg font-medium"
                  value={editData.dateOfBirth}
                  onChangeText={(value) => handleChange('dateOfBirth', value)}
                  placeholder="YYYY-MM-DD"
                />
              ) : (
                <Text className="text-on-surface text-lg font-medium">{profile.dateOfBirth}</Text>
              )}
            </View>

            {/* Gender */}
            <View className="p-4 border-b border-outline">
              <Text className="text-label text-on-surface-variant mb-1">Gender</Text>
              {isEditing ? (
                <TextInput
                  className="text-on-surface text-lg font-medium"
                  value={editData.gender}
                  onChangeText={(value) => handleChange('gender', value)}
                  placeholder="Gender"
                />
              ) : (
                <Text className="text-on-surface text-lg font-medium">{profile.gender}</Text>
              )}
            </View>

            {/* Blood Group */}
            <View className="p-4">
              <Text className="text-label text-on-surface-variant mb-1">Blood Group</Text>
              {isEditing ? (
                <TextInput
                  className="text-on-surface text-lg font-medium"
                  value={editData.bloodGroup}
                  onChangeText={(value) => handleChange('bloodGroup', value)}
                  placeholder="Blood Group"
                />
              ) : (
                <Text className="text-on-surface text-lg font-medium">{profile.bloodGroup}</Text>
              )}
            </View>
          </View>
        </View>

        {/* Emergency Contact */}
        <View className="px-6 mb-6">
          <Text className="text-title text-on-surface mb-3">Emergency Contact</Text>
          <View className="bg-surface-variant rounded-xl overflow-hidden">
            <View className="p-4 border-b border-outline">
              <Text className="text-label text-on-surface-variant mb-1">Contact Name</Text>
              {isEditing ? (
                <TextInput
                  className="text-on-surface text-lg font-medium"
                  value={editData.emergencyContactName}
                  onChangeText={(value) => handleChange('emergencyContactName', value)}
                  placeholder="Emergency contact name"
                />
              ) : (
                <Text className="text-on-surface text-lg font-medium">{profile.emergencyContactName}</Text>
              )}
            </View>

            <View className="p-4">
              <Text className="text-label text-on-surface-variant mb-1">Contact Phone</Text>
              {isEditing ? (
                <TextInput
                  className="text-on-surface text-lg font-medium"
                  value={editData.emergencyContactPhone}
                  onChangeText={(value) => handleChange('emergencyContactPhone', value)}
                  placeholder="Emergency contact phone"
                  keyboardType="phone-pad"
                />
              ) : (
                <Text className="text-on-surface text-lg font-medium">{profile.emergencyContactPhone}</Text>
              )}
            </View>
          </View>
        </View>

        {/* Address & Identification */}
        <View className="px-6 mb-6">
          <Text className="text-title text-on-surface mb-3">Address & Identification</Text>
          <View className="bg-surface-variant rounded-xl overflow-hidden">
            <View className="p-4 border-b border-outline">
              <Text className="text-label text-on-surface-variant mb-1">Address</Text>
              {isEditing ? (
                <TextInput
                  className="text-on-surface text-lg font-medium"
                  value={editData.address}
                  onChangeText={(value) => handleChange('address', value)}
                  placeholder="Your complete address"
                  multiline
                />
              ) : (
                <Text className="text-on-surface text-lg font-medium">{profile.address}</Text>
              )}
            </View>

            <View className="p-4">
              <Text className="text-label text-on-surface-variant mb-1">NID Number</Text>
              <Text className="text-on-surface text-lg font-medium">{profile.nidNumber}</Text>
              <TouchableOpacity onPress={handleVerificationStatus}>
                <Text className="text-primary text-sm mt-1">✅ Verified Account</Text>
              </TouchableOpacity>
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
                <Text className="text-headline font-bold text-primary">12</Text>
                <Text className="text-label text-on-surface-variant">Safety Check-ins</Text>
              </View>
              <View className="items-center">
                <Text className="text-headline font-bold text-green-500">3</Text>
                <Text className="text-label text-on-surface-variant">Reports Filed</Text>
              </View>
              <View className="items-center">
                <Text className="text-headline font-bold text-secondary">28</Text>
                <Text className="text-label text-on-surface-variant">Days Active</Text>
              </View>
            </View>
            <View className="bg-surface rounded-full h-2 w-full overflow-hidden">
              <View className="bg-primary h-2" style={{ width: '85%' }} />
            </View>
            <Text className="text-label text-on-surface-variant text-center mt-2">
              Profile Completeness: 85%
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}