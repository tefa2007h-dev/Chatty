
import React, { useContext, useState } from 'react';
import { Home, Book, Utensils, Image, FileText, Settings, User, CreditCard, X, Bot } from 'lucide-react';
import { AppContext } from '../App';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  setCurrentPage: (page: any) => void;
  currentPage: string;
  t: any;
  lang: 'en' | 'ar';
}

export const Logo: React.FC<{ className?: string, size?: 'sm' | 'md' | 'lg' | 'xl' }> = ({ className = "", size = 'md' }) => {
  const sizes = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-16 h-16",
    xl: "w-32 h-32"
  };

  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <svg 
        viewBox="0 0 120 120" 
        className={`${sizes[size]} fill-current`} 
        xmlns="http://www.w3.org/2000/svg"
      >
         {/* Sparkles */}
         <path d="M25 35 L30 15 L35 35 L55 40 L35 45 L30 65 L25 45 L5 40 Z" className="text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.8)]" fill="currentColor" />
         <path d="M90 25 L93 15 L96 25 L106 28 L96 31 L93 41 L90 31 L80 28 Z" className="text-emerald-400 drop-shadow-[0_0_5px_rgba(52,211,153,0.8)]" fill="currentColor" />

         {/* Chat Bubble Body */}
         <path d="M60 30 C30 30 10 45 10 70 C10 85 20 95 35 100 L30 115 L55 105 C60 106 65 106 70 106 C100 106 120 85 120 65 C120 45 95 30 60 30 Z" className="text-slate-900 dark:text-white" fill="currentColor" />
         
         {/* Internal Lines */}
         <path d="M35 60 H85" stroke="currentColor" className="text-white dark:text-slate-900" strokeWidth="8" strokeLinecap="round" />
         <path d="M35 80 H70" stroke="currentColor" className="text-white dark:text-slate-900" strokeWidth="8" strokeLinecap="round" />
      </svg>
    </div>
  );
};

const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen, setCurrentPage, currentPage, t, lang }) => {
  const { isRobotSummoned, setIsRobotSummoned } = useContext(AppContext);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleSummonToggle = () => {
    if (!isRobotSummoned) {
      setIsTransitioning(true);
      setTimeout(() => {
        setIsRobotSummoned(true);
        setIsTransitioning(false);
        setIsOpen(false);
      }, 400);
    } else {
      setIsRobotSummoned(false);
      setIsOpen(false);
    }
  };

  const navItems = [
    { id: 'chat', label: t.home, icon: Home },
    { id: 'stories', label: t.stories, icon: Book },
    { id: 'food', label: t.food, icon: Utensils },
    { id: 'images', label: t.imageGen, icon: Image },
    { id: 'summaries', label: t.summaries, icon: FileText },
    { id: 'settings', label: t.settings, icon: Settings },
    { id: 'profile', label: t.profile, icon: User },
    { id: 'subscribe', label: t.subscribe, icon: CreditCard },
  ];

  const handleClick = (id: string) => {
    setCurrentPage(id);
    setIsOpen(false);
  };

  const sidebarBase = "fixed inset-y-0 z-[60] w-72 bg-[#171717] border-[#262626] transform transition-transform duration-300 ease-in-out shadow-2xl";
  const visibilityClass = isOpen ? "translate-x-0" : (lang === 'ar' ? "translate-x-full" : "-translate-x-full");

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 transition-opacity" onClick={() => setIsOpen(false)} />
      )}

      <aside className={`${sidebarBase} ${visibilityClass} flex flex-col ${lang === 'ar' ? 'right-0 border-l' : 'left-0 border-r'}`}>
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <Logo size="md" />
             <span className="text-white font-orbitron font-bold tracking-wider text-xl">{t.appName}</span>
          </div>
          <button className="text-slate-500 hover:text-white transition-colors" onClick={() => setIsOpen(false)}>
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="px-4 mb-4">
          <button
            onClick={handleSummonToggle}
            className={`w-full flex items-center justify-center gap-3 py-4 rounded-2xl transition-all font-orbitron text-xs tracking-[0.15em] border ${
              isTransitioning ? 'summon-btn-out' : ''
            } ${
              isRobotSummoned 
              ? "bg-[#00f3ff]/10 text-[#00f3ff] border-[#00f3ff]/30 shadow-[0_0_15px_rgba(0,243,255,0.1)]" 
              : "bg-white/5 text-slate-300 border-white/10 hover:bg-white/10"
            }`}
          >
            <Bot className={`w-5 h-5 ${isRobotSummoned ? 'animate-pulse' : ''}`} />
            {t.summonChatty}
          </button>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleClick(item.id)}
                className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 group ${
                  active 
                    ? "bg-[#262626] text-white font-medium" 
                    : "text-slate-400 hover:bg-[#262626] hover:text-white"
                }`}
              >
                <Icon className={`w-5 h-5 ${active ? "text-emerald-400" : "text-slate-500 group-hover:text-slate-300"}`} />
                <span className={`text-sm ${active ? 'font-bold' : ''}`}>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-[#262626]">
          <div className="bg-[#262626] rounded-2xl p-4">
            <p className="text-[10px] text-emerald-400 mb-1 font-bold uppercase tracking-widest">{t.premium}</p>
            <p className="text-[11px] text-slate-400 mb-3">{t.upgradeDesc}</p>
            <button 
              onClick={() => handleClick('subscribe')}
              className="w-full bg-white text-black text-xs font-bold py-2.5 rounded-lg hover:bg-emerald-50 transition-colors"
            >
              {t.subscribe}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
