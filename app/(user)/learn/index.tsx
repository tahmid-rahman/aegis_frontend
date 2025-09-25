// app/user/learn/index.tsx
import ResourceCard from '@/components/ui/ResourceCard';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, SectionList, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../../providers/ThemeProvider';
import { api } from '../../../services/api';

// 🔹 Resource type - Match the ResourceCard expected type
type ResourceType = "video" | "article" | "quiz" | "guide" | "tutorial";
type IconType = "BookOpen" | "Video" | "FileText";

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

type Category = {
  id: number;
  name: string;
  description: string;
  icon: string;
  order: number;
  resource_count: number;
};

type CategoryFilter = {
  id: string;
  label: string;
  apiField: string;
};

export default function LearnScreen() {
  const router = useRouter();
  const { effectiveTheme } = useTheme();
  
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeCategory, setActiveCategory] = useState("all");
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryFilters, setCategoryFilters] = useState<CategoryFilter[]>([]);
  const [showOnlyBookmarked, setShowOnlyBookmarked] = useState(false);

  const fetchResources = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('auth_token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      api.defaults.headers.Authorization = `Token ${token}`;
      
      // Fetch resources based on whether we're showing bookmarked items or all
      const endpoint = showOnlyBookmarked 
        ? '/aegis/learn/bookmarks/' 
        : '/aegis/learn/resources/';
      
      const response = await api.get(endpoint);
      
      console.log('Resources API Response:', response.data);
      
      const transformedResources: Resource[] = response.data.map((item: any) => ({
        id: item.id,
        title: item.title,
        description: item.description,
        duration: item.duration,
        type: item.type,
        icon: item.icon === "HelpCircle" ? "FileText" : item.icon,
        category: item.category || item.type || 'uncategorized',
        user_progress: item.user_progress,
        is_bookmarked: item.is_bookmarked,
      }));
      
      setResources(transformedResources);
      
    } catch (error: any) {
      console.error('Error fetching resources:', error);
      Alert.alert('Error', 'Failed to load learning resources. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (!token) return;

      api.defaults.headers.Authorization = `Token ${token}`;
      const response = await api.get('/aegis/learn/categories/');
      setCategories(response.data);
      
      console.log('Categories API Response:', response.data);

      const apiCategoryFilters: CategoryFilter[] = response.data.map((category: Category) => ({
        id: category.name.toLowerCase(),
        label: category.name,
        apiField: 'category'
      }));

      const defaultFilters: CategoryFilter[] = [
        { id: "all", label: "All", apiField: 'all' },
        { id: "video", label: "Videos", apiField: 'type' },
        { id: "article", label: "Articles", apiField: 'type' },
        { id: "quiz", label: "Quizzes", apiField: 'type' },
        { id: "guide", label: "Guides", apiField: 'type' },
        { id: "tutorial", label: "Tutorials", apiField: 'type' },
      ];

      const uniqueFilters = [...defaultFilters];
      
      apiCategoryFilters.forEach(apiFilter => {
        if (!uniqueFilters.some(filter => filter.id === apiFilter.id)) {
          uniqueFilters.push(apiFilter);
        }
      });

      setCategoryFilters(uniqueFilters);
      
    } catch (error: any) {
      console.error('Error fetching categories:', error);
      setCategoryFilters([
        { id: "all", label: "All", apiField: 'all' },
        { id: "video", label: "Videos", apiField: 'type' },
        { id: "article", label: "Articles", apiField: 'type' },
        { id: "quiz", label: "Quizzes", apiField: 'type' },
        { id: "guide", label: "Guides", apiField: 'type' },
        { id: "tutorial", label: "Tutorials", apiField: 'type' },
      ]);
    }
  };

  const toggleBookmark = async (resourceId: number) => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (!token) return;

      api.defaults.headers.Authorization = `Token ${token}`;
      const response = await api.post(`/aegis/learn/resources/${resourceId}/bookmark/`);
      
      setResources(prev => prev.map(resource => {
        if (resource.id === resourceId) {
          return {
            ...resource,
            is_bookmarked: response.data.bookmarked,
            user_progress: resource.user_progress ? {
              ...resource.user_progress,
              bookmarked: response.data.bookmarked
            } : {
              completed: false,
              progress_percentage: 0,
              bookmarked: response.data.bookmarked,
              time_spent: 0
            }
          };
        }
        return resource;
      }));

    } catch (error: any) {
      console.error('Error toggling bookmark:', error);
      Alert.alert('Error', 'Failed to update bookmark. Please try again.');
    }
  };

  const toggleShowBookmarked = () => {
    setShowOnlyBookmarked(prev => !prev);
  };

  useEffect(() => {
    fetchResources();
    fetchCategories();
  }, [showOnlyBookmarked]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchResources();
    fetchCategories();
  };

  // SAFE FILTERING FUNCTION - Fixed the undefined error
  const filteredResources = activeCategory === "all"
    ? resources
    : resources.filter((resource) => {
        const activeFilter = categoryFilters.find(f => f.id === activeCategory);
        
        if (!activeFilter) return false;

        if (activeFilter.apiField === 'type') {
          return resource.type === activeCategory;
        } else if (activeFilter.apiField === 'category') {
          // SAFEST APPROACH: Check if category exists and is a string
          if (typeof resource.category !== 'string' || !resource.category) {
            return false; // Skip resources with invalid categories
          }
          return resource.category.toLowerCase() === activeCategory;
        }
        
        return false;
      });

  const getCategoryLabel = () => {
    if (activeCategory === "all") return showOnlyBookmarked ? "Bookmarked Resources" : "All Resources";
    
    const filterCategory = categoryFilters.find((c) => c.id === activeCategory);
    return filterCategory?.label || activeCategory;
  };

  const sections = [
    {
      title: getCategoryLabel(),
      data: filteredResources,
    },
  ];

  const themeSuffix = effectiveTheme === "dark" ? "-dark" : "";

  if (loading) {
    return (
      <View className={`flex-1 bg-background${themeSuffix} items-center justify-center`}>
        <ActivityIndicator size="large" color={effectiveTheme === 'dark' ? '#fff' : '#000'} />
        <Text className={`text-on-surface${themeSuffix} mt-4`}>Loading resources...</Text>
      </View>
    );
  }

  return (
    <View className={`flex-1 bg-background${themeSuffix}`}>
      <View className="flex-row justify-between items-center px-6 pt-6 mb-4">
        <Text className={`text-2xl font-bold text-on-surface${themeSuffix}`}>
          Learn Safety Skills
        </Text>
        <TouchableOpacity
          onPress={toggleShowBookmarked}
          className={`px-4 py-2 rounded-full ${
            showOnlyBookmarked
              ? "bg-primary"
              : `bg-surface-variant${themeSuffix} border border-outline${themeSuffix}`
          }`}
        >
          <Text
            className={`font-medium ${
              showOnlyBookmarked
                ? "text-on-primary"
                : `text-on-surface-variant${themeSuffix}`
            }`}
          >
            {showOnlyBookmarked ? "Show All" : "Bookmarks"}
          </Text>
        </TouchableOpacity>
      </View>

      <SectionList
        sections={sections}
        renderSectionHeader={({ section: { title } }) => (
          <>
            <View className="px-6 mb-4">
              <Text className={`text-lg font-semibold text-on-surface${themeSuffix}`}>
                {title} ({filteredResources.length})
              </Text>
            </View>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              className="px-6 mb-4"
            >
              {categoryFilters.map((category) => (
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
            </ScrollView>
          </>
        )}
        renderItem={({ item }) => (
          <ResourceCard
            resource={item}
            onPress={() => {
              if (item.type === "quiz") {
                router.push(`/(user)/learn/quiz/${item.id}`);
              } else if (item.type === "video") {
                router.push(`/(user)/learn/video/${item.id}`);
              } else {
                router.push(`/(user)/learn/${item.id}`);
              }
            }}
            onBookmarkPress={() => toggleBookmark(item.id)}
            isBookmarked={item.is_bookmarked || false}
          />
        )}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ paddingBottom: 80 }}
        stickySectionHeadersEnabled={false}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        ListEmptyComponent={
          <View className="px-6 py-8 items-center">
            <Text className={`text-on-surface-variant${themeSuffix} text-center`}>
              {showOnlyBookmarked
                ? "No bookmarked resources found."
                : activeCategory === "all" 
                  ? "No learning resources available." 
                  : `No ${getCategoryLabel()} found. Try checking another category.`
              }
            </Text>
          </View>
        }
      />
    </View>
  );
}