'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import RegisterForm from '@/components/RegisterForm';
import QRScanner from '@/components/QRScanner';
import DigitalBadge from '@/components/DigitalBadge';
import Partners from '@/components/Partners';
import Organizers from '@/components/Organizers';
import { translations, Language } from '@/lib/translations';
import {
  Scan, UserPlus, ShieldAlert, Cpu, ShieldCheck,
  Lock, LayoutDashboard,
  Users, LogIn, TrendingUp, Search, CheckCircle2, AlertTriangle, Database, Trash2,
  Mail, Send, Loader2
} from 'lucide-react';
import BulkImport from '@/components/BulkImport';
import QRCode from 'qrcode';
import { supabase } from '@/lib/supabase';

interface Participant {
  id: number;
  name: string;
  email: string;
  organization: string;
  type: string;
  status: 'INSIDE' | 'OUTSIDE';
  entry_time?: string;
  phone?: string;
  photo?: string | null;
  email_sent?: boolean;
}

interface Log {
  id: number;
  participant_id: number;
  name: string;
  time: string;
  action: 'ENTRY' | 'EXIT';
  created_at: string;
}

export default function Home() {
  const [lang, setLang] = useState<Language>('tr');
  const [view, setView] = useState<'landing' | 'register' | 'login' | 'admin' | 'scan' | 'badge'>('landing');
  const [userData, setUserData] = useState<Participant | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isClient, setIsClient] = useState(false);
  const [scanResult, setScanResult] = useState<{ status: 'success' | 'error', message: string } | null>(null);
  const isProcessingScan = useRef(false);
  const lastScannedRef = useRef<{ email: string, time: number } | null>(null);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [isSendingEmails, setIsSendingEmails] = useState(false);
  const [emailProgress, setEmailProgress] = useState({ current: 0, total: 0 });
  const [selectedParticipants, setSelectedParticipants] = useState<number[]>([]);

  const t = translations[lang];
  const OFFICIAL_AUTH = { username: "admin", password: "mtz2026" };

  const stats = useMemo(() => {
    const total = participants?.length || 0;
    const inside = participants?.filter(p => p.status === 'INSIDE').length || 0;
    const emailSent = participants?.filter(p => p.email_sent).length || 0;
    const occupancy = total > 0 ? Math.round((inside / total) * 100) : 0;
    return { total, inside, emailSent, occupancy };
  }, [participants]);

  const filteredParticipants = useMemo(() => {
    if (!participants) return [];
    return participants.filter(p => {
      const nameMatch = p.name?.toLowerCase().includes(searchTerm.toLowerCase());
      const emailMatch = p.email?.toLowerCase().includes(searchTerm.toLowerCase());
      const orgMatch = p.organization?.toLowerCase().includes(searchTerm.toLowerCase());
      return nameMatch || emailMatch || orgMatch;
    });
  }, [participants, searchTerm]);

  const fetchLogs = useCallback(async () => {
    const { data: lData } = await supabase.from('logs').select('*').order('time', { ascending: false });
    if (lData) setLogs(lData as any);
  }, []);

  const fetchInitialData = useCallback(async () => {
    const { data: pData } = await supabase.from('participants').select('*').order('created_at', { ascending: false });
    if (pData) setParticipants(pData as any);
    fetchLogs();
  }, [fetchLogs]);

  useEffect(() => {
    setIsClient(true);
    fetchInitialData();

    // REAL-TIME SUBSCRIPTION
    const participantsChannel = supabase.channel('participants_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'participants' }, () => {
        fetchInitialData();
      })
      .subscribe();

    const logsChannel = supabase.channel('logs_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'logs' }, () => {
        fetchLogs();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(participantsChannel);
      supabase.removeChannel(logsChannel);
    };
  }, [fetchInitialData, fetchLogs]);

  const handleRegisterSuccess = async (data: Omit<Participant, 'id' | 'status'>) => {
    const { data: existing } = await supabase.from('participants').select('id').eq('email', data.email).single();
    if (existing) {
      alert(t.not_found);
      return;
    }

    const { error } = await supabase.from('participants').insert([{
      name: data.name,
      email: data.email,
      organization: data.organization,
      type: data.type,
      phone: data.phone,
      photo: data.photo,
      status: 'OUTSIDE'
    }]);

    if (!error) {
      fetchInitialData();
      setUserData({ ...data, id: 0, status: 'OUTSIDE' }); // Set local user data for badge
      setView('badge'); // Show the badge to the participant
    } else {
      alert(`Kayıt hatası: ${error.message}`);
    }
  };

  const deleteParticipant = async (id: number) => {
    if (window.confirm("Silmek istediğinize emin misiniz?")) {
      await supabase.from('participants').delete().eq('id', id);
    }
  };

  const downloadBackup = () => {
    const backupData = { participants, logs, exportDate: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `MTZ_BACKUP_${new Date().toLocaleDateString()}.json`;
    a.click();
  };

  const handleScanSuccess = async (decodedText: string) => {
    if (isProcessingScan.current) return;
    isProcessingScan.current = true;

    try {
      let participantData: any = null;

      if (decodedText.startsWith('MTZ|')) {
        const parts = decodedText.split('|');
        participantData = { name: parts[1], email: parts[2], organization: parts[3], type: parts[4], phone: parts[5] };
      } else {
        try {
          const parsed = JSON.parse(decodedText);
          participantData = {
            name: parsed.n || parsed.name,
            email: parsed.e || parsed.email,
            organization: parsed.o || parsed.organization,
            type: parsed.t || parsed.type || 'KATILIMCI',
            phone: parsed.p || parsed.phone
          };
        } catch {
          if (decodedText.includes('@')) participantData = { email: decodedText };
        }
      }

      if (!participantData || !participantData.email) {
        setScanResult({ status: 'error', message: t.qr_error });
        isProcessingScan.current = false;
        return;
      }

      const email = participantData.email;
      const now = Date.now();

      if (lastScannedRef.current?.email === email && (now - lastScannedRef.current!.time) < 3000) {
        return;
      }
      lastScannedRef.current = { email, time: now };

      // Check DB for participant
      const { data: p, error: pErr } = await supabase.from('participants').select('*').eq('email', email).single();

      if (p) {
        if (p.status === 'INSIDE') {
          setScanResult({ status: 'error', message: t.already_inside });
          isProcessingScan.current = false;
          return;
        }

        const timestamp = new Date().toISOString();
        // Update Status
        await supabase.from('participants').update({ status: 'INSIDE', entry_time: timestamp }).eq('id', p.id);
        // Add Log
        await supabase.from('logs').insert([{ participant_id: p.id, name: p.name, time: timestamp, action: 'ENTRY' }]);

        setScanResult({ status: 'success', message: `${t.entry_success}, ${p.name}` });
      } else {
        // Hybrid Walk-in
        const { data: newP, error: insErr } = await supabase.from('participants').insert([{
          name: participantData.name || "Yeni Kayıt",
          email: participantData.email,
          organization: participantData.organization || "",
          type: participantData.type || "KATILIMCI",
          status: 'INSIDE',
          entry_time: new Date().toISOString()
        }]).select().single();

        if (newP) {
          await supabase.from('logs').insert([{ 
            participant_id: newP.id, 
            name: newP.name, 
            time: newP.entry_time || new Date().toISOString(), 
            action: 'ENTRY' 
          }]);
          setScanResult({ status: 'success', message: `${t.entry_success}, ${newP.name} (Anlık Kayıt)` });
        }
      }

      setTimeout(() => {
        setScanResult(null);
        setView('admin');
        isProcessingScan.current = false;
      }, 2000);
    } catch (e) {
      console.error('Scan Error:', e);
      setScanResult({ status: 'error', message: t.qr_error });
      setTimeout(() => { isProcessingScan.current = false; }, 1000);
    }
  };

  const handleBulkImport = async (data: any[]) => {
    const { error } = await supabase.from('participants').insert(
      data.map(p => ({
        name: p.name,
        email: p.email,
        organization: p.organization,
        type: p.type || 'KATILIMCI',
        phone: p.phone,
        status: 'OUTSIDE'
      }))
    );
    if (!error) {
      fetchInitialData();
    } else {
      alert(`Hata: ${error.message}`);
    }
  };

  const sendBulkEmails = async () => {
    const unsentParticipants = participants.filter(p => !p.email_sent);
    if (unsentParticipants.length === 0) {
      alert("Tüm katılımcılara mail gönderilmiş.");
      return;
    }

    if (!window.confirm(`${unsentParticipants.length} katılımcıya QR kodları gönderilecek. Emin misiniz?`)) return;

    setIsSendingEmails(true);
    setEmailProgress({ current: 0, total: unsentParticipants.length });

    for (let i = 0; i < unsentParticipants.length; i++) {
      const p = unsentParticipants[i];
      try {
        // Rich QR data containing all relevant info
        const richData = {
          n: p.name,
          e: p.email,
          o: p.organization,
          t: p.type,
          p: p.phone,
          v: "MTZ2026"
        };
        const qrCodeData = await QRCode.toDataURL(JSON.stringify(richData));

        const res = await fetch('/api/send-qr', {
          method: 'POST',
          body: JSON.stringify({
            name: p.name,
            email: p.email,
            qrCodeData,
            organization: p.organization
          }),
        });

        if (res.ok) {
          await supabase.from('participants').update({ email_sent: true }).eq('id', p.id);
        }
      } catch (error) {
        console.error(`Email error for ${p.email}:`, error);
      }
      setEmailProgress(prev => ({ ...prev, current: i + 1 }));
    }

    setIsSendingEmails(false);
    alert("İşlem tamamlandı.");
  };

  const toggleSelect = (id: number) => {
    setSelectedParticipants(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedParticipants.length === filteredParticipants.length) {
      setSelectedParticipants([]);
    } else {
      setSelectedParticipants(filteredParticipants.map(p => p.id));
    }
  };

  const deleteSelected = async () => {
    if (selectedParticipants.length === 0) return;
    if (window.confirm(`${selectedParticipants.length} kişiyi silmek istediğinize emin misiniz?`)) {
      await supabase.from('participants').delete().in('id', selectedParticipants);
      setSelectedParticipants([]);
    }
  };

  const deleteAll = async () => {
    if (window.confirm("TÜM veritabanını silmek istediğinize emin misiniz? Bu işlem geri alınamaz!")) {
      await supabase.from('logs').delete().neq('id', 0); // Clear all logs
      await supabase.from('participants').delete().neq('id', 0); // Clear all participants
      setSelectedParticipants([]);
    }
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginData.username === OFFICIAL_AUTH.username && loginData.password === OFFICIAL_AUTH.password) {
      setLoginError(false);
      setView('admin');
      setLoginData({ username: '', password: '' });
    } else {
      setLoginError(true);
    }
  };

  if (!isClient) return null;

  return (
    <>
      {/* LANGUAGE SELECTOR - ABSOLUTE POSITION OUTSIDE ALL WRAPPERS */}
      {view === 'landing' && (
        <div className="fixed top-4 right-4 md:top-8 md:right-8 z-[9999]">
          <div className="glass-panel p-1.5 rounded-xl border-white/10 flex gap-0.5">
            {(['tr', 'en', 'ar'] as Language[]).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`px-3 py-1.5 rounded-lg text-[9px] font-black transition-all ${lang === l ? 'bg-primary text-[#0a0f1e]' : 'text-white/40 hover:text-white'}`}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      )}

      <main dir={t.dir} className={`min-h-screen flex flex-col items-center justify-center p-4 md:p-6 relative overflow-y-auto ${t.dir === 'rtl' ? 'font-arabic' : ''}`}>

        <AnimatePresence mode="wait">
          {view === 'landing' && (
            <motion.div key="landing" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="text-center z-10 w-full max-w-4xl space-y-12">
              <div className="space-y-6">
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="mx-auto flex flex-col items-center gap-12"
                >
                  <motion.div
                    animate={{
                      scale: [1, 1.05, 1],
                      filter: [
                        'drop-shadow(0 0 20px rgba(0,240,255,0.2))',
                        'drop-shadow(0 0 50px rgba(0,240,255,0.5))',
                        'drop-shadow(0 0 20px rgba(0,240,255,0.2))'
                      ]
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    className="relative"
                  >
                    <img src="/logos/mtz.png" alt="MTZ 2026" className="h-48 md:h-64 w-auto brightness-200 relative z-10" />
                    <div className="absolute inset-0 bg-primary/20 blur-[100px] animate-pulse" />
                  </motion.div>

                  <h1 className="text-5xl md:text-9xl font-black tracking-tighter uppercase leading-[0.85] text-white">
                    {t.title} <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-primary bg-[length:200%_auto] animate-gradient-x">{t.year}</span>
                  </h1>
                </motion.div>
                <div className="mx-auto w-20 h-20 mb-4 relative flex items-center justify-center bg-primary/10 rounded-xl border border-primary/30 glow-primary">
                  <Cpu className="w-10 h-10 text-primary" />
                </div>
              </div>
              <div className="flex flex-col md:flex-row gap-6 justify-center items-center">
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setView('register')} className="group relative w-full md:w-64 px-8 py-5 bg-primary text-[#0a0f1e] font-black rounded-xl flex items-center justify-center gap-3 glow-primary btn-tech shadow-xl">
                  <UserPlus className="w-5 h-5" />
                  <span>{t.participant_registration}</span>
                </motion.button>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setView('login')} className="group relative w-full md:w-64 px-8 py-5 bg-white/5 border border-white/10 text-white font-black rounded-xl flex items-center justify-center gap-3 backdrop-blur-xl hover:bg-white/10 transition-all">
                  <Lock className="w-5 h-5 text-secondary glow-secondary" />
                  <span>{t.official_login}</span>
                </motion.button>
              </div>

              <div className="pt-12">
                <Organizers />
                <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] mb-4 mt-8">{t.strategic_partners}</p>
                <Partners />
              </div>
            </motion.div>
          )}

          {view === 'login' && (
            <motion.div key="login" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm glass-panel p-8 rounded-2xl border border-secondary/30">
              <div className="text-center space-y-6">
                <div className="mx-auto w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center border border-secondary/30 glow-secondary">
                  <ShieldCheck className="w-8 h-8 text-secondary" />
                </div>
                <h2 className="text-xl font-black text-white uppercase tracking-tighter">{t.system_access}</h2>
                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <input required type="text" placeholder={t.username} className="w-full bg-white/5 border border-white/10 rounded-lg py-3.5 px-4 text-sm text-white outline-none focus:border-secondary/50" value={loginData.username} onChange={(e) => setLoginData({ ...loginData, username: e.target.value })} />
                  <input required type="password" placeholder={t.password} className="w-full bg-white/5 border border-white/10 rounded-lg py-3.5 px-4 text-sm text-white outline-none focus:border-secondary/50" value={loginData.password} onChange={(e) => setLoginData({ ...loginData, password: e.target.value })} />
                  {loginError && <p className="text-red-500 text-[10px] font-black uppercase">ERROR!</p>}
                  <button type="submit" className="w-full bg-secondary text-[#0a0f1e] font-black py-4 rounded-xl glow-secondary btn-tech">{t.login}</button>
                  <button type="button" onClick={() => setView('landing')} className="w-full text-white/40 text-[10px] uppercase">{t.cancel}</button>
                </form>
              </div>
            </motion.div>
          )}

          {view === 'admin' && (
            <motion.div key="admin" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full max-w-6xl space-y-6 z-10 pb-20">
              <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/10 backdrop-blur-md">
                <div className="flex items-center gap-4">
                  <LayoutDashboard className="w-6 h-6 text-primary" />
                  <h2 className="text-xl font-black text-white uppercase tracking-tighter">{t.admin_panel}</h2>
                </div>
                <div className="flex flex-wrap gap-2 justify-center md:justify-end">
                  {selectedParticipants.length > 0 && (
                    <button onClick={deleteSelected} className="px-3 py-2 bg-red-500/20 text-red-500 border border-red-500/30 rounded-lg text-[9px] font-black uppercase flex items-center gap-2">
                      <Trash2 className="w-3.5 h-3.5" /> <span className="hidden sm:inline">({selectedParticipants.length})</span>
                    </button>
                  )}
                  <button onClick={() => setShowBulkImport(true)} className="px-3 py-2 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-lg text-[9px] font-black uppercase flex items-center gap-2">
                    <Database className="w-3.5 h-3.5" /> <span className="hidden sm:inline">{lang === 'tr' ? 'AKTAR' : 'IMPORT'}</span>
                  </button>
                  <button
                    disabled={isSendingEmails}
                    onClick={sendBulkEmails}
                    className="px-3 py-2 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-lg text-[9px] font-black uppercase flex items-center gap-2 disabled:opacity-50"
                  >
                    {isSendingEmails ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    <span className="hidden sm:inline">{isSendingEmails ? `${emailProgress.current}/${emailProgress.total}` : (lang === 'tr' ? 'QR GÖNDER' : 'SEND QR')}</span>
                  </button>
                  <button onClick={() => setView('scan')} className="px-3 py-2 bg-secondary/20 text-secondary border border-secondary/30 rounded-lg text-[9px] font-black uppercase flex items-center gap-2">
                    <Scan className="w-3.5 h-3.5" /> <span className="hidden sm:inline">{t.scan_card}</span>
                  </button>
                  <button onClick={() => setView('landing')} className="px-3 py-2 bg-white/10 text-white rounded-lg text-[9px] font-black uppercase">{t.logout}</button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                <div className="glass-panel p-4 md:p-6 rounded-xl border-primary/20">
                  <Users className="w-4 h-4 text-primary mb-2" />
                  <div className="text-[8px] md:text-[10px] text-white/40 font-bold uppercase">{t.total_records}</div>
                  <div className="text-2xl md:text-4xl font-black text-white">{stats.total}</div>
                </div>
                <div className="glass-panel p-4 md:p-6 rounded-xl border-secondary/20">
                  <LogIn className="w-4 h-4 text-secondary mb-2" />
                  <div className="text-[8px] md:text-[10px] text-white/40 font-bold uppercase">{t.inside}</div>
                  <div className="text-2xl md:text-4xl font-black text-white">{stats.inside}</div>
                </div>
                <div className="glass-panel p-4 md:p-6 rounded-xl border-yellow-400/20 col-span-2 md:col-span-1">
                  <TrendingUp className="w-4 h-4 text-yellow-400 mb-2" />
                  <div className="text-[8px] md:text-[10px] text-white/40 font-bold uppercase">{t.occupancy}</div>
                  <div className="text-2xl md:text-4xl font-black text-white">%{stats.occupancy}</div>
                </div>
              </div>

              <div className="glass-panel rounded-2xl overflow-hidden">
                <div className="p-4 border-b border-white/10 flex justify-between items-center">
                  <h3 className="text-sm font-black text-white uppercase">{t.database}</h3>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <input type="text" placeholder={t.search} className="bg-white/5 border border-white/10 rounded-lg py-1.5 pl-9 pr-4 text-xs text-white outline-none focus:border-primary/50" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-white/5 text-[10px] text-white/40 font-black uppercase">
                      <tr>
                        <th className="p-4 w-10">
                          <input
                            type="checkbox"
                            className="accent-primary"
                            checked={filteredParticipants.length > 0 && selectedParticipants.length === filteredParticipants.length}
                            onChange={toggleSelectAll}
                          />
                        </th>
                        <th className="p-4">{t.name_org}</th>
                        <th className="p-4">{t.type}</th>
                        <th className="p-4">{t.status}</th>
                        <th className="p-4">{lang === 'tr' ? 'E-POSTA' : 'EMAIL'}</th>
                        <th className="p-4">{t.entry_time}</th>
                        <th className="p-4">{t.action}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {filteredParticipants.map(p => (
                        <tr key={p.id} className={`hover:bg-white/5 transition-colors ${selectedParticipants.includes(p.id) ? 'bg-primary/5' : ''}`}>
                          <td className="p-4 text-center">
                            <input
                              type="checkbox"
                              className="accent-primary"
                              checked={selectedParticipants.includes(p.id)}
                              onChange={() => toggleSelect(p.id)}
                            />
                          </td>
                          <td className="p-4">
                            <div className="font-bold text-white text-sm">{p.name}</div>
                            <div className="text-[10px] text-white/40">{p.organization}</div>
                          </td>
                          <td className="p-4 text-[10px] font-black text-white/60">{p.type}</td>
                          <td className="p-4">
                            <span className={`px-2 py-1 rounded text-[8px] font-black uppercase ${p.status === 'INSIDE' ? 'bg-secondary/20 text-secondary' : 'bg-white/5 text-white/20'}`}>
                              {p.status === 'INSIDE' ? t.inside_status : t.outside_status}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              {p.email_sent ? (
                                <CheckCircle2 className="w-4 h-4 text-secondary glow-secondary shrink-0" />
                              ) : (
                                <Mail className="w-4 h-4 text-white/20 shrink-0" />
                              )}
                              <span className="text-[10px] text-white/60 font-mono">{p.email}</span>
                            </div>
                          </td>
                          <td className="p-4 text-[10px] text-white/40">{p.entry_time ? new Date(p.entry_time).toLocaleTimeString() : '--:--'}</td>
                          <td className="p-4">
                            <button onClick={() => deleteParticipant(p.id)} className="p-2 hover:bg-red-500/20 text-red-500 rounded-lg transition-all"><Trash2 className="w-4 h-4" /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {view === 'scan' && (
            <div className="fixed inset-0 z-[60] bg-[#0a0f1e]">
              <QRScanner lang={lang} onScan={handleScanSuccess} onClose={() => { setView('admin'); setScanResult(null); }} />
              <AnimatePresence>
                {scanResult && (
                  <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[70] p-8 rounded-[2rem] border-2 backdrop-blur-3xl text-center space-y-6 shadow-[0_0_100px_rgba(0,0,0,0.5)] min-w-[320px] ${scanResult.status === 'success' ? 'bg-[#00ff41]/10 border-[#00ff41]/40 text-[#00ff41]' : 'bg-red-500/10 border-red-500/40 text-red-500'}`}>
                    {scanResult.status === 'success' ? <div className="mx-auto w-20 h-20 bg-[#00ff41]/20 rounded-full flex items-center justify-center glow-secondary border border-[#00ff41]/30"><CheckCircle2 className="w-10 h-10" /></div> : <div className="mx-auto w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center border border-red-500/30"><AlertTriangle className="w-10 h-10" /></div>}
                    <div className="space-y-2 relative z-10"><h3 className="text-2xl font-black uppercase tracking-tighter">{scanResult.status === 'success' ? t.access_granted : t.access_denied}</h3><p className="text-sm font-bold opacity-80 leading-tight px-4">{scanResult.message}</p></div>
                    <button onClick={() => setScanResult(null)} className={`w-full py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${scanResult.status === 'success' ? 'bg-[#00ff41] text-[#0a0f1e]' : 'bg-red-500 text-white'}`}>OK</button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {view === 'register' && (
            <div key="register" className="w-full flex flex-col items-center gap-8">
              <RegisterForm lang={lang} onSuccess={handleRegisterSuccess} />
              <button onClick={() => setView('landing')} className="text-white/40 text-[10px] font-black uppercase">{t.cancel}</button>
            </div>
          )}

          {view === 'badge' && userData && (
            <div key="badge" className="w-full flex flex-col items-center gap-8">
              <DigitalBadge lang={lang} data={userData} />
              <button onClick={() => setView('landing')} className="px-8 py-4 bg-white/5 text-white rounded-xl text-[10px] font-black uppercase">{t.home}</button>
            </div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showBulkImport && (
            <BulkImport lang={lang} onImport={handleBulkImport} onClose={() => setShowBulkImport(false)} />
          )}
        </AnimatePresence>
      </main>
    </>
  );
}
