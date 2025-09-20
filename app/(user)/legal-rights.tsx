// app/user/legal-rights.tsx
import { useRouter } from 'expo-router';
import { Alert, Linking, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../providers/ThemeProvider';

export default function LegalRights() {
  const router = useRouter();
  const { effectiveTheme } = useTheme();

  const legalCategories = [
    {
      title: "Women's Protection Laws",
      icon: "👩",
      laws: [
        {
          name: "Women and Children Repression Prevention Act, 2000",
          description: "Special provisions for preventing repression against women and children with stringent punishments.",
          keyPoints: ["Life imprisonment for rape", "Death penalty for rape resulting in death", "Protection for victims' identity"]
        },
        {
          name: "Domestic Violence (Prevention and Protection) Act, 2010",
          description: "Protection against physical, psychological, sexual, and economic abuse within domestic relationships.",
          keyPoints: ["Protection orders", "Residence orders", "Compensation for victims"]
        }
      ]
    },
    {
      title: "Cyber Security Laws",
      icon: "💻",
      laws: [
        {
          name: "Digital Security Act, 2018",
          description: "Comprehensive law addressing cyber crimes and digital security concerns.",
          keyPoints: ["Protection against cyber bullying", "Punishment for online harassment", "Data protection provisions"]
        }
      ]
    },
    {
      title: "General Protection Laws",
      icon: "⚖️",
      laws: [
        {
          name: "Penal Code, 1860 (Sections 354, 509)",
          description: "General provisions against assault, criminal force, and outraging modesty of women.",
          keyPoints: ["Punishment for sexual harassment", "Protection in public spaces", "Criminal intimidation provisions"]
        },
        {
          name: "Nari O Shishu Nirjatan Daman Ain, 2000",
          description: "Special law for suppression of violence against women and children.",
          keyPoints: ["Speedy trial provisions", "Special tribunals", "Witness protection"]
        }
      ]
    },
    {
      title: "Workplace Protection",
      icon: "🏢",
      laws: [
        {
          name: "Labour Act, 2006",
          description: "Provisions against sexual harassment in workplace and protection for working women.",
          keyPoints: ["Maternity benefits", "Equal pay provisions", "Safe working environment"]
        }
      ]
    }
  ];

  const emergencyContacts = [
    {
      name: "National Emergency Service",
      number: "999",
      description: "24/7 emergency helpline"
    },
    {
      name: "Women and Children Repression Prevention Tribunal",
      number: "02-9514400",
      description: "Specialized legal support"
    },
    {
      name: "National Helpline Center",
      number: "109",
      description: "Government helpline for various services"
    }
  ];

  const handleCall = (number: string) => {
    Linking.openURL(`tel:${number}`);
  };

  const handleLearnMore = (lawName: string) => {
    // This would typically open a detailed view or external resource
    Alert.alert("Learn More", `More information about ${lawName} would be shown here.`);
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
            <Text className="text-headline text-on-surface">Legal Rights in Bangladesh</Text>
          </View>
          <Text className="text-body text-on-surface-variant">
            Know your rights and legal protections under Bangladeshi law
          </Text>
        </View>

        {/* Quick Emergency Access */}
        <View className="px-6 mb-6">
          <Text className="text-title text-on-surface mb-3">Emergency Legal Support</Text>
          <View className="bg-surface-variant rounded-xl p-4">
            <Text className="text-on-surface font-medium mb-3">Immediate Help Contacts:</Text>
            {emergencyContacts.map((contact, index) => (
              <TouchableOpacity
                key={index}
                className={`flex-row justify-between items-center py-3 ${
                  index < emergencyContacts.length - 1 ? 'border-b border-outline' : ''
                }`}
                onPress={() => handleCall(contact.number)}
              >
                <View className="flex-1">
                  <Text className="text-on-surface font-medium">{contact.name}</Text>
                  <Text className="text-label text-on-surface-variant">{contact.description}</Text>
                </View>
                <View className="bg-primary/20 px-3 py-1 rounded-full">
                  <Text className="text-primary font-semibold">{contact.number}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Legal Categories */}
        <View className="px-6 mb-8">
          <Text className="text-title text-on-surface mb-4">Legal Protections</Text>
          
          {legalCategories.map((category, categoryIndex) => (
            <View key={categoryIndex} className="mb-6">
              <View className="flex-row items-center mb-3">
                <Text className="text-2xl mr-2">{category.icon}</Text>
                <Text className="text-on-surface font-semibold text-lg">{category.title}</Text>
              </View>
              
              {category.laws.map((law, lawIndex) => (
                <View key={lawIndex} className="bg-surface-variant rounded-xl p-4 mb-3">
                  <Text className="text-on-surface font-semibold mb-2">{law.name}</Text>
                  <Text className="text-on-surface-variant mb-3">{law.description}</Text>
                  
                  <View className="mb-3">
                    {law.keyPoints.map((point, pointIndex) => (
                      <View key={pointIndex} className="flex-row items-start mb-2">
                        <Text className="text-primary mr-2">•</Text>
                        <Text className="text-on-surface flex-1">{point}</Text>
                      </View>
                    ))}
                  </View>
                  
                  <TouchableOpacity
                    className="bg-primary/10 p-3 rounded-lg"
                    onPress={() => handleLearnMore(law.name)}
                  >
                    <Text className="text-primary text-center font-medium">Learn More</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          ))}
        </View>

        {/* Important Notes */}
        <View className="px-6 mb-10">
          <Text className="text-title text-on-surface mb-3">Important Legal Notes</Text>
          <View className="bg-surface-variant rounded-xl p-4">
            <View className="flex-row items-start mb-3">
              <Text className="text-accent mr-2">⚠️</Text>
              <Text className="text-on-surface flex-1">
                You have the right to file a First Information Report (FIR) at any police station
              </Text>
            </View>
            <View className="flex-row items-start mb-3">
              <Text className="text-accent mr-2">⚠️</Text>
              <Text className="text-on-surface flex-1">
                Police cannot refuse to register your complaint - it's your legal right
              </Text>
            </View>
            <View className="flex-row items-start">
              <Text className="text-accent mr-2">⚠️</Text>
              <Text className="text-on-surface flex-1">
                You are entitled to free legal aid if you cannot afford a lawyer
              </Text>
            </View>
          </View>
        </View>

        {/* Additional Resources */}
        <View className="px-6 mb-10">
          <Text className="text-title text-on-surface mb-3">Additional Resources</Text>
          <View className="space-y-2">
            <TouchableOpacity className="bg-surface-variant p-4 rounded-xl flex-row items-center">
              <Text className="text-2xl mr-3">📋</Text>
              <Text className="text-on-surface flex-1">How to File a Police Complaint</Text>
              <Text className="text-primary">→</Text>
            </TouchableOpacity>
            <TouchableOpacity className="bg-surface-variant p-4 rounded-xl flex-row items-center">
              <Text className="text-2xl mr-3">🏛️</Text>
              <Text className="text-on-surface flex-1">Find Legal Aid Organizations</Text>
              <Text className="text-primary">→</Text>
            </TouchableOpacity>
            <TouchableOpacity className="bg-surface-variant p-4 rounded-xl flex-row items-center">
              <Text className="text-2xl mr-3">📞</Text>
              <Text className="text-on-surface flex-1">List of Women Support Organizations</Text>
              <Text className="text-primary">→</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}