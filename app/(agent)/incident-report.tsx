// app/(agent)/incident-report.tsx
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function IncidentReport() {
  const router = useRouter();
  const { emergencyId } = useLocalSearchParams();
  const [formData, setFormData] = useState({
    emergencyId: emergencyId || 'EMG-2024-0012',
    incidentType: 'harassment',
    severity: 'medium',
    location: 'Gulshan 1, Road 45, Dhaka',
    dateTime: new Date().toISOString(),
    victimCondition: 'safe',
    perpetratorInfo: '',
    actionsTaken: '',
    evidenceCollected: false,
    policeInvolved: false,
    medicalAssistance: false,
    ngoInvolved: false,
    additionalNotes: '',
    followUpRequired: false,
    followUpDetails: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState([]);

  // Mock emergency data
  const emergencyData = {
    id: emergencyId || 'EMG-2024-0012',
    type: 'harassment',
    victimInfo: {
      gender: 'Female',
      age: '25',
      isAnonymous: false
    },
    location: 'Gulshan 1, Road 45, Dhaka',
    timeReported: '14:23'
  };

  useEffect(() => {
    // Pre-fill form with emergency data
    if (emergencyData) {
      setFormData(prev => ({
        ...prev,
        emergencyId: emergencyData.id,
        incidentType: emergencyData.type,
        location: emergencyData.location
      }));
    }
  }, []);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.actionsTaken.trim()) {
      Alert.alert('Missing Information', 'Please describe the actions taken during the response.');
      return;
    }

    if (!formData.victimCondition) {
      Alert.alert('Missing Information', 'Please select the victim\'s condition.');
      return;
    }

    setIsSubmitting(true);

    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      Alert.alert(
        'Report Submitted',
        'Incident report has been successfully submitted to the control center.',
        [
          {
            text: 'Back to Dashboard',
            onPress: () => router.replace('/')
          },
          {
            text: 'View Report',
            onPress: () => console.log('View report details')
          }
        ]
      );
    }, 2000);
  };

  const handleAddPhoto = () => {
    Alert.alert(
      'Add Photo Evidence',
      'Select photo source:',
      [
        {
          text: 'Take Photo',
          onPress: () => {
            // This would open camera
            setAttachedFiles(prev => [...prev, `photo_${Date.now()}.jpg`]);
            Alert.alert('Photo Added', 'Photo evidence has been attached to the report.');
          }
        },
        {
          text: 'Choose from Gallery',
          onPress: () => {
            // This would open gallery
            setAttachedFiles(prev => [...prev, `evidence_${Date.now()}.jpg`]);
            Alert.alert('Photo Added', 'Photo evidence has been attached to the report.');
          }
        },
        {
          text: 'Cancel',
          style: 'cancel'
        }
      ]
    );
  };

  const handleAddAudio = () => {
    Alert.alert(
      'Add Audio Recording',
      'Record audio evidence:',
      [
        {
          text: 'Start Recording',
          onPress: () => {
            // This would start audio recording
            setAttachedFiles(prev => [...prev, `audio_${Date.now()}.mp3`]);
            Alert.alert('Recording Started', 'Audio recording has been started.');
          }
        },
        {
          text: 'Cancel',
          style: 'cancel'
        }
      ]
    );
  };

  const incidentTypes = [
    { id: 'harassment', label: 'Harassment', icon: '🚨' },
    { id: 'robbery', label: 'Robbery', icon: '💰' },
    { id: 'stalking', label: 'Stalking', icon: '👁️' },
    { id: 'assault', label: 'Assault', icon: '👊' },
    { id: 'other', label: 'Other', icon: '⚠️' }
  ];

  const severityLevels = [
    { id: 'low', label: 'Low', color: 'bg-green-500' },
    { id: 'medium', label: 'Medium', color: 'bg-yellow-500' },
    { id: 'high', label: 'High', color: 'bg-orange-500' },
    { id: 'critical', label: 'Critical', color: 'bg-red-500' }
  ];

  const victimConditions = [
    { id: 'safe', label: 'Safe & Stable', icon: '✅' },
    { id: 'injured', label: 'Minor Injuries', icon: '🩹' },
    { id: 'serious', label: 'Serious Injuries', icon: '🏥' },
    { id: 'traumatized', label: 'Emotional Trauma', icon: '😔' },
    { id: 'unknown', label: 'Condition Unknown', icon: '❓' }
  ];

  return (
    <View className="flex-1 bg-background">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-6 pt-6 pb-4">
          <Text className="text-headline text-on-surface">Incident Report</Text>
          <Text className="text-body text-on-surface-variant mt-2">
            Complete the report for Emergency #{formData.emergencyId}
          </Text>
        </View>

        {/* Basic Information */}
        <View className="px-6 mb-6">
          <Text className="text-title text-on-surface mb-3">Basic Information</Text>
          <View className="bg-surface-variant rounded-xl p-4 space-y-4">
            {/* Incident Type */}
            <View>
              <Text className="text-on-surface font-medium mb-2">Incident Type</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row space-x-2">
                {incidentTypes.map((type) => (
                  <TouchableOpacity
                    key={type.id}
                    className={`px-4 py-2 rounded-full flex-row items-center ${
                      formData.incidentType === type.id ? 'bg-primary' : 'bg-surface'
                    }`}
                    onPress={() => handleInputChange('incidentType', type.id)}
                  >
                    <Text className="mr-2">{type.icon}</Text>
                    <Text className={formData.incidentType === type.id ? 'text-white' : 'text-on-surface'}>
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Severity Level */}
            <View>
              <Text className="text-on-surface font-medium mb-2">Severity Level</Text>
              <View className="flex-row space-x-2">
                {severityLevels.map((level) => (
                  <TouchableOpacity
                    key={level.id}
                    className={`flex-1 py-2 rounded-lg ${level.color} ${
                      formData.severity === level.id ? 'opacity-100' : 'opacity-50'
                    }`}
                    onPress={() => handleInputChange('severity', level.id)}
                  >
                    <Text className="text-white text-center font-medium">{level.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Location */}
            <View>
              <Text className="text-on-surface font-medium mb-2">Incident Location</Text>
              <TextInput
                className="bg-surface p-3 rounded-lg text-on-surface border border-outline"
                value={formData.location}
                onChangeText={(text) => handleInputChange('location', text)}
                placeholder="Enter incident location"
              />
            </View>
          </View>
        </View>

        {/* Victim Information */}
        <View className="px-6 mb-6">
          <Text className="text-title text-on-surface mb-3">Victim Condition</Text>
          <View className="bg-surface-variant rounded-xl p-4">
            <Text className="text-on-surface font-medium mb-3">How is the victim doing?</Text>
            <View className="space-y-2">
              {victimConditions.map((condition) => (
                <TouchableOpacity
                  key={condition.id}
                  className={`flex-row items-center p-3 rounded-lg ${
                    formData.victimCondition === condition.id ? 'bg-primary/20 border border-primary' : 'bg-surface'
                  }`}
                  onPress={() => handleInputChange('victimCondition', condition.id)}
                >
                  <Text className="text-xl mr-3">{condition.icon}</Text>
                  <Text className="text-on-surface flex-1">{condition.label}</Text>
                  {formData.victimCondition === condition.id && (
                    <Text className="text-primary">✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Perpetrator Information */}
        <View className="px-6 mb-6">
          <Text className="text-title text-on-surface mb-3">Perpetrator Information</Text>
          <View className="bg-surface-variant rounded-xl p-4">
            <TextInput
              className="bg-surface p-3 rounded-lg text-on-surface border border-outline h-24"
              placeholder="Describe the perpetrator(s) if available (appearance, clothing, vehicle, etc.)"
              value={formData.perpetratorInfo}
              onChangeText={(text) => handleInputChange('perpetratorInfo', text)}
              multiline
              textAlignVertical="top"
            />
          </View>
        </View>

        {/* Actions Taken */}
        <View className="px-6 mb-6">
          <Text className="text-title text-on-surface mb-3">Actions Taken</Text>
          <View className="bg-surface-variant rounded-xl p-4">
            <Text className="text-on-surface font-medium mb-2">Describe the response actions:</Text>
            <TextInput
              className="bg-surface p-3 rounded-lg text-on-surface border border-outline h-32"
              placeholder="What actions were taken? How was the situation resolved? What assistance was provided to the victim?"
              value={formData.actionsTaken}
              onChangeText={(text) => handleInputChange('actionsTaken', text)}
              multiline
              textAlignVertical="top"
            />
          </View>
        </View>

        {/* External Services */}
        <View className="px-6 mb-6">
          <Text className="text-title text-on-surface mb-3">External Services Involved</Text>
          <View className="bg-surface-variant rounded-xl p-4 space-y-3">
            <View className="flex-row justify-between items-center">
              <View className="flex-1">
                <Text className="text-on-surface font-medium">Police Involved</Text>
                <Text className="text-label text-on-surface-variant">Law enforcement was contacted</Text>
              </View>
              <Switch
                value={formData.policeInvolved}
                onValueChange={(value) => handleInputChange('policeInvolved', value)}
                trackColor={{ false: '#767577', true: '#81b0ff' }}
                thumbColor={formData.policeInvolved ? '#f5dd4b' : '#f4f3f4'}
              />
            </View>

            <View className="flex-row justify-between items-center">
              <View className="flex-1">
                <Text className="text-on-surface font-medium">Medical Assistance</Text>
                <Text className="text-label text-on-surface-variant">Medical services were provided</Text>
              </View>
              <Switch
                value={formData.medicalAssistance}
                onValueChange={(value) => handleInputChange('medicalAssistance', value)}
                trackColor={{ false: '#767577', true: '#81b0ff' }}
                thumbColor={formData.medicalAssistance ? '#f5dd4b' : '#f4f3f4'}
              />
            </View>

            <View className="flex-row justify-between items-center">
              <View className="flex-1">
                <Text className="text-on-surface font-medium">NGO Support</Text>
                <Text className="text-label text-on-surface-variant">NGO services were involved</Text>
              </View>
              <Switch
                value={formData.ngoInvolved}
                onValueChange={(value) => handleInputChange('ngoInvolved', value)}
                trackColor={{ false: '#767577', true: '#81b0ff' }}
                thumbColor={formData.ngoInvolved ? '#f5dd4b' : '#f4f3f4'}
              />
            </View>
          </View>
        </View>

        {/* Evidence Collection */}
        <View className="px-6 mb-6">
          <Text className="text-title text-on-surface mb-3">Evidence Collection</Text>
          <View className="bg-surface-variant rounded-xl p-4">
            <View className="flex-row justify-between items-center mb-4">
              <View className="flex-1">
                <Text className="text-on-surface font-medium">Evidence Collected</Text>
                <Text className="text-label text-on-surface-variant">Photos, audio, or other evidence</Text>
              </View>
              <Switch
                value={formData.evidenceCollected}
                onValueChange={(value) => handleInputChange('evidenceCollected', value)}
                trackColor={{ false: '#767577', true: '#81b0ff' }}
                thumbColor={formData.evidenceCollected ? '#f5dd4b' : '#f4f3f4'}
              />
            </View>

            {formData.evidenceCollected && (
              <View className="space-y-3">
                <Text className="text-on-surface font-medium">Attach Evidence:</Text>
                <View className="flex-row space-x-3">
                  <TouchableOpacity
                    className="flex-1 bg-primary/20 p-3 rounded-lg items-center"
                    onPress={handleAddPhoto}
                  >
                    <Text className="text-2xl mb-1">📸</Text>
                    <Text className="text-primary text-center">Add Photos</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className="flex-1 bg-secondary/20 p-3 rounded-lg items-center"
                    onPress={handleAddAudio}
                  >
                    <Text className="text-2xl mb-1">🎵</Text>
                    <Text className="text-secondary text-center">Add Audio</Text>
                  </TouchableOpacity>
                </View>

                {attachedFiles.length > 0 && (
                  <View className="mt-3">
                    <Text className="text-on-surface font-medium mb-2">Attached Files:</Text>
                    {attachedFiles.map((file, index) => (
                      <View key={index} className="flex-row items-center bg-surface p-2 rounded-lg mb-1">
                        <Text className="text-on-surface flex-1">{file}</Text>
                        <TouchableOpacity onPress={() => setAttachedFiles(prev => prev.filter((_, i) => i !== index))}>
                          <Text className="text-red-500">Remove</Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}
          </View>
        </View>

        {/* Additional Notes */}
        <View className="px-6 mb-6">
          <Text className="text-title text-on-surface mb-3">Additional Notes</Text>
          <View className="bg-surface-variant rounded-xl p-4">
            <TextInput
              className="bg-surface p-3 rounded-lg text-on-surface border border-outline h-24"
              placeholder="Any additional information, observations, or recommendations..."
              value={formData.additionalNotes}
              onChangeText={(text) => handleInputChange('additionalNotes', text)}
              multiline
              textAlignVertical="top"
            />
          </View>
        </View>

        {/* Follow-up Required */}
        <View className="px-6 mb-8">
          <Text className="text-title text-on-surface mb-3">Follow-up Required</Text>
          <View className="bg-surface-variant rounded-xl p-4">
            <View className="flex-row justify-between items-center mb-4">
              <View className="flex-1">
                <Text className="text-on-surface font-medium">Follow-up Needed</Text>
                <Text className="text-label text-on-surface-variant">This case requires additional follow-up</Text>
              </View>
              <Switch
                value={formData.followUpRequired}
                onValueChange={(value) => handleInputChange('followUpRequired', value)}
                trackColor={{ false: '#767577', true: '#81b0ff' }}
                thumbColor={formData.followUpRequired ? '#f5dd4b' : '#f4f3f4'}
              />
            </View>

            {formData.followUpRequired && (
              <TextInput
                className="bg-surface p-3 rounded-lg text-on-surface border border-outline h-20"
                placeholder="Describe what follow-up actions are needed..."
                value={formData.followUpDetails}
                onChangeText={(text) => handleInputChange('followUpDetails', text)}
                multiline
                textAlignVertical="top"
              />
            )}
          </View>
        </View>

        {/* Submit Button */}
        <View className="px-6 mb-10">
          <TouchableOpacity
            className={`py-4 rounded-xl ${isSubmitting ? 'bg-primary/70' : 'bg-primary'}`}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            <Text className="text-white text-center font-semibold text-lg">
              {isSubmitting ? 'Submitting Report...' : 'Submit Incident Report'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}