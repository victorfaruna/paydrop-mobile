import QRCode from "react-native-qrcode-svg";

interface PayDropQRCodeProps {
  value: string;
  size?: number;
}

/** QR tuned for phone-to-phone scanning (high error correction + quiet zone). */
export default function PayDropQRCode({ value, size = 260 }: PayDropQRCodeProps) {
  return (
    <QRCode
      value={value}
      size={size}
      backgroundColor="white"
      color="black"
      ecl="H"
      quietZone={12}
    />
  );
}
