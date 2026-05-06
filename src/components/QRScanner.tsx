'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { createClient } from '@supabase/supabase-js';
import { Camera, Image as ImageIcon, StopCircle, ShieldAlert, X, ChevronLeft } from 'lucide-react';
import { translations, Language } from '@/lib/translations';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface QRScannerProps {
  onScan: (data: string) => void;
  lang: Language;
  onClose: () => void;
}

export default function QRScanner({ onScan, lang, onClose }: QRScannerProps) {
  const t = translations[lang];
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
    <div className="w-full h-full flex flex-col p-6 space-y-6 overflow-y-auto">
      {/* Header with Close Button */}
      <div className="flex items-center justify-between">
        <button onClick={onClose} className="flex items-center gap-2 text-white/60 hover:text-white transition-colors">
          <ChevronLeft className="w-5 h-5" />
          <span className="text-[10px] font-black uppercase tracking-widest">{t.back || 'Geri'}</span>
        </button>
        <div className="px-3 py-1 bg-primary/10 border border-primary/30 rounded-full">
          <p className="text-[9px] font-black text-primary uppercase tracking-[0.2em]">MTZ 2026 SCANNER</p>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center space-y-8 max-w-md mx-auto w-full">
        <div className="relative w-full aspect-square overflow-hidden rounded-[2.5rem] border-2 border-primary/30 bg-black/40 shadow-[0_0_80px_rgba(0,240,255,0.15)] group">
          <div id="reader" className="w-full h-full" />
          
          {mode === 'idle' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4 bg-[#0a0f1e]/90 backdrop-blur-md">
              <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center border border-primary/30 animate-pulse">
                <Camera className="w-12 h-12 text-primary" />
              </div>
              <div className="text-center space-y-1">
                <p className="text-[11px] font-black text-white uppercase tracking-widest">Sistem Hazır</p>
                <p className="text-[9px] font-bold text-white/40 uppercase">Kamerayı veya dosyayı seçin</p>
              </div>
            </div>
          )}

          {error && (
            <div className="absolute inset-x-6 top-6 z-50 bg-red-500/95 backdrop-blur-xl p-4 rounded-2xl flex items-center gap-3 border border-white/20 shadow-2xl animate-in fade-in zoom-in duration-300">
              <ShieldAlert className="w-6 h-6 text-white" />
              <p className="text-[11px] font-black text-white uppercase leading-tight">{error}</p>
            </div>
          )}

          {/* Corner Decorations */}
          <div className="absolute top-8 left-8 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-lg opacity-40" />
          <div className="absolute top-8 right-8 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-lg opacity-40" />
          <div className="absolute bottom-8 left-8 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-lg opacity-40" />
          <div className="absolute bottom-8 right-8 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-lg opacity-40" />
        </div>

        <div className="grid grid-cols-1 w-full gap-4">
          {mode === 'camera' ? (
            <button onClick={stopCamera} className="bg-red-500 text-white font-black py-5 rounded-[1.5rem] flex items-center justify-center gap-3 shadow-2xl shadow-red-500/20 active:scale-95 transition-all uppercase text-[12px] tracking-widest">
              <StopCircle className="w-6 h-6" /> Kamerayı Kapat
            </button>
          ) : (
            <div className="flex flex-col gap-4 w-full">
              <button onClick={startCamera} className="w-full bg-primary text-[#0a0f1e] font-black py-5 rounded-[1.5rem] flex items-center justify-center gap-3 shadow-2xl shadow-primary/20 active:scale-95 transition-all uppercase text-[12px] tracking-widest">
                <Camera className="w-6 h-6" /> Kamerayı Başlat
              </button>
              <button onClick={() => fileInputRef.current?.click()} className="w-full bg-white/5 border border-white/10 text-white font-black py-5 rounded-[1.5rem] flex items-center justify-center gap-3 hover:bg-white/10 active:scale-95 transition-all uppercase text-[12px] tracking-widest">
                <ImageIcon className="w-6 h-6 text-primary" /> Dosyadan QR Oku
              </button>
            </div>
          )}
        </div>
      </div>

      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileScan} />
      
      <div className="text-center pt-8">
        <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.5em]">T3 ANKARA GÜVENLİK SİSTEMİ</p>
      </div>
    </div>
  );
}
