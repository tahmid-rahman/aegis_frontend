import { Link, router } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useTheme } from "../providers/ThemeProvider";

export default function Login() {
  const { effectiveTheme } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userType, setUserType] = useState("user"); // "user" or "agent"
  const [agentId, setAgentId] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = () => {
    setIsLoading(true);
    // TODO: Integrate Django auth API
    console.log("Logging in with:", { email, password, userType, agentId });
    setTimeout(() => {
      setIsLoading(false);
      router.replace("/(user)"); // Redirect after login
    }, 1500);
  };

  return (
    <View className="flex-1 bg-background p-6">
      {/* Header */}
      <View className="mt-16 mb-12">
        <Text className="text-headline text-on-surface">Welcome Back</Text>
        <Text className="text-body text-on-surface-variant mt-2">
          Sign in to your Aegis safety account
        </Text>
      </View>

      {/* Login Form */}
      <View className="space-y-6">
        {/* User Type Selection */}
        <View>
          <Text className="text-label text-on-surface-variant mb-2">Login As</Text>
          <View className="flex-row space-x-4">
            <TouchableOpacity
              className={`flex-1 py-3 rounded-xl border ${
                userType === "user" 
                  ? "bg-primary border-primary" 
                  : "bg-surface-variant border-outline"
              }`}
              onPress={() => setUserType("user")}
              disabled={isLoading}
            >
              <Text 
                className={`text-center font-medium ${
                  userType === "user" ? "text-on-primary" : "text-on-surface"
                }`}
              >
                User
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={`flex-1 py-3 rounded-xl border ${
                userType === "agent" 
                  ? "bg-primary border-primary" 
                  : "bg-surface-variant border-outline"
              }`}
              onPress={() => setUserType("agent")}
              disabled={isLoading}
            >
              <Text 
                className={`text-center font-medium ${
                  userType === "agent" ? "text-on-primary" : "text-on-surface"
                }`}
              >
                Agent
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Agent ID Field (Conditional) */}
        {userType === "agent" && (
          <View>
            <Text className="text-label text-on-surface-variant mb-2">Agent ID</Text>
            <TextInput
              className="bg-surface-variant rounded-xl p-4 text-on-surface-variant border border-outline"
              placeholder="Enter your agent ID"
              placeholderTextColor="rgb(var(--color-on-surface-variant))"
              value={agentId}
              onChangeText={setAgentId}
              autoCapitalize="none"
              editable={!isLoading}
            />
          </View>
        )}

        <View>
          <Text className="text-label text-on-surface-variant mb-2">Email</Text>
          <TextInput
            className="bg-surface-variant rounded-xl p-4 text-on-surface-variant border border-outline"
            placeholder="Enter your email"
            placeholderTextColor="rgb(var(--color-on-surface-variant))"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!isLoading}
          />
        </View>

        <View>
          <Text className="text-label text-on-surface-variant mb-2">Password</Text>
          <TextInput
            className="bg-surface-variant rounded-xl p-4 text-on-surface border border-outline"
            placeholder="••••••••"
            placeholderTextColor="rgb(var(--color-on-surface-variant))"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            editable={!isLoading}
          />
        </View>

        <TouchableOpacity
          className="bg-primary py-5 rounded-xl mt-4 shadow-sm active:bg-primary-container"
          onPress={handleLogin}
          disabled={isLoading}
          activeOpacity={0.9}
        >
          {isLoading ? (
            <View className="flex-row justify-center items-center space-x-2">
              <ActivityIndicator size="small" color="white" />
              <Text className="text-on-primary font-bold text-lg">Securing Your Account...</Text>
            </View>
          ) : (
            <Text className="text-on-primary text-center font-bold text-lg">Login</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Footer Links */}
      <View className="flex-row justify-between mt-8">
        <Link href="/forgot-password" asChild>
          <TouchableOpacity className="active:bg-hover rounded px-2 py-1">
            <Text className="text-accent font-medium">Forgot Password?</Text>
          </TouchableOpacity>
        </Link>
        <Link href="/signup" asChild>
          <TouchableOpacity className="active:bg-hover rounded px-2 py-1">
            <Text className="text-secondary font-medium">Create Account</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </View>
  );
}