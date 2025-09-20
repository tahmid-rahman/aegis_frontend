import { Slot } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import "../global.css";
import { AuthProvider } from "../providers/AuthProvider";
import { ThemeProvider, useTheme } from "../providers/ThemeProvider";

function MainLayout() {
  const { effectiveTheme } = useTheme();
  return (
    <SafeAreaView className={`flex-1 bg-surface ${effectiveTheme}`}>
      <StatusBar style={effectiveTheme === "dark" ? "light" : "dark"} />
      <Slot />
    </SafeAreaView>
  );
}

export default function Layout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <MainLayout />
      </AuthProvider>
    </ThemeProvider>
  );
}