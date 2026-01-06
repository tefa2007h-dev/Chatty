
import React, { useState } from 'react';
import { Check, Crown, Zap, Shield, Globe } from 'lucide-react';

interface SubscribeProps {
  t: any;
  lang: string;
  onUpgrade: () => void;
}

const SubscribePage: React.FC<SubscribeProps> = ({ t, lang, onUpgrade }) => {
  const [success, setSuccess] = useState(false);

  const handleUpgrade = () => {
    onUpgrade();
    setSuccess(true);
  };

  const benefits = [
    { icon: Zap, text: "Unlimited generations" },
    { icon: Globe, text: "Priority multilingual support" },
    { icon: Shield, text: "Advanced privacy controls" },
    { icon: Crown, text: "Early access to new models" }
  ];

  if (success) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-slate-500 rounded-full flex items-center justify-center mb-6 animate-bounce">
          <Check className="w-12 h-12 text-white" />
        </div>
        <h2 className="text-3xl font-bold mb-2 text-slate-100">Upgrade Successful!</h2>
        <p className="text-slate-400 mb-8">You are now a Premium user of Chatty AI.</p>
        <button 
          onClick={() => window.location.reload()} 
          className="bg-slate-100 text-slate-900 px-8 py-3 rounded-xl font-bold"
        >
          Return Home
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 flex flex-col items-center">
      <div className="text-center mb-12">
        <div className="w-16 h-16 bg-slate-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Crown className="text-slate-400 w-8 h-8" />
        </div>
        <h1 className="text-4xl font-bold mb-4 text-slate-100 font-orbitron">Chatty Premium</h1>
        <p className="text-slate-400 max-w-lg mx-auto">
          Take your AI experience to the next level with power and precision.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl w-full">
        <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8">
          <h3 className="text-xl font-bold mb-6 text-slate-100">Pro Features</h3>
          <ul className="space-y-4">
            {benefits.map((b, i) => (
              <li key={i} className="flex items-center gap-3 text-slate-300">
                <div className="bg-slate-500/20 p-1 rounded-md">
                  <b.icon className="w-4 h-4 text-slate-400" />
                </div>
                <span>{b.text}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-slate-900 border-2 border-slate-400/50 rounded-3xl p-8 relative overflow-hidden shadow-2xl shadow-slate-500/10">
          <div className="absolute top-0 right-0 bg-slate-400 text-black px-6 py-1 font-bold text-xs transform translate-x-1/4 translate-y-full rotate-45">
            BEST VALUE
          </div>
          <p className="text-slate-400 font-medium mb-2">Yearly Membership</p>
          <div className="flex items-baseline gap-2 mb-8">
            <span className="text-5xl font-extrabold text-slate-100">$12</span>
            <span className="text-slate-500">/ month</span>
          </div>
          
          <div className="space-y-3 mb-8">
            <div className="flex items-center gap-2 text-sm text-slate-400">
               <Check className="w-4 h-4" /> Save 40% vs Monthly
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-400">
               <Check className="w-4 h-4" /> Cancel anytime
            </div>
          </div>

          <button
            onClick={handleUpgrade}
            className="w-full py-4 bg-slate-100 hover:bg-white text-slate-950 font-black text-lg rounded-2xl transition-all shadow-lg active:scale-95"
          >
            UPGRADE NOW
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubscribePage;
