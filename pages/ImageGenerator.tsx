
import React, { useState } from 'react';
import { Image as ImageIcon, Sparkles, Download, History } from 'lucide-react';
import { generateImage } from '../services/geminiService';
import { GeneratedImage } from '../types';

interface ImageGenProps { t: any; lang: 'en' | 'ar'; }

const ImageGeneratorPage: React.FC<ImageGenProps> = ({ t, lang }) => {
  const [prompt, setPrompt] = useState('');
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<GeneratedImage[]>(() => {
    const h = localStorage.getItem('image_history');
    return h ? JSON.parse(h) : [];
  });

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    try {
      const url = await generateImage(prompt);
      if (url) {
        setCurrentImage(url);
        const newImg: GeneratedImage = {
          id: Date.now().toString(),
          url,
          prompt,
          timestamp: Date.now()
        };
        const updated = [newImg, ...history];
        setHistory(updated);
        localStorage.setItem('image_history', JSON.stringify(updated));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 max-w-5xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{t.imageGen}</h1>
        <p className="text-slate-400">Imagine anything and Chatty AI will bring it to life.</p>
      </div>

      <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl mb-12 shadow-xl">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="A futuristic city with flying cars in cyberpunk style..."
              className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-2xl pl-6 pr-14 py-4 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
            <ImageIcon className={`absolute top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 ${lang === 'ar' ? 'left-6' : 'right-6'}`} />
          </div>
          <button
            onClick={handleGenerate}
            disabled={loading || !prompt.trim()}
            className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 disabled:opacity-50 text-white font-bold px-10 py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95"
          >
            {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Sparkles className="w-5 h-5" />}
            {t.generate}
          </button>
        </div>
      </div>

      {loading && (
        <div className="bg-slate-900 aspect-square md:aspect-video rounded-3xl flex flex-col items-center justify-center animate-pulse border-2 border-dashed border-slate-800 mb-12">
          <Sparkles className="w-12 h-12 text-emerald-500 mb-4 animate-spin-slow" />
          <p className="text-slate-500 font-medium">Brewing your masterpiece...</p>
        </div>
      )}

      {currentImage && !loading && (
        <div className="mb-12 group relative">
          <div className="bg-slate-900 p-2 rounded-3xl shadow-2xl overflow-hidden border border-slate-800">
            <img src={currentImage} alt="Generated" className="w-full h-auto rounded-2xl" />
          </div>
          <div className="absolute top-6 right-6 flex gap-3">
             <a href={currentImage} download="chatty-ai-image.png" className="p-3 bg-white/10 backdrop-blur-md rounded-xl text-white hover:bg-white/20 transition-all">
                <Download className="w-6 h-6" />
             </a>
          </div>
          <div className="absolute bottom-6 left-6 right-6 p-6 bg-black/40 backdrop-blur-md rounded-2xl border border-white/10">
            <p className="text-sm text-white/90 font-medium italic">"{prompt}"</p>
          </div>
        </div>
      )}

      {history.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <History className="text-slate-500" />
            Generation History
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {history.map((img) => (
              <div key={img.id} className="bg-slate-900 border border-slate-800 p-1.5 rounded-2xl hover:scale-105 transition-all cursor-pointer group">
                <div className="relative aspect-square rounded-xl overflow-hidden">
                  <img src={img.url} alt={img.prompt} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity p-4 flex flex-col justify-end">
                    <p className="text-[10px] text-white line-clamp-2 mb-2">{img.prompt}</p>
                    <a href={img.url} download className="bg-emerald-500 text-white p-1 rounded-md text-[10px] text-center">Download</a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageGeneratorPage;
