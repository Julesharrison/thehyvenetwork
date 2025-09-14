import React from "react";
import QRCode from "qrcode.react";

interface QRCodeGeneratorProps {
  value: string;
}

const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({ value }) => {
  return (
    <div>
      <QRCode value={value} size={256} />
    </div>
  );
};

export default QRCodeGenerator;