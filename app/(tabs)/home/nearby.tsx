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
  Text,
  TouchableOpacity,
  View,
} from "react-native";
// import { BleManager } from 'react-native-ble-plx'; // Uncomment when ejecting from Expo

const { width, height } = Dimensions.get("window");
const BASE_URL = "https://pay-drop-backend.vercel.app";
const DEVICE_ID = "paydrop-mobile-app";

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
  const [nearbyUsers, setNearbyUsers] = useState<NearbyUser[]>([]);
  const [scanning, setScanning] = useState(true);
  const [permissionGranted, setPermissionGranted] = useState(true);

  // Animation refs
  const pulseAnim1 = useRef(new Animated.Value(1)).current;
  const pulseAnim2 = useRef(new Animated.Value(1)).current;
  const pulseAnim3 = useRef(new Animated.Value(1)).current;
  const opacityAnim1 = useRef(new Animated.Value(0.6)).current;
  const opacityAnim2 = useRef(new Animated.Value(0.6)).current;
  const opacityAnim3 = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    // Mock BLE scanning - replace with real BLE when ejecting
    const startScanning = async () => {
      try {
        // POST /discover/broadcast
        await axios.post(
          `${BASE_URL}/api/v1/discover/broadcast`,
          {},
          {
            headers: { "x-device-id": DEVICE_ID },
          },
        );

        // Mock BLE manager
        // const bleManager = new BleManager();
        // bleManager.startDeviceScan(null, null, (error, device) => {
        //   if (error) console.error(error);
        //   // Process device, extract token, POST /discover/resolve
        // });

        // Mock discovering users after 3s
        setTimeout(() => {
          setNearbyUsers([
            {
              id: "1",
              first_name: "Alice",
              last_name: "Johnson",
              username: "@alicej",
              avatar_url: "https://i.pravatar.cc/100?img=1",
              trust_score: 92,
              trust_tier: "high",
              mutual_trust: "Shade + 12 others",
              presence: "Faculty Building",
            },
            {
              id: "2",
              first_name: "Bob",
              last_name: "Smith",
              username: "@bobsmith",
              avatar_url: "https://i.pravatar.cc/100?img=2",
              trust_score: 78,
              trust_tier: "medium",
              mutual_trust: "3 mutual friends",
              presence: "Cafeteria",
            },
          ]);
          setScanning(false);
        }, 3000);
      } catch (error) {
        console.error("Broadcast error", error);
        setScanning(false);
      }
    };

    if (permissionGranted) {
      startScanning();
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
                toValue: 2,
                duration: 1500,
                useNativeDriver: true,
              }),
              Animated.timing(opacityAnim, {
                toValue: 0,
                duration: 1500,
                useNativeDriver: true,
              }),
            ]),
            Animated.parallel([
              Animated.timing(scaleAnim, {
                toValue: 1,
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
      // DELETE /discover/broadcast on unmount
      axios
        .delete(`${BASE_URL}/api/v1/discover/broadcast`, {
          headers: { "x-device-id": DEVICE_ID },
        })
        .catch(console.error);
      // bleManager?.destroy();
    };
  }, [permissionGranted]);

  const handlePay = (user: NearbyUser) => {
    router.push({
      pathname: "/home/transfer" as any,
      params: { recipientId: user.id },
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
        return "#FFB946";
      case "low":
        return "#FF6B6B";
      default:
        return "#9CA3AF";
    }
  };

  const renderNearbyUser = ({ item }: { item: NearbyUser }) => (
    <View className="bg-white rounded-2xl p-4 mb-3 mx-6 shadow-sm border border-grey-100">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center flex-1">
          <Image
            source={{ uri: item.avatar_url || "https://i.pravatar.cc/100" }}
            className="w-12 h-12 rounded-full mr-3"
          />
          <View className="flex-1">
            <Text className="text-black font-clash-semibold text-base">
              {item.first_name} {item.last_name}
            </Text>
            <Text className="text-grey-500 font-clash-regular text-sm">
              {item.username}
            </Text>
            <View className="flex-row items-center mt-1">
              <View
                className="rounded-full px-2 py-1 mr-2"
                style={{ backgroundColor: getTrustColor(item.trust_tier) }}
              >
                <Text className="text-white font-clash-medium text-xs">
                  {item.trust_score}%
                </Text>
              </View>
            </View>
            <Text className="text-grey-500 font-clash-regular text-xs mt-1">
              👥 Trusted by {item.mutual_trust}
            </Text>
            <Text className="text-grey-500 font-clash-regular text-xs mt-1">
              📍 {item.presence}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={() => handlePay(item)}
          className="bg-green-500 rounded-full px-4 py-2"
        >
          <Text className="text-white font-clash-medium text-sm">Pay</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (!permissionGranted) {
    return (
      <View className="flex-1 bg-white items-center justify-center px-6">
        <Ionicons name="bluetooth-outline" size={64} color="#9CA3AF" />
        <Text className="text-black font-clash-semibold text-xl mb-4 mt-4">
          Bluetooth Permission Required
        </Text>
        <Text className="text-grey-500 font-clash-regular text-base text-center mb-6">
          To find nearby users, we need Bluetooth access to scan for devices.
        </Text>
        <TouchableOpacity
          onPress={handleOpenSettings}
          className="bg-purple-500 rounded-full px-6 py-3"
        >
          <Text className="text-white font-clash-medium text-base">
            Open Settings
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-grey-50">
      {/* Header */}
      <View className="bg-white px-6 pt-14 pb-4 shadow-sm">
        <View className="flex-row justify-between items-center">
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
          </TouchableOpacity>
          <Text className="text-black font-clash-bold text-xl">Nearby</Text>
          <View className="w-6" />
        </View>
      </View>

      {/* BLE Animation */}
      {scanning && (
        <View className="flex-1 items-center justify-center px-6">
          <View className="relative items-center justify-center mb-8">
            <Animated.View
              className="absolute rounded-full border-2 border-green-500"
              style={{
                width: 120,
                height: 120,
                transform: [{ scale: pulseAnim1 }],
                opacity: opacityAnim1,
              }}
            />
            <Animated.View
              className="absolute rounded-full border-2 border-green-500"
              style={{
                width: 120,
                height: 120,
                transform: [{ scale: pulseAnim2 }],
                opacity: opacityAnim2,
              }}
            />
            <Animated.View
              className="absolute rounded-full border-2 border-green-500"
              style={{
                width: 120,
                height: 120,
                transform: [{ scale: pulseAnim3 }],
                opacity: opacityAnim3,
              }}
            />
            <Image
              source={{ uri: "https://i.pravatar.cc/100" }}
              className="w-12 h-12 rounded-full"
            />
          </View>
          <Text className="text-grey-500 font-clash-regular text-base mb-6">
            Looking for nearby users…
          </Text>
          <TouchableOpacity
            onPress={handleScanQR}
            className="bg-white rounded-full px-6 py-3 shadow-sm"
          >
            <Text className="text-grey-500 font-clash-regular text-base">
              Scan QR instead
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Nearby Users List */}
      {!scanning && (
        <FlatList
          data={nearbyUsers}
          keyExtractor={(item) => item.id}
          renderItem={renderNearbyUser}
          ListEmptyComponent={
            <View className="items-center justify-center py-12">
              <Ionicons name="people-outline" size={48} color="#9CA3AF" />
              <Text className="text-grey-500 font-clash-regular text-base mt-4">
                No one nearby — ask them to open PayDrop
              </Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: 16 }}
        />
      )}
    </View>
  );
}
