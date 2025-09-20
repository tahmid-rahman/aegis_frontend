// app/silent-capture/index.tsx
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
    Alert,
    AppState,
    AppStateStatus,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useTheme } from '../../providers/ThemeProvider';

export default function SilentCapture() {
  const router = useRouter();
  const { effectiveTheme } = useTheme();
  const [permission, requestPermission] = useCameraPermissions();
  const [mediaPermission, requestMediaPermission] = MediaLibrary.usePermissions();
  const [isRecording, setIsRecording] = useState(false);
  const [captureMode, setCaptureMode] = useState<'photo' | 'video' | 'audio'>('photo');
  const [timer, setTimer] = useState(0);
  const [disguiseMode, setDisguiseMode] = useState(false);
  const timerRef = useRef<number | null>(null);
  const cameraRef = useRef<CameraView>(null);
  const [flashMode, setFlashMode] = useState<'on' | 'off'>('off');
  const appState = useRef(AppState.currentState);

  // Setup app state change listener for disguise mode
  useEffect(() => {
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      subscription.remove();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleAppStateChange = (nextAppState: AppStateStatus) => {
    if (appState.current.match(/active/) && nextAppState === 'background') {
      // App is minimizing, activate disguise
      setDisguiseMode(true);
    } else if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
      // App is coming to foreground, check if we need to maintain disguise
      if (isRecording) {
        setDisguiseMode(true);
      } else {
        setDisguiseMode(false);
      }
    }
    
    appState.current = nextAppState;
  };

  const startRecording = async () => {
    if (!permission?.granted) {
      await requestPermission();
      return;
    }

    if (!mediaPermission?.granted) {
      await requestMediaPermission();
      return;
    }

    setIsRecording(true);
    setDisguiseMode(true);
    
    // Start timer
    let seconds = 0;
    timerRef.current = setInterval(() => {
      seconds += 1;
      setTimer(seconds);
    }, 1000);

    // In a real app, this would actually start recording
    // For this example, we'll just simulate it
  };

  const stopRecording = async () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    setIsRecording(false);
    setTimer(0);
    setDisguiseMode(false);

    // Simulate saving media
    Alert.alert(
      'Evidence Captured',
      'Your evidence has been securely saved and encrypted.',
      [
        {
          text: 'Continue',
          onPress: () => router.back()
        }
      ]
    );
  };

  const toggleFlash = () => {
    setFlashMode(flashMode === 'on' ? 'off' : 'on');
  };

  const toggleDisguise = () => {
    setDisguiseMode(!disguiseMode);
  };

  // Disguise screen - appears as a calculator or other innocuous app
  if (disguiseMode) {
    return (
      <View className="flex-1 bg-gray-800 justify-end p-5">
        {/* Calculator Display */}
        <View className="bg-gray-900 p-5 rounded-t-lg">
          <Text className="text-white text-right text-5xl font-light">0</Text>
        </View>
        
        {/* Calculator Keypad */}
        <View className="bg-gray-700 rounded-b-lg">
          <View className="flex-row">
            <TouchableOpacity className="flex-1 p-5 items-center bg-gray-600 m-1 rounded-lg">
              <Text className="text-white text-2xl">C</Text>
            </TouchableOpacity>
            <TouchableOpacity className="flex-1 p-5 items-center bg-gray-600 m-1 rounded-lg">
              <Text className="text-white text-2xl">±</Text>
            </TouchableOpacity>
            <TouchableOpacity className="flex-1 p-5 items-center bg-gray-600 m-1 rounded-lg">
              <Text className="text-white text-2xl">%</Text>
            </TouchableOpacity>
            <TouchableOpacity className="flex-1 p-5 items-center bg-amber-500 m-1 rounded-lg">
              <Text className="text-white text-2xl">÷</Text>
            </TouchableOpacity>
          </View>
          
          <View className="flex-row">
            <TouchableOpacity className="flex-1 p-5 items-center bg-gray-800 m-1 rounded-lg">
              <Text className="text-white text-2xl">7</Text>
            </TouchableOpacity>
            <TouchableOpacity className="flex-1 p-5 items-center bg-gray-800 m-1 rounded-lg">
              <Text className="text-white text-2xl">8</Text>
            </TouchableOpacity>
            <TouchableOpacity className="flex-1 p-5 items-center bg-gray-800 m-1 rounded-lg">
              <Text className="text-white text-2xl">9</Text>
            </TouchableOpacity>
            <TouchableOpacity className="flex-1 p-5 items-center bg-amber-500 m-1 rounded-lg">
              <Text className="text-white text-2xl">×</Text>
            </TouchableOpacity>
          </View>
          
          <View className="flex-row">
            <TouchableOpacity className="flex-1 p-5 items-center bg-gray-800 m-1 rounded-lg">
              <Text className="text-white text-2xl">4</Text>
            </TouchableOpacity>
            <TouchableOpacity className="flex-1 p-5 items-center bg-gray-800 m-1 rounded-lg">
              <Text className="text-white text-2xl">5</Text>
            </TouchableOpacity>
            <TouchableOpacity className="flex-1 p-5 items-center bg-gray-800 m-1 rounded-lg">
              <Text className="text-white text-2xl">6</Text>
            </TouchableOpacity>
            <TouchableOpacity className="flex-1 p-5 items-center bg-amber-500 m-1 rounded-lg">
              <Text className="text-white text-2xl">-</Text>
            </TouchableOpacity>
          </View>
          
          <View className="flex-row">
            <TouchableOpacity className="flex-1 p-5 items-center bg-gray-800 m-1 rounded-lg">
              <Text className="text-white text-2xl">1</Text>
            </TouchableOpacity>
            <TouchableOpacity className="flex-1 p-5 items-center bg-gray-800 m-1 rounded-lg">
              <Text className="text-white text-2xl">2</Text>
            </TouchableOpacity>
            <TouchableOpacity className="flex-1 p-5 items-center bg-gray-800 m-1 rounded-lg">
              <Text className="text-white text-2xl">3</Text>
            </TouchableOpacity>
            <TouchableOpacity className="flex-1 p-5 items-center bg-amber-500 m-1 rounded-lg">
              <Text className="text-white text-2xl">+</Text>
            </TouchableOpacity>
          </View>
          
          <View className="flex-row">
            <TouchableOpacity 
              className="flex-2 p-5 items-center bg-gray-800 m-1 rounded-lg"
              onLongPress={stopRecording}
            >
              <Text className="text-white text-2xl">0</Text>
            </TouchableOpacity>
            <TouchableOpacity className="flex-1 p-5 items-center bg-gray-800 m-1 rounded-lg">
              <Text className="text-white text-2xl">.</Text>
            </TouchableOpacity>
            <TouchableOpacity className="flex-1 p-5 items-center bg-amber-500 m-1 rounded-lg">
              <Text className="text-white text-2xl">=</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Hidden stop recording button (long press on 0) */}
        <View className="absolute top-10 right-5">
          <Text className="text-red-500 text-sm">Recording: {formatTime(timer)}</Text>
        </View>
        
        <View className="absolute bottom-5 left-5">
          <TouchableOpacity onPress={toggleDisguise}>
            <Ionicons name="eye-off" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Normal capture screen
  return (
    <View className="flex-1 bg-black">
      {/* Camera Preview would go here - using a placeholder */}
      <View className="flex-1 bg-gray-900 justify-center items-center">
        <Ionicons name="camera" size={80} color="white" />
        <Text className="text-white mt-4 text-center">
          {isRecording ? `Recording: ${formatTime(timer)}` : 'Camera preview'}
        </Text>
      </View>

      {/* Controls */}
      <View className="absolute top-0 left-0 right-0 p-5 bg-black/50">
        <View className="flex-row justify-between items-center">
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="close" size={28} color="white" />
          </TouchableOpacity>
          
          <TouchableOpacity onPress={toggleFlash}>
            <Ionicons 
              name={flashMode === 'on' ? 'flash' : 'flash-off'} 
              size={28} 
              color="white" 
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Capture Mode Selector */}
      <View className="absolute top-20 left-0 right-0 items-center">
        <View className="bg-black/50 rounded-full p-2 flex-row">
          {(['photo', 'video', 'audio'] as const).map((mode) => (
            <TouchableOpacity
              key={mode}
              className={`px-4 py-2 rounded-full mx-1 ${captureMode === mode ? 'bg-white' : ''}`}
              onPress={() => setCaptureMode(mode)}
            >
              <Text className={captureMode === mode ? 'text-black' : 'text-white'}>
                {mode === 'photo' ? 'Photo' : mode === 'video' ? 'Video' : 'Audio'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Capture Button */}
      <View className="absolute bottom-10 left-0 right-0 items-center">
        {isRecording ? (
          <TouchableOpacity
            className="w-20 h-20 rounded-full bg-red-500 items-center justify-center border-4 border-white"
            onPress={stopRecording}
          >
            <View className="w-5 h-5 bg-white rounded-sm" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            className="w-20 h-20 rounded-full bg-white items-center justify-center border-4 border-gray-300"
            onPress={startRecording}
          >
            <View className="w-16 h-16 rounded-full bg-white border-4 border-gray-700" />
          </TouchableOpacity>
        )}
        
        <Text className="text-white mt-4">
          {isRecording ? 'Tap to stop' : 'Long press for disguise mode'}
        </Text>
      </View>

      {/* Disguise Mode Button */}
      <View className="absolute bottom-5 left-5">
        <TouchableOpacity onPress={toggleDisguise}>
          <Ionicons name="eye" size={24} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// Helper function to format time
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}