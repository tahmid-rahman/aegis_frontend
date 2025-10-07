// app/user/silent-capture.tsx
import { FontAwesome5, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { ResizeMode, Video } from 'expo-av';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Modal,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  Vibration,
  View
} from 'react-native';
import { useTheme } from '../../providers/ThemeProvider';
import { api } from '../../services/api';

interface VideoEvidenceData {
  title: string;
  location_lat: number | null;
  location_lng: number | null;
  location_address: string;
  recorded_at: string;
  is_anonymous: boolean;
  duration_seconds: number;
  type: string;
}

const EVIDENCE_TYPES = [
  { value: 'harassment', label: 'Harassment', icon: 'visibility-off' },
  { value: 'robbery', label: 'Robbery', icon: 'security' },
  { value: 'assault', label: 'Assault', icon: 'warning' },
  { value: 'stalking', label: 'Stalking', icon: 'person-remove' },
  { value: 'unknown', label: 'Unknown', icon: 'help' },
];

export default function SilentCaptureScreen() {
  const { theme, isDark } = useTheme();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const videoRef = useRef<Video>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordingTimer, setRecordingTimer] = useState<NodeJS.Timeout | null>(null);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [locationAddress, setLocationAddress] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [evidenceType, setEvidenceType] = useState('unknown');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [capturedVideo, setCapturedVideo] = useState<string | null>(null);
  
  // Stealth Mode States
  const [stealthMode, setStealthMode] = useState(false);
  const [screenOff, setScreenOff] = useState(true);
  const [isMinimalUI, setIsMinimalUI] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  
  // Animation refs
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  
  // Triple tap detection
  const tapCount = useRef(0);
  const lastTap = useRef(0);

  // Initialize stealth mode screen state
  useEffect(() => {
    if (stealthMode) {
      setScreenOff(true);
    }
  }, [stealthMode]);

  // Pulsing animation for stealth indicator
  useEffect(() => {
    if (stealthMode && isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.3,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [stealthMode, isRecording]);

  const handleTripleTap = () => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      tapCount.current += 1;
    } else {
      tapCount.current = 1;
    }
    lastTap.current = now;

    if (tapCount.current === 3) {
      tapCount.current = 0;
      if (stealthMode) {
        toggleStealthMode();
      }
    }
  };

  const toggleStealthMode = () => {
    if (!stealthMode) {
      // Enable stealth mode
      Vibration.vibrate(50);
      setStealthMode(true);
      setIsMinimalUI(true);
      setScreenOff(true);
      
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
      
      if (!isRecording) {
        Alert.alert(
          'Stealth Mode Activated',
          'Screen will appear black. Recording continues in background. Triple-tap anywhere to exit.',
          [{ text: 'Understood', style: 'default' }]
        );
      }
    } else {
      // Disable stealth mode
      setStealthMode(false);
      setScreenOff(false);
      setIsMinimalUI(false);
      
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  };

  const toggleScreen = () => {
    if (stealthMode) {
      setScreenOff(!screenOff);
      Vibration.vibrate(10);
      
      // Auto hide screen after 3 seconds if showing
      if (!screenOff) {
        setTimeout(() => {
          if (stealthMode) {
            setScreenOff(true);
          }
        }, 3000);
      }
    }
  };

  useEffect(() => {
    (async () => {
      if (!permission?.granted) {
        await requestPermission();
      }

      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location access is needed for evidence documentation.');
        return;
      }

      try {
        const location = await Location.getCurrentPositionAsync({});
        setLocation(location);
        
        const address = await Location.reverseGeocodeAsync({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
        
        if (address[0]) {
          const addr = `${address[0].name}, ${address[0].city}, ${address[0].region}`;
          setLocationAddress(addr);
        }
      } catch (error) {
        console.warn('Could not get location:', error);
      }
    })();
  }, []);

  const startRecording = async () => {
    if (!cameraRef.current || isRecording) return;

    try {
      setIsRecording(true);
      setRecordingTime(0);
      
      // Start recording timer
      const timer = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      setRecordingTimer(timer);

      const videoRecordPromise = cameraRef.current.recordAsync({
        maxDuration: 300,
        quality: '720p',
        mute: stealthMode,
      });

      const timeoutPromise = new Promise<null>((resolve) => {
        setTimeout(() => resolve(null), 300000);
      });

      const result = await Promise.race([videoRecordPromise, timeoutPromise]);
      
      if (result) {
        setCapturedVideo(result.uri);
        
        // In stealth mode, auto-submit without alert
        if (stealthMode) {
          handleSubmitEvidence(result.uri);
        } else {
          setShowReviewModal(true);
        }
      }
    } catch (error) {
      console.error('Recording error:', error);
      if (!stealthMode) {
        Alert.alert('Error', 'Failed to record video');
      }
    } finally {
      stopRecording();
    }
  };

  const stopRecording = () => {
    if (cameraRef.current && isRecording) {
      cameraRef.current.stopRecording();
      setIsRecording(false);
      if (recordingTimer) {
        clearInterval(recordingTimer);
        setRecordingTimer(null);
      }
    }
  };

  const handleReviewAction = (action: 'submit' | 'discard') => {
    setShowReviewModal(false);
    
    if (action === 'submit' && capturedVideo) {
      handleSubmitEvidence(capturedVideo);
    } else {
      setCapturedVideo(null);
      setRecordingTime(0);
    }
  };

  const handleSubmitEvidence = async (videoUri: string) => {
    if (!videoUri) return;

    setIsUploading(true);

    try {
      const evidenceData: VideoEvidenceData = {
        title: stealthMode 
          ? `Stealth Evidence - ${new Date().toLocaleString()}`
          : `Silently Captured Evidence - ${new Date().toLocaleString()}`,
        location_lat: location?.coords.latitude || null,
        location_lng: location?.coords.longitude || null,
        location_address: locationAddress,
        recorded_at: new Date().toISOString(),
        is_anonymous: isAnonymous || stealthMode,
        duration_seconds: recordingTime,
        type: evidenceType,
      };

      const createResponse = await api.post('/aegis/evidence/submit/', evidenceData);
      
      if (createResponse.data.evidence_id) {
        const evidenceId = createResponse.data.evidence_id;
        
        const formData = new FormData();
        formData.append('video_file', {
          uri: videoUri,
          type: 'video/mp4',
          name: `evidence_${evidenceId}_${Date.now()}.mp4`,
        } as any);
        formData.append('media_type', 'video');

        await api.post(
          `/aegis/evidence/${evidenceId}/upload/`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          }
        );

        if (!stealthMode) {
          Alert.alert('Success', 'Evidence submitted successfully!');
        } else {
          Vibration.vibrate(100);
        }
        
        setCapturedVideo(null);
        setRecordingTime(0);
        setEvidenceType('unknown');
        setIsAnonymous(false);
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      if (!stealthMode) {
        Alert.alert(
          'Upload Failed',
          error.response?.data?.error || 'Failed to submit evidence. Please try again.'
        );
      }
    } finally {
      setIsUploading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!permission) {
    return (
      <View className="flex-1 bg-background justify-center items-center">
        <ActivityIndicator size="large" className="text-primary" />
        <Text className="text-on-surface text-body mt-4 text-center">
          Requesting camera permission...
        </Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View className="flex-1 bg-background justify-center items-center p-6">
        <Text className="text-on-surface text-body text-center mb-6">
          Camera permission is required for evidence collection.
        </Text>
        <TouchableOpacity 
          className="bg-primary px-6 py-3 rounded-lg"
          onPress={requestPermission}
        >
          <Text className="text-on-primary text-label font-semibold">Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <StatusBar 
        hidden={stealthMode} 
        backgroundColor="transparent" 
        translucent 
      />
      
      {/* Camera Area */}
      <View className="flex-1 relative">
        {/* Main Camera View - Conditionally rendered based on stealth mode */}
        {!stealthMode || (stealthMode && !screenOff) ? (
          <CameraView
            ref={cameraRef}
            style={{ flex: 1 }}
            facing="back"
            mode="video"
            zoom={0}
            mute={stealthMode}
          >
            {/* Normal Recording Indicator */}
            {!stealthMode && isRecording && (
              <View className="absolute top-12 left-0 right-0 items-center z-40">
                <View className="flex-row items-center bg-black/70 px-4 py-2 rounded-full">
                  <View className="w-3 h-3 rounded-full bg-error mr-2" />
                  <Text className="text-white text-label font-semibold">
                    Recording: {formatTime(recordingTime)}
                  </Text>
                </View>
              </View>
            )}
            
            {/* Stealth Mode Screen Toggle Area */}
            {stealthMode && !screenOff && (
              <TouchableOpacity 
                className="absolute inset-0 z-50"
                onPress={toggleScreen}
                activeOpacity={1}
              />
            )}
          </CameraView>
        ) : (
          // Black Screen for Stealth Mode
          <View className="flex-1 bg-black">
            {/* Triple Tap Detection Area - Full screen for stealth mode */}
            <TouchableOpacity 
              className="flex-1 z-50"
              onPress={handleTripleTap}
              activeOpacity={1}
            />
            
            {/* Stealth Recording Indicator */}
            {stealthMode && isRecording && (
              <View className="absolute top-12 left-0 right-0 items-center z-60">
                <Animated.View 
                  style={{ opacity: pulseAnim }}
                  className="flex-row items-center bg-black/80 px-4 py-2 rounded-full"
                >
                  <View className="w-2 h-2 rounded-full bg-error mr-2" />
                  <Text className="text-white text-caption font-semibold">
                    STEALTH • {formatTime(recordingTime)}
                  </Text>
                </Animated.View>
              </View>
            )}
            
            {/* Screen Toggle Hint for Stealth Mode */}
            {stealthMode && screenOff && !isRecording && (
              <View className="absolute bottom-20 left-0 right-0 items-center z-70">
                <Text className="text-white/60 text-caption text-center">
                  Tap to briefly view camera • Triple-tap to exit stealth
                </Text>
              </View>
            )}
          </View>
        )}
      </View>

      {/* Review Modal */}
      <Modal
        visible={showReviewModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowReviewModal(false)}
      >
        <View className="flex-1 bg-background">
          <View className="flex-row justify-between items-center p-4 border-b border-outline">
            <Text className="text-on-surface text-title font-semibold">
              Review Evidence
            </Text>
            <TouchableOpacity onPress={() => setShowReviewModal(false)}>
              <Ionicons name="close" size={24} color="rgb(var(--color-on-surface))" />
            </TouchableOpacity>
          </View>
          
          <ScrollView className="flex-1 p-4">
            {capturedVideo && (
              <View className="mb-4">
                <Text className="text-on-surface text-label font-semibold mb-2">
                  Video Preview
                </Text>
                <Video
                  ref={videoRef}
                  source={{ uri: capturedVideo }}
                  style={{ width: '100%', height: 300, borderRadius: 12 }}
                  resizeMode={ResizeMode.CONTAIN}
                  useNativeControls
                  isLooping
                />
              </View>
            )}
            
            <View className="mb-4">
              <Text className="text-on-surface text-label font-semibold mb-2">
                Evidence Details
              </Text>
              <View className="bg-surface-variant p-3 rounded-lg">
                <View className="flex-row justify-between mb-2">
                  <Text className="text-on-surface-variant">Duration:</Text>
                  <Text className="text-on-surface">{formatTime(recordingTime)}</Text>
                </View>
                <View className="flex-row justify-between mb-2">
                  <Text className="text-on-surface-variant">Type:</Text>
                  <Text className="text-on-surface">
                    {EVIDENCE_TYPES.find(t => t.value === evidenceType)?.label}
                  </Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-on-surface-variant">Anonymous:</Text>
                  <Text className="text-on-surface">
                    {isAnonymous ? 'Yes' : 'No'}
                  </Text>
                </View>
              </View>
            </View>
            
            {location && (
              <View className="mb-4">
                <Text className="text-on-surface text-label font-semibold mb-2">
                  Location
                </Text>
                <Text className="text-on-surface text-body mb-1">
                  {locationAddress || 'Address not available'}
                </Text>
                <Text className="text-on-surface-variant text-caption">
                  {location.coords.latitude.toFixed(6)}, {location.coords.longitude.toFixed(6)}
                </Text>
              </View>
            )}
          </ScrollView>
          
          <View className="flex-row p-4 gap-3 border-t border-outline">
            <TouchableOpacity 
              className="flex-1 bg-error py-3 rounded-lg"
              onPress={() => handleReviewAction('discard')}
            >
              <Text className="text-on-primary text-label font-semibold text-center">
                Discard
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              className="flex-1 bg-primary py-3 rounded-lg"
              onPress={() => handleReviewAction('submit')}
            >
              <Text className="text-on-primary text-label font-semibold text-center">
                Submit Evidence
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Main Controls Container */}
      <Animated.View 
        style={{ opacity: fadeAnim }}
        className={`${isMinimalUI ? 'h-20' : 'flex-1'}`}
      >
        {isMinimalUI ? (
          // Minimal Stealth Controls
          <View className="flex-row justify-between items-center px-4 py-3 bg-black/80">
            <View className="flex-row items-center">
              <FontAwesome5 
                name="user-secret" 
                size={16} 
                color="#EC407A" 
              />
              <Text className="text-on-accent text-caption font-semibold ml-2">
                STEALTH MODE
              </Text>
            </View>
            
            <View className="flex-row items-center gap-4">
              {isRecording && (
                <View className="flex-row items-center">
                  <View className="w-2 h-2 rounded-full bg-error mr-1" />
                  <Text className="text-white text-caption">
                    {formatTime(recordingTime)}
                  </Text>
                </View>
              )}
              
              <TouchableOpacity
                onPress={toggleStealthMode}
                className="bg-accent/20 px-3 py-1 rounded-full"
              >
                <Text className="text-on-accent text-caption font-semibold">
                  EXIT
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          // Full Controls
          <ScrollView className="flex-1 p-4">
            {/* Stealth Mode Toggle */}
            <View className="mb-4">
              <TouchableOpacity
                onPress={toggleStealthMode}
                className={`flex-row items-center justify-between p-3 rounded-xl border ${
                  stealthMode 
                    ? 'bg-accent/20 border-accent' 
                    : 'bg-surface-variant border-outline'
                }`}
              >
                <View className="flex-row items-center">
                  <FontAwesome5 
                    name={stealthMode ? "user-secret" : "eye"} 
                    size={18} 
                    color={stealthMode ? "rgb(var(--color-accent))" : "rgb(var(--color-on-surface-variant))"} 
                  />
                  <Text className={`text-label font-semibold ml-2 ${
                    stealthMode ? 'text-accent' : 'text-on-surface'
                  }`}>
                    Stealth Mode
                  </Text>
                </View>
                <View className={`w-6 h-6 rounded-full border-2 ${
                  stealthMode 
                    ? 'bg-accent border-accent' 
                    : 'bg-surface border-outline'
                }`}>
                  {stealthMode && (
                    <Ionicons name="checkmark" size={16} color="white" />
                  )}
                </View>
              </TouchableOpacity>
              
              {stealthMode && (
                <Text className="text-on-surface-variant text-caption mt-2 px-1">
                  • Screen appears black • Auto-submit • No alerts • Triple-tap to exit
                </Text>
              )}
            </View>

            {/* Evidence Type Selection */}
            <View className="mb-5">
              <Text className="text-on-surface text-label font-semibold mb-2">
                Evidence Type
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View className="flex-row gap-2">
                  {EVIDENCE_TYPES.map((type) => (
                    <TouchableOpacity
                      key={type.value}
                      className={`flex-row items-center px-4 py-2 rounded-full border ${
                        evidenceType === type.value 
                          ? 'bg-primary border-primary' 
                          : 'bg-surface-variant border-outline'
                      }`}
                      onPress={() => setEvidenceType(type.value)}
                    >
                      <MaterialIcons 
                        name={type.icon as any} 
                        size={16} 
                        color={evidenceType === type.value ? "white" : "rgb(var(--color-on-surface-variant))"} 
                      />
                      <Text className={`text-label font-medium ml-2 ${
                        evidenceType === type.value 
                          ? 'text-on-primary' 
                          : 'text-on-surface-variant'
                      }`}>
                        {type.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            {/* Location Information */}
            {location && (
              <View className="mb-5">
                <Text className="text-on-surface text-label font-semibold mb-2">
                  <Ionicons name="location" size={16} color="rgb(var(--color-on-surface))" /> Location
                </Text>
                <Text className="text-on-surface text-body mb-1">
                  {locationAddress || 'Address not available'}
                </Text>
                <Text className="text-on-surface-variant text-caption">
                  {location.coords.latitude.toFixed(6)}, {location.coords.longitude.toFixed(6)}
                </Text>
              </View>
            )}

            {/* Anonymous Toggle */}
            <View className="mb-5">
              <TouchableOpacity
                className="flex-row items-center"
                onPress={() => setIsAnonymous(!isAnonymous)}
              >
                <View className={`w-6 h-6 rounded-full border-2 mr-3 justify-center items-center ${
                  isAnonymous 
                    ? 'bg-accent border-accent' 
                    : 'bg-surface-variant border-outline'
                }`}>
                  {isAnonymous && <Ionicons name="checkmark" size={16} color="white" />}
                </View>
                <Text className="text-on-surface text-body">
                  Submit Anonymously
                </Text>
              </TouchableOpacity>
            </View>

            {/* Recording Controls */}
            <View className="items-center my-5">
              {!isRecording ? (
                <TouchableOpacity
                  className="flex-row items-center bg-accent px-8 py-4 rounded-full gap-3 shadow-lg"
                  onPress={startRecording}
                  disabled={isUploading}
                >
                  <Ionicons name="videocam" size={28} color="white" />
                  <Text className="text-on-accent text-title font-bold">Start Recording</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  className="flex-row items-center bg-error px-8 py-4 rounded-full gap-3 shadow-lg"
                  onPress={stopRecording}
                >
                  <Ionicons name="square" size={28} color="white" />
                  <Text className="text-on-primary text-title font-bold">Stop Recording</Text>
                </TouchableOpacity>
              )}

              {isUploading && (
                <View className="flex-row items-center mt-3 gap-2">
                  <ActivityIndicator size="small" className="text-primary" />
                  <Text className="text-on-surface text-caption">
                    {stealthMode ? 'Securely uploading...' : 'Uploading evidence...'}
                  </Text>
                </View>
              )}
            </View>

            {/* Instructions */}
            <View className="mt-5 p-3 bg-surface-variant rounded-xl">
              <Text className="text-on-surface text-label font-semibold mb-2">
                <Ionicons name="information-circle" size={16} color="rgb(var(--color-on-surface))" /> Instructions:
              </Text>
              <Text className="text-on-surface-variant text-caption leading-5">
                • Record up to 5 minutes of video evidence{'\n'}
                • Use Stealth Mode for discreet recording{'\n'}
                • Your location is automatically recorded{'\n'}
                • Choose appropriate evidence type{'\n'}
                • Submit anonymously if needed
              </Text>
            </View>
          </ScrollView>
        )}
      </Animated.View>
    </View>
  );
}