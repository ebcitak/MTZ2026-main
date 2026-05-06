'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { supabase } from '@/lib/supabase';
import { Camera, Image as ImageIcon, ShieldAlert, ChevronLeft } from 'lucide-react';
import { translations, Language } from '@/lib/translations';

interface QRScannerProps {
  onScan: (data: string) => void;
  lang: Language;
  onClose: () => void;
}

export default function QRScanner({ onScan, lang, onClose }: QRScannerProps) {
  const t = translations[lang];
  const [error, setError] = useState<string | null>(null);
  const qrCodeInstance = useRef<Html5Qrcode | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isScanning = useRef(false);

  const handleScanSuccess = useCallback(async (decodedText: string) => {
    if (isScanning.current) return;
    isScanning.current = true;

    let email = '';
    if (decodedText.startsWith('MTZ2026|')) {
      email = decodedText.split('|')[2];
    } else if (decodedText.startsWith('{')) {
      try {
        const data = JSON.parse(decodedText);
        email = data.email || data.e;
      } catch (e) {}
    }

    const cleanEmail = email?.trim().toLowerCase();
    if (!cleanEmail) {
      isScanning.current = false;
      return;
    }

    const { data: participant } = await supabase
      .from('participants')
      .select('*')
      .ilike('email', cleanEmail)
      .single();

    if (!participant) {
      setError(`KAYIT BULUNAMADI!`);
      setTimeout(() => { setError(null); isScanning.current = false; }, 3000);
      return;
    }

    onScan(decodedText);
    setTimeout(() => { isScanning.current = false; }, 2000);
  }, [onScan]);

  const startCamera = useCallback(async () => {
    try {
      if (qrCodeInstance.current?.isScanning) return;
      setError(null);
      await qrCodeInstance.current?.start(
        { facingMode: "environment" },
        { fps: 20, qrbox: { width: 280, height: 280 } },
        handleScanSuccess,
        () => {}
      );
    } catch (err) {
      setError("KAMERA BAŞLATILAMADI");
    }
  }, [handleScanSuccess]);

  useEffect(() => {
    qrCodeInstance.current = new Html5Qrcode("reader");
    startCamera();
    return () => {
      if (qrCodeInstance.current?.isScanning) {
        qrCodeInstance.current.stop().catch(() => {});
      }
    };
  }, [startCamera]);

  return (
    <div className="w-full h-full flex flex-col p-6 space-y-6 bg-[#0a0f1e]">
      <div className="flex items-center justify-between">
        <button onClick={onClose} className="flex items-center gap-2 text-white/60">
          <ChevronLeft className="w-5 h-5" />
          <span className="text-[10px] font-black uppercase tracking-widest">{t.back}</span>
        </button>
        <p className="text-[9px] font-black text-primary uppercase tracking-[0.2em]">MTZ 2026</p>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center space-y-8 max-w-md mx-auto w-full">
        <div className="relative w-full aspect-square overflow-hidden rounded-[2.5rem] border-2 border-primary/30 bg-black/40">
          <div id="reader" className="w-full h-full" />
          {error && (
            <div className="absolute inset-x-6 top-6 z-50 bg-red-500 p-4 rounded-2xl flex items-center gap-3">
              <ShieldAlert className="w-6 h-6 text-white" />
              <p className="text-[11px] font-black text-white uppercase">{error}</p>
            </div>
          )}
        </div>

        <button onClick={() => fileInputRef.current?.click()} className="w-full bg-white/5 border border-white/10 text-white font-black py-5 rounded-[1.5rem] uppercase text-[12px] tracking-widest flex items-center justify-center gap-2">
          <ImageIcon className="w-5 h-5 text-primary" /> GALERİDEN SEÇ
        </button>
      </div>
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => {
        const file = e.target.files?.[0];
        if (file) qrCodeInstance.current?.scanFile(file, true).then(handleScanSuccess).catch(() => setError("QR BULUNAMADI"));
      }} />
    </div>
  );
}
