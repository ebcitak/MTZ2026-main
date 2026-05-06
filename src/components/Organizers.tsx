'use client';

import { motion } from 'framer-motion';

const organizers = [
  { name: 'T3 Vakfı', src: '/logos/t3.png' },
  { name: 'MTH', src: '/logos/mth.png' },
  { name: 'ODTÜ TTT', src: '/logos/odtu_ttt.png' },
];

export default function Organizers() {
  return (
    <div className="fixed top-0 left-0 z-[100] p-6 flex pointer-events-none">
      <motion.div 
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="glass-panel px-10 py-5 rounded-[2rem] border-white/10 shadow-[0_0_60px_rgba(0,0,0,0.6)] flex items-center gap-12 pointer-events-auto"
      >
        {organizers.map((org, index) => (
          <div key={index} className="h-20 w-auto group relative flex items-center justify-center">
            <img 
              src={org.src} 
              alt={org.name} 
              className="h-full w-auto object-contain filter brightness-200 contrast-100 opacity-60 hover:opacity-100 transition-all duration-300" 
            />
          </div>
        ))}
      </motion.div>
    </div>
  );
}
