'use client';

import { motion } from 'framer-motion';

const partners = [
  { name: 'ASELSAN', src: '/logos/aselsan.png' },
  { name: 'ASFAT', src: '/logos/asfat.png' },
  { name: 'BAYKAR', src: '/logos/baykar.png' },
  { name: 'HAVELSAN', src: '/logos/havelsan.png' },
  { name: 'ODTÜ', src: '/logos/odtu.png' },
  { name: 'ROKETSAN', src: '/logos/ROKETSAN.png' },
  { name: 'STM', src: '/logos/STM.png' },
  { name: 'TEI', src: '/logos/TEI.png' },
  { name: 'TUSAŞ', src: '/logos/tusas.png' },
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
          <div key={index} className="flex items-center justify-center w-48 md:w-72 h-28 md:h-36 shrink-0 px-6">
            <div className="relative w-full h-full flex items-center justify-center">
              <img 
                src={partner.src} 
                alt={partner.name} 
                className={`max-w-[85%] max-h-[75%] md:max-h-[85%] w-auto h-auto object-contain opacity-100 brightness-110 transition-transform duration-500 hover:scale-110 ${partner.name === 'ODTÜ' ? 'scale-[1.8] md:scale-[2.2]' : ''}`} 
              />
            </div>
          </div>
        ))}
      </motion.div>
    </div>
  );
}
