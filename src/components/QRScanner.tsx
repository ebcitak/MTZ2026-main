'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { createClient } from '@supabase/supabase-js';
import { Camera, Image as ImageIcon, StopCircle, ShieldAlert } from 'lucide-react';

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
  const [mode, setMode] = useState<'camera' | 'idle'>('idle');
  const qrCodeInstance = useRef<Html5Qrcode | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    qrCodeInstance.current = new Html5Qrcode("reader");
    return () => {
      if (qrCodeInstance.current?.isScanning) {
        qrCodeInstance.current.stop().catch(() => {});
      }
    };
  }, []);

  const handleScanSuccess = async (decodedText: string) => {
    if (scanning) return;
    setScanning(true);

    if (!decodedText.startsWith('MTZ2026|')) {
      setError('GEÇERSİZ VEYA ESKİ QR KOD!');
      setTimeout(() => { setError(null); setScanning(false); }, 3000);
      return;
    }

    const email = decodedText.split('|')[2];
    const { data: participant } = await supabase.from('participants').select('*').eq('email', email).single();

    if (!participant) {
      setError('KAYIT BULUNAMADI!');
      setTimeout(() => { setError(null); setScanning(false); }, 3000);
      return;
    }

    onScan(decodedText);
    stopCamera();
    setTimeout(() => setScanning(false), 2000);
  };

  const startCamera = async () => {
    try {
      setMode('camera');
      setError(null);
      await qrCodeInstance.current?.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        handleScanSuccess,
        () => {}
      );
    } catch (err) {
      setError("KAMERA BAŞLATILAMADI");
      setMode('idle');
    }
  };

  const stopCamera = async () => {
    if (qrCodeInstance.current?.isScanning) {
      await qrCodeInstance.current.stop();
    }
    setMode('idle');
  };

  const handleFileScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setError(null);
      const result = await qrCodeInstance.current?.scanFile(file, true);
      if (result) handleScanSuccess(result);
    } catch (err) {
      setError("DOSYADA QR KOD BULUNAMADI");
    }
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      <div className="relative aspect-square overflow-hidden rounded-[2rem] border-2 border-primary/30 bg-black/40 shadow-2xl group">
        <div id="reader" className="w-full h-full" />
        
        {mode === 'idle' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4 bg-[#0a0f1e]/80 backdrop-blur-sm">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 animate-pulse">
              <Camera className="w-10 h-10 text-primary" />
            </div>
            <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Sistemi Başlatın</p>
          </div>
        )}

        {error && (
          <div className="absolute inset-x-4 top-4 z-50 bg-red-500/90 backdrop-blur-md p-4 rounded-2xl flex items-center gap-3 border border-white/20 shadow-2xl animate-bounce">
            <ShieldAlert className="w-5 h-5 text-white" />
            <p className="text-[10px] font-black text-white uppercase">{error}</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {mode === 'camera' ? (
          <button onClick={stopCamera} className="col-span-2 bg-red-500 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-3 shadow-lg shadow-red-500/20 active:scale-95 transition-all uppercase text-[11px]">
            <StopCircle className="w-5 h-5" /> Kamerayı Kapat
          </button>
        ) : (
          <>
            <button onClick={startCamera} className="bg-primary text-[#0a0f1e] font-black py-4 rounded-2xl flex items-center justify-center gap-3 shadow-lg shadow-primary/20 active:scale-95 transition-all uppercase text-[11px]">
              <Camera className="w-5 h-5" /> Kamerayı Aç
            </button>
            <button onClick={() => fileInputRef.current?.click()} className="bg-white/5 border border-white/10 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-3 hover:bg-white/10 active:scale-95 transition-all uppercase text-[11px]">
              <ImageIcon className="w-5 h-5" /> Dosyadan Seç
            </button>
          </>
        )}
      </div>

      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileScan} />
      
      <div className="text-center">
        <p className="text-[9px] font-bold text-white/20 uppercase tracking-[0.4em]">MTZ 2026 GÜVENLİ GEÇİŞ SİSTEMİ</p>
      </div>
    </div>
  );
}
