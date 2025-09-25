import AsyncStorage from '@react-native-async-storage/async-storage';
import { ResizeMode, Video } from 'expo-av';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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

export default function LearningResource() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { effectiveTheme } = useTheme();
  const [resource, setResource] = useState<LearningResource | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizResults, setQuizResults] = useState<QuizResult | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const videoRef = useRef<Video>(null);

  const fetchResource = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('auth_token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      api.defaults.headers.Authorization = `Token ${token}`;
      const response = await api.get(`/aegis/learn/resources/${params.id}/`);
      setResource(response.data);
      
    } catch (error: any) {
      console.error('Error fetching resource:', error);
      Alert.alert('Error', 'Failed to load resource. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleBookmark = async () => {
    if (!resource) return;

    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (!token) return;

      api.defaults.headers.Authorization = `Token ${token}`;
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

      api.defaults.headers.Authorization = `Token ${token}`;
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
        "Quiz Results", 
        `You scored ${response.data.correct_answers}/${response.data.total_questions} (${Math.round(response.data.score)}%)!`,
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
        url: `https://yourapp.com/learn/${params.id}`
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleExternalLink = (url: string) => {
    Linking.openURL(url).catch(err => console.error('Failed to open URL:', err));
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

  useEffect(() => {
    if (params.id) {
      fetchResource();
      setSelectedAnswers({});
      setQuizSubmitted(false);
      setQuizResults(null);
    }
  }, [params.id]);

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
        <Text className={`text-on-surface${themeSuffix}`}>Resource not found</Text>
        <TouchableOpacity onPress={() => router.back()} className="mt-4 bg-primary px-6 py-3 rounded-lg">
          <Text className="text-on-primary">Go Back</Text>
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
            className="mb-4"
            activeOpacity={0.7}
          >
            <Text className="text-primary text-lg">← Back</Text>
          </TouchableOpacity>

          <View className="flex-row justify-between items-start mb-2">
            <View className="flex-1">
              <Text className={`text-2xl font-bold text-on-surface${themeSuffix}`}>
                {resource.title}
              </Text>
              <Text className={`text-on-surface-variant${themeSuffix} mt-1`}>
                {resource.description}
              </Text>
            </View>
            <TouchableOpacity 
              onPress={toggleBookmark}
              className="p-2"
              activeOpacity={0.7}
            >
              <Text className="text-2xl">{resource.is_bookmarked ? '📑' : '📄'}</Text>
            </TouchableOpacity>
          </View>

          <View className="flex-row flex-wrap items-center mt-4">
            <View className="bg-primary/10 px-3 py-1 rounded-full mr-3 mb-2">
              <Text className="text-primary text-sm capitalize">{resource.resource_type}</Text>
            </View>
            <View className="bg-secondary/10 px-3 py-1 rounded-full mr-3 mb-2">
              <Text className="text-secondary text-sm capitalize">{resource.difficulty}</Text>
            </View>
            <Text className={`text-on-surface-variant${themeSuffix} text-sm mr-3 mb-2`}>
              {resource.duration}
            </Text>
            <Text className={`text-on-surface-variant${themeSuffix} text-sm mb-2`}>
              {resource.category_name}
            </Text>
          </View>

          {/* Progress Display */}
          {resource.user_progress && (
            <View className="mt-4">
              <View className="flex-row justify-between items-center mb-1">
                <Text className={`text-on-surface${themeSuffix} text-sm`}>Progress</Text>
                <Text className={`text-on-surface${themeSuffix} text-sm`}>
                  {resource.user_progress.progress_percentage}%
                </Text>
              </View>
              <View className="w-full bg-gray-200 rounded-full h-2">
                <View 
                  className="bg-primary rounded-full h-2" 
                  style={{ width: `${resource.user_progress.progress_percentage}%` }}
                />
              </View>
            </View>
          )}
        </View>

        {/* Video Player */}
        {resource.resource_type === "video" && resource.video_url && (
          <View className="px-6 mb-6">
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
              className="w-full h-64 rounded-xl"
              onError={(error: any) => console.error('Video error:', error)}
            />
          </View>
        )}

        {/* Quiz Component */}
        {resource.resource_type === "quiz" && resource.quiz_questions && (
          <View className="px-6 mb-6">
            <Text className={`text-xl font-bold text-on-surface${themeSuffix} mb-4`}>
              Test Your Knowledge ({resource.quiz_questions.length} questions)
            </Text>
            
            {resource.quiz_questions.map((question, qIndex) => (
              <View key={question.id} className={`mb-6 bg-surface-variant${themeSuffix} p-4 rounded-xl`}>
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

                  return (
                    <TouchableOpacity
                      key={option.id}
                      onPress={() => handleAnswerSelect(qIndex, option.id)}
                      disabled={quizSubmitted}
                      className={`${bgColor} p-3 rounded-lg mb-2 border-2`}
                      activeOpacity={0.7}
                    >
                      <Text className={textColor}>
                        {String.fromCharCode(65 + question.options.indexOf(option))}. {option.text}
                        {quizSubmitted && option.is_correct && " ✓"}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
                
                {quizSubmitted && (
                  <View className="mt-3 p-3 bg-blue-50 rounded-lg">
                    <Text className="text-blue-800 font-medium">
                      Explanation: {question.explanation}
                    </Text>
                  </View>
                )}
              </View>
            ))}
            
            {!quizSubmitted ? (
              <TouchableOpacity
                onPress={submitQuiz}
                className="bg-primary px-4 py-3 rounded-lg"
                activeOpacity={0.7}
              >
                <Text className="text-on-primary text-center font-semibold">
                  Submit Answers
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={handleQuizReset}
                className="bg-gray-500 px-4 py-3 rounded-lg"
                activeOpacity={0.7}
              >
                <Text className="text-white text-center font-semibold">
                  Try Again
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Content for articles, guides, tutorials */}
        {(resource.resource_type === "article" || resource.resource_type === "guide" || resource.resource_type === "tutorial") && resource.content && (
          <View className="px-6 pb-6">
            <View className={`bg-surface-variant${themeSuffix} rounded-xl p-5`}>
              <Markdown
                style={{
                  body: { color: effectiveTheme === 'dark' ? '#ffffff' : '#000000' },
                  paragraph: { marginBottom: 16 },
                  heading1: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
                  heading2: { fontSize: 20, fontWeight: 'bold', marginBottom: 12 },
                  heading3: { fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
                  list_item: { marginBottom: 8 },
                  bullet_list: { marginBottom: 16 },
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
            <Text className={`text-lg font-semibold text-on-surface${themeSuffix} mb-3`}>
              Additional Resources
            </Text>
            {resource.external_links.map((link) => (
              <TouchableOpacity
                key={link.id}
                className={`bg-surface-variant${themeSuffix} p-3 rounded-lg mb-2`}
                onPress={() => handleExternalLink(link.url)}
                activeOpacity={0.7}
              >
                <Text className="text-primary font-medium">{link.title}</Text>
                {link.description && (
                  <Text className={`text-on-surface-variant${themeSuffix} text-sm mt-1`}>
                    {link.description}
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Action Buttons */}
      <View className={`px-6 py-4 bg-surface${themeSuffix} border-t border-outline${themeSuffix}`}>
        <View className="flex-row justify-between">
          <TouchableOpacity 
            className={`bg-surface-variant${themeSuffix} px-4 py-3 rounded-lg flex-1 mr-3`}
            onPress={handleShare}
            activeOpacity={0.7}
          >
            <Text className={`text-on-surface${themeSuffix} text-center`}>Share</Text>
          </TouchableOpacity>
          
          {resource.resource_type === "quiz" ? (
            <TouchableOpacity 
              className="bg-primary px-4 py-3 rounded-lg flex-1"
              onPress={quizSubmitted ? handleQuizReset : submitQuiz}
              activeOpacity={0.7}
            >
              <Text className="text-on-primary text-center font-semibold">
                {quizSubmitted ? "Try Again" : "Submit Quiz"}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              className="bg-primary px-4 py-3 rounded-lg flex-1"
              onPress={() => {
                // Mark as completed if not already
                if (resource.user_progress && !resource.user_progress.completed) {
                  // You might want to make an API call here to update progress
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
      </View>
    </View>
  );
}