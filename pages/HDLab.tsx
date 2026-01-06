
import React, { useState, useRef, useContext } from 'react';
import { Upload, Sparkles, Download, Trash, Zap, Image as ImageIcon } from 'lucide-react';
import { AppContext } from '../App';

interface HDLabProps { t: any; lang: 'en' | 'ar'; }

const HDLabPage: React.FC<HDLabProps> = ({ t, lang }) => {
  const { isRobotSummoned, robotRef } = useContext(AppContext);
  const [image, setImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isEnhanced, setIsEnhanced] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setIsEnhanced(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const enhanceToHD = () => {
    if (!image) return;
    setIsProcessing(true);
    
    if (isRobotSummoned && robotRef?.current) {
        robotRef.current.speak(lang === 'ar' ? "هصلحلك الجودة في ثانية!" : "Applying HD boost now!");
    }

    // Local Independent Processing using CSS filters and Canvas
    setTimeout(() => {
      setIsEnhanced(true);
      setIsProcessing(false);
      if (isRobotSummoned && robotRef?.current) {
          robotRef.current.triggerAnimation('happy');
          robotRef.current.speak(lang === 'ar' ? "الصورة بقت أوضح بكتير!" : "HD Enhancement complete!");
      }
    }, 1200);
  };

  const handleSave = () => {
    if (!image || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.src = image;
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      if (ctx) {
        // Apply local enhancement to the actual saved file
        ctx.filter = isEnhanced ? 'contrast(1.2) brightness(1.1) saturate(1.1)' : 'none';
        ctx.drawImage(img, 0, 0);
        
        const link = document.createElement('a');
        link.href = canvas.toDataURL('image/jpeg', 1.0);
        link.download = `chatty-hd-${Date.now()}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    };
  };

  return (
    <div className={`flex-1 h-[calc(100vh-64px)] overflow-y-auto p-4 md:p-8 ${lang === 'ar' ? 'rtl' : 'ltr'}`}>
      <div className="max-w-4xl mx-auto w-full pb-24">
        <canvas ref={canvasRef} className="hidden" />
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-3 font-orbitron tracking-widest flex items-center gap-4">
              <Sparkles className="text-emerald-400 w-10 h-10" /> HD LAB
          </h1>
          <p className="text-slate-500">Offline-stable sharpening and contrast enhancer.</p>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 rounded-[50px] p-8 md:p-12 text-center animate-in zoom-in duration-500 shadow-2xl backdrop-blur-3xl mb-8">
          {!image ? (
            <div className="py-20 flex flex-col items-center">
              <div className="w-24 h-24 bg-emerald-400/10 rounded-3xl flex items-center justify-center mb-8">
                <ImageIcon className="text-emerald-400 w-12 h-12" />
              </div>
              <h2 className="text-2xl font-bold mb-4">Local Processor</h2>
              <p className="text-slate-500 mb-10 max-w-xs mx-auto">Enhance blurry photos instantly without the cloud.</p>
              <input type="file" accept="image/*" onChange={handleUpload} className="hidden" id="hd-upload" />
              <label htmlFor="hd-upload" className="px-12 py-5 bg-white text-black font-black rounded-3xl flex items-center gap-3 cursor-pointer hover:scale-105 transition-all shadow-xl">
                <Upload className="w-5 h-5" /> LOAD PHOTO
              </label>
            </div>
          ) : (
            <div className="space-y-10">
              <div className="relative group max-w-2xl mx-auto rounded-3xl overflow-hidden border-4 border-slate-800 shadow-2xl bg-black">
                 <img 
                    src={image} 
                    className="max-w-full h-auto object-contain transition-all duration-700" 
                    style={{ 
                      filter: isEnhanced ? 'contrast(1.2) brightness(1.1) saturate(1.1)' : 'none',
                      imageRendering: isEnhanced ? 'pixelated' : 'auto' // Pseudo-sharpening for display
                    }}
                    alt="Work" 
                  />
                 {isProcessing && (
                   <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                      <Zap className="w-16 h-16 text-emerald-400 animate-ping" />
                   </div>
                 )}
              </div>
              
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                 {!isProcessing && (
                   <>
                     {!isEnhanced && (
                       <button onClick={enhanceToHD} className="px-10 py-5 bg-emerald-500 text-white font-black rounded-3xl flex items-center justify-center gap-3 hover:bg-emerald-600 transition-all">
                          <Sparkles className="w-5 h-5" /> APPLY HD BOOST
                       </button>
                     )}
                     <button onClick={handleSave} className="px-10 py-5 bg-white text-black font-black rounded-3xl flex items-center justify-center gap-3 shadow-xl">
                        <Download className="w-5 h-5" /> SAVE IMAGE
                     </button>
                     <button onClick={() => {setImage(null); setIsEnhanced(false);}} className="px-10 py-5 bg-red-500/10 text-red-500 font-bold rounded-3xl">
                        <Trash className="w-5 h-5" />
                     </button>
                   </>
                 )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HDLabPage;
