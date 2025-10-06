// app/user/learn/[id].tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ResizeMode, Video } from 'expo-av';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Linking,
  ScrollView,
  Share,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import Markdown from 'react-native-markdown-display';
import { useTheme } from '../../../providers/ThemeProvider';
import { api } from '../../../services/api';

const { width: screenWidth } = Dimensions.get('window');

// Define types matching backend API
interface ExternalLink {
  id: number;
  title: string;
  url: string;
  description: string;
  order: number;
}

interface QuizOption {
  id: number;
  text: string;
  order: number;
  is_correct: boolean;
}

interface QuizQuestion {
  id: number;
  question: string;
  explanation: string;
  options: QuizOption[];
  order: number;
}

interface UserProgress {
  completed: boolean;
  progress_percentage: number;
  bookmarked: boolean;
  time_spent: number;
}

interface LearningResource {
  id: number;
  title: string;
  description: string;
  content: string;
  resource_type: string;
  difficulty: string;
  duration: string;
  icon: string;
  category: number;
  category_name: string;
  video_url?: string;
  thumbnail?: string;
  external_links: ExternalLink[];
  quiz_questions: QuizQuestion[];
  user_progress?: UserProgress;
  is_bookmarked?: boolean;
  created_at: string;
  updated_at: string;
}

interface QuizAnswer {
  question_id: number;
  option_id: number;
}

interface QuizSubmission {
  answers: QuizAnswer[];
  time_spent: number;
}

interface QuizResult {
  score: number;
  correct_answers: number;
  total_questions: number;
  attempt_id: number;
  message: string;
}

