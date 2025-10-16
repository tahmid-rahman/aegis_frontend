// app/user/learn/quiz/[id].tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useTheme } from '../../../../providers/ThemeProvider';
import { api } from '../../../../services/api';

const { width: screenWidth } = Dimensions.get('window');

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

interface LearningResource {
  id: number;
  title: string;
  description: string;
  resource_type: string;
  difficulty: string;
  duration: string;
  quiz_questions: QuizQuestion[];
  user_progress?: {
    completed: boolean;
    progress_percentage: number;
    bookmarked: boolean;
    time_spent: number;
  };
}

export default function QuizScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { effectiveTheme } = useTheme();
  
  const [resource, setResource] = useState<LearningResource | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [quizResults, setQuizResults] = useState<QuizResult | null>(null);
  const [timeSpent, setTimeSpent] = useState(0);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [showResults, setShowResults] = useState(false);
  const [progressAnim] = useState(new Animated.Value(0));
  const [displayScore, setDisplayScore] = useState(0);
  const [answeredQuestions, setAnsweredQuestions] = useState<Set<number>>(new Set());

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  const resourceId = params.id as string;

  const parseDurationToSeconds = (duration: string): number => {
    if (!duration) return 600;

    const lower = duration.toLowerCase().trim();
    const match = lower.match(/(\d+)\s*(h|hr|hrs|hour|hours|m|min|mins|minute|minutes|s| sec|secs|second|seconds)?/);

    if (match && match[1]) {
      const value = parseInt(match[1]);
      const unit = match[2] || 's';

      switch (unit) {
        case 'h':
        case 'hr':
        case 'hrs':
        case 'hour':
        case 'hours':
          return value * 3600;
        case 'm':
        case 'min':
        case 'mins':
        case 'minute':
        case 'minutes':
          return value * 60;
        case 's':
        case 'sec':
        case 'secs':
        case 'second':
        case 'seconds':
        default:
          return value;
      }
    }

    return 600;
  };

  const fetchQuiz = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('auth_token');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await api.get(`/aegis/learn/resources/${resourceId}/`);
      
      if (response.data.resource_type !== 'quiz') {
        Alert.alert('Error', 'This resource is not a quiz');
        router.back();
        return;
      }

      setResource(response.data);
      
    } catch (error: any) {
      console.error('Error fetching quiz:', error);
      Alert.alert('Error', 'Failed to load quiz. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const startQuiz = () => {
    if (!resource) return;
    
    const totalTime = parseDurationToSeconds(resource.duration);
    setTimeLeft(totalTime);
    setQuizStarted(true);
    
    timerRef.current = setInterval(() => {
      setTimeSpent(prev => prev + 1);
    }, 1000);

    countdownRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(countdownRef.current as NodeJS.Timeout);
          handleTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleTimeUp = () => {
    Alert.alert(
      "Time's Up!",
      "The quiz time has ended. Your answers will be submitted automatically.",
      [{ text: "OK", onPress: submitQuizAnswers }]
    );
  };

  const cleanupTimers = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
  };

  const handleAnswerSelect = (questionIndex: number, optionId: number) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionIndex]: optionId
    }));

    // Mark question as answered without auto-advancing
    setAnsweredQuestions(prev => new Set(prev).add(questionIndex));
  };

  const navigateToQuestion = (index: number) => {
    if (index >= 0 && index < (resource?.quiz_questions.length || 0)) {
      setCurrentQuestion(index);
    }
  };

  const submitQuiz = async () => {
    if (!resource?.quiz_questions) return;

    const allAnswered = resource.quiz_questions.every((_, index) => 
      selectedAnswers[index] !== undefined
    );

    if (!allAnswered) {
      Alert.alert(
        "Incomplete Quiz",
        "You haven't answered all questions. Are you sure you want to submit?",
        [
          { text: "Continue", style: "cancel" },
          { text: "Submit Anyway", onPress: submitQuizAnswers }
        ]
      );
      return;
    }

    submitQuizAnswers();
  };

  const submitQuizAnswers = async () => {
    cleanupTimers();
    
    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (!token || !resource) return;

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
        time_spent: timeSpent
      };

      const response = await api.post<QuizResult>(
        `/aegis/learn/resources/${resource.id}/quiz/submit/`,
        submissionData
      );

      setQuizResults(response.data);
      setQuizCompleted(true);
      setShowResults(true);

      const score = response.data.score;
      progressAnim.setValue(0);
      Animated.timing(progressAnim, {
        toValue: score,
        duration: 1500,
        useNativeDriver: false
      }).start();

      let currentDisplay = 0;
      const increment = score / 50;
      const displayTimer = setInterval(() => {
        currentDisplay += increment;
        if (currentDisplay >= score) {
          currentDisplay = score;
          clearInterval(displayTimer);
        }
        setDisplayScore(Math.round(currentDisplay));
      }, 30);

    } catch (error: any) {
      console.error('Error submitting quiz:', error);
      Alert.alert('Error', 'Failed to submit quiz. Please try again.');
    }
  };

  const retryQuiz = () => {
    cleanupTimers();
    setCurrentQuestion(0);
    setSelectedAnswers({});
    setAnsweredQuestions(new Set());
    setQuizCompleted(false);
    setQuizResults(null);
    setTimeSpent(0);
    setDisplayScore(0);
    setShowResults(false);
    progressAnim.setValue(0);
    
    if (resource) {
      const totalTime = parseDurationToSeconds(resource.duration);
      setTimeLeft(totalTime);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getScoreMessage = (score: number) => {
    if (score >= 90) return "Excellent! You've mastered this topic! 🎉";
    if (score >= 80) return "Great job! You have a solid understanding! 👍";
    if (score >= 70) return "Good work! Keep practicing to improve! 💪";
    if (score >= 60) return "Not bad! Review the material and try again! 📚";
    return "Keep learning! Review the content and try again! 🎯";
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimeColor = () => {
    if (timeLeft < 60) return 'text-red-500';
    if (timeLeft < 180) return 'text-yellow-500';
    return 'text-green-500';
  };

  useEffect(() => {
    if (resourceId) {
      fetchQuiz();
    }

    return () => {
      cleanupTimers();
    };
  }, [resourceId]);

  const themeSuffix = effectiveTheme === "dark" ? "-dark" : "";

  if (loading) {
    return (
      <View className={`flex-1 bg-background${themeSuffix} items-center justify-center`}>
        <ActivityIndicator size="large" color={effectiveTheme === 'dark' ? '#fff' : '#000'} />
        <Text className={`text-on-surface${themeSuffix} mt-4`}>Loading quiz...</Text>
      </View>
    );
  }

  if (!resource) {
    return (
      <View className={`flex-1 bg-background${themeSuffix} items-center justify-center`}>
        <Text className={`text-on-surface${themeSuffix} text-lg mb-4`}>Quiz not found</Text>
        <TouchableOpacity 
          onPress={() => router.back()} 
          className="bg-primary px-6 py-3 rounded-lg"
        >
          <Text className="text-on-primary font-semibold">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Quiz Intro Screen
  if (!quizStarted) {
    const totalTime = parseDurationToSeconds(resource.duration);
    
    return (
      <View className={`flex-1 bg-background${themeSuffix}`}>
        <ScrollView className="flex-1" contentContainerStyle={{ flexGrow: 1 }}>
          <View className="flex-1 px-6 pt-6">
            <TouchableOpacity 
              onPress={() => router.back()}
              className="mb-6"
            >
              <Text className="text-primary text-lg font-semibold">← Back</Text>
            </TouchableOpacity>

            <View className="items-center mb-8">
              <View className="w-20 h-20 bg-primary/20 rounded-full items-center justify-center mb-4">
                <Text className="text-3xl">🧠</Text>
              </View>
              <Text className={`text-3xl font-bold text-on-surface${themeSuffix} text-center mb-2`}>
                Knowledge Check
              </Text>
              <Text className={`text-on-surface-variant${themeSuffix} text-center text-lg`}>
                {resource.title}
              </Text>
            </View>

            <View className={`bg-surface${themeSuffix} rounded-2xl p-6 mb-6`}>
              <Text className={`text-xl font-bold text-on-surface${themeSuffix} mb-4`}>
                Quiz Overview
              </Text>
              
              <View className="space-y-3">
                <View className="flex-row items-center">
                  <Text className="text-2xl mr-3">📊</Text>
                  <View className="flex-1">
                    <Text className={`text-on-surface${themeSuffix} font-medium`}>
                      {resource.quiz_questions.length} Questions
                    </Text>
                    <Text className={`text-on-surface-variant${themeSuffix} text-sm`}>
                      Multiple choice format
                    </Text>
                  </View>
                </View>

                <View className="flex-row items-center">
                  <Text className="text-2xl mr-3">⚡</Text>
                  <View className="flex-1">
                    <Text className={`text-on-surface${themeSuffix} font-medium`}>
                      {resource.difficulty}
                    </Text>
                    <Text className={`text-on-surface-variant${themeSuffix} text-sm`}>
                      Difficulty level
                    </Text>
                  </View>
                </View>

                <View className="flex-row items-center">
                  <Text className="text-2xl mr-3">⏱️</Text>
                  <View className="flex-1">
                    <Text className={`text-on-surface${themeSuffix} font-medium`}>
                      {formatTime(totalTime)}
                    </Text>
                    <Text className={`text-on-surface-variant${themeSuffix} text-sm`}>
                      Time limit
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            <View className={`bg-blue-50 border border-blue-200 rounded-2xl p-5 mb-6`}>
              <Text className="text-blue-800 font-semibold text-lg mb-2">💡 Important</Text>
              <Text className="text-blue-700">
                • Timer: {formatTime(totalTime)} total time{"\n"}
                • Auto-submit when time ends{"\n"}
                • Read each question carefully{"\n"}
                • You can navigate between questions freely
              </Text>
            </View>
          </View>
        </ScrollView>

        <View className={`px-6 py-6 bg-surface${themeSuffix} border-t border-outline${themeSuffix}`}>
          <TouchableOpacity
            onPress={startQuiz}
            className="bg-primary py-4 rounded-xl shadow-lg"
          >
            <Text className="text-on-primary text-center font-bold text-lg">
              Start Quiz
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Quiz in Progress
  if (!quizCompleted && resource.quiz_questions) {
    const question = resource.quiz_questions[currentQuestion];
    const progress = ((currentQuestion + 1) / resource.quiz_questions.length) * 100;
    const isLastQuestion = currentQuestion === resource.quiz_questions.length - 1;
    const isFirstQuestion = currentQuestion === 0;

    return (
      <View className={`flex-1 bg-background${themeSuffix}`}>
        {/* Header */}
        <View className={`px-6 pt-6 pb-4 bg-surface${themeSuffix}`}>
          <View className="flex-row justify-between items-center mb-4">
            <TouchableOpacity onPress={() => {
              Alert.alert(
                "Exit Quiz?",
                "Your progress will be lost if you exit now.",
                [
                  { text: "Continue", style: "cancel" },
                  { text: "Exit", onPress: () => router.back() }
                ]
              );
            }}>
              <Text className="text-primary font-semibold">Exit</Text>
            </TouchableOpacity>
            <View className="flex-row items-center">
              <Text className={`text-lg font-bold ${getTimeColor()} mr-2`}>
                {formatTime(timeLeft)}
              </Text>
              <Text className={`text-on-surface${themeSuffix}`}>left</Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View className="mb-2">
            <View className="flex-row justify-between items-center mb-1">
              <Text className={`text-on-surface${themeSuffix} text-sm font-medium`}>
                Question {currentQuestion + 1} of {resource.quiz_questions.length}
              </Text>
              <Text className={`text-on-surface${themeSuffix} text-sm font-medium`}>
                {Math.round(progress)}%
              </Text>
            </View>
            <View className="w-full bg-gray-300 rounded-full h-2">
              <View 
                className="bg-primary rounded-full h-2" 
                style={{ width: `${progress}%` }}
              />
            </View>
          </View>

          {/* Question Navigation Dots */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="py-2">
            <View className="flex-row space-x-2">
              {resource.quiz_questions.map((_, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => navigateToQuestion(index)}
                  className={`w-8 h-8 rounded-full items-center justify-center border ${
                    currentQuestion === index
                      ? 'bg-primary border-primary'
                      : answeredQuestions.has(index)
                      ? 'bg-green-500 border-green-500'
                      : `bg-surface${themeSuffix} border-outline${themeSuffix}`
                  }`}
                >
                  <Text className={`text-sm font-medium ${
                    currentQuestion === index || answeredQuestions.has(index)
                      ? 'text-white'
                      : `text-on-surface${themeSuffix}`
                  }`}>
                    {index + 1}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Question */}
        <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
          <View className="py-6">
            <Text className={`text-2xl font-bold text-on-surface${themeSuffix} mb-6 leading-8`}>
              {question.question}
            </Text>

            <View className="space-y-3">
              {question.options.map((option, index) => {
                const isSelected = selectedAnswers[currentQuestion] === option.id;
                return (
                  <TouchableOpacity
                    key={option.id}
                    onPress={() => handleAnswerSelect(currentQuestion, option.id)}
                    className={`p-4 rounded-xl border-2 ${
                      isSelected
                        ? 'bg-primary border-primary'
                        : `bg-surface${themeSuffix} border-outline${themeSuffix}`
                    }`}
                    activeOpacity={0.7}
                  >
                    <View className="flex-row items-center">
                      <View className={`w-8 h-8 rounded-full mr-3 items-center justify-center ${
                        isSelected ? 'bg-white' : 'bg-gray-200'
                      }`}>
                        <Text className={`font-bold ${
                          isSelected ? 'text-primary' : 'text-gray-600'
                        }`}>
                          {String.fromCharCode(65 + index)}
                        </Text>
                      </View>
                      <Text className={`flex-1 text-lg ${
                        isSelected ? 'text-white' : `text-on-surface${themeSuffix}`
                      }`}>
                        {option.text}
                      </Text>
                      {isSelected && (
                        <Text className="text-white ml-2">✓</Text>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </ScrollView>

        {/* Navigation */}
        <View className={`px-6 py-4 bg-surface${themeSuffix} border-t border-outline${themeSuffix}`}>
          <View className="flex-row justify-between items-center">
            {/* Previous Button */}
            <TouchableOpacity
              onPress={() => navigateToQuestion(currentQuestion - 1)}
              className={`px-6 py-3 rounded-lg ${
                isFirstQuestion ? 'opacity-0' : 'bg-gray-500'
              }`}
              disabled={isFirstQuestion}
            >
              <Text className="text-white font-semibold">← Previous</Text>
            </TouchableOpacity>

            {/* Question Status */}
            <View className="items-center">
              <Text className={`text-on-surface-variant${themeSuffix} text-sm`}>
                {selectedAnswers[currentQuestion] ? 'Answered ✓' : 'Unanswered'}
              </Text>
              <Text className={`text-on-surface${themeSuffix} text-xs`}>
                {answeredQuestions.size}/{resource.quiz_questions.length} completed
              </Text>
            </View>

            {/* Next/Submit Button */}
            {isLastQuestion ? (
              <TouchableOpacity
                onPress={submitQuiz}
                className="bg-green-500 px-6 py-3 rounded-lg"
              >
                <Text className="text-white font-semibold">Submit Quiz</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={() => navigateToQuestion(currentQuestion + 1)}
                className="bg-primary px-6 py-3 rounded-lg"
              >
                <Text className="text-on-primary font-semibold">Next →</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  }

  // Results Screen
  return (
    <View className={`flex-1 bg-background${themeSuffix}`}>
      <ScrollView className="flex-1" contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 px-6 pt-6">
          <TouchableOpacity 
            onPress={() => router.back()}
            className="mb-6"
          >
            <Text className="text-primary text-lg font-semibold">← Done</Text>
          </TouchableOpacity>

          <View className="items-center mb-8">
            <View className="w-32 h-32 bg-primary/10 rounded-full items-center justify-center mb-6 relative">
              <Animated.View 
                style={{
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                  borderRadius: 64,
                  borderWidth: 8,
                  borderColor: '#3b82f6',
                  borderLeftColor: '#e5e7eb',
                  borderTopColor: '#e5e7eb',
                  transform: [{ rotate: progressAnim.interpolate({
                    inputRange: [0, 100],
                    outputRange: ['0deg', '360deg']
                  }) }]
                }}
              />
              <Text className={`text-4xl font-bold ${getScoreColor(displayScore)}`}>
                {displayScore}%
              </Text>
            </View>
            
            <Text className={`text-2xl font-bold text-on-surface${themeSuffix} mb-2`}>
              {quizResults && quizResults.score >= 70 ? "Congratulations! 🎉" : "Quiz Complete! 📚"}
            </Text>
            <Text className={`text-on-surface-variant${themeSuffix} text-center text-lg mb-4`}>
              {quizResults && getScoreMessage(quizResults.score)}
            </Text>
          </View>

          <View className={`bg-surface${themeSuffix} rounded-2xl p-6 mb-6`}>
            <Text className={`text-xl font-bold text-on-surface${themeSuffix} mb-4 text-center`}>
              Your Results
            </Text>
            
            <View className="space-y-4">
              <View className="flex-row justify-between items-center py-3 border-b border-outline-dark">
                <Text className={`text-on-surface${themeSuffix} font-medium`}>Score</Text>
                <Text className={`text-xl font-bold ${getScoreColor(quizResults?.score || 0)}`}>
                  {Math.round(quizResults?.score || 0)}%
                </Text>
              </View>
              
              <View className="flex-row justify-between items-center py-3 border-b border-outline-dark">
                <Text className={`text-on-surface${themeSuffix} font-medium`}>Correct Answers</Text>
                <Text className="text-xl font-bold text-green-500">
                  {quizResults?.correct_answers}/{quizResults?.total_questions}
                </Text>
              </View>
              
              <View className="flex-row justify-between items-center py-3">
                <Text className={`text-on-surface${themeSuffix} font-medium`}>Time Spent</Text>
                <Text className="text-xl font-bold text-blue-500">
                  {formatTime(timeSpent)}
                </Text>
              </View>
            </View>
          </View>

          {quizResults && quizResults.score < 80 && (
            <View className={`bg-yellow-50 border border-yellow-200 rounded-2xl p-5 mb-6`}>
              <Text className="text-yellow-800 font-semibold text-lg mb-2">💡 Improvement Tip</Text>
              <Text className="text-yellow-700">
                Review the learning material and try again to improve your score. Focus on the questions you missed.
              </Text>
            </View>
          )}

          {/* Quick Actions */}
          <View className="flex-row space-x-4 mb-6">
            <TouchableOpacity
              onPress={() => setShowResults(true)}
              className="flex-1 bg-blue-500 py-3 rounded-xl items-center"
            >
              <Text className="text-white font-semibold">Review Answers</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={retryQuiz}
              className="flex-1 bg-primary py-3 rounded-xl items-center"
            >
              <Text className="text-on-primary font-semibold">Try Again</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Results Modal */}
      <Modal
        visible={showResults}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowResults(false)}
      >
        <View className={`flex-1 bg-background${themeSuffix}`}>
          <View className="px-6 pt-6 pb-4 border-b border-outline-dark">
            <View className="flex-row justify-between items-center">
              <Text className={`text-xl font-bold text-on-surface${themeSuffix}`}>
                Question Review
              </Text>
              <TouchableOpacity onPress={() => setShowResults(false)}>
                <Text className="text-primary font-semibold">Close</Text>
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView className="flex-1 px-6">
            {resource.quiz_questions.map((question, qIndex) => {
              const selectedOptionId = selectedAnswers[qIndex];
              const selectedOption = question.options.find(opt => opt.id === selectedOptionId);
              const isCorrect = selectedOption?.is_correct;

              return (
                <View key={question.id} className="py-4 border-b border-outline-dark">
                  <View className="flex-row items-start mb-3">
                    <View className={`w-6 h-6 rounded-full items-center justify-center mr-2 mt-1 ${
                      isCorrect ? 'bg-green-500' : 'bg-red-500'
                    }`}>
                      <Text className="text-white text-xs font-bold">
                        {isCorrect ? '✓' : '✗'}
                      </Text>
                    </View>
                    <Text className={`text-lg font-semibold flex-1 ${
                      isCorrect ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {qIndex + 1}. {question.question}
                    </Text>
                  </View>
                  
                  <Text className="text-blue-600 font-medium mb-2">
                    Your answer: {selectedOption ? selectedOption.text : 'Not answered'}
                  </Text>
                  
                  <Text className="text-gray-600 mb-2">
                    💡 {question.explanation}
                  </Text>

                  <View className={`p-3 rounded-lg ${
                    isCorrect ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                  }`}>
                    <Text className={`font-medium ${
                      isCorrect ? 'text-green-800' : 'text-red-800'
                    }`}>
                      {isCorrect ? '✓ Correct answer!' : '✗ Incorrect answer'}
                    </Text>
                  </View>
                </View>
              );
            })}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}