import { useUserStore } from "@/store/userStore";
import { Ionicons } from "@expo/vector-icons";
import { useMutation } from "@tanstack/react-query";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  FlatList,
  Image,
  Linking,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import BlePeripheral from "react-native-ble-peripheral";
import { BleManager } from "react-native-ble-plx";

const { width } = Dimensions.get("window");

import ScreenView from "@/components/layout/ScreenView";
import {
  broadcastDiscovery,
  resolveDiscoveryToken,
  stopDiscoveryBroadcast,
} from "@/services/user";
import size from "@/utils/size";

// Initialize BleManager outside component lazily to prevent runtime crashes when native module is missing
let bleManager: BleManager | null = null;

const getBleManager = (): BleManager | null => {
  if (!bleManager) {
    try {
      bleManager = new BleManager();
    } catch (e) {
      console.warn(
        "BleManager could not be initialized (native module may be missing):",
        e,
      );
      return null;
    }
  }
  return bleManager;
};

interface NearbyUser {
  id: string;
  first_name: string;
  last_name: string;
  username: string;
  avatar_url?: string;
  trust_score: number;
  trust_tier: "low" | "medium" | "high";
  mutual_trust: string;
  presence: string;
}

export default function NearbyUsersScreen() {
  const router = useRouter();
  const accessToken = useUserStore((state) => state.accessToken);
  const [nearbyUsers, setNearbyUsers] = useState<NearbyUser[]>([]);
  const [scanning, setScanning] = useState(true);
  const [permissionGranted, setPermissionGranted] = useState(true);
  const [broadcastToken, setBroadcastToken] = useState<string | null>(null);
  const scannedTokens = useRef<Set<string>>(new Set());

  // Mutations
  const { mutate: broadcastMutate } = useMutation({
    mutationFn: broadcastDiscovery,
    onSuccess: (data) => {
      console.log("Broadcast registration success:", data);
      if (data.token) {
        setBroadcastToken(data.token);
        startAdvertising(data.token);
      }
    },
    onError: (error) => console.error("Broadcast Error:", error),
  });

  const { mutate: stopBroadcastMutate } = useMutation({
    mutationFn: stopDiscoveryBroadcast,
    onSuccess: () => {
      stopAdvertising();
    },
    onError: (error) => console.error("Stop Broadcast Error:", error),
  });

  const { mutate: resolveTokenMutate } = useMutation({
    mutationFn: resolveDiscoveryToken,
    onSuccess: (data) => {
      if (data.user) {
        setNearbyUsers((prev) => {
          // Avoid duplicates
          if (prev.some((u) => u.id === data.user.id)) return prev;
          return [...prev, data.user];
        });
        setScanning(false);
      }
    },
    onError: (error) => {
      console.log("Token resolution failed:", error);
    },
  });

  // BLE Advertising Helper
  const startAdvertising = (token: string) => {
    try {
      if (Platform.OS === "web") return;
      console.log("Starting BLE Advertising for token:", token);

      // Basic Service UUID for PayDrop
      const SERVICE_UUID = "BBA9E69A-B0A1-4770-80E2-99933B9B1D2A";

      BlePeripheral.setName(token);
      BlePeripheral.addService(SERVICE_UUID, true);
      BlePeripheral.start()
        .then(() => console.log("Advertising started successfully"))
        .catch((err: any) => console.warn("Advertising start failed:", err));
    } catch (error) {
      console.warn("Advertising Setup Error:", error);
    }
  };

  const stopAdvertising = () => {
    try {
      if (Platform.OS === "web") return;
      BlePeripheral.stop();
      console.log("Advertising stopped");
    } catch (error) {
      console.warn("Advertising Stop Error:", error);
    }
  };

  // Animation refs
  const pulseAnim1 = useRef(new Animated.Value(0)).current;
  const pulseAnim2 = useRef(new Animated.Value(0)).current;
  const pulseAnim3 = useRef(new Animated.Value(0)).current;
  const opacityAnim1 = useRef(new Animated.Value(0.6)).current;
  const opacityAnim2 = useRef(new Animated.Value(0.6)).current;
  const opacityAnim3 = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    let isMounted = true;

    const checkPermissions = async () => {
      try {
        if (Platform.OS === "android") {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status !== "granted") {
            setPermissionGranted(false);
            return false;
          }
        }
        // BleManager usually handles its own prompts on first scan/state check
        setPermissionGranted(true);
        return true;
      } catch (error) {
        console.error("Permission check failed", error);
        return false;
      }
    };

    const startBLEScan = async () => {
      try {
        const manager = getBleManager();
        if (!manager) {
          throw new Error("BleManager native module is not available");
        }

        // Wait for Bluetooth to be powered on
        const state = await manager.state();
        if (state !== "PoweredOn") {
          console.warn("Bluetooth is not PoweredOn. Current state:", state);
          return;
        }

        console.log("Starting BLE Scan...");
        manager.startDeviceScan(
          null,
          { allowDuplicates: false },
          (error, device) => {
            if (error) {
              console.log("BLE Scan Error:", error);
              return;
            }

            const token = device?.localName;
            if (token && token.startsWith("PD_")) {
              console.log("Found PayDrop device token:", token);

              // Ignore weak signals
              if (device.rssi && device.rssi < -85) return;

              if (scannedTokens.current.has(token)) return;
              scannedTokens.current.add(token);

              resolveTokenMutate(token);
            }
          },
        );
      } catch (error) {
        console.warn("BLE Scan Start Error:", error);
      }
    };

    const startDiscovery = async () => {
      const hasPermissions = await checkPermissions();
      if (!hasPermissions) return;

      try {
        broadcastMutate();
        startBLEScan();

        // Fallback mock data
        setTimeout(() => {
          if (isMounted && nearbyUsers.length === 0) {
            setNearbyUsers([
              {
                id: "1",
                first_name: "Shade",
                last_name: "Akin",
                username: "@shade_akin",
                avatar_url: "https://i.pravatar.cc/100?img=1",
                trust_score: 92,
                trust_tier: "high",
                mutual_trust: "Shade + 12 others",
                presence: "Faculty Building",
              },
            ]);
            setScanning(false);
          }
        }, 8000);
      } catch (error) {
        console.error("Discovery setup error", error);
        setScanning(false);
      }
    };

    if (permissionGranted && accessToken) {
      startDiscovery();
    }

    // Start pulse animations
    const startPulse = () => {
      const createPulse = (
        scaleAnim: Animated.Value,
        opacityAnim: Animated.Value,
        delay: number,
      ) => {
        Animated.loop(
          Animated.sequence([
            Animated.delay(delay),
            Animated.parallel([
              Animated.timing(scaleAnim, {
                toValue: 1,
                duration: 2000,
                useNativeDriver: true,
              }),
              Animated.timing(opacityAnim, {
                toValue: 0,
                duration: 2000,
                useNativeDriver: true,
              }),
            ]),
            Animated.parallel([
              Animated.timing(scaleAnim, {
                toValue: 0,
                duration: 0,
                useNativeDriver: true,
              }),
              Animated.timing(opacityAnim, {
                toValue: 0.6,
                duration: 0,
                useNativeDriver: true,
              }),
            ]),
          ]),
        ).start();
      };

      createPulse(pulseAnim1, opacityAnim1, 0);
      createPulse(pulseAnim2, opacityAnim2, 200);
      createPulse(pulseAnim3, opacityAnim3, 400);
    };

    startPulse();

    return () => {
      isMounted = false;
      if (bleManager) {
        try {
          bleManager.stopDeviceScan();
        } catch (e) {
          // ignore
        }
      }

      if (accessToken) {
        stopBroadcastMutate();
      }
    };
  }, [permissionGranted, accessToken]);

  const handlePay = (user: NearbyUser) => {
    router.push({
      pathname: "/screens/payment/recipient-preview" as any,
      params: { user: JSON.stringify(user) },
    });
  };

  const handleScanQR = () => {
    router.push("/screens/home/qr-scanner");
  };

  const handleOpenSettings = () => {
    Linking.openSettings();
  };

  const getTrustColor = (tier: string) => {
    switch (tier) {
      case "high":
        return "#00D68F";
      case "medium":
        return "#FFB347";
      case "low":
        return "#FF6B6B";
      default:
        return "#9CA3AF";
    }
  };

  const renderNearbyUser = ({ item }: { item: NearbyUser }) => (
    <View className="bg-[#F3F4F6] rounded-[16px] p-4 mb-2 mx-6">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center flex-1">
          <Image
            source={{ uri: item.avatar_url || "https://i.pravatar.cc/100" }}
            className="rounded-full mr-3"
            style={{
              width: size.width(50),
              height: size.height(50),
            }}
          />
          <View className="flex-1">
            <View className="flex-row items-center">
              <Text className="text-[#1A1A1A] font-clash-semibold text-[16px] mr-2">
                {item.first_name} {item.last_name}
              </Text>
              <View
                className="rounded-full px-2 py-0.5"
                style={{
                  backgroundColor: getTrustColor(item.trust_tier) + "20",
                }}
              >
                <Text
                  className="font-clash-medium text-[10px]"
                  style={{ color: getTrustColor(item.trust_tier) }}
                >
                  {item.trust_tier.toUpperCase()}
                </Text>
              </View>
            </View>
            <Text className="text-[#6B7280] font-clash-regular text-[13px]">
              {item.username}
            </Text>
            <Text className="text-[#6B7280] font-clash-regular text-[12px] mt-1">
              👥 Trusted by {item.mutual_trust}
            </Text>
            <Text className="text-purple-300 font-clash-regular text-[12px] mt-0.5">
              📍 {item.presence}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={() => handlePay(item)}
          className="bg-purple-300 rounded-full px-4 py-2"
        >
          <Text className="text-white font-clash-semibold text-[14px]">
            Pay
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <ScreenView>
      <View className="flex-1 bg-white">
        {/* Header */}
        <View className="px-6 pt-4 pb-4 bg-white">
          <View className="flex-row justify-between items-center">
            <Text className="text-black font-clash-semibold text-[24px]">
              Nearby
            </Text>
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="close" size={28} color="#1A1A1A" />
            </TouchableOpacity>
          </View>
        </View>

        <FlatList
          data={scanning ? [] : nearbyUsers}
          keyExtractor={(item) => item.id}
          renderItem={renderNearbyUser}
          ListHeaderComponent={
            <View className="items-center justify-center py-10">
              {/* BLE Animation */}
              <View className="w-60 h-60 items-center justify-center mb-6">
                <Animated.View
                  className="absolute rounded-full border-[1.5px] border-[#00D68F]"
                  style={{
                    width: 200,
                    height: 200,
                    transform: [{ scale: pulseAnim1 }],
                    opacity: opacityAnim1,
                  }}
                />
                <Animated.View
                  className="absolute rounded-full border-[1.5px] border-[#00D68F]"
                  style={{
                    width: 200,
                    height: 200,
                    transform: [{ scale: pulseAnim2 }],
                    opacity: opacityAnim2,
                  }}
                />
                <Animated.View
                  className="absolute rounded-full border-[1.5px] border-[#00D68F]"
                  style={{
                    width: 200,
                    height: 200,
                    transform: [{ scale: pulseAnim3 }],
                    opacity: opacityAnim3,
                  }}
                />
                <Image
                  source={{ uri: "https://i.pravatar.cc/100" }}
                  className="w-10 h-10 rounded-full"
                />
              </View>

              <Text className="text-[#6B7280] font-clash-regular text-[14px] mb-4">
                {scanning
                  ? "Looking for nearby users…"
                  : "Tap on a user to pay"}
              </Text>

              <TouchableOpacity onPress={handleScanQR}>
                <Text className="text-[#6B7280] rounded-full bg-[#F3F4F6] px-4 py-2 font-clash-medium text-[14px]">
                  Scan QR instead
                </Text>
              </TouchableOpacity>
            </View>
          }
          ListEmptyComponent={
            !scanning ? (
              <View className="items-center justify-center py-12 px-10">
                <Ionicons name="people-outline" size={48} color="#9CA3AF" />
                <Text className="text-[#6B7280] font-clash-regular text-[14px] mt-4 text-center">
                  No one nearby — ask them to open PayDrop
                </Text>
              </View>
            ) : null
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        />

        {!permissionGranted && (
          <View className="absolute inset-0 bg-white items-center justify-center px-10">
            <Ionicons name="bluetooth-outline" size={64} color="#9CA3AF" />
            <Text className="text-[#1A1A1A] font-clash-bold text-[20px] mb-2 mt-4">
              Bluetooth Permission Required
            </Text>
            <Text className="text-[#6B7280] font-clash-regular text-[14px] text-center mb-8">
              To find nearby users, we need Bluetooth access to scan for
              devices.
            </Text>
            <TouchableOpacity
              onPress={handleOpenSettings}
              className="bg-[#00D68F] rounded-full px-8 py-3 w-full items-center"
            >
              <Text className="text-black font-clash-bold text-[16px]">
                Open Settings
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScreenView>
  );
}
