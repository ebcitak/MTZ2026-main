'use client';

import { useState, useRef } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, CheckCircle2, AlertTriangle, FileText, Download } from 'lucide-react';
import { translations, Language } from '@/lib/translations';

interface BulkImportProps {
  onImport: (participants: any[]) => void;
  onClose: () => void;
  lang: Language;
}

export default function BulkImport({ onImport, onClose, lang }: BulkImportProps) {
  const t = translations[lang];
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const extension = selectedFile.name.split('.').pop()?.toLowerCase();
      if (extension === 'csv') {
        parseCSV(selectedFile);
      } else if (extension === 'xlsx' || extension === 'xls') {
        parseExcel(selectedFile);
      } else {
        setError(lang === 'tr' ? 'Geçersiz dosya tipi. Lütfen CSV veya Excel yükleyin.' : 'Invalid file type. Please upload CSV or Excel.');
      }
    }
  };

  const parseCSV = (file: File) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        validateAndPreview(results.data, results.meta.fields || []);
      },
      error: (err) => {
        setError(err.message);
      }
    });
  };

  const parseExcel = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        if (jsonData.length > 0) {
          const headers = Object.keys(jsonData[0] as object);
          validateAndPreview(jsonData, headers);
        } else {
          setError(lang === 'tr' ? 'Dosya boş görünüyor.' : 'File appears to be empty.');
        }
      } catch (err: any) {
        setError(err.message);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const findHeader = (headers: string[], alternatives: string[]) => {
    const lowerAlternatives = alternatives.map(a => a.toLowerCase().trim());
    return headers.find(h => lowerAlternatives.includes(h.toLowerCase().trim()));
  };

  const validateAndPreview = (data: any[], headers: string[]) => {
    const nameHeader = findHeader(headers, ['İsim Soyisim', 'Ad Soyad', 'Name', 'Full Name', 'Adınız Soyadınız']);
    const emailHeader = findHeader(headers, ['S', 'E-posta', 'Email', 'E-posta adresi', 'E-Posta Adresi', 'Mail', 'Mail Adresi']);
    
    if (!nameHeader || !emailHeader) {
      const foundHeaders = headers.join(', ');
      setError(`${t.not_found || 'Hata'}: Başlıklar bulunamadı. Bulunan başlıklar: [${foundHeaders}]. Lütfen 'İsim Soyisim' ve 'E-posta' başlıklarını kontrol edin.`);
      return;
    }

    setPreview(data.slice(0, 5).map(row => ({
      name: row[nameHeader],
      email: row[emailHeader],
      organization: row[findHeader(headers, ['Üniversiteniz', 'Kurum', 'Organization', 'Kurum / Üniversite', 'Kurumunuz']) || ''] || ''
    })));
    setError(null);
  };

  const handleConfirm = () => {
    if (!file) return;
    const extension = file.name.split('.').pop()?.toLowerCase();

    if (extension === 'csv') {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          finalizeImport(results.data, results.meta.fields || []);
        }
      });
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        if (jsonData.length > 0) {
          const headers = Object.keys(jsonData[0] as object);
          finalizeImport(jsonData, headers);
        }
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const finalizeImport = (data: any[], headers: string[]) => {
    const nameHeader = findHeader(headers, ['İsim Soyisim', 'Ad Soyad', 'Name', 'Full Name', 'Adınız Soyadınız']);
    const emailHeader = findHeader(headers, ['S', 'E-posta', 'Email', 'E-posta adresi', 'E-Posta Adresi', 'Mail', 'Mail Adresi']);
    const orgHeader = findHeader(headers, ['Üniversiteniz', 'Kurum', 'Organization', 'Kurum / Üniversite', 'Kurumunuz']);
    const phoneHeader = findHeader(headers, ['Telefon Numarası (05xxxxxxxxx)', 'Telefon', 'Phone', 'İletişim No']);

    const mappedData = data
      .filter((row: any) => row[nameHeader!] && row[emailHeader!]) // Skip rows with missing name or email
      .map((row: any) => ({
        name: String(row[nameHeader!] || '').trim(),
        email: String(row[emailHeader!] || '').trim(),
        organization: String(row[orgHeader || ''] || '').trim(),
        phone: String(row[phoneHeader || ''] || '').trim(),
        type: String(row[findHeader(headers, ['Katılımcı Tipi', 'Type']) || ''] || 'KATILIMCI').trim(),
        status: 'OUTSIDE',
      }));
      
    if (mappedData.length === 0) {
      setError(lang === 'tr' ? 'Geçerli veri bulunamadı. Lütfen satırların dolu olduğundan emin olun.' : 'No valid data found. Please ensure rows are filled.');
      return;
    }

    onImport(mappedData);
    setSuccess(true);
    setTimeout(onClose, 2000);
  };

  const downloadTemplate = () => {
    const template = 'Ad Soyad,E-posta,Kurum,Telefon,Katılımcı Tipi\nAhmet Yılmaz,ahmet@example.com,ABC Ltd,05001234567,VIP';
    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'MTZ_Sablon.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0a0f1e]/90 backdrop-blur-xl p-4 overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }} 
        animate={{ opacity: 1, scale: 1 }} 
        className="w-full max-w-2xl glass-panel p-8 rounded-3xl border-white/10 relative"
      >
        <button onClick={onClose} className="absolute top-6 right-6 p-2 hover:bg-white/5 rounded-full text-white/40 hover:text-white transition-all">
          <X className="w-6 h-6" />
        </button>

        <div className="text-center space-y-6">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20 glow-primary">
            <FileText className="w-8 h-8 text-primary" />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-white uppercase tracking-tighter">
              {lang === 'tr' ? 'Toplu Veri Aktarımı' : 'Bulk Data Import'}
            </h2>
            <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest">
              {lang === 'tr' ? 'CSV veya Excel dosyasını yükleyin' : 'Upload CSV or Excel file'}
            </p>
          </div>

          {!file ? (
            <div className="space-y-4">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-white/10 rounded-3xl p-12 hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer group"
              >
                <Upload className="w-10 h-10 text-white/20 group-hover:text-primary mx-auto mb-4 transition-colors" />
                <p className="text-xs text-white/40 font-black uppercase">
                  {lang === 'tr' ? 'Dosyayı Sürükleyin veya Seçin' : 'Drag or Drop File'}
                </p>
                <input ref={fileInputRef} type="file" accept=".csv, .xlsx, .xls" className="hidden" onChange={handleFileChange} />
              </div>
              <button 
                onClick={downloadTemplate}
                className="flex items-center gap-2 mx-auto text-[10px] font-black text-primary/60 hover:text-primary uppercase"
              >
                <Download className="w-4 h-4" />
                {lang === 'tr' ? 'Örnek Şablonu İndir' : 'Download Sample Template'}
              </button>
            </div>
          ) : (
            <div className="space-y-6 text-left">
              {error ? (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
                  <p className="text-[10px] text-red-500 font-bold uppercase leading-tight">{error}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-white/5 rounded-xl overflow-hidden border border-white/10">
                    <table className="w-full text-[10px]">
                      <thead className="bg-white/5 text-white/40 uppercase">
                        <tr>
                          <th className="p-3 text-left">Ad Soyad</th>
                          <th className="p-3 text-left">E-posta</th>
                          <th className="p-3 text-left">Kurum</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {preview.map((row, i) => (
                          <tr key={i} className="text-white/80">
                            <td className="p-3">{row.name}</td>
                            <td className="p-3">{row.email}</td>
                            <td className="p-3">{row.organization}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="text-[10px] text-white/40 text-center uppercase font-bold">
                    {lang === 'tr' ? `+ ${preview.length} kayıt daha` : `+ ${preview.length} more records`}
                  </p>
                </div>
              )}

              <div className="flex gap-4">
                <button 
                  onClick={() => { setFile(null); setPreview([]); setError(null); }}
                  className="flex-1 py-4 rounded-xl bg-white/5 border border-white/10 text-white font-black uppercase text-[10px]"
                >
                  {t.cancel}
                </button>
                <button 
                  disabled={!!error}
                  onClick={handleConfirm}
                  className="flex-1 py-4 rounded-xl bg-primary text-[#0a0f1e] font-black uppercase text-[10px] glow-primary disabled:opacity-50"
                >
                  {lang === 'tr' ? 'İçeri Aktarımı Başlat' : 'Start Import'}
                </button>
              </div>
            </div>
          )}

          <AnimatePresence>
            {success && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }} 
                className="absolute inset-0 bg-[#0a0f1e] flex flex-col items-center justify-center space-y-4 rounded-3xl z-50"
              >
                <div className="w-20 h-20 bg-[#00ff41]/20 rounded-full flex items-center justify-center glow-secondary">
                  <CheckCircle2 className="w-12 h-12 text-[#00ff41]" />
                </div>
                <p className="text-xl font-black text-white uppercase tracking-tighter">
                  {lang === 'tr' ? 'Başarıyla Aktarıldı!' : 'Successfully Imported!'}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
