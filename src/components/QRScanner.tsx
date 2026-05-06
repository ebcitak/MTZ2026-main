'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { motion, AnimatePresence } from 'framer-motion';
import { translations, Language } from '@/lib/translations';
import { X, Upload, AlertCircle, Loader2, Shield, Zap } from 'lucide-react';

interface QRScannerProps {
  onScan: (decodedText: string) => void;
  onClose: () => void;
  lang: Language;
}

export default function QRScanner({ onScan, onClose, lang }: QRScannerProps) {
  const t = translations[lang];
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const qrCodeInstance = useRef<Html5Qrcode | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startCamera = useCallback(async () => {
    if (!qrCodeInstance.current) return;
    try {
      setError(null);
      await qrCodeInstance.current.start(
        { facingMode: "environment" },
        { 
          fps: 30, 
          qrbox: { width: 280, height: 280 },
          aspectRatio: 1.0,
          disableFlip: true,
          videoConstraints: {
            width: { ideal: 720 },
            height: { ideal: 720 },
            facingMode: "environment",
            focusMode: "continuous"
          },
          experimentalFeatures: {
            useBarCodeDetectorIfSupported: true
          }
        },
        (decodedText) => {
          stopCamera();
          onScan(decodedText);
        },
        () => {}
      );
      setIsScanning(true);
    } catch {
      setError(t.camera_error);
      setIsScanning(false);
    }
  }, [onScan, t.camera_error]);

  const stopCamera = useCallback(async () => {
    if (qrCodeInstance.current && qrCodeInstance.current.isScanning) {
      try { 
        await qrCodeInstance.current.stop(); 
        setIsScanning(false); 
      } catch {}
    }
  }, []);

  useEffect(() => {
    qrCodeInstance.current = new Html5Qrcode("reader");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    startCamera();
    return () => {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      stopCamera();
    };
  }, [startCamera, stopCamera]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !qrCodeInstance.current) return;
    try {
      setIsProcessing(true);
      setError(null);
      const decodedText = await qrCodeInstance.current.scanFile(file, true);
      onScan(decodedText);
      setIsProcessing(false);
    } catch {
      setError(t.file_qr_error);
      setIsProcessing(false);
    } finally {
      if (e.target) e.target.value = '';
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a0f1e] p-4" dir={t.dir}>
      <div className="absolute inset-0 tech-grid opacity-20 pointer-events-none" />
      <div className="relative w-full max-w-lg space-y-8">
        <div className="relative aspect-square">
          <div className="bg-black border border-primary/20 rounded-[2.5rem] overflow-hidden relative h-full flex items-center justify-center">
            <div id="reader" className="w-full h-full object-cover" />
            
            {/* Visual Frame Overlay */}
            <div className="absolute inset-0 border-[40px] border-black/40 pointer-events-none z-10" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] h-[280px] pointer-events-none z-20">
              {/* Corner Brackets */}
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-lg" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-lg" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-lg" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-lg" />
              
              {/* Scanning Line Animation */}
              <motion.div 
                animate={{ top: ['0%', '100%', '0%'] }} 
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                className="absolute left-0 right-0 h-0.5 bg-primary/40 shadow-[0_0_15px_rgba(0,240,255,0.8)]"
              />
            </div>
            {isProcessing && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0a0f1e]/90 backdrop-blur-md z-40">
                <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
                <span className="text-[10px] font-black text-primary tracking-widest uppercase">{t.processing}</span>
              </div>
            )}
            <AnimatePresence>
              {error && !isProcessing && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 flex items-center justify-center bg-[#0a0f1e]/90 backdrop-blur-md p-8 text-center z-30">
                  <div className="space-y-4">
                    <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
                    <p className="text-xs font-black text-white uppercase tracking-widest leading-tight">{error}</p>
                    <button onClick={() => fileInputRef.current?.click()} className="px-6 py-2 bg-primary/20 text-primary border border-primary/30 rounded-lg text-[10px] font-black uppercase">{t.select_file}</button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="flex flex-col items-center gap-6">
          <button onClick={() => fileInputRef.current?.click()} className="w-full flex items-center justify-center gap-3 bg-white/5 border border-white/10 hover:bg-white/10 p-5 rounded-2xl transition-all group">
            <Upload className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
            <div className={`text-start ${t.dir === 'rtl' ? 'mr-3' : 'ml-3'}`}>
              <div className="text-[10px] font-black text-white uppercase tracking-widest">{t.select_file}</div>
              <div className="text-[8px] text-white/40 font-bold uppercase">{t.upload_qr}</div>
            </div>
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
          <div className="flex items-center gap-6 opacity-30">
            <div className="flex items-center gap-2"><Shield className="w-3 h-3 text-secondary" /><span className="text-[8px] font-black text-white uppercase">{t.secure}</span></div>
            <div className="flex items-center gap-2"><Zap className="w-3 h-3 text-primary" /><span className="text-[8px] font-black text-white uppercase">{t.fast}</span></div>
          </div>
        </div>
        <button onClick={onClose} className="absolute -top-12 right-0 p-3 bg-white/5 hover:bg-white/10 rounded-full border border-white/10 text-white/50 hover:text-white"><X className="w-6 h-6" /></button>
      </div>
    </motion.div>
  );
}
