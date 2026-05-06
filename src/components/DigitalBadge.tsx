'use client';

import { QRCodeCanvas } from 'qrcode.react';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { translations, Language } from '@/lib/translations';
import { ShieldCheck, User, Activity, Star, Radio, Hash, Wrench } from 'lucide-react';

interface DigitalBadgeProps {
  data: {
    name: string;
    organization: string;
    email: string;
    type: string;
    photo?: string;
    studentId?: string;
    roleArea?: string;
    phone?: string;
    scannedAt?: string;
  };
  lang: Language;
}

export default function DigitalBadge({ data, lang }: DigitalBadgeProps) {
  const t = translations[lang];
  const [badgeId, setBadgeId] = useState('');
  const [isClient, setIsClient] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    setIsClient(true);
    setBadgeId(`MTZ-2026-${Math.random().toString(36).substr(2, 6).toUpperCase()}`);
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!isClient) return null;

  const qrValue = `MTZ|${data.name}|${data.email}|${data.organization}|${data.type}|${data.phone || ''}`;
  
  const typeConfig: Record<string, { label: string, color: string, icon: React.ElementType, border: string }> = {
    'KATILIMCI': { label: t.participant, color: 'text-primary', icon: User, border: 'border-primary/40' },
    'GÖREVLİ': { label: t.official, color: 'text-red-500', icon: ShieldCheck, border: 'border-red-500/40' },
    'PROTOKOL': { label: t.protocol, color: 'text-[#FFD700]', icon: Star, border: 'border-[#FFD700]/40' },
    'BASIN': { label: t.press, color: 'text-orange-500', icon: Radio, border: 'border-orange-500/40' },
  };

  const config = typeConfig[data.type] || typeConfig['KATILIMCI'];
  const nameParts = data.name.trim().split(' ');
  const surname = nameParts.length > 1 ? nameParts.pop() : '';
  const firstNames = nameParts.join(' ');

  return (
    <motion.div initial={{ opacity: 0, scale: 0.9, rotateY: -20 }} animate={{ opacity: 1, scale: 1, rotateY: 0 }} className="w-full max-w-sm mx-auto">
      <div className={`glass-panel p-1 rounded-[2.5rem] border ${config.border} shadow-[0_0_60px_rgba(0,0,0,0.4)] overflow-hidden relative text-start`} dir={t.dir}>
        <div className="bg-[#0a0f1e]/95 rounded-[2.3rem] p-6 relative overflow-hidden">
          <div className="absolute inset-0 tech-grid opacity-10 pointer-events-none" />
          
          <div className={`absolute ${t.dir === 'rtl' ? 'right-0' : 'left-0'} top-1/4 bottom-1/4 w-1 rounded-full ${config.color.replace('text-', 'bg-')}`} />

          <div className={`flex justify-between items-start mb-6 relative z-10 ${t.dir === 'rtl' ? 'flex-row-reverse' : ''}`}>
            <div className="space-y-1 flex-1 px-2">
              <h1 className="text-sm font-black tracking-tighter leading-none text-white/90 uppercase">
                {t.title} <br/>
                <span className={`${config.color} text-lg`}>{t.year}</span>
              </h1>
              <div className="pt-2">
                <p className="text-[9px] font-bold text-white/30 uppercase tracking-[0.2em] leading-none mb-1">KURUM / ÜNİVERSİTE</p>
                <p className={`text-[12px] font-black uppercase ${config.color} tracking-tight leading-none`}>{data.organization}</p>
              </div>
            </div>

            <div className={`w-20 h-24 rounded-xl border-2 ${config.border} overflow-hidden bg-white/5 p-0.5 relative z-10 shadow-lg`}>
              {data.photo ? <img src={data.photo} alt="Profile" className="w-full h-full object-cover rounded-lg" /> : <User className={`w-8 h-8 ${config.color} opacity-40`} />}
            </div>
          </div>

          <div className="mb-6 bg-white/5 border border-white/10 rounded-xl p-2.5 flex items-center justify-between relative z-10">
            <div className="flex items-center gap-2">
              <Activity className={`w-3 h-3 ${config.color} animate-pulse`} />
              <span className="text-[9px] font-black text-white/60 uppercase">{t.security_verification}</span>
            </div>
            <span className="text-[10px] font-mono font-bold text-white tracking-widest">{currentTime.toLocaleTimeString('tr-TR')}</span>
          </div>

          <div className="space-y-4 relative z-10 mb-8">
            <div className="overflow-hidden">
              <h2 className="text-2xl font-black text-white tracking-tighter uppercase leading-none">
                {firstNames} <br/>
                <span className="font-light text-white/40">{surname}</span>
              </h2>
              {data.scannedAt && (
                <div className="mt-3 flex items-center gap-2 bg-secondary/10 border border-secondary/30 w-fit px-3 py-1 rounded-full">
                  <ShieldCheck className="w-3 h-3 text-secondary" />
                  <span className="text-secondary font-black text-[8px] uppercase">{t.verified}: {new Date(data.scannedAt).toLocaleTimeString()}</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/5 border border-white/10 p-3 rounded-xl flex items-center gap-3 overflow-hidden">
                <config.icon className={`w-4 h-4 ${config.color} flex-shrink-0`} />
                <div className="flex flex-col overflow-hidden">
                  <span className="text-[7px] text-white/40 font-bold uppercase">{t.type}</span>
                  <span className={`text-[10px] font-black uppercase ${config.color}`}>{config.label}</span>
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 p-3 rounded-xl flex items-center gap-3 overflow-hidden">
                {data.type === 'KATILIMCI' ? (
                  <>
                    <Hash className={`w-4 h-4 ${config.color} flex-shrink-0`} />
                    <div className="flex flex-col">
                      <span className="text-[7px] text-white/40 font-bold uppercase">{t.okul_no}</span>
                      <span className="text-[10px] text-white font-black">{data.studentId || 'N/A'}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <Wrench className={`w-4 h-4 ${config.color} flex-shrink-0`} />
                    <div className="flex flex-col overflow-hidden">
                      <span className="text-[7px] text-white/40 font-bold uppercase">{t.gorev_alani}</span>
                      <span className="text-[10px] text-white font-black truncate">{data.roleArea || 'SEC'}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="relative mb-6 group">
            <div className="bg-white p-3 rounded-2xl flex justify-center items-center shadow-[0_0_30px_rgba(255,255,255,0.1)] relative z-10 mx-auto w-fit">
              <QRCodeCanvas value={qrValue} size={130} level="M" includeMargin={false} fgColor="#0a0f1e" />
            </div>
          </div>

          <div className="flex justify-between items-end relative z-10 pt-3 border-t border-white/10">
            <div className="space-y-1">
              <div className="text-[8px] font-mono text-white/30 uppercase">ID: {badgeId}</div>
              <div className="flex items-center gap-1">
                <ShieldCheck className={`w-3 h-3 ${config.color}`} />
                <span className={`text-[8px] font-black tracking-widest uppercase ${config.color}`}>{t.secure_access}</span>
              </div>
            </div>
            <div className="text-[7px] font-mono text-white/20 uppercase italic">SEC_V8</div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
