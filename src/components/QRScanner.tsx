'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { supabase } from '@/lib/supabase';
import { Camera, Image as ImageIcon, ShieldAlert, ChevronLeft, Maximize } from 'lucide-react';
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

  const handleScanSuccess = useCallback((decodedText: string) => {
    if (isScanning.current) return;
    
    if (decodedText.startsWith('MTZ2026|') || decodedText.startsWith('MTZ|') || decodedText.includes('@')) {
      isScanning.current = true;
      // Kütüphanenin iç işlemleri bitmeden unmount olmasını engellemek için 100ms gecikme
      setTimeout(() => {
        onScan(decodedText);
      }, 100);
      setTimeout(() => { isScanning.current = false; }, 2000);
    }
  }, [onScan]);

  const startCamera = useCallback(async () => {
    try {
      if (!qrCodeInstance.current) return;
      if (qrCodeInstance.current.isScanning) return;
      
      setError(null);
      
      const config = {
        fps: 30, // Akıcı ve hızlı yakalama
        // QRBOX'u KALDIRDIK: Bu sayede kütüphane sadece orta kareyi değil, 
        // tüm ekranı tarar. Kullanıcı kodu kutuya denk getirmek zorunda kalmaz.
        aspectRatio: 1.0,
        experimentalFeatures: {
          useBarCodeDetectorIfSupported: true // Donanımsal hızlandırmayı tam ekran tarama için geri açtık
        },
        videoConstraints: {
          facingMode: "environment",
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      };

      await qrCodeInstance.current.start(
        { facingMode: "environment" },
        config,
        handleScanSuccess,
        () => { } 
      );
    } catch (err) {
      console.error("Camera Start Error:", err);
      // Hata zaten kamera açıksa sessizce geçilebilir
    }
  }, [handleScanSuccess]);

  useEffect(() => {
    const instance = new Html5Qrcode("reader", {
      verbose: false,
      formatsToSupport: [ Html5QrcodeSupportedFormats.QR_CODE ]
    });
    qrCodeInstance.current = instance;
    
    startCamera();
    
    return () => {
      if (instance.isScanning) {
        instance.stop().catch(err => console.warn("Cleanup warning:", err));
      }
    };
  }, [startCamera]);

  return (
    <div className="w-full h-full flex flex-col p-4 md:p-6 space-y-6 bg-[#0a0f1e] relative overflow-hidden">
      {/* Üst Bar */}
      <div className="flex items-center justify-between relative z-10">
        <button onClick={onClose} className="flex items-center gap-2 text-white/60 hover:text-white transition-colors bg-white/5 px-4 py-2 rounded-xl border border-white/10 backdrop-blur-md">
          <ChevronLeft className="w-5 h-5" />
          <span className="text-[10px] font-black uppercase tracking-widest">{t.back}</span>
        </button>
        <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] glow-primary">MTZ 2026 GÜVENLİK</p>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center space-y-8 max-w-md mx-auto w-full relative">
        {/* Tarayıcı Konteynırı */}
        <div className="relative w-full aspect-square overflow-hidden rounded-[3rem] border-2 border-white/10 bg-black/40 shadow-2xl">
          <div id="reader" className="w-full h-full scale-[1.02]" /> {/* Kenar boşluklarını kapatmak için hafif scale */}
          
          {/* GÖRSEL TARAMA REHBERİ (Logic'ten bağımsız, sadece kullanıcıya hedef göstermek için) */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="w-64 h-64 border-2 border-primary/50 rounded-[2rem] relative">
              {/* Köşe İşaretleri */}
              <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-xl" />
              <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-xl" />
              <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-xl" />
              <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-xl" />
              
              {/* Tarama Çizgisi Animasyonu */}
              <div className="absolute inset-x-4 top-0 h-0.5 bg-primary shadow-[0_0_15px_#00f0ff] animate-scan-line opacity-50" />
            </div>
            
            {/* Alt Bilgi */}
            <div className="absolute bottom-10 text-center">
              <p className="text-[8px] font-black text-white/40 uppercase tracking-widest bg-black/40 px-4 py-2 rounded-full backdrop-blur-sm border border-white/5">
                KODU ÇERÇEVE İÇİNE ODAKLAYIN
              </p>
            </div>
          </div>

          {error && (
            <div className="absolute inset-x-6 top-6 z-50 bg-red-500/90 backdrop-blur-md p-4 rounded-2xl flex items-center gap-3 border border-white/20 animate-shake">
              <ShieldAlert className="w-6 h-6 text-white" />
              <p className="text-[11px] font-black text-white uppercase">{error}</p>
            </div>
          )}
        </div>

        <div className="w-full space-y-3">
          <button 
            onClick={async () => {
              if (qrCodeInstance.current?.isScanning) {
                await qrCodeInstance.current.stop();
              }
              fileInputRef.current?.click();
            }} 
            className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white font-black py-5 rounded-[2rem] uppercase text-[12px] tracking-widest flex items-center justify-center gap-3 transition-all backdrop-blur-xl group"
          >
            <ImageIcon className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" /> 
            GALERİDEN QR SEÇ
          </button>
          <p className="text-center text-[9px] text-white/20 font-bold uppercase tracking-tighter">
            KAMERA ODAKLAMIYORSA GALERİDEN FOTOĞRAF YÜKLEYEBİLİRSİNİZ
          </p>
        </div>
      </div>

      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={async (e) => {
        const file = e.target.files?.[0];
        if (file && qrCodeInstance.current) {
          try {
            const decodedText = await qrCodeInstance.current.scanFile(file, true);
            handleScanSuccess(decodedText);
          } catch (err) {
            setError("GÖRSELDE GEÇERLİ BİR QR KOD BULUNAMADI");
            // Başarısız olursa kamerayı tekrar aç
            startCamera();
          }
        } else {
          // Seçim iptal edildiyse kamerayı tekrar aç
          startCamera();
        }
      }} />

      {/* Arka Plan Dekorasyon */}
      <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-primary/10 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute -top-24 -left-24 w-64 h-64 bg-secondary/10 blur-[100px] rounded-full pointer-events-none" />
    </div>
  );
}
