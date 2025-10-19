// app/user/legal-rights.tsx
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Linking, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../providers/ThemeProvider';

export default function LegalRights() {
  const router = useRouter();
  const { effectiveTheme } = useTheme();
  const [selectedLaw, setSelectedLaw] = useState<any>(null);
  const [showLawDetails, setShowLawDetails] = useState(false);

  const legalCategories = [
    {
      title: "Women's Protection Laws",
      icon: "👩",
      laws: [
        {
          name: "Women and Children Repression Prevention Act, 2000",
          description: "Special provisions for preventing repression against women and children with stringent punishments.",
          keyPoints: ["Life imprisonment for rape", "Death penalty for rape resulting in death", "Protection for victims' identity"],
          fullDescription: "The Women and Children Repression Prevention Act, 2000 is a landmark legislation in Bangladesh that provides stringent measures against crimes targeting women and children. This act establishes special tribunals for speedy trials and ensures stricter punishments compared to regular penal code provisions.",
          sections: [
            "Section 9: Punishment for rape - rigorous imprisonment for life",
            "Section 10: Punishment for rape resulting in death or vegetative state - death penalty or life imprisonment",
            "Section 11: Punishment for attempt to rape - up to 10 years imprisonment",
            "Section 12: Protection of victim identity during trial"
          ],
          procedures: [
            "FIR can be filed at any police station",
            "Special women and children repression prevention tribunals handle cases",
            "Cases should be disposed within 180 days",
            "Victim protection measures during trial"
          ]
        },
        {
          name: "Domestic Violence (Prevention and Protection) Act, 2010",
          description: "Protection against physical, psychological, sexual, and economic abuse within domestic relationships.",
          keyPoints: ["Protection orders", "Residence orders", "Compensation for victims"],
          fullDescription: "This act recognizes domestic violence as a punishable offense and provides comprehensive protection to victims. It covers various forms of abuse including physical, psychological, sexual, and economic violence within domestic relationships.",
          sections: [
            "Section 3: Definition of domestic violence including physical, psychological, sexual, and economic abuse",
            "Section 9: Protection orders to prevent further violence",
            "Section 10: Residence orders allowing victim to stay in shared household",
            "Section 13: Compensation orders for damages and losses"
          ],
          procedures: [
            "Application to Judicial Magistrate for protection orders",
            "Interim orders can be issued within 7 days",
            "Service providers can assist in filing complaints",
            "Breach of protection order is punishable with imprisonment"
          ]
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
          keyPoints: ["Protection against cyber bullying", "Punishment for online harassment", "Data protection provisions"],
          fullDescription: "The Digital Security Act, 2018 addresses various cyber crimes and provides protection against digital offenses. It covers cyber stalking, identity theft, and online harassment while balancing digital rights and security.",
          sections: [
            "Section 17: Punishment for unauthorized access and damage to computer systems",
            "Section 25: Punishment for cyber stalking and online harassment",
            "Section 29: Punishment for defamation and spreading false information",
            "Section 31: Punishment for illegal access to critical information infrastructure"
          ],
          procedures: [
            "Complaint can be filed with Digital Security Agency or police",
            "Special tribunal for digital security cases",
            "Investigation by specialized cyber crime units",
            "Provisions for data protection and privacy"
          ]
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
          keyPoints: ["Punishment for sexual harassment", "Protection in public spaces", "Criminal intimidation provisions"],
          fullDescription: "The Penal Code of 1860 contains several sections that protect women's dignity and safety. Sections 354 and 509 specifically address offenses against women's modesty and provide legal remedies.",
          sections: [
            "Section 354: Assault or criminal force to woman with intent to outrage her modesty - imprisonment up to 10 years",
            "Section 509: Word, gesture or act intended to insult the modesty of a woman - imprisonment up to 3 years",
            "Section 506: Punishment for criminal intimidation",
            "Section 376: Punishment for rape"
          ],
          procedures: [
            "FIR can be filed at nearest police station",
            "Medical examination of victim as evidence",
            "Trial in regular criminal courts",
            "Bailable and non-bailable provisions apply"
          ]
        },
        {
          name: "Nari O Shishu Nirjatan Daman Ain, 2000",
          description: "Special law for suppression of violence against women and children.",
          keyPoints: ["Speedy trial provisions", "Special tribunals", "Witness protection"],
          fullDescription: "This special legislation provides enhanced protection for women and children with provisions for speedy trial and witness protection. It covers various forms of violence and provides comprehensive legal framework.",
          sections: [
            "Section 4: Punishment for acid violence - death penalty or life imprisonment",
            "Section 5: Punishment for trafficking of women and children",
            "Section 6: Punishment for forced prostitution",
            "Section 7: Punishment for child marriage"
          ],
          procedures: [
            "Special Nari O Shishu Nirjatan Daman tribunals",
            "Cases to be disposed within 180 days",
            "In-camera trial provisions",
            "Witness protection measures"
          ]
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
          keyPoints: ["Maternity benefits", "Equal pay provisions", "Safe working environment"],
          fullDescription: "The Bangladesh Labour Act, 2006 contains important provisions for protection of women workers including measures against workplace harassment, maternity benefits, and equal treatment.",
          sections: [
            "Section 332: Maternity benefits - 16 weeks paid leave",
            "Section 345: Prohibition of employment of women during night without consent",
            "Section 284: Equal pay for equal work",
            "Section 333: Provisions against sexual harassment"
          ],
          procedures: [
            "Complaint to Labour Court or Inspector",
            "Internal complaint committee in large establishments",
            "Legal aid available through Department of Labour",
            "Time-bound dispute resolution"
          ]
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

  const handleLearnMore = (law: any) => {
    setSelectedLaw(law);
    setShowLawDetails(true);
  };

  const handleBackToLaws = () => {
    setShowLawDetails(false);
    setSelectedLaw(null);
  };

  // Law Details View
  if (showLawDetails && selectedLaw) {
    return (
      <View className="flex-1 bg-background">
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View className="px-6 pt-6 pb-4">
            <View className="flex-row items-center mb-2">
              <TouchableOpacity 
                onPress={handleBackToLaws}
                className="p-2 rounded-full bg-surface-variant mr-3"
              >
                <Text className="text-lg">←</Text>
              </TouchableOpacity>
              <Text className="text-headline text-on-surface">Law Details</Text>
            </View>
            <Text className="text-title text-on-surface mb-2">{selectedLaw.name}</Text>
            <Text className="text-body text-on-surface-variant">
              {selectedLaw.fullDescription}
            </Text>
          </View>

          {/* Key Sections */}
          <View className="px-6 mb-6">
            <Text className="text-title text-on-surface mb-3">Key Legal Sections</Text>
            <View className="bg-surface-variant rounded-xl p-4">
              {selectedLaw.sections?.map((section: string, index: number) => (
                <View key={index} className="flex-row items-start mb-3 last:mb-0">
                  <Text className="text-primary mr-2">•</Text>
                  <Text className="text-on-surface flex-1">{section}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Legal Procedures */}
          <View className="px-6 mb-6">
            <Text className="text-title text-on-surface mb-3">Legal Procedures</Text>
            <View className="bg-surface-variant rounded-xl p-4">
              {selectedLaw.procedures?.map((procedure: string, index: number) => (
                <View key={index} className="flex-row items-start mb-3 last:mb-0">
                  <Text className="text-accent mr-2">📋</Text>
                  <Text className="text-on-surface flex-1">{procedure}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Key Points */}
          <View className="px-6 mb-6">
            <Text className="text-title text-on-surface mb-3">Key Protections</Text>
            <View className="bg-surface-variant rounded-xl p-4">
              {selectedLaw.keyPoints?.map((point: string, index: number) => (
                <View key={index} className="flex-row items-start mb-2 last:mb-0">
                  <Text className="text-primary mr-2">✓</Text>
                  <Text className="text-on-surface flex-1">{point}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Action Buttons */}
          <View className="px-6 mb-10">
            {/* <TouchableOpacity 
              className="bg-primary p-4 rounded-xl mb-3"
              onPress={() => Linking.openURL('tel:999')}
            >
              <Text className="text-on-primary text-center font-semibold">Call Emergency: 999</Text>
            </TouchableOpacity> */}
            <TouchableOpacity 
              className="bg-surface-variant p-4 rounded-xl"
              onPress={handleBackToLaws}
            >
              <Text className="text-on-surface text-center font-medium">Back to Legal Rights</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  // Main Legal Rights View
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
                    onPress={() => handleLearnMore(law)}
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