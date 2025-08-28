import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { FlatList, Modal, Text, TouchableOpacity, View } from 'react-native';

interface Contact {
  id: string;
  name: string;
  phone: string;
  relationship: string;
}

interface EmergencyContactsModalProps {
  visible: boolean;
  onClose: () => void;
  language: 'en' | 'bn';
}

const EmergencyContactsModal: React.FC<EmergencyContactsModalProps> = ({ 
  visible, 
  onClose, 
  language 
}) => {
  const contacts: Contact[] = [
    { id: '1', name: 'Rahim Khan', phone: '+8801712345678', relationship: 'Brother' },
    { id: '2', name: 'NGO HelpLine', phone: '+8801998877665', relationship: 'Support' },
    { id: '3', name: 'Police', phone: '999', relationship: 'Emergency' },
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50 justify-end">
        <View className="bg-surface rounded-t-3xl p-6 max-h-[70%]">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-title text-on-surface">
              {language === 'en' ? 'Emergency Contacts' : 'জরুরী পরিচিতি'}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialIcons name="close" size={24} color="#EC407A" />
            </TouchableOpacity>
          </View>

          <FlatList
            data={contacts}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View className="bg-surface-variant rounded-xl p-4 mb-3">
                <Text className="text-on-surface font-medium">{item.name}</Text>
                <Text className="text-on-surface-variant mt-1">{item.phone}</Text>
                <Text className="text-caption text-on-surface-variant mt-1">
                  {language === 'en' 
                    ? `Relationship: ${item.relationship}`
                    : `সম্পর্ক: ${item.relationship === 'Brother' ? 'ভাই' : 
                       item.relationship === 'Support' ? 'সাহায্য' : 'জরুরী'}`}
                </Text>
              </View>
            )}
          />

          <TouchableOpacity 
            className="bg-primary py-3 rounded-xl mt-4"
            activeOpacity={0.8}
          >
            <Text className="text-on-primary text-center font-bold">
              {language === 'en' ? 'Add New Contact' : 'নতুন পরিচিতি যোগ করুন'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default EmergencyContactsModal;