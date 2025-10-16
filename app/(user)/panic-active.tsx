// app/user/panic-active.tsx
import { Audio } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { api } from '../../services/api';

// Pre-set security PIN
const EMERGENCY_DEACTIVATION_PIN = "2580";

// Types
interface Responder {
  id: string;
  name: string;
  status: string;
  eta: string;
  eta_minutes?: number;
  responder_type?: string;
}

interface EmergencyAlert {
  alert_id: string;
  status: string;
  activated_at: string;
  responders_count: number;
  fake_screen_active: boolean;
  deactivation_attempts: number;
  initial_address?: string;
  emergency_type?: string;
}

interface LocationUpdate {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: string;
}

interface MediaCapture {
  id: number;
  media_type: string;
  captured_at: string;
  file_size?: number;
  duration?: number;
}

interface UploadQueueItem {
  id: string;
  mediaType: 'audio' | 'photo' | 'video';
  fileUri: string;
  duration?: number;
  retries: number;
  timestamp: number;
}

// Utility function to fix decimal precision
const fixDecimalPrecision = (value: number, decimalPlaces: number = 6): number => {
  return parseFloat(value.toFixed(decimalPlaces));
};

export default function PanicActive() {
  const router = useRouter();
  const [timeActive, setTimeActive] = useState(0);
  const [showFakeScreen, setShowFakeScreen] = useState(true);
  const [pinInput, setPinInput] = useState("");
  const [incorrectAttempts, setIncorrectAttempts] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [currentAlert, setCurrentAlert] = useState<EmergencyAlert | null>(null);
  const [responders, setResponders] = useState<Responder[]>([]);
  const [locationUpdates, setLocationUpdates] = useState<LocationUpdate[]>([]);
  const [mediaCaptures, setMediaCaptures] = useState<MediaCapture[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLocationPermission, setHasLocationPermission] = useState(false);
  const [hasAudioPermission, setHasAudioPermission] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState(false);
  const [uploadQueue, setUploadQueue] = useState<UploadQueueItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [systemStatus, setSystemStatus] = useState<string>('Initializing...');
  
  // Refs with proper TypeScript types
  const mediaRecorderRef = useRef<Audio.Recording | null>(null);
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const locationWatchRef = useRef<Location.LocationSubscription | null>(null);
  const audioUploadIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const uploadProcessorRef = useRef<NodeJS.Timeout | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const currentAlertRef = useRef<EmergencyAlert | null>(null);

  // Sync ref with state
  useEffect(() => {
    currentAlertRef.current = currentAlert;
  }, [currentAlert]);

  // Emergency data from API
  const emergencyData = {
    alertId: currentAlert?.alert_id || 'EMG-LOADING',
    timestamp: currentAlert?.activated_at || new Date().toISOString(),
    status: currentAlert?.status || 'activating',
    responders: responders,
    contactsNotified: 3,
    location: locationUpdates[0] || null
  };

  // Block hardware back button during emergency
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      Alert.alert(
        "Emergency Active",
        "Cannot go back during emergency. Use the stop button to cancel.",
        [{ text: "OK" }]
      );
      return true;
    });

    return () => backHandler.remove();
  }, []);

  // Initialize emergency when component mounts
  useEffect(() => {
    initializeEmergency();
    
    return () => {
      cleanupEmergency();
    };
  }, []);

  // Process upload queue
  useEffect(() => {
    if (uploadQueue.length > 0 && !isUploading) {
      processUploadQueue();
    }
  }, [uploadQueue, isUploading]);

  // Start timer when emergency is active
  useEffect(() => {
    if (currentAlert?.status === 'active') {
      timerRef.current = setInterval(() => {
        setTimeActive(prev => prev + 1);
      }, 1000) as unknown as NodeJS.Timeout;
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [currentAlert]);

  const initializeEmergency = async () => {
    setIsLoading(true);
    setSystemStatus('Requesting permissions...');
    
    try {
      // Step 1: Request and ensure all permissions are granted
      const permissions = await ensureAllPermissions();
      
      // Step 2: Activate emergency with available permissions
      const alertData = await activateEmergency(permissions);
      
      // Step 3: Start all automated systems with the alert data
      await startAutomatedSystems(permissions, alertData);
      
    } catch (error: any) {
      console.error('Error initializing emergency:', error);
      Alert.alert(
        'Emergency Activation Failed', 
        'Could not start emergency systems. Please try again or call emergency services directly.',
        [{ text: 'OK', onPress: () => router.replace('/') }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const ensureAllPermissions = async (): Promise<{
    location: boolean;
    audio: boolean;
    camera: boolean;
  }> => {
    setSystemStatus('Checking permissions...');
    
    let retryCount = 0;
    const maxRetries = 3;

    while (retryCount < maxRetries) {
      try {
        console.log(`🔄 Permission check attempt ${retryCount + 1}`);
        
        // Request all permissions
        const [locationStatus, audioStatus, cameraStatus] = await Promise.all([
          Location.requestForegroundPermissionsAsync(),
          Audio.requestPermissionsAsync(),
          ImagePicker.requestCameraPermissionsAsync(),
        ]);

        const permissions = {
          location: locationStatus.status === 'granted',
          audio: audioStatus.status === 'granted',
          camera: cameraStatus.status === 'granted',
        };

        console.log('✅ Permissions status:', permissions);

        // Update state
        setHasLocationPermission(permissions.location);
        setHasAudioPermission(permissions.audio);
        setHasCameraPermission(permissions.camera);

        // If we have at least one critical permission, proceed
        if (permissions.location || permissions.audio || permissions.camera) {
          return permissions;
        }

        // If no permissions granted, ask user to enable them
        if (retryCount === maxRetries - 1) {
          const shouldContinue = await new Promise<boolean>((resolve) => {
            Alert.alert(
              'Permissions Required',
              'Emergency features need access to location, microphone, and camera to provide maximum protection. Continue with limited functionality?',
              [
                { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
                { text: 'Continue', onPress: () => resolve(true) }
              ]
            );
          });
          
          if (shouldContinue) {
            return permissions;
          } else {
            throw new Error('User cancelled due to missing permissions');
          }
        }

        retryCount++;
        setSystemStatus(`Retrying permissions... (${retryCount}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error) {
        console.error('Error ensuring permissions:', error);
        retryCount++;
        if (retryCount >= maxRetries) throw error;
      }
    }

    throw new Error('Failed to get required permissions after retries');
  };

  const activateEmergency = async (permissions: { location: boolean; audio: boolean; camera: boolean }): Promise<EmergencyAlert> => {
    setSystemStatus('Activating emergency...');
    
    try {
      // Get current location (try multiple times if needed)
      let location = await getCurrentLocationWithRetry();
      
      const emergencyPayload: any = {
        activation_method: 'button',
        is_silent: false,
        emergency_type: 'general',
        description: 'Emergency alert activated by user'
      };

      // Include location if available
      if (location && location.latitude !== 0 && location.longitude !== 0) {
        emergencyPayload.latitude = fixDecimalPrecision(location.latitude);
        emergencyPayload.longitude = fixDecimalPrecision(location.longitude);
        emergencyPayload.address = location.address;
      }

      console.log('🚀 Activating emergency with payload:', emergencyPayload);

      const response = await api.post('/aegis/emergency/activate/', emergencyPayload);

      if (response.data.success) {
        const alertData = response.data;
        
        // Update state immediately
        setCurrentAlert(alertData);
        currentAlertRef.current = alertData;
        
        setSystemStatus('Emergency activated - starting automated systems');
        
        console.log('✅ Emergency activated:', alertData.alert_id);
        
        return alertData;
        
      } else {
        throw new Error(response.data.error || 'Failed to activate emergency');
      }
    } catch (error: any) {
      console.error('❌ Error activating emergency:', error);
      throw error;
    }
  };

  const startAutomatedSystems = async (permissions: { location: boolean; audio: boolean; camera: boolean }, alertData: EmergencyAlert) => {
    setSystemStatus('Starting automated systems...');

    // Start real-time updates (always available)
    startRealTimeUpdates(alertData.alert_id);

    // Start location tracking (if permission granted)
    if (permissions.location) {
      startAutomaticLocationTracking(alertData.alert_id);
    } else {
      console.log('📍 Location tracking disabled - no permission');
    }

    // Start audio recording (if permission granted) - AUTOMATIC
    if (permissions.audio) {
      startAutomaticAudioRecording(alertData.alert_id);
    } else {
      console.log('🎙️ Audio recording disabled - no permission');
    }

    // Photo capture is now MANUAL only - no automatic photo capture

    // Start upload processor (always available)
    startUploadQueueProcessor();

    setSystemStatus('All systems operational');
    
    // Show success summary
    const enabledFeatures = [
      permissions.location && 'Location Tracking',
      permissions.audio && 'Audio Recording', 
      permissions.camera && 'Manual Photo Capture'
    ].filter(Boolean).join(', ');

    Alert.alert(
      '🚨 Emergency Systems Active',
      `Emergency alert activated successfully!\n\nActive systems:\n${enabledFeatures || 'Basic alert (enable permissions for full protection)'}\n\nHelp is on the way!`,
      [{ text: 'OK' }]
    );
  };

  const getCurrentLocationWithRetry = async (maxRetries: number = 3): Promise<{
    latitude: number;
    longitude: number;
    accuracy: number;
    address: string;
  } | null> => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        setSystemStatus(`Getting location... (${attempt}/${maxRetries})`);
        
        const locationServicesEnabled = await Location.hasServicesEnabledAsync();
        if (!locationServicesEnabled) {
          throw new Error('Location services disabled');
        }

        const { status } = await Location.getForegroundPermissionsAsync();
        if (status !== 'granted') {
          throw new Error('Location permission not granted');
        }

        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 5000,
        });

        // Get address
        let address = 'Location acquired';
        try {
          const [addressInfo] = await Location.reverseGeocodeAsync({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude
          });
          
          if (addressInfo) {
            const parts = [
              addressInfo.street,
              addressInfo.city,
              addressInfo.region,
              addressInfo.country
            ].filter(Boolean);
            address = parts.join(', ') || 'Address unavailable';
          }
        } catch (e) {
          console.log('Could not get address');
        }

        console.log('📍 Location acquired successfully');
        return {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          accuracy: location.coords.accuracy || 0,
          address: address
        };

      } catch (error) {
        console.error(`📍 Location attempt ${attempt} failed:`, error);
        if (attempt === maxRetries) {
          console.warn('⚠️ Could not get location after retries');
          return null;
        }
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    return null;
  };

  const startRealTimeUpdates = (alertId: string) => {
    // Clear any existing interval
    if (updateIntervalRef.current) {
      clearInterval(updateIntervalRef.current);
    }

    // Poll for updates every 5 seconds
    updateIntervalRef.current = setInterval(async () => {
      await fetchEmergencyUpdates(alertId);
    }, 5000) as unknown as NodeJS.Timeout;

    // Fetch immediately
    fetchEmergencyUpdates(alertId);
  };

  const fetchEmergencyUpdates = async (alertId: string) => {
    try {
      const response = await api.get(`/aegis/emergency/updates/${alertId}/`);
      
      if (response.data.success) {
        const update = response.data.data;
        
        // Update all state with new data
        setCurrentAlert(update.alert);
        currentAlertRef.current = update.alert;
        
        if (update.location_updates) {
          setLocationUpdates(update.location_updates);
        }
        
        if (update.media_captures) {
          setMediaCaptures(update.media_captures);
        }
        
        // Update responders
        if (update.responses) {
          const formattedResponders = update.responses.map((response: any, index: number) => ({
            id: `R${response.id || index + 1}`,
            name: response.responder_info?.full_name || `Responder ${index + 1}`,
            status: response.status,
            eta: `${response.eta_minutes || 5 + index * 2} min`,
            eta_minutes: response.eta_minutes,
            responder_type: response.responder_info?.responder_type
          }));
          setResponders(formattedResponders);
        }

        // Check if emergency was resolved
        if (update.alert.status !== 'active') {
          handleEmergencyEnded(update.alert.status);
        }
      }
    } catch (error) {
      console.error('Error fetching emergency updates:', error);
    }
  };

  const startAutomaticLocationTracking = (alertId: string) => {
    console.log('📍 Starting automatic location tracking...');
    
    // Send initial location immediately
    getCurrentLocationWithRetry().then(location => {
      if (location && location.latitude !== 0 && location.longitude !== 0) {
        updateLocationToServer(alertId, {
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.accuracy,
        });
      }
    });

    // Start continuous location tracking
    try {
      Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 15000, // Update every 15 seconds
          distanceInterval: 10, // Update every 10 meters
        },
        async (location) => {
          try {
            await updateLocationToServer(alertId, {
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              accuracy: location.coords.accuracy || 0,
            });
            
            // Update local state
            setLocationUpdates(prev => [{
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              accuracy: location.coords.accuracy || 0,
              timestamp: new Date().toISOString()
            }, ...prev.slice(0, 9)]); // Keep last 10 updates
            
          } catch (error) {
            console.error('Error updating location:', error);
          }
        }
      ).then(subscription => {
        locationWatchRef.current = subscription;
      });

      console.log('📍 Automatic location tracking started');
    } catch (error) {
      console.error('Error starting location tracking:', error);
    }
  };

  const updateLocationToServer = async (alertId: string, coords: {
    latitude: number;
    longitude: number;
    accuracy: number;
    speed?: number | null;
    altitude?: number | null;
    heading?: number | null;
  }) => {
    try {
      // Fix decimal precision before sending to API
      const fixedCoords = {
        latitude: fixDecimalPrecision(coords.latitude),
        longitude: fixDecimalPrecision(coords.longitude),
        accuracy: fixDecimalPrecision(coords.accuracy, 2),
        // Only include optional fields if they have valid values
        ...(coords.speed !== undefined && coords.speed !== null && { speed: fixDecimalPrecision(coords.speed, 2) }),
        ...(coords.altitude !== undefined && coords.altitude !== null && { altitude: fixDecimalPrecision(coords.altitude, 2) }),
        ...(coords.heading !== undefined && coords.heading !== null && { heading: fixDecimalPrecision(coords.heading, 2) })
      };

      console.log('📍 Auto-updating location:', fixedCoords);

      // Create payload with only the fields we're sending
      const locationPayload: any = {
        alert_id: alertId,
        latitude: fixedCoords.latitude,
        longitude: fixedCoords.longitude,
        accuracy: fixedCoords.accuracy,
      };

      // Only add optional fields if they exist in fixedCoords
      if (fixedCoords.speed !== undefined) locationPayload.speed = fixedCoords.speed;
      if (fixedCoords.altitude !== undefined) locationPayload.altitude = fixedCoords.altitude;
      if (fixedCoords.heading !== undefined) locationPayload.heading = fixedCoords.heading;

      const response = await api.post('/aegis/emergency/update-location/', locationPayload);

      if (response.data.success) {
        console.log('✅ Location auto-updated successfully');
      } else {
        console.error('❌ Location auto-update failed:', response.data);
      }
    } catch (error: any) {
      console.error('❌ Error auto-updating location:', error.response?.data || error.message);
    }
  };

  const startAutomaticAudioRecording = async (alertId: string) => {
    console.log('🎙️ Starting automatic audio recording...');
    
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
      
      await startNewAudioRecording();
      
      console.log('🎙️ Automatic audio recording started');
      
      // Upload audio chunks automatically every 30 seconds
      audioUploadIntervalRef.current = setInterval(async () => {
        await uploadAudioChunk(alertId);
      }, 30000) as unknown as NodeJS.Timeout;
      
    } catch (error) {
      console.error('Error starting automatic audio recording:', error);
    }
  };

  const startNewAudioRecording = async () => {
    try {
      // Clean up any existing recording
      if (mediaRecorderRef.current) {
        try {
          const status = await mediaRecorderRef.current.getStatusAsync();
          if (status.isRecording) {
            await mediaRecorderRef.current.stopAndUnloadAsync();
          }
        } catch (error) {
          console.log('Cleanup of previous recording:', error);
        }
        mediaRecorderRef.current = null;
      }

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      mediaRecorderRef.current = recording;
      setIsRecording(true);
      console.log('🎙️ New audio recording started');
      
    } catch (error) {
      console.error('Error starting new audio recording:', error);
      setIsRecording(false);
      mediaRecorderRef.current = null;
      
      // Auto-retry after 1 second
      setTimeout(() => {
        console.log('🔄 Retrying audio recording start...');
        startNewAudioRecording();
      }, 1000);
    }
  };

  const uploadAudioChunk = async (alertId: string) => {
    try {
      // Store reference locally and clear the ref immediately to prevent double operations
      const currentRecording = mediaRecorderRef.current;
      mediaRecorderRef.current = null;
      setIsRecording(false);

      if (!currentRecording) {
        console.log('No active recording to upload - starting new recording');
        await startNewAudioRecording();
        return;
      }

      console.log('🔄 Processing automatic audio chunk...');
      
      let uri: string | null | undefined = null;
      
      try {
        // Stop current recording to get the file
        await currentRecording.stopAndUnloadAsync();
        uri = currentRecording.getURI();
        console.log('🎵 Audio chunk stopped and ready for upload');
      } catch (stopError) {
        console.error('Error stopping recording:', stopError);
        // Try to get URI even if stop failed
        uri = currentRecording.getURI?.();
      }
      
      if (uri) {
        console.log('🎵 Audio chunk ready for auto-upload');
        
        // Add to upload queue
        addToUploadQueue({
          mediaType: 'audio',
          fileUri: uri,
          duration: 30,
          retries: 0
        });
      } else {
        console.warn('⚠️ No audio URI available for upload');
      }
      
      // Always start new recording for next chunk
      await startNewAudioRecording();
      
    } catch (error) {
      console.error('Error in automatic audio chunk upload:', error);
      // Try to restart recording
      setTimeout(() => {
        startNewAudioRecording().catch(e => 
          console.error('Failed to restart recording after error:', e)
        );
      }, 1000);
    }
  };

  const takeManualPhoto = async () => {
    try {
      const currentAlert = currentAlertRef.current;
      if (!currentAlert) {
        Alert.alert('Error', 'No active emergency alert');
        return;
      }

      console.log('📸 Taking manual emergency photo...');
      
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        quality: 0.8,
        exif: true,
        cameraType: ImagePicker.CameraType.back,
        mediaTypes: ['images'],
      });

      if (!result.canceled && result.assets[0].uri) {
        addToUploadQueue({
          mediaType: 'photo',
          fileUri: result.assets[0].uri,
          retries: 0
        });
        
        Alert.alert('Success', 'Photo captured and queued for upload');
      } else {
        console.log('Manual photo capture canceled');
      }
    } catch (error) {
      console.error('Error taking manual photo:', error);
      Alert.alert('Error', 'Failed to capture photo');
    }
  };

  // Upload Queue Management
  const addToUploadQueue = (item: Omit<UploadQueueItem, 'id' | 'timestamp'>) => {
    const queueItem: UploadQueueItem = {
      ...item,
      id: `${item.mediaType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now()
    };
    
    setUploadQueue(prev => [...prev, queueItem]);
    console.log(`➕ Added to upload queue: ${queueItem.mediaType}`);
  };

  const startUploadQueueProcessor = () => {
    uploadProcessorRef.current = setInterval(() => {
      processUploadQueue();
    }, 3000) as unknown as NodeJS.Timeout;
  };

  const processUploadQueue = async () => {
    if (isUploading || uploadQueue.length === 0) {
      return;
    }

    setIsUploading(true);
    
    try {
      const item = uploadQueue[0];
      console.log(`🔄 Processing upload: ${item.mediaType}`);
      
      const success = await uploadMediaWithRetry(
        item.mediaType,
        item.fileUri,
        item.duration,
        item.retries
      );

      if (success) {
        // Remove from queue on success
        setUploadQueue(prev => prev.filter(i => i.id !== item.id));
        console.log(`✅ Upload successful: ${item.mediaType}`);
      } else {
        // Update retry count or remove after max retries
        if (item.retries >= 3) {
          setUploadQueue(prev => prev.filter(i => i.id !== item.id));
          console.log(`❌ Upload failed after max retries: ${item.mediaType}`);
        } else {
          setUploadQueue(prev => prev.map(i => 
            i.id === item.id ? { ...i, retries: i.retries + 1 } : i
          ));
          console.log(`🔄 Retry scheduled: ${item.mediaType}, attempt ${item.retries + 1}`);
        }
      }
    } catch (error) {
      console.error('Error processing upload queue:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const uploadMediaWithRetry = async (
    mediaType: 'audio' | 'photo' | 'video', 
    fileUri: string, 
    duration?: number,
    retryCount = 0
  ): Promise<boolean> => {
    const maxRetries = 3;
    const currentAlert = currentAlertRef.current;
    
    if (!currentAlert) {
      console.error('❌ Cannot upload media - no active alert');
      return false;
    }
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        await uploadMedia(mediaType, fileUri, duration, currentAlert.alert_id);
        return true;
      } catch (error) {
        console.error(`Upload attempt ${attempt + 1} failed:`, error);
        
        if (attempt < maxRetries) {
          const backoffTime = 2000 * Math.pow(2, attempt);
          await new Promise(resolve => setTimeout(resolve, backoffTime));
        }
      }
    }
    
    return false;
  };

  const uploadMedia = async (mediaType: 'audio' | 'photo' | 'video', fileUri: string, duration?: number, alertId?: string) => {
    const currentAlert = currentAlertRef.current;
    const alertIdToUse = alertId || currentAlert?.alert_id;
    
    if (!alertIdToUse) {
      throw new Error('No active alert for media upload');
    }

    try {
      const formData = new FormData();
      formData.append('alert_id', alertIdToUse);
      formData.append('media_type', mediaType);
      
      // Create file object
      const file = {
        uri: fileUri,
        type: getMimeType(mediaType),
        name: `emergency_${mediaType}_${Date.now()}.${getFileExtension(mediaType)}`
      };
      
      formData.append('file', file as any);
      
      if (duration) {
        formData.append('duration', duration.toString());
      }

      const response = await api.post('/aegis/emergency/upload-media/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000,
      });

      if (response.data.success) {
        console.log(`✅ ${mediaType} uploaded successfully`);
        
        // Create media capture object for local state without file_url
        const mediaCaptureData: MediaCapture = {
          id: response.data.media_id,
          media_type: mediaType,
          captured_at: new Date().toISOString(),
          file_size: response.data.file_size,
          duration: duration
        };
        
        setMediaCaptures(prev => [...prev, mediaCaptureData]);
        return response.data;
      } else {
        throw new Error(response.data.error || 'Upload failed');
      }
    } catch (error: any) {
      console.error(`❌ Error uploading ${mediaType}:`, error);
      throw error;
    }
  };

  const getMimeType = (mediaType: string): string => {
    switch (mediaType) {
      case 'audio': return 'audio/m4a';
      case 'photo': return 'image/jpeg';
      case 'video': return 'video/mp4';
      default: return 'application/octet-stream';
    }
  };

  const getFileExtension = (mediaType: string): string => {
    switch (mediaType) {
      case 'audio': return 'm4a';
      case 'photo': return 'jpg';
      case 'video': return 'mp4';
      default: return 'bin';
    }
  };

  const handleEmergencyEnded = (status: string) => {
    cleanupEmergency();
    
    const message = status === 'cancelled' 
      ? 'Your emergency alert has been cancelled and responders have been notified.' 
      : 'Your emergency has been resolved.';
    
    Alert.alert(
      status === 'cancelled' ? 'Emergency Cancelled' : 'Emergency Resolved',
      message,
      [{ text: "OK", onPress: () => router.replace('/') }]
    );
  };

  const cleanupEmergency = () => {
    console.log('🛑 Cleaning up emergency resources...');
    
    // Clear all intervals
    if (updateIntervalRef.current) clearInterval(updateIntervalRef.current);
    if (audioUploadIntervalRef.current) clearInterval(audioUploadIntervalRef.current);
    if (uploadProcessorRef.current) clearInterval(uploadProcessorRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
    
    // Stop location tracking
    if (locationWatchRef.current) {
      locationWatchRef.current.remove();
    }
    
    // Stop media recording safely
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.getStatusAsync()
        .then(status => {
          if (status.isRecording) {
            return mediaRecorderRef.current!.stopAndUnloadAsync();
          }
        })
        .catch(error => {
          console.log('Cleanup recording error (non-critical):', error);
        })
        .finally(() => {
          mediaRecorderRef.current = null;
          setIsRecording(false);
        });
    } else {
      mediaRecorderRef.current = null;
      setIsRecording(false);
    }
    
    // Clear upload queue
    setUploadQueue([]);
    
    console.log('✅ Emergency cleanup completed');
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePinSubmit = async () => {
    const currentAlert = currentAlertRef.current;
    if (!currentAlert?.alert_id) return;

    if (pinInput === EMERGENCY_DEACTIVATION_PIN) {
      // Correct PIN - show the real emergency screen
      setShowFakeScreen(false);
      setPinInput("");
    } else {
      // Incorrect PIN - show fake error but keep emergency active
      const newAttempts = incorrectAttempts + 1;
      setIncorrectAttempts(newAttempts);
      setPinInput("");
      
      // Report failed attempt to backend
      try {
        await api.post('/aegis/emergency/deactivate/', {
          pin: pinInput,
          alert_id: currentAlert.alert_id
        });
      } catch (error) {
        // Expected to fail with incorrect PIN
      }
      
      if (newAttempts >= 2) {
        Alert.alert(
          "Too Many Attempts",
          "Emergency system locked for 30 seconds. Help is on the way.",
          [{ text: "OK" }]
        );
        console.log("Multiple failed deactivation attempts detected");
      } else {
        Alert.alert(
          "Incorrect PIN",
          "Please try again. Emergency services are being notified.",
          [{ text: "OK" }]
        );
      }
    }
  };

  const handleStopAlert = async () => {
    const currentAlert = currentAlertRef.current;
    if (!currentAlert?.alert_id) return;

    Alert.alert(
      "Stop Emergency Alert",
      "Are you sure you want to cancel the emergency alert?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Stop Alert",
          style: "destructive",
          onPress: async () => {
            try {
              const response = await api.post('/aegis/emergency/deactivate/', {
                pin: EMERGENCY_DEACTIVATION_PIN,
                alert_id: currentAlert.alert_id
              });

              if (response.data.success) {
                handleEmergencyEnded('cancelled');
              } else {
                Alert.alert("Error", response.data.error || "Failed to deactivate emergency.");
              }
            } catch (error: any) {
              console.error('Error deactivating emergency:', error);
              Alert.alert(
                "Error",
                error.response?.data?.error || "Failed to deactivate emergency. Please try again."
              );
            }
          }
        }
      ]
    );
  };

  const handleFakeCall = () => {
    Alert.alert(
      "Calling Support...",
      "This would connect to emergency support but actually maintains the emergency alert.",
      [{ text: "OK" }]
    );
  };

  const handleFakeMessage = () => {
    Alert.alert(
      "Sending Error Report...",
      "This would send an error report but actually maintains the emergency alert.",
      [{ text: "OK" }]
    );
  };

  const getResponderStatusColor = (status: string) => {
    switch (status) {
      case 'notified': return 'text-yellow-500';
      case 'dispatched': return 'text-orange-500';
      case 'en_route': return 'text-blue-500';
      case 'on_scene': return 'text-green-500';
      case 'completed': return 'text-purple-500';
      default: return 'text-gray-500';
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-background justify-center items-center">
        <ActivityIndicator size="large" color="#EF4444" />
        <Text className="text-on-surface mt-4 text-lg">Activating Emergency Systems</Text>
        <Text className="text-on-surface-variant mt-2 text-center px-8">
          {systemStatus}
        </Text>
        <View className="mt-6 bg-blue-500/10 p-4 rounded-xl mx-8">
          <Text className="text-blue-700 text-sm text-center">
            🚨 Emergency alert will activate automatically with:
          </Text>
          <Text className="text-blue-600 text-xs text-center mt-1">
            • Location tracking • Audio recording • Manual photo capture
          </Text>
        </View>
      </View>
    );
  }

  if (showFakeScreen) {
    return (
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 bg-gray-800 justify-center items-center p-6"
      >
        <View className="items-center">
          <Text className="text-6xl mb-4">😵</Text>
          <Text className="text-white text-2xl font-bold mb-2">App Not Responding</Text>
          <Text className="text-gray-400 text-center mb-8">
            The application has encountered an unexpected error and needs to close.
          </Text>

          <View className="w-full mb-6">
            <Text className="text-white mb-3">Enter security code to attempt recovery:</Text>
            <TextInput
              className="bg-gray-700 text-white p-4 rounded-xl mb-2 text-center text-lg"
              placeholder="Enter PIN"
              placeholderTextColor="#9CA3AF"
              value={pinInput}
              onChangeText={setPinInput}
              keyboardType="number-pad"
              secureTextEntry
              maxLength={4}
              autoFocus
            />
            <TouchableOpacity
              className="bg-blue-500 p-4 rounded-xl"
              onPress={handlePinSubmit}
              disabled={pinInput.length !== 4}
            >
              <Text className="text-white text-center font-semibold text-lg">
                Attempt Recovery
              </Text>
            </TouchableOpacity>
          </View>

          <View className="flex-row space-x-3">
            <TouchableOpacity
              className="bg-gray-700 px-6 py-3 rounded-xl"
              onPress={handleFakeCall}
            >
              <Text className="text-white">📞 Call Support</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="bg-gray-700 px-6 py-3 rounded-xl"
              onPress={handleFakeMessage}
            >
              <Text className="text-white">✉️ Send Error Report</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Hidden emergency status - still active in background */}
        <View className="absolute bottom-4 left-4 opacity-0">
          <Text>Emergency Active: {formatTime(timeActive)}</Text>
          {currentAlert && <Text>Alert ID: {currentAlert.alert_id}</Text>}
        </View>
      </KeyboardAvoidingView>
    );
  }

  // Real Emergency Active Screen (only shown after correct PIN)
  return (
    <View className="flex-1 bg-background">
      {/* Header Status Bar */}
      <View className="bg-red-600 px-6 py-4">
        <View className="flex-row justify-between items-center">
          <View>
            <Text className="text-white font-bold text-lg">🚨 EMERGENCY ACTIVE</Text>
            <Text className="text-white text-sm">Alert ID: {emergencyData.alertId}</Text>
          </View>
          <View className="items-end">
            <Text className="text-white font-bold text-xl">{formatTime(timeActive)}</Text>
            <Text className="text-white text-xs">Duration</Text>
          </View>
        </View>
      </View>

      <View className="flex-1">
        {/* Emergency Information */}
        <View className="px-6 py-4">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-xl font-bold text-on-surface">Emergency Response Activated</Text>
            <View className="bg-green-500/20 px-3 py-1 rounded-full">
              <Text className="text-green-500 font-semibold">AUTO-ACTIVE</Text>
            </View>
          </View>

          {/* Response Status */}
          <View className="bg-surface-variant rounded-xl p-4 mb-4">
            <Text className="text-on-surface font-medium mb-3 text-lg">Help is Coming</Text>
            
            {emergencyData.responders.length > 0 ? (
              emergencyData.responders.map((responder, index) => (
                <View 
                  key={responder.id} 
                  className={`flex-row justify-between items-center py-3 ${index < emergencyData.responders.length - 1 ? 'border-b border-outline' : ''}`}
                >
                  <View className="flex-1">
                    <Text className="text-on-surface font-medium">{responder.name}</Text>
                    <Text className={`text-sm capitalize ${getResponderStatusColor(responder.status)}`}>
                      {responder.status.replace('_', ' ')}
                      {responder.responder_type && ` • ${responder.responder_type}`}
                    </Text>
                  </View>
                  <Text className="text-on-surface font-semibold">ETA: {responder.eta}</Text>
                </View>
              ))
            ) : (
              <View className="flex-row items-center py-3">
                <View className="w-4 h-4 rounded-full bg-yellow-500 animate-pulse mr-3" />
                <View className="flex-1">
                  <Text className="text-on-surface">Searching for responders...</Text>
                  <Text className="text-on-surface-variant text-sm">
                    Notifying nearby emergency services
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* Automated Systems Status */}
          <View className="bg-surface-variant rounded-xl p-4 mb-4">
            <Text className="text-on-surface font-medium mb-3">System Status</Text>
            
            <View className="space-y-3">
              {/* Location Tracking */}
              <View className="flex-row justify-between items-center">
                <View className="flex-row items-center">
                  <View className={`w-3 h-3 rounded-full ${hasLocationPermission ? 'bg-green-500' : 'bg-red-500'} mr-3`} />
                  <Text className="text-on-surface">Location Tracking</Text>
                </View>
                <Text className={`text-sm ${hasLocationPermission ? 'text-green-500' : 'text-red-500'}`}>
                  {hasLocationPermission ? `Active (${locationUpdates.length} updates)` : 'Disabled'}
                </Text>
              </View>

              {/* Audio Recording */}
              <View className="flex-row justify-between items-center">
                <View className="flex-row items-center">
                  <View className={`w-3 h-3 rounded-full ${hasAudioPermission ? 'bg-green-500' : 'bg-red-500'} mr-3`} />
                  <Text className="text-on-surface">Audio Recording</Text>
                </View>
                <Text className={`text-sm ${hasAudioPermission ? 'text-green-500' : 'text-red-500'}`}>
                  {hasAudioPermission ? 'Active (30s chunks)' : 'Disabled'}
                </Text>
              </View>

              {/* Photo Capture */}
              <View className="flex-row justify-between items-center">
                <View className="flex-row items-center">
                  <View className={`w-3 h-3 rounded-full ${hasCameraPermission ? 'bg-green-500' : 'bg-red-500'} mr-3`} />
                  <Text className="text-on-surface">Photo Capture</Text>
                </View>
                <Text className={`text-sm ${hasCameraPermission ? 'text-green-500' : 'text-red-500'}`}>
                  {hasCameraPermission ? 'Manual Only' : 'Disabled'}
                </Text>
              </View>

              {/* Media Uploads */}
              <View className="flex-row justify-between items-center">
                <View className="flex-row items-center">
                  <View className="w-3 h-3 rounded-full bg-blue-500 mr-3" />
                  <Text className="text-on-surface">Media Uploads</Text>
                </View>
                <Text className="text-blue-500 text-sm">
                  {mediaCaptures.length} uploaded • {uploadQueue.length} queued
                </Text>
              </View>
            </View>
          </View>

          {/* Quick Actions */}
          <View className="bg-primary/10 rounded-xl p-4 mb-4">
            <Text className="text-primary font-medium mb-3">Quick Actions</Text>
            <View className="flex-row space-x-3">
              <TouchableOpacity 
                className="flex-1 bg-primary/20 p-3 rounded-lg items-center"
                onPress={takeManualPhoto}
                disabled={!hasCameraPermission}
              >
                <Text className={`font-semibold ${hasCameraPermission ? 'text-primary' : 'text-gray-400'}`}>
                  📸 Take Photo
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                className="flex-1 bg-primary/20 p-3 rounded-lg items-center"
                onPress={async () => {
                  const currentAlert = currentAlertRef.current;
                  if (currentAlert && hasLocationPermission) {
                    try {
                      const location = await getCurrentLocationWithRetry();
                      if (location) {
                        await updateLocationToServer(currentAlert.alert_id, {
                          latitude: location.latitude,
                          longitude: location.longitude,
                          accuracy: location.accuracy,
                        });
                        // Alert.alert('Success', 'Location updated manually');
                      }
                    } catch (error) {
                      Alert.alert('Error', 'Failed to update location');
                    }
                  } else {
                    Alert.alert('Location Disabled', 'Enable location permissions for manual updates');
                  }
                }}
              >
                <Text className="text-primary font-semibold">
                  📍 Update Location
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Security Status */}
          {(currentAlert?.deactivation_attempts ?? 0) > 0 && (
            <View className="bg-yellow-500/20 rounded-xl p-4 mb-4">
              <Text className="text-yellow-700 font-medium mb-1">Security Notice</Text>
              <Text className="text-yellow-600 text-sm">
                {currentAlert?.deactivation_attempts} failed deactivation attempt(s) detected. 
                Help is on the way.
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Emergency Actions Footer */}
      <View className="px-6 pb-8 pt-4 bg-surface">
        <TouchableOpacity
          className="bg-green-500 py-4 rounded-xl mb-3"
          onPress={handleStopAlert}
        >
          <Text className="text-white text-center font-semibold text-lg">Stop Emergency Alert</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="bg-surface-variant py-3 rounded-xl"
          onPress={() => Alert.alert(
            "Emergency System Status", 
            `Alert ID: ${emergencyData.alertId}\n` +
            `Activated: ${new Date(emergencyData.timestamp).toLocaleString()}\n` +
            `Duration: ${formatTime(timeActive)}\n` +
            `Responders: ${emergencyData.responders.length} notified\n` +
            `Location Updates: ${locationUpdates.length}\n` +
            `Media Files: ${mediaCaptures.length} uploaded\n` +
            `Upload Queue: ${uploadQueue.length} pending\n` +
            `Location: ${hasLocationPermission ? 'ACTIVE' : 'DISABLED'}\n` +
            `Audio: ${hasAudioPermission ? 'ACTIVE' : 'DISABLED'}\n` +
            `Camera: ${hasCameraPermission ? 'MANUAL' : 'DISABLED'}\n` +
            `System Status: ${systemStatus}`,
            [{ text: "OK" }]
          )}
        >
          <Text className="text-on-surface text-center">System Status</Text>
        </TouchableOpacity>
      </View>

      {/* Status Indicators */}
      {isRecording && (
        <View className="absolute top-16 right-4 bg-red-500/20 px-3 py-1 rounded-full">
          <Text className="text-red-500 text-xs font-semibold">● AUTO-RECORDING</Text>
        </View>
      )}
      
      {uploadQueue.length > 0 && (
        <View className="absolute top-16 left-4 bg-orange-500/20 px-3 py-1 rounded-full">
          <Text className="text-orange-500 text-xs font-semibold">
            📤 {uploadQueue.length} UPLOADING
          </Text>
        </View>
      )}
    </View>
  );
}