import axios from "axios";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
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

export default function FlagWarningScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    confirmToken: string;
    fraudReason: string;
    fraudScore: string;
    recipientName: string;
    amount: string;
    expiresAt: string;
  }>();

  const accessToken = useUserStore((state) => state.accessToken);
  const [timeLeft, setTimeLeft] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const expiry = new Date(params.expiresAt).getTime();
    
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const diff = expiry - now;
      
      if (diff <= 0) {
        setTimeLeft("00:00");
        clearInterval(interval);
      } else {
        const minutes = Math.floor(diff / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        setTimeLeft(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [params.expiresAt]);

  const handleProceed = async () => {
    setProcessing(true);
    try {
      await axios.post(
        `${BASE_URL}/api/v1/transactions/transfer/confirm`,
        { confirm_token: params.confirmToken },
        {
          headers: { 
            "x-device-id": DEVICE_ID,
            Authorization: accessToken ? `Bearer ${accessToken}` : undefined,
          },
        }
      );

      router.push({
        pathname: "/payment-result" as any,
        params: {
          success: "true",
          amount: params.amount,
          recipientName: params.recipientName,
        },
      });
    } catch (error: any) {
      console.error("Confirm error", error);
      router.push({
        pathname: "/payment-result" as any,
        params: {
          success: "false",
          error: error.response?.data?.message || "Confirmation failed",
          amount: params.amount,
          recipientName: params.recipientName,
        },
      });
    } finally {
      setProcessing(false);
    }
  };

  const score = parseInt(params.fraudScore);
  const getScoreColor = (s: number) => {
    if (s <= 39) return "#00D68F";
    if (s <= 69) return "#FFB347";
    return "#FF6B6B";
  };

  return (
    <View className="flex-1 bg-white px-6 pt-[60px]">
      <View className="items-center mb-10">
        <View className="w-[60px] h-[60px] rounded-full bg-[#FFB347]/20 items-center justify-center mb-6">
          <Text style={{ fontSize: 32 }}>⚠️</Text>
        </View>
        <Text className="text-[#1A1A1A] font-clash-bold text-[22px] text-center mb-2">
          Proceed with Caution
        </Text>
        <Text className="text-[#6B7280] font-clash-regular text-[14px] text-center px-4">
          This transaction was flagged by our fraud system.
        </Text>
      </View>

      <View className="bg-[#F3F4F6] rounded-[16px] p-[20px] mb-8">
        <Text className="text-[#1A1A1A] font-clash-regular text-[14px] mb-4">
          {params.fraudReason || "Unusual transaction pattern detected."}
        </Text>
        
        <View className="flex-row justify-between items-center mb-3">
          <Text className="text-[#6B7280] font-clash-medium text-[13px]">
            Risk Score:
          </Text>
          <Text 
            style={{ color: getScoreColor(score) }}
            className="font-clash-bold text-[14px]"
          >
            {score} / 100
          </Text>
        </View>

        <View className="h-[1px] bg-[#D1D5DB] my-3" />

        <View className="flex-row justify-between items-center">
          <Text className="text-[#1A1A1A] font-clash-bold text-[16px]">
            {koboToNaira(parseInt(params.amount))}
          </Text>
          <Text className="text-[#6B7280] font-clash-medium text-[13px]">
            to @{params.recipientName.replace(/\s+/g, '').toLowerCase()}
          </Text>
        </View>
      </View>

      <View className="items-center mb-10">
        <Text className="text-[#FFB347] font-clash-medium text-[14px]">
          This approval expires in {timeLeft}
        </Text>
      </View>

      <View className="flex-1 justify-end pb-12">
        <TouchableOpacity
          onPress={handleProceed}
          disabled={processing}
          className="bg-[#FFB347] h-[52px] rounded-full items-center justify-center w-full mb-4"
        >
          {processing ? (
            <ActivityIndicator color="black" />
          ) : (
            <Text className="text-black font-clash-bold text-[16px]">
              Proceed Anyway
            </Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => router.back()}
          className="bg-[#F3F4F6] border border-black/10 h-[52px] rounded-full items-center justify-center w-full"
        >
          <Text className="text-[#1A1A1A] font-clash-bold text-[16px]">
            Cancel Transfer
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
