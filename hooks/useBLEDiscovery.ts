/**
 * Custom hook for BLE-based user discovery.
 * Handles permissions, token broadcasting (peripheral), and scanning (central).
 *
 * How it works:
 * - Receiver: Registers a UUID token with the backend, then broadcasts it via BLE as a service UUID.
 * - Sender: Scans for BLE devices, collects service UUIDs from advertisements, batches them,
 *   and resolves them via the backend API to get real user profiles.
 */

import {
  broadcastDiscovery,
  resolveDiscoveryTokens,
  stopDiscoveryBroadcast,
} from "@/services/user";
import * as Crypto from "expo-crypto";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  AppState,
  AppStateStatus,
  NativeModules,
  PermissionsAndroid,
  Platform,
} from "react-native";
import { BleManager } from "react-native-ble-plx";
import {
  check,
  Permission,
  PERMISSIONS,
  request,
  RESULTS,
} from "react-native-permissions";

// Package exports NativeModules.BLEAdvertiser directly (no .default)
const BLEAdvertiser: typeof NativeModules.BLEAdvertiser | null =
  NativeModules.BLEAdvertiser ?? null;

const waitForBleAdvertiserReady = async (timeoutMs = 5000) => {
  if (!BLEAdvertiser?.getAdapterState) return;
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const state = await BLEAdvertiser.getAdapterState();
      if (state === "STATE_ON") return;
    } catch {
      // Adapter still initializing
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
};

const startNativeAdvertising = async (token: string) => {
  if (!BLEAdvertiser?.broadcast) {
    console.warn("[BLE] BLEAdvertiser native module not linked");
    return false;
  }

  // iOS: setCompanyId only initializes CBPeripheralManager (company ID unused).
  // Android: required manufacturer company ID before broadcast.
  if (Platform.OS === "android" && BLEAdvertiser.setCompanyId) {
    BLEAdvertiser.setCompanyId(0x004c);
  } else if (Platform.OS === "ios" && BLEAdvertiser.setCompanyId) {
    BLEAdvertiser.setCompanyId(0);
    await waitForBleAdvertiserReady();
  }

  const options = {
    advertiseMode: 2,
    txPowerLevel: 3,
    connectable: false,
    includeDeviceName: false,
  };

  const maxAttempts = Platform.OS === "ios" ? 6 : 1;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      await BLEAdvertiser.broadcast(token, [], options);
      return true;
    } catch (err) {
      if (attempt === maxAttempts - 1) throw err;
      await new Promise((resolve) => setTimeout(resolve, 400));
    }
  }
  return false;
};

// Singleton BleManager for scanning
const bleManager = new BleManager();

export interface NearbyUser {
  id: string;
  first_name: string;
  last_name: string;
  username: string;
  avatar_url?: string;
  trust_score?: number;
  trust_tier: string; // "LOW" | "MEDIUM" | "HIGH" — backend may send uppercase
  mutual_trust?: string;
  presence?: string;
  distance_signal?: string; // "NEAR" | "FAR" etc.
  lastSeen: number;
}

