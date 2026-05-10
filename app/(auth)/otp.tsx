import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import { Image, Text, TextInput, TouchableOpacity, View } from "react-native";

export default function OTPScreen() {
  const router = useRouter();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const inputRefs = useRef<Array<TextInput | null>>([]);

  const handleOtpChange = (value: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  return (
    <View className="flex-1 bg-white px-6 pt-20">
      <View className="absolute inset-0 opacity-5">
        <Image
          source={require("../../assets/images/bg-mesh.png")}
          className="w-full h-full"
        />
      </View>

      <TouchableOpacity
        onPress={() => router.back()}
        className="w-12 h-12 bg-grey-50 rounded-full items-center justify-center mb-8 border border-grey-100"
      >
        <Ionicons name="arrow-back" size={18} color="#000" />
      </TouchableOpacity>

      <Text className="text-3xl font-clash-semibold text-black mb-2">
        Verify Code
      </Text>
      <Text className="text-base font-clash-regular text-grey-500 mb-10 leading-6">
        Enter the 6-digit code sent to your phone number.
      </Text>

      <View className="flex-row justify-between mb-10 gap-4">
        {otp.map((digit, index) => (
          <View
            key={index}
            className={`flex-1 h-16 bg-grey-50 rounded-xl border ${
              digit ? "border-purple-500" : "border-grey-200"
            } items-center justify-center`}
          >
            <TextInput
              ref={(ref) => (inputRefs.current[index] = ref)}
              className="text-2xl font-clash-semibold text-black text-center w-full h-full"
              keyboardType="number-pad"
              maxLength={1}
              value={digit}
              onChangeText={(value) => handleOtpChange(value, index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
              autoFocus={index === 0}
            />
          </View>
        ))}
      </View>

      <TouchableOpacity
        className="bg-purple-500 h-16 rounded-2xl justify-center items-center mb-6"
        onPress={() => router.push("/(auth)/display-name")}
      >
        <Text className="text-white font-clash-bold text-lg">
          Verify & Continue
        </Text>
      </TouchableOpacity>

      <View className="flex-row justify-center">
        <Text className="text-grey-500 font-clash-regular text-base">
          Didn't receive the code?{" "}
        </Text>
        <TouchableOpacity>
          <Text className="text-purple-500 font-clash-semibold text-base">
            Resend
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
