// app/agent/stats.tsx
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Dimensions, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { BarChart, LineChart, PieChart } from 'react-native-chart-kit';

export default function MyStats() {
  const router = useRouter();
  const screenWidth = Dimensions.get('window').width - 48;

  const [timeRange, setTimeRange] = useState('month'); // week, month, year
  const [stats, setStats] = useState({
    safetyScore: 85,
    responseTime: '2.3 min',
    emergenciesActivated: 2,
    safetyCheckins: 28,
    reportsSubmitted: 5,
    safeRoutesUsed: 12,
    avgResponseTime: '3.1 min',
    completionRate: '94%'
  });

  // Mock data for charts
  const safetyScoreData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        data: [65, 78, 80, 82, 85, 87],
        color: (opacity = 1) => `rgba(103, 80, 164, ${opacity})`,
        strokeWidth: 2
      }
    ]
  };

  const incidentTypeData = [
    { name: 'Harassment', population: 45, color: '#FF6B6B', legendFontColor: '#7F7F7F', legendFontSize: 12 },
    { name: 'Stalking', population: 25, color: '#4ECDC4', legendFontColor: '#7F7F7F', legendFontSize: 12 },
    { name: 'Robbery', population: 15, color: '#45B7D1', legendFontColor: '#7F7F7F', legendFontSize: 12 },
    { name: 'Other', population: 15, color: '#96CEB4', legendFontColor: '#7F7F7F', legendFontSize: 12 }
  ];

  const monthlyActivityData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        data: [3, 5, 2, 4, 6, 8, 4],
        color: (opacity = 1) => `rgba(236, 64, 122, ${opacity})`,
      }
    ]
  };

  const responseTimeData = {
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
    datasets: [
      {
        data: [4.2, 3.8, 3.2, 2.3],
        color: (opacity = 1) => `rgba(0, 150, 136, ${opacity})`,
      }
    ]
  };

  const chartConfig = {
    backgroundColor: 'transparent',
    backgroundGradientFrom: 'transparent',
    backgroundGradientTo: 'transparent',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(103, 80, 164, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(27, 27, 31, ${opacity})`,
    style: {
      borderRadius: 16
    },
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: '#6750A4'
    }
  };

  const safetyTips = [
    "Complete your safety profile to increase your safety score",
    "Regular safety check-ins improve your response time",
    "Use safe routes feature to avoid high-risk areas",
    "Keep emergency contacts updated for faster response"
  ];

  const achievements = [
    { id: 1, name: 'Safety Pioneer', description: 'Used app for 30 days', icon: '🏆', unlocked: true },
    { id: 2, name: 'Quick Responder', description: 'Avg response < 3min', icon: '⚡', unlocked: true },
    { id: 3, name: 'Community Helper', description: 'Submitted 5 reports', icon: '👥', unlocked: true },
    { id: 4, name: 'Safety Expert', description: 'Safety score > 90', icon: '🛡️', unlocked: false },
    { id: 5, name: 'Route Master', description: 'Used 20 safe routes', icon: '🗺️', unlocked: false }
  ];

  const compareStats = {
    yourScore: 85,
    communityAvg: 72,
    cityAvg: 68,
    nationalAvg: 65
  };

  return (
    <View className="flex-1 bg-background">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-6 pt-6 pb-4">
          <View className="flex-row items-center mb-2">
            <TouchableOpacity 
              onPress={() => router.back()}
              className="p-2 rounded-full bg-surface-variant mr-3"
            >
              <Text className="text-lg">←</Text>
            </TouchableOpacity>
            <Text className="text-headline text-on-surface">My Safety Stats</Text>
          </View>
          <Text className="text-body text-on-surface-variant">
            Track your safety performance and improvements
          </Text>
        </View>

        {/* Time Range Selector */}
        <View className="px-6 mb-6">
          <View className="flex-row space-x-2 bg-surface-variant rounded-xl p-1">
            {['week', 'month', 'year'].map((range) => (
              <TouchableOpacity
                key={range}
                className={`flex-1 py-2 rounded-lg ${
                  timeRange === range ? 'bg-primary' : 'bg-transparent'
                }`}
                onPress={() => setTimeRange(range)}
              >
                <Text className={`text-center font-medium ${
                  timeRange === range ? 'text-white' : 'text-on-surface'
                }`}>
                  {range.charAt(0).toUpperCase() + range.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Key Metrics */}
        <View className="px-6 mb-6">
          <Text className="text-title text-on-surface mb-3">Key Metrics</Text>
          <View className="flex-row flex-wrap justify-between">
            <View className="w-[48%] bg-surface-variant rounded-xl p-4 mb-3">
              <Text className="text-3xl font-bold text-primary text-center">{stats.safetyScore}</Text>
              <Text className="text-label text-on-surface-variant text-center">Safety Score</Text>
            </View>
            <View className="w-[48%] bg-surface-variant rounded-xl p-4 mb-3">
              <Text className="text-3xl font-bold text-green-500 text-center">{stats.responseTime}</Text>
              <Text className="text-label text-on-surface-variant text-center">Avg Response Time</Text>
            </View>
            <View className="w-[48%] bg-surface-variant rounded-xl p-4">
              <Text className="text-3xl font-bold text-secondary text-center">{stats.emergenciesActivated}</Text>
              <Text className="text-label text-on-surface-variant text-center">Emergencies</Text>
            </View>
            <View className="w-[48%] bg-surface-variant rounded-xl p-4">
              <Text className="text-3xl font-bold text-accent text-center">{stats.safetyCheckins}</Text>
              <Text className="text-label text-on-surface-variant text-center">Check-ins</Text>
            </View>
          </View>
        </View>

        {/* Safety Score Trend */}
        <View className="px-6 mb-6">
          <Text className="text-title text-on-surface mb-3">Safety Score Trend</Text>
          <View className="bg-surface-variant rounded-xl p-4">
            <LineChart
              data={safetyScoreData}
              width={screenWidth}
              height={220}
              chartConfig={chartConfig}
              bezier
              style={{
                marginVertical: 8,
                borderRadius: 16
              }}
            />
            <Text className="text-label text-on-surface-variant text-center mt-2">
              Your safety score has improved by 22 points over 6 months
            </Text>
          </View>
        </View>

        {/* Activity Overview */}
        <View className="px-6 mb-6">
          <Text className="text-title text-on-surface mb-3">Weekly Activity</Text>
          <View className="bg-surface-variant rounded-xl p-4">
            <BarChart
              data={monthlyActivityData}
              width={screenWidth}
              height={220}
              chartConfig={{
                ...chartConfig,
                color: (opacity = 1) => `rgba(236, 64, 122, ${opacity})`,
              }}
              style={{
                marginVertical: 8,
                borderRadius: 16
              }}
            />
            <Text className="text-label text-on-surface-variant text-center mt-2">
              Safety activities and check-ins throughout the week
            </Text>
          </View>
        </View>

        {/* Response Time Improvement */}
        <View className="px-6 mb-6">
          <Text className="text-title text-on-surface mb-3">Response Time Improvement</Text>
          <View className="bg-surface-variant rounded-xl p-4">
            <LineChart
              data={responseTimeData}
              width={screenWidth}
              height={220}
              chartConfig={{
                ...chartConfig,
                color: (opacity = 1) => `rgba(0, 150, 136, ${opacity})`,
              }}
              bezier
              style={{
                marginVertical: 8,
                borderRadius: 16
              }}
            />
            <Text className="text-label text-on-surface-variant text-center mt-2">
              Average response time decreased by 45% this month
            </Text>
          </View>
        </View>

        {/* Incident Type Distribution */}
        <View className="px-6 mb-6">
          <Text className="text-title text-on-surface mb-3">Report Types</Text>
          <View className="bg-surface-variant rounded-xl p-4 items-center">
            <PieChart
              data={incidentTypeData}
              width={screenWidth}
              height={200}
              chartConfig={chartConfig}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="15"
            />
            <Text className="text-label text-on-surface-variant text-center mt-2">
              Distribution of your incident reports
            </Text>
          </View>
        </View>

        {/* Comparison Stats */}
        <View className="px-6 mb-6">
          <Text className="text-title text-on-surface mb-3">How You Compare</Text>
          <View className="bg-surface-variant rounded-xl p-4">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-on-surface">Your Safety Score</Text>
              <Text className="text-primary font-bold">{compareStats.yourScore}/100</Text>
            </View>
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-on-surface">Community Average</Text>
              <Text className="text-green-500 font-bold">{compareStats.communityAvg}/100</Text>
            </View>
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-on-surface">City Average</Text>
              <Text className="text-orange-500 font-bold">{compareStats.cityAvg}/100</Text>
            </View>
            <View className="flex-row justify-between items-center">
              <Text className="text-on-surface">National Average</Text>
              <Text className="text-gray-500 font-bold">{compareStats.nationalAvg}/100</Text>
            </View>
            
            <View className="bg-surface rounded-full h-3 w-full mt-4 overflow-hidden">
              <View 
                className="h-3 bg-primary rounded-full" 
                style={{ width: `${compareStats.yourScore}%` }}
              />
            </View>
            <Text className="text-label text-on-surface-variant text-center mt-2">
              You're safer than {((compareStats.yourScore - compareStats.nationalAvg) / compareStats.nationalAvg * 100).toFixed(0)}% of users nationwide
            </Text>
          </View>
        </View>

        {/* Achievements */}
        <View className="px-6 mb-6">
          <Text className="text-title text-on-surface mb-3">Achievements</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="space-x-3">
            {achievements.map((achievement) => (
              <View 
                key={achievement.id} 
                className={`w-32 p-4 rounded-xl ${
                  achievement.unlocked ? 'bg-primary/20' : 'bg-surface-variant/50'
                }`}
              >
                <Text className="text-2xl text-center mb-2">{achievement.icon}</Text>
                <Text className={`text-center font-medium ${
                  achievement.unlocked ? 'text-on-surface' : 'text-on-surface-variant'
                }`}>
                  {achievement.name}
                </Text>
                <Text className="text-label text-on-surface-variant text-center text-xs mt-1">
                  {achievement.description}
                </Text>
                <View className={`mt-2 px-2 py-1 rounded-full ${
                  achievement.unlocked ? 'bg-green-500/20' : 'bg-gray-500/20'
                }`}>
                  <Text className={`text-center text-xs ${
                    achievement.unlocked ? 'text-green-500' : 'text-gray-500'
                  }`}>
                    {achievement.unlocked ? 'Unlocked' : 'Locked'}
                  </Text>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Safety Tips */}
        <View className="px-6 mb-10">
          <Text className="text-title text-on-surface mb-3">Improve Your Safety</Text>
          <View className="bg-surface-variant rounded-xl p-4">
            {safetyTips.map((tip, index) => (
              <View key={index} className="flex-row items-start mb-3 last:mb-0">
                <Text className="text-primary mr-2">•</Text>
                <Text className="text-on-surface flex-1">{tip}</Text>
              </View>
            ))}
            <TouchableOpacity className="bg-primary/10 p-3 rounded-lg mt-3">
              <Text className="text-primary text-center font-medium">Get Personalized Tips</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Export Data */}
        <View className="px-6 mb-10">
          <TouchableOpacity className="bg-surface-variant p-4 rounded-xl items-center">
            <Text className="text-on-surface font-medium">Export Safety Data</Text>
            <Text className="text-label text-on-surface-variant text-center mt-1">
              Download your complete safety history and statistics
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}