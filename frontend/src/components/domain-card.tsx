'use client';

import { motion } from 'framer-motion';
import { Copy, ShoppingCart, Check } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface DomainCardProps {
  name: string;
  description: string;
  index: number;
}

export const DomainCard = ({ name, description, index }: DomainCardProps) => {
  const [copied, setCopied] = useState(false);

  // Generate a stable score based on name
  const getScore = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const score = 8.5 + (Math.abs(hash) % 15) / 10;
    return Math.min(9.9, score);
  };

  const score = getScore(name);

  const handleCopy = () => {
    navigator.clipboard.writeText(name);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const buyUrl = `https://www.namecheap.com/domains/registration/results/?domain=${name}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.5, ease: 'easeOut' }}
      whileHover={{ scale: 1.02 }}
      className="group relative bg-card/40 backdrop-blur-sm border border-white/5 rounded-2xl p-6 card-glow">
      <div className="flex justify-between items-start mb-4">
        <div className="bg-accent/10 text-accent text-[10px] font-bold px-2 py-1 rounded-full border border-accent/20">AI SCORE: {score.toFixed(1)}</div>
        <button onClick={handleCopy} className="text-white/40 hover:text-accent transition-colors p-1">
          {copied ? <Check size={16} /> : <Copy size={16} />}
        </button>
      </div>

      <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">{name}</h3>
      <motion.p
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 + 0.3, duration: 0.5 }}
        className="text-sm text-zinc-400 italic mb-6 leading-relaxed">
        {description}
      </motion.p>
      <div className="flex gap-3">
        <a
          href={buyUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95">
          <ShoppingCart size={18} />
          Hunt
        </a>
      </div>

      {/* Decorative Glow */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-accent/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
    </motion.div>
  );
};
