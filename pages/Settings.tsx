
import React, { useState } from 'react';
import { Globe, Moon, Shield, Key, Save } from 'lucide-react';

interface SettingsProps { toggleLang: (lang: 'en' | 'ar') => void; currentLang: 'en' | 'ar'; t: any; }

const SettingsPage: React.FC<SettingsProps> = ({ toggleLang, currentLang, t }) => {
  const [apiKey, setApiKey] = useState(localStorage.getItem('chatty_api_key') || '');

  const saveKey = () => {
    localStorage.setItem('chatty_api_key', apiKey);
    alert('API Key saved locally. Ready for deployment!');
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 max-w-3xl mx-auto w-full">
      <h1 className="text-3xl font-bold mb-8 font-orbitron">{t.settings}</h1>
      <div className="space-y-6">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Globe className="text-blue-500 w-6 h-6" />
              <h3 className="font-bold">{t.language}</h3>
            </div>
            <div className="flex p-1 bg-slate-950 rounded-xl">
              <button onClick={() => toggleLang('en')} className={`px-4 py-2 rounded-lg text-sm ${currentLang === 'en' ? 'bg-slate-800 text-white' : 'text-slate-500'}`}>English</button>
              <button onClick={() => toggleLang('ar')} className={`px-4 py-2 rounded-lg text-sm ${currentLang === 'ar' ? 'bg-slate-800 text-white' : 'text-slate-500'}`}>العربية</button>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
           <div className="flex items-center gap-4 mb-6">
              <Key className="text-emerald-500 w-6 h-6" />
              <h3 className="font-bold">Production Configuration</h3>
            </div>
            <p className="text-sm text-slate-400 mb-4">Paste your personal Gemini API key here for independent production use on Netlify/Vercel.</p>
            <div className="flex gap-2">
              <input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="Enter API Key..." className="flex-1 bg-slate-950 border border-slate-800 p-4 rounded-xl text-emerald-400 focus:outline-none" />
              <button onClick={saveKey} className="bg-emerald-500 text-white p-4 rounded-xl hover:bg-emerald-600 transition-all"><Save className="w-6 h-6" /></button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
