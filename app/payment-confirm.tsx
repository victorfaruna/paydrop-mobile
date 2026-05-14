import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useUserStore } from "@/store/userStore";
import { koboToNaira } from "@/utils/currency";

const BASE_URL = "https://pay-drop-backend.vercel.app";
const DEVICE_ID = "paydrop-mobile-app";

export default function PaymentConfirmScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    recipientId: string;
    recipientName: string;
    recipientAvatar: string;
    amount: string;
    note: string;
    idempotencyKey: string;
  }>();

  const accessToken = useUserStore((state) => state.accessToken);
  const [processing, setProcessing] = useState(false);

  // Mock fraud score
  const fraudScore = 24;
  const verdict = "CLEAR";

  const getScoreColor = (score: number) => {
    if (score <= 39) return "#00D68F";
    if (score <= 69) return "#FFB347";
    return "#FF6B6B";
  };

  const handleConfirm = async () => {
    setProcessing(true);
    try {
      const response = await axios.post(
        `${BASE_URL}/api/v1/transactions/transfer`,
        {
          recipient_id: params.recipientId,
          amount: parseInt(params.amount),
          idempotency_key: params.idempotencyKey,
          note: params.note,
        },
        {
          headers: { 
            "x-device-id": DEVICE_ID,
            Authorization: accessToken ? `Bearer ${accessToken}` : undefined,
          },
        }
      );

      if (response.data.verdict === "FLAG") {
        router.push({
          pathname: "/flag-warning" as any,
          params: { 
            ...response.data,
            recipientName: params.recipientName,
            amount: params.amount,
          },
        });
      } else {
        router.push({
          pathname: "/payment-result" as any,
          params: {
            txId: response.data.id,
            success: "true",
            amount: params.amount,
            recipientName: params.recipientName,
          },
        });
      }
    } catch (error: any) {
      console.error("Transfer error", error);
      router.push({
        pathname: "/payment-result" as any,
        params: {
          success: "false",
          error: error.response?.data?.message || "Transfer failed",
          amount: params.amount,
          recipientName: params.recipientName,
        },
      });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <View className="flex-1 bg-white px-6 pt-14">
      {/* Header */}
      <View className="flex-row items-center justify-between mb-12">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text className="text-[#1A1A1A] font-clash-bold text-[22px]">
          Confirm Payment
        </Text>
        <View className="w-6" />
      </View>

      <View className="items-center mb-10">
        <Text className="text-[#1A1A1A] font-clash-bold text-[40px]">
          {koboToNaira(parseInt(params.amount))}
        </Text>
        <Text className="text-[#6B7280] font-clash-medium text-[15px] mt-2">
          to @{params.recipientName.replace(/\s+/g, '').toLowerCase()}
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
                backgroundColor: getScoreColor(fraudScore) 
              }} 
              className="h-full rounded-full" 
            />
          </View>
          <Text className="text-[#1A1A1A] font-clash-bold text-[14px]">
            Score: {fraudScore}
          </Text>
        </View>

        <View className="flex-row items-center justify-between mt-4">
          <View 
            style={{ backgroundColor: getScoreColor(fraudScore) + '20' }}
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
          className="bg-[#00D68F] h-[52px] rounded-full items-center justify-center w-full mb-4"
        >
          {processing ? (
            <ActivityIndicator color="black" />
          ) : (
            <Text className="text-black font-clash-bold text-[16px]">
              Confirm & Pay
            </Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.back()} className="items-center">
          <Text className="text-[#6B7280] font-clash-medium text-[14px]">
            Cancel
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
