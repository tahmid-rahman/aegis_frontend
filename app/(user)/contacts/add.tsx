// app/user/contacts/add.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';
import { debounce } from 'lodash';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { api } from '../../../services/api';

interface UserLookupResult {
  found: boolean;
  user?: {
    name: string;
    email: string;
  };
  already_added?: boolean;
  suggestions?: { phone: string; name: string }[];
  message?: string;
}

export default function AddContactScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'manual' | 'import'>('manual');
  const [loading, setLoading] = useState(false);
  const [lookingUp, setLookingUp] = useState(false);
  const [lookupResult, setLookupResult] = useState<UserLookupResult | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    relationship: 'family' as 'family' | 'friend' | 'colleague' | 'neighbor' | 'emergency_service' | 'other',
    is_emergency_contact: true,
    is_primary: false
  });

  const relationships = [
    { label: 'Family', value: 'family' },
    { label: 'Friend', value: 'friend' },
    { label: 'Colleague', value: 'colleague' },
    { label: 'Neighbor', value: 'neighbor' },
    { label: 'Emergency Service', value: 'emergency_service' },
    { label: 'Other', value: 'other' },
  ];

  // Debounced phone lookup function
  const lookupPhoneNumber = useCallback(
    debounce(async (phone: string) => {
      if (!phone || phone.length < 5) {
        setLookupResult(null);
        return;
      }

      try {
        setLookingUp(true);
        const token = await AsyncStorage.getItem('auth_token');
        if (!token) return;

        const response = await api.post('/aegis/lookup-phone/', { phone }, {
          headers: { 'Authorization': `Token ${token}` }
        });

        setLookupResult(response.data);

        if (response.data.found && response.data.user) {
          // Auto-fill the form with found user data
          setFormData(prev => ({
            ...prev,
            name: response.data.user.name,
            email: response.data.user.email || ''
          }));

          if (response.data.already_added) {
            Alert.alert(
              'Contact Exists', 
              'This user is already in your contacts list.',
              [{ text: 'OK' }]
            );
          }
        }
      } catch (error: any) {
        console.error('Phone lookup error:', error);
        setLookupResult({ found: false, message: 'Lookup failed' });
      } finally {
        setLookingUp(false);
      }
    }, 1000), // 1 second debounce
    []
  );

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Trigger phone lookup when phone number changes
    if (field === 'phone' && typeof value === 'string') {
      setLookupResult(null);
      lookupPhoneNumber(value);
    }
  };

  const handleSaveContact = async () => {
    if (!formData.name.trim() || !formData.phone.trim()) {
      Alert.alert('Missing Information', 'Please enter at least a name and phone number');
      return;
    }

    const phoneRegex = /^[+]?[0-9\s\-\(\)]{10,}$/;
    if (!phoneRegex.test(formData.phone.replace(/\s/g, ''))) {
      Alert.alert('Invalid Phone', 'Please enter a valid phone number starting with country code (e.g., +880)');
      return;
    }

    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('auth_token');
      if (!token) throw new Error('No authentication token found');

      const contactData: any = {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        relationship: formData.relationship,
        is_emergency_contact: formData.is_emergency_contact,
        is_primary: formData.is_primary
      };

      if (formData.email.trim()) {
        contactData.email = formData.email.trim();
      }

      const response = await api.post('/aegis/contacts/', contactData, {
        headers: { 'Authorization': `Token ${token}` },
      });

      Alert.alert(
        'Contact Saved', 
        `${formData.name} has been added as ${formData.is_emergency_contact ? 'an EMERGENCY' : 'a regular'} contact`,
        [{ text: 'OK', onPress: () => router.back() }]
      );

    } catch (error: any) {
      console.error('Error saving contact:', error);
      
      if (error.response?.status === 400) {
        if (error.response.data?.error?.includes('already exists')) {
          Alert.alert('Error', 'A contact with this phone number already exists');
        } else {
          Alert.alert('Error', 'Please check your input and try again');
        }
      } else {
        Alert.alert('Error', 'Failed to save contact. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleImportContacts = () => {
    Alert.alert(
      'Import Contacts',
      'This feature will be available soon. For now, please add contacts manually.',
      [{ text: 'OK' }]
    );
  };

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      lookupPhoneNumber.cancel();
    };
  }, [lookupPhoneNumber]);

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
          <View className="bg-surface-variant rounded-xl p-5">
            <Text className="text-lg font-semibold text-on-surface mb-4">Contact Details</Text>
            
            {/* Phone Field - First because we lookup by phone */}
            <View className="mb-5">
              <Text className="text-sm font-medium text-on-surface-variant mb-2">Phone Number *</Text>
              <TextInput
                className="bg-surface rounded-lg p-4 text-on-surface border border-outline"
                placeholder="+880 1XXX XXXXXX"
                placeholderTextColor="rgb(var(--color-on-surface-variant))"
                value={formData.phone}
                onChangeText={(text) => handleInputChange('phone', text)}
                keyboardType="phone-pad"
                autoComplete="tel"
              />
              <Text className="text-xs text-on-surface-variant mt-1">
                Include country code (e.g., +880 for Bangladesh)
              </Text>

              {/* Phone Lookup Status */}
              {lookingUp && (
                <View className="flex-row items-center mt-2">
                  <ActivityIndicator size="small" color="rgb(var(--color-primary))" />
                  <Text className="text-xs text-on-surface-variant ml-2">Looking up phone number...</Text>
                </View>
              )}

              {lookupResult && !lookingUp && (
                <View className={`mt-2 p-2 rounded-lg ${
                  lookupResult.found ? 'bg-success/10' : 'bg-warning/10'
                }`}>
                  <Text className={`text-xs ${lookupResult.found ? 'text-success' : 'text-warning'}`}>
                    {lookupResult.found ? 
                      `✅ User found: ${lookupResult.user?.name}` : 
                      lookupResult.message || 'User not found in system'
                    }
                  </Text>
                  {lookupResult.suggestions && lookupResult.suggestions.length > 0 && (
                    <Text className="text-xs text-on-surface-variant mt-1">
                      Similar numbers: {lookupResult.suggestions.map(s => s.phone).join(', ')}
                    </Text>
                  )}
                </View>
              )}
            </View>

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
                autoComplete="email"
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
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-1">
                <Text className="text-sm font-medium text-on-surface">Emergency Contact</Text>
                <Text className="text-xs text-on-surface-variant">
                  Will receive alerts during emergencies
                </Text>
              </View>
              <TouchableOpacity
                className={`w-12 h-6 rounded-full ${formData.is_emergency_contact ? 'bg-accent' : 'bg-gray-300'} justify-center`}
                onPress={() => handleInputChange('is_emergency_contact', !formData.is_emergency_contact)}
              >
                <View 
                  className={`w-5 h-5 rounded-full bg-white absolute ${formData.is_emergency_contact ? 'right-1' : 'left-1'}`}
                />
              </TouchableOpacity>
            </View>

            {/* Primary Contact Toggle */}
            <View className="flex-row items-center justify-between mb-6">
              <View className="flex-1">
                <Text className="text-sm font-medium text-on-surface">Primary Contact</Text>
                <Text className="text-xs text-on-surface-variant">
                  First to be notified in emergencies
                </Text>
              </View>
              <TouchableOpacity
                className={`w-12 h-6 rounded-full ${formData.is_primary ? 'bg-primary' : 'bg-gray-300'} justify-center`}
                onPress={() => handleInputChange('is_primary', !formData.is_primary)}
              >
                <View 
                  className={`w-5 h-5 rounded-full bg-white absolute ${formData.is_primary ? 'right-1' : 'left-1'}`}
                />
              </TouchableOpacity>
            </View>

            {/* Save Button */}
            <TouchableOpacity
              className="bg-primary py-4 rounded-xl mb-4 items-center justify-center"
              onPress={handleSaveContact}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-on-primary text-center font-bold text-lg">
                  Save Contact
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => router.back()}
              disabled={loading}
            >
              <Text className="text-on-surface-variant text-center">Cancel</Text>
            </TouchableOpacity>
          </View>
        ) : (
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