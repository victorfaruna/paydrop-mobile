import * as Application from "expo-application";
import * as Crypto from "expo-crypto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

let cachedDeviceId: string | null = null;

export const getDeviceId = async (): Promise<string> => {
  if (cachedDeviceId) return cachedDeviceId;

  if (Platform.OS === "android") {
    try {
      const androidId = Application.getAndroidId();
      if (androidId) {
        cachedDeviceId = androidId;
        return androidId;
      }
    } catch (e) {
      console.warn("Failed to get androidId", e);
    }
  }

  // iOS or fallback for Android if androidId is null
  const storedId = await AsyncStorage.getItem("device_id");
  if (storedId) {
    cachedDeviceId = storedId;
    return storedId;
  }

  const newId = Crypto.randomUUID();
  await AsyncStorage.setItem("device_id", newId);
  cachedDeviceId = newId;
  return newId;
};

