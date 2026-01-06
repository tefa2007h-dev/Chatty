
import React, { useState, useContext, useRef } from 'react';
import { Utensils, ChefHat, Sparkles, Wand2, Star, Trophy, Zap } from 'lucide-react';
import { suggestFood } from '../services/geminiService';
import { AppContext } from '../App';

interface FoodPageProps { t: any; lang: 'en' | 'ar'; }

const FoodPage: React.FC<FoodPageProps> = ({ t, lang }) => {
  const { robotRef, isRobotSummoned } = useContext(AppContext);
  const [ingredients, setIngredients] = useState('');
  const [meals, setMeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isVortexActive, setIsVortexActive] = useState(false);
  const [shake, setShake] = useState(false);
  const [flash, setFlash] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const audioCtx = useRef<AudioContext | null>(null);

  const initAudio = () => {
    if (!audioCtx.current) {
      audioCtx.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  };

  const playVortexSound = () => {
    if (!audioCtx.current) return;
    const ctx = audioCtx.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(40, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 2);
    
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.3);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 2);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 2);
  };

  const playExplosionSound = () => {
    if (!audioCtx.current) return;
    const ctx = audioCtx.current;
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(200, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(20, ctx.currentTime + 0.4);
    gain.gain.setValueAtTime(0.5, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.4);

    const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.5, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < ctx.sampleRate * 0.5; i++) output[i] = Math.random() * 2 - 1;
    
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    const noiseGain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(8000, ctx.currentTime);
    noiseGain.gain.setValueAtTime(0.2, ctx.currentTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noise.start();
  };

  const createMagicDust = () => {
    if (!containerRef.current) return;
    const colors = ['#ff9100', '#ffd700', '#ffffff', '#00f3ff', '#ff3d00'];
    const particleCount = 300;
    
    for (let i = 0; i < particleCount; i++) {
      const p = document.createElement('div');
      p.className = 'particle';
      const angle = Math.random() * Math.PI * 2;
      const dist = 300 + Math.random() * 1500;
      const size = 2 + Math.random() * 14;
      
      p.style.width = `${size}px`;
      p.style.height = `${size}px`;
      p.style.setProperty('--x', `${Math.cos(angle) * dist}px`);
      p.style.setProperty('--y', `${Math.sin(angle) * dist}px`);
      p.style.left = '50%';
      p.style.top = '50%';
      p.style.background = colors[Math.floor(Math.random() * colors.length)];
      p.style.boxShadow = `0 0 ${size * 3}px ${p.style.background}`;
      p.style.animationDuration = `${0.8 + Math.random() * 1.2}s`;
      
      containerRef.current.appendChild(p);
      setTimeout(() => p.remove(), 2000);
    }
  };

  const handleSuggest = async () => {
    if (!ingredients.trim()) return;
    initAudio();
    setLoading(true);
    setIsVortexActive(true);
    setMeals([]); 
    playVortexSound();
    
    if (isRobotSummoned) {
      robotRef?.current?.triggerAnimation('spin');
      robotRef?.current?.speak(lang === 'ar' ? "ثواني وهفجرلك المطبخ بأحلى أفكار!" : "Stand back! I'm detonating a flavour bomb in the kitchen!");
    }

    try {
      // Parallel execution: Suggestion + Image grounding
      const res = await suggestFood(ingredients, lang);
      
      // Speed check: Ensure minimum animation time for "feel" but don't hold user back
      setTimeout(() => {
        setIsVortexActive(false);
        setFlash(true);
        setShake(true);
        playExplosionSound();
        createMagicDust();
        
        setTimeout(() => {
          setFlash(false);
          setShake(false);
          setMeals(res);
          setLoading(false);
          
          if (isRobotSummoned) {
              robotRef?.current?.triggerAnimation('happy');
              robotRef?.current?.speak(lang === 'ar' ? "انفجار النكهات تم! شوف كل الأطباق المختلفة دي." : "BOOM! Look at this diverse spread of masterpieces.");
          }
        }, 200);
      }, 2000); // Reduced from 3000 for faster feel
    } catch (err) {
      setLoading(false); 
      setIsVortexActive(false);
    }
  };

  const ingredientTags = ingredients.split(',').filter(i => i.trim());

  return (
    <div 
      className={`flex-1 overflow-y-auto p-4 md:p-12 max-w-7xl mx-auto w-full relative pb-40 transition-colors duration-1000 ${lang === 'ar' ? 'rtl' : 'ltr'} ${shake ? 'animate-shake' : ''} ${isVortexActive ? 'bg-orange-950/20' : ''}`} 
      ref={containerRef}
    >
      {flash && <div className="fixed inset-0 z-[120] bg-white pointer-events-none opacity-90 transition-opacity duration-300" />}
      
      <div className="mb-16">
        <h1 className="text-5xl font-bold mb-4 flex items-center gap-5 font-orbitron tracking-tighter">
          <ChefHat className="text-orange-500 w-12 h-12" /> {t.food}
        </h1>
        <p className="text-slate-500 text-xl font-light">Precision alchemy for your leftover ingredients.</p>
      </div>

      {!meals.length && !loading && (
        <div className="bg-slate-900/50 border border-slate-800 p-12 rounded-[60px] mb-20 shadow-2xl relative overflow-hidden backdrop-blur-3xl animate-in fade-in zoom-in duration-500">
          <div className="absolute top-0 right-0 w-80 h-80 bg-orange-500/10 blur-[120px] -mr-40 -mt-40 rounded-full" />
          <div className="flex flex-col md:flex-row gap-6 relative z-10">
            <input
              type="text"
              value={ingredients}
              onChange={(e) => setIngredients(e.target.value)}
              placeholder={t.ingredientsPlaceholder}
              className="flex-1 bg-slate-950 border-2 border-slate-800 text-slate-100 rounded-[35px] px-10 py-8 focus:outline-none focus:border-orange-500/50 text-2xl transition-all shadow-inner"
            />
            <button
              onClick={handleSuggest}
              disabled={loading || !ingredients.trim()}
              className="bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 disabled:opacity-50 text-white font-black px-16 py-8 rounded-[35px] flex items-center justify-center gap-4 transition-all shadow-3xl active:scale-95 group overflow-hidden relative"
            >
              <Zap className="w-10 h-10 relative z-10 animate-pulse" /> 
              <span className="relative z-10 uppercase tracking-widest text-xl">Ignite</span>
            </button>
          </div>
          <p className="mt-8 text-slate-500 text-sm italic opacity-50">Separate ingredients by commas for best atomic results.</p>
        </div>
      )}

      {isVortexActive && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center pointer-events-none overflow-hidden">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-3xl" />
          
          <div className="relative w-full h-full flex items-center justify-center">
            {ingredientTags.map((tag, idx) => (
              <div 
                key={idx}
                className="absolute bg-gradient-to-r from-orange-500 to-amber-400 text-white px-10 py-5 rounded-full font-black shadow-2xl animate-vortex border border-white/40 backdrop-blur-md text-2xl whitespace-nowrap"
                style={{ 
                  left: '50%', 
                  top: '50%',
                  marginTop: '-30px',
                  marginLeft: '-70px',
                  animationDelay: `${idx * 0.05}s`,
                  '--tw-translate-x': `${(Math.random() - 0.5) * 1800}px`,
                  '--tw-translate-y': `${(Math.random() - 0.5) * 1800}px`
                } as any}
              >
                {tag.trim()}
              </div>
            ))}
            
            <div className="relative w-[700px] h-[700px] flex items-center justify-center">
                <div className="absolute inset-0 bg-orange-600/40 rounded-full blur-[250px] animate-pulse" />
                <div className="w-[500px] h-[500px] border-[70px] border-amber-500/5 border-t-amber-500 border-l-orange-500 rounded-full animate-spin transition-all duration-[1s] shadow-[0_0_150px_rgba(245,158,11,0.6)]" />
                <div className="absolute w-[380px] h-[380px] border-[40px] border-orange-600/10 border-b-orange-600 border-r-amber-400 rounded-full animate-spin transition-all duration-[2s] reverse" style={{ animationDirection: 'reverse' }} />
                
                <div className="absolute bg-white p-12 rounded-full shadow-[0_0_100px_white]">
                    <ChefHat className="w-28 h-28 text-orange-600 animate-bounce" />
                </div>
            </div>
          </div>
        </div>
      )}

      {meals.length > 0 && !loading && (
        <div className="space-y-32">
            <div className="flex flex-col items-center mb-16 animate-in fade-in slide-in-from-top-10 duration-700">
               <div className="bg-amber-500/10 border border-amber-500/30 px-16 py-8 rounded-[40px] flex flex-col items-center gap-4 text-amber-500 shadow-3xl backdrop-blur-xl">
                  <Trophy className="w-16 h-16 mb-2 animate-bounce" />
                  <h2 className="text-4xl font-black font-orbitron uppercase tracking-[0.4em] text-center">
                     {meals.length} Unique Realities Transmuted
                  </h2>
               </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
              {meals.map((meal, i) => (
                <div 
                  key={i} 
                  className="premium-card-reveal bg-slate-900 border border-slate-800 rounded-[60px] overflow-hidden shadow-2xl group transition-all duration-700 hover:border-orange-500/40 flex flex-col"
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  <div className="h-[350px] relative overflow-hidden">
                    <img src={meal.imageUrl} alt={meal.name} className="w-full h-full object-cover transition-transform duration-[3s] group-hover:scale-110" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
                    <div className="absolute top-8 left-8 bg-black/60 backdrop-blur-2xl px-6 py-2 rounded-2xl border border-white/10 flex items-center gap-3">
                      <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                      <span className="text-white font-black text-xs uppercase tracking-[0.2em]">Atomic Tier</span>
                    </div>
                  </div>
                  
                  <div className="p-12 flex-1 flex flex-col">
                    <div className="mb-10">
                      <h3 className="text-4xl font-black text-slate-100 leading-tight mb-4 group-hover:text-orange-400 transition-colors">{meal.name}</h3>
                      <div className="h-1.5 w-24 bg-orange-600 rounded-full transition-all group-hover:w-48" />
                    </div>
                    
                    <div className="space-y-6 flex-1">
                      {meal.steps.map((step: string, j: number) => (
                        <div key={j} className="flex gap-6 items-start group/step">
                          <div className="shrink-0 w-10 h-10 rounded-xl bg-orange-600/10 text-orange-400 text-lg font-black flex items-center justify-center border border-orange-500/20 group-hover/step:bg-orange-500 group-hover/step:text-white transition-all duration-300">
                            {j + 1}
                          </div>
                          <p className="text-slate-300 leading-relaxed pt-1 text-lg font-medium group-hover/step:text-slate-100 transition-colors">{step}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex flex-col items-center gap-10 pt-20 animate-in fade-in duration-1000">
               <button 
                 onClick={() => {
                   setMeals([]);
                   setIngredients('');
                 }} 
                 className="px-20 py-8 bg-slate-800 hover:bg-slate-700 text-white font-black rounded-[50px] transition-all flex items-center gap-4 border border-slate-700 shadow-3xl hover:scale-105 active:scale-95"
               >
                 <Utensils className="w-8 h-8" /> RE-ALCHEMIZE
               </button>
            </div>
        </div>
      )}
    </div>
  );
};

export default FoodPage;
