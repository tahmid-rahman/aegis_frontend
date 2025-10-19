// app/user/contacts/index.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../../providers/ThemeProvider';
import { api } from '../../../services/api';

interface EmergencyContact {
  id: number;
  name: string;
  phone: string;
  relationship: string;
  is_emergency_contact: boolean;
  is_primary: boolean;
  photo: string;
  created_at: string;
  updated_at: string;
}

export default function ContactsScreen() {
  const router = useRouter();
  const { effectiveTheme } = useTheme();
  
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'all' | 'emergency'>('emergency');

  const fetchContacts = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('auth_token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      api.defaults.headers.Authorization = `Token ${token}`;
      const response = await api.get('/aegis/contacts/');
      setContacts(response.data);
    } catch (error: any) {
      console.error('Error fetching contacts:', error);
      Alert.alert('Error', 'Failed to load contacts. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchContacts();
  };

  const filteredContacts = selectedTab === 'emergency' 
    ? contacts.filter(contact => contact.is_emergency_contact)
    : contacts;

  const handleAddContact = () => {
    Alert.alert('Add Contact', 'Choose how to add a contact:', [
      // { text: 'From Phone Contacts', onPress: () => console.log('Import from phone') },
      { text: 'Manual Entry', onPress: () => router.push('/contacts/add') },
      { text: 'Cancel', style: 'cancel' }
    ]);
  };

  const handleToggleEmergency = async (id: number) => {
    try {
      const contact = contacts.find(c => c.id === id);
      if (!contact) return;

      const response = await api.patch(`/aegis/contacts/${id}/`, {
        is_emergency_contact: !contact.is_emergency_contact
      });

      setContacts(contacts.map(c => 
        c.id === id ? response.data : c
      ));
    } catch (error: any) {
      console.error('Error updating contact:', error);
      Alert.alert('Error', 'Failed to update contact. Please try again.');
    }
  };

  const handleTestAlert = async (contact: EmergencyContact) => {
    Alert.alert(
      'Test Alert',
      `Send a test alert to ${contact.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Send Test', 
          onPress: async () => {
            try {
              const response = await api.post(`/aegis/contacts/${contact.id}/test-alert/`);
              Alert.alert('Success', response.data.message);
            } catch (error: any) {
              console.error('Error sending test alert:', error);
              Alert.alert('Error', 'Failed to send test alert. Please try again.');
            }
          } 
        }
      ]
    );
  };

  const handleDeleteContact = async (id: number) => {
    Alert.alert(
      'Delete Contact',
      'Are you sure you want to delete this contact?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              // Using the new POST delete endpoint
              const response = await api.post(`/aegis/contacts/${id}/delete/`);
              setContacts(contacts.filter(c => c.id !== id));
              Alert.alert('Success', response.data.message);
            } catch (error: any) {
              console.error('Error deleting contact:', error);
              
              // Fallback to DELETE method if POST fails
              try {
                await api.delete(`/aegis/contacts/${id}/`);
                setContacts(contacts.filter(c => c.id !== id));
                Alert.alert('Success', 'Contact deleted successfully');
              } catch (deleteError: any) {
                Alert.alert('Error', 'Failed to delete contact. Please try again.');
              }
            }
          } 
        }
      ]
    );
  };

  if (loading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color={effectiveTheme === 'dark' ? '#fff' : '#000'} />
        <Text className="text-on-surface mt-4">Loading contacts...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View className="px-6 pt-6 pb-4">
        <Text className="text-2xl font-bold text-on-surface">Emergency Contacts</Text>
        <Text className="text-on-surface-variant mt-1">
          Manage who gets notified in emergencies
        </Text>
      </View>

      {/* Tab Navigation */}
      <View className="flex-row px-6 mb-4">
        <TouchableOpacity
          className={`flex-1 py-3 rounded-l-xl ${selectedTab === 'emergency' ? 'bg-primary' : 'bg-surface-variant'}`}
          onPress={() => setSelectedTab('emergency')}
        >
          <Text className={`text-center font-medium ${selectedTab === 'emergency' ? 'text-on-primary' : 'text-on-surface'}`}>
            Emergency ({contacts.filter(c => c.is_emergency_contact).length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          className={`flex-1 py-3 rounded-r-xl ${selectedTab === 'all' ? 'bg-primary' : 'bg-surface-variant'}`}
          onPress={() => setSelectedTab('all')}
        >
          <Text className={`text-center font-medium ${selectedTab === 'all' ? 'text-on-primary' : 'text-on-surface'}`}>
            All Contacts ({contacts.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        {/* Emergency Contact Requirements */}
        {selectedTab === 'emergency' && contacts.filter(c => c.is_emergency_contact).length < 2 && (
          <View className="bg-error/10 p-4 rounded-xl mb-4">
            <Text className="text-error font-semibold">⚠️ Minimum 2 Emergency Contacts Required</Text>
            <Text className="text-on-surface-variant text-sm mt-1">
              Add at least 2 emergency contacts for optimal safety
            </Text>
          </View>
        )}

        {/* Contacts List */}
        {filteredContacts.length > 0 ? (
          <View className="bg-surface-variant rounded-xl overflow-hidden">
            {filteredContacts.map((contact, index) => (
              <View 
                key={contact.id} 
                className={`flex-row items-center p-4 ${index < filteredContacts.length - 1 ? 'border-b border-outline' : ''}`}
              >
                {/* Contact Photo/Initial */}
                <View className="w-12 h-12 rounded-full bg-primary/20 items-center justify-center mr-4">
                  <Text className="text-2xl">{contact.photo}</Text>
                </View>

                {/* Contact Info */}
                <View className="flex-1">
                  <Text className="text-on-surface font-medium">
                    {contact.name} {contact.is_primary && '⭐'}
                  </Text>
                  <Text className="text-on-surface-variant text-sm">{contact.phone}</Text>
                  <Text className="text-on-surface-variant text-xs capitalize">
                    {contact.relationship.replace('_', ' ')}
                  </Text>
                </View>

                {/* Actions */}
                <View className="flex-row space-x-2">
                  <TouchableOpacity 
                    className="p-2"
                    onPress={() => handleTestAlert(contact)}
                  >
                    <Text className="text-primary">📋</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    className={`p-2 rounded-full ${contact.is_emergency_contact ? 'bg-accent/20' : 'bg-surface'}`}
                    onPress={() => handleToggleEmergency(contact.id)}
                  >
                    <Text className={contact.is_emergency_contact ? 'text-accent' : 'text-on-surface-variant'}>
                      {contact.is_emergency_contact ? '🚨' : '➕'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    className="p-2"
                    onPress={() => handleDeleteContact(contact.id)}
                  >
                    <Text className="text-error">🗑️</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View className="bg-surface-variant rounded-xl p-8 items-center">
            <Text className="text-4xl mb-2">👥</Text>
            <Text className="text-on-surface text-center">No contacts yet</Text>
            <Text className="text-on-surface-variant text-center text-sm mt-1">
              {selectedTab === 'emergency' 
                ? 'Add emergency contacts to be notified during emergencies'
                : 'Add contacts to your safety network'
              }
            </Text>
          </View>
        )}

        {/* Emergency Instructions */}
        <View className="bg-primary/10 p-4 rounded-xl mt-6">
          <Text className="text-on-surface font-semibold mb-2">ℹ️ How Emergency Alerts Work</Text>
          <View className="space-y-1">
            <Text className="text-on-surface-variant text-sm">• Emergency contacts receive your location</Text>
            <Text className="text-on-surface-variant text-sm">• They get audio recordings and photos if enabled</Text>
            <Text className="text-on-surface-variant text-sm">• Alerts include instructions on how to help</Text>
            <Text className="text-on-surface-variant text-sm">• Test alerts help ensure everything works</Text>
          </View>
        </View>

        {/* Spacer for FAB */}
        <View className="h-24" />
      </ScrollView>

      {/* Add Contact FAB */}
      <TouchableOpacity
        className="absolute bottom-24 right-6 bg-primary w-16 h-16 rounded-full items-center justify-center shadow-xl"
        onPress={handleAddContact}
        activeOpacity={0.8}
      >
        <Text className="text-white text-2xl">➕</Text>
      </TouchableOpacity>
    </View>
  );
}