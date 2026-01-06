
import React from 'react';
import { Globe, Moon, Bell, Shield } from 'lucide-react';

interface SettingsProps {
  toggleLang: (lang: 'en' | 'ar') => void;
  currentLang: 'en' | 'ar';
  t: any;
}

const SettingsPage: React.FC<SettingsProps> = ({ toggleLang, currentLang, t }) => {
  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 max-w-3xl mx-auto w-full">
      <h1 className="text-3xl font-bold mb-8">{t.settings}</h1>

      <div className="space-y-6">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
                <Globe className="text-blue-500 w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-100">{t.language}</h3>
                <p className="text-xs text-slate-500">{t.switchLang}</p>
              </div>
            </div>
            <div className="flex p-1 bg-slate-950 rounded-xl border border-slate-800">
              <button
                onClick={() => toggleLang('en')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${currentLang === 'en' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-500'}`}
              >
                English
              </button>
              <button
                onClick={() => toggleLang('ar')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${currentLang === 'ar' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-500'}`}
              >
                العربية
              </button>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 opacity-60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center">
                <Moon className="text-amber-500 w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-100">{t.darkMode}</h3>
                <p className="text-xs text-slate-500">Dark mode is on by default.</p>
              </div>
            </div>
            <div className="w-12 h-6 bg-emerald-500 rounded-full relative">
              <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
           <div className="flex items-center gap-4 mb-6">
              <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                <Shield className="text-emerald-500 w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-100">API Configuration</h3>
            </div>
            <p className="text-sm text-slate-400 mb-4">
              Chatty AI is powered by Google Gemini. API Keys are managed securely on our infrastructure.
            </p>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs text-emerald-400">
              Model: gemini-3-flash-preview (V1.2)
            </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
