
import React from 'react';
import { User, LogOut, ShieldCheck, Crown } from 'lucide-react';

interface ProfileProps {
  user: any;
  onLogout: () => void;
  t: any;
  lang: string;
}

const ProfilePage: React.FC<ProfileProps> = ({ user, onLogout, t, lang }) => {
  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 max-w-3xl mx-auto w-full">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 mb-8">
        <div className="flex flex-col items-center mb-10">
          <div className="relative mb-4">
            <img 
              src={user.photoURL} 
              alt={user.name} 
              className="w-24 h-24 rounded-3xl object-cover ring-4 ring-emerald-500/20" 
            />
            {user.isPremium && (
              <div className="absolute -top-2 -right-2 bg-amber-500 p-1.5 rounded-lg shadow-lg">
                <Crown className="w-4 h-4 text-white" />
              </div>
            )}
          </div>
          <h2 className="text-2xl font-bold">{user.name}</h2>
          <p className="text-slate-500">{user.email}</p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-10">
          <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800">
            <p className="text-xs text-slate-500 mb-1">{t.subscriptionStatus}</p>
            <p className={`font-bold ${user.isPremium ? 'text-amber-400' : 'text-slate-300'}`}>
              {user.isPremium ? t.pro : t.free}
            </p>
          </div>
          <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800">
            <p className="text-xs text-slate-500 mb-1">Joined</p>
            <p className="font-bold text-slate-300">Today</p>
          </div>
        </div>

        <div className="space-y-4">
          <button className="w-full flex items-center justify-between p-4 bg-slate-950 hover:bg-slate-800 rounded-2xl border border-slate-800 transition-all group">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-500" />
              <span className="text-sm font-medium">Privacy Settings</span>
            </div>
            <span className="text-slate-600 group-hover:translate-x-1 transition-transform">→</span>
          </button>
          
          <button 
            onClick={onLogout}
            className="w-full flex items-center gap-3 p-4 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-2xl border border-red-500/20 transition-all font-bold justify-center mt-8"
          >
            <LogOut className="w-5 h-5" />
            {t.logout}
          </button>
        </div>
      </div>

      <div className="text-center">
        <p className="text-xs text-slate-600">Chatty AI v1.0.4 • Powered by Google Gemini</p>
      </div>
    </div>
  );
};

export default ProfilePage;
