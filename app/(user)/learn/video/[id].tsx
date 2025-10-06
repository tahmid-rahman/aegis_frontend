// app/user/learn/video/[id].tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Linking,
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useTheme } from '../../../../providers/ThemeProvider';
import { api } from '../../../../services/api';

const { width: screenWidth } = Dimensions.get('window');

interface ExternalLink {
  id: number;
  title: string;
  url: string;
  description: string;
  order: number;
}

interface LearningResource {
  id: number;
  title: string;
  description: string;
  content: string;
  resource_type: string;
  difficulty: string;
  duration: string;
  video_url: string;
  thumbnail?: string;
  external_links: ExternalLink[];
  user_progress?: {
    completed: boolean;
    progress_percentage: number;
    bookmarked: boolean;
    time_spent: number;
  };
  is_bookmarked?: boolean;
  created_at: string;
  updated_at: string;
}

export default function VideoScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { effectiveTheme } = useTheme();
  
  const [resource, setResource] = useState<LearningResource | null>(null);
  const [loading, setLoading] = useState(true);
  const [videoError, setVideoError] = useState(false);
  const [videoStarted, setVideoStarted] = useState(false);
  const [videoCompleted, setVideoCompleted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [watchTime, setWatchTime] = useState(0);

  const resourceId = params.id as string;

  const fetchVideo = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('auth_token');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await api.get(`/aegis/learn/resources/${resourceId}/`);
      
      if (response.data.resource_type !== 'video') {
        Alert.alert('Error', 'This resource is not a video');
        router.back();
        return;
      }

      if (!response.data.video_url) {
        Alert.alert('Error', 'Video URL not available');
        router.back();
        return;
      }

      setResource(response.data);
      
    } catch (error: any) {
      console.error('Error fetching video:', error);
      Alert.alert('Error', 'Failed to load video. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getYouTubeVideoId = (url: string): string | null => {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  const getYouTubeEmbedUrl = (url: string): string => {
    const videoId = getYouTubeVideoId(url);
    if (!videoId) return url;

    // Auto-play with modest branding and related videos off
    return `https://www.youtube.com/embed/${videoId}?autoplay=1&modestbranding=1&rel=0&playsinline=1`;
  };

  const isYouTubeUrl = (url: string): boolean => {
    return url.includes('youtube.com') || url.includes('youtu.be');
  };

  const openInYouTubeApp = async () => {
    if (!resource?.video_url) return;

    try {
      // Try to open in YouTube app first
      const youtubeAppUrl = resource.video_url.replace('https://www.youtube.com', 'youtube://');
      const canOpen = await Linking.canOpenURL(youtubeAppUrl);
      
      if (canOpen) {
        await Linking.openURL(youtubeAppUrl);
      } else {
        // Fallback to browser
        await Linking.openURL(resource.video_url);
      }
    } catch (error) {
      console.error('Error opening YouTube:', error);
      Alert.alert('Error', 'Could not open YouTube. Please make sure the app is installed.');
    }
  };

  const openInBrowser = async () => {
    if (!resource?.video_url) return;

    try {
      await Linking.openURL(resource.video_url);
    } catch (error) {
      console.error('Error opening browser:', error);
      Alert.alert('Error', 'Could not open the video link.');
    }
  };

  const markAsCompleted = async () => {
    if (!resource) return;

    try {
      // Update local state
      setVideoCompleted(true);
      setProgress(100);
      
      // Update resource progress
      setResource(prev => prev ? {
        ...prev,
        user_progress: {
          completed: true,
          progress_percentage: 100,
          bookmarked: prev.user_progress?.bookmarked || false,
          time_spent: watchTime + 300 // Add 5 minutes as estimated watch time
        }
      } : null);

      // You might want to make an API call here to update progress on backend
      // await api.post(`/aegis/learn/resources/${resource.id}/progress/`, {
      //   completed: true,
      //   progress_percentage: 100,
      //   time_spent: watchTime + 300
      // });

    } catch (error) {
      console.error('Error marking as completed:', error);
    }
  };

  const handleWebViewMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      
      switch (data.event) {
        case 'video_started':
          setVideoStarted(true);
          break;
        case 'video_progress':
          setProgress(data.progress);
          break;
        case 'video_completed':
          setVideoCompleted(true);
          markAsCompleted();
          break;
        case 'video_error':
          setVideoError(true);
          break;
      }
    } catch (error) {
      console.error('Error parsing WebView message:', error);
    }
  };

  const getVideoSourceHTML = (url: string) => {
    if (isYouTubeUrl(url)) {
      const embedUrl = getYouTubeEmbedUrl(url);
      return `
        <!DOCTYPE html>
        <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              margin: 0;
              background: #000;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
            }
            .video-container {
              width: 100%;
              height: 100%;
            }
            iframe {
              width: 100%;
              height: 100%;
              border: none;
            }
          </style>
        </head>
        <body>
          <div class="video-container">
            <iframe 
              src="${embedUrl}"
              allow="autoplay; encrypted-media; picture-in-picture" 
              allowfullscreen>
            </iframe>
          </div>
          <script>
            // YouTube API would require additional setup for precise tracking
            // For now, we'll use basic timing
            setTimeout(() => {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                event: 'video_started'
              }));
            }, 2000);

            // Simulate progress updates
            let progress = 0;
            const progressInterval = setInterval(() => {
              progress += 5;
              if (progress >= 100) {
                progress = 100;
                clearInterval(progressInterval);
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  event: 'video_completed'
                }));
              }
              window.ReactNativeWebView.postMessage(JSON.stringify({
                event: 'video_progress',
                progress: progress
              }));
            }, 3000);
          </script>
        </body>
        </html>
      `;
    } else {
      // For other video URLs, show a message and open in browser
      return `
        <!DOCTYPE html>
        <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              margin: 0;
              background: #000;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              color: white;
              font-family: Arial, sans-serif;
              text-align: center;
              padding: 20px;
            }
            .message {
              max-width: 300px;
            }
          </style>
        </head>
        <body>
          <div class="message">
            <h2>External Video</h2>
            <p>This video will open in your browser or YouTube app.</p>
            <p>Tap the button below to watch.</p>
          </div>
        </body>
        </html>
      `;
    }
  };

  useEffect(() => {
    if (resourceId) {
      fetchVideo();
    }
  }, [resourceId]);

  // Track watch time
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (videoStarted && !videoCompleted) {
      timer = setInterval(() => {
        setWatchTime(prev => prev + 1);
      }, 1000);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [videoStarted, videoCompleted]);

  const themeSuffix = effectiveTheme === "dark" ? "-dark" : "";

  if (loading) {
    return (
      <View className={`flex-1 bg-background${themeSuffix} items-center justify-center`}>
        <ActivityIndicator size="large" color={effectiveTheme === 'dark' ? '#fff' : '#000'} />
        <Text className={`text-on-surface${themeSuffix} mt-4`}>Loading video...</Text>
      </View>
    );
  }

  if (!resource) {
    return (
      <View className={`flex-1 bg-background${themeSuffix} items-center justify-center`}>
        <Text className={`text-on-surface${themeSuffix} text-lg mb-4`}>Video not found</Text>
        <TouchableOpacity 
          onPress={() => router.back()} 
          className="bg-primary px-6 py-3 rounded-lg"
        >
          <Text className="text-on-primary font-semibold">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isYouTube = isYouTubeUrl(resource.video_url);

  return (
    <View className={`flex-1 bg-background${themeSuffix}`}>
      {/* Video Player Container */}
      <View className="relative bg-black" style={{ height: screenWidth * 0.75 }}>
        {videoError ? (
          <View className="flex-1 items-center justify-center">
            <Text className="text-6xl mb-4">❌</Text>
            <Text className="text-white text-lg text-center mb-4">
              Video unavailable
            </Text>
            <Text className="text-gray-400 text-center mb-6 px-4">
              There was an error loading the video.
            </Text>
            <View className="flex-row space-x-4">
              <TouchableOpacity 
                onPress={() => setVideoError(false)}
                className="bg-primary px-4 py-2 rounded-lg"
              >
                <Text className="text-white font-semibold">Retry</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={openInYouTubeApp}
                className="bg-red-600 px-4 py-2 rounded-lg"
              >
                <Text className="text-white font-semibold">Open in YouTube</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : isYouTube ? (
          <WebView
            source={{ html: getVideoSourceHTML(resource.video_url) }}
            style={{ flex: 1 }}
            onMessage={handleWebViewMessage}
            onError={() => setVideoError(true)}
            allowsFullscreenVideo={true}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={true}
            renderLoading={() => (
              <View className="flex-1 bg-black items-center justify-center">
                <ActivityIndicator size="large" color="#fff" />
                <Text className="text-white mt-4">Loading YouTube video...</Text>
              </View>
            )}
          />
        ) : (
          <View className="flex-1 items-center justify-center">
            <Text className="text-4xl mb-4">🎬</Text>
            <Text className="text-white text-lg text-center mb-4">
              External Video Content
            </Text>
            <Text className="text-gray-400 text-center mb-6 px-4">
              This video is hosted on an external platform.
            </Text>
            <TouchableOpacity 
              onPress={openInBrowser}
              className="bg-primary px-6 py-3 rounded-lg"
            >
              <Text className="text-white font-semibold text-lg">
                Watch in Browser
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Progress Bar */}
      <View className="bg-surface-dark px-4 py-2 border-b border-outline-dark">
        <View className="flex-row justify-between items-center mb-1">
          <Text className="text-on-surface-dark text-sm font-medium">
            {videoCompleted ? 'Completed' : videoStarted ? 'Watching...' : 'Ready to watch'}
          </Text>
          <Text className="text-on-surface-dark text-sm font-medium">
            {Math.round(progress)}%
          </Text>
        </View>
        <View className="w-full bg-gray-700 rounded-full h-2">
          <View 
            className="bg-primary rounded-full h-2" 
            style={{ width: `${progress}%` }}
          />
        </View>
      </View>

      {/* Video Info and Content */}
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="p-6">
          {/* Header */}
          <View className="mb-6">
            <TouchableOpacity 
              onPress={() => router.back()}
              className="mb-4"
            >
              <Text className="text-primary text-lg font-semibold">← Back</Text>
            </TouchableOpacity>

            <Text className={`text-2xl font-bold text-on-surface${themeSuffix} mb-2`}>
              {resource.title}
            </Text>
            <Text className={`text-on-surface-variant${themeSuffix} text-base mb-4`}>
              {resource.description}
            </Text>

            {/* Metadata */}
            <View className="flex-row flex-wrap items-center">
              <View className="bg-primary/20 px-3 py-1 rounded-full mr-3 mb-2">
                <Text className="text-primary text-sm font-medium">
                  Video
                </Text>
              </View>
              <View className="bg-secondary/20 px-3 py-1 rounded-full mr-3 mb-2">
                <Text className="text-secondary text-sm font-medium capitalize">
                  {resource.difficulty}
                </Text>
              </View>
              <View className="bg-green-100 px-3 py-1 rounded-full mr-3 mb-2">
                <Text className="text-green-800 text-sm font-medium">
                  {resource.duration}
                </Text>
              </View>
              {isYouTube && (
                <View className="bg-red-100 px-3 py-1 rounded-full mb-2">
                  <Text className="text-red-800 text-sm font-medium">
                    YouTube
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Watch Progress */}
          <View className="bg-surface-dark rounded-xl p-4 mb-6">
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-on-surface-dark font-medium">Your Progress</Text>
              <Text className="text-on-surface-dark font-medium">
                {Math.round(resource.user_progress?.progress_percentage || 0)}%
              </Text>
            </View>
            <View className="w-full bg-gray-700 rounded-full h-2">
              <View 
                className="bg-primary rounded-full h-2" 
                style={{ width: `${resource.user_progress?.progress_percentage || 0}%` }}
              />
            </View>
            {videoCompleted && (
              <Text className="text-green-400 text-sm mt-2 font-medium">
                ✅ Video Completed
              </Text>
            )}
            {watchTime > 0 && (
              <Text className="text-blue-400 text-sm mt-1">
                ⏱️ Watched: {watchTime > 60 
                  ? `${Math.floor(watchTime / 60)}m ${watchTime % 60}s`
                  : `${watchTime}s`
                }
              </Text>
            )}
          </View>

          {/* Video Description */}
          {resource.content && (
            <View className="mb-6">
              <Text className="text-xl font-bold text-on-surface-dark mb-3">
                About this Video
              </Text>
              <View className="bg-surface-dark rounded-xl p-4">
                <Text className="text-on-surface-dark leading-6">
                  {resource.content}
                </Text>
              </View>
            </View>
          )}

          {/* Action Buttons for External Videos */}
          {!isYouTube && (
            <View className="mb-6">
              <Text className="text-xl font-bold text-on-surface-dark mb-3">
                Watch Video
              </Text>
              <View className="space-y-3">
                <TouchableOpacity 
                  onPress={openInBrowser}
                  className="bg-primary py-4 rounded-xl items-center"
                >
                  <Text className="text-on-primary font-semibold text-lg">
                    🎬 Watch in Browser
                  </Text>
                </TouchableOpacity>
                <Text className="text-on-surface-variant-dark text-center text-sm">
                  The video will open in your default browser
                </Text>
              </View>
            </View>
          )}

          {/* Manual Completion Button */}
          {!videoCompleted && (
            <TouchableOpacity 
              onPress={markAsCompleted}
              className="bg-green-600 py-3 rounded-xl mb-6 items-center"
            >
              <Text className="text-white font-semibold">
                ✅ Mark as Completed
              </Text>
            </TouchableOpacity>
          )}

          {/* External Links */}
          {resource.external_links && resource.external_links.length > 0 && (
            <View className="mb-6">
              <Text className="text-xl font-bold text-on-surface-dark mb-3">
                Additional Resources
              </Text>
              {resource.external_links.map((link) => (
                <TouchableOpacity
                  key={link.id}
                  className="bg-surface-dark p-4 rounded-xl mb-3 border border-outline-dark"
                  onPress={() => Linking.openURL(link.url)}
                >
                  <Text className="text-primary font-semibold text-lg mb-1">
                    {link.title}
                  </Text>
                  {link.description && (
                    <Text className="text-on-surface-variant-dark text-base">
                      {link.description}
                    </Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}