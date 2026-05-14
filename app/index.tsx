import { useRouter } from "expo-router";
import { useEffect } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
export default function SplashScreen() {
  const router = useRouter();

  useEffect(() => {
    // Wait at least 2 seconds total for the splash animation
    const timer = setTimeout(() => {
      // router.replace("/(auth)/phone");
      router.replace("/(tabs)/home");
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View className="flex-1 bg-purple-500 items-center justify-center">
      <Image
        className="absolute w-full h-full opacity-10"
        source={require("../assets/images/bg-mesh.png")}
      />
      <View className="items-center justify-center">
        <Image
          source={require("../assets/images/logo.png")}
          className="w-48 h-48"
          resizeMode="contain"
        />
        <Text className="text-white text-4xl mt-4 font-clash-bold">
          PayDrop
        </Text>
      </View>

      <Text className="absolute bottom-12 text-white text-base font-clash-medium tracking-widest">
        Trust the Person. Not the Number.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  logoContainer: {
    width: 200,
    height: 200,
    justifyContent: "center",
    alignItems: "center",
  },
  pulse: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255, 255, 255, 0.4)",
  },
  logo: {
    width: 200,
    height: 200,
  },
});
