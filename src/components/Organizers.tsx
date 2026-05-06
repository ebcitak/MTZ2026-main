import React from 'react';
import { motion } from 'framer-motion';

const organizers = [
  { name: 'Türkiye Teknoloji Takımı', src: '/logos/t3.png' },
  { name: 'Milli Teknoloji Hamlesi', src: '/logos/mth.png' },
  { name: 'ODTÜ Teknoloji Takımı', src: '/logos/odtu_ttt.png' },
];

export default function Organizers() {
  return (
    <div className="md:fixed md:top-6 md:left-6 md:z-[100] w-full md:w-auto p-4 md:p-0 flex justify-center md:justify-start">
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="glass-panel px-6 py-3 rounded-2xl border-white/10 flex items-center gap-6 md:gap-8 bg-white/5 backdrop-blur-xl shadow-2xl"
      >
        {organizers.map((org, index) => (
          <div key={index} className="h-10 md:h-14 w-auto">
            <img 
              src={org.src} 
              alt={org.name} 
              className="h-full w-auto object-contain brightness-110" 
            />
          </div>
        ))}
      </motion.div>
    </div>
  );
}
