
import React from 'react';
import { Zap, Shield, Globe } from 'lucide-react';
import { Logo } from '../components/Sidebar';

interface SplashProps {
  onStart: () => void;
  t: any;
  lang: string;
}

const Splash: React.FC<SplashProps> = ({ onStart, t, lang }) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
      <div className="relative mb-12">
        <div className="absolute inset-0 bg-emerald-500/10 blur-[120px] rounded-full scale-150" />
        <Logo className="scale-150 animate-bounce-slow" />
      </div>

      <p className="text-xl md:text-2xl text-slate-400 mb-12 max-w-2xl font-light">
        {t.tagline}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16 max-w-4xl w-full">
        {[
          { icon: Zap, label: "Fast Response", color: "text-amber-400" },
          { icon: Globe, label: "Multi-language", color: "text-blue-400" },
          { icon: Shield, label: "Privacy First", color: "text-emerald-400" }
        ].map((feat, i) => (
          <div key={i} className="bg-slate-900/40 border border-slate-800/50 p-6 rounded-3xl backdrop-blur-sm hover:border-slate-700 transition-colors">
            <feat.icon className={`w-8 h-8 mx-auto mb-3 ${feat.color}`} />
            <span className="text-slate-300 font-medium">{feat.label}</span>
          </div>
        ))}
      </div>

      <button
        onClick={onStart}
        className="group relative px-10 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-lg rounded-full transition-all duration-300 shadow-xl shadow-emerald-500/25 hover:-translate-y-1 active:scale-95"
      >
        <span className="flex items-center gap-2">
          {t.startChatting}
          <span className={`${lang === 'ar' ? 'rotate-180' : ''}`}>→</span>
        </span>
      </button>
    </div>
  );
};

export default Splash;
