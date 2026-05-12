import { useUserStore } from "@/store/userStore";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useRef, useState } from "react";
import {
  Alert,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

export default function OTPScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const getParam = (value: string | string[] | undefined) =>
    Array.isArray(value) ? value[0] : value;
  const phone = getParam(params.phone);
  const mode = getParam(params.mode) || "register";
  const firstName = getParam(params.firstName);
  const lastName = getParam(params.lastName);
  const email = getParam(params.email);
  const avatarUrl = getParam(params.avatarUrl);
  const isLoginMode = mode === "login";
  const setTokens = useUserStore((state) => state.setTokens);
  const setUser = useUserStore((state) => state.setUser);
  const BASE_URL = "https://pay-drop-backend.vercel.app";

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
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

  const handleVerify = async () => {
    const otpValue = otp.join("");
    if (otpValue.length < 6) {
      Alert.alert("Error", "Please enter the complete 6-digit code");
      return;
    }

    setLoading(true);
    try {
      const requestData: any = {
        phone,
        otp: otpValue,
      };

      if (!isLoginMode) {
        requestData.first_name = firstName;
        requestData.last_name = lastName;
        requestData.email = email;
        requestData.avatar_url = avatarUrl;
      }

      const response = await axios.post(
        `${BASE_URL}/api/v1/auth/verify-otp`,
        requestData,
      );

      console.log("OTP verify success", response.data);
      const accessToken =
        response.data?.access_token || response.data?.accessToken;
      const refreshToken =
        response.data?.refresh_token || response.data?.refreshToken;
      setTokens(accessToken ?? null, refreshToken ?? null);

      const resolvedUser =
        response.data?.user ??
        ({
          first_name: firstName,
          last_name: lastName,
          email,
          avatar_url: avatarUrl,
          phone,
        } as any);
      setUser(resolvedUser);

      router.replace("/(tabs)/home");
    } catch (error: any) {
      console.error(
        "Verification Error:",
        error.response?.data || error.message,
      );
      Alert.alert(
        "Verification Failed",
        error.response?.data?.message || "Invalid code. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      await axios.post(`${BASE_URL}/api/v1/auth/request-otp`, { phone });
      Alert.alert("Success", "OTP has been resent to your phone.");
    } catch (error: any) {
      Alert.alert("Error", "Failed to resend OTP. Please try again.");
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "white" }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 40 : 0}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            paddingTop: 20,
            paddingHorizontal: 24,
            paddingBottom: 24,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="flex-1 bg-white">
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
                    ref={(ref) => {
                      inputRefs.current[index] = ref;
                    }}
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
              className={`h-16 rounded-2xl justify-center items-center mb-6 ${
                loading ? "bg-purple-300" : "bg-purple-500"
              }`}
              onPress={handleVerify}
              disabled={loading}
            >
              <Text className="text-white font-clash-bold text-lg">
                {loading ? "Verifying..." : "Verify & Continue"}
              </Text>
            </TouchableOpacity>

            <View className="flex-row justify-center">
              <Text className="text-grey-500 font-clash-regular text-base">
                Didn't receive the code?{" "}
              </Text>
              <TouchableOpacity onPress={handleResend}>
                <Text className="text-purple-500 font-clash-semibold text-base">
                  Resend
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}
