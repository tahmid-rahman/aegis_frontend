import { Ionicons } from "@expo/vector-icons"; // Make sure to install @expo/vector-icons
import { Link } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../../providers/AuthProvider";
import { useTheme } from "../../providers/ThemeProvider";
import { validateEmail } from "../../utils/validation";

export default function Login() {
  const { effectiveTheme } = useTheme();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [userType, setUserType] = useState<"user" | "agent">("user");
  const [agentId, setAgentId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; agentId?: string }>({});

  const validateForm = (): boolean => {
    const newErrors: { email?: string; password?: string; agentId?: string } = {};

    if (!validateEmail(email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!password) {
      newErrors.password = "Password is required";
    }

    if (userType === "agent" && !agentId.trim()) {
      newErrors.agentId = "Agent ID is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      // Prepare login data
      const loginData: any = {
        email,
        password
      };

      // Add agent_id if user is an agent
      if (userType === "agent") {
        loginData.agent_id = agentId;
      }

      await login(loginData);
      
      // The redirect is now handled in the AuthProvider based on user type
    } catch (error: any) {
      Alert.alert("Login Failed", error.message || "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <ScrollView 
      className="flex-1 bg-background"
      contentContainerStyle={{ padding: 24 }}
      keyboardShouldPersistTaps="handled"
    >
      {/* Header */}
      <View className="mt-8 mb-12">
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
              onPress={() => {
                setUserType("user");
                setAgentId("");
                setErrors(prev => ({ ...prev, agentId: undefined }));
              }}
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
              className={`bg-surface-variant rounded-xl p-4 text-on-surface border ${
                errors.agentId ? "border-error" : "border-outline"
              }`}
              placeholder="Enter your agent ID"
              placeholderTextColor="rgb(var(--color-on-surface-variant))"
              value={agentId}
              onChangeText={(text) => {
                setAgentId(text);
                if (errors.agentId) {
                  setErrors(prev => ({ ...prev, agentId: undefined }));
                }
              }}
              autoCapitalize="none"
              editable={!isLoading}
            />
            {errors.agentId && (
              <Text className="text-error text-sm mt-1">{errors.agentId}</Text>
            )}
          </View>
        )}

        <View>
          <Text className="text-label text-on-surface-variant mb-2">Email</Text>
          <TextInput
            className={`bg-surface-variant rounded-xl p-4 text-on-surface border ${
              errors.email ? "border-error" : "border-outline"
            }`}
            placeholder="Enter your email"
            placeholderTextColor="rgb(var(--color-on-surface-variant))"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (errors.email) {
                setErrors(prev => ({ ...prev, email: undefined }));
              }
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!isLoading}
          />
          {errors.email && (
            <Text className="text-error text-sm mt-1">{errors.email}</Text>
          )}
        </View>

        <View>
          <Text className="text-label text-on-surface-variant mb-2">Password</Text>
          <View className="relative">
            <TextInput
              className={`bg-surface-variant rounded-xl p-4 text-on-surface border ${
                errors.password ? "border-error" : "border-outline"
              } pr-12`}
              placeholder="••••••••"
              placeholderTextColor="rgb(var(--color-placeholder-variant))"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (errors.password) {
                  setErrors(prev => ({ ...prev, password: undefined }));
                }
              }}
              secureTextEntry={!showPassword}
              editable={!isLoading}
            />
            <TouchableOpacity
              className="absolute right-4 top-4"
              onPress={togglePasswordVisibility}
              disabled={isLoading}
            >
              <Ionicons 
                name={showPassword ? "eye-off-outline" : "eye-outline"} 
                size={24} 
                color="rgb(var(--color-on-surface-variant))"
              />
            </TouchableOpacity>
          </View>
          {errors.password && (
            <Text className="text-error text-sm mt-1">{errors.password}</Text>
          )}
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
              <Text className="text-on-primary font-bold text-lg">Logging Your Account...</Text>
            </View>
          ) : (
            <Text className="text-on-primary text-center font-bold text-lg">Login</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Footer Links */}
      <View className="flex-row justify-between mt-8">
        <Link href="/forgot-password" asChild>
          <TouchableOpacity 
            className="active:bg-hover rounded px-2 py-1"
            disabled={isLoading}
          >
            <Text className="text-accent font-medium">Forgot Password?</Text>
          </TouchableOpacity>
        </Link>
        <Link href="/signup" asChild>
          <TouchableOpacity 
            className="active:bg-hover rounded px-2 py-1"
            disabled={isLoading}
          >
            <Text className="text-secondary font-medium">Create Account</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </ScrollView>
  );
}