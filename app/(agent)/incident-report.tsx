// app/(agent)/incident-report.tsx
import { Audio } from 'expo-av';
import { CameraType, CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useAuth } from '../../providers/AuthProvider';
import { api } from '../../services/api';

interface FormData {
  alert_id: string;
  incident_type: string;
  severity: string;
  location: string;
  victim_condition: string;
  victim_gender: string;
  victim_age: string;
  is_anonymous: boolean;
  perpetrator_info: string;
  actions_taken: string;
  police_involved: boolean;
  medical_assistance: boolean;
  ngo_involved: boolean;
  evidence_collected: boolean;
  additional_notes: string;
  follow_up_required: boolean;
  follow_up_details: string;
  status: string;
}

interface EvidenceFile {
  uri: string;
  name: string;
  type: string;
}

export default function IncidentReport() {
  const router = useRouter();
  const { alertId } = useLocalSearchParams();
  const { user } = useAuth();
  
  const [formData, setFormData] = useState<FormData>({
    alert_id: alertId as string,
    incident_type: 'harassment',
    severity: 'medium',
    location: '',
    victim_condition: '',
    victim_gender: '',
    victim_age: '',
    is_anonymous: false,
    perpetrator_info: '',
    actions_taken: '',
    police_involved: false,
    medical_assistance: false,
    ngo_involved: false,
    evidence_collected: false,
    additional_notes: '',
    follow_up_required: false,
    follow_up_details: '',
    status: 'draft'
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<EvidenceFile[]>([]);
  
  // Camera states
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [showCamera, setShowCamera] = useState(false);
  const [cameraType, setCameraType] = useState<CameraType>('back');
  const cameraRef = useRef<CameraView>(null);
  
  // Audio recording states
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [audioPermission, setAudioPermission] = useState(false);

  useEffect(() => {
    console.log('Received alertId:', alertId);
    requestPermissions();
    
    // Initialize with the alertId
    if (alertId) {
      setFormData(prev => ({
        ...prev,
        alert_id: alertId as string,
        location: 'Location not specified'
      }));
    }
  }, [alertId]);

  const requestPermissions = async () => {
    try {
      await requestCameraPermission();
      const { status: audioStatus } = await Audio.requestPermissionsAsync();
      setAudioPermission(audioStatus === 'granted');
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    } catch (error) {
      console.error('Error requesting permissions:', error);
    }
  };

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Photo Capture Functions
  const takePhoto = async () => {
    if (!cameraPermission?.granted) {
      Alert.alert('Permission Required', 'Camera permission is required to take photos');
      return;
    }
    setShowCamera(true);
  };

  const capturePhoto = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          exif: true
        });
        
        if (photo) {
          const fileName = `photo_${Date.now()}.jpg`;
          const evidenceFile: EvidenceFile = {
            uri: photo.uri,
            name: fileName,
            type: 'image/jpeg'
          };
          setAttachedFiles(prev => [...prev, evidenceFile]);
          Alert.alert('Success', 'Photo captured and added to evidence');
        }
      } catch (error) {
        console.error('Error capturing photo:', error);
        Alert.alert('Error', 'Failed to capture photo');
      } finally {
        setShowCamera(false);
      }
    }
  };

  const pickImageFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const fileName = `gallery_${Date.now()}.jpg`;
        const evidenceFile: EvidenceFile = {
          uri: asset.uri,
          name: fileName,
          type: 'image/jpeg'
        };
        setAttachedFiles(prev => [...prev, evidenceFile]);
        Alert.alert('Success', 'Photo added from gallery');
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image from gallery');
    }
  };

  // Audio Recording Functions
  const startAudioRecording = async () => {
    try {
      if (!audioPermission) {
        Alert.alert('Permission Required', 'Audio recording permission is required');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(newRecording);
      setIsRecording(true);
      Alert.alert('Recording Started', 'Audio recording is in progress...');
    } catch (error) {
      console.error('Error starting recording:', error);
      Alert.alert('Error', 'Failed to start audio recording');
    }
  };

  const stopAudioRecording = async () => {
    try {
      if (recording) {
        await recording.stopAndUnloadAsync();
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
        });

        const uri = recording.getURI();
        if (uri) {
          const fileName = `audio_${Date.now()}.m4a`;
          const evidenceFile: EvidenceFile = {
            uri: uri,
            name: fileName,
            type: 'audio/m4a'
          };
          setAttachedFiles(prev => [...prev, evidenceFile]);
          Alert.alert('Recording Saved', 'Audio recording has been saved as evidence');
        }

        setRecording(null);
        setIsRecording(false);
      }
    } catch (error) {
      console.error('Error stopping recording:', error);
      Alert.alert('Error', 'Failed to stop audio recording');
    }
  };

  const handleAddPhoto = () => {
    Alert.alert(
      'Add Photo Evidence',
      'Select photo source:',
      [
        {
          text: 'Take Photo',
          onPress: takePhoto,
        },
        {
          text: 'Choose from Gallery',
          onPress: pickImageFromGallery,
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const handleAddAudio = () => {
    if (isRecording) {
      Alert.alert(
        'Stop Recording',
        'Do you want to stop the current recording?',
        [
          {
            text: 'Stop Recording',
            onPress: stopAudioRecording,
          },
          {
            text: 'Continue Recording',
            style: 'cancel',
          },
        ]
      );
    } else {
      Alert.alert(
        'Add Audio Evidence',
        'Record audio evidence:',
        [
          {
            text: 'Start Recording',
            onPress: startAudioRecording,
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ]
      );
    }
  };

  const removeEvidenceFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadEvidence = async (reportId: number, files: EvidenceFile[]) => {
    try {
      const uploadPromises = files.map(async (file) => {
        const formData = new FormData();
        formData.append('report', reportId.toString());
        
        const fileType = file.type.startsWith('image/') ? 'image' : 'audio';
        formData.append('file_type', fileType);
        
        formData.append('file', {
          uri: file.uri,
          name: file.name,
          type: file.type,
        } as any);

        console.log('Uploading evidence file:', file.name);
        const response = await api.post('/aegis/emergency-response/report-evidence/', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        
        return response.data;
      });

      const results = await Promise.all(uploadPromises);
      console.log('Evidence upload results:', results);
      return results.filter(result => result !== null);
    } catch (error) {
      console.error('Error uploading evidence:', error);
      throw error;
    }
  };

  const handleSubmit = async () => {
    if (!formData.actions_taken.trim()) {
      Alert.alert('Missing Information', 'Please describe the actions taken during the response.');
      return;
    }

    if (!formData.victim_condition) {
      Alert.alert('Missing Information', 'Please select the victim\'s condition.');
      return;
    }

    if (!formData.location.trim()) {
      Alert.alert('Missing Information', 'Please provide the incident location.');
      return;
    }

    if (!formData.alert_id) {
      Alert.alert('Missing Information', 'Emergency reference is missing.');
      return;
    }

    setIsSubmitting(true);

    try {
      console.log('Submitting incident report for alertId:', alertId);

      const submitData = {
        alert_id: formData.alert_id,
        incident_type: formData.incident_type,
        severity: formData.severity,
        location: formData.location,
        victim_condition: formData.victim_condition,
        victim_gender: formData.victim_gender,
        victim_age: formData.victim_age ? parseInt(formData.victim_age) : null,
        is_anonymous: formData.is_anonymous,
        perpetrator_info: formData.perpetrator_info,
        actions_taken: formData.actions_taken,
        police_involved: formData.police_involved,
        medical_assistance: formData.medical_assistance,
        ngo_involved: formData.ngo_involved,
        evidence_collected: attachedFiles.length > 0,
        additional_notes: formData.additional_notes,
        follow_up_required: formData.follow_up_required,
        follow_up_details: formData.follow_up_details,
        status: 'draft'
      };

      // Step 1: Create the incident report
      const createResponse = await api.post('/aegis/emergency-response/incident-reports/', submitData);
      
      if (createResponse.data.success) {
        const reportId = createResponse.data.data.id;
        console.log('Report created successfully with ID:', reportId);

        // Step 2: Upload evidence files if any
        if (attachedFiles.length > 0) {
          console.log('Uploading', attachedFiles.length, 'evidence files...');
          await uploadEvidence(reportId, attachedFiles);
        }

        // Step 3: Submit the report
        console.log('Submitting report for approval...');
        const submitResponse = await api.post(`/aegis/emergency-response/incident-reports/${reportId}/submit/`);
        
        if (submitResponse.data.success) {
          Alert.alert(
            'Report Submitted Successfully!',
            'Your incident report has been submitted and is awaiting approval.',
            [
              {
                text: 'Back to Dashboard',
                onPress: () => router.replace('/(agent)'),
              },
              // {
              //   text: 'View Details',
              //   onPress: () => {
              //     router.push(`/(agent)/incident-reports/${reportId}`);
              //   },
              // },
            ]
          );
        } else {
          throw new Error('Failed to submit report for approval');
        }
      } else {
        throw new Error(createResponse.data.error || 'Failed to create report');
      }
    } catch (error: any) {
      console.error('Error in handleSubmit:', error);
      console.error('Error response:', error.response?.data);
      
      let errorMessage = 'Failed to submit incident report. Please try again.';
      
      if (error.response?.data) {
        if (error.response.data.details) {
          errorMessage = `Validation Error: ${JSON.stringify(error.response.data.details)}`;
        } else if (error.response.data.error) {
          errorMessage = error.response.data.error;
        } else if (typeof error.response.data === 'object') {
          errorMessage = JSON.stringify(error.response.data);
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Submission Failed', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveDraft = async () => {
    try {
      setIsSubmitting(true);
      
      const draftData = {
        alert_id: formData.alert_id,
        incident_type: formData.incident_type,
        severity: formData.severity,
        location: formData.location,
        victim_condition: formData.victim_condition,
        victim_gender: formData.victim_gender,
        victim_age: formData.victim_age ? parseInt(formData.victim_age) : null,
        is_anonymous: formData.is_anonymous,
        perpetrator_info: formData.perpetrator_info,
        actions_taken: formData.actions_taken,
        police_involved: formData.police_involved,
        medical_assistance: formData.medical_assistance,
        ngo_involved: formData.ngo_involved,
        evidence_collected: attachedFiles.length > 0,
        additional_notes: formData.additional_notes,
        follow_up_required: formData.follow_up_required,
        follow_up_details: formData.follow_up_details,
        status: 'draft'
      };

      console.log('Saving draft for alertId:', alertId);
      const response = await api.post('/aegis/emergency-response/incident-reports/', draftData);

      if (response.data.success) {
        Alert.alert(
          'Draft Saved', 
          'Your incident report has been saved as draft. You can complete and submit it later.',
          [{ text: 'OK', onPress: () => router.back() }]
        );
      } else {
        throw new Error(response.data.error || 'Failed to save draft');
      }
    } catch (error: any) {
      console.error('Error saving draft:', error);
      Alert.alert(
        'Error', 
        error.response?.data?.error || error.message || 'Failed to save draft. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Camera Component
  const CameraComponent = () => {
    if (!showCamera) return null;

    return (
      <View className="absolute inset-0 z-50 bg-black">
        <CameraView 
          ref={cameraRef}
          style={{ flex: 1 }}
          facing={cameraType}
        >
          <View className="flex-1 bg-transparent flex-row">
            <View className="flex-1 justify-end pb-8 px-6">
              <View className="flex-row justify-between items-center">
                <TouchableOpacity
                  className="p-4"
                  onPress={() => setShowCamera(false)}
                >
                  <Text className="text-white text-lg">Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  className="w-16 h-16 rounded-full bg-white border-4 border-gray-300"
                  onPress={capturePhoto}
                />
                
                <TouchableOpacity
                  className="p-4"
                  onPress={() => setCameraType(
                    cameraType === 'back' ? 'front' : 'back'
                  )}
                >
                  <Text className="text-white text-lg">Flip</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </CameraView>
      </View>
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
            Complete the report for Alert #{alertId}
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
                      formData.incident_type === type.id ? 'bg-primary' : 'bg-surface'
                    }`}
                    onPress={() => handleInputChange('incident_type', type.id)}
                  >
                    <Text className="mr-2">{type.icon}</Text>
                    <Text className={formData.incident_type === type.id ? 'text-white' : 'text-on-surface'}>
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

            {/* Victim Information */}
            <View className="space-y-3">
              <Text className="text-on-surface font-medium">Victim Information</Text>
              
              <View className="flex-row space-x-3">
                <View className="flex-1">
                  <Text className="text-on-surface-variant text-sm mb-1">Gender</Text>
                  <TextInput
                    className="bg-surface p-3 rounded-lg text-on-surface border border-outline"
                    value={formData.victim_gender}
                    onChangeText={(text) => handleInputChange('victim_gender', text)}
                    placeholder="Gender"
                  />
                </View>
                
                <View className="flex-1">
                  <Text className="text-on-surface-variant text-sm mb-1">Age</Text>
                  <TextInput
                    className="bg-surface p-3 rounded-lg text-on-surface border border-outline"
                    value={formData.victim_age}
                    onChangeText={(text) => handleInputChange('victim_age', text)}
                    placeholder="Age"
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View className="flex-row justify-between items-center">
                <Text className="text-on-surface">Report Anonymously</Text>
                <Switch
                  value={formData.is_anonymous}
                  onValueChange={(value) => handleInputChange('is_anonymous', value)}
                />
              </View>
            </View>
          </View>
        </View>

        {/* Victim Condition */}
        <View className="px-6 mb-6">
          <Text className="text-title text-on-surface mb-3">Victim Condition</Text>
          <View className="bg-surface-variant rounded-xl p-4">
            <Text className="text-on-surface font-medium mb-3">How is the victim doing?</Text>
            <View className="space-y-2">
              {victimConditions.map((condition) => (
                <TouchableOpacity
                  key={condition.id}
                  className={`flex-row items-center p-3 rounded-lg ${
                    formData.victim_condition === condition.id ? 'bg-primary/20 border border-primary' : 'bg-surface'
                  }`}
                  onPress={() => handleInputChange('victim_condition', condition.id)}
                >
                  <Text className="text-xl mr-3">{condition.icon}</Text>
                  <Text className="text-on-surface flex-1">{condition.label}</Text>
                  {formData.victim_condition === condition.id && (
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
              value={formData.perpetrator_info}
              onChangeText={(text) => handleInputChange('perpetrator_info', text)}
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
              value={formData.actions_taken}
              onChangeText={(text) => handleInputChange('actions_taken', text)}
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
                value={formData.police_involved}
                onValueChange={(value) => handleInputChange('police_involved', value)}
              />
            </View>

            <View className="flex-row justify-between items-center">
              <View className="flex-1">
                <Text className="text-on-surface font-medium">Medical Assistance</Text>
                <Text className="text-label text-on-surface-variant">Medical services were provided</Text>
              </View>
              <Switch
                value={formData.medical_assistance}
                onValueChange={(value) => handleInputChange('medical_assistance', value)}
              />
            </View>

            <View className="flex-row justify-between items-center">
              <View className="flex-1">
                <Text className="text-on-surface font-medium">NGO Support</Text>
                <Text className="text-label text-on-surface-variant">NGO services were involved</Text>
              </View>
              <Switch
                value={formData.ngo_involved}
                onValueChange={(value) => handleInputChange('ngo_involved', value)}
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
                value={formData.evidence_collected}
                onValueChange={(value) => handleInputChange('evidence_collected', value)}
              />
            </View>

            {(formData.evidence_collected || attachedFiles.length > 0) && (
              <View className="space-y-3">
                <Text className="text-on-surface font-medium">Attach Evidence:</Text>
                
                <View className="flex-row space-x-3">
                  <TouchableOpacity
                    className="flex-1 bg-primary/20 p-3 rounded-lg items-center"
                    onPress={handleAddPhoto}
                  >
                    <Text className="text-2xl mb-1">📸</Text>
                    <Text className="text-primary text-center font-medium">
                      Add Photos
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    className={`flex-1 p-3 rounded-lg items-center ${
                      isRecording ? 'bg-red-500/20' : 'bg-secondary/20'
                    }`}
                    onPress={handleAddAudio}
                  >
                    <Text className="text-2xl mb-1">{isRecording ? '🔴' : '🎵'}</Text>
                    <Text className={`text-center font-medium ${
                      isRecording ? 'text-red-500' : 'text-secondary'
                    }`}>
                      {isRecording ? 'Stop Audio' : 'Add Audio'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {attachedFiles.length > 0 && (
                  <View className="mt-3">
                    <Text className="text-on-surface font-medium mb-2">Attached Files:</Text>
                    {attachedFiles.map((file, index) => (
                      <View key={index} className="flex-row items-center bg-surface p-3 rounded-lg mb-2">
                        {file.type.startsWith('image/') ? (
                          <Image 
                            source={{ uri: file.uri }} 
                            className="w-12 h-12 rounded-lg mr-3"
                          />
                        ) : (
                          <View className="w-12 h-12 bg-blue-100 rounded-lg mr-3 justify-center items-center">
                            <Text className="text-2xl">🎵</Text>
                          </View>
                        )}
                        <View className="flex-1">
                          <Text className="text-on-surface font-medium" numberOfLines={1}>
                            {file.name}
                          </Text>
                          <Text className="text-on-surface-variant text-sm">
                            {file.type.startsWith('image/') ? 'Photo' : 'Audio Recording'}
                          </Text>
                        </View>
                        <TouchableOpacity 
                          onPress={() => removeEvidenceFile(index)}
                          className="p-2"
                        >
                          <Text className="text-red-500 font-medium">Remove</Text>
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
              value={formData.additional_notes}
              onChangeText={(text) => handleInputChange('additional_notes', text)}
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
                value={formData.follow_up_required}
                onValueChange={(value) => handleInputChange('follow_up_required', value)}
              />
            </View>

            {formData.follow_up_required && (
              <TextInput
                className="bg-surface p-3 rounded-lg text-on-surface border border-outline h-20"
                placeholder="Describe what follow-up actions are needed..."
                value={formData.follow_up_details}
                onChangeText={(text) => handleInputChange('follow_up_details', text)}
                multiline
                textAlignVertical="top"
              />
            )}
          </View>
        </View>

        {/* Action Buttons */}
        <View className="px-6 mb-10 space-y-3">
          <TouchableOpacity
            className={`py-4 rounded-xl ${isSubmitting ? 'bg-primary/70' : 'bg-primary'}`}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <View className="flex-row justify-center items-center">
                <ActivityIndicator color="white" size="small" />
                <Text className="text-white ml-2 font-semibold text-lg">Submitting...</Text>
              </View>
            ) : (
              <Text className="text-white text-center font-semibold text-lg">
                Submit Incident Report
              </Text>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity
            className="py-4 rounded-xl border border-primary"
            onPress={handleSaveDraft}
            disabled={isSubmitting}
          >
            <Text className="text-primary text-center font-semibold text-lg">
              Save as Draft
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Camera Overlay */}
      <CameraComponent />
    </View>
  );
}