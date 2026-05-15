declare module 'react-native-ble-peripheral' {
  const BlePeripheral: {
    addService: (uuid: string, primary: boolean) => void;
    addCharacteristicToService: (
      serviceUuid: string,
      uuid: string,
      permissions: number,
      properties: number,
      data: string
    ) => void;
    startAdvertising: (deviceName: string, serviceUuid: string) => Promise<void>;
    stopAdvertising: () => void;
    setName: (name: string) => void;
    [key: string]: any;
  };
  export default BlePeripheral;
}
