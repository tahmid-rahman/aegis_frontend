import { Link, router } from "expo-router";
import { Image, Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "../providers/ThemeProvider";

export default function Welcome() {
  const { effectiveTheme } = useTheme();

  return (
    <View className="flex-1 bg-background px-6">
      {/* Header Illustration */}
      <View className="items-center mt-16 mb-8">
        <Image
          source={
            effectiveTheme === "dark"
              ? require("../assets/images/welcome.png")
              : require("../assets/images/welcome.png")
          }
          className="w-52 h-52"
          resizeMode="contain"
        />
      </View>

      {/* Main Content */}
      <View className="flex-1">
        <Text className="text-headline text-on-surface text-center mb-3">
          Your Safety Shield
        </Text>
        <Text className="text-body text-on-surface-variant text-center mb-8 leading-6">
          Aegis protects you with one-tap emergency alerts, real-time tracking, and instant help when you need it most.
        </Text>

        {/* Features List with new colors */}
        <View className="mb-8 space-y-5">
          {[
            { icon: "🚨", text: "Instant police/NGO alerts", bg: "bg-error/10" },
            { icon: "📍", text: "Live location sharing", bg: "bg-secondary/10" },
            { icon: "📸", text: "Discreet evidence capture", bg: "bg-tertiary/10" },
            { icon: "🛡️", text: "No personal data stored", bg: "bg-primary/10" },
          ].map((feature, index) => (
            <View 
              key={index} 
              className={`flex-row items-center p-3 rounded-lg ${feature.bg}`}
            >
              <Text className="text-2xl mr-4">{feature.icon}</Text>
              <Text className="text-on-surface text-base flex-1">
                {feature.text}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Action Buttons */}
      <View className="pb-10">
        <TouchableOpacity
          className="bg-primary py-5 rounded-xl mb-4 shadow-md active:bg-primary-container"
          activeOpacity={0.9}
          onPress={() => router.push("/home")}
        >
          <Text className="text-on-primary text-center font-bold text-lg">
            Get Started
          </Text>
        </TouchableOpacity>

        <View className="flex-row justify-center">
          <Text className="text-on-surface-variant mr-1">
            Already have an account?
          </Text>
          <Link href="/login" asChild>
            <TouchableOpacity className="active:bg-hover rounded px-1">
              <Text className="text-accent font-semibold">Log In</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </View>
  );
}