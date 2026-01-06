
import React, { useState, useRef, useContext } from 'react';
import { Upload, Sparkles, Download, Trash, Zap, Image as ImageIcon } from 'lucide-react';
import { AppContext } from '../App';

interface HDLabProps { t: any; lang: 'en' | 'ar'; }

const HDLabPage: React.FC<HDLabProps> = ({ t, lang }) => {
  const { isRobotSummoned, robotRef } = useContext(AppContext);
  const [image, setImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const enhanceToHD = () => {
    if (!image || !canvasRef.current) return;
    setIsProcessing(true);
    
    if (isRobotSummoned && robotRef?.current) {
        robotRef.current.speak(lang === 'ar' ? "سيبلي الطلعة دي، هصلحلك جودة الصورة في ثانية!" : "Processing your image for peak HD quality now!");
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.src = image;
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      
      // Sharpening Filter (Convolution Matrix)
      const weights = [
        0, -1, 0,
        -1, 5, -1,
        0, -1, 0
      ];
      
      const imageData = ctx?.getImageData(0, 0, canvas.width, canvas.height);
      if (imageData) {
        const side = Math.round(Math.sqrt(weights.length));
        const halfSide = Math.floor(side / 2);
        const src = imageData.data;
        const sw = canvas.width;
        const sh = canvas.height;
        const output = ctx?.createImageData(sw, sh);
        const dst = output?.data;

        for (let y = 0; y < sh; y++) {
          for (let x = 0; x < sw; x++) {
            const dstOff = (y * sw + x) * 4;
            let r = 0, g = 0, b = 0;
            for (let cy = 0; cy < side; cy++) {
              for (let cx = 0; cx < side; cx++) {
                const scy = y + cy - halfSide;
                const scx = x + cx - halfSide;
                if (scy >= 0 && scy < sh && scx >= 0 && scx < sw) {
                  const srcOff = (scy * sw + scx) * 4;
                  const wt = weights[cy * side + cx];
                  r += src[srcOff] * wt;
                  g += src[srcOff + 1] * wt;
                  b += src[srcOff + 2] * wt;
                }
              }
            }
            if (dst) {
                // Apply a factor for contrast enhancement
                const factor = 1.15; 
                dst[dstOff] = factor * (r - 128) + 128;
                dst[dstOff + 1] = factor * (g - 128) + 128;
                dst[dstOff + 2] = factor * (b - 128) + 128;
                dst[dstOff + 3] = src[dstOff + 3];
            }
          }
        }
        if (output) ctx?.putImageData(output, 0, 0);
      }
      
      const enhanced = canvas.toDataURL('image/jpeg', 1.0);
      setImage(enhanced);
      
      setTimeout(() => {
        setIsProcessing(false);
        if (isRobotSummoned && robotRef?.current) {
            robotRef.current.triggerAnimation('happy');
            robotRef.current.speak(lang === 'ar' ? "العملية تمت! الصورة دلوقتي أوضح بكتير." : "HD Enhancement complete! Your image is ready.");
        }
      }, 1500);
    };
  };

  return (
    <div className={`flex-1 h-[calc(100vh-64px)] overflow-y-auto p-4 md:p-8 ${lang === 'ar' ? 'rtl' : 'ltr'}`}>
      <div className="max-w-4xl mx-auto w-full pb-24">
        <canvas ref={canvasRef} className="hidden" />
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-3 font-orbitron tracking-widest flex items-center gap-4">
              <Sparkles className="text-emerald-400 w-10 h-10" /> HD IMAGE LAB
          </h1>
          <p className="text-slate-500">Apply professional sharpening and neural contrast boosts to any photo.</p>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 rounded-[50px] p-8 md:p-12 text-center animate-in zoom-in duration-500 shadow-2xl backdrop-blur-3xl mb-8">
          {!image ? (
            <div className="py-20 flex flex-col items-center">
              <div className="w-24 h-24 bg-emerald-400/10 rounded-3xl flex items-center justify-center mb-8">
                <ImageIcon className="text-emerald-400 w-12 h-12" />
              </div>
              <h2 className="text-2xl font-bold mb-4">Start Enhancing</h2>
              <p className="text-slate-500 mb-10 max-w-xs mx-auto">Upload a low-quality or blurry photo to see the magic happen.</p>
              <input type="file" accept="image/*" onChange={handleUpload} className="hidden" id="hd-upload" />
              <label htmlFor="hd-upload" className="px-12 py-5 bg-white text-black font-black rounded-3xl flex items-center gap-3 cursor-pointer hover:scale-105 transition-all shadow-xl">
                <Upload className="w-5 h-5" /> LOAD PHOTO
              </label>
            </div>
          ) : (
            <div className="space-y-10">
              <div className="relative group max-w-2xl mx-auto rounded-3xl overflow-hidden border-4 border-slate-800 shadow-2xl bg-black flex items-center justify-center">
                 <img src={image} className={`max-w-full h-auto object-contain transition-all duration-700 ${isProcessing ? 'blur-xl grayscale animate-pulse' : ''}`} alt="Workspace" />
                 {isProcessing && (
                   <div className="absolute inset-0 flex items-center justify-center">
                      <Zap className="w-16 h-16 text-emerald-400 animate-ping" />
                   </div>
                 )}
              </div>
              
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                 {!isProcessing && (
                   <>
                     <button onClick={enhanceToHD} className="px-10 py-5 bg-emerald-500 text-white font-black rounded-3xl flex items-center justify-center gap-3 hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-500/20">
                        <Sparkles className="w-5 h-5" /> ENHANCE TO HD
                     </button>
                     <a href={image} download="chatty-hd-enhanced.jpg" className="px-10 py-5 bg-white text-black font-black rounded-3xl flex items-center justify-center gap-3 shadow-xl">
                        <Download className="w-5 h-5" /> DOWNLOAD
                     </a>
                     <button onClick={() => setImage(null)} className="px-10 py-5 bg-red-500/10 text-red-500 font-bold rounded-3xl border border-red-500/20">
                        <Trash className="w-5 h-5" />
                     </button>
                   </>
                 )}
                 {isProcessing && <div className="text-emerald-400 font-orbitron animate-pulse">OPTIMIZING PIXELS...</div>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HDLabPage;
