// components/navigation/BottomNav.tsx
import { Href, usePathname, useRouter } from "expo-router";
import {
  BookOpen,
  Home,
  Settings,
  ShieldAlert,
  Users,
} from "lucide-react-native";
import { Alert, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../providers/ThemeProvider";

export default function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  const { effectiveTheme } = useTheme();
  const { bottom } = useSafeAreaInsets();

  const navItems = [
    {
      name: "Home",
      icon: Home,
      route: "/home" as Href,
    },
    {
      name: "Learn",
      icon: BookOpen,
      route: "/learn" as Href,
    },
    {
      name: "Panic",
      icon: ShieldAlert,
      route: "/panic-confirm" as Href,
      isCentral: true,
    },
    {
      name: "Contacts",
      icon: Users,
      route: "/contacts" as Href,
    },
    {
      name: "Settings",
      icon: Settings,
      route: "/settings" as Href,
    },
  ];

  const handlePress = (route: Href, isCentral: boolean = false) => {
    if (isCentral) {
      Alert.alert("Emergency Alert", "Activate emergency mode?", [
        { text: "Cancel", style: "cancel" },
        { text: "Activate", onPress: () => router.push(route), style: "destructive" },
      ]);
    } else {
      router.push(route);
    }
  };

  const isActive = (route: Href) => pathname === route;

  return (
    <View
      className="absolute left-4 right-4 bottom-4 rounded-3xl bg-surface flex-row justify-around items-center"
      style={{
        paddingBottom: bottom > 0 ? bottom - 8 : 12,
        paddingTop: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 10,
      }}
    >
      {navItems.map((item) => {
        const Icon = item.icon;
        if (item.isCentral) {
          return (
            <TouchableOpacity
              key={item.name}
              onPress={() => handlePress(item.route, true)}
              className="bg-panic rounded-full items-center justify-center shadow-xl"
              style={{
                width: 72,
                height: 72,
                marginTop: -40, // floating effect
                shadowColor: "#FF1744",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.4,
                shadowRadius: 10,
                elevation: 15,
              }}
              activeOpacity={0.85}
            >
              <Icon size={30} color="white" />
              <Text className="text-white text-[10px] font-bold mt-1">
                SOS
              </Text>
            </TouchableOpacity>
          );
        }

        return (
          <TouchableOpacity
            key={item.name}
            onPress={() => handlePress(item.route)}
            className="items-center flex-1"
            activeOpacity={0.7}
          >
            <Icon
              size={24}
              color={isActive(item.route) ? "#3b82f6" : "#9ca3af"}
            />
            <Text
              className={`mt-1 text-[11px] font-medium ${
                isActive(item.route) ? "text-primary" : "text-on-surface-variant"
              }`}
            >
              {item.name}
            </Text>
            {isActive(item.route) && (
              <View className="w-6 h-[2px] bg-primary rounded-full mt-1" />
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
