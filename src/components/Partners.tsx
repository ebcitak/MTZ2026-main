'use client';

import { motion } from 'framer-motion';

const partners = [
  { name: 'ASELSAN', src: '/logos/aselsan.png' },
  { name: 'TUSAŞ', src: '/logos/tusas.png' },
  { name: 'STM', src: '/logos/stm.png' },
  { name: 'HAVELSAN', src: '/logos/havelsan.png' },
  { name: 'ASFAT', src: '/logos/asfat.png' },
  { name: 'ROKETSAN', src: '/logos/roketsan.png' },
  { name: 'TEI', src: '/logos/tei.png' },
  { name: 'ODTÜ', src: '/logos/odtu.png' },
];

export default function Partners() {
  return (
    <div className="w-full overflow-hidden py-10 relative">
      <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-[#0a0f1e] to-transparent z-10" />
      <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-[#0a0f1e] to-transparent z-10" />
      
      <motion.div 
        className="flex whitespace-nowrap gap-16 w-max items-center"
        animate={{ x: ["0%", "-33.33%"] }}
        transition={{ 
          duration: 40, 
          repeat: Infinity, 
          ease: "linear" 
        }}
      >
        {[...partners, ...partners, ...partners].map((partner, index) => (
          <div key={index} className="flex items-center justify-center w-48 h-28 group">
            <img 
              src={partner.src} 
              alt={partner.name} 
              className="h-20 w-auto object-contain filter brightness-200 contrast-100 opacity-30 group-hover:opacity-100 group-hover:brightness-100 transition-all duration-500" 
            />
          </div>
        ))}
      </motion.div>
    </div>
  );
}
