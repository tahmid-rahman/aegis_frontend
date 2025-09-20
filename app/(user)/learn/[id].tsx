import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Linking, ScrollView, Share, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../../providers/ThemeProvider';

// Mock data - in real app, this would come from API or database
const learningResources = {
  1: {
    title: "How to Activate Emergency Mode",
    description: "Step-by-step guide to using the panic button effectively in different scenarios",
    content: `
# Emergency Activation Guide

## When to Use the Panic Button

Use the emergency mode when you feel:
- Physically threatened or in immediate danger
- Unsafe in your current location
- Being followed or harassed
- Need immediate assistance

## Activation Steps

1. **Press and Hold**: Press the red panic button for 3 seconds
2. **Confirm Alert**: If possible, confirm the emergency alert on screen
3. **Location Sharing**: Your GPS location is automatically shared with emergency contacts
4. **Discreet Recording**: The app silently starts recording audio (optional)

## What Happens Next

- Emergency contacts receive your location and alert message
- Local authorities are notified if you've enabled this feature
- The app continues sharing your location until deactivated
- You receive confirmation when help is on the way

## Safety Tips

- Keep your phone accessible in unfamiliar areas
- Ensure location services are enabled
- Regularly update your emergency contacts
- Practice using the panic button in safe environments
`,
    type: "guide",
    duration: "5 min read",
    icon: "🆘",
    category: "Emergency Procedures",
    related: [2, 3],
    externalLinks: [
      { title: "Emergency Preparedness Guide", url: "https://example.com/emergency-prep" },
      { title: "Local Police Department", url: "https://example.com/police" }
    ]
  },
  2: {
    title: "What Happens When You Trigger Alert",
    description: "Understand the alert process and response timeline",
    content: `
# Alert Process Explained

## Immediate Actions

When you trigger an emergency alert:

1. **Instant Notification**: Your emergency contacts receive an SMS with your location
2. **App Notification**: Contacts with the app get detailed alert with live location
3. **Email Alert**: Backup email sent with incident details and map link

## Response Timeline

- **0-30 seconds**: Alert dispatched to all channels
- **1-2 minutes**: First emergency contact typically acknowledges
- **3-5 minutes**: Local authorities notified if enabled
- **5+ minutes**: Continuous location updates every 30 seconds

## Location Tracking

Your location is shared via:
- GPS coordinates with accuracy rating
- Google Maps link for easy navigation
- Address approximation based on your position
- Live updates until alert is resolved

## Privacy Considerations

- Location sharing stops when alert is cancelled
- No data is stored after incident resolution
- You control who receives alerts
- You can disable authority notification
`,
    type: "article",
    duration: "3 min read",
    icon: "📋",
    category: "Emergency Procedures",
    related: [1, 4]
  },
  3: {
    title: "Basic Self-Defense Moves",
    description: "Simple techniques anyone can use in dangerous situations",
    content: `
# Basic Self-Defense Techniques

## Fundamental Principles

1. **Awareness**: Always be aware of your surroundings
2. **Avoidance**: The best defense is avoiding dangerous situations
3. **Assertiveness**: Confident body language can deter attackers
4. **Action**: Simple, effective moves to create escape opportunities

## Essential Techniques

### Palm Heel Strike
- Target: Nose or chin
- Method: Heel of palm upward strike
- Effect: Stuns attacker, creates escape time

### Groin Kick
- Target: Groin area
- Method: Quick, upward kick
- Effect: Incapacitates momentarily

### Elbow Strike
- Target: Ribs, face, or solar plexus
- Method: Sharp backward elbow thrust
- Effect: Creates distance from behind

### Escape from Wrist Grab
- Method: Twist toward thumb, leverage weakness
- Effect: Breaks grip, allows escape

## Practice Tips

- Practice regularly with a partner
- Focus on technique over strength
- Learn 2-3 moves thoroughly rather than many poorly
- Consider professional self-defense classes

## Legal Considerations

- Use only proportional force
- Self-defense must be immediate response to threat
- Escape is always priority over confrontation
`,
    type: "tutorial",
    duration: "8 min read",
    icon: "👊",
    category: "Self-Defense Techniques",
    related: [4, 5]
  }
};

