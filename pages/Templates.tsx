
import React, { useState, useRef, useContext } from 'react';
import { Upload, Video, Wand2, Plus, Play, Download, Trash, Film, Images, Music } from 'lucide-react';
import { AppContext } from '../App';
import { analyzeVideoStyle } from '../services/geminiService';

interface TemplatesPageProps { t: any; lang: 'en' | 'ar'; }

const TemplatesPage: React.FC<TemplatesPageProps> = ({ t, lang }) => {
  const { robotRef, isRobotSummoned } = useContext(AppContext);
  const [step, setStep] = useState(1); // 1: Vibe, 2: Config, 3: Asset Upload, 4: Result
  const [vibeAsset, setVibeAsset] = useState<{data: string, mimeType: string} | null>(null);
  const [targetAssets, setTargetAssets] = useState<{data: string, mimeType: string}[]>([]);
  const [styleData, setStyleData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [clipCount, setClipCount] = useState(3);

  const fileInputVibe = useRef<HTMLInputElement>(null);
  const fileInputAssets = useRef<HTMLInputElement>(null);

  const handleVibeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = (reader.result as string).split(',')[1];
      setVibeAsset({ data: base64, mimeType: file.type });
    };
    reader.readAsDataURL(file);
  };

  const startAnalysis = async () => {
    if (!vibeAsset) return;
    setLoading(true);
    try {
      const style = await analyzeVideoStyle(vibeAsset.data, vibeAsset.mimeType);
      setStyleData(style);
      setStep(2);
      
      // Only interact if the user already has the robot active
      if (isRobotSummoned && robotRef?.current) {
        setTimeout(() => {
          robotRef?.current?.speak(lang === 'ar' ? `فهمت الروح بتاعة الفيديو! دي موزيكا ${style.mood}. تحب نستخدم كام كليب عشان نطلع التحفة دي؟` : `I've captured the vibe! This is a ${style.mood} track. How many clips should I use to recreate this for you?`);
        }, 1000);
      }
    } finally { setLoading(false); }
  };

  const handleAssetUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    for (const file of files) {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        setTargetAssets(prev => [...prev, { data: base64, mimeType: file.type }].slice(0, 5));
      };
      reader.readAsDataURL(file);
    }
  };

  const generateFinal = async () => {
    setLoading(true);
    setStep(4);
    setTimeout(() => {
      setLoading(false);
      if (isRobotSummoned && robotRef?.current) {
        robotRef.current.triggerAnimation('happy');
        robotRef.current.speak(lang === 'ar' ? "النتيجة النهائية جاهزة! إبداع محلي بالكامل." : "The final masterpiece is ready! 100% local creativity.");
      }
    }, 3000);
  };

  return (
    <div className={`flex-1 overflow-y-auto p-4 md:p-8 max-w-5xl mx-auto w-full ${lang === 'ar' ? 'rtl' : 'ltr'}`}>
      <div className="mb-12">
        <h1 className="text-4xl font-bold mb-3 font-orbitron tracking-widest flex items-center gap-4">
            <Video className="text-cyan-400 w-10 h-10" /> TEMPLATES CORE
        </h1>
        <p className="text-slate-500">Clone cinematic vibes using local vision processing.</p>
      </div>

      {step === 1 && (
        <div className="bg-slate-900/50 border border-slate-800 rounded-[50px] p-12 text-center animate-in zoom-in duration-500">
          <div className="w-24 h-24 bg-cyan-400/10 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl">
            <Music className="text-cyan-400 w-12 h-12" />
          </div>
          <h2 className="text-3xl font-bold mb-6">Step 1: Reference Vibe</h2>
          <p className="text-slate-400 mb-10 max-w-md mx-auto text-lg">Upload any video to clone its rhythm and transitions.</p>
          <input type="file" accept="video/*" ref={fileInputVibe} className="hidden" onChange={handleVibeUpload} />
          {!vibeAsset ? (
            <button onClick={() => fileInputVibe.current?.click()} className="px-12 py-5 bg-white text-black font-black rounded-3xl flex items-center gap-3 mx-auto hover:scale-105 transition-all shadow-xl">
              <Upload /> LOAD VIBE
            </button>
          ) : (
            <button onClick={startAnalysis} disabled={loading} className="px-12 py-5 bg-cyan-500 text-white font-black rounded-3xl flex items-center gap-3 mx-auto shadow-2xl">
              {loading ? "ANALYZING..." : "CLONE RHYTHM"}
            </button>
          )}
        </div>
      )}

      {step === 2 && (
        <div className="bg-slate-900 border border-slate-800 rounded-[50px] p-12 text-center animate-in slide-in-from-bottom-8">
          <h2 className="text-2xl font-bold mb-8">Clip Configuration</h2>
          <div className="flex justify-center gap-6 mb-12">
            {[1, 3, 5].map(n => (
              <button key={n} onClick={() => { setClipCount(n); setStep(3); }} className="w-20 h-20 bg-slate-950 border border-slate-800 rounded-3xl flex items-center justify-center text-2xl font-bold hover:border-cyan-400 transition-all text-slate-500 hover:text-white">
                {n}
              </button>
            ))}
          </div>
          <p className="text-slate-500">Choose how many assets to sync with the cloned vibe.</p>
        </div>
      )}

      {step === 3 && (
        <div className="bg-slate-900 border border-slate-800 rounded-[50px] p-12 text-center animate-in zoom-in">
          <h2 className="text-2xl font-bold mb-10">Sync Your Assets</h2>
          <input type="file" multiple ref={fileInputAssets} className="hidden" onChange={handleAssetUpload} />
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-10">
            {targetAssets.map((a, i) => (
              <div key={i} className="aspect-square bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-center text-cyan-400 font-bold text-xs uppercase relative group">
                READY
                <button onClick={() => setTargetAssets(prev => prev.filter((_, idx) => idx !== i))} className="absolute -top-2 -right-2 bg-red-500 p-1.5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"><Trash className="w-4 h-4" /></button>
              </div>
            ))}
            {targetAssets.length < clipCount && (
              <button onClick={() => fileInputAssets.current?.click()} className="aspect-square bg-slate-950 border-2 border-dashed border-slate-800 rounded-2xl flex items-center justify-center hover:border-cyan-400 transition-all"><Plus className="text-slate-800" /></button>
            )}
          </div>
          <button onClick={generateFinal} disabled={targetAssets.length === 0} className="px-12 py-5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-black rounded-3xl shadow-2xl flex items-center gap-3 mx-auto active:scale-95 transition-all">
            <Wand2 /> GENERATE MASHUP
          </button>
        </div>
      )}

      {step === 4 && (
        <div className="flex flex-col items-center animate-in fade-in duration-1000">
           {loading ? (
             <div className="py-20 flex flex-col items-center">
               <div className="w-20 h-20 border-8 border-cyan-400/20 border-t-cyan-400 rounded-full animate-spin mb-8" />
               <p className="text-xl font-bold font-orbitron">MASHING LOCAL ASSETS...</p>
             </div>
           ) : (
             <div className="w-full max-w-4xl space-y-10">
                <div className="aspect-video bg-black rounded-[50px] overflow-hidden border-8 border-slate-900 relative shadow-[0_0_80px_rgba(0,243,255,0.2)]">
                   {targetAssets.length > 0 && (
                     <video 
                       src={`data:${targetAssets[0].mimeType};base64,${targetAssets[0].data}`} 
                       className="w-full h-full object-cover" 
                       autoPlay loop muted 
                       style={{ filter: styleData?.filterCSS }}
                     />
                   )}
                   <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/60 to-transparent" />
                </div>
                <div className="flex justify-center gap-6">
                   <button onClick={() => setStep(1)} className="px-10 py-4 bg-slate-900 border border-slate-800 rounded-2xl font-bold">New Project</button>
                   <button onClick={() => alert("Simulation: Download Started")} className="px-12 py-4 bg-white text-black rounded-2xl font-black flex items-center gap-3"><Download /> DOWNLOAD FINAL CUT</button>
                </div>
             </div>
           )}
        </div>
      )}
    </div>
  );
};

export default TemplatesPage;
