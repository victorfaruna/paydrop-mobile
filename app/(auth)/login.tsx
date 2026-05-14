import axios from "axios";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
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

const BASE_URL = "https://pay-drop-backend.vercel.app";

export default function LoginScreen() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const formattedPhone = phone.startsWith("0") ? phone : `0${phone}`;
      const payload = { phone: formattedPhone };
      console.log("Requesting OTP for login", {
        url: `${BASE_URL}/api/v1/auth/request-otp`,
        payload,
      });

      const response = await axios.post(
        `${BASE_URL}/api/v1/auth/request-otp`,
        payload,
      );
      console.log("OTP request response", response.data);

      router.push({
        pathname: "./otp",
        params: {
          phone: formattedPhone,
          mode: "login",
        },
      });
    } catch (error) {
      console.error("API error", error);
    } finally {
      setLoading(false);
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
            paddingBottom: 32,
            backgroundColor: "white",
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

            <Image
              source={require("../../assets/images/paydrop-icon-2.png")}
              className="size-16 mt-10 mb-4"
            />
            <Text className="text-4xl font-clash-semibold text-black mb-2 ">
              Login
            </Text>
            <Text className="text-base font-clash-regular text-grey-500 mb-10 leading-6">
              Enter your phone number to receive a one-time login code.
            </Text>

            <View className="bg-grey-50 h-16 rounded-xl flex-row items-center px-6 mb-6 border border-grey-200">
              <Text className="text-lg font-clash-medium mr-4">+234</Text>
              <View className="w-[1px] h-8 bg-grey-300 mr-4" />
              <TextInput
                placeholder="812 345 6789"
                placeholderTextColor="#9CA3AF"
                keyboardType="phone-pad"
                className="flex-1 text-lg font-clash-regular text-black"
                value={phone}
                onChangeText={setPhone}
              />
            </View>

            <TouchableOpacity
              className={`h-16 rounded-2xl justify-center items-center ${
                phone && !loading ? "bg-purple-500" : "bg-purple-300"
              }`}
              onPress={handleSubmit}
              disabled={!phone || loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text className="text-white font-clash-bold text-lg">
                  Continue
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              className="mt-4 items-center"
              onPress={() => router.push({ pathname: "./phone" })}
            >
              <Text className="text-purple-500 font-clash-semibold">
                Need to register? Create account
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}
