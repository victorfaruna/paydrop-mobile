import { getQrCode } from "@/services/user";
import { useUserStore } from "@/store/userStore";
import { useQuery } from "@tanstack/react-query";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  Share,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import QRCode from "react-native-qrcode-svg";

import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface QRModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function QRModal({ visible, onClose }: QRModalProps) {
  const [qrTTL, setQrTTL] = useState<number | null>(null);
  const user = useUserStore((state) => state.user);
  const accessToken = useUserStore((state) => state.accessToken);
  const insets = useSafeAreaInsets();

  const {
    data: qrData,
    isLoading: qrLoading,
    isRefetching: qrRefreshing,
    error: qrError,
    refetch: refreshQrCode,
  } = useQuery({
    queryKey: ["qr-code", accessToken],
    queryFn: getQrCode,
    enabled: visible && !!accessToken,
  });

  const qrPayload =
    qrData?.qr ||
    qrData?.data?.qr ||
    qrData?.token ||
    qrData?.data?.token ||
    qrData?.payload ||
    qrData?.data?.payload ||
    (typeof qrData === "string" ? qrData : "") ||
    (user?.username ? `paydrop:${user.username}` : "");

  useEffect(() => {
    if (visible) {
      console.log("=== QR Modal Debug ===");
      console.log("Visible:", visible);
      console.log("Access Token State:", accessToken ? "Present" : "Missing");
      console.log("Access Token Value:", accessToken ? `${accessToken.substring(0, 10)}...` : "null");
      console.log("User in Store:", user ? "Found" : "Missing");
      console.log("QR Data from API:", qrData);
      console.log("Resolved QR Payload:", qrPayload);
      console.log("QR Error:", qrError);
      console.log("======================");
    }
  }, [qrData, visible, accessToken, qrPayload, qrError, user]);

  useEffect(() => {
    if (qrData) {
      const ttl =
        typeof qrData?.ttl === "number"
          ? qrData.ttl
          : typeof qrData?.expires_in === "number"
            ? qrData.expires_in
            : 60;
      setQrTTL(ttl);
    }
  }, [qrData]);

  useEffect(() => {
    if (!visible) return;
    const interval = setInterval(() => {
      setQrTTL((prev) => (prev !== null ? Math.max(prev - 1, 0) : null));
    }, 1000);

    return () => clearInterval(interval);
  }, [visible]);

  useEffect(() => {
    if (visible && qrTTL !== null && qrTTL <= 10 && !qrRefreshing) {
      refreshQrCode();
    }
  }, [visible, qrTTL, qrRefreshing]);

  const handleShareQr = async () => {
    if (!qrPayload) return;

    try {
      await Share.share({
        message: `Pay me on PayDrop: ${qrPayload}`,
      });
    } catch (error) {
      console.error("Share error", error);
    }
  };

  const handleCopyQr = async () => {
    if (!qrPayload) return;
    await Clipboard.setStringAsync(qrPayload);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const fullName =
    user?.first_name && user?.last_name
      ? `${user.first_name} ${user.last_name}`
      : user?.name || "PayDrop User";

  const username =
    user?.username || `@${(user?.first_name || "user").toLowerCase()}`;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View className="flex-1 bg-black/60 justify-end">
        <TouchableOpacity
          activeOpacity={1}
          onPress={onClose}
          className="absolute inset-0"
        />
        <View
          className="bg-white rounded-t-[40px] px-6"
          style={{
            paddingTop: 32,
            paddingBottom: insets.bottom + 32,
          }}
        >
          <View className="flex-row items-center justify-between mb-8">
            <View className="w-10" />
            <Text className="text-black font-clash-semibold text-xl">
              Receive Money
            </Text>
            <TouchableOpacity
              onPress={onClose}
              className="w-10 h-10 bg-grey-50 rounded-full items-center justify-center border border-grey-100"
            >
              <Ionicons name="close" size={22} color="#1A1A1A" />
            </TouchableOpacity>
          </View>

          <View className="items-center">
            <View className="bg-white rounded-[32px] p-[24px] border border-grey-200">
              {qrLoading ? (
                <View
                  style={{
                    width: 220,
                    height: 220,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <ActivityIndicator size="large" color="#A855F7" />
                </View>
              ) : qrPayload ? (
                <QRCode
                  value={qrPayload}
                  size={220}
                  backgroundColor="white"
                  color="black"
                />
              ) : (
                <View
                  style={{
                    width: 220,
                    height: 220,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text className="text-grey-400 font-clash-medium text-center">
                    Unable to load QR code.{"\n"}Please try again.
                  </Text>
                </View>
              )}
            </View>

            <View className="items-center mt-10">
              <View className="relative">
                <Image
                  source={{
                    uri:
                      user?.avatar_url ||
                      user?.avatar ||
                      `https://ui-avatars.com/api/?name=${fullName}&background=F3E8FF&color=A855F7`,
                  }}
                  className="h-[64px] w-[64px] rounded-full border-2 border-purple-100"
                />
                <View className="absolute bottom-2 -right-0 bg-green-500 w-4 h-4 rounded-full border-2 border-white" />
              </View>
              <Text className="mt-4 text-black font-clash-semibold text-lg">
                {fullName}
              </Text>
              <Text className="text-grey-500 font-clash-medium text-[14px] mt-0.5">
                {username}
              </Text>
            </View>

            <View className="w-full flex-row gap-3 mt-10">
              <TouchableOpacity
                onPress={handleShareQr}
                className="flex-1 h-[56px] flex-row items-center justify-center rounded-2xl bg-purple-500"
              >
                <Ionicons
                  name="share-social-outline"
                  size={20}
                  color="white"
                  className="mr-2"
                />
                <Text className="text-white font-clash-semibold text-[16px] ml-2">
                  Share QR
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleCopyQr}
                className="w-[56px] h-[56px] items-center justify-center rounded-2xl bg-grey-50 border border-grey-100"
              >
                <Ionicons name="copy-outline" size={20} color="#1A1A1A" />
              </TouchableOpacity>
            </View>

            {(qrRefreshing || (qrTTL !== null && qrTTL <= 15)) && (
              <View className="mt-6 flex-row items-center">
                <ActivityIndicator size="small" color="#9CA3AF" />
                <Text className="ml-2 text-[#9CA3AF] font-clash-medium text-[12px]">
                  Refreshing code in {qrTTL}s
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}
