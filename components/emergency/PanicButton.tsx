// components/emergency/PanicButton.tsx
import { useRouter } from "expo-router";
import { Alert, Text, TouchableOpacity } from "react-native";
import { useTheme } from "../../providers/ThemeProvider";

interface PanicButtonProps {
  mini?: boolean;
}

export default function PanicButton({ mini = false }: PanicButtonProps) {
  const router = useRouter();
  const { effectiveTheme } = useTheme();

  const handlePress = () => {
    Alert.alert("Emergency Alert", "Are you sure you want to activate emergency mode?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Activate",
        onPress: () => router.push("/user/panic-confirm"),
        style: "destructive",
      },
    ]);
  };

  if (mini) {
    return (
      <TouchableOpacity
        className="bg-panic rounded-full w-12 h-12 items-center justify-center shadow-lg"
        onPress={handlePress}
        activeOpacity={0.7}
      >
        <Text className="text-white text-lg">🛡️</Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      className="bg-panic rounded-full w-16 h-16 items-center justify-center shadow-lg"
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <Text className="text-white text-2xl">🛡️</Text>
      <Text className="text-white text-xs mt-1">SOS</Text>
    </TouchableOpacity>
  );
}
