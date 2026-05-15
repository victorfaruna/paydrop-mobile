import { Ionicons } from "@expo/vector-icons";
import { ScrollView, Text, View } from "react-native";

const MOCK_NOTIFICATIONS = [
  {
    id: "n1",
    title: "Payment received",
    message: "You received ₦12,500 from Ola.",
    time: "2m ago",
  },
  {
    id: "n2",
    title: "New login",
    message: "Your account was accessed from a new device.",
    time: "1h ago",
  },
  {
    id: "n3",
    title: "Transfer completed",
    message: "Your transfer to Sade has been processed.",
    time: "Yesterday",
  },
];

export default function NotificationsScreen() {
  return (
    <ScrollView
      className="flex-1 bg-white px-6 pt-14"
      showsVerticalScrollIndicator={false}
    >
      <Text className="text-3xl font-clash-bold text-black mb-2">
        Notifications
      </Text>
      <Text className="text-grey-500 font-clash-regular text-sm mb-6">
        Latest activity from your account.
      </Text>

      {MOCK_NOTIFICATIONS.map((item) => (
        <View
          key={item.id}
          className="bg-grey-50 rounded-3xl p-4 mb-3 border border-grey-100"
        >
          <View className="flex-row items-center justify-between mb-2">
            <View className="flex-row items-center">
              <View className="w-10 h-10 rounded-full bg-purple-100 items-center justify-center mr-3">
                <Ionicons
                  name="notifications-outline"
                  size={20}
                  color="#7C3AED"
                />
              </View>
              <View>
                <Text className="text-black font-clash-semibold text-base">
                  {item.title}
                </Text>
                <Text className="text-grey-500 font-clash-regular text-xs mt-1">
                  {item.time}
                </Text>
              </View>
            </View>
          </View>
          <Text className="text-grey-600 font-clash-regular text-sm">
            {item.message}
          </Text>
        </View>
      ))}

      {MOCK_NOTIFICATIONS.length === 0 && (
        <View className="items-center mt-16">
          <Text className="text-grey-500 font-clash-regular text-base">
            No notifications yet.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}
