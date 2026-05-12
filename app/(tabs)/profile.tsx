import { useUserStore } from "@/store/userStore";
import { useRouter } from "expo-router";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";

export default function ProfileScreen() {
  const router = useRouter();
  const user = useUserStore((state) => state.user);
  const logout = useUserStore((state) => state.logout);

  const fullName =
    user?.first_name || user?.name || user?.displayName
      ? `${user?.first_name ?? user?.name ?? user?.displayName}${user?.last_name ? ` ${user.last_name}` : ""}`
      : "PayDrop User";
  const username = user?.username || "@paydrop_user";
  const phone = user?.phone || "+234 000 000 0000";
  const email = user?.email || "Not added yet";
  const accountNumber = user?.virtual_account || "0000000000";
  const trustTier = user?.trust_tier ? `${user.trust_tier}` : "Unverified";
  const initials = fullName
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const handleLogout = () => {
    logout();
    router.replace("/(auth)/phone");
  };

  const handleEditProfile = () => {
    router.push("/(auth)/display-name");
  };

  return (
    <ScrollView
      className="flex-1 bg-white"
      showsVerticalScrollIndicator={false}
    >
      <View className="bg-purple-500 px-6 pt-16 pb-10 rounded-b-[40px]">
        <View className="flex-row justify-between items-center mb-8">
          <Text className="text-white font-clash-bold text-2xl">Profile</Text>
          <TouchableOpacity
            onPress={handleEditProfile}
            className="rounded-full bg-purple-400/20 px-4 py-2"
          >
            <Text className="text-white font-clash-medium text-sm">Edit</Text>
          </TouchableOpacity>
        </View>

        <View className="items-center">
          <View className="w-24 h-24 rounded-full bg-purple-100 items-center justify-center mb-4">
            <Text className="text-purple-700 font-clash-bold text-3xl">
              {initials}
            </Text>
          </View>
          <Text className="text-white font-clash-semibold text-2xl mb-1">
            {fullName}
          </Text>
          <Text className="text-purple-200 font-clash-regular text-base">
            {username}
          </Text>
        </View>
      </View>

      <View className="px-6 mt-8">
        <View className="bg-grey-50 rounded-3xl p-5 mb-4 border border-grey-100">
          <InfoRow label="Phone" value={phone} />
          <InfoRow label="Email" value={email} />
          <InfoRow label="Account No" value={accountNumber} />
          <InfoRow label="Bank" value="GTBank" />
          <InfoRow label="Trust tier" value={trustTier} />
        </View>

        <TouchableOpacity
          onPress={handleLogout}
          className="bg-purple-500 rounded-3xl py-4 items-center"
        >
          <Text className="text-white font-clash-semibold text-base">
            Logout
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between items-center py-3 border-b border-grey-100">
      <Text className="text-grey-500 font-clash-medium">{label}</Text>
      <Text className="text-black font-clash-semibold text-right ml-4">
        {value}
      </Text>
    </View>
  );
}
