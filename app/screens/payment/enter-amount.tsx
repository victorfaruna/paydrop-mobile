import ScreenView from "@/components/layout/ScreenView";
import size from "@/utils/size";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Image, Text, TextInput, TouchableOpacity, View } from "react-native";

// Simple UUID generator fallback
const generateUUID = () => {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    var r = (Math.random() * 16) | 0,
      v = c == "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export default function EnterAmountScreen() {
  const router = useRouter();
  const { recipientId, recipientName, recipientAvatar } = useLocalSearchParams<{
    recipientId: string;
    recipientName: string;
    recipientAvatar: string;
  }>();

  const [amount, setAmount] = useState("0");
  const [note, setNote] = useState("");
  const [idempotencyKey] = useState(() => generateUUID());

  const handleKeyPress = (key: string) => {
    if (key === "backspace") {
      setAmount((prev) => (prev.length > 1 ? prev.slice(0, -1) : "0"));
    } else if (key === ".") {
      if (!amount.includes(".")) {
        setAmount((prev) => prev + ".");
      }
    } else {
      setAmount((prev) => (prev === "0" ? key : prev + key));
    }
  };

  const formattedAmount = () => {
    const num = parseFloat(amount);
    if (isNaN(num)) return "0.00";
    return num.toLocaleString("en-NG", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const amountInKobo = Math.round(parseFloat(amount) * 100);
  const isValidAmount = amountInKobo >= 10000; // Minimum NGN 100 = 10000 kobo

  return (
    <ScreenView>
      <View className="flex-1 bg-white px-6 pt-4">
        {/* Header / Recipient Pill */}
        <View className="items-center mb-12">
          <View className="flex-row items-center bg-[#F3F4F6] rounded-full px-4 py-2">
            <Image
              source={{ uri: recipientAvatar || "https://i.pravatar.cc/100" }}
              className="w-10 h-10 rounded-full mr-3"
            />
            <Text className="text-black font-clash-semibold text-[16px]">
              {recipientName}
            </Text>
          </View>
        </View>

        {/* Amount Display */}
        <View className="items-center mb-8">
          <View className="flex-row items-center">
            <Text className="text-[#9CA3AF] font-clash-medium text-[28px] mr-2">
              ₦
            </Text>
            <Text className="text-[#1A1A1A] font-clash-semibold text-5xl">
              {formattedAmount()}
            </Text>
          </View>
          {!isValidAmount && amount !== "0" && (
            <Text className="text-[#FF6B6B] font-clash-regular text-[12px] mt-2">
              Minimum ₦100
            </Text>
          )}
        </View>

        {/* Note Field */}
        <View className="bg-[#F3F4F6] rounded-[12px] p-[14px] mb-8">
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="Add a note (optional)"
            placeholderTextColor="#9CA3AF"
            maxLength={100}
            className="text-[#1A1A1A] font-clash-regular text-[14px]"
          />
        </View>

        {/* Custom Numpad */}
        <View className="flex-1 justify-end pb-12">
          <View className="flex-row flex-wrap justify-between">
            {[
              "1",
              "2",
              "3",
              "4",
              "5",
              "6",
              "7",
              "8",
              "9",
              ".",
              "0",
              "backspace",
            ].map((key) => (
              <TouchableOpacity
                key={key}
                onPress={() => handleKeyPress(key)}
                className="w-[30%] h-[64px] bg-[#F3F4F6] rounded-[12px] items-center justify-center mb-3"
              >
                {key === "backspace" ? (
                  <Ionicons
                    name="backspace-outline"
                    size={24}
                    color="#1A1A1A"
                  />
                ) : (
                  <Text className="text-[#1A1A1A] font-clash-bold text-[22px]">
                    {key}
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            onPress={() =>
              router.push({
                pathname: "/screens/payment/payment-confirm" as any,
                params: {
                  recipientId,
                  recipientName,
                  recipientAvatar,
                  amount: amountInKobo,
                  note,
                  idempotencyKey,
                },
              })
            }
            disabled={!isValidAmount}
            style={{
              height: size.height(54),
            }}
            className={`rounded-full items-center justify-center w-full mt-6 ${isValidAmount ? "bg-purple-400" : "bg-purple-400/40"}`}
          >
            <Text className="text-white font-clash-semibold text-xl">
              Continue
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScreenView>
  );
}
