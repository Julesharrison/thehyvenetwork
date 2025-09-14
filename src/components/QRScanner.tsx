import React from "react";
import { Scanner } from "@yudiel/react-qr-scanner";

interface QRScannerProps {
  onScan: (data: string) => void;
}

const QRScanner: React.FC<QRScannerProps> = ({ onScan }) => {
  return (
    <div style={{ width: "300px" }}>
      <Scanner
        onScan={(result) => onScan(result[0]?.rawValue || '')}
        onError={(error) => console.error(error)}
      />
    </div>
  );
};

export default QRScanner;
