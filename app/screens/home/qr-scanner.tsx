import { resolveDiscoveryToken } from "@/services/user";
import { extractDiscoveryToken } from "@/utils/discoveryToken";
import { Ionicons } from "@expo/vector-icons";
import { useMutation } from "@tanstack/react-query";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function QRScannerScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [manualCode, setManualCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [scanLocked, setScanLocked] = useState(false);

  const isProcessingRef = useRef(false);

  const handleOpenSettings = () => {
    Linking.openSettings();
  };

  const resetScanner = () => {
    isProcessingRef.current = false;
    setScanLocked(false);
  };

  const resolveWithCandidates = async (raw: string) => {
    const trimmed = raw.trim();
    const extracted = extractDiscoveryToken(trimmed);
    const candidates = [
      trimmed,
      ...(extracted && extracted !== trimmed ? [extracted] : []),
    ];

    let lastError: unknown;
    for (const token of candidates) {
      try {
        return await resolveDiscoveryToken(token);
      } catch (err) {
        lastError = err;
        console.warn("[QR Scanner] Resolve failed for:", token, err);
      }
    }
    throw lastError ?? new Error("QR not recognised");
  };

  const { mutate: resolveMutate, isPending: resolving } = useMutation({
    mutationFn: (raw: string) => resolveWithCandidates(raw),
    onSuccess: (response: any, raw: string) => {
      let foundUser = null;

      if (response && response.user && !Array.isArray(response.user)) {
        foundUser = response.user;
      } else {
        const users = Array.isArray(response)
          ? response
          : response?.data?.users ||
            response?.data ||
            response?.users ||
            response?.resolved ||
            [];
        if (users && users.length > 0) {
          foundUser = users[0];
        }
      }

      if (foundUser) {
        const token =
          extractDiscoveryToken(raw) ?? raw.trim();
        router.push({
          pathname: "/screens/payment/recipient-preview" as any,
          params: { user: JSON.stringify(foundUser), token },
        });
        return;
      }

      console.error("User not found, response was:", response);
      setError("User not found for this code");
      resetScanner();
      setTimeout(() => setError(null), 3000);
    },
    onError: (err: any) => {
      console.error("QR resolve error", err);
      const message =
        (typeof err === "string" && err) ||
        err?.message ||
        err?.error ||
        (typeof err?.response?.data === "string" && err.response.data) ||
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "QR not recognised";
      setError(typeof message === "string" ? message : "QR not recognised");
      resetScanner();
      setTimeout(() => setError(null), 3000);
    },
  });

  const resolveRawCode = (raw: string) => {
    const trimmed = raw?.trim();
    if (!trimmed) {
      setError("Invalid QR code");
      resetScanner();
      setTimeout(() => setError(null), 3000);
      return;
    }

    console.log("[QR Scanner] Resolving:", trimmed);
    resolveMutate(trimmed);
  };

  const handleBarCodeScanned = (scanResult: { type: string; data: string }) => {
    if (isProcessingRef.current || scanLocked || resolving) return;
    isProcessingRef.current = true;
    setScanLocked(true);

    console.log("[QR Scanner] Scanned!", scanResult.type, scanResult.data);

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
      () => {},
    );

    resolveRawCode(scanResult.data);
  };

  const handleManualResolve = () => {
    if (!manualCode.trim() || resolving || scanLocked) return;
    isProcessingRef.current = true;
    setScanLocked(true);
    resolveRawCode(manualCode);
  };

  if (!permission) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#A855F7" />
      </View>
    );
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

  const canScan = !scanLocked && !resolving;

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        onBarcodeScanned={canScan ? handleBarCodeScanned : undefined}
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
      />

      <View style={styles.overlay} pointerEvents="none">
        <View style={styles.scanFrame}>
          <View style={[styles.corner, styles.topLeft]} />
          <View style={[styles.corner, styles.topRight]} />
          <View style={[styles.corner, styles.bottomLeft]} />
          <View style={[styles.corner, styles.bottomRight]} />
        </View>
      </View>

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

      {resolving && (
        <View style={styles.resolvingBanner}>
          <ActivityIndicator size="small" color="#FFFFFF" />
          <Text className="text-white font-clash-medium text-[14px] ml-2">
            Looking up user...
          </Text>
        </View>
      )}

      {error && (
        <View style={styles.errorBanner}>
          <Text className="text-white font-clash-bold text-[14px] text-center">
            {error}
          </Text>
        </View>
      )}

      <View style={styles.manualInput}>
        <Text className="text-[#6B7280] font-clash-medium text-[12px] mb-3 ml-1">
          Enter code manually
        </Text>
        <View className="flex-row items-center bg-[#F3F4F6] rounded-2xl px-4 h-[56px] border border-grey-100">
          <TextInput
            value={manualCode}
            onChangeText={setManualCode}
            placeholder="Paste code or token"
            placeholderTextColor="#9CA3AF"
            className="flex-1 text-[#1A1A1A] font-clash-regular text-[15px]"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity
            onPress={handleManualResolve}
            disabled={!manualCode.trim() || resolving || scanLocked}
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
    paddingHorizontal: 12,
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
