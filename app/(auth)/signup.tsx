import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import { Link, router } from "expo-router";
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
import { validateEmail, validatePassword, validatePhone } from "../../utils/validation";

// Define the type for formData
interface FormData {
  name: string;
  gender: "male" | "female" | "other";
  email: string;
  phone: string;
  password: string;
  idType: "nid" | "birth";
  idNumber: string;
  dob: Date;
}

interface FormErrors {
  name?: string;
  email?: string;
  phone?: string;
  password?: string;
  idNumber?: string;
}

export default function SignUp() {
  const { effectiveTheme } = useTheme();
  const { register } = useAuth();
  const [formData, setFormData] = useState<FormData>({
    name: "",
    gender: "male",
    email: "",
    phone: "",
    password: "",
    idType: "nid",
    idNumber: "",
    dob: new Date(2000, 0, 1),
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleChange = <K extends keyof FormData>(name: K, value: FormData[K]) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!validateEmail(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!validatePhone(formData.phone)) {
      newErrors.phone = "Please enter a valid phone number";
    }

    if (!validatePassword(formData.password)) {
      newErrors.password = "Password must be at least 8 characters long";
    }

    if (!formData.idNumber.trim()) {
      newErrors.idNumber = "ID number is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        gender: formData.gender,
        phone: formData.phone,
        id_type: formData.idType,
        id_number: formData.idNumber,
        dob: formData.dob.toISOString().split('T')[0],
      });
      
      router.replace("/");
    } catch (error: any) {
      Alert.alert("Signup Failed", error.message || "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      handleChange("dob", selectedDate);
    }
  };

  return (
    <View className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ padding: 24 }} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View className="mb-8">
          <Text className="text-headline text-on-surface">Create Account</Text>
          <Text className="text-body text-on-surface-variant mt-2">
            Join Aegis for complete safety protection
          </Text>
        </View>

        {/* Personal Information */}
        <View className="space-y-4 mb-6">
          <Text className="text-title text-on-surface">Personal Information</Text>

          <View>
            <Text className="text-label text-on-surface-variant mb-2">Full Name</Text>
            <TextInput
              className={`bg-surface-variant rounded-xl p-4 text-on-surface border ${
                errors.name ? "border-error" : "border-outline"
              }`}
              placeholder="Your full name"
              placeholderTextColor="rgb(var(--color-on-surface-variant))"
              value={formData.name}
              onChangeText={(text) => handleChange("name", text)}
              editable={!isLoading}
            />
            {errors.name && <Text className="text-error text-sm mt-1">{errors.name}</Text>}
          </View>

          <View>
            <Text className="text-label text-on-surface-variant mb-2">Gender</Text>
            <View className="bg-surface-variant rounded-xl border border-outline">
              <Picker
                selectedValue={formData.gender}
                onValueChange={(value) => handleChange("gender", value)}
                enabled={!isLoading}
                dropdownIconColor="rgb(var(--color-on-surface-variant))"
              >
                <Picker.Item label="Male" value="male" />
                <Picker.Item label="Female" value="female" />
                <Picker.Item label="Other" value="other" />
              </Picker>
            </View>
          </View>

          <View>
            <Text className="text-label text-on-surface-variant mb-2">Date of Birth</Text>
            <TouchableOpacity
              className="bg-surface-variant rounded-xl p-4 border border-outline"
              onPress={() => setShowDatePicker(true)}
              disabled={isLoading}
            >
              <Text className="text-on-surface">{formData.dob.toLocaleDateString()}</Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={formData.dob}
                mode="date"
                display="default"
                onChange={onDateChange}
                maximumDate={new Date()}
              />
            )}
          </View>
        </View>

        {/* Contact Information */}
        <View className="space-y-4 mb-6">
          <Text className="text-title text-on-surface">Contact Information</Text>

          <View>
            <Text className="text-label text-on-surface-variant mb-2">Email</Text>
            <TextInput
              className={`bg-surface-variant rounded-xl p-4 text-on-surface border ${
                errors.email ? "border-error" : "border-outline"
              }`}
              placeholder="your@email.com"
              placeholderTextColor="rgb(var(--color-on-surface-variant))"
              value={formData.email}
              onChangeText={(text) => handleChange("email", text)}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!isLoading}
            />
            {errors.email && <Text className="text-error text-sm mt-1">{errors.email}</Text>}
          </View>

          <View>
            <Text className="text-label text-on-surface-variant mb-2">Phone Number</Text>
            <TextInput
              className={`bg-surface-variant rounded-xl p-4 text-on-surface border ${
                errors.phone ? "border-error" : "border-outline"
              }`}
              placeholder="+880 1XXX-XXXXXX"
              placeholderTextColor="rgb(var(--color-on-surface-variant))"
              value={formData.phone}
              onChangeText={(text) => handleChange("phone", text)}
              keyboardType="phone-pad"
              editable={!isLoading}
            />
            {errors.phone && <Text className="text-error text-sm mt-1">{errors.phone}</Text>}
          </View>
        </View>

        {/* Security Information */}
        <View className="space-y-4 mb-6">
          <Text className="text-title text-on-surface">Security</Text>

          <View>
            <Text className="text-label text-on-surface-variant mb-2">Password</Text>
            <TextInput
              className={`bg-surface-variant rounded-xl p-4 text-on-surface border ${
                errors.password ? "border-error" : "border-outline"
              }`}
              placeholder="••••••••"
              placeholderTextColor="rgb(var(--color-on-surface-variant))"
              value={formData.password}
              onChangeText={(text) => handleChange("password", text)}
              secureTextEntry
              editable={!isLoading}
            />
            {errors.password && <Text className="text-error text-sm mt-1">{errors.password}</Text>}
          </View>
        </View>

        {/* Identification */}
        <View className="space-y-4 mb-8">
          <Text className="text-title text-on-surface">Identification</Text>

          <View>
            <Text className="text-label text-on-surface-variant mb-2">ID Type</Text>
            <View className="bg-surface-variant rounded-xl border border-outline">
              <Picker
                selectedValue={formData.idType}
                onValueChange={(value) => handleChange("idType", value)}
                enabled={!isLoading}
                dropdownIconColor="rgb(var(--color-on-surface-variant))"
              >
                <Picker.Item label="National ID (NID)" value="nid" />
                <Picker.Item label="Birth Certificate" value="birth" />
              </Picker>
            </View>
          </View>

          <View>
            <Text className="text-label text-on-surface-variant mb-2">
              {formData.idType === "nid" ? "NID Number" : "Birth Certificate Number"}
            </Text>
            <TextInput
              className={`bg-surface-variant rounded-xl p-4 text-on-surface border ${
                errors.idNumber ? "border-error" : "border-outline"
              }`}
              placeholder={
                formData.idType === "nid"
                  ? "Enter your NID number"
                  : "Enter birth certificate number"
              }
              placeholderTextColor="rgb(var(--color-on-surface-variant))"
              value={formData.idNumber}
              onChangeText={(text) => handleChange("idNumber", text)}
              keyboardType={formData.idType === "nid" ? "number-pad" : "default"}
              editable={!isLoading}
            />
            {errors.idNumber && <Text className="text-error text-sm mt-1">{errors.idNumber}</Text>}
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          className="bg-primary py-5 rounded-xl shadow-sm active:bg-primary-container mb-4"
          onPress={handleSubmit}
          disabled={isLoading}
          activeOpacity={0.9}
        >
          {isLoading ? (
            <View className="flex-row justify-center items-center space-x-2">
              <ActivityIndicator size="small" color="white" />
              <Text className="text-on-primary font-bold text-lg">Creating Account...</Text>
            </View>
          ) : (
            <Text className="text-on-primary text-center font-bold text-lg">Sign Up</Text>
          )}
        </TouchableOpacity>

        {/* Login Link */}
        <View className="flex-row justify-center">
          <Text className="text-on-surface-variant mr-1">Already have an account?</Text>
          <Link href="/login" asChild>
            <TouchableOpacity className="active:bg-hover rounded px-1" disabled={isLoading}>
              <Text className="text-secondary font-medium">Login</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </ScrollView>
    </View>
  );
}