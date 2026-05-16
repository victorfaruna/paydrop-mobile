import ScreenView from "@/components/layout/ScreenView";
import api from "@/services/api";
import { useUserStore } from "@/store/userStore";
import { koboToNaira } from "@/utils/currency";
import size from "@/utils/size";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";

export default function PaymentConfirmScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    recipientId: string;
    recipientName: string;
    recipientAvatar: string;
    amount: string;
    note: string;
  }>();

  const accessToken = useUserStore((state) => state.accessToken);
  const [processing, setProcessing] = useState(false);

  // Mock fraud score
  const fraudScore = 24;
  const verdict = "PENDING";

  const getScoreColor = (score: number) => {
    if (score <= 39) return "#00D68F";
    if (score <= 69) return "#FFB347";
    return "#FF6B6B";
  };

  const handleConfirm = async () => {
    setProcessing(true);
    try {
      console.log("Initiating transfer...", {
        recipient_id: params.recipientId,
        amount: parseInt(params.amount),
        note: params.note,
        nip_code: "000013",
      });

      const response = await api.post("/transactions/transfer", {
        recipient_id: params.recipientId,
        amount: parseInt(params.amount),
        note: params.note,
        nip_code: "000013",
      });

      console.log("Transfer response:", response.data);

      const verdict = response.data.verdict;

      if (verdict === "FLAG") {
        router.push({
          pathname: "/screens/payment/flag-warning" as any,
          params: {
            confirmToken: response.data.confirm_token,
            recipientName: params.recipientName,
            amount: params.amount,
            fraudScore: response.data.fraud_score?.toString() || "0",
            fraudReason:
              response.data.fraud_reason ||
              "Unusual transaction pattern detected.",
            expiresAt:
              response.data.expires_at ||
              new Date(Date.now() + 5 * 60000).toISOString(),
          },
        });
      } else if (verdict === "CLEAR" || !verdict) {
        router.push({
          pathname: "/screens/payment/payment-result" as any,
          params: {
            txId: response.data.id,
            success: "true",
            recipientName: params.recipientName,
            amount: params.amount,
          },
        });
      } else {
        // Handle DENY or other unknown verdicts
        throw new Error(
          response.data.message || `Transaction declined: ${verdict}`,
        );
      }
    } catch (error: any) {
      console.error("Transfer error", error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Something went wrong";

      router.push({
        pathname: "/screens/payment/payment-result" as any,
        params: {
          success: "false",
          error: errorMessage,
          recipientName: params.recipientName,
          amount: params.amount,
        },
      });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <ScreenView>
      <View className="flex-1 bg-white px-6 pt-4">
        {/* Header */}
        <View className="flex-row items-center justify-between mb-12">
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
          </TouchableOpacity>
          <Text className="text-[#1A1A1A] font-clash-semibold text-[22px]">
            Confirm Payment
          </Text>
          <View className="w-6" />
        </View>

        <View className="items-center mb-10">
          <Text className="text-[#1A1A1A] font-clash-bold text-[40px]">
            {koboToNaira(parseInt(params.amount))}
          </Text>
          <Text className="text-[#6B7280] font-clash-medium text-[15px] mt-2">
            to @{params.recipientName.replace(/\s+/g, "").toLowerCase()}
          </Text>
        </View>

        {/* Fraud Indicator Card */}
        <View className="bg-[#F3F4F6] rounded-[16px] p-[20px]">
          <Text className="text-[#6B7280] font-clash-bold text-[13px] uppercase mb-4">
            Trust Check
          </Text>

          <View className="flex-row justify-between items-center mb-2">
            <View className="h-2 flex-1 bg-[#D1D5DB] rounded-full mr-4">
              <View
                style={{
                  width: `${fraudScore}%`,
                  backgroundColor: getScoreColor(fraudScore),
                }}
                className="h-full rounded-full"
              />
            </View>
            <Text className="text-[#1A1A1A] font-clash-semibold text-[14px]">
              Score: {fraudScore}
            </Text>
          </View>

          <View className="flex-row items-center justify-between mt-4">
            <View
              style={{ backgroundColor: getScoreColor(fraudScore) + "20" }}
              className="rounded-full px-3 py-1"
            >
              <Text
                style={{ color: getScoreColor(fraudScore) }}
                className="font-clash-bold text-[12px]"
              >
                {verdict}
              </Text>
            </View>
            {params.note ? (
              <Text className="text-[#6B7280] font-clash-regular text-[13px] italic">
                "{params.note}"
              </Text>
            ) : null}
          </View>
        </View>

        {/* Buttons */}
        <View className="flex-1 justify-end pb-12">
          <TouchableOpacity
            onPress={handleConfirm}
            disabled={processing}
            style={{
              height: size.height(54),
            }}
            className="bg-purple-400  rounded-full items-center justify-center w-full mb-4"
          >
            {processing ? (
              <ActivityIndicator color="black" />
            ) : (
              <Text className="text-white font-clash-semibold text-[16px]">
                Confirm & Pay
              </Text>
            )}
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
