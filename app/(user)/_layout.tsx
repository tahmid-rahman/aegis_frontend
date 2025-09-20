// app/user/_layout.tsx
import { Stack, useSegments } from "expo-router";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import BottomNav from "../../components/navigation/BottomNav";

export default function UserLayout() {
  const segments = useSegments();
  const { bottom } = useSafeAreaInsets();

  // Check if we should hide the nav on certain screens
  const shouldHideNav = () => {
    const currentRoute = segments[segments.length - 1] || "";
    return ['panic-confirm', 'panic-active'].includes(currentRoute);
  };

  return (
    <View className="flex-1 bg-background">
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { 
            backgroundColor: "transparent",
            paddingBottom: shouldHideNav() ? 0 : 75 + bottom // Adjust padding for nav height
          },
          animation: "fade",
        }}
      >
        <Stack.Screen name="index" options={{ title: "Dashboard" }} />
        <Stack.Screen name="learn" options={{ title: "Learn" }} />
        <Stack.Screen name="contacts" options={{ title: "Contacts" }} />
        <Stack.Screen name="profile" options={{ title: "Profile" }} />
        <Stack.Screen 
          name="panic-confirm" 
          options={{ 
            title: "Emergency",
            presentation: "modal",
            gestureEnabled: false,
            contentStyle: { paddingBottom: 0 } 
          }} 
        />
        <Stack.Screen 
          name="panic-active" 
          options={{ 
            title: "Emergency Active",
            headerShown: false,
            headerLeft: () => null,
            gestureEnabled: false,
            contentStyle: { paddingBottom: 0 } 
          }} 
        />
      </Stack>

      {/* Conditionally show bottom navigation */}
      {!shouldHideNav() && <BottomNav />}
    </View>
  );
}