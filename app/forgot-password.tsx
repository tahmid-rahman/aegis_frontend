import { Link, router } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Alert, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useTheme } from "../providers/ThemeProvider";

export default function ForgotPassword() {
  const { effectiveTheme } = useTheme();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1); // 1 = email entry, 2 = code verification, 3 = new password

  const handleResetRequest = () => {
    if (!email.includes("@") || !email.includes(".")) {
      Alert.alert("Invalid Email", "Please enter a valid email address");
      return;
    }

    setIsLoading(true);
    console.log("Sending reset code to:", email);
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      setStep(2);
      Alert.alert("Reset Code Sent", "Check your email for the verification code");
    }, 1500);
  };

  const handleVerifyCode = () => {
    setIsLoading(true);
    console.log("Verifying code...");
    
    // Simulate verification
    setTimeout(() => {
      setIsLoading(false);
      setStep(3);
    }, 1500);
  };

  const handlePasswordUpdate = () => {
    setIsLoading(true);
    console.log("Updating password...");
    
    // Simulate password update
    setTimeout(() => {
      setIsLoading(false);
      Alert.alert(
        "Password Updated", 
        "Your password has been successfully updated",
        [{ text: "OK", onPress: () => router.replace("/login") }]
      );
    }, 1500);
  };

  return (
    <View className="flex-1 bg-background">
      <View className="p-6 flex-1">
        {/* Header */}
        <View className="mb-8">
          <Text className="text-headline text-on-surface">
            {step === 1 ? "Reset Password" : step === 2 ? "Verify Code" : "New Password"}
          </Text>
          <Text className="text-body text-on-surface-variant mt-2">
            {step === 1 
              ? "Enter your email to receive a reset code" 
              : step === 2 
              ? "Enter the 6-digit code sent to your email" 
              : "Create a new password for your account"}
          </Text>
        </View>

        {/* Step Indicator */}
        <View className="flex-row justify-between mb-8">
          {[1, 2, 3].map((stepNumber) => (
            <View key={stepNumber} className="items-center">
              <View className={`w-8 h-8 rounded-full items-center justify-center 
                ${step >= stepNumber ? "bg-primary" : "bg-surface-variant"}`}>
                <Text className={`font-medium 
                  ${step >= stepNumber ? "text-on-primary" : "text-on-surface-variant"}`}>
                  {stepNumber}
                </Text>
              </View>
              <View className={`h-1 w-12 mt-2 
                ${step > stepNumber ? "bg-primary" : "bg-surface-variant"}`} />
            </View>
          ))}
        </View>

        {/* Form Content */}
        {step === 1 && (
          <View className="space-y-6">
            <View>
              <Text className="text-label text-on-surface-variant mb-2">Email Address</Text>
              <TextInput
                className="bg-surface-variant rounded-xl p-4 text-on-surface border border-outline mb-4"
                placeholder="your@email.com"
                placeholderTextColor="rgb(var(--color-on-surface-variant))"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!isLoading}
              />
            </View>

            <TouchableOpacity
              className="bg-primary py-5 rounded-xl shadow-sm active:bg-primary-container"
              onPress={handleResetRequest}
              disabled={isLoading}
              activeOpacity={0.9}
            >
              {isLoading ? (
                <View className="flex-row justify-center items-center space-x-2">
                  <ActivityIndicator size="small" color="white" />
                  <Text className="text-on-primary font-bold text-lg">Sending Code...</Text>
                </View>
              ) : (
                <Text className="text-on-primary text-center font-bold text-lg">Send Reset Code</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {step === 2 && (
          <View className="space-y-6">
            <View>
              <Text className="text-label text-on-surface-variant my-2">Verification Code</Text>
              <TextInput
                className="bg-surface-variant rounded-xl p-4 text-on-surface border border-outline mb-4"
                placeholder="6-digit code"
                placeholderTextColor="rgb(var(--color-on-surface-variant))"
                keyboardType="number-pad"
                maxLength={6}
                editable={!isLoading}
              />
            </View>

            <TouchableOpacity
              className="bg-primary py-5 rounded-xl shadow-sm active:bg-primary-container"
              onPress={handleVerifyCode}
              disabled={isLoading}
              activeOpacity={0.9}
            >
              {isLoading ? (
                <View className="flex-row justify-center items-center space-x-2">
                  <ActivityIndicator size="small" color="white" />
                  <Text className="text-on-primary font-bold text-lg">Verifying...</Text>
                </View>
              ) : (
                <Text className="text-on-primary text-center font-bold text-lg">Verify Code</Text>
              )}
            </TouchableOpacity>

            <View className="flex-row justify-center">
              <Text className="text-on-surface-variant my-1">Didn't receive code?</Text>
              <TouchableOpacity 
                className="active:bg-hover rounded px-1"
                disabled={isLoading}
              >
                <Text className="text-accent font-medium">Resend</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {step === 3 && (
          <View className="space-y-6">
            <View>
              <Text className="text-label text-on-surface-variant my-2">New Password</Text>
              <TextInput
                className="bg-surface-variant rounded-xl p-4 text-on-surface border border-outline mb-4"
                placeholder="••••••••"
                placeholderTextColor="rgb(var(--color-on-surface-variant))"
                secureTextEntry
                editable={!isLoading}
              />
              <Text className="text-caption text-on-surface-variant mt-1">
                Minimum 8 characters with at least 1 number and special character
              </Text>
            </View>

            <View>
              <Text className="text-label text-on-surface-variant my-2">Confirm Password</Text>
              <TextInput
                className="bg-surface-variant rounded-xl p-4 text-on-surface border border-outline mb-4"
                placeholder="••••••••"
                placeholderTextColor="rgb(var(--color-on-surface-variant))"
                secureTextEntry
                editable={!isLoading}
              />
            </View>

            <TouchableOpacity
              className="bg-primary py-5 rounded-xl shadow-sm active:bg-primary-container"
              onPress={handlePasswordUpdate}
              disabled={isLoading}
              activeOpacity={0.9}
            >
              {isLoading ? (
                <View className="flex-row justify-center items-center space-x-2">
                  <ActivityIndicator size="small" color="white" />
                  <Text className="text-on-primary font-bold text-lg">Updating...</Text>
                </View>
              ) : (
                <Text className="text-on-primary text-center font-bold text-lg">Update Password</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Back to Login */}
        <View className="flex-row justify-center mt-8">
          <Text className="text-on-surface-variant mr-1">Remember your password?</Text>
          <Link href="/login" asChild>
            <TouchableOpacity className="active:bg-hover rounded px-1">
              <Text className="text-secondary font-medium">Login</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </View>
  );
}