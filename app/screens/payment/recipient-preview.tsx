import ScreenView from "@/components/layout/ScreenView";
import api from "@/services/api";
import { useUserStore } from "@/store/userStore";
import size from "@/utils/size";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function RecipientPreviewScreen() {
  const router = useRouter();
  const { user: userParam } = useLocalSearchParams<{ user: string }>();
  const accessToken = useUserStore((state) => state.accessToken);

  const recipient = userParam ? JSON.parse(userParam) : null;
  const [fraudData, setFraudData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrustData = async () => {
      if (!recipient?.id) return;
      try {
        const response = await api.get(`/fraud/recipient/${recipient.id}`);
        setFraudData(response.data);
      } catch (error) {
        console.error("Fraud data fetch error", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTrustData();
  }, [recipient?.id, accessToken]);

  if (!recipient) return null;

  const trustTier = fraudData?.trust_tier || recipient.trust_tier || "medium";
  const trustScore = fraudData?.trust_score || recipient.trust_score || 0;

  const getTierBadge = () => {
    switch (trustTier) {
      case "high":
        return { bg: "#00D68F", label: "✅ Trusted", color: "#000000" };
      case "medium":
        return { bg: "#FFB347", label: "⚠️ Caution", color: "#000000" };
      case "low":
        return { bg: "#FF6B6B", label: "🚫 High Risk", color: "#FFFFFF" };
      default:
        return { bg: "#F3F4F6", label: "Unknown", color: "#1A1A1A" };
    }
  };

  const badge = getTierBadge();

  return (
    <ScreenView>
      <View className="flex-1 bg-white">
        {/* Header */}
        <View className="px-6 pt-4 pb-4 flex-row justify-end">
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="close" size={28} color="#1A1A1A" />
          </TouchableOpacity>
        </View>

        <View className="flex-1 items-center px-6 mt-12">
          {/* Recipient Card */}
          <View className="items-center">
            <Image
              source={{
                uri:
                  recipient.avatar_url ||
                  `https://ui-avatars.com/api/?name=${recipient.first_name}+${recipient.last_name}&background=random`,
              }}
              className="w-20 h-20 rounded-full mb-4"
            />
            <Text className="text-[#1A1A1A] font-clash-semibold text-[22px]">
              {recipient.first_name} {recipient.last_name}
            </Text>
            <Text className="text-[#6B7280] font-clash-regular text-[15px] mb-4">
              {recipient.username}
            </Text>

            <View
              style={{ backgroundColor: badge.bg }}
              className="rounded-full px-4 py-2 mb-3"
            >
              <Text
                style={{ color: badge.color }}
                className="font-clash-medium text-[14px]"
              >
                {badge.label}
              </Text>
            </View>

            {loading ? (
              <ActivityIndicator size="small" color="#00D68F" />
            ) : (
              <>
                {trustScore > 0 && (
                  <Text className="text-[#6B7280] font-clash-regular text-[14px] mb-1">
                    {trustScore}% trust score
                  </Text>
                )}
                {recipient.mutual_trust && (
                  <Text className="text-[#6B7280] font-clash-regular text-[13px] mb-1">
                    👥 Trusted by {recipient.mutual_trust}
                  </Text>
                )}
                {recipient.presence && (
                  <Text className="text-[#6B7280] font-clash-regular text-[13px]">
                    📍 {recipient.presence}
                  </Text>
                )}
                {recipient.distance_signal && !recipient.presence && (
                  <Text className="text-[#6B7280] font-clash-regular text-[13px]">
                    📍 {recipient.distance_signal === "NEAR" ? "Nearby" : recipient.distance_signal}
                  </Text>
                )}
              </>
            )}
          </View>
        </View>

        {/* Buttons */}
        <View className="px-6 pb-12">
          <TouchableOpacity
            onPress={() =>
              router.push({
                pathname: "/screens/payment/enter-amount" as any,
                params: {
                  recipientId: recipient.id,
                  recipientName: `${recipient.first_name} ${recipient.last_name}`,
                  recipientAvatar: recipient.avatar_url,
                },
              })
            }
            className="bg-purple-400 rounded-full items-center justify-center w-full mb-4"
            style={{ paddingVertical: size.height(18) }}
          >
            <Text className="text-white font-clash-semibold text-[16px]">
              Proceed to Pay
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.back()}
            className="items-center"
          >
            <Text className="text-[#6B7280] font-clash-medium text-[14px]">
              Cancel
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScreenView>
  );
}
