// app/user/profile-edit.tsx
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../../providers/ThemeProvider';

export default function EditProfile() {
  const router = useRouter();
  const { effectiveTheme } = useTheme();
  
  const [userData, setUserData] = useState({
    name: 'Sarah Ahmed',
    phone: '+880 1712 345678',
    email: 'sarah.ahmed@example.com',
    nidNumber: '1990123456789',
    dateOfBirth: new Date(1990, 5, 15), // June 15, 1990
    gender: 'female',
    bloodGroup: 'A+',
    address: '123 Main Street, Dhaka',
    emergencyNotes: 'Has asthma, carries inhaler',
  });

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleInputChange = (field: string, value: string | Date) => {
    setUserData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = () => {
    setIsSaving(true);
    // Simulate API call
    setTimeout(() => {
      setIsSaving(false);
      Alert.alert(
        "Success", 
        "Your profile has been updated successfully",
        [{ text: "OK", onPress: () => router.back() }]
      );
    }, 1500);
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
    // This would compare with original data in a real app
    return true;
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      handleInputChange('dateOfBirth', selectedDate);
    }
  };

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const genders = ['male', 'female', 'other', 'prefer_not_to_say'];

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatGender = (gender: string) => {
    const genderMap: { [key: string]: string } = {
      male: 'Male',
      female: 'Female',
      other: 'Other',
      prefer_not_to_say: 'Prefer not to say'
    };
    return genderMap[gender] || gender;
  };

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
              />
            </View>

            {/* NID Number */}
            <View className="mb-5">
              <Text className="text-label text-on-surface-variant mb-2">NID Number</Text>
              <TextInput
                className="bg-surface rounded-xl p-4 text-on-surface border border-outline"
                value={userData.nidNumber}
                onChangeText={(text) => handleInputChange('nidNumber', text)}
                placeholder="Enter NID number"
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
                <Text className="text-on-surface">{formatDate(userData.dateOfBirth)}</Text>
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={userData.dateOfBirth}
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
                  selectedValue={userData.bloodGroup}
                  onValueChange={(value) => handleInputChange('bloodGroup', value)}
                  dropdownIconColor="rgb(var(--color-on-surface-variant))"
                >
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
                value={userData.address}
                onChangeText={(text) => handleInputChange('address', text)}
                placeholder="Enter your address"
                placeholderTextColor="rgb(var(--color-on-surface-variant))"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            {/* Emergency Notes */}
            <View className="mb-5">
              <Text className="text-label text-on-surface-variant mb-2">
                Emergency Medical Notes
                <Text className="text-on-surface-variant text-xs"> (Optional)</Text>
              </Text>
              <TextInput
                className="bg-surface rounded-xl p-4 text-on-surface border border-outline"
                value={userData.emergencyNotes}
                onChangeText={(text) => handleInputChange('emergencyNotes', text)}
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
              disabled={isSaving}
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