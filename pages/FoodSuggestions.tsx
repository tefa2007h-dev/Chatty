
import React, { useState, useContext, useRef } from 'react';
import { Utensils, ChefHat, Sparkles, Star, Trophy, Zap, X, Globe, Eye } from 'lucide-react';
import { suggestFood } from '../services/geminiService';
import { AppContext } from '../App';
import { Logo } from '../components/Sidebar';

interface FoodPageProps { t: any; lang: 'en' | 'ar'; }

const FoodPage: React.FC<FoodPageProps> = ({ t, lang }) => {
  const { robotRef, isRobotSummoned } = useContext(AppContext);
  const [ingredients, setIngredients] = useState('');
  const [meals, setMeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState<any | null>(null);
  
  const handleSuggest = async () => {
    if (!ingredients.trim()) return;
    setLoading(true);
    setMeals([]);
    
    if (isRobotSummoned) {
      robotRef?.current?.triggerAnimation('spin');
      robotRef?.current?.speak(lang === 'ar' ? "ثواني وهفجرلك المطبخ بأكلات عالمية!" : "Prepare for a global culinary tour!");
    }

    try {
      const res = await suggestFood(ingredients, lang);
      setMeals(res);
      setLoading(false);
      
      if (isRobotSummoned) {
          robotRef?.current?.triggerAnimation('happy');
          robotRef?.current?.speak(lang === 'ar' ? "اتفضل يا باشا، أطباق من كل حتة في العالم." : "Bon Appétit! Here are some international masterpieces.");
      }
    } catch (err) {
      setLoading(false); 
    }
  };

  const getFoodImage = (name: string) => {
    return `https://image.pollinations.ai/prompt/professional Michelin star food photography of ${encodeURIComponent(name)}, 8k resolution, cinematic lighting, photorealistic?width=800&height=600&nologo=true&seed=${Math.random()}`;
  };

  return (
    <div className={`flex-1 overflow-y-auto p-4 md:p-12 max-w-7xl mx-auto w-full relative pb-40 ${lang === 'ar' ? 'rtl' : 'ltr'}`}>
      
      {/* Huge Header Branding with Updated Logo */}
      <div className="flex flex-col items-center justify-center mb-16 pt-8 animate-in fade-in zoom-in duration-700">
         <div className="bg-black/5 dark:bg-white/5 p-8 rounded-[40px] shadow-2xl mb-6 transform hover:scale-105 transition-transform duration-500 border border-white/10">
             <div className="flex flex-col items-center gap-6">
                 <Logo size="xl" className="drop-shadow-[0_0_20px_rgba(0,255,200,0.3)]" />
                 <span className="font-orbitron font-black text-4xl dark:text-white text-black tracking-widest">CHATTY AI</span>
             </div>
         </div>
         <h1 className="text-4xl md:text-6xl font-black text-center font-orbitron tracking-tighter bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">
           ULTIMATE ALCHEMY
         </h1>
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
          <div className="mt-8 flex items-center justify-center gap-4 text-slate-500 text-sm italic opacity-50">
             <Globe className="w-4 h-4" /> <span>Searching International Databases...</span>
          </div>
        </div>
      )}

      {loading && (
          <div className="flex flex-col items-center justify-center py-20">
              <div className="w-24 h-24 border-8 border-orange-500 border-t-transparent rounded-full animate-spin mb-8" />
              <p className="text-2xl font-bold text-orange-500 font-orbitron animate-pulse">COOKING MAGIC...</p>
          </div>
      )}

      {meals.length > 0 && !loading && (
        <div className="space-y-32">
            <div className="flex flex-col items-center mb-16 animate-in fade-in slide-in-from-top-10 duration-700">
               <div className="bg-amber-500/10 border border-amber-500/30 px-16 py-8 rounded-[40px] flex flex-col items-center gap-4 text-amber-500 shadow-3xl backdrop-blur-xl">
                  <Trophy className="w-16 h-16 mb-2 animate-bounce" />
                  <h2 className="text-4xl font-black font-orbitron uppercase tracking-[0.4em] text-center">
                     Global Menu Ready
                  </h2>
               </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
              {meals.map((meal, i) => {
                const imgUrl = getFoodImage(meal.name);
                return (
                  <div 
                    key={i} 
                    className="bg-slate-900 border border-slate-800 rounded-[60px] overflow-hidden shadow-2xl group transition-all duration-700 hover:border-orange-500/40 flex flex-col"
                  >
                    <div className="h-[400px] relative overflow-hidden">
                      <img src={imgUrl} alt={meal.name} className="w-full h-full object-cover transition-transform duration-[3s] group-hover:scale-110" />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
                      <div className="absolute top-8 left-8 bg-black/60 backdrop-blur-2xl px-6 py-2 rounded-2xl border border-white/10 flex items-center gap-3">
                        <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                        <span className="text-white font-black text-xs uppercase tracking-[0.2em]">{meal.cuisine || 'International'}</span>
                      </div>
                    </div>
                    
                    <div className="p-12 flex-1 flex flex-col">
                      <div className="mb-10">
                        <h3 className="text-4xl font-black text-slate-100 leading-tight mb-4 group-hover:text-orange-400 transition-colors">{meal.name}</h3>
                        <div className="h-1.5 w-24 bg-orange-600 rounded-full transition-all group-hover:w-48" />
                      </div>
                      
                      <div className="mt-auto">
                        <button 
                            onClick={() => setSelectedMeal({...meal, imageUrl: imgUrl})}
                            className="w-full py-5 bg-white text-black font-black rounded-3xl text-xl flex items-center justify-center gap-3 hover:bg-orange-50 transition-colors shadow-lg"
                        >
                            <Eye className="w-6 h-6" /> VIEW RECIPE
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="flex justify-center pt-20">
               <button 
                 onClick={() => { setMeals([]); setIngredients(''); }} 
                 className="px-20 py-8 bg-slate-800 hover:bg-slate-700 text-white font-black rounded-[50px] transition-all flex items-center gap-4 border border-slate-700 shadow-3xl"
               >
                 <Utensils className="w-8 h-8" /> RE-ALCHEMIZE
               </button>
            </div>
        </div>
      )}

      {/* View Recipe Modal */}
      {selectedMeal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setSelectedMeal(null)} />
            <div className="relative bg-slate-900 w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-[40px] border border-slate-700 shadow-2xl animate-in zoom-in duration-300">
                <div className="h-80 relative">
                    <img src={selectedMeal.imageUrl} className="w-full h-full object-cover" />
                    <button 
                        onClick={() => setSelectedMeal(null)} 
                        className="absolute top-6 right-6 w-12 h-12 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white hover:text-black transition-all"
                    >
                        <X className="w-6 h-6" />
                    </button>
                    <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-slate-900 to-transparent">
                        <h2 className="text-4xl font-black text-white">{selectedMeal.name}</h2>
                        <span className="text-amber-400 font-bold uppercase tracking-widest mt-2 block">{selectedMeal.cuisine} • {selectedMeal.difficulty}</span>
                    </div>
                </div>
                <div className="p-10">
                    <h3 className="text-2xl font-bold mb-6 flex items-center gap-3 text-orange-500">
                        <ChefHat className="w-8 h-8" /> Preparation Steps
                    </h3>
                    <div className="space-y-6">
                        {selectedMeal.steps.map((step: string, idx: number) => (
                            <div key={idx} className="flex gap-6">
                                <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-orange-500 font-bold text-xl shrink-0 border border-slate-700">
                                    {idx + 1}
                                </div>
                                <p className="text-lg text-slate-300 leading-relaxed pt-2">{step}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default FoodPage;
