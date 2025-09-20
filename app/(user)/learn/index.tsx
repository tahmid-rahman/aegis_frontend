import ResourceCard from "@/components/ui/ResourceCard";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { SectionList, Text, TouchableOpacity, View } from "react-native";
import { useTheme } from '../../../providers/ThemeProvider';

// 🔹 Resource type
type Resource = {
  id: number;
  title: string;
  description: string;
  duration: string;
  type: string;
  icon: "BookOpen" | "Video" | "FileText";
};

type Section = {
  title: string;
  data: Resource[];
};

// 🔹 Categories
const categories = [
  { id: "all", label: "All" },
  { id: "video", label: "Videos" },
  { id: "article", label: "Articles" },
  { id: "quiz", label: "Quizzes" },
];

// 🔹 Dummy resources
const resources: Resource[] = [
  {
    id: 1,
    title: "Introduction to Cybersecurity",
    description: "Learn the basics of staying safe online.",
    duration: "5 min read",
    type: "article",
    icon: "BookOpen",
  },
  {
    id: 2,
    title: "Password Security Best Practices",
    description: "How to create and manage strong passwords.",
    duration: "7 min",
    type: "video",
    icon: "Video",
  },
  {
    id: 3,
    title: "Recognizing Phishing Attempts",
    description: "Common signs of phishing emails and messages.",
    duration: "10 min read",
    type: "article",
    icon: "FileText",
  },
];

export default function LearnScreen() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState("all");
  const { effectiveTheme } = useTheme(); // Get the effective theme

  // Filter resources by category
  const filteredResources = activeCategory === "all"
    ? resources
    : resources.filter((r) => r.type === activeCategory);

  // Organize into sections
  const sections: Section[] = [
    {
      title:
        activeCategory === "all"
          ? "All Resources"
          : categories.find((c) => c.id === activeCategory)?.label || "",
      data: filteredResources,
    },
  ];

  // Determine which theme class suffix to use
  const themeSuffix = effectiveTheme === "dark" ? "-dark" : "";

  return (
    <View className={`flex-1 pt-14 bg-background${themeSuffix}`}>
      {/* 🔹 Header */}
      <Text className={`text-2xl font-bold px-6 mb-4 text-on-surface${themeSuffix}`}>
        Learn Safety Skills
      </Text>

      {/* 🔹 Categories */}
      <SectionList
        sections={sections}
        renderSectionHeader={({ section: { title } }) => (
          <>
            <View className="px-6 mb-4">
              <Text className={`text-lg font-semibold text-on-surface${themeSuffix}`}>
                {title}
              </Text>
            </View>
            <View className="flex-row px-6 mb-4">
              {categories.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  onPress={() => setActiveCategory(category.id)}
                  className={`mr-3 px-4 py-2 rounded-full ${
                    activeCategory === category.id
                      ? "bg-primary"
                      : `bg-surface-variant${themeSuffix} border border-outline${themeSuffix}`
                  }`}
                >
                  <Text
                    className={`font-medium ${
                      activeCategory === category.id
                        ? "text-on-primary"
                        : `text-on-surface-variant${themeSuffix}`
                    }`}
                  >
                    {category.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}
        renderItem={({ item }) => (
          <ResourceCard
            resource={item}
            onPress={() => router.push(`/(user)/learn/${item.id}`)}
          />
        )}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ paddingBottom: 80 }}
        stickySectionHeadersEnabled={false}
      />
    </View>
  );
}