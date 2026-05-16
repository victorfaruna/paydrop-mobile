/**
 * Nearby Users Screen
 * Uses BLE to discover other PayDrop users in proximity.
 * Implementation follows the useBLEDiscovery hook for scanning and broadcasting.
 * NOTE: This feature requires native modules and background modes.
 * You must run a new EAS Build or prebuild to apply app.json changes.
 */

import ScreenView from "@/components/layout/ScreenView";
import { NearbyUser, useBLEDiscovery } from "@/hooks/useBLEDiscovery";
import { useUserStore } from "@/store/userStore";
import size from "@/utils/size";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  FlatList,
  Image,
  Linking,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function NearbyUsersScreen() {
  const router = useRouter();
  const user = useUserStore((state) => state.user);
  const { nearbyUsers, isScanning, error, refreshPermissions } =
    useBLEDiscovery("scan");

  // Animation refs
  const pulseAnim1 = useRef(new Animated.Value(0)).current;
  const pulseAnim2 = useRef(new Animated.Value(0)).current;
  const pulseAnim3 = useRef(new Animated.Value(0)).current;
  const opacityAnim1 = useRef(new Animated.Value(0.6)).current;
  const opacityAnim2 = useRef(new Animated.Value(0.6)).current;
  const opacityAnim3 = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    if (isScanning) {
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
      createPulse(pulseAnim2, opacityAnim2, 400);
      createPulse(pulseAnim3, opacityAnim3, 800);
    } else {
      pulseAnim1.stopAnimation();
      pulseAnim2.stopAnimation();
      pulseAnim3.stopAnimation();
    }
  }, [isScanning]);

  const handlePay = (targetUser: NearbyUser) => {
    router.push({
      pathname: "/screens/payment/recipient-preview" as any,
      params: { user: JSON.stringify(targetUser) },
    });
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
    <TouchableOpacity
      onPress={() => handlePay(item)}
      activeOpacity={0.7}
      className="bg-[#F3F4F6] rounded-[24px] p-4 mb-3 mx-6 border border-grey-100"
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center flex-1">
          <Image
            source={{
              uri:
                item.avatar_url ||
                `https://ui-avatars.com/api/?name=${item.first_name}+${item.last_name}&background=random`,
            }}
            className="rounded-full mr-4"
            style={{
              width: size.width(56),
              height: size.height(56),
            }}
          />
          <View className="flex-1">
            <View className="flex-row items-center">
              <Text className="text-[#1A1A1A] font-clash-semibold text-[17px] mr-2">
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
            <Text className="text-[#6B7280] font-clash-regular text-[14px]">
              @{item.username}
            </Text>
            <View className="flex-row items-center mt-1">
              <Text className="text-[#6B7280] font-clash-medium text-[12px]">
                👥 {item.mutual_trust}
              </Text>
              <Text className="text-purple-500 font-clash-medium text-[12px] ml-3">
                📍 {item.presence}
              </Text>
            </View>
          </View>
        </View>
        <View className="bg-purple-500 rounded-full w-10 h-10 items-center justify-center">
          <Ionicons name="arrow-forward" size={20} color="white" />
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <ScreenView>
      <View className="flex-1 bg-white">
        {/* Header */}
        <View className="px-6 pt-4 pb-4 bg-white flex-row justify-between items-center">
          <View>
            <Text className="text-black font-clash-semibold text-[28px]">
              Send Money
            </Text>
            <View className="flex-row items-center">
              <View
                className={`w-2 h-2 rounded-full mr-2 ${isScanning ? "bg-green-500" : "bg-red-500"}`}
              />
              <Text className="text-[#6B7280] font-clash-medium text-[12px]">
                {isScanning ? "Scanning for users..." : "Scanner paused"}
              </Text>
            </View>
          </View>
          <View className="flex-row items-center">
            <TouchableOpacity
              onPress={() => router.push("/screens/home/qr-scanner" as any)}
              className="w-10 h-10 bg-purple-50 rounded-full items-center justify-center border border-purple-100 mr-3"
            >
              <Ionicons name="qr-code-outline" size={20} color="#8B5CF6" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.back()}
              className="w-10 h-10 bg-grey-50 rounded-full items-center justify-center border border-grey-100"
            >
              <Ionicons name="close" size={24} color="#1A1A1A" />
            </TouchableOpacity>
          </View>
        </View>

        <FlatList
          data={nearbyUsers}
          keyExtractor={(item) => item.id}
          renderItem={renderNearbyUser}
          ListHeaderComponent={
            <View className="items-center justify-center py-8">
              {/* Pulsing Animation Container */}
              <View className="w-64 h-64 items-center justify-center mb-8 relative">
                {isScanning && (
                  <>
                    <Animated.View
                      className="absolute rounded-full border-[2px] border-purple-500/30"
                      style={{
                        width: 220,
                        height: 220,
                        transform: [{ scale: pulseAnim1 }],
                        opacity: opacityAnim1,
                      }}
                    />
                    <Animated.View
                      className="absolute rounded-full border-[2px] border-purple-500/30"
                      style={{
                        width: 220,
                        height: 220,
                        transform: [{ scale: pulseAnim2 }],
                        opacity: opacityAnim2,
                      }}
                    />
                    <Animated.View
                      className="absolute rounded-full border-[2px] border-purple-500/30"
                      style={{
                        width: 220,
                        height: 220,
                        transform: [{ scale: pulseAnim3 }],
                        opacity: opacityAnim3,
                      }}
                    />
                  </>
                )}

                <View className="w-24 h-24 rounded-full bg-white shadow-xl items-center justify-center border-4 border-purple-50">
                  <Image
                    source={{
                      uri: user?.avatar_url || "https://i.pravatar.cc/100",
                    }}
                    className="w-20 h-20 rounded-full"
                  />
                </View>

                {isScanning && (
                  <View className="absolute bottom-4 bg-purple-500 px-3 py-1 rounded-full shadow-sm">
                    <Text className="text-white font-clash-bold text-[10px]">
                      SCANNING
                    </Text>
                  </View>
                )}
              </View>

              <View className="px-10 items-center">
                <Text className="text-[#1A1A1A] font-clash-semibold text-[18px] text-center mb-2">
                  {isScanning ? "Finding people nearby" : "Search completed"}
                </Text>
                <Text className="text-[#6B7280] font-clash-regular text-[14px] text-center">
                  {isScanning
                    ? "Make sure others have this screen open to be discovered."
                    : "No more users found. Tap below to scan again."}
                </Text>
              </View>
            </View>
          }
          ListEmptyComponent={
            !isScanning ? (
              <View className="items-center justify-center py-10 px-10">
                <View className="w-16 h-16 bg-grey-50 rounded-full items-center justify-center mb-4">
                  <Ionicons name="people-outline" size={32} color="#9CA3AF" />
                </View>
                <Text className="text-[#6B7280] font-clash-medium text-[14px] text-center">
                  No one nearby yet.
                </Text>
                <TouchableOpacity
                  onPress={refreshPermissions}
                  className="mt-6 border border-purple-200 px-6 py-2 rounded-full"
                >
                  <Text className="text-purple-500 font-clash-bold">
                    Try Again
                  </Text>
                </TouchableOpacity>
              </View>
            ) : null
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
        />

        {/* Error / Permission Overlay */}
        {error && (
          <View className="absolute inset-0 bg-white/95 items-center justify-center px-10 z-50">
            <View className="w-20 h-20 bg-red-50 rounded-full items-center justify-center mb-6">
              <Ionicons name="alert-circle-outline" size={48} color="#FF6B6B" />
            </View>
            <Text className="text-[#1A1A1A] font-clash-semibold text-[22px] mb-3 text-center">
              {error.includes("permissions")
                ? "Permissions Required"
                : "Bluetooth Issue"}
            </Text>
            <Text className="text-[#6B7280] font-clash-regular text-[15px] text-center mb-10 leading-6">
              {error}
            </Text>
            <TouchableOpacity
              onPress={
                error.includes("permissions")
                  ? handleOpenSettings
                  : refreshPermissions
              }
              className="bg-purple-500 rounded-full py-4 w-full items-center shadow-lg shadow-purple-200"
            >
              <Text className="text-white font-clash-semibold text-[16px]">
                {error.includes("permissions") ? "Open Settings" : "Retry"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.back()} className="mt-6">
              <Text className="text-[#9CA3AF] font-clash-medium">Go Back</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScreenView>
  );
}
