
import React, { useContext, useState } from 'react';
import { Home, Book, Utensils, Image, FileText, Settings, User, CreditCard, X, Bot, Video, Sparkles } from 'lucide-react';
import { AppContext } from '../App';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  setCurrentPage: (page: any) => void;
  currentPage: string;
  t: any;
  lang: 'en' | 'ar';
}

export const Logo: React.FC<{ className?: string }> = ({ className = "" }) => (
  <div className={`w-8 h-8 bg-white rounded-lg flex items-center justify-center ${className}`}>
     <div className="w-4 h-0.5 bg-slate-950 rounded-full" />
  </div>
);

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
    { id: 'hdlab', label: 'HD Image Lab', icon: Sparkles },
    { id: 'templates', label: 'Templates', icon: Video },
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
             <Logo />
             <span className="text-white font-orbitron font-bold tracking-wider">{t.appName}</span>
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
