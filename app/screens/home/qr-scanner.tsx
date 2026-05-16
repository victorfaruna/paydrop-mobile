import { resolveDiscoveryTokens } from "@/services/user";
import { useUserStore } from "@/store/userStore";
import { Ionicons } from "@expo/vector-icons";
import { useMutation } from "@tanstack/react-query";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function QRScannerScreen() {
  const router = useRouter();
  const accessToken = useUserStore((state) => state.accessToken);
  const [permission, requestPermission] = useCameraPermissions();
  const [manualCode, setManualCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Use a ref to prevent duplicate scans - more reliable than state
  const isProcessingRef = useRef(false);

  const handleOpenSettings = () => {
    Linking.openSettings();
  };

  const { mutate: resolveMutate, isPending: resolving } = useMutation({
    mutationFn: (tokens: string[]) => resolveDiscoveryTokens(tokens),
    onSuccess: (response: any, variables: string[]) => {
      let foundUser = null;

      // Handle the { user: { ... } } response shape
      if (response && response.user && !Array.isArray(response.user)) {
        foundUser = response.user;
      } else {
        const users = Array.isArray(response)
          ? response
          : response?.data || response?.users || response?.resolved || [];
        if (users && users.length > 0) {
          foundUser = users[0];
        }
      }

      if (foundUser) {
        const token = variables[0];
        router.push({
          pathname: "/screens/payment/recipient-preview" as any,
          params: { user: JSON.stringify(foundUser), token },
        });
      } else {
        console.error("User not found, response was:", response);
        setError("User not found");
        isProcessingRef.current = false;
        setTimeout(() => setError(null), 3000);
      }
    },
    onError: (err: any) => {
      console.error("QR resolve error", err);
      setError(err?.message || "QR not recognised");
      isProcessingRef.current = false;
      setTimeout(() => setError(null), 3000);
    },
  });

  const handleBarCodeScanned = useCallback(
    (scanResult: { type: string; data: string }) => {
      // Guard: only process once
      if (isProcessingRef.current || resolving) return;
      isProcessingRef.current = true;

      console.log("[QR Scanner] Scanned!", scanResult.type, scanResult.data);

      // Haptic feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
        () => {},
      );

      // Pass the exact scanned data as the token
      resolveMutate([scanResult.data]);
    },
    [resolving, resolveMutate],
  );

  const handleManualResolve = () => {
    if (!manualCode || resolving) return;
    isProcessingRef.current = true;
    resolveMutate([manualCode]);
  };

  // Loading state while permissions are being checked
  if (!permission) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#A855F7" />
      </View>
    );
  }

  // Permission not granted
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
    <View style={styles.container}>
      {/* Camera - takes up the full screen */}
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        onBarcodeScanned={handleBarCodeScanned}
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
      />

      {/* Overlay - uses pointerEvents="none" so it doesn't block the camera */}
      <View style={styles.overlay} pointerEvents="none">
        {/* Scan Frame */}
        <View style={styles.scanFrame}>
          {/* Top Left Corner */}
          <View style={[styles.corner, styles.topLeft]} />
          {/* Top Right Corner */}
          <View style={[styles.corner, styles.topRight]} />
          {/* Bottom Left Corner */}
          <View style={[styles.corner, styles.bottomLeft]} />
          {/* Bottom Right Corner */}
          <View style={[styles.corner, styles.bottomRight]} />
        </View>
      </View>

      {/* Header */}
      <View style={styles.header}>
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

      {/* Resolving indicator */}
      {resolving && (
        <View style={styles.resolvingBanner}>
          <ActivityIndicator size="small" color="#FFFFFF" />
          <Text className="text-white font-clash-medium text-[14px] ml-2">
            Looking up user...
          </Text>
        </View>
      )}

      {/* Error Toast */}
      {error && (
        <View style={styles.errorBanner}>
          <Text className="text-white font-clash-bold text-[14px]">
            {error}
          </Text>
        </View>
      )}

      {/* Fallback Manual Input */}
      <View style={styles.manualInput}>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  scanFrame: {
    width: 240,
    height: 240,
    position: "relative",
  },
  corner: {
    position: "absolute",
    width: 24,
    height: 24,
    borderColor: "#fff",
  },
  topLeft: {
    top: 0,
    left: 0,
    borderLeftWidth: 3,
    borderTopWidth: 3,
  },
  topRight: {
    top: 0,
    right: 0,
    borderRightWidth: 3,
    borderTopWidth: 3,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderLeftWidth: 3,
    borderBottomWidth: 3,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderRightWidth: 3,
    borderBottomWidth: 3,
  },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 24,
    flexDirection: "row",
    alignItems: "center",
  },
  resolvingBanner: {
    position: "absolute",
    top: 130,
    left: 24,
    right: 24,
    backgroundColor: "#8B5CF6",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  errorBanner: {
    position: "absolute",
    top: 130,
    left: 24,
    right: 24,
    backgroundColor: "#FF6B6B",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  manualInput: {
    position: "absolute",
    bottom: 40,
    left: 24,
    right: 24,
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 24,
    elevation: 10,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -4 },
  },
});
