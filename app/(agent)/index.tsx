import { router } from "expo-router";
import { Alert, Text, TouchableOpacity, View } from "react-native";
import { useAuth } from "../../providers/AuthProvider";

export default function AgentHome() {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        { 
          text: "Logout", 
          onPress: () => {
            logout();
            router.replace("/login");
          },
          style: "destructive"
        }
      ]
    );
  };

  return (
    <View className="flex-1 bg-background p-6">
      <View className="mb-8">
        <Text className="text-headline text-on-surface">Agent Dashboard</Text>
        <Text className="text-body text-on-surface-variant mt-2">
          Welcome to Aegis Agent Portal
        </Text>
      </View>

      <View className="bg-surface-variant p-6 rounded-xl mb-6">
        <Text className="text-title text-on-surface mb-4">Agent Profile</Text>
        
        <View className="space-y-3">
          <View>
            <Text className="text-label text-on-surface-variant">Name</Text>
            <Text className="text-body text-on-surface">{user?.name}</Text>
          </View>
          
          <View>
            <Text className="text-label text-on-surface-variant">Email</Text>
            <Text className="text-body text-on-surface">{user?.email}</Text>
          </View>
          
          <View>
            <Text className="text-label text-on-surface-variant">Agent ID</Text>
            <Text className="text-body text-on-surface">{user?.agent_id || "Not provided"}</Text>
          </View>
          
          <View>
            <Text className="text-label text-on-surface-variant">Phone</Text>
            <Text className="text-body text-on-surface">{user?.phone || "Not provided"}</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity
        className="bg-secondary py-4 rounded-xl mb-4"
        onPress={() => router.push("/(agent)/profile")}
      >
        <Text className="text-on-secondary text-center font-bold text-lg">
          Edit Profile
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        className="bg-primary py-4 rounded-xl mb-4"
        onPress={() => Alert.alert("Feature", "View assigned cases")}
      >
        <Text className="text-on-primary text-center font-bold text-lg">
          View Cases
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        className="bg-error py-4 rounded-xl"
        onPress={handleLogout}
      >
        <Text className="text-on-error text-center font-bold text-lg">
          Logout
        </Text>
      </TouchableOpacity>
    </View>
  );
}