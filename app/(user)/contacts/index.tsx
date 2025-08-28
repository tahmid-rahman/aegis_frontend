// app/user/contacts/index.tsx
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';

// Mock data for emergency contacts
const mockContacts = [
  {
    id: '1',
    name: 'Mom',
    phone: '+1 (555) 123-4567',
    relationship: 'Family',
    photo: '👩',
    isEmergency: true
  },
  {
    id: '2',
    name: 'Dad',
    phone: '+1 (555) 987-6543',
    relationship: 'Family',
    photo: '👨',
    isEmergency: true
  },
  {
    id: '3',
    name: 'Sarah (Sister)',
    phone: '+1 (555) 456-7890',
    relationship: 'Family',
    photo: '👧',
    isEmergency: true
  },
  {
    id: '4',
    name: 'Alex (Friend)',
    phone: '+1 (555) 234-5678',
    relationship: 'Friend',
    photo: '👦',
    isEmergency: false
  },
  {
    id: '5',
    name: 'Local Police',
    phone: '+1 (555) 911',
    relationship: 'Emergency Service',
    photo: '👮',
    isEmergency: true
  },
];

export default function ContactsScreen() {
  const router = useRouter();
  const [contacts, setContacts] = useState(mockContacts);
  const [selectedTab, setSelectedTab] = useState<'all' | 'emergency'>('emergency');

  const filteredContacts = selectedTab === 'emergency' 
    ? contacts.filter(contact => contact.isEmergency)
    : contacts;

  const handleAddContact = () => {
    Alert.alert('Add Contact', 'Choose how to add a contact:', [
      { text: 'From Phone Contacts', onPress: () => console.log('Import from phone') },
      { text: 'Manual Entry', onPress: () => router.push('/contacts/add') },
      { text: 'Cancel', style: 'cancel' }
    ]);
  };

  const handleToggleEmergency = (id: string) => {
    setContacts(contacts.map(contact => 
      contact.id === id 
        ? { ...contact, isEmergency: !contact.isEmergency } 
        : contact
    ));
  };

  const handleTestAlert = (contact: any) => {
    Alert.alert(
      'Test Alert',
      `Send a test alert to ${contact.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Send Test', 
          onPress: () => {
            Alert.alert('Success', `Test alert sent to ${contact.name}`);
          } 
        }
      ]
    );
  };

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
            Emergency ({contacts.filter(c => c.isEmergency).length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          className={`flex-1 py-3 rounded-r-xl ${selectedTab === 'all' ? 'bg-primary' : 'bg-surface-variant'}`}
          onPress={() => setSelectedTab('all')}
        >
          <Text className={`text-center font-medium ${selectedTab === 'all' ? 'text-on-primary' : 'text-on-surface'}`}>
            All Contacts
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        {/* Emergency Contact Requirements */}
        {selectedTab === 'emergency' && contacts.filter(c => c.isEmergency).length < 2 && (
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
                  <Text className="text-on-surface font-medium">{contact.name}</Text>
                  <Text className="text-on-surface-variant text-sm">{contact.phone}</Text>
                  <Text className="text-on-surface-variant text-xs">{contact.relationship}</Text>
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
                    className={`p-2 rounded-full ${contact.isEmergency ? 'bg-accent/20' : 'bg-surface'}`}
                    onPress={() => handleToggleEmergency(contact.id)}
                  >
                    <Text className={contact.isEmergency ? 'text-accent' : 'text-on-surface-variant'}>
                      {contact.isEmergency ? '🚨' : '➕'}
                    </Text>
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