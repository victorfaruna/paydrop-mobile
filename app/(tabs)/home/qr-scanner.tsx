import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Linking,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useUserStore } from "@/store/userStore";

const { width, height } = Dimensions.get("window");
const BASE_URL = "https://pay-drop-backend.vercel.app";
const DEVICE_ID = "paydrop-mobile-app";

export default function QRScannerScreen() {
  const router = useRouter();
  const accessToken = useUserStore((state) => state.accessToken);
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [resolving, setResolving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (scanned || resolving) return;
    setScanned(true);
    
    // Vibrate
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});

    await resolveToken(data);
  };

  const resolveToken = async (token: string) => {
    setResolving(true);
    setError(null);

    try {
      const response = await axios.post(
        `${BASE_URL}/api/v1/discover/qr/resolve`,
        { token },
        {
          headers: { 
            "x-device-id": DEVICE_ID,
            Authorization: accessToken ? `Bearer ${accessToken}` : undefined,
          },
        }
      );

      if (response.data.user) {
        router.push({
          pathname: "/recipient-preview" as any,
          params: { user: JSON.stringify(response.data.user) },
        });
      } else {
        throw new Error("Invalid response");
      }
    } catch (err) {
      console.error("QR resolve error", err);
      setError("QR not recognised");
      setScanned(false);
      
      // Clear error after 3s
      setTimeout(() => setError(null), 3000);
    } finally {
      setResolving(false);
    }
  };

  if (!permission) {
    return <View className="flex-1 bg-white" />;
  }

  if (!permission.granted) {
    return (
      <View className="flex-1 bg-white items-center justify-center px-10">
        <Ionicons name="camera-outline" size={64} color="#9CA3AF" />
        <Text className="text-[#1A1A1A] font-clash-bold text-[20px] mb-2 mt-4">
          Camera access needed
        </Text>
        <Text className="text-[#6B7280] font-clash-regular text-[14px] text-center mb-8">
          To scan QR codes, we need camera access.
        </Text>
        <TouchableOpacity
          onPress={requestPermission}
          className="bg-[#00D68F] rounded-full px-8 py-3 w-full items-center"
        >
          <Text className="text-black font-clash-bold text-[16px]">
            Open Settings
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      {/* Camera */}
      <CameraView
        style={{ flex: 1 }}
        facing="back"
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
      />

      {/* Overlay */}
      <View className="absolute inset-0 bg-black/40">
        {/* Cutout Container */}
        <View className="flex-1 items-center justify-center">
          {/* Scan Frame */}
          <View className="w-[240px] h-[240px] relative">
            {/* Top Left Corner */}
            <View className="absolute top-0 left-0 w-[24px] h-[24px] border-l-[3px] border-t-[3px] border-white" />
            {/* Top Right Corner */}
            <View className="absolute top-0 right-0 w-[24px] h-[24px] border-r-[3px] border-t-[3px] border-white" />
            {/* Bottom Left Corner */}
            <View className="absolute bottom-0 left-0 w-[24px] h-[24px] border-l-[3px] border-b-[3px] border-white" />
            {/* Bottom Right Corner */}
            <View className="absolute bottom-0 right-0 w-[24px] h-[24px] border-r-[3px] border-b-[3px] border-white" />
            
            {/* Transparent Hole (conceptually) */}
            <View className="flex-1" />
          </View>
        </View>
      </View>

      {/* Header */}
      <View className="absolute top-0 left-0 right-0 pt-[60px] pb-4 px-6 flex-row items-center">
        <TouchableOpacity onPress={() => router.back()} className="p-2">
          <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <View className="flex-1 items-center mr-8">
          <Text className="text-[#1A1A1A] font-clash-bold text-[18px]">
            Scan their QR code
          </Text>
        </View>
      </View>

      {/* Error Toast */}
      {error && (
        <View className="absolute top-[120px] left-6 right-6 bg-[#FF6B6B] py-3 rounded-xl items-center">
          <Text className="text-white font-clash-bold text-[14px]">{error}</Text>
        </View>
      )}

      {/* Fallback Manual Input */}
      <View className="absolute bottom-[40px] left-6 right-6 bg-white/90 rounded-[24px] p-6">
        <Text className="text-[#6B7280] font-clash-medium text-[12px] mb-2">
          Enter code manually
        </Text>
        <View className="flex-row items-center bg-[#F3F4F6] rounded-xl px-4 h-[48px]">
          <TextInput
            value={manualCode}
            onChangeText={setManualCode}
            placeholder="e.g. PD-123-456"
            className="flex-1 text-[#1A1A1A] font-clash-regular text-[14px]"
            autoCapitalize="characters"
          />
          <TouchableOpacity 
            onPress={() => resolveToken(manualCode)}
            disabled={!manualCode || resolving}
            className="ml-2"
          >
            {resolving ? (
              <ActivityIndicator size="small" color="#00D68F" />
            ) : (
              <Text className="text-[#00D68F] font-clash-bold text-[14px]">
                Resolve
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
