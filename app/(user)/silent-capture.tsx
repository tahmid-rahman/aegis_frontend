// app/user/silent-capture.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  AppState,
  AppStateStatus,
  Switch,
  Text,
  TouchableOpacity,
  Vibration,
  View
} from 'react-native';
import { useTheme } from '../../providers/ThemeProvider';
import { api } from '../../services/api';

export default function SilentCapture() {
  const router = useRouter();
  const { effectiveTheme } = useTheme();

  // Camera state
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<any>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [stealthMode, setStealthMode] = useState(true);
  const [displayValue, setDisplayValue] = useState('0');
  const [previousValue, setPreviousValue] = useState('');
  const [operation, setOperation] = useState('');
  const appState = useRef(AppState.currentState);
  const [cameraReady, setCameraReady] = useState(false);

  // Long press state
  const [pressTimer, setPressTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [pressProgress, setPressProgress] = useState(0);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const [showProgress, setShowProgress] = useState(false);

  // Recording state
  const [recordingStartTime, setRecordingStartTime] = useState<number | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recordingPromise, setRecordingPromise] = useState<Promise<any> | null>(null);
  const [durationInterval, setDurationInterval] = useState<ReturnType<typeof setInterval> | null>(null);

  // ===== Camera Initialization =====
  useEffect(() => {
    // Initialize camera when component mounts
    const initializeCamera = async () => {
      if (!permission?.granted) {
        await requestPermission();
      }
      // Camera will be ready after a short delay
      setTimeout(() => {
        setCameraReady(true);
        console.log('🟢 Camera initialized and ready');
      }, 2000);
    };

    initializeCamera();
  }, []);

  // ===== App State Handling =====
  useEffect(() => {
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      subscription.remove();
      if (pressTimer) clearTimeout(pressTimer);
      if (durationInterval) clearInterval(durationInterval);
    };
  }, [isRecording, stealthMode]);

  const handleAppStateChange = (nextAppState: AppStateStatus) => {
    if (appState.current.match(/active/) && nextAppState === 'background') {
      if (isRecording) {
        stopRecording();
      }
    }
    appState.current = nextAppState;
  };

  // ===== Long Press Handler =====
  const handleButtonPressIn = (button: string) => {
    if (button === '3' && !isRecording && stealthMode && cameraReady) {
      setShowProgress(true);
      setPressProgress(0);
      
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: false,
      }).start();

      let progress = 0;
      const interval = setInterval(() => {
        progress += 0.1;
        setPressProgress(progress);
        if (progress >= 1) {
          clearInterval(interval);
          startRecording();
          setShowProgress(false);
        }
      }, 300);

      const timer = setTimeout(() => {
        clearInterval(interval);
        startRecording();
        setShowProgress(false);
      }, 3000);

      setPressTimer(timer);
    }
  };

  const handleButtonPressOut = (button: string) => {
    if (button === '3' && pressTimer) {
      clearTimeout(pressTimer);
      setPressTimer(null);
      Animated.timing(progressAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }).start();
      setPressProgress(0);
      setShowProgress(false);
    }
  };

  // ===== Button Handler =====
  const handleCalculatorButton = (button: string) => {
    if (button === '0' && isRecording) {
      stopRecording();
      return;
    }

    if (button !== '3' || isRecording) {
      // ... existing calculator logic (same as before) ...
      if (button === 'C') {
        setDisplayValue('0');
        setPreviousValue('');
        setOperation('');
      } else if (button === '±') {
        setDisplayValue(prev => prev.startsWith('-') ? prev.slice(1) : '-' + prev);
      } else if (button === '%') {
        setDisplayValue(prev => (parseFloat(prev) / 100).toString());
      } else if (['÷', '×', '−', '+'].includes(button)) {
        setPreviousValue(displayValue);
        setOperation(button);
        setDisplayValue('0');
      } else if (button === '=') {
        if (previousValue && operation) {
          const prev = parseFloat(previousValue);
          const current = parseFloat(displayValue);
          let result = 0;
          
          switch (operation) {
            case '+': result = prev + current; break;
            case '−': result = prev - current; break;
            case '×': result = prev * current; break;
            case '÷': result = prev / current; break;
          }
          
          setDisplayValue(result.toString());
          setPreviousValue('');
          setOperation('');
        }
      } else if (button === '.') {
        if (!displayValue.includes('.')) {
          setDisplayValue(prev => prev + '.');
        }
      } else if (button === '3' && isRecording) {
        setDisplayValue(prev => prev === '0' ? button : prev + button);
      } else if (button !== '3') {
        setDisplayValue(prev => prev === '0' ? button : prev + button);
      }
    }
  };

  const startRecording = async () => {
    if (!permission?.granted) {
      const { granted } = await requestPermission();
      if (!granted) {
        Alert.alert('Permission denied', 'Camera access required');
        return;
      }
    }

    if (!cameraReady) {
      Alert.alert('Camera Not Ready', 'Please wait for camera to initialize');
      return;
    }

    try {
      console.log('🟡 Starting recording...');
      setIsRecording(true);
      setRecordingStartTime(Date.now());
      setRecordingDuration(0);
      Vibration.vibrate(100);

      if (!cameraRef.current) {
        console.error('🔴 Camera ref is null');
        throw new Error('Camera not available');
      }

      console.log('🟡 Camera ref found, preparing to record...');
      
      // Longer delay to ensure camera is fully ready
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      console.log('🟡 Starting camera recording...');
      
      // Use a more reliable recording approach
      const recordingOptions = {
        quality: '480p',
        maxDuration: 300,
        mute: true,
        codec: 'h264', // Specify codec for better compatibility
      };

      console.log('🟡 Recording options:', recordingOptions);
      
      const recordingPromise = cameraRef.current.recordAsync(recordingOptions);
      setRecordingPromise(recordingPromise);
      
      console.log('🟢 Recording started successfully, waiting for completion...');
      
      // Start duration timer with longer initial delay
      setTimeout(() => {
        const interval = setInterval(() => {
          setRecordingDuration(prev => {
            const newDuration = prev + 1;
            console.log(`⏱️ Recording duration: ${newDuration}s`);
            return newDuration;
          });
        }, 1000);
        setDurationInterval(interval);
      }); 
      
      // Wait for recording promise
      const video = await recordingPromise;
      
      if (durationInterval) {
        clearInterval(durationInterval);
        setDurationInterval(null);
      }
      
      console.log('🟢 Recording completed, video URI:', video?.uri);
      
      if (video?.uri) {
        setVideoUri(video.uri);
        console.log('✅ Video URI set successfully');
        showUploadConfirmation(video.uri, recordingDuration);
      } else {
        console.error('🔴 No video URI received from recording');
        throw new Error('No video data produced');
      }
      
    } catch (error: any) {
      console.error('🔴 Error during recording process:', error);
      Alert.alert('Recording Error', 'Could not complete video recording. Please try again.');
      
      // Clean up state
      setIsRecording(false);
      setRecordingStartTime(null);
      setRecordingDuration(0);
      setRecordingPromise(null);
      if (durationInterval) {
        clearInterval(durationInterval);
        setDurationInterval(null);
      }
    }
  };

  const stopRecording = async () => {
    try {
      console.log('🟡 Stopping recording...');
      
      if (!cameraRef.current) {
        console.error('🔴 Camera ref is null during stop');
        throw new Error('Camera not available');
      }

      if (!isRecording) {
        console.log('🟡 No active recording to stop');
        return;
      }

      console.log('🟡 Stopping camera recording...');
      
      // Stop the recording
      cameraRef.current.stopRecording();
      
      console.log('🟢 Camera recording stopped command sent');
      
      // Clear interval
      if (durationInterval) {
        clearInterval(durationInterval);
        setDurationInterval(null);
      }
      
      const finalDuration = recordingDuration;
      console.log(`📊 Final recording duration: ${finalDuration} seconds`);
      
      setIsRecording(false);
      setRecordingStartTime(null);
      setRecordingDuration(0);
      setRecordingPromise(null);
      
      Vibration.vibrate([100, 50, 100]);
      
    } catch (error) {
      console.error('🔴 Error stopping recording:', error);
      Alert.alert('Error', 'Could not stop video recording.');
      
      // Clean up state
      setIsRecording(false);
      setRecordingStartTime(null);
      setRecordingDuration(0);
      setRecordingPromise(null);
      if (durationInterval) {
        clearInterval(durationInterval);
        setDurationInterval(null);
      }
    }
  };

  //  Upload Confirmation Alert 
  const showUploadConfirmation = (uri: string, duration: number) => {
    Alert.alert(
      'Recording Complete',
      `Recording duration: ${duration} seconds\n\nWould you like to upload this evidence or cancel?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => {
            setVideoUri(null);
            console.log('Upload canceled by user');
          }
        },
        {
          text: 'Upload',
          style: 'default',
          onPress: () => uploadVideo(uri, duration)
        }
      ],
      { cancelable: false }
    );
  };

  // ===== Video Upload =====
  const uploadVideo = async (uri: string, duration: number) => {
    try {
      console.log('🟡 Starting video upload...');
      const token = await AsyncStorage.getItem('auth_token');
      if (!token) throw new Error('No authentication token found');

      api.defaults.headers.Authorization = `Token ${token}`;

      const reportData = {
        title: 'Silently Captured Evidence',
        location_address: 'Recorded via stealth mode',
        recorded_at: new Date().toISOString(),
        is_anonymous: true,
        duration_seconds: duration,
      };

      console.log('🟡 Creating evidence record...');
      const res = await api.post('/aegis/evidence/submit/', reportData);
      const evidenceId = res.data.evidence_id;
      console.log('🟢 Evidence record created with ID:', evidenceId);

      const formData = new FormData();
      formData.append('video_file', {
        uri: uri,
        name: `silent_evidence_${Date.now()}.mp4`,
        type: 'video/mp4',
      } as any);
      formData.append('media_type', 'video');

      console.log('🟡 Uploading video file...');
      await api.post(`/aegis/evidence/${evidenceId}/upload/`, formData, {
        headers: { 
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('🟢 Video upload completed successfully');
      Alert.alert(
        'Evidence Uploaded', 
        'Video evidence has been uploaded securely.', 
        [{ text: 'OK' }]
      );
      
      setVideoUri(null);
      
    } catch (error: any) {
      console.error('🔴 Error uploading evidence:', error);
      let errorMessage = 'Failed to upload evidence. Please try again.';
      
      if (error.response?.data) {
        if (typeof error.response.data === 'object') {
          errorMessage = Object.values(error.response.data).flat().join('\n');
        } else {
          errorMessage = error.response.data;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Upload Error', errorMessage);
    }
  };

  // Calculator buttons layout
  const calculatorButtons = [
    ['C', '±', '%', '÷'],
    ['7', '8', '9', '×'],
    ['4', '5', '6', '−'],
    ['1', '2', '3', '+'],
    ['0', '.', '='],
  ];

  const getButtonStyle = (button: string) => {
    if (['÷', '×', '−', '+', '='].includes(button)) {
      return 'bg-amber-500 active:bg-amber-600';
    } else if (['C', '±', '%'].includes(button)) {
      return 'bg-gray-500 active:bg-gray-600';
    } else if (button === '3' && isRecording) {
      return 'bg-red-500 active:bg-red-600';
    } else if (button === '0' && isRecording) {
      return 'bg-green-500 active:bg-green-600';
    } else if (button === '3' && showProgress) {
      return 'bg-orange-500 active:bg-orange-600';
    }
    return 'bg-gray-800 active:bg-gray-700';
  };

  const getButtonSize = (button: string) => {
    if (button === '0') return 'flex-1 p-5 m-1';
    return 'flex-1 p-5 m-1';
  };

  return (
    <View className="flex-1 bg-gray-800">
      {/* Hidden Camera View - Larger but visually hidden */}
      {stealthMode && (
        <View 
          style={{ 
            position: 'absolute',
            top: 0,
            left: 0,
            opacity: 0.001,
            overflow: 'hidden',
            zIndex: -1,
          }}
        >
          <CameraView 
            style={{ flex: 1 }} 
            ref={cameraRef}
            facing="back"
            mute={true}
            onCameraReady={() => {
              console.log('🟢 Camera is ready');
              setCameraReady(true);
            }}
          />
        </View>
      )}

      {/* Calculator View */}
      <View className="flex-1 justify-end">
        {/* Header with stealth toggle */}
        <View className="absolute top-0 left-0 right-0 p-5 bg-transparent">
          <View className="flex-row justify-between items-center">
            <TouchableOpacity 
              onPress={() => router.back()} 
              className="p-3 rounded-full bg-gray-700 active:bg-gray-600"
            >
              <Text className="text-white text-lg">←</Text>
            </TouchableOpacity>
            
            <View className="flex-row items-center bg-gray-700 rounded-full px-4 py-2">
              <Text className="text-white mr-2 text-sm font-semibold">Stealth Mode</Text>
              <Switch
                value={stealthMode}
                onValueChange={setStealthMode}
                trackColor={{ false: '#767577', true: '#34C759' }}
                thumbColor="#f4f3f4"
              />
            </View>
          </View>
        </View>

        {/* Calculator Display */}
        <View className="bg-gray-900 p-6 rounded-t-2xl">
          <View className="min-h-[80px] justify-end">
            {previousValue !== '' && (
              <Text className="text-gray-400 text-right text-lg mb-1">
                {previousValue} {operation}
              </Text>
            )}
            <Text className="text-white text-right text-6xl font-light" numberOfLines={1}>
              {displayValue}
            </Text>
            {isRecording && (
              <Text className="text-red-400 text-right text-sm mt-2">
                ● Recording... {recordingDuration}s
              </Text>
            )}
            {!cameraReady && (
              <Text className="text-yellow-400 text-right text-sm mt-2">
                ⚡ Camera initializing...
              </Text>
            )}
          </View>
        </View>

        {/* Progress Indicator */}
        {showProgress && (
          <View className="absolute top-32 left-1/2 -translate-x-1/2 bg-gray-700 px-4 py-2 rounded-full">
            <Text className="text-white text-sm">
              Hold: {Math.round(pressProgress * 100)}%
            </Text>
          </View>
        )}

        {/* Calculator Keypad */}
        <View className="bg-gray-700 rounded-b-2xl p-2">
          {calculatorButtons.map((row, rowIndex) => (
            <View key={rowIndex} className="flex-row justify-between mb-2">
              {row.map((button, index) => (
                <TouchableOpacity
                  key={button || `empty-${index}`}
                  className={`rounded-2xl items-center justify-center ${getButtonSize(button)} ${getButtonStyle(button)} ${
                    !button ? 'opacity-0' : ''
                  }`}
                  onPress={() => button && handleCalculatorButton(button)}
                  onPressIn={() => button && handleButtonPressIn(button)}
                  onPressOut={() => button && handleButtonPressOut(button)}
                  disabled={!button || (button === '0' && !isRecording) || (!cameraReady && button === '3')}
                >
                  {button && (
                    <>
                      <Text className="text-white text-2xl font-semibold">
                        {button}
                      </Text>
                      
                      {button === '3' && showProgress && (
                        <View className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-orange-500 items-center justify-center">
                          <Text className="text-white text-xs font-bold">
                            {Math.round(pressProgress * 100)}
                          </Text>
                        </View>
                      )}
                    </>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          ))}
        </View>

        {/* Instructions Panel */}
        <View className="p-4 bg-gray-800">
          {stealthMode ? (
            <View className="bg-gray-700 rounded-xl p-4">
              <Text className="text-center text-gray-300 text-sm mb-2 font-medium">
                {isRecording 
                  ? `● Recording in progress... (${recordingDuration}s)` 
                  : showProgress
                    ? 'Keep holding to start recording...'
                    : !cameraReady
                      ? 'Camera initializing...'
                      : 'Stealth Mode Active'
                }
              </Text>
              <Text className="text-center text-gray-400 text-xs">
                {isRecording 
                  ? 'Press 0 to stop recording and upload securely'
                  : !cameraReady
                    ? 'Please wait for camera to be ready'
                    : 'Press and hold 3 for 3 seconds to start hidden recording'
                }
              </Text>
              {!isRecording && !showProgress && cameraReady && (
                <View className="flex-row justify-center items-center mt-2">
                  <View className="w-2 h-2 bg-red-500 rounded-full mr-2" />
                  <Text className="text-red-400 text-xs">Camera will activate silently</Text>
                </View>
              )}
            </View>
          ) : (
            <View className="bg-blue-500 rounded-xl p-4">
              <Text className="text-center text-white text-sm font-medium">
                Normal Mode
              </Text>
              <Text className="text-center text-white text-xs mt-1">
                Use standard camera interface for recording
              </Text>
            </View>
          )}
        </View>

        {/* Camera Preview for Non-Stealth Mode */}
        {!stealthMode && (
          <View className="absolute inset-0 bg-black pt-20">
            <View className="flex-1 mx-4 my-2 rounded-2xl overflow-hidden">
              <CameraView 
                style={{ flex: 1 }} 
                ref={cameraRef}
                facing="back"
                mute={true}
                onCameraReady={() => setCameraReady(true)}
              />
              <View className="absolute bottom-0 left-0 right-0 bg-transparent pb-8">
                <View className="flex-row justify-center">
                  <TouchableOpacity
                    onPress={isRecording ? stopRecording : startRecording}
                    disabled={!cameraReady}
                    className={`w-20 h-20 rounded-full border-4 ${
                      isRecording ? 'border-red-500 bg-red-500/20' : 
                      !cameraReady ? 'border-gray-500 bg-gray-500/20' : 'border-white bg-white/20'
                    } items-center justify-center`}
                  >
                    <View className={`w-12 h-12 rounded-lg ${
                      isRecording ? 'bg-red-500' : 
                      !cameraReady ? 'bg-gray-500' : 'bg-white'
                    }`} />
                  </TouchableOpacity>
                </View>
                {isRecording && (
                  <Text className="text-white text-center mt-4">
                    Recording... {recordingDuration}s
                  </Text>
                )}
                {!cameraReady && (
                  <Text className="text-yellow-400 text-center mt-4">
                    Camera initializing...
                  </Text>
                )}
              </View>
            </View>
            
            <TouchableOpacity 
              onPress={() => setStealthMode(true)}
              className="absolute top-4 right-4 p-3 rounded-full bg-black/50"
            >
              <Text className="text-white text-lg">✕</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}