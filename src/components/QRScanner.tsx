'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface QRScannerProps {
  onScan: (data: string) => void;
}

export default function QRScanner({ onScan }: QRScannerProps) {
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const qrCodeInstance = useRef<Html5Qrcode | null>(null);

  const onNewScanResult = async (decodedText: string) => {
    if (scanning) return;
    setScanning(true);

    // 1. Etkinlik Kodu Kontrolü (Eski QR'ları engeller)
    if (!decodedText.startsWith('MTZ2026|')) {
      setError('GEÇERSİZ VEYA ESKİ QR KOD!');
      setTimeout(() => { setError(null); setScanning(false); }, 3000);
      return;
    }

    const parts = decodedText.split('|');
    const email = parts[2];

    // 2. Veritabanı Kontrolü (Sahte QR'ları engeller)
    const { data: participant, error: dbError } = await supabase
      .from('participants')
      .select('*')
      .eq('email', email)
      .single();

    if (dbError || !participant) {
      setError('KAYIT BULUNAMADI! (Geçersiz Delege)');
      setTimeout(() => { setError(null); setScanning(false); }, 3000);
      return;
    }

    // Her şey tamamsa işlemi onayla
    onScan(decodedText);
    setTimeout(() => setScanning(false), 2000);
  };

  useEffect(() => {
    qrCodeInstance.current = new Html5Qrcode("reader");
    
    const config = { fps: 10, qrbox: { width: 250, height: 250 } };
    
    qrCodeInstance.current.start(
      { facingMode: "environment" },
      config,
      (decodedText) => onNewScanResult(decodedText),
      () => {}
    ).catch(() => setError("Kamera başlatılamadı"));

    return () => {
      if (qrCodeInstance.current?.isScanning) {
        qrCodeInstance.current.stop().catch(console.error);
      }
    };
  }, []);

  return (
    <div className="space-y-4">
      <div id="reader" className="overflow-hidden rounded-2xl border-2 border-primary/30 bg-black/20" />
      {error && (
        <div className="bg-red-500/20 border border-red-500 text-red-500 p-3 rounded-xl text-[10px] font-black uppercase text-center animate-pulse">
          {error}
        </div>
      )}
      <div className="text-center text-white/40 text-[9px] font-bold uppercase tracking-widest">
        QR KODU ÇERÇEVE İÇİNE ODAKLAYIN
      </div>
    </div>
  );
}
