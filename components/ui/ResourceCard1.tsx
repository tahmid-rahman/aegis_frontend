// components/ResourceCard.tsx
import { Book, Bookmark, BookmarkCheck, BookOpen, FileText, HelpCircle, Video } from "lucide-react-native";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

type ResourceType = "article" | "video" | "quiz" | "guide" | "tutorial";
type IconType = "BookOpen" | "Video" | "FileText" | "HelpCircle" | "Book";

type Resource = {
  id: number;
  title: string;
  description: string;
  duration: string;
  type: ResourceType;
  icon: IconType;
  category: string;
  user_progress?: {
    completed: boolean;
    progress_percentage: number;
    bookmarked: boolean;
    time_spent: number;
    quiz_score?: number;
  };
  is_bookmarked?: boolean;
};

type Props = {
  resource: Resource;
  onPress: () => void;
  onBookmarkPress?: () => void;
  isBookmarked?: boolean;
  showProgress?: boolean;
};

export default function ResourceCard({ 
  resource, 
  onPress, 
  onBookmarkPress, 
  isBookmarked = false,
  showProgress = true 
}: Props) {
  // Map icons with better styling
  const icons = {
    BookOpen: <BookOpen size={24} color="#3b82f6" />, // blue - articles
    Video: <Video size={24} color="#ef4444" />, // red - videos
    FileText: <FileText size={24} color="#10b981" />, // green - tutorials
    HelpCircle: <HelpCircle size={24} color="#f59e0b" />, // amber - quizzes
    Book: <Book size={24} color="#8b5cf6" />, // violet - guides
  };

  // Get type color for badges
  const getTypeColor = (type: ResourceType) => {
    const colors = {
      article: "bg-blue-100 text-blue-800",
      video: "bg-red-100 text-red-800",
      quiz: "bg-amber-100 text-amber-800",
      guide: "bg-violet-100 text-violet-800",
      tutorial: "bg-green-100 text-green-800",
    };
    return colors[type] || "bg-gray-100 text-gray-800";
  };

  // Format type for display
  const formatType = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  const progress = resource.user_progress?.progress_percentage || 0;
  const completed = resource.user_progress?.completed || false;
  const hasQuizScore = resource.user_progress?.quiz_score !== undefined;

  return (
    <TouchableOpacity
      onPress={onPress}
      className="bg-surface dark:bg-surface-dark rounded-2xl p-4 mb-3 mx-2 shadow-sm border border-outline dark:border-outline-dark"
      activeOpacity={0.7}
    >
      <View className="flex-row items-start">
        {/* Icon Container */}
        <View className="mr-4 p-3 bg-surface-variant dark:bg-surface-variant-dark rounded-xl">
          {icons[resource.icon]}
        </View>

        {/* Content */}
        <View className="flex-1">
          {/* Header Row */}
          <View className="flex-row justify-between items-start mb-2">
            <View className="flex-1 mr-2">
              <Text className="text-lg font-semibold text-on-surface dark:text-on-surface-dark" numberOfLines={2}>
                {resource.title}
              </Text>
            </View>
            
            {/* Bookmark Button */}
            {onBookmarkPress && (
              <TouchableOpacity 
                onPress={(e) => {
                  e.stopPropagation();
                  onBookmarkPress();
                }}
                className="p-1"
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                {isBookmarked ? (
                  <BookmarkCheck size={20} color="#f59e0b" fill="#f59e0b" />
                ) : (
                  <Bookmark size={20} color="#6b7280" />
                )}
              </TouchableOpacity>
            )}
          </View>

          {/* Description */}
          <Text className="text-sm text-on-surface-variant dark:text-on-surface-variant-dark mb-3" numberOfLines={2}>
            {resource.description}
          </Text>

          {/* Metadata Row */}
          <View className="flex-row flex-wrap items-center gap-2 mb-3">
            {/* Type Badge */}
            <View className={`px-2 py-1 rounded-full ${getTypeColor(resource.type)}`}>
              <Text className="text-xs font-medium">
                {formatType(resource.type)}
              </Text>
            </View>

            {/* Duration */}
            <Text className="text-xs text-on-surface-variant dark:text-on-surface-variant-dark font-medium">
              {resource.duration}
            </Text>

            {/* Category */}
            {resource.category && (
              <Text className="text-xs text-on-surface-variant dark:text-on-surface-variant-dark font-medium">
                • {resource.category}
              </Text>
            )}
          </View>

          {/* Progress & Status */}
          {showProgress && (
            <View className="flex-row items-center justify-between">
              {/* Progress Bar */}
              <View className="flex-1 mr-3">
                <View className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <View 
                    className="bg-primary dark:bg-primary-dark rounded-full h-2"
                    style={{ width: `${progress}%` }}
                  />
                </View>
              </View>

              {/* Status Indicators */}
              <View className="flex-row items-center gap-2">
                {/* Quiz Score */}
                {hasQuizScore && (
                  <View className="bg-green-100 dark:bg-green-900 px-2 py-1 rounded-full">
                    <Text className="text-xs font-semibold text-green-800 dark:text-green-200">
                      {resource.user_progress!.quiz_score}%
                    </Text>
                  </View>
                )}

                {/* Completion Status */}
                {completed ? (
                  <View className="bg-green-100 dark:bg-green-900 px-2 py-1 rounded-full">
                    <Text className="text-xs font-semibold text-green-800 dark:text-green-200">
                      Completed
                    </Text>
                  </View>
                ) : progress > 0 ? (
                  <Text className="text-xs font-medium text-on-surface-variant dark:text-on-surface-variant-dark">
                    {progress}%
                  </Text>
                ) : (
                  <Text className="text-xs font-medium text-on-surface-variant dark:text-on-surface-variant-dark">
                    Not started
                  </Text>
                )}
              </View>
            </View>
          )}

          {/* Quick Actions for Small Progress */}
          {showProgress && progress > 0 && !completed && (
            <View className="flex-row gap-2 mt-3">
              <TouchableOpacity 
                onPress={onPress}
                className="flex-1 bg-primary dark:bg-primary-dark py-2 rounded-lg"
              >
                <Text className="text-on-primary dark:text-on-primary-dark text-center text-sm font-medium">
                  {resource.type === 'quiz' ? 'Continue Quiz' : 'Continue'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      {/* Special Quiz Badge */}
      {resource.type === 'quiz' && (
        <View className="absolute -top-2 -right-2 bg-amber-500 px-2 py-1 rounded-full">
          <Text className="text-white text-xs font-bold">QUIZ</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}