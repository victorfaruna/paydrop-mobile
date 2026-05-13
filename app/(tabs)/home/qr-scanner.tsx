import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Dimensions,
  Linking,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width, height } = Dimensions.get("window");
const BASE_URL = "https://pay-drop-backend.vercel.app";
const DEVICE_ID = "paydrop-mobile-app";

export default function QRScannerScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [manualInput, setManualInput] = useState("");

  useEffect(() => {
    if (permission && !permission.granted) {
      Alert.alert(
        "Camera Permission Required",
        "To scan QR codes, we need camera access.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Open Settings", onPress: () => Linking.openSettings() },
        ],
      );
    }
  }, [permission]);

  const handleBarCodeScanned = async ({
    type,
    data,
  }: {
    type: string;
    data: string;
  }) => {
    if (scanned) return;
    setScanned(true);

    try {
      // Assume data is a user ID or token
      const response = await axios.post(
        `${BASE_URL}/api/v1/discover/resolve`,
        {
          token: data,
        },
        {
          headers: { "x-device-id": DEVICE_ID },
        },
      );

      if (response.data.user) {
        // Navigate to transfer with resolved user
        router.push({
          pathname: "/home/transfer" as any,
          params: { recipientId: response.data.user.id },
        });
      } else {
        Alert.alert(
          "Invalid QR Code",
          "This QR code is not valid for PayDrop.",
        );
        setScanned(false);
      }
    } catch (error) {
      console.error("QR resolve error", error);
      Alert.alert("Error", "Failed to process QR code. Please try again.");
      setScanned(false);
    }
  };

  const handleManualInput = () => {
    Alert.prompt("Enter User ID", "Enter the user ID or username to pay:", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Pay",
        onPress: async (input) => {
          if (input) {
            try {
              // Mock resolve for manual input
              const response = await axios.post(
                `${BASE_URL}/api/v1/users/search`,
                {
                  query: input,
                },
                {
                  headers: { "x-device-id": DEVICE_ID },
                },
              );

              if (response.data.users && response.data.users.length > 0) {
                router.push({
                  pathname: "/home/transfer" as any,
                  params: { recipientId: response.data.users[0].id },
                });
              } else {
                Alert.alert(
                  "User Not Found",
                  "No user found with that ID or username.",
                );
              }
            } catch (error) {
              console.error("Manual input error", error);
              Alert.alert("Error", "Failed to find user. Please try again.");
            }
          }
        },
      },
    ]);
  };

  if (!permission) {
    return (
      <View className="flex-1 bg-black items-center justify-center">
        <Text className="text-white font-clash-regular text-base">
          Requesting camera permission...
        </Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View className="flex-1 bg-black items-center justify-center px-6">
        <Ionicons name="camera-outline" size={64} color="#9CA3AF" />
        <Text className="text-white font-clash-semibold text-xl mb-4 mt-4">
          Camera Permission Required
        </Text>
        <Text className="text-grey-300 font-clash-regular text-base text-center mb-6">
          To scan QR codes, we need camera access.
        </Text>
        <TouchableOpacity
          onPress={requestPermission}
          className="bg-purple-500 rounded-full px-6 py-3"
        >
          <Text className="text-white font-clash-medium text-base">
            Grant Permission
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      {/* Header */}
      <View className="absolute top-0 left-0 right-0 z-10 bg-black/50 px-6 pt-14 pb-4">
        <View className="flex-row justify-between items-center">
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="close" size={24} color="white" />
          </TouchableOpacity>
          <Text className="text-white font-clash-bold text-xl">
            Scan QR Code
          </Text>
          <View className="w-6" />
        </View>
      </View>

      {/* Camera View */}
      <CameraView
        style={{ flex: 1 }}
        facing="back"
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ["qr"],
        }}
      />

      {/* Overlay */}
      <View className="absolute inset-0 items-center justify-center">
        {/* Scanning Frame */}
        <View className="w-64 h-64 border-2 border-white rounded-2xl">
          <View className="absolute -top-1 -left-1 w-8 h-8 border-l-4 border-t-4 border-purple-500 rounded-tl-2xl" />
          <View className="absolute -top-1 -right-1 w-8 h-8 border-r-4 border-t-4 border-purple-500 rounded-tr-2xl" />
          <View className="absolute -bottom-1 -left-1 w-8 h-8 border-l-4 border-b-4 border-purple-500 rounded-bl-2xl" />
          <View className="absolute -bottom-1 -right-1 w-8 h-8 border-r-4 border-b-4 border-purple-500 rounded-br-2xl" />
        </View>

        {/* Instructions */}
        <View className="absolute bottom-32 left-0 right-0 items-center px-6">
          <Text className="text-white font-clash-semibold text-lg mb-2">
            Scan QR Code
          </Text>
          <Text className="text-grey-300 font-clash-regular text-base text-center mb-6">
            Point your camera at a PayDrop QR code to pay instantly
          </Text>

          {/* Manual Input Button */}
          <TouchableOpacity
            onPress={handleManualInput}
            className="bg-white/20 rounded-full px-6 py-3 border border-white/30"
          >
            <Text className="text-white font-clash-medium text-base">
              Enter Manually
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Scanned Overlay */}
      {scanned && (
        <View className="absolute inset-0 bg-black/80 items-center justify-center">
          <View className="bg-white rounded-2xl p-6 items-center">
            <Ionicons name="checkmark-circle" size={48} color="#00D68F" />
            <Text className="text-black font-clash-semibold text-lg mt-4 mb-2">
              QR Code Scanned
            </Text>
            <Text className="text-grey-500 font-clash-regular text-base text-center">
              Processing payment...
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}
