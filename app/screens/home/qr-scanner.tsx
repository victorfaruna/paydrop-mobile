import { resolveDiscoveryTokens } from "@/services/user";
import { useUserStore } from "@/store/userStore";
import { Ionicons } from "@expo/vector-icons";
import { useMutation } from "@tanstack/react-query";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Linking,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const { width, height } = Dimensions.get("window");

export default function QRScannerScreen() {
  const router = useRouter();
  const accessToken = useUserStore((state) => state.accessToken);
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleOpenSettings = () => {
    Linking.openSettings();
  };

  const { mutate: resolveMutate, isPending: resolving } = useMutation({
    mutationFn: (tokens: string[]) => resolveDiscoveryTokens(tokens),
    onSuccess: (users: any[]) => {
      if (users && users.length > 0) {
        const user = users[0];
        router.push({
          pathname: "/screens/payment/recipient-preview" as any,
          params: { user: JSON.stringify(user) },
        });
      } else {
        setError("User not found");
        setScanned(false);
        setTimeout(() => setError(null), 3000);
      }
    },
    onError: (err: any) => {
      console.error("QR resolve error", err);
      setError(err?.message || "QR not recognised");
      setScanned(false);
      setTimeout(() => setError(null), 3000);
    },
  });

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (scanned || resolving) return;
    setScanned(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    resolveMutate([data]);
  };

  const handleManualResolve = () => {
    if (!manualCode || resolving) return;
    resolveMutate([manualCode]);
  };

  if (!permission) {
    return <View className="flex-1 bg-white" />;
  }

  if (!permission.granted) {
    return (
      <View className="flex-1 bg-white px-10">
        <TouchableOpacity
          onPress={() => router.back()}
          className="mt-14 w-10 h-10 bg-grey-50 rounded-full items-center justify-center border border-grey-100"
        >
          <Ionicons name="close" size={24} color="#1A1A1A" />
        </TouchableOpacity>

        <View className="flex-1 items-center justify-center -mt-20">
          <Ionicons name="camera-outline" size={64} color="#9CA3AF" />
          <Text className="text-[#1A1A1A] font-clash-semibold text-[20px] mb-2 mt-4">
            Camera access needed
          </Text>
          <Text className="text-[#6B7280] font-clash-regular text-[14px] text-center mb-8">
            To scan QR codes, we need camera access.
          </Text>
          <TouchableOpacity
            onPress={
              permission.canAskAgain ? requestPermission : handleOpenSettings
            }
            className="bg-purple-500 rounded-2xl px-8 py-5 w-full items-center"
          >
            <Text className="text-white text-[16px] font-clash-bold">
              {permission.canAskAgain ? "Grant Permission" : "Open Settings"}
            </Text>
          </TouchableOpacity>
        </View>
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
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 bg-white/20 rounded-full items-center justify-center"
        >
          <Ionicons name="close" size={24} color="white" />
        </TouchableOpacity>
        <View className="flex-1 items-center mr-10">
          <Text className="text-white font-clash-semibold text-[18px]">
            Scan their QR code
          </Text>
        </View>
      </View>

      {/* Error Toast */}
      {error && (
        <View className="absolute top-[130px] left-6 right-6 bg-[#FF6B6B] py-4 rounded-2xl items-center shadow-lg">
          <Text className="text-white font-clash-bold text-[14px]">
            {error}
          </Text>
        </View>
      )}

      {/* Fallback Manual Input */}
      <View className="absolute bottom-[40px] left-6 right-6 bg-white rounded-[24px] p-6 shadow-xl">
        <Text className="text-[#6B7280] font-clash-medium text-[12px] mb-3 ml-1">
          Enter code manually
        </Text>
        <View className="flex-row items-center bg-[#F3F4F6] rounded-2xl px-4 h-[56px] border border-grey-100">
          <TextInput
            value={manualCode}
            onChangeText={setManualCode}
            placeholder="e.g. PD-123-456"
            placeholderTextColor="#9CA3AF"
            className="flex-1 text-[#1A1A1A] font-clash-regular text-[15px]"
            autoCapitalize="characters"
          />
          <TouchableOpacity
            onPress={handleManualResolve}
            disabled={!manualCode || resolving}
            className="ml-2 bg-purple-500 rounded-xl px-4 py-2"
          >
            {resolving ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text className="text-white font-clash-bold text-[14px]">
                Resolve
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