export default function LearningResourceDetail() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { effectiveTheme } = useTheme();
  const [resource, setResource] = useState<LearningResource | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizResults, setQuizResults] = useState<QuizResult | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [videoError, setVideoError] = useState(false);
  const videoRef = useRef<Video>(null);

  const resourceId = params.id as string;

  const fetchResource = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('auth_token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await api.get(`/aegis/learn/resources/${resourceId}/`);
      setResource(response.data);
      
      // Reset quiz state when loading new resource
      setSelectedAnswers({});
      setQuizSubmitted(false);
      setQuizResults(null);
      setVideoError(false);
      
    } catch (error: any) {
      console.error('Error fetching resource:', error);
      if (error.response?.status === 404) {
        Alert.alert('Not Found', 'The requested resource was not found.');
        router.back();
      } else if (error.response?.status === 401) {
        Alert.alert('Session Expired', 'Please login again');
        router.push('/login');
      } else {
        Alert.alert('Error', 'Failed to load resource. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleBookmark = async () => {
    if (!resource) return;

    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (!token) return;

      const response = await api.post(`/aegis/learn/resources/${resource.id}/bookmark/`);
      
      setResource(prev => prev ? {
        ...prev,
        is_bookmarked: response.data.bookmarked,
        user_progress: {
          ...(prev.user_progress ?? { 
            completed: false, 
            progress_percentage: 0, 
            bookmarked: false, 
            time_spent: 0 
          }),
          bookmarked: response.data.bookmarked
        }
      } : null);

    } catch (error: any) {
      console.error('Error toggling bookmark:', error);
      Alert.alert('Error', 'Failed to update bookmark. Please try again.');
    }
  };

  const submitQuiz = async () => {
    if (!resource?.quiz_questions) return;
    
    const allAnswered = resource.quiz_questions.every((question, index) => 
      selectedAnswers[index] !== undefined
    );
    
    if (!allAnswered) {
      Alert.alert("Incomplete Quiz", "Please answer all questions before submitting.");
      return;
    }

    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (!token) return;

      // Prepare answers in the required format
      const answers: QuizAnswer[] = [];
      Object.entries(selectedAnswers).forEach(([questionIndex, optionId]) => {
        const question = resource.quiz_questions[parseInt(questionIndex)];
        if (question) {
          answers.push({
            question_id: question.id,
            option_id: optionId
          });
        }
      });

      const submissionData: QuizSubmission = {
        answers: answers,
        time_spent: Math.floor(resource.quiz_questions.length * 30) // 30 seconds per question
      };

      const response = await api.post<QuizResult>(
        `/aegis/learn/resources/${resource.id}/quiz/submit/`,
        submissionData
      );

      setQuizSubmitted(true);
      setQuizResults(response.data);
      
      // Update local resource progress
      setResource(prev => prev ? {
        ...prev,
        user_progress: {
          completed: true,
          progress_percentage: 100,
          bookmarked: prev.user_progress?.bookmarked || false,
          time_spent: (prev.user_progress?.time_spent || 0) + submissionData.time_spent
        }
      } : null);

      Alert.alert(
        "Quiz Completed!", 
        `You scored ${response.data.correct_answers}/${response.data.total_questions} (${Math.round(response.data.score)}%)`,
        [{ text: "OK" }]
      );

    } catch (error: any) {
      console.error('Error submitting quiz:', error);
      Alert.alert('Error', 'Failed to submit quiz. Please try again.');
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out this safety resource: ${resource?.title} - ${resource?.description}`,
        url: `https://yourapp.com/learn/${resourceId}`
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleExternalLink = (url: string) => {
    Linking.openURL(url).catch(err => {
      console.error('Failed to open URL:', err);
      Alert.alert('Error', 'Could not open the link');
    });
  };

  const handleAnswerSelect = (questionIndex: number, optionId: number) => {
    if (quizSubmitted) return;
    
    setSelectedAnswers(prev => ({
      ...prev,
      [questionIndex]: optionId
    }));
  };

  const handleQuizReset = () => {
    setSelectedAnswers({});
    setQuizSubmitted(false);
    setQuizResults(null);
  };

  const getOptionStatus = (questionIndex: number, option: QuizOption) => {
    if (!quizSubmitted) {
      return selectedAnswers[questionIndex] === option.id ? 'selected' : 'default';
    }
    
    if (option.is_correct) {
      return 'correct';
    }
    
    if (selectedAnswers[questionIndex] === option.id && !option.is_correct) {
      return 'incorrect';
    }
    
    return 'default';
  };

  const handleVideoError = (error: string) => {
    console.error('Video player error:', error);
    setVideoError(true);
    Alert.alert('Video Error', 'Could not load the video. Please check your connection.');
  };

  useEffect(() => {
    if (resourceId) {
      fetchResource();
    }
  }, [resourceId]);

  const themeSuffix = effectiveTheme === "dark" ? "-dark" : "";

  if (loading) {
    return (
      <View className={`flex-1 bg-background${themeSuffix} items-center justify-center`}>
        <ActivityIndicator size="large" color={effectiveTheme === 'dark' ? '#fff' : '#000'} />
        <Text className={`text-on-surface${themeSuffix} mt-4`}>Loading resource...</Text>
      </View>
    );
  }

  if (!resource) {
    return (
      <View className={`flex-1 bg-background${themeSuffix} items-center justify-center`}>
        <Text className={`text-on-surface${themeSuffix} text-lg mb-4`}>Resource not found</Text>
        <TouchableOpacity 
          onPress={() => router.back()} 
          className="bg-primary px-6 py-3 rounded-lg"
        >
          <Text className="text-on-primary font-semibold">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className={`flex-1 bg-background${themeSuffix}`}>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className={`px-6 pt-6 pb-4`}>
          <TouchableOpacity 
            onPress={() => router.back()}
            className="mb-4 flex-row items-center"
            activeOpacity={0.7}
          >
            <Text className="text-primary text-lg font-semibold">← Back to Resources</Text>
          </TouchableOpacity>

          <View className="flex-row justify-between items-start mb-2">
            <View className="flex-1 mr-3">
              <Text className={`text-2xl font-bold text-on-surface${themeSuffix} mb-2`}>
                {resource.title}
              </Text>
              <Text className={`text-on-surface-variant${themeSuffix} text-base`}>
                {resource.description}
              </Text>
            </View>
            <TouchableOpacity 
              onPress={toggleBookmark}
              className="p-3 bg-surface-variant-dark rounded-full"
              activeOpacity={0.7}
            >
              <Text className="text-2xl">
                {resource.is_bookmarked ? '📑' : '📄'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Metadata */}
          <View className="flex-row flex-wrap items-center mt-4">
            <View className="bg-primary/20 px-3 py-1 rounded-full mr-3 mb-2">
              <Text className="text-primary text-sm font-medium capitalize">
                {resource.resource_type}
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
            {resource.category_name && (
              <View className="bg-blue-100 px-3 py-1 rounded-full mb-2">
                <Text className="text-blue-800 text-sm font-medium">
                  {resource.category_name}
                </Text>
              </View>
            )}
          </View>

          {/* Progress Display */}
          {resource.user_progress && (
            <View className="mt-4">
              <View className="flex-row justify-between items-center mb-2">
                <Text className={`text-on-surface${themeSuffix} text-sm font-medium`}>
                  Your Progress
                </Text>
                <Text className={`text-on-surface${themeSuffix} text-sm font-medium`}>
                  {resource.user_progress.progress_percentage}%
                </Text>
              </View>
              <View className="w-full bg-gray-300 rounded-full h-3">
                <View 
                  className="bg-primary rounded-full h-3" 
                  style={{ width: `${resource.user_progress.progress_percentage}%` }}
                />
              </View>
            </View>
          )}
        </View>

        {/* Video Player */}
        {resource.resource_type === "video" && resource.video_url && !videoError && (
          <View className="px-6 mb-6">
            <Text className={`text-lg font-semibold text-on-surface${themeSuffix} mb-3`}>
              Video Content
            </Text>
            <Video
              ref={videoRef}
              source={{ uri: resource.video_url }}
              rate={1.0}
              volume={1.0}
              isMuted={false}
              resizeMode={ResizeMode.CONTAIN}
              shouldPlay={isPlaying}
              isLooping={false}
              useNativeControls
              className="w-full h-48 rounded-xl"
              onError={() => handleVideoError('Video playback error')}
              onPlaybackStatusUpdate={(status: any) => {
                if (status.isLoaded) {
                  setIsPlaying(status.isPlaying);
                }
              }}
            />
            {videoError && (
              <View className="bg-red-100 p-4 rounded-xl mt-2">
                <Text className="text-red-800 text-center">
                  Video unavailable. Please check your connection.
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Quiz Component */}
        {resource.resource_type === "quiz" && resource.quiz_questions && (
          <View className="px-6 mb-6">
            <View className="flex-row justify-between items-center mb-4">
              <Text className={`text-xl font-bold text-on-surface${themeSuffix}`}>
                Knowledge Check
              </Text>
              <Text className={`text-on-surface-variant${themeSuffix} font-medium`}>
                {resource.quiz_questions.length} {resource.quiz_questions.length === 1 ? 'question' : 'questions'}
              </Text>
            </View>
            
            {quizResults && (
              <View className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
                <Text className="text-green-800 text-center font-semibold text-lg">
                  Score: {Math.round(quizResults.score)}% ({quizResults.correct_answers}/{quizResults.total_questions})
                </Text>
              </View>
            )}
            
            {resource.quiz_questions.map((question, qIndex) => (
              <View key={question.id} className={`mb-6 bg-surface${themeSuffix} p-4 rounded-xl border border-outline${themeSuffix}`}>
                <Text className={`text-lg font-semibold text-on-surface${themeSuffix} mb-3`}>
                  {qIndex + 1}. {question.question}
                </Text>
                
                {question.options.map((option) => {
                  const status = getOptionStatus(qIndex, option);
                  const bgColor = {
                    default: `bg-surface${themeSuffix}`,
                    selected: "bg-blue-100 border-blue-500",
                    correct: "bg-green-100 border-green-500",
                    incorrect: "bg-red-100 border-red-500"
                  }[status];

                  const textColor = {
                    default: `text-on-surface${themeSuffix}`,
                    selected: "text-blue-800",
                    correct: "text-green-800",
                    incorrect: "text-red-800"
                  }[status];

                  const borderColor = {
                    default: `border-outline${themeSuffix}`,
                    selected: "border-blue-500",
                    correct: "border-green-500",
                    incorrect: "border-red-500"
                  }[status];

                  return (
                    <TouchableOpacity
                      key={option.id}
                      onPress={() => handleAnswerSelect(qIndex, option.id)}
                      disabled={quizSubmitted}
                      className={`${bgColor} p-4 rounded-lg mb-2 border-2 ${borderColor}`}
                      activeOpacity={0.7}
                    >
                      <Text className={`${textColor} font-medium`}>
                        {String.fromCharCode(65 + question.options.indexOf(option))}. {option.text}
                        {quizSubmitted && option.is_correct && " ✓"}
                        {status === 'incorrect' && " ✗"}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
                
                {quizSubmitted && question.explanation && (
                  <View className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <Text className="text-blue-800 font-medium">
                      💡 {question.explanation}
                    </Text>
                  </View>
                )}
              </View>
            ))}
            
            {!quizSubmitted ? (
              <TouchableOpacity
                onPress={submitQuiz}
                className="bg-primary px-6 py-4 rounded-xl shadow-lg"
                activeOpacity={0.8}
              >
                <Text className="text-on-primary text-center font-semibold text-lg">
                  Submit Answers
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={handleQuizReset}
                className="bg-gray-500 px-6 py-4 rounded-xl"
                activeOpacity={0.8}
              >
                <Text className="text-white text-center font-semibold text-lg">
                  Try Again
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Content for articles, guides, tutorials */}
        {(resource.resource_type === "article" || resource.resource_type === "guide" || resource.resource_type === "tutorial") && resource.content && (
          <View className="px-6 pb-6">
            <Text className={`text-xl font-bold text-on-surface${themeSuffix} mb-4`}>
              Content
            </Text>
            <View className={`bg-surface${themeSuffix} rounded-xl p-5 border border-outline${themeSuffix}`}>
              <Markdown
                style={{
                  body: { 
                    color: effectiveTheme === 'dark' ? '#e5e5e5' : '#374151',
                    fontSize: 16,
                    lineHeight: 24
                  },
                  paragraph: { 
                    marginBottom: 16,
                  },
                  heading1: { 
                    fontSize: 24, 
                    fontWeight: 'bold', 
                    marginBottom: 16,
                    color: effectiveTheme === 'dark' ? '#ffffff' : '#111827'
                  },
                  heading2: { 
                    fontSize: 20, 
                    fontWeight: 'bold', 
                    marginBottom: 12,
                    color: effectiveTheme === 'dark' ? '#ffffff' : '#111827'
                  },
                  heading3: { 
                    fontSize: 18, 
                    fontWeight: 'bold', 
                    marginBottom: 8,
                    color: effectiveTheme === 'dark' ? '#ffffff' : '#111827'
                  },
                  list_item: { 
                    marginBottom: 8,
                  },
                  bullet_list: { 
                    marginBottom: 16,
                  },
                  code_inline: {
                    backgroundColor: effectiveTheme === 'dark' ? '#374151' : '#f3f4f6',
                    color: effectiveTheme === 'dark' ? '#e5e5e5' : '#374151',
                    paddingHorizontal: 6,
                    paddingVertical: 2,
                    borderRadius: 4,
                    fontFamily: 'monospace',
                  },
                }}
              >
                {resource.content}
              </Markdown>
            </View>
          </View>
        )}

        {/* External Links */}
        {resource.external_links && resource.external_links.length > 0 && (
          <View className="px-6 pb-6">
            <Text className={`text-xl font-bold text-on-surface${themeSuffix} mb-4`}>
              Additional Resources
            </Text>
            {resource.external_links.map((link) => (
              <TouchableOpacity
                key={link.id}
                className={`bg-surface${themeSuffix} p-4 rounded-xl mb-3 border border-outline${themeSuffix}`}
                onPress={() => handleExternalLink(link.url)}
                activeOpacity={0.7}
              >
                <Text className="text-primary font-semibold text-lg mb-1">
                  {link.title}
                </Text>
                {link.description && (
                  <Text className={`text-on-surface-variant${themeSuffix} text-base`}>
                    {link.description}
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Action Buttons */}
      {/* <View className={`px-6 py-4 bg-surface${themeSuffix} border-t border-outline${themeSuffix}`}>
        <View className="flex-row justify-between">
          <TouchableOpacity 
            className={`bg-surface-variant${themeSuffix} px-4 py-3 rounded-lg flex-1 mr-3 border border-outline${themeSuffix}`}
            onPress={handleShare}
            activeOpacity={0.7}
          >
            <Text className={`text-on-surface${themeSuffix} text-center font-medium`}>
              Share
            </Text>
          </TouchableOpacity>
          
          {resource.resource_type === "quiz" ? (
            <TouchableOpacity 
              className="bg-primary px-4 py-3 rounded-lg flex-1 shadow-lg"
              onPress={quizSubmitted ? handleQuizReset : submitQuiz}
              activeOpacity={0.7}
            >
              <Text className="text-on-primary text-center font-semibold">
                {quizSubmitted ? "Try Again" : "Submit Quiz"}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              className="bg-primary px-4 py-3 rounded-lg flex-1 shadow-lg"
              onPress={() => {
                // Mark as completed if viewing for first time
                if (resource.user_progress && !resource.user_progress.completed) {
                  // API call to mark as completed could go here
                }
                router.push('/panic-confirm');
              }}
              activeOpacity={0.7}
            >
              <Text className="text-on-primary text-center font-semibold">
                Practice Drill
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View> */}
    </View>
  );
}