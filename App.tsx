
import React, { useState, useEffect, createContext, useRef } from 'react';
import { TRANSLATIONS } from './constants';
import { User, Language } from './types';
import { Menu, Moon, Sun, Loader2 } from 'lucide-react';
import Splash from './pages/Splash';
import Login from './pages/Login';
import Sidebar from './components/Sidebar';
import HomeChat from './pages/HomeChat';
import StoriesPage from './pages/Stories';
import FoodPage from './pages/FoodSuggestions';
import TemplatesPage from './pages/Templates';
import ImageGeneratorPage from './pages/ImageGenerator';
import SummariesPage from './pages/Summaries';
import SettingsPage from './pages/Settings';
import ProfilePage from './pages/Profile';
import SubscribePage from './pages/Subscribe';
import HDLabPage from './pages/HDLab';
import SummonOverlay from './components/SummonOverlay';

type Page = 'splash' | 'login' | 'chat' | 'stories' | 'food' | 'templates' | 'images' | 'summaries' | 'settings' | 'profile' | 'subscribe' | 'hdlab';

export const AppContext = createContext<{
  isRobotSummoned: boolean;
  setIsRobotSummoned: (v: boolean) => void;
  isDarkMode: boolean;
  setIsDarkMode: (v: boolean) => void;
  isSpeaking: boolean;
  setIsSpeaking: (v: boolean) => void;
  robotRef: React.RefObject<any> | null;
}>({
  isRobotSummoned: false,
  setIsRobotSummoned: () => {},
  isDarkMode: true,
  setIsDarkMode: () => {},
  isSpeaking: false,
  setIsSpeaking: () => {},
  robotRef: null
});

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('splash');
  const [user, setUser] = useState<User | null>(null);
  const [lang, setLang] = useState<Language>('en');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isRobotSummoned, setIsRobotSummoned] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isAppLoading, setIsAppLoading] = useState(true);
  const robotRef = useRef<any>(null);

  useEffect(() => {
    // Initial loading simulation for Vercel stability
    const timer = setTimeout(() => setIsAppLoading(false), 2000);
    
    const savedUser = localStorage.getItem('chatty_user');
    if (savedUser) setUser(JSON.parse(savedUser));
    const savedLang = localStorage.getItem('chatty_lang') as Language;
    if (savedLang) setLang(savedLang);
    const savedTheme = localStorage.getItem('chatty_theme');
    if (savedTheme !== null) setIsDarkMode(savedTheme === 'true');

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    document.body.className = isDarkMode ? 'dark-mode' : 'light-mode';
    localStorage.setItem('chatty_theme', String(isDarkMode));
  }, [isDarkMode]);

  const t = TRANSLATIONS[lang];

  const handleLogin = (userData: User) => {
    setUser(userData);
    localStorage.setItem('chatty_user', JSON.stringify(userData));
    setCurrentPage('chat');
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('chatty_user');
    setCurrentPage('login');
  };

  const renderPage = () => {
    if (!user && currentPage !== 'splash' && currentPage !== 'login') {
      return <Login onLogin={handleLogin} t={t} lang={lang} />;
    }
    switch (currentPage) {
      case 'splash': return <Splash onStart={() => setCurrentPage('login')} t={t} lang={lang} />;
      case 'login': return <Login onLogin={handleLogin} t={t} lang={lang} />;
      case 'chat': return <HomeChat t={t} lang={lang} />;
      case 'stories': return <StoriesPage t={t} lang={lang} />;
      case 'food': return <FoodPage t={t} lang={lang} />;
      case 'templates': return <TemplatesPage t={t} lang={lang} />;
      case 'images': return <ImageGeneratorPage t={t} lang={lang} />;
      case 'summaries': return <SummariesPage t={t} lang={lang} />;
      case 'hdlab': return <HDLabPage t={t} lang={lang} />;
      case 'settings': return <SettingsPage toggleLang={(l) => { setLang(l); localStorage.setItem('chatty_lang', l); }} currentLang={lang} t={t} />;
      case 'profile': return <ProfilePage user={user!} onLogout={handleLogout} t={t} lang={lang} />;
      case 'subscribe': return <SubscribePage t={t} lang={lang} onUpgrade={() => {
        const updated = { ...user!, isPremium: true };
        setUser(updated);
        localStorage.setItem('chatty_user', JSON.stringify(updated));
      }} />;
      default: return <HomeChat t={t} lang={lang} />;
    }
  };

  if (isAppLoading) {
    return (
      <div className="fixed inset-0 bg-zinc-900 flex flex-col items-center justify-center z-[100]">
        <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center animate-bounce mb-6">
           <div className="w-10 h-1 bg-zinc-900 rounded-full" />
        </div>
        <p className="text-white font-orbitron tracking-[0.4em] animate-pulse">CHATTY IS LOADING...</p>
        <Loader2 className="w-6 h-6 text-white/20 animate-spin mt-4" />
      </div>
    );
  }

  const layoutClass = lang === 'ar' ? 'rtl' : 'ltr';

  return (
    <AppContext.Provider value={{ isRobotSummoned, setIsRobotSummoned, isDarkMode, setIsDarkMode, isSpeaking, setIsSpeaking, robotRef }}>
      <div className={`h-screen flex flex-col overflow-hidden ${isDarkMode ? 'bg-zinc-900' : 'bg-gray-50'} text-slate-100 ${layoutClass}`}>
        <SummonOverlay ref={robotRef} active={isRobotSummoned} onClose={() => setIsRobotSummoned(false)} lang={lang} t={t} />
        
        {user && (
          <>
            <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} setCurrentPage={setCurrentPage} currentPage={currentPage} t={t} lang={lang} />
            <header className={`flex items-center justify-between p-4 border-b h-16 shrink-0 ${isDarkMode ? 'border-white/10 bg-zinc-900/80' : 'border-gray-200 bg-white/80'} backdrop-blur-md sticky top-0 z-40`}>
              <div className="flex items-center gap-4">
                <button onClick={() => setIsSidebarOpen(true)} className={`p-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'} hover:bg-black/5 rounded-xl transition-all`}>
                  <Menu className="w-6 h-6" />
                </button>
                <div className="flex items-center gap-2 group cursor-pointer" onClick={() => setCurrentPage('chat')}>
                  <div className={`w-8 h-8 ${isDarkMode ? 'bg-white' : 'bg-black'} rounded-lg flex items-center justify-center scale-90`}>
                     <div className={`w-4 h-0.5 ${isDarkMode ? 'bg-black' : 'bg-white'} rounded-full`} />
                  </div>
                  <h1 className={`text-xl font-bold bg-gradient-to-r ${isDarkMode ? 'from-emerald-400 to-teal-400' : 'from-emerald-600 to-teal-600'} bg-clip-text text-transparent hidden sm:block font-orbitron`}>
                    {t.appName}
                  </h1>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button onClick={() => setIsDarkMode(!isDarkMode)} className={`p-2 rounded-xl ${isDarkMode ? 'text-yellow-400 hover:bg-white/5' : 'text-slate-600 hover:bg-black/5'}`}>
                  {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>
                <button onClick={() => setCurrentPage('profile')} className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all ${isDarkMode ? 'hover:bg-white/5' : 'hover:bg-black/5'}`}>
                  <div className="w-7 h-7 rounded-full overflow-hidden border border-emerald-500/30">
                    <img src={user.photoURL} alt={user.name} className="w-full h-full object-cover" />
                  </div>
                  <span className={`text-sm font-medium hidden md:inline ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>{user.name.split(' ')[0]}</span>
                </button>
              </div>
            </header>
          </>
        )}
        
        <main className={`flex-1 relative overflow-hidden flex flex-col ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>
          {renderPage()}
        </main>
      </div>
    </AppContext.Provider>
  );
};

export default App;
