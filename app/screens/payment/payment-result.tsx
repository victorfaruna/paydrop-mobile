import { koboToNaira } from "@/utils/currency";
import size from "@/utils/size";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import { Animated, Share, Text, TouchableOpacity, View } from "react-native";

export default function PaymentResultScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    txId?: string;
    success: string;
    amount: string;
    recipientName: string;
    error?: string;
  }>();

  const isSuccess = params.success === "true";

  const scaleAnim = useRef(new Animated.Value(0)).current;
  const insightAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 6,
      tension: 40,
      useNativeDriver: true,
    }).start();

    if (isSuccess) {
      Animated.timing(insightAnim, {
        toValue: 1,
        duration: 400,
        delay: 600,
        useNativeDriver: true,
      }).start();
    }
  }, [isSuccess]);

  const handleShare = async () => {
    if (!isSuccess) return;
    try {
      await Share.share({
        message: `Sent ${koboToNaira(parseInt(params.amount))} to ${params.recipientName} via PayDrop. Tx ID: ${params.txId}`,
      });
    } catch (error) {
      console.error("Share error", error);
    }
  };

  const handleDone = () => {
    router.replace("/(tabs)/home");
  };

  return (
    <View className="flex-1 bg-white items-center justify-center px-6">
      <View className="items-center mb-10">
        <Animated.View
          style={{
            transform: [{ scale: scaleAnim }],
            backgroundColor: isSuccess ? "#00D68F" : "#FF6B6B",
          }}
          className="w-20 h-20 rounded-full items-center justify-center mb-6"
        >
          <Ionicons
            name={isSuccess ? "checkmark" : "close"}
            size={40}
            color="white"
          />
        </Animated.View>

        <Text className="text-[#1A1A1A] font-clash-bold text-[32px] mb-2">
          {isSuccess ? "Sent!" : "Transfer Failed"}
        </Text>

        {isSuccess ? (
          <>
            <Text className="text-[#6B7280] font-clash-medium text-[20px] mb-1">
              {koboToNaira(parseInt(params.amount))}
            </Text>
            <Text className="text-[#6B7280] font-clash-regular text-[14px]">
              to @{params.recipientName.replace(/\s+/g, "").toLowerCase()}
            </Text>
            {params.txId && (
              <Text className="text-[#9CA3AF] font-space-mono text-[10px] mt-4 uppercase">
                ID: {params.txId.slice(0, 8)}…
              </Text>
            )}

            <Animated.View
              style={{
                opacity: insightAnim,
                transform: [
                  {
                    translateY: insightAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [10, 0],
                    }),
                  },
                ],
              }}
              className="bg-[#00D68F]/10 px-4 py-2 rounded-full mt-6"
            >
              <Text className="text-[#00D68F] font-clash-medium text-[12px]">
                ⚡ Trust score increased by +1
              </Text>
            </Animated.View>
          </>
        ) : (
          <Text className="text-[#6B7280] font-clash-regular text-[16px] text-center px-8">
            {params.error || "Something went wrong with the transfer."}
          </Text>
        )}
      </View>

      <View className="absolute bottom-12 left-6 right-6">
        <TouchableOpacity
          onPress={handleDone}
          style={{
            height: size.height(56),
          }}
          className="bg-purple-400 rounded-full items-center justify-center w-full mb-4"
        >
          <Text className="text-white font-clash-semibold text-[16px]">
            Done
          </Text>
        </TouchableOpacity>

        {isSuccess && (
          <TouchableOpacity onPress={handleShare} className="items-center">
            <Text className="text-[#6B7280] font-clash-medium text-[14px]">
              Share Receipt
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
