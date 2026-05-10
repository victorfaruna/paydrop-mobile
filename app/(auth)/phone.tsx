import { useRouter } from "expo-router";
import { Image, Text, TextInput, TouchableOpacity, View } from "react-native";

export default function PhoneScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-white px-6 pt-20">
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
        Get Started
      </Text>
      <Text className="text-base font-clash-regular text-grey-500 mb-10 leading-6">
        Enter your phone number. We'll send a code to verify your account.
      </Text>

      <View className="bg-grey-50 h-16 rounded-xl flex-row items-center px-6 mb-8 border border-grey-200">
        <Text className="text-lg font-clash-medium mr-4">+234</Text>
        <View className="w-[1px] h-8 bg-grey-300 mr-4" />
        <TextInput
          placeholder="812 345 6789"
          placeholderTextColor="#9CA3AF"
          keyboardType="phone-pad"
          className="flex-1 text-lg font-clash-regular text-black"
        />
      </View>

      <TouchableOpacity
        className="bg-purple-500 h-16 rounded-2xl justify-center items-center"
        onPress={() => router.push("/(auth)/otp")}
      >
        <Text className="text-white font-clash-bold text-lg">Continue</Text>
      </TouchableOpacity>
    </View>
  );
}
