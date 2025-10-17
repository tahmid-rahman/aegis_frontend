// app/user/report.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Audio } from 'expo-av';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  ScrollView,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useTheme } from '../../providers/ThemeProvider';
import { api } from '../../services/api';

export default function ReportIncident() {
  const router = useRouter();
  const { effectiveTheme } = useTheme();

  // Form state
  const [incidentType, setIncidentType] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [mediaCaptured, setMediaCaptured] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  // Camera
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<any>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  // Audio
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [audioUri, setAudioUri] = useState<string | null>(null);

  const incidentTypes = [
    { id: 'harassment', label: 'Harassment', icon: '⚠️' },
    { id: 'robbery', label: 'Robbery', icon: '💰' },
    { id: 'assault', label: 'Assault', icon: '👊' },
    { id: 'stalking', label: 'Stalking', icon: '👁️' },
    { id: 'theft', label: 'Theft', icon: '📱' },
    { id: 'vandalism', label: 'Vandalism', icon: '🏚️' },
    { id: 'other', label: 'Other', icon: '❓' },
  ];

  // ===== Location =====
  const getCurrentLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is required.');
        return;
      }

      let loc = await Location.getCurrentPositionAsync({});
      setCurrentLocation({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });

      let [address] = await Location.reverseGeocodeAsync({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });

      if (address) {
        const addressString = `${address.street || ''} ${address.city || ''} ${address.region || ''} ${address.postalCode || ''}`.trim();
        setLocation(addressString || 'Current Location');
      }
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Failed to get current location.');
    }
  };

  // ===== Date =====
  const onChangeDate = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || date;
    setShowDatePicker(Platform.OS === 'ios');
    setDate(currentDate);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // ===== Submit =====
  const handleSubmit = async () => {
    if (!incidentType) {
      Alert.alert('Missing Information', 'Please select an incident type');
      return;
    }
    if (!description) {
      Alert.alert('Missing Information', 'Please provide a description');
      return;
    }

    setIsSubmitting(true);

    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (!token) throw new Error('No authentication token found');

      api.defaults.headers.Authorization = `Token ${token}`;

      // 1. Submit incident report
      const reportData = {
        incident_type: incidentType,
        title: `${incidentTypes.find((t) => t.id === incidentType)?.label} Incident`,
        description,
        location,
        incident_date: date.toISOString(),
        latitude: currentLocation?.latitude || null,
        longitude: currentLocation?.longitude || null,
        is_anonymous: isAnonymous,
      };

      const res = await api.post('/aegis/reports/submit/', reportData);
      const incidentId = res.data.id;

      // 2. Upload photo if exists
      if (photoUri) {
        const formData = new FormData();
        formData.append('media_type', 'photo');
        formData.append('file', {
          uri: photoUri,
          name: 'incident_photo.jpg',
          type: 'image/jpeg',
        } as any);
        await api.post(`/aegis/reports/${incidentId}/media/`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      // 3. Upload audio if exists
      if (audioUri) {
        const formData = new FormData();
        formData.append('media_type', 'audio');
        formData.append('file', {
          uri: audioUri,
          name: 'incident_audio.m4a',
          type: 'audio/m4a',
        } as any);
        await api.post(`/aegis/reports/${incidentId}/media/`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }


      // 4. Done
      Alert.alert('Report Submitted', 'Your incident report has been submitted with media.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error: any) {
      console.error('Error submitting report:', error);
      let errorMessage = 'Failed to submit report. Please try again.';
      if (error.response?.data) {
        errorMessage =
          typeof error.response.data === 'object'
            ? Object.values(error.response.data).flat().join('\n')
            : error.response.data;
      }
      Alert.alert('Submission Error', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ===== Media Capture =====
  const takePhoto = async () => {
    if (!permission?.granted) {
      const { granted } = await requestPermission();
      if (!granted) {
        Alert.alert('Permission denied', 'Camera access required');
        return;
      }
    }
    setShowCamera(true);
  };

  const capturePhoto = async () => {
    if (cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync();
      setPhotoUri(photo.uri);
      setMediaCaptured(true);
      setShowCamera(false);
      Alert.alert('Photo Captured', 'Photo has been captured successfully.');
    }
  };

  const recordAudio = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Audio recording required');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(recording);
      Alert.alert('Recording started', 'Tap stop to end recording.');
    } catch (err) {
      console.error('Error recording audio', err);
      Alert.alert('Error', 'Could not start audio recording.');
    }
  };

  const stopRecording = async () => {
    if (!recording) return;
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setAudioUri(uri || null);
      setRecording(null);
      setMediaCaptured(true);
    } catch (err) {
      console.error('Error stopping recording', err);
      Alert.alert('Error', 'Could not stop audio recording.');
    }
  };

  const captureMedia = () => {
    Alert.alert('Media Capture', 'Choose an option:', [
      { text: 'Take Photo', onPress: takePhoto },
      { text: 'Record Audio', onPress: recordAudio },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  return (
    <View className="flex-1 bg-background">
      {/* Camera Modal */}
      <Modal visible={showCamera} animationType="slide">
        <CameraView style={{ flex: 1 }} ref={cameraRef}>
          <View style={{ flex: 1, justifyContent: 'flex-end', marginBottom: 40, alignItems: 'center' }}>
            <TouchableOpacity
              onPress={capturePhoto}
              style={{ width: 70, height: 70, borderRadius: 35, backgroundColor: 'white' }}
            />
            <TouchableOpacity onPress={() => setShowCamera(false)} style={{ marginTop: 20 }}>
              <Text className="text-on-primary">Cancel</Text>
            </TouchableOpacity>
          </View>
        </CameraView>
      </Modal>

      {/* Header */}
      <View className="px-6 pt-6 pb-4">
        <View className="flex-row items-center mb-4">
          <TouchableOpacity onPress={() => router.back()} className="p-2 rounded-full bg-surface-variant mr-3">
            <Text className="text-lg text-on-surface">←</Text>
          </TouchableOpacity>
          <Text className="text-headline text-on-surface">Report Incident</Text>
        </View>
      </View>

      <ScrollView className="flex-1 px-6 mt-2" showsVerticalScrollIndicator={false}>
        {/* Incident Type */}
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
              >
                <Text className="text-on-surface">{type.icon} {type.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Date */}
        <View className="mb-6">
          <Text className="text-on-surface mb-3">When did it happen? *</Text>
          <TouchableOpacity
            className="p-4 rounded-xl border border-outline bg-surface-variant"
            onPress={() => setShowDatePicker(true)}
          >
            <Text className="text-on-surface-variant">{formatDate(date)} 📅</Text>
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
          <Text className="text-on-surface mb-3">Location</Text>
          <TextInput
            className="p-4 rounded-xl border border-outline bg-surface-variant mb-3 text-on-surface placeholder:text-placeholder"
            value={location}
            onChangeText={setLocation}
            placeholder="Where did it happen?"
            placeholderTextColor="rgb(var(--color-placeholder))"
          />
          <TouchableOpacity
            className="p-3 rounded-xl border border-primary bg-primary/5"
            onPress={getCurrentLocation}
          >
            <Text className="text-on-surface">📍 Use Current Location</Text>
          </TouchableOpacity>
        </View>

        {/* Description */}
        <View className="mb-6">
          <Text className="text-on-surface mb-3">Description *</Text>
          <TextInput
            className="p-4 rounded-xl border border-outline bg-surface-variant h-32 text-on-surface placeholder:text-placeholder"
            multiline
            textAlignVertical="top"
            value={description}
            onChangeText={setDescription}
            placeholder="Describe what happened..."
            placeholderTextColor="rgb(var(--color-placeholder))"
          />
        </View>

        {/* Media */}
        <View className="mb-6">
          <Text className="text-on-surface mb-3">Add Evidence (optional)</Text>
          <TouchableOpacity
            className="p-4 rounded-xl border border-outline bg-surface-variant"
            onPress={captureMedia}
          >
            <Text className="text-on-surface-variant">
              {mediaCaptured ? '📎 Media attached' : '📸 Take photo / 🎙️ Record audio'}
            </Text>
          </TouchableOpacity>
          {recording && (
            <TouchableOpacity className="mt-3 p-3 bg-red-500 rounded-xl" onPress={stopRecording}>
              <Text className="text-on-primary">Stop Recording</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Anonymous */}
        <View className="mb-8 flex-row justify-between items-center p-4 rounded-xl bg-surface-variant">
          <Text className="text-on-surface">Submit Anonymously</Text>
          <Switch value={isAnonymous} onValueChange={setIsAnonymous} />
        </View>

        {/* Submit */}
        <TouchableOpacity
          className={`p-5 rounded-xl mb-10 ${isSubmitting ? 'bg-primary/70' : 'bg-primary'}`}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          <View className="flex-row justify-center items-center">
            {isSubmitting ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-on-primary">🛡️ Submit Report</Text>
            )}
          </View>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
