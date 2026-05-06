'use client';

import { motion } from 'framer-motion';

const organizers = [
  { name: 'T3 Vakfı', src: '/logos/t3.png' },
  { name: 'MTH', src: '/logos/mth.png' },
  { name: 'ODTÜ TTT', src: '/logos/odtu_ttt.png' },
];

export default function Organizers() {
  return (
    <div className="w-full py-8 border-t border-white/5 mt-12">
      <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] mb-6 text-center">ORGANİZATÖRLER</p>
      <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-60">
        {organizers.map((org, index) => (
          <div key={index} className="h-12 md:h-16 w-auto">
            <img 
              src={org.src} 
              alt={org.name} 
              className="h-full w-auto object-contain filter brightness-200 contrast-100 grayscale hover:grayscale-0 transition-all duration-300" 
            />
          </div>
        ))}
      </div>
    </div>
  );
}
