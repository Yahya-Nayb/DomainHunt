'use client';

import { motion } from 'framer-motion';

export const RadarAnimation = () => {
  return (
    <div className="relative w-64 h-64 mx-auto mb-8">
      {/* Outer Circle */}
      <div className="absolute inset-0 border-2 border-accent/20 rounded-full" />
      
      {/* Middle Circle */}
      <div className="absolute inset-8 border border-accent/15 rounded-full" />
      
      {/* Inner Circle */}
      <div className="absolute inset-16 border border-accent/10 rounded-full" />
      
      {/* Radar Sweep */}
      <div className="absolute inset-0 rounded-full overflow-hidden opacity-30">
        <div className="radar-sweep absolute inset-[-50%] origin-center" />
      </div>
      
      {/* Scanning Line */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        className="absolute inset-0 origin-center"
      >
        <div className="absolute top-0 left-1/2 w-0.5 h-1/2 bg-accent shadow-[0_0_15px_rgba(16,185,129,0.8)]" />
      </motion.div>
      
      {/* Blips */}
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ 
            opacity: [0, 1, 0], 
            scale: [0.5, 1, 1.2],
          }}
          transition={{ 
            duration: 2, 
            repeat: Infinity, 
            delay: i * 0.7,
            ease: "easeOut"
          }}
          className="absolute w-2 h-2 bg-accent rounded-full shadow-[0_0_10px_#10B981]"
          style={{
            top: `${20 + Math.random() * 60}%`,
            left: `${20 + Math.random() * 60}%`,
          }}
        />
      ))}
      
      {/* Center Point */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-accent rounded-full shadow-[0_0_15px_#10B981] z-10" />
    </div>
  );
};
