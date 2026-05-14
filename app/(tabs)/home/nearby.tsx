import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
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
import { useUserStore } from "@/store/userStore";
import { BleManager } from 'react-native-ble-plx';

const { width } = Dimensions.get("window");
const BASE_URL = "https://pay-drop-backend.vercel.app";
const DEVICE_ID = "paydrop-mobile-app";

// Initialize BleManager outside component to prevent multiple instances
const bleManager = new BleManager();

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
  const scannedTokens = useRef<Set<string>>(new Set());

  // Animation refs
  const pulseAnim1 = useRef(new Animated.Value(0)).current;
  const pulseAnim2 = useRef(new Animated.Value(0)).current;
  const pulseAnim3 = useRef(new Animated.Value(0)).current;
  const opacityAnim1 = useRef(new Animated.Value(0.6)).current;
  const opacityAnim2 = useRef(new Animated.Value(0.6)).current;
  const opacityAnim3 = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    let isMounted = true;

    const resolveToken = async (token: string, rssi: number | null) => {
      // Ignore weak signals (too far away)
      if (rssi && rssi < -75) return;
      
      // Avoid resolving the same token multiple times
      if (scannedTokens.current.has(token)) return;
      scannedTokens.current.add(token);

      try {
        const response = await axios.post(
          `${BASE_URL}/api/v1/discover/resolve`,
          { token },
          {
            headers: { 
              "x-device-id": DEVICE_ID,
              Authorization: accessToken ? `Bearer ${accessToken}` : undefined,
            },
          }
        );

        if (response.data.user && isMounted) {
          setNearbyUsers(prev => {
            // Prevent duplicates in state
            if (prev.some(u => u.id === response.data.user.id)) return prev;
            return [...prev, response.data.user];
          });
          setScanning(false);
        }
      } catch (error) {
        // Token invalid or expired
      }
    };

    const startBLEScan = async () => {
      try {
        const state = await bleManager.state();
        if (state !== 'PoweredOn') {
          // You could prompt the user to turn on Bluetooth here
          throw new Error("Bluetooth is not powered on");
        }

        bleManager.startDeviceScan(
          null, // Or specify an array of UUIDs to filter PayDrop devices
          { allowDuplicates: false },
          (error, device) => {
            if (error) {
              console.log("BLE Scan Error:", error);
              return;
            }

            // In a real implementation, the token would be in the advertisement data
            // (e.g., localName or serviceData). We assume localName contains the token for this example.
            const token = device?.localName;
            if (token && token.startsWith('PD_')) {
               resolveToken(token, device.rssi);
            }
          }
        );
      } catch (error) {
        console.warn("Could not start BLE scan. Falling back to mock data.", error);
      }
    };

    const startDiscovery = async () => {
      try {
        // 1. Notify backend we are looking and get our own broadcast token
        await axios.post(
          `${BASE_URL}/api/v1/discover/broadcast`,
          {},
          {
            headers: { 
              "x-device-id": DEVICE_ID,
              Authorization: accessToken ? `Bearer ${accessToken}` : undefined,
            },
          },
        );

        // 2. Start actual BLE Scanning
        startBLEScan();

        // 3. Fallback mock data for UI testing (since BLE requires physical devices)
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
        }, 4000);

      } catch (error) {
        console.error("Discovery setup error", error);
        setScanning(false);
      }
    };

    if (permissionGranted) {
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
      bleManager.stopDeviceScan();
      
      // DELETE /discover/broadcast on unmount
      axios
        .delete(`${BASE_URL}/api/v1/discover/broadcast`, {
          headers: { 
            "x-device-id": DEVICE_ID,
            Authorization: accessToken ? `Bearer ${accessToken}` : undefined,
          },
        })
        .catch(console.error);
    };
  }, [permissionGranted, accessToken]);

  const handlePay = (user: NearbyUser) => {
    router.push({
      pathname: "/recipient-preview" as any,
      params: { user: JSON.stringify(user) },
    });
  };

  const handleScanQR = () => {
    router.push("/home/qr-scanner");
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
            className="w-12 h-12 rounded-full mr-3"
          />
          <View className="flex-1">
            <View className="flex-row items-center">
              <Text className="text-[#1A1A1A] font-clash-bold text-[16px] mr-2">
                {item.first_name} {item.last_name}
              </Text>
              <View
                className="rounded-full px-2 py-0.5"
                style={{ backgroundColor: getTrustColor(item.trust_tier) + "20" }}
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
            <Text className="text-[#6B7280] font-clash-regular text-[12px] mt-0.5">
              📍 {item.presence}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={() => handlePay(item)}
          className="bg-[#00D68F] rounded-full px-4 py-2"
        >
          <Text className="text-black font-clash-bold text-[14px]">Pay</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="px-6 pt-14 pb-4 bg-white">
        <View className="flex-row justify-between items-center">
          <Text className="text-[#1A1A1A] font-clash-bold text-[24px]">Nearby</Text>
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
              {scanning ? "Looking for nearby users…" : "Tap on a user to pay"}
            </Text>
            
            <TouchableOpacity onPress={handleScanQR}>
              <Text className="text-[#6B7280] font-clash-medium text-[14px]">
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
            To find nearby users, we need Bluetooth access to scan for devices.
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
  );
}
