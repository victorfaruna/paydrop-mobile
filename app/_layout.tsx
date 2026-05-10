import FontAwesome from "@expo/vector-icons/FontAwesome";

import { useAppState } from "@/store/appState";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import "react-native-reanimated";
import "../global.css";

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from "expo-router";

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: "(tabs)",
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
    "ClashDisplay-Bold": require("../assets/fonts/clash-display/ClashDisplay-Bold.ttf"),
    "ClashDisplay-Extralight": require("../assets/fonts/clash-display/ClashDisplay-Extralight.ttf"),
    "ClashDisplay-Light": require("../assets/fonts/clash-display/ClashDisplay-Light.ttf"),
    "ClashDisplay-Medium": require("../assets/fonts/clash-display/ClashDisplay-Medium.ttf"),
    "ClashDisplay-Regular": require("../assets/fonts/clash-display/ClashDisplay-Regular.ttf"),
    "ClashDisplay-Semibold": require("../assets/fonts/clash-display/ClashDisplay-Semibold.ttf"),
    ...FontAwesome.font,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const { onboardingCompleted } = useAppState();

  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      {!onboardingCompleted ? (
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      ) : (
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      )}
      <Stack.Screen name="modal" options={{ presentation: "modal" }} />
    </Stack>
  );
}
