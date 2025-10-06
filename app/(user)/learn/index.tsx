// app/user/learn/index.tsx
import ResourceCard from '@/components/ui/ResourceCard1';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, SectionList, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../../providers/ThemeProvider';
import { api } from '../../../services/api';

// 🔹 Resource type - Match the backend API structure
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
  category_name?: string;
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

  // Map backend resource_type to frontend type and icon
  const mapResourceData = (item: any): Resource => {
    const resourceTypeMap: Record<string, ResourceType> = {
      'article': 'article',
      'video': 'video', 
      'quiz': 'quiz',
      'guide': 'guide',
      'tutorial': 'tutorial'
    };

    const iconMap: Record<string, IconType> = {
      'article': 'BookOpen',
      'video': 'Video',
      'quiz': 'HelpCircle',
      'guide': 'Book',
      'tutorial': 'FileText'
    };

    return {
      id: item.id,
      title: item.title || 'Untitled Resource',
      description: item.description || 'No description available',
      duration: item.duration || '5 min',
      type: resourceTypeMap[item.resource_type] || 'article',
      icon: iconMap[item.resource_type] || 'BookOpen',
      category: item.category_name || item.category?.name || 'General',
      category_name: item.category_name || item.category?.name,
      user_progress: item.user_progress,
      is_bookmarked: item.is_bookmarked || item.user_progress?.bookmarked || false
    };
  };

  const fetchResources = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('auth_token');
      
      if (!token) {
        Alert.alert('Authentication Required', 'Please login to access learning resources');
        router.push('/login');
        return;
      }

      // Build query params for filtering
      const params: any = {};
      if (activeCategory !== "all") {
        const activeFilter = categoryFilters.find(f => f.id === activeCategory);
        if (activeFilter) {
          if (activeFilter.apiField === 'type') {
            params.type = activeCategory;
          } else if (activeFilter.apiField === 'category') {
            params.category = activeCategory;
          }
        }
      }

      // Fetch resources based on whether we're showing bookmarked items or all
      const endpoint = showOnlyBookmarked 
        ? '/aegis/learn/bookmarks/' 
        : '/aegis/learn/resources/';
      
      const response = await api.get(endpoint, { params });
      
      console.log('Resources API Response:', response.data);
      
      const transformedResources: Resource[] = response.data.map(mapResourceData);
      
      setResources(transformedResources);
      
    } catch (error: any) {
      console.error('Error fetching resources:', error);
      if (error.response?.status === 401) {
        Alert.alert('Session Expired', 'Please login again');
        router.push('/login');
      } else {
        Alert.alert('Error', 'Failed to load learning resources. Please try again.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (!token) return;

      const response = await api.get('/aegis/learn/categories/');
      setCategories(response.data);
      
      console.log('Categories API Response:', response.data);

      // Create category filters from API response
      const apiCategoryFilters: CategoryFilter[] = response.data
        .filter((category: Category) => category.resource_count > 0)
        .map((category: Category) => ({
          id: category.name.toLowerCase().replace(/\s+/g, '-'),
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

      // Merge filters, ensuring no duplicates
      const allFilters = [...defaultFilters];
      apiCategoryFilters.forEach(apiFilter => {
        if (!allFilters.some(filter => filter.id === apiFilter.id)) {
          allFilters.push(apiFilter);
        }
      });

      setCategoryFilters(allFilters);
      
    } catch (error: any) {
      console.error('Error fetching categories:', error);
      // Fallback filters
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
    setActiveCategory("all"); // Reset category filter when toggling bookmarks
  };

  useEffect(() => {
    fetchResources();
  }, [activeCategory, showOnlyBookmarked]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchResources();
    fetchCategories();
  };

  // Filter resources safely
  const filteredResources = resources.filter((resource) => {
    if (showOnlyBookmarked && !resource.is_bookmarked) {
      return false;
    }
    
    if (activeCategory === "all") {
      return true;
    }

    const activeFilter = categoryFilters.find(f => f.id === activeCategory);
    if (!activeFilter) return false;

    if (activeFilter.apiField === 'type') {
      return resource.type === activeCategory;
    } else if (activeFilter.apiField === 'category') {
      const resourceCategory = resource.category?.toLowerCase().replace(/\s+/g, '-');
      return resourceCategory === activeCategory;
    }
    
    return false;
  });

  const getCategoryLabel = () => {
    if (showOnlyBookmarked) return "Bookmarked Resources";
    if (activeCategory === "all") return "All Resources";
    
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

  // Check if we should show the category filters
  const shouldShowCategoryFilters = categoryFilters.length > 0 && !showOnlyBookmarked;

  if (loading && resources.length === 0) {
    return (
      <View className={`flex-1 bg-background${themeSuffix} items-center justify-center`}>
        <ActivityIndicator size="large" color={effectiveTheme === 'dark' ? '#fff' : '#000'} />
        <Text className={`text-on-surface${themeSuffix} mt-4`}>Loading resources...</Text>
      </View>
    );
  }

  return (
    <View className={`flex-1 bg-background${themeSuffix}`}>
      {/* Header */}
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

      {/* Category Filters - Only show when not in bookmarks mode and filters exist */}
      {shouldShowCategoryFilters && (
        <View className="mb-4">
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            className="px-6"
            contentContainerStyle={{ paddingRight: 20 }}
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
        </View>
      )}

      {/* Resources List */}
      <SectionList
        sections={sections}
        renderSectionHeader={({ section }) => (
          <View className="px-6 mb-4">
            <Text className={`text-lg font-semibold text-on-surface${themeSuffix}`}>
              {section.title} ({section.data.length})
            </Text>
          </View>
        )}
        renderItem={({ item }) => (
          <View className="px-6 mb-4">
            <ResourceCard
              resource={item}
              onPress={() => {
                // Navigate based on resource type
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
          </View>
        )}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ 
          paddingBottom: 100,
          // Ensure proper spacing when empty
          flexGrow: filteredResources.length === 0 ? 1 : 0 
        }}
        stickySectionHeadersEnabled={false}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        ListEmptyComponent={
          <View className="flex-1 justify-center items-center px-6 py-8" style={{ minHeight: 300 }}>
            <Text className={`text-on-surface-variant${themeSuffix} text-center text-lg mb-2`}>
              {showOnlyBookmarked
                ? "No bookmarked resources yet"
                : activeCategory === "all" 
                  ? "No learning resources available" 
                  : `No ${getCategoryLabel().toLowerCase()} found`
              }
            </Text>
            <Text className={`text-on-surface-variant${themeSuffix} text-center`}>
              {showOnlyBookmarked 
                ? "Bookmark resources to see them here"
                : "Check back later for new content"
              }
            </Text>
          </View>
        }
      />
    </View>
  );
}