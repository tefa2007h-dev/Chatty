
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { X } from 'lucide-react';
import React, { forwardRef, useContext, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { AppContext } from '../App';

interface SummonOverlayProps { active: boolean; onClose: () => void; lang: 'en' | 'ar'; t: any; }

function decode(base64: string) {
  const bString = atob(base64);
  const bytes = new Uint8Array(bString.length);
  for (let i = 0; i < bString.length; i++) bytes[i] = bString.charCodeAt(i);
  return bytes;
}

async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
  }
  return buffer;
}

const cleanTextForSpeech = (text: string) => {
  return text
    // Remove Markdown headers, bold, italic
    .replace(/[*#_`~>]/g, '') 
    // Remove links [text](url) keeping only text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') 
    // Remove raw URLs
    .replace(/https?:\/\/\S+/g, '') 
    // Remove generic brackets
    .replace(/[\[\]\(\)\{\}]/g, '')
    // Remove hyphens used for lists
    .replace(/^\s*-\s+/gm, '') 
    // Collapse multiple spaces
    .replace(/\s+/g, ' ')
    .trim();
};

const RobotCharacter = ({ isSpeaking, status, volume, isSpinning, isHappy, onClick }: { isSpeaking: boolean, status: string, volume: number, isSpinning?: boolean, isHappy?: boolean, onClick: () => void }) => {
  const [eyeFocus, setEyeFocus] = useState({ x: 0, y: 0 });
  const [expression, setExpression] = useState<'default' | 'happy' | 'thinking'>('default');

  useEffect(() => {
    if (status.includes('THINKING')) setExpression('thinking');
    else if (isHappy || isSpeaking) setExpression('happy');
    else setExpression('default');
  }, [status, isHappy, isSpeaking]);

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      setEyeFocus({ x: (e.clientX / window.innerWidth - 0.5) * 10, y: (e.clientY / window.innerHeight - 0.5) * 6 });
    };
    window.addEventListener('mousemove', handleMove);
    return () => window.removeEventListener('mousemove', handleMove);
  }, []);

  const mouthPath = () => {
    if (isSpeaking) {
      const v = Math.min(volume * 60, 25);
      const w = 20 + volume * 15;
      return `M${160-w} 200 Q160 ${200+v*1.5} ${160+w} 200 Q160 ${200-v*0.5} ${160-w} 200`;
    }
    return expression === 'happy' ? "M140 200 Q160 215 180 200" : "M145 200 Q160 205 175 200";
  };

  return (
    <div className={`relative transition-all duration-700 cursor-pointer ${isSpinning ? 'animate-teleport' : 'hovering-robot'}`} onClick={onClick}>
      <svg width="400" height="420" viewBox="0 0 400 420" fill="none" className="drop-shadow-2xl">
        <defs>
          <linearGradient id="whiteBody" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#F8FAFC" />
          </linearGradient>
          <linearGradient id="roseGold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#E5B1A1" />
            <stop offset="100%" stopColor="#D99688" />
          </linearGradient>
        </defs>

        {/* Arms */}
        <path d="M100 240 Q60 260 70 340" stroke="url(#roseGold)" strokeWidth="14" fill="none" strokeLinecap="round" />
        <path d="M220 240 Q260 260 250 340" stroke="url(#roseGold)" strokeWidth="14" fill="none" strokeLinecap="round" />

        {/* Torso */}
        <path d="M100 240C100 240 85 280 85 340C85 400 120 410 160 410C200 410 235 400 235 340C235 280 220 240 220 240H100Z" fill="url(#whiteBody)" />
        <path d="M140 280 H180" stroke="#E2E8F0" strokeWidth="2" strokeLinecap="round" opacity="0.5" />

        {/* Head */}
        <path d="M160 60C110 60 75 100 75 150C75 200 110 240 160 240C210 240 245 200 245 150C245 100 210 60 160 60Z" fill="url(#whiteBody)" />
        <path d="M90 135C90 135 110 120 160 120C210 120 230 135 230 135C230 135 240 165 230 195C220 225 160 230 160 230C160 230 100 225 90 195C80 165 90 135 90 135Z" fill="#1A1A1A" />
        
        {/* Blush */}
        <circle cx="110" cy="185" r="8" fill="#E5B1A1" fillOpacity="0.2" />
        <circle cx="210" cy="185" r="8" fill="#E5B1A1" fillOpacity="0.2" />

        {/* Eyes */}
        <g className="transition-all duration-300">
           <ellipse cx="125" cy="160" rx="16" ry="18" fill="white" className="blink-eye" />
           <circle cx={125 + eyeFocus.x} cy={160 + eyeFocus.y} r="6" fill="#121212" />
           <ellipse cx="195" cy="160" rx="16" ry="18" fill="white" className="blink-eye" />
           <circle cx={195 + eyeFocus.x} cy={160 + eyeFocus.y} r="6" fill="#121212" />
        </g>

        {/* Mouth */}
        <path d={mouthPath()} stroke="url(#roseGold)" strokeWidth="4" strokeLinecap="round" className="transition-all duration-75" />
      </svg>
      <div className="w-80 h-10 bg-slate-400/10 blur-3xl rounded-full mt-4" style={{ transform: `scaleX(${1 + volume})` }} />
    </div>
  );
};

export const SummonOverlay = forwardRef<any, SummonOverlayProps>(({ active, onClose, lang, t }, ref) => {
  const { isSpeaking, setIsSpeaking } = useContext(AppContext);
  const [status, setStatus] = useState('OFFLINE');
  const [isSpinning, setIsSpinning] = useState(false);
  const [isHappy, setIsHappy] = useState(false);

  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const outCtx = useRef<AudioContext | null>(null);
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null);

  useImperativeHandle(ref, () => ({
    triggerAnimation: (type: string) => { 
      if(type === 'spin') { 
        setIsSpinning(true); 
        setTimeout(()=>setIsSpinning(false), 800); 
      } else { 
        setIsHappy(true); 
        setTimeout(()=>setIsHappy(false), 2000); 
      } 
    },
    speak: (text: string, overrideLang?: 'en' | 'ar') => {
      // 1. Clean the text (remove markdown symbols)
      const cleanText = cleanTextForSpeech(text);
      const targetLang = overrideLang || lang;

      // 2. Cancel any active speech
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.lang = targetLang === 'ar' ? 'ar-EG' : 'en-US';
        utterance.pitch = 1.1; 
        utterance.rate = 1.0;

        // 3. Try to find a good female voice
        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = voices.find(v => 
          v.lang.includes(targetLang === 'ar' ? 'ar' : 'en') && 
          (v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Female'))
        );
        if (preferredVoice) utterance.voice = preferredVoice;

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);
        
        window.speechSynthesis.speak(utterance);
      }
    }
  }));

  useEffect(() => {
    if (active) startLive();
    else stopLive();
    return () => stopLive();
  }, [active]);

  const startLive = async () => {
    try {
      const apiKey = localStorage.getItem('chatty_api_key') || process.env.API_KEY;
      const ai = new GoogleGenAI({ apiKey: apiKey as string });
      outCtx.current = new AudioContext({ sampleRate: 24000 });
      
      sessionPromiseRef.current = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => setStatus('CONNECTION ACTIVE'),
          onmessage: async (msg: LiveServerMessage) => {
            const audio = msg.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (audio && outCtx.current) {
              window.speechSynthesis.cancel(); // Prioritize Live Audio
              setIsSpeaking(true);
              const buffer = await decodeAudioData(decode(audio), outCtx.current, 24000, 1);
              const src = outCtx.current.createBufferSource();
              src.buffer = buffer;
              src.connect(outCtx.current.destination);
              src.onended = () => setIsSpeaking(false);
              src.start();
            }
          },
          onerror: (err: any) => {
             console.error("Live API Error:", err);
             if (err?.message?.includes('429')) setStatus("I'm resting my brain for a moment!");
             else setStatus('OFFLINE');
          },
          onclose: () => setStatus('OFFLINE')
        },
        config: { 
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } }
        }
      });
    } catch (e) { 
      console.error("Start Live Error:", e);
      setStatus("RESTING BRAIN..."); 
    }
  };

  const stopLive = () => {
    if (sessionPromiseRef.current) {
      sessionPromiseRef.current.then(session => session.close());
      sessionPromiseRef.current = null;
    }
    if (outCtx.current) {
      outCtx.current.close();
      outCtx.current = null;
    }
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
  };

  if (!active) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-[#0c0c0c] flex flex-col items-center justify-center animate-teleport">
      <button onClick={onClose} className="absolute top-8 right-8 p-4 text-white/30 hover:text-white"><X className="w-8 h-8" /></button>
      <div className="absolute top-16 text-center">
        <h2 className="font-orbitron text-white text-5xl font-black tracking-[0.5em]">CHATTY</h2>
        <p className="text-emerald-500 text-xs mt-2 uppercase tracking-widest">{status}</p>
      </div>
      <RobotCharacter isSpeaking={isSpeaking} status={status} volume={isSpeaking ? 0.3 : 0} isSpinning={isSpinning} isHappy={isHappy} onClick={() => setIsHappy(true)} />
      <div className="mt-12 w-full max-w-xs flex items-end justify-center gap-2 h-16">
        {[...Array(12)].map((_, i) => (
          <div key={i} className="w-2 rounded-full transition-all duration-75" style={{ height: isSpeaking ? `${5 + Math.random() * 60}px` : '4px', backgroundColor: '#E5B1A1' }} />
        ))}
      </div>
    </div>
  );
});

export default SummonOverlay;
