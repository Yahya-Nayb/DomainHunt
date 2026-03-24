'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Radar, Shield, Rocket, Sparkles, Key } from 'lucide-react';
import { toast } from 'sonner';
import { RadarAnimation } from '@/components/radar-animation';
import { DomainCard } from '@/components/domain-card';
import { cn } from '@/lib/utils';

export default function Home() {
  const [niche, setNiche] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<string[]>([]);
  const [totalAvailable, setTotalAvailable] = useState(0);
  const [statusMessage, setStatusMessage] = useState('Initializing...');
  const currentYear = new Date().getFullYear();
  // Load API Key from localStorage
  useEffect(() => {
    const savedKey = localStorage.getItem('github_token');
    if (savedKey) setApiKey(savedKey);
  }, []);

  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const key = e.target.value;
    setApiKey(key);
    localStorage.setItem('github_token', key);
  };

  // Simulate progress steps
  useEffect(() => {
    const messages = [
      'Initializing AI Agents...',
      'Scanning global TLD registries...',
      'Analyzing keyword semantics...',
      'Filtering for brandability...',
      'Validating trademark risks...',
      'Checking DNS availability...',
    ];

    let interval: NodeJS.Timeout;
    if (isLoading) {
      setProgress(1);
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 5) return 5;
          setStatusMessage(messages[prev - 1] || messages[messages.length - 1]);
          return prev + 1;
        });
      }, 1500);
    } else {
      setProgress(0);
      setStatusMessage('Initializing...');
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  const handleHunt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!niche.trim()) {
      toast.error('Please enter a niche to start hunting.');
      return;
    }

    setIsLoading(true);
    setResults([]);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      // const headers: HeadersInit = {};
      // if (apiKey) {
      //   headers['x-gemini-key'] = apiKey;
      // }

      // const response = await fetch(`${apiUrl}/generator/run/${encodeURIComponent(niche)}`, {
      //   headers,
      // });

      const response = await fetch(`${apiUrl}/generator/run`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          niche: encodeURIComponent(niche),
          userApiKey: apiKey,
        }),
      });
      const data = await response.json();

      if (response.ok) {
        setResults(data.domains || []);
        setTotalAvailable(data.domains.length || 0);
        setProgress(6);
        toast.success(`Hunt Successful! ${data.totalAvailable} available.`);
      } else {
        toast.error(data.message || 'The hunt failed. Our AI scouts were ambushed.');
      }
    } catch (error) {
      toast.error('Connection lost. The radar is offline.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-6 py-12 lg:py-24 max-w-7xl">
      {/* Hero / Header */}
      <div className="flex flex-col items-center text-center mb-16 lg:mb-24">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-accent/5 border border-accent/10 text-accent text-sm font-semibold mb-6">
          <Sparkles size={16} />
          AI-POWERED DOMAIN INTELLIGENCE
        </motion.div>

        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }} className="text-5xl lg:text-7xl font-black mb-6 tracking-tight">
          Domain<span className="text-accent italic">Hunt</span>
        </motion.h1>

        <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.3 }} className="text-lg lg:text-xl text-white/50 max-w-2xl mb-12">
          Stop settling for average names. Deploy our AI agents to scan the digital landscape and secure elite, brandable .com domains in seconds.
        </motion.p>

        {/* API Key Input */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.35 }} className="w-full max-w-lg mb-6 group relative">
          <div className="flex items-center gap-3 px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus-within:border-accent/40 transition-colors backdrop-blur-md">
            <Key size={16} className="text-white/40 group-focus-within:text-accent transition-colors" />
            <input
              type="password"
              placeholder="Enter Gemini API Key (Optional)"
              value={apiKey}
              onChange={handleApiKeyChange}
              className="flex-1 bg-transparent border-none focus:outline-none text-white text-sm placeholder:text-white/20 font-mono tracking-tight"
            />
            <div className="text-[10px] text-white/30 border border-white/10 px-2 py-0.5 rounded uppercase tracking-wider">BYOK</div>
          </div>
          <p className="text-[10px] text-white/20 mt-2 text-left px-1">
            Don&apos;t have a key? Get one free from{' '}
            <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-accent/50 hover:text-accent underline transition-colors">
              Google AI Studio
            </a>
            .
          </p>
        </motion.div>

        {/* Radar Search Bar */}
        <motion.form onSubmit={handleHunt} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.4 }} className="w-full max-w-2xl relative group">
          <div className="absolute inset-0 bg-accent/20 blur-2xl rounded-2xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
          <div className="relative flex flex-col md:flex-row gap-4 p-2 bg-card/60 backdrop-blur-xl border border-white/10 rounded-2xl focus-within:border-accent/40 transition-all">
            <div className="flex-1 flex items-center px-4">
              <Search className="text-white/30 mr-3" size={20} />
              <input
                type="text"
                value={niche}
                onChange={(e) => setNiche(e.target.value)}
                placeholder="Enter a niche (e.g., Artisan Coffee, AI Analytics)"
                className="w-full bg-transparent border-none focus:outline-none py-4 text-white placeholder:text-white/20 text-lg"
                disabled={isLoading}
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className={cn(
                'bg-accent hover:bg-accent/90 disabled:bg-white/5 disabled:text-white/20 text-accent-foreground font-black px-8 py-4 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-[0_4px_20px_rgba(16,185,129,0.3)]',
                isLoading && 'animate-pulse',
              )}>
              <Radar size={20} className={isLoading ? 'animate-spin' : ''} />
              {isLoading ? 'HUNTING...' : 'START HUNTING'}
            </button>
          </div>
        </motion.form>
      </div>

      {/* Main Content Area */}
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center py-20">
            <RadarAnimation />
            <div className="max-w-md w-full">
              <div className="flex justify-between text-xs text-white/40 mb-2 font-mono uppercase tracking-widest">
                <span>Deploying Scanners</span>
                <span>Batch {progress}/6</span>
              </div>
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${(progress / 6) * 100}%` }} className="h-full bg-accent shadow-[0_0_10px_#10B981]" />
              </div>
              <motion.p key={statusMessage} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="mt-4 text-sm text-center text-accent/80 font-mono tracking-wide">
                {statusMessage}
              </motion.p>
            </div>
          </motion.div>
        ) : results.length > 0 ? (
          <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12">
            <div className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-white/5 pb-8">
              <div>
                <h2 className="text-3xl font-black text-white mb-2">Elite Shortlist</h2>
                <p className="text-white/40">From a massive scan of {totalAvailable} available domains.</p>
              </div>
              <div className="flex gap-4">
                <div className="bg-card px-4 py-2 rounded-lg border border-white/5 text-xs">
                  <span className="text-white/30 block mb-1">NICHE</span>
                  <span className="text-accent font-bold uppercase">{niche}</span>
                </div>
                <div className="bg-card px-4 py-2 rounded-lg border border-white/5 text-xs">
                  <span className="text-white/30 block mb-1">TLS</span>
                  <span className="text-white font-bold uppercase">.COM ONLY</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {results.map((domain, index) => (
                <DomainCard key={domain} name={domain} index={index} />
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 md:grid-cols-3 gap-8 py-12">
            {[
              { icon: Shield, title: 'Verified Availability', desc: 'Every result is checked against DNS records in real-time.' },
              { icon: Rocket, title: 'High Brandability', desc: 'Our AI prioritizes short, memorable, and industry-relevant names.' },
              { icon: Radar, title: 'Market Ready', desc: 'Direct links to secure your domain before anyone else does.' },
            ].map((feature, i) => (
              <div key={i} className="bg-card/30 p-8 rounded-2xl border border-white/5">
                <feature.icon className="text-accent mb-4" size={32} />
                <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-white/40 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="w-full py-4 px-6 border-t border-white/5 bg-[#0B0E14] mt-20">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          {/* Left Side: Brand & Status */}
          <div className="flex flex-col items-center md:items-start gap-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10B981]" />
              <span className="text-gray-100 font-bold tracking-tight text-lg uppercase tracking-wider">
                DomainHunt <span className="text-emerald-500">AI</span>
              </span>
            </div>
            <p className="text-gray-500 text-xs max-w-xs text-center md:text-left leading-relaxed">Curating high-alpha digital assets. Turning keywords into premium real estate.</p>
          </div>

          {/* Center: The Vibe Section */}
          <div className="flex flex-col items-center gap-1">
            <p className="text-[11px] text-gray-600 font-medium">&copy; {currentYear} DomainHunt. All Rights Reserved.</p>
          </div>

          {/* Right Side: Identity */}
          <div className="flex flex-col items-center md:items-start gap-1">
            <p className="text-gray-400 text-sm font-mono">
              Crafted with ⚡ by <span className="text-white hover:text-emerald-400 transition-colors cursor-pointer font-bold underline decoration-emerald-500/30 underline-offset-4">Yahya Nayb</span>
            </p>
            <p className="text-[10px] text-gray-600 uppercase tracking-[0.2em] font-medium">Precision Logic • AI Filtering</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
