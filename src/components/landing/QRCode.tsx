"use client";

import { useEffect, useRef } from 'react';
import QRCodeLib from 'qrcode';

export default function QRCode({ url }: { url: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current) {
      QRCodeLib.toCanvas(canvasRef.current, url, {
        width: 200,
        margin: 2,
        color: {
          dark: '#1e293b',
          light: '#ffffff',
        },
      });
    }
  }, [url]);

  return (
    <div className="bg-white p-4 rounded-xl shadow-lg">
      <canvas ref={canvasRef} />
      <p className="text-center text-sm text-gray-600 mt-2">
        Also available on mobile
      </p>
    </div>
  );
}