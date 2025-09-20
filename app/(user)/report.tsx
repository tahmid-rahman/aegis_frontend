// app/report/index.tsx
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    Platform,
    ScrollView,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useTheme } from '../../providers/ThemeProvider';

export default function ReportIncident() {
  const router = useRouter();
  const { effectiveTheme } = useTheme();
  const [incidentType, setIncidentType] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [mediaCaptured, setMediaCaptured] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const incidentTypes = [
    { id: 'harassment', label: 'Harassment', icon: '⚠️' },
    { id: 'robbery', label: 'Robbery', icon: '💰' },
    { id: 'assault', label: 'Assault', icon: '👊' },
    { id: 'stalking', label: 'Stalking', icon: '👁️' },
    { id: 'other', label: 'Other', icon: '❓' },
  ];

  const onChangeDate = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || date;
    setShowDatePicker(Platform.OS === 'ios');
    setDate(currentDate);
  };

  const showDatepicker = () => {
    setShowDatePicker(true);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleSubmit = async () => {
    if (!incidentType) {
      Alert.alert('Missing Information', 'Please select an incident type');
      return;
    }

    if (!description) {
      Alert.alert('Missing Information', 'Please provide a description of the incident');
      return;
    }

    setIsSubmitting(true);
    
    // Simulate submission process
    setTimeout(() => {
      setIsSubmitting(false);
      Alert.alert(
        'Report Submitted',
        'Your incident report has been submitted successfully. Thank you for helping make our community safer.',
        [
          {
            text: 'OK',
            onPress: () => router.back()
          }
        ]
      );
    }, 1500);
  };

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View className="px-6 pt-6 pb-4">
        <View className="flex-row items-center mb-4">
          <TouchableOpacity 
            onPress={() => router.back()}
            className="p-2 rounded-full bg-surface-variant mr-3"
          >
            <Text className="text-lg">←</Text>
          </TouchableOpacity>
          <Text className="text-headline text-on-surface">Report Incident</Text>
        </View>
        <Text className="text-body text-on-surface-variant">
          Your report helps create safer communities. All information is kept {isAnonymous ? 'anonymous' : 'confidential'}.
        </Text>
      </View>

      <ScrollView className="flex-1 px-6 mt-2" showsVerticalScrollIndicator={false}>
        {/* Incident Type Selection */}
        <View className="mb-6">
          <Text className="text-title text-on-surface mb-3">Incident Type *</Text>
          <View className="flex-row flex-wrap justify-between">
            {incidentTypes.map((type) => (
              <TouchableOpacity
                key={type.id}
                className={`w-[48%] mb-3 p-4 rounded-xl border ${
                  incidentType === type.id ? 'border-primary bg-primary/10' : 'border-outline'
                }`}
                onPress={() => setIncidentType(type.id)}
                activeOpacity={0.7}
              >
                <View className="flex-row items-center">
                  <View className={`p-2 rounded-full mr-3 ${
                    incidentType === type.id ? 'bg-primary' : 'bg-surface-container'
                  }`}>
                    <Text className="text-lg">{type.icon}</Text>
                  </View>
                  <Text className={`font-medium ${
                    incidentType === type.id ? 'text-primary' : 'text-on-surface'
                  }`}>
                    {type.label}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Date and Time */}
        <View className="mb-6">
          <Text className="text-title text-on-surface mb-3">When did it happen?</Text>
          <TouchableOpacity
            className="p-4 rounded-xl border border-outline bg-surface-variant"
            onPress={showDatepicker}
            activeOpacity={0.7}
          >
            <View className="flex-row justify-between items-center">
              <Text className="text-on-surface">{formatDate(date)}</Text>
              <Text className="text-on-surface-variant">📅</Text>
            </View>
          </TouchableOpacity>
          
          {showDatePicker && (
            <DateTimePicker
              value={date}
              mode="date"
              display="default"
              onChange={onChangeDate}
              maximumDate={new Date()}
            />
          )}
        </View>

        {/* Location */}
        <View className="mb-6">
          <Text className="text-title text-on-surface mb-3">Location (optional)</Text>
          <TextInput
            className="p-4 rounded-xl border border-outline bg-surface-variant text-on-surface"
            placeholder="Where did it happen?"
            placeholderTextColor="rgb(var(--color-on-surface-variant))"
            value={location}
            onChangeText={setLocation}
          />
        </View>

        {/* Description */}
        <View className="mb-6">
          <Text className="text-title text-on-surface mb-3">Description *</Text>
          <TextInput
            className="p-4 rounded-xl border border-outline bg-surface-variant text-on-surface h-32"
            placeholder="Please describe what happened..."
            placeholderTextColor="rgb(var(--color-on-surface-variant))"
            multiline
            textAlignVertical="top"
            value={description}
            onChangeText={setDescription}
          />
        </View>

        {/* Media Capture */}
        <View className="mb-6">
          <Text className="text-title text-on-surface mb-3">Add Evidence (optional)</Text>
          <TouchableOpacity
            className="p-4 rounded-xl border border-outline bg-surface-variant flex-row justify-between items-center"
            onPress={() => {
              setMediaCaptured(true);
              Alert.alert('Media Capture', 'Media would be captured discreetly');
            }}
            activeOpacity={0.7}
          >
            <View className="flex-row items-center">
              <View className="p-2 rounded-full bg-surface-container mr-3">
                <Text className="text-lg">📸</Text>
              </View>
              <Text className="text-on-surface">
                {mediaCaptured ? 'Media attached' : 'Take photo/audio discreetly'}
              </Text>
            </View>
            <Text className="text-on-surface-variant">→</Text>
          </TouchableOpacity>
        </View>

        {/* Anonymous Toggle */}
        <View className="mb-8">
          <View className="flex-row justify-between items-center p-4 rounded-xl bg-surface-variant">
            <View className="flex-1">
              <Text className="text-on-surface font-medium">Submit Anonymously</Text>
              <Text className="text-label text-on-surface-variant mt-1">
                Your personal information will not be shared
              </Text>
            </View>
            <Switch
              value={isAnonymous}
              onValueChange={setIsAnonymous}
              trackColor={{ false: '#767577', true: 'rgb(var(--color-primary))' }}
              thumbColor={isAnonymous ? '#f4f3f4' : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          className={`p-5 rounded-xl mb-10 ${isSubmitting ? 'bg-primary/70' : 'bg-primary'}`}
          onPress={handleSubmit}
          disabled={isSubmitting}
          activeOpacity={0.8}
        >
          <View className="flex-row justify-center items-center">
            <Text className="text-lg mr-2">{isSubmitting ? '⏳' : '🛡️'}</Text>
            <Text className="text-on-primary font-semibold">
              {isSubmitting ? 'Submitting...' : 'Submit Report'}
            </Text>
          </View>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}