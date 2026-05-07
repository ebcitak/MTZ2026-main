'use client';

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { translations, Language } from '@/lib/translations';
import { User, ArrowRight, ShieldCheck, Camera, Star, Radio } from 'lucide-react';

interface RegisterFormProps {
  onSuccess: (data: Omit<Participant, 'id' | 'status'>) => void;
  lang: Language;
}

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

export default function RegisterForm({ onSuccess, lang }: RegisterFormProps) {
  const t = translations[lang];
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    organization: '',
    studentId: '',
    roleArea: '',
    phone: '',
    type: 'KATILIMCI',
    photo: '' as string | null
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    console.log("Form verisi:", formData);
    return true; 
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setFormData({ ...formData, photo: reader.result as string });
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) onSuccess(formData);
  };

  const participantTypes = [
    { id: 'KATILIMCI', label: t.participant, icon: User },
    { id: 'AKADEMİSYEN', label: t.official, icon: ShieldCheck },
    { id: 'DENEYAP', label: t.protocol, icon: Star },
    { id: 'LİSE', label: t.press, icon: Radio },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-2xl mx-auto glass-panel p-8 rounded-3xl border border-primary/20 shadow-2xl relative">
      <div className={`flex flex-col md:flex-row gap-8 ${t.dir === 'rtl' ? 'md:flex-row-reverse' : ''}`}>
        <div className="flex flex-col items-center space-y-4 min-w-[140px]">
          <div onClick={() => fileInputRef.current?.click()} className={`w-32 h-40 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden relative group ${formData.photo ? 'border-primary/50' : 'border-white/10 hover:border-primary/30'}`}>
            {formData.photo ? (
              <img src={formData.photo} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <div className="text-center p-4">
                <Camera className="w-8 h-8 text-white/20 mx-auto mb-2" />
                <span className="text-[8px] font-black text-white/40 uppercase">{t.vesikalik_yukle}</span>
                <span className="text-[6px] font-black text-white/20 uppercase mt-1">(OPSİYONEL)</span>
              </div>
            )}
          </div>
          {errors.photo && <p className="text-red-500 text-[8px] font-black uppercase text-center">{errors.photo}</p>}
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
        </div>

        <div className="flex-1 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-3 text-start">
              <label className="text-[10px] font-black text-primary uppercase tracking-widest">{t.delege_type}</label>
              <div className="grid grid-cols-2 gap-2">
                {participantTypes.map((type) => (
                  <button key={type.id} type="button" onClick={() => setFormData({...formData, type: type.id})} className={`flex items-center gap-2 p-3 rounded-xl border transition-all text-start ${formData.type === type.id ? 'bg-primary/20 border-primary text-primary glow-primary' : 'bg-white/5 border-white/10 text-white/40 hover:border-white/20'}`}>
                    <type.icon className="w-4 h-4 flex-shrink-0" />
                    <span className="text-[9px] font-black leading-tight uppercase">{type.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5 text-start">
              <label className="text-[10px] font-black text-primary uppercase tracking-widest">{t.ad_soyad}</label>
              <input required type="text" placeholder={t.ad_soyad} className={`w-full bg-white/5 border rounded-lg py-3 px-4 text-xs text-white ${errors.name ? 'border-red-500' : 'border-white/10'}`} value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value.toLocaleUpperCase('tr-TR')})} />
              {errors.name && <p className="text-red-500 text-[8px] font-black uppercase">{errors.name}</p>}
            </div>

            <div className="space-y-1.5 text-start">
              <label className="text-[10px] font-black text-primary uppercase tracking-widest">
                {formData.type === 'KATILIMCI' || formData.type === 'AKADEMİSYEN' ? t.uni_adi : 
                 formData.type === 'DENEYAP' ? t.deneyap_merkezi : 
                 formData.type === 'LİSE' ? t.lise_adi : t.kurum_uni}
              </label>
              <input required type="text" placeholder={
                formData.type === 'KATILIMCI' || formData.type === 'AKADEMİSYEN' ? t.uni_adi : 
                formData.type === 'DENEYAP' ? t.deneyap_merkezi : 
                formData.type === 'LİSE' ? t.lise_adi : t.kurum_uni
              } className={`w-full bg-white/5 border rounded-lg py-3 px-4 text-xs text-white ${errors.organization ? 'border-red-500' : 'border-white/10'}`} value={formData.organization} onChange={(e) => setFormData({...formData, organization: e.target.value.toLocaleUpperCase('tr-TR')})} />
              {errors.organization && <p className="text-red-500 text-[8px] font-black uppercase">{errors.organization}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-start">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-primary uppercase tracking-widest">{t.okul_no}</label>
                <input required type="text" maxLength={11} placeholder={t.okul_no} className="w-full bg-white/5 border border-white/10 rounded-lg py-3 px-4 text-xs text-white" value={formData.studentId} onChange={(e) => setFormData({...formData, studentId: e.target.value.replace(/\D/g, '')})} />
              </div>

              {formData.type === 'AKADEMİSYEN' && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-primary uppercase tracking-widest">{t.gorev_alani}</label>
                  <input required type="text" placeholder={t.gorev_alani} className="w-full bg-white/5 border border-white/10 rounded-lg py-3 px-4 text-xs text-white" value={formData.roleArea} onChange={(e) => setFormData({...formData, roleArea: e.target.value.toLocaleUpperCase('tr-TR')})} />
                </div>
              )}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-primary uppercase tracking-widest">{t.iletisim_no}</label>
                <input required type="tel" maxLength={10} placeholder="5XXXXXXXXX" className={`w-full bg-white/5 border rounded-lg py-3 px-4 text-xs text-white ${errors.phone ? 'border-red-500' : 'border-white/10'}`} value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value.replace(/\D/g, '')})} />
                {errors.phone && <p className="text-red-500 text-[8px] font-black uppercase">{errors.phone}</p>}
              </div>
            </div>

            <div className="space-y-1.5 text-start">
              <label className="text-[10px] font-black text-primary uppercase tracking-widest">{t.eposta}</label>
              <input required type="email" placeholder={t.eposta} className={`w-full bg-white/5 border rounded-lg py-3 px-4 text-xs text-white ${errors.email ? 'border-red-500' : 'border-white/10'}`} value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
              {errors.email && <p className="text-red-500 text-[8px] font-black uppercase">{errors.email}</p>}
            </div>

            <button type="submit" className="w-full bg-primary text-[#0a0f1e] font-black py-4 rounded-xl flex items-center justify-center gap-3 glow-primary btn-tech group uppercase">
              {t.kaydi_tamamla}
              <ArrowRight className={`w-5 h-5 group-hover:translate-x-1 transition-transform ${t.dir === 'rtl' ? 'rotate-180' : ''}`} />
            </button>
          </form>
        </div>
      </div>
    </motion.div>
  );
}