export const useBLEDiscovery = (
  mode: "scan" | "advertise" | "both" = "both",
) => {
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

  // ─── Permissions ───────────────────────────────────────────────
  const requestPermissions = async () => {
    if (Platform.OS === "android") {
      try {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADVERTISE,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ]);

        const allGranted = Object.values(granted).every(
          (status) => status === PermissionsAndroid.RESULTS.GRANTED,
        );

        if (!allGranted) {
          console.warn("[BLE] Some Android permissions denied:", granted);
          return false;
        }
      } catch (err) {
        console.error("[BLE] Permission request error:", err);
        return false;
      }
      return true;
    }

    const permissions: Permission[] = [PERMISSIONS.IOS.BLUETOOTH];
    for (const permission of permissions) {
      const result = await check(permission);
      if (result === RESULTS.GRANTED || result === RESULTS.LIMITED) continue;
      const requestResult = await request(permission);
      if (
        requestResult !== RESULTS.GRANTED &&
        requestResult !== RESULTS.LIMITED
      ) {
        return false;
      }
    }
    return true;
  };

  // ─── Retry helper ──────────────────────────────────────────────
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

  // ─── UUID validation helper ────────────────────────────────────
  const isUUIDFormat = (str: string): boolean => {
    // Matches standard UUID (with or without hyphens), 32-36 chars
    return /^[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}$/i.test(
      str,
    );
  };

  // ─── Start BLE Operations ─────────────────────────────────────
  const startBLEOperations = useCallback(async () => {
    try {
      const hasPermissions = await requestPermissions();
      if (!hasPermissions) {
        setError("Bluetooth permissions denied");
        return;
      }

      // Check Bluetooth state — wait briefly if state is Unknown (initial load)
      let state = await bleManager.state();
      if (state === "Unknown") {
        // Wait up to 3 seconds for BLE to initialize
        await new Promise<void>((resolve) => {
          const sub = bleManager.onStateChange((newState) => {
            if (newState !== "Unknown") {
              sub.remove();
              state = newState;
              resolve();
            }
          }, true);
          setTimeout(() => {
            sub.remove();
            resolve();
          }, 3000);
        });
      }

      if (state === "Unsupported") {
        setError("Bluetooth is not supported on this device.");
        return;
      } else if (state === "PoweredOff") {
        setError("Bluetooth is turned off. Please enable it.");
        return;
      }

      // ── 1. Advertise (Peripheral mode) ──────────────────────────
      if (mode === "advertise" || mode === "both") {
        // Register token with backend first
        try {
          await withRetry(() =>
            broadcastDiscovery({ token: tokenRef.current }),
          );
          console.log(
            "[BLE] Token registered with backend:",
            tokenRef.current,
          );
        } catch (err) {
          console.error("[BLE] Token Registration Failed", err);
          setError(
            "Failed to register session token. Advertising disabled.",
          );
          return;
        }

        // Broadcast token via BLE as a service UUID
        try {
          const nativeStarted = await startNativeAdvertising(
            tokenRef.current,
          );
          if (nativeStarted) {
            console.log(
              "[BLE] Advertising started with token:",
              tokenRef.current,
            );
            setIsAdvertising(true);
            setError(null);
          } else {
            setIsAdvertising(false);
            setError(
              "Bluetooth advertising is unavailable. Rebuild the app with native BLE support.",
            );
          }
        } catch (err: any) {
          console.warn("[BLE] Advertising Failed", err);
          setIsAdvertising(false);
          setError(
            err?.message ||
              "Failed to start Bluetooth advertising. Check Bluetooth is on.",
          );
        }
      }

      // ── 2. Scan (Central mode) ──────────────────────────────────
      if (mode === "scan" || mode === "both") {
        bleManager.startDeviceScan(
          null,
          { allowDuplicates: true },
          (scanError, device) => {
            if (scanError) {
              if (scanError.errorCode === 102) {
                setError("Bluetooth is turned off");
              } else {
                console.error("[BLE Scan Error]", scanError);
              }
              return;
            }

            if (!device) return;

            // ─── Extract tokens from the BLE advertisement ───────
            // react-native-ble-advertiser broadcasts tokens as service UUIDs.
            // On iOS, localName is masked in background, so serviceUUIDs is the
            // reliable source. On Android, it may appear in either.

            const candidateTokens: string[] = [];

            // Primary: check service UUIDs (where ble-advertiser puts the token)
            if (device.serviceUUIDs && device.serviceUUIDs.length > 0) {
              for (const uuid of device.serviceUUIDs) {
                if (uuid && isUUIDFormat(uuid)) {
                  candidateTokens.push(uuid.toLowerCase());
                }
              }
            }

            // Fallback: check localName (Android sometimes exposes it here)
            if (device.localName && isUUIDFormat(device.localName)) {
              candidateTokens.push(device.localName.toLowerCase());
            }

            // Add valid tokens to our collection (skip our own)
            const ownToken = tokenRef.current.toLowerCase();
            for (const token of candidateTokens) {
              if (token !== ownToken) {
                scannedTokensRef.current.add(token);
              }
            }
          },
        );
        setIsScanning(true);
        setError(null);
        console.log("[BLE] Scanning started");
      }
    } catch (err: any) {
      console.error("[BLE Discovery Error]", err);
      setError(err.message || "Failed to start BLE discovery");
      setIsAdvertising(false);
      setIsScanning(false);
    }
  }, [mode]);

  // ─── Stop BLE Operations ──────────────────────────────────────
  const stopBLEOperations = useCallback(async () => {
    try {
      bleManager.stopDeviceScan();
      setIsScanning(false);

      if (BLEAdvertiser) await BLEAdvertiser.stopBroadcast().catch(() => {});
      setIsAdvertising(false);

      await stopDiscoveryBroadcast().catch(() => {});
    } catch (err) {
      console.error("[BLE Stop Error]", err);
    }
  }, []);

  // ─── Token refresh every 2.5 minutes (advertise mode) ─────────
  const startTokenRefresh = useCallback(() => {
    if (mode !== "advertise" && mode !== "both") return;
    if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current);
    refreshIntervalRef.current = setInterval(async () => {
      try {
        await withRetry(() =>
          broadcastDiscovery({ token: tokenRef.current }),
        );
      } catch (err) {
        console.error("[BLE Token Refresh Error]", err);
      }
    }, 150000); // 2.5 minutes
  }, [mode]);

  // ─── Resolve tokens every 8 seconds (scan mode) ──────────────
  const startResolveBatching = useCallback(() => {
    if (mode !== "scan" && mode !== "both") return;
    if (resolveIntervalRef.current) clearInterval(resolveIntervalRef.current);
    resolveIntervalRef.current = setInterval(async () => {
      const tokensToResolve = Array.from(scannedTokensRef.current);
      if (tokensToResolve.length === 0) return;

      console.log("[BLE] Resolving tokens:", tokensToResolve);

      try {
        const response = await withRetry(() =>
          resolveDiscoveryTokens(tokensToResolve),
        );
        const now = Date.now();

        // Handle different response shapes from the API
        let usersArray: any[] = [];

        if (Array.isArray(response)) {
          usersArray = response;
        } else if (response?.user && !Array.isArray(response.user)) {
          // Single user: { user: { ... } }
          usersArray = [response.user];
        } else if (response?.users && Array.isArray(response.users)) {
          usersArray = response.users;
        } else if (response?.data) {
          if (Array.isArray(response.data)) {
            usersArray = response.data;
          } else if (response.data.users) {
            usersArray = response.data.users;
          } else if (response.data.user) {
            usersArray = [response.data.user];
          }
        }

        console.log("[BLE] Resolved users:", usersArray.length);

        usersArray.forEach((user: any) => {
          if (user && user.id) {
            nearbyUsersRef.current.set(user.id, {
              ...user,
              lastSeen: now,
            });
          }
        });

        // Clear resolved tokens
        scannedTokensRef.current.clear();

        // Update state
        setNearbyUsers(Array.from(nearbyUsersRef.current.values()));
      } catch (err) {
        console.error("[BLE Resolve Error]", err);
      }
    }, 8000); // 8 seconds
  }, [mode]);

  // ─── Local TTL Cleanup every 5 seconds ────────────────────────
  const startTTLCleanup = useCallback(() => {
    if (ttlIntervalRef.current) clearInterval(ttlIntervalRef.current);
    ttlIntervalRef.current = setInterval(() => {
      const now = Date.now();
      let changed = false;

      nearbyUsersRef.current.forEach((user, id) => {
        if (now - user.lastSeen > 30000) {
          nearbyUsersRef.current.delete(id);
          changed = true;
        }
      });

      if (changed) {
        setNearbyUsers(Array.from(nearbyUsersRef.current.values()));
      }
    }, 5000);
  }, []);

  // ─── Lifecycle ────────────────────────────────────────────────
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === "active") {
        tokenRef.current = Crypto.randomUUID();
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
      if (refreshIntervalRef.current)
        clearInterval(refreshIntervalRef.current);
      if (resolveIntervalRef.current)
        clearInterval(resolveIntervalRef.current);
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
