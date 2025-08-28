// app/user/contacts/add.tsx
import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function AddContactScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'manual' | 'import'>('manual');
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    relationship: 'family',
    isEmergency: true
  });

  const relationships = [
    { label: 'Family', value: 'family' },
    { label: 'Friend', value: 'friend' },
    { label: 'Colleague', value: 'colleague' },
    { label: 'Neighbor', value: 'neighbor' },
    { label: 'Emergency Service', value: 'emergency_service' },
    { label: 'Other', value: 'other' },
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveContact = () => {
    // Basic validation
    if (!formData.name.trim() || !formData.phone.trim()) {
      Alert.alert('Missing Information', 'Please enter at least a name and phone number');
      return;
    }

    // Phone validation (basic)
    const phoneRegex = /^[+]?[0-9\s\-\(\)]{10,}$/;
    if (!phoneRegex.test(formData.phone.replace(/\s/g, ''))) {
      Alert.alert('Invalid Phone', 'Please enter a valid phone number');
      return;
    }

    // Save logic would go here
    console.log('Saving contact:', formData);
    Alert.alert(
      'Contact Saved', 
      `${formData.name} has been added as ${formData.isEmergency ? 'an EMERGENCY' : 'a regular'} contact`,
      [{ text: 'OK', onPress: () => router.back() }]
    );
  };

  const handleImportContacts = () => {
    Alert.alert(
      'Import Contacts',
      'This will access your phone contacts to import. Allow permission?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Allow', 
          onPress: () => {
            // Simulate import process
            Alert.alert('Success', 'Contacts imported successfully!');
          } 
        }
      ]
    );
  };

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View className="px-6 pt-6 pb-4">
        <Text className="text-2xl font-bold text-on-surface">Add Contact</Text>
        <Text className="text-on-surface-variant mt-1">
          Add someone to your safety network
        </Text>
      </View>

      {/* Tab Navigation */}
      <View className="flex-row px-6 mb-6">
        <TouchableOpacity
          className={`flex-1 py-3 rounded-l-xl ${activeTab === 'manual' ? 'bg-primary' : 'bg-surface-variant'}`}
          onPress={() => setActiveTab('manual')}
        >
          <Text className={`text-center font-medium ${activeTab === 'manual' ? 'text-on-primary' : 'text-on-surface'}`}>
            Manual Entry
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          className={`flex-1 py-3 rounded-r-xl ${activeTab === 'import' ? 'bg-primary' : 'bg-surface-variant'}`}
          onPress={() => setActiveTab('import')}
        >
          <Text className={`text-center font-medium ${activeTab === 'import' ? 'text-on-primary' : 'text-on-surface'}`}>
            Import
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        {activeTab === 'manual' ? (
          /* Manual Entry Form */
          <View className="bg-surface-variant rounded-xl p-5">
            <Text className="text-lg font-semibold text-on-surface mb-4">Contact Details</Text>
            
            {/* Name Field */}
            <View className="mb-5">
              <Text className="text-sm font-medium text-on-surface-variant mb-2">Full Name *</Text>
              <TextInput
                className="bg-surface rounded-lg p-4 text-on-surface border border-outline"
                placeholder="Enter full name"
                placeholderTextColor="rgb(var(--color-on-surface-variant))"
                value={formData.name}
                onChangeText={(text) => handleInputChange('name', text)}
              />
            </View>

            {/* Phone Field */}
            <View className="mb-5">
              <Text className="text-sm font-medium text-on-surface-variant mb-2">Phone Number *</Text>
              <TextInput
                className="bg-surface rounded-lg p-4 text-on-surface border border-outline"
                placeholder="+1 (555) 123-4567"
                placeholderTextColor="rgb(var(--color-on-surface-variant))"
                value={formData.phone}
                onChangeText={(text) => handleInputChange('phone', text)}
                keyboardType="phone-pad"
              />
            </View>

            {/* Email Field */}
            <View className="mb-5">
              <Text className="text-sm font-medium text-on-surface-variant mb-2">Email (Optional)</Text>
              <TextInput
                className="bg-surface rounded-lg p-4 text-on-surface border border-outline"
                placeholder="email@example.com"
                placeholderTextColor="rgb(var(--color-on-surface-variant))"
                value={formData.email}
                onChangeText={(text) => handleInputChange('email', text)}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            {/* Relationship Picker */}
            <View className="mb-5">
              <Text className="text-sm font-medium text-on-surface-variant mb-2">Relationship</Text>
              <View className="bg-surface rounded-lg border border-outline">
                <Picker
                  selectedValue={formData.relationship}
                  onValueChange={(value) => handleInputChange('relationship', value)}
                  dropdownIconColor="rgb(var(--color-on-surface-variant))"
                >
                  {relationships.map((rel) => (
                    <Picker.Item key={rel.value} label={rel.label} value={rel.value} />
                  ))}
                </Picker>
              </View>
            </View>

            {/* Emergency Contact Toggle */}
            <View className="flex-row items-center justify-between mb-6">
              <View className="flex-1">
                <Text className="text-sm font-medium text-on-surface">Emergency Contact</Text>
                <Text className="text-xs text-on-surface-variant">
                  Will receive alerts during emergencies
                </Text>
              </View>
              <TouchableOpacity
                className={`w-12 h-6 rounded-full ${formData.isEmergency ? 'bg-accent' : 'bg-gray-300'} justify-center`}
                onPress={() => handleInputChange('isEmergency', !formData.isEmergency)}
              >
                <View 
                  className={`w-5 h-5 rounded-full bg-white absolute ${formData.isEmergency ? 'right-1' : 'left-1'}`}
                />
              </TouchableOpacity>
            </View>

            {/* Save Button */}
            <TouchableOpacity
              className="bg-primary py-4 rounded-xl mb-4"
              onPress={handleSaveContact}
            >
              <Text className="text-on-primary text-center font-bold text-lg">
                Save Contact
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.back()}>
              <Text className="text-on-surface-variant text-center">Cancel</Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* Import Contacts Section */
          <View className="bg-surface-variant rounded-xl p-5">
            <Text className="text-lg font-semibold text-on-surface mb-4">Import Contacts</Text>
            
            <View className="items-center py-8">
              <Text className="text-6xl mb-4">📱</Text>
              <Text className="text-on-surface text-center mb-2">
                Import from your phone contacts
              </Text>
              <Text className="text-on-surface-variant text-center text-sm mb-6">
                Quickly add existing contacts to your safety network
              </Text>

              <TouchableOpacity
                className="bg-primary py-4 px-8 rounded-xl mb-4"
                onPress={handleImportContacts}
              >
                <Text className="text-on-primary text-center font-bold text-lg">
                  Import Contacts
                </Text>
              </TouchableOpacity>

              <View className="bg-primary/10 p-4 rounded-xl mt-4">
                <Text className="text-on-surface text-sm text-center">
                  🔒 Your contacts are stored securely and only used for emergency alerts
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Emergency Contact Info */}
        <View className="bg-error/10 p-4 rounded-xl mt-6 mb-10">
          <Text className="text-error font-semibold mb-2">⚠️ Emergency Contact Requirements</Text>
          <View className="space-y-1">
            <Text className="text-on-surface-variant text-sm">• Minimum 2 emergency contacts recommended</Text>
            <Text className="text-on-surface-variant text-sm">• Choose people who can respond quickly</Text>
            <Text className="text-on-surface-variant text-sm">• Include local emergency services if available</Text>
            <Text className="text-on-surface-variant text-sm">• Test alerts after adding new contacts</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}