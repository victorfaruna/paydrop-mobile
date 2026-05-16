/**
 * Custom hook for BLE-based user discovery.
 * Handles permissions, token broadcasting, and scanning for nearby users.
 */

import {
  broadcastDiscovery,
  resolveDiscoveryTokens,
  stopDiscoveryBroadcast,
} from "@/services/user";
import * as Crypto from "expo-crypto";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, AppStateStatus, Platform } from "react-native";
import BLEAdvertiser from "react-native-ble-advertiser";
import { BleManager } from "react-native-ble-plx";
import {
  check,
  Permission,
  PERMISSIONS,
  request,
  RESULTS,
} from "react-native-permissions";

// Singleton BleManager for scanning
const bleManager = new BleManager();

export interface NearbyUser {
  id: string;
  first_name: string;
  last_name: string;
  username: string;
  avatar_url?: string;
  trust_score: number;
  trust_tier: "low" | "medium" | "high";
  mutual_trust: string;
  presence: string;
  lastSeen: number;
}

export const useBLEDiscovery = (mode: "scan" | "advertise" | "both" = "both") => {
  const [nearbyUsers, setNearbyUsers] = useState<NearbyUser[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isAdvertising, setIsAdvertising] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tokenRef = useRef<string>(Crypto.randomUUID());
  const scannedTokensRef = useRef<Set<string>>(new Set());
  const nearbyUsersRef = useRef<Map<string, NearbyUser>>(new Map());

  const refreshIntervalRef = useRef<any>(null);
  const resolveIntervalRef = useRef<any>(null);
  const ttlIntervalRef = useRef<any>(null);

  // Helper to request permissions
  const requestPermissions = async () => {
    const permissions: Permission[] = Platform.select({
      ios: [PERMISSIONS.IOS.BLUETOOTH],
      android: [
        PERMISSIONS.ANDROID.BLUETOOTH_SCAN,
        PERMISSIONS.ANDROID.BLUETOOTH_ADVERTISE,
        PERMISSIONS.ANDROID.BLUETOOTH_CONNECT,
        PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
      ],
      default: [],
    });

    for (const permission of permissions) {
      const result = await check(permission);
      if (result !== RESULTS.GRANTED) {
        const requestResult = await request(permission);
        if (
          requestResult !== RESULTS.GRANTED &&
          requestResult !== RESULTS.LIMITED
        ) {
          return false;
        }
      }
    }
    return true;
  };

  // Retry helper with exponential backoff
  const withRetry = async <T>(
    fn: () => Promise<T>,
    maxRetries = 3,
  ): Promise<T> => {
    let lastError: any;
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (err) {
        lastError = err;
        const delay = Math.pow(2, i) * 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
    throw lastError;
  };

  const startBLEOperations = useCallback(async () => {
    try {
      const hasPermissions = await requestPermissions();
      if (!hasPermissions) {
        setError("Bluetooth permissions denied");
        return;
      }

      // Check Bluetooth state
      const state = await bleManager.state();
      if (state !== "PoweredOn") {
        setError("Bluetooth is turned off. Please enable it.");
        return;
      }

      // 1. Register token with backend and Advertise (Peripheral mode)
      if (mode === "advertise" || mode === "both") {
        try {
          await withRetry(() => broadcastDiscovery({ token: tokenRef.current }));
        } catch (err) {
          console.error("[Token Registration Failed]", err);
          setError("Failed to register session token. Advertising disabled.");
          return;
        }

        try {
          await BLEAdvertiser.setCompanyId(0x004c); // Apple ID for local name support
          await BLEAdvertiser.broadcast(tokenRef.current, [], {
            advertiseMode: (BLEAdvertiser as any).ADVERTISE_MODE_LOW_LATENCY || 2,
            txPowerLevel: (BLEAdvertiser as any).ADVERTISE_TX_POWER_HIGH || 3,
            connectable: false,
            includeDeviceName: false, // Fix payload size error on Android
          });
          setIsAdvertising(true);
        } catch (err) {
          console.warn("[Advertising Failed]", err);
          // iOS background limitation might cause this, don't crash
        }
      }

      // 2. Start Scanning (Central mode)
      if (mode === "scan" || mode === "both") {
        bleManager.startDeviceScan(
          null,
          { allowDuplicates: true },
          (error, device) => {
            if (error) {
              if (error.errorCode === 102) {
                // BluetoothOff
                setError("Bluetooth is turned off");
              } else {
                console.error("[BLE Scan Error]", error);
              }
              return;
            }

            if (device && device.localName) {
              const potentialToken = device.localName;
              // Most tokens will be 36 chars (UUID)
              if (
                potentialToken.length >= 32 &&
                potentialToken !== tokenRef.current
              ) {
                scannedTokensRef.current.add(potentialToken);
              }
            }
          },
        );
        setIsScanning(true);
      }
      
      setError(null);
    } catch (err: any) {
      console.error("[BLE Discovery Error]", err);
      setError(err.message || "Failed to start BLE discovery");
      setIsAdvertising(false);
      setIsScanning(false);
    }
  }, [mode]);

  const stopBLEOperations = useCallback(async () => {
    try {
      bleManager.stopDeviceScan();
      setIsScanning(false);

      await BLEAdvertiser.stopBroadcast().catch(() => {});
      setIsAdvertising(false);

      await stopDiscoveryBroadcast().catch(() => {});
    } catch (err) {
      console.error("[BLE Stop Error]", err);
    }
  }, []);

  // Token refresh every 2.5 minutes (only if advertising)
  const startTokenRefresh = useCallback(() => {
    if (mode !== "advertise" && mode !== "both") return;
    if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current);
    refreshIntervalRef.current = setInterval(async () => {
      try {
        await withRetry(() => broadcastDiscovery({ token: tokenRef.current }));
      } catch (err) {
        console.error("[Token Refresh Error]", err);
      }
    }, 150000); // 2.5 minutes
  }, [mode]);

  // Resolve tokens every 10 seconds (only if scanning)
  const startResolveBatching = useCallback(() => {
    if (mode !== "scan" && mode !== "both") return;
    if (resolveIntervalRef.current) clearInterval(resolveIntervalRef.current);
    resolveIntervalRef.current = setInterval(async () => {
      const tokensToResolve = Array.from(scannedTokensRef.current);
      if (tokensToResolve.length === 0) return;

      try {
        const users = await withRetry(() =>
          resolveDiscoveryTokens(tokensToResolve),
        );
        const now = Date.now();

        users.forEach((user: any) => {
          nearbyUsersRef.current.set(user.id, {
            ...user,
            lastSeen: now,
          });
        });

        // Clear scanned tokens after batching
        scannedTokensRef.current.clear();

        // Update state
        setNearbyUsers(Array.from(nearbyUsersRef.current.values()));
      } catch (err) {
        console.error("[Resolve Error]", err);
      }
    }, 10000); // 10 seconds
  }, [mode]);

  // Local TTL Cleanup every 5 seconds
  const startTTLCleanup = useCallback(() => {
    if (ttlIntervalRef.current) clearInterval(ttlIntervalRef.current);
    ttlIntervalRef.current = setInterval(() => {
      const now = Date.now();
      let changed = false;

      nearbyUsersRef.current.forEach((user, id) => {
        if (now - user.lastSeen > 30000) {
          // 30 seconds TTL
          nearbyUsersRef.current.delete(id);
          changed = true;
        }
      });

      if (changed) {
        setNearbyUsers(Array.from(nearbyUsersRef.current.values()));
      }
    }, 5000);
  }, []);

  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === "active") {
        tokenRef.current = Crypto.randomUUID(); // New token per session
        startBLEOperations();
        startTokenRefresh();
        startResolveBatching();
        startTTLCleanup();
      } else {
        stopBLEOperations();
        if (refreshIntervalRef.current)
          clearInterval(refreshIntervalRef.current);
        if (resolveIntervalRef.current)
          clearInterval(resolveIntervalRef.current);
        if (ttlIntervalRef.current) clearInterval(ttlIntervalRef.current);
      }
    };

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange,
    );

    // Initial start
    if (AppState.currentState === "active") {
      startBLEOperations();
      startTokenRefresh();
      startResolveBatching();
      startTTLCleanup();
    }

    return () => {
      subscription.remove();
      stopBLEOperations();
      if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current);
      if (resolveIntervalRef.current) clearInterval(resolveIntervalRef.current);
      if (ttlIntervalRef.current) clearInterval(ttlIntervalRef.current);
    };
  }, [
    startBLEOperations,
    stopBLEOperations,
    startTokenRefresh,
    startResolveBatching,
    startTTLCleanup,
  ]);

  return {
    nearbyUsers,
    isScanning,
    isAdvertising,
    error,
    refreshPermissions: requestPermissions,
  };
};