export default function LearningResource() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { effectiveTheme } = useTheme();
  const [resource, setResource] = useState(null);
  const [isBookmarked, setIsBookmarked] = useState(false);

  useEffect(() => {
    if (params.id) {
      const resourceId = parseInt(params.id as string);
      setResource(learningResources[resourceId]);
    }
  }, [params.id]);

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out this safety resource: ${resource.title} - ${resource.description}`,
        url: `https://yourapp.com/learn/${params.id}`
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleExternalLink = (url: string) => {
    Linking.openURL(url).catch(err => console.error('Failed to open URL:', err));
  };

  // Determine which theme class suffix to use
  const themeSuffix = effectiveTheme === "dark" ? "-dark" : "";

  if (!resource) {
    return (
      <View className={`flex-1 bg-background${themeSuffix} items-center justify-center`}>
        <Text className={`text-on-surface${themeSuffix}`}>Loading resource...</Text>
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
              onPress={() => setIsBookmarked(!isBookmarked)}
              className="p-2"
              activeOpacity={0.7}
            >
              <Text className="text-2xl">{isBookmarked ? '📑' : '📄'}</Text>
            </TouchableOpacity>
          </View>

          <View className="flex-row items-center mt-4">
            <View className="bg-primary/10 px-3 py-1 rounded-full mr-3">
              <Text className="text-primary text-sm">{resource.type}</Text>
            </View>
            <Text className={`text-on-surface-variant${themeSuffix} text-sm`}>
              {resource.duration}
            </Text>
            <Text className={`text-on-surface-variant${themeSuffix} text-sm mx-3`}>•</Text>
            <Text className={`text-on-surface-variant${themeSuffix} text-sm`}>
              {resource.category}
            </Text>
          </View>
        </View>

        {/* Content */}
        <View className="px-6 pb-6">
          <View className={`bg-surface-variant${themeSuffix} rounded-xl p-5`}>
            {resource.content.split('\n').map((paragraph, index) => {
              if (paragraph.startsWith('# ')) {
                return (
                  <Text key={index} className={`text-2xl font-bold text-on-surface${themeSuffix} mb-4`}>
                    {paragraph.replace('# ', '')}
                  </Text>
                );
              } else if (paragraph.startsWith('## ')) {
                return (
                  <Text key={index} className={`text-xl font-semibold text-on-surface${themeSuffix} mt-6 mb-3`}>
                    {paragraph.replace('## ', '')}
                  </Text>
                );
              } else if (paragraph.startsWith('### ')) {
                return (
                  <Text key={index} className={`text-lg font-medium text-on-surface${themeSuffix} mt-4 mb-2`}>
                    {paragraph.replace('### ', '')}
                  </Text>
                );
              } else if (paragraph.startsWith('- ')) {
                return (
                  <View key={index} className="flex-row items-start mb-2">
                    <Text className={`text-on-surface${themeSuffix} mr-2`}>•</Text>
                    <Text className={`text-on-surface${themeSuffix} flex-1`}>
                      {paragraph.replace('- ', '')}
                    </Text>
                  </View>
                );
              } else if (paragraph.startsWith('1. ')) {
                return (
                  <View key={index} className="flex-row items-start mb-2">
                    <Text className={`text-on-surface${themeSuffix} mr-2`}>
                      {paragraph.split('.')[0]}.
                    </Text>
                    <Text className={`text-on-surface${themeSuffix} flex-1`}>
                      {paragraph.replace(/^\d+\.\s/, '')}
                    </Text>
                  </View>
                );
              } else if (paragraph.trim() === '') {
                return <View key={index} className="h-4" />;
              } else {
                return (
                  <Text key={index} className={`text-on-surface${themeSuffix} mb-3 leading-6`}>
                    {paragraph}
                  </Text>
                );
              }
            })}
          </View>

          {/* External Links */}
          {resource.externalLinks && resource.externalLinks.length > 0 && (
            <View className="mt-6">
              <Text className={`text-lg font-semibold text-on-surface${themeSuffix} mb-3`}>
                Additional Resources
              </Text>
              {resource.externalLinks.map((link, index) => (
                <TouchableOpacity
                  key={index}
                  className={`bg-surface-variant${themeSuffix} p-3 rounded-lg mb-2`}
                  onPress={() => handleExternalLink(link.url)}
                  activeOpacity={0.7}
                >
                  <Text className="text-primary">{link.title}</Text>
                  <Text className={`text-on-surface-variant${themeSuffix} text-xs mt-1`}>
                    {link.url}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Related Resources */}
          {resource.related && resource.related.length > 0 && (
            <View className="mt-8">
              <Text className={`text-lg font-semibold text-on-surface${themeSuffix} mb-3`}>
                Related Resources
              </Text>
              {resource.related.map((relatedId) => {
                const relatedResource = learningResources[relatedId];
                if (!relatedResource) return null;
                
                return (
                  <TouchableOpacity
                    key={relatedId}
                    className={`bg-surface-variant${themeSuffix} p-4 rounded-xl mb-3`}
                    onPress={() => router.push(`/learn/${relatedId}`)}
                    activeOpacity={0.7}
                  >
                    <View className="flex-row items-start">
                      <Text className="text-2xl mr-3">{relatedResource.icon}</Text>
                      <View className="flex-1">
                        <Text className={`text-on-surface${themeSuffix} font-semibold mb-1`}>
                          {relatedResource.title}
                        </Text>
                        <Text className={`text-on-surface-variant${themeSuffix} text-sm mb-2`}>
                          {relatedResource.description}
                        </Text>
                        <Text className="text-primary text-xs">
                          {relatedResource.type.toUpperCase()}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
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
          <TouchableOpacity 
            className="bg-primary px-4 py-3 rounded-lg flex-1"
            onPress={() => router.push('/panic-confirm')}
            activeOpacity={0.7}
          >
            <Text className="text-on-primary text-center font-semibold">Practice Drill</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}