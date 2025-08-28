// components/ResourceCard.tsx
import { BookOpen, FileText, Video } from "lucide-react-native";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

type Resource = {
  id: number;
  title: string;
  description: string;
  duration: string;
  type: string;
  icon: "BookOpen" | "Video" | "FileText";
};

type Props = {
  resource: Resource;
  onPress: () => void;
};

export default function ResourceCard({ resource, onPress }: Props) {
  // Map icons
  const icons = {
    BookOpen: <BookOpen size={22} color="#3b82f6" />, // blue
    Video: <Video size={22} color="#ef4444" />, // red
    FileText: <FileText size={22} color="#10b981" />, // green
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      className="bg-surface rounded-2xl p-4 mb-4 mx-6 shadow-sm flex-row items-center"
      activeOpacity={0.8}
    >
      {/* Icon */}
      <View className="mr-4">{icons[resource.icon]}</View>

      {/* Texts */}
      <View className="flex-1">
        <Text className="text-base font-semibold text-text">
          {resource.title}
        </Text>
        <Text className="text-sm text-on-surface-variant mt-1">
          {resource.description}
        </Text>
        <Text className="text-xs text-on-surface-variant mt-2">
          {resource.duration}
        </Text>
      </View>
    </TouchableOpacity>
  );
}
