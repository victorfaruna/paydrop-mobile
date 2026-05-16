import { NativeModules, Platform } from "react-native";

import { isValidBleServiceUuid, normalizeDiscoveryToken } from "./discoveryToken";

const BLEAdvertiser = NativeModules.BLEAdvertiser as {
  setCompanyId?: (id: number) => void;
  broadcast?: (
    uid: string,
    payload: number[],
    options: Record<string, unknown>,
  ) => Promise<string>;
  stopBroadcast?: () => Promise<string>;
  getAdapterState?: () => Promise<string>;
} | null;

const BLEPeripheral = NativeModules.BLEPeripheral as {
  addService?: (uuid: string, primary: boolean) => void;
  stop?: () => void;
  start?: () => Promise<string>;
} | null;

export type BleNativeStatus = {
  advertiser: boolean;
  peripheral: boolean;
};

export const getBleNativeStatus = (): BleNativeStatus => ({
  advertiser: Boolean(BLEAdvertiser?.broadcast),
  peripheral: Boolean(BLEPeripheral?.start),
});

const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

const waitForAdvertiserReady = async (timeoutMs = 6000) => {
  if (!BLEAdvertiser?.getAdapterState) return;
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const state = await BLEAdvertiser.getAdapterState();
      if (state === "STATE_ON") return;
    } catch {
      // still booting
    }
    await sleep(250);
  }
};

const broadcastViaAdvertiser = async (token: string): Promise<boolean> => {
  if (!BLEAdvertiser?.broadcast) return false;

  const serviceUuid = normalizeDiscoveryToken(token);
  if (!isValidBleServiceUuid(serviceUuid)) {
    console.warn("[BLE] Token is not a valid service UUID for advertiser:", token);
    return false;
  }

  if (Platform.OS === "android" && BLEAdvertiser.setCompanyId) {
    BLEAdvertiser.setCompanyId(0x004c);
  } else if (Platform.OS === "ios" && BLEAdvertiser.setCompanyId) {
    BLEAdvertiser.setCompanyId(0);
    await waitForAdvertiserReady();
  }

  const options = {
    advertiseMode: 2,
    txPowerLevel: 3,
    connectable: false,
    includeDeviceName: false,
  };

  const attempts = Platform.OS === "ios" ? 8 : 2;
  for (let i = 0; i < attempts; i++) {
    try {
      await BLEAdvertiser.broadcast(serviceUuid, [], options);
      return true;
    } catch (err) {
      if (i === attempts - 1) throw err;
      await sleep(400);
    }
  }
  return false;
};

const broadcastViaPeripheral = async (token: string): Promise<boolean> => {
  if (!BLEPeripheral?.addService || !BLEPeripheral?.start) return false;

  const serviceUuid = normalizeDiscoveryToken(token);
  if (!isValidBleServiceUuid(serviceUuid)) {
    console.warn("[BLE] Token is not a valid service UUID for peripheral:", token);
    return false;
  }

  BLEPeripheral.stop?.();
  BLEPeripheral.addService(serviceUuid, true);

  const attempts = Platform.OS === "ios" ? 10 : 3;
  for (let i = 0; i < attempts; i++) {
    try {
      await BLEPeripheral.start();
      return true;
    } catch (err) {
      if (i === attempts - 1) throw err;
      await sleep(500);
    }
  }
  return false;
};

export const startDiscoveryAdvertising = async (
  token: string,
): Promise<boolean> => {
  if (BLEAdvertiser?.broadcast) {
    try {
      if (await broadcastViaAdvertiser(token)) return true;
    } catch (err) {
      console.warn("[BLE] Advertiser module failed:", err);
    }
  }

  if (BLEPeripheral?.start) {
    try {
      if (await broadcastViaPeripheral(token)) return true;
    } catch (err) {
      console.warn("[BLE] Peripheral module failed:", err);
    }
  }

  return false;
};

export const stopDiscoveryAdvertising = async () => {
  if (BLEAdvertiser?.stopBroadcast) {
    await BLEAdvertiser.stopBroadcast().catch(() => {});
  }
  BLEPeripheral?.stop?.();
};

export const bleAdvertisingErrorMessage = (status: BleNativeStatus): string => {
  if (!status.advertiser && !status.peripheral) {
    return "Bluetooth advertising needs a native build. Run: npx expo run:ios (not Expo Go), then reopen the app.";
  }
  return "Could not start Bluetooth advertising. Check Bluetooth is on and try again.";
};
