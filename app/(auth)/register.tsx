import ScreenView from "@/components/layout/ScreenView";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
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

export default function PhoneScreen() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");

  const isFormValid =
    phone.length === 10 &&
    firstName.trim() !== "" &&
    lastName.trim() !== "" &&
    email.trim() !== "" &&
    username.trim().length >= 3;

  const handleSubmit = () => {
    if (isFormValid) {
      router.push({
        pathname: "/kyc",
        params: {
          phone: `0${phone}`,
          mode: "signup",
          firstName,
          lastName,
          email,
          username,
        },
      });
    }
  };

  return (
    <ScreenView>
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
                Register
              </Text>
              <Text className="text-base font-clash-regular text-grey-500 mb-10 leading-6">
                Create an account using your phone number, name, and email.
              </Text>

              <View className="bg-grey-50 h-16 rounded-xl flex-row items-center px-6 mb-4 border border-grey-200">
                <TextInput
                  placeholder="First Name"
                  placeholderTextColor="#9CA3AF"
                  className="flex-1 h-full font-clash-regular text-black"
                  value={firstName}
                  onChangeText={setFirstName}
                />
              </View>

              <View className="bg-grey-50 h-16 rounded-xl flex-row items-center px-6 mb-4 border border-grey-200">
                <TextInput
                  placeholder="Last Name"
                  placeholderTextColor="#9CA3AF"
                  className="flex-1 h-full font-clash-regular text-black"
                  value={lastName}
                  onChangeText={setLastName}
                />
              </View>

              <View className="bg-grey-50 h-16 rounded-xl flex-row items-center px-6 mb-4 border border-grey-200">
                <TextInput
                  placeholder="Email Address"
                  placeholderTextColor="#9CA3AF"
                  autoCorrect={false}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  className="flex-1 h-full font-clash-regular text-black"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>

              <View className="bg-grey-50 h-16 rounded-xl flex-row items-center px-6 mb-4 border border-grey-200">
                <TextInput
                  placeholder="Username"
                  placeholderTextColor="#9CA3AF"
                  autoCorrect={false}
                  autoCapitalize="none"
                  className="flex-1 h-full font-clash-regular text-black"
                  value={username}
                  onChangeText={setUsername}
                />
              </View>

              <View className="bg-grey-50 h-16 rounded-xl flex-row items-center px-6 mb-4 border border-grey-200">
                <Text className="text-lg font-clash-medium mr-4">+234</Text>
                <View className="w-[1px] h-8 bg-grey-300 mr-4" />
                <TextInput
                  placeholder="812 345 6789"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="phone-pad"
                  className="flex-1 h-full font-clash-regular text-black"
                  value={phone}
                  onChangeText={setPhone}
                />
              </View>

              {/* <View className="bg-grey-50 h-16 rounded-xl justify-center px-6 mb-6 border border-grey-200">
              <TextInput
                placeholder="Avatar URL (optional)"
                placeholderTextColor="#9CA3AF"
                className="text-lg font-clash-regular text-black"
                value={avatarUrl}
                onChangeText={setAvatarUrl}
              />
            </View> */}

              <TouchableOpacity
                activeOpacity={0.6}
                className={`h-16 rounded-2xl justify-center items-center ${
                  isFormValid ? "bg-purple-500" : "bg-purple-300"
                }`}
                onPress={handleSubmit}
                disabled={!isFormValid}
              >
                <Text className="text-white font-clash-bold text-lg">
                  Continue
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="mt-4 items-center"
                onPress={() => router.push({ pathname: "./login" })}
              >
                <Text className="text-purple-500 font-clash-semibold">
                  Already have an account? Login
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </ScreenView>
  );
}
