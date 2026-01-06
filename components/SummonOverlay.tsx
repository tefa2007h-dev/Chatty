
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { X } from 'lucide-react';
import React, { forwardRef, useContext, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { AppContext } from '../App';

interface SummonOverlayProps {
  active: boolean;
  onClose: () => void;
  lang: 'en' | 'ar';
  t: any;
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
  return bytes;
}

function encode(bytes: Uint8Array) {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
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

const RobotCharacter = ({ isSpeaking, isListening, status, volume, isSpinning, isHappy, onClick }: { isSpeaking: boolean, isListening: boolean, status: string, volume: number, isSpinning?: boolean, isHappy?: boolean, onClick: () => void }) => {
  const [expression, setExpression] = useState<'default' | 'happy' | 'thinking' | 'surprised' | 'winking' | 'caring'>('default');
  const [eyeFocus, setEyeFocus] = useState({ x: 0, y: 0 });
  
  useEffect(() => {
    if (status.includes('THINKING')) setExpression('thinking');
    else if (status.includes('HELP') || status.includes('CARE')) setExpression('caring');
    else if (isHappy || status.includes('TALKING') || status.includes('RESPONDING')) setExpression('happy');
    else if (status === 'SURPRISED') setExpression('surprised');
    else setExpression('default');
  }, [status, isHappy]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const rect = document.body.getBoundingClientRect();
      const x = ((e.clientX / rect.width) - 0.5) * 8;
      const y = ((e.clientY / rect.height) - 0.5) * 5;
      setEyeFocus({ x, y });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    const blinkInterval = setInterval(() => {
      if (!isSpeaking && expression === 'default' && Math.random() > 0.4) {
        setExpression('winking');
        setTimeout(() => setExpression('default'), 200);
      }
    }, 4500);
    return () => clearInterval(blinkInterval);
  }, [isSpeaking, expression]);

  const getMouthPath = () => {
    if (expression === 'surprised') return "M145 200 A 15 15 0 1 0 175 200 A 15 15 0 1 0 145 200";
    if (isSpeaking) {
      // Dynamic mouth opening based on volume
      const v = Math.min(volume * 65, 30);
      const w = 22 + volume * 18;
      return `M${160-w} ${200-v/3} Q160 ${205+v*1.1} ${160+w} ${200-v/3} Q160 ${215+v*1.6} ${160-w} ${200-v/3}`;
    }
    if (expression === 'happy') return "M135 195 Q160 220 185 195";
    if (expression === 'thinking') return "M148 202 L172 198";
    if (expression === 'caring') return "M142 205 Q160 215 178 205";
    return "M140 198 Q160 206 180 198";
  };

  return (
    <div 
      className={`hovering-robot relative flex flex-col items-center transition-all duration-700 cursor-pointer group ${isSpinning ? 'animate-teleport' : ''}`} 
      style={{ transformOrigin: 'bottom center' }}
      onClick={onClick}
    >
      <svg width="400" height="420" viewBox="0 0 400 420" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-2xl overflow-visible">
        <defs>
          <linearGradient id="silverBody" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="80%" stopColor="#F1F5F9" />
            <stop offset="100%" stopColor="#CBD5E1" />
          </linearGradient>
          <linearGradient id="accentSlate" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#94A3B8" />
            <stop offset="100%" stopColor="#475569" />
          </linearGradient>
          <filter id="cheekGlow">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        <g className="transition-transform duration-500" style={{ transform: isSpeaking ? `translateY(${Math.sin(Date.now()/150)*8}px)` : 'none' }}>
           <path d="M90 260 Q30 280 50 350" stroke="white" strokeWidth="18" strokeLinecap="round" fill="none" />
           <path d="M85 260 Q35 275 45 330" stroke="url(#accentSlate)" strokeWidth="6" strokeLinecap="round" fill="none" opacity="0.6" />
           <circle cx="50" cy="350" r="14" fill="#E2E8F0" />
           <path d="M230 260 Q290 280 270 350" stroke="white" strokeWidth="18" strokeLinecap="round" fill="none" />
           <path d="M235 260 Q285 275 275 330" stroke="url(#accentSlate)" strokeWidth="6" strokeLinecap="round" fill="none" opacity="0.6" />
           <circle cx="270" cy="350" r="14" fill="#E2E8F0" />
        </g>

        <path d="M100 240C100 240 80 280 80 340C80 400 120 410 160 410C200 410 240 400 240 340C240 280 220 240 220 240L100 240Z" fill="url(#silverBody)" />
        <path d="M120 300 Q160 315 200 300" stroke="url(#accentSlate)" strokeWidth="2" opacity="0.3" fill="none" />
        
        <circle cx="160" cy="315" r={8 + volume * 75} fill="#00f3ff" fillOpacity={0.1 + volume * 0.7} filter="url(#cheekGlow)">
          <animate attributeName="opacity" values="0.1;0.5;0.1" dur="2s" repeatCount="indefinite" />
        </circle>

        <g>
          <path d="M160 60C110 60 70 100 70 150C70 200 110 240 160 240C210 240 250 200 250 150C250 100 210 60 160 60Z" fill="url(#silverBody)" />
          <path d="M85 130C85 130 110 115 160 115C210 115 235 130 235 130C235 130 245 160 235 190C225 220 160 225 160 225C160 225 95 220 85 190C75 160 85 130 85 130Z" fill="#111111" />
          
          <g style={{ opacity: isHappy || isSpeaking ? 0.4 : 0.08 }} className="transition-opacity duration-1000">
            <circle cx="115" cy="185" r="10" fill="#CBD5E1" filter="url(#cheekGlow)" />
            <circle cx="205" cy="185" r="10" fill="#CBD5E1" filter="url(#cheekGlow)" />
          </g>

          <g className="transition-all duration-300" style={{ transform: expression === 'thinking' ? 'translateY(-4px) translateX(6px)' : 'none' }}>
            <g style={{ transformOrigin: '125px 160px', transform: expression === 'winking' ? 'scaleY(0.1)' : 'none' }}>
              <ellipse cx="125" cy="160" rx="18" ry={expression === 'surprised' ? "26" : "20"} fill="#CBD5E1" className="blink-eye" />
              <circle cx={125 + eyeFocus.x} cy={160 + eyeFocus.y} r="7" fill="#121212" />
              <circle cx={123 + eyeFocus.x} cy={157 + eyeFocus.y} r="3" fill="#FFFFFF" opacity="0.9" />
              <path d="M105 150 Q112 140 120 145" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" />
            </g>
            <g style={{ transformOrigin: '195px 160px' }}>
              <ellipse cx="195" cy="160" rx="18" ry={expression === 'surprised' ? "26" : "20"} fill="#CBD5E1" className="blink-eye" />
              <circle cx={195 + eyeFocus.x} cy={160 + eyeFocus.y} r="7" fill="#121212" />
              <circle cx={193 + eyeFocus.x} cy={157 + eyeFocus.y} r="3" fill="#FFFFFF" opacity="0.9" />
              <path d="M215 150 Q208 140 200 145" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" />
            </g>
          </g>

          <path 
            d={getMouthPath()} 
            stroke="#94A3B8" 
            strokeWidth="5" 
            fill={isSpeaking ? "#94A3B815" : "none"} 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            className="transition-all duration-100"
          />

          <g className="transition-all duration-500" style={{ transform: expression === 'thinking' ? 'translateY(-10px) rotate(-10deg)' : expression === 'surprised' ? 'translateY(-15px)' : 'none', transformOrigin: 'center' }}>
            <path d="M100 130 Q125 115 150 130" stroke="#94A3B8" strokeWidth="3" strokeLinecap="round" opacity="0.8" />
            <path d="M170 130 Q195 115 220 130" stroke="#94A3B8" strokeWidth="3" strokeLinecap="round" opacity="0.8" />
          </g>
        </g>
        <rect x="140" y="235" width="40" height="15" rx="8" fill="url(#accentSlate)" opacity="0.7" />
      </svg>
      <div className="w-80 h-12 bg-slate-500/10 blur-[60px] rounded-full mt-6 transition-all duration-300" style={{ opacity: isSpeaking || isListening ? 1 : 0.2, transform: `scaleX(${1.2 + volume})` }} />
    </div>
  );
};

export const SummonOverlay = forwardRef<any, SummonOverlayProps>(({ active, onClose, lang, t }, ref) => {
  const { isSpeaking, setIsSpeaking } = useContext(AppContext);
  const [isListening, setIsListening] = useState(false);
  const [status, setStatus] = useState('OFFLINE');
  const [currentVolume, setCurrentVolume] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [isHappy, setIsHappy] = useState(false);

  const audioCtxOut = useRef<AudioContext | null>(null);
  const audioCtxIn = useRef<AudioContext | null>(null);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const sessionRef = useRef<any>(null);
  const nextStartTimeRef = useRef<number>(0);
  const outputAnalyserRef = useRef<AnalyserNode | null>(null);
  const inputAnalyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number>(0);

  useImperativeHandle(ref, () => ({
    triggerAnimation: (type: 'spin' | 'happy') => {
      if (type === 'spin') { setIsSpinning(true); setTimeout(() => setIsSpinning(false), 1200); }
      else if (type === 'happy') { setIsHappy(true); setTimeout(() => setIsHappy(false), 3000); }
    },
    speak: (text: string) => { 
      if (sessionRef.current) {
        setStatus('THINKING...');
        sessionRef.current.sendRealtimeInput({ text }); 
      }
    }
  }));

  useEffect(() => {
    if (active) {
      startLive();
      return () => stopEverything();
    } else { stopEverything(); }
  }, [active]);

  const startLive = async () => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
      audioCtxOut.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      const outNode = audioCtxOut.current.createGain();
      outNode.connect(audioCtxOut.current.destination);
      outputAnalyserRef.current = audioCtxOut.current.createAnalyser();
      outNode.connect(outputAnalyserRef.current);
      outputAnalyserRef.current.fftSize = 256;

      audioCtxIn.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            setIsListening(true);
            setStatus('LISTENING...');
            setIsSpinning(true); setTimeout(() => setIsSpinning(false), 800);

            const source = audioCtxIn.current!.createMediaStreamSource(stream);
            const scriptNode = audioCtxIn.current!.createScriptProcessor(4096, 1, 1);
            inputAnalyserRef.current = audioCtxIn.current!.createAnalyser();
            source.connect(inputAnalyserRef.current);
            scriptNode.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const int16 = new Int16Array(inputData.length);
              let sum = 0;
              for (let i = 0; i < inputData.length; i++) {
                int16[i] = inputData[i] * 32768;
                sum += Math.abs(inputData[i]);
              }
              const avg = sum / inputData.length;
              if (avg > 0.05 && isSpeaking) stopPlayback();
              sessionPromise.then(s => s.sendRealtimeInput({ media: { data: encode(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' } }));
            };
            source.connect(scriptNode);
            scriptNode.connect(audioCtxIn.current!.destination);
          },
          onmessage: async (msg: LiveServerMessage) => {
            const audioData = msg.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (audioData) {
              setIsSpeaking(true);
              setStatus('RESPONDING...');
              const ctx = audioCtxOut.current!;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
              const buffer = await decodeAudioData(decode(audioData), ctx, 24000, 1);
              const src = ctx.createBufferSource();
              src.buffer = buffer;
              src.connect(outNode);
              src.onended = () => {
                sourcesRef.current.delete(src);
                if (sourcesRef.current.size === 0) {
                   setIsSpeaking(false);
                   setStatus(isListening ? 'LISTENING...' : 'READY');
                }
              };
              src.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
              sourcesRef.current.add(src);
            }
          },
          onclose: () => {
            setIsListening(false);
            setStatus('OFFLINE');
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { 
            // Kore used for a high-quality female profile
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } 
          },
          systemInstruction: "You are Chatty. A highly expressive, witty, and charming female robot assistant with a Pixar-style face. You speak flawless Egyptian Arabic and English. Your personality is helpful, slightly playful, and warm. Respond in the language of the user. If they speak Egyptian Arabic, use Egyptian Arabic. If they speak English, use natural English. Stop talking immediately if interrupted.",
        }
      });
      sessionRef.current = await sessionPromise;
      
      const animateStatus = () => {
        let vol = 0;
        const target = isSpeaking ? outputAnalyserRef.current : inputAnalyserRef.current;
        if (target) {
          const data = new Uint8Array(target.frequencyBinCount);
          target.getByteFrequencyData(data);
          // Normalized volume for animation
          vol = data.reduce((a, b) => a + b) / data.length / (isSpeaking ? 80 : 150);
        }
        setCurrentVolume(Math.min(vol, 1));
        animFrameRef.current = requestAnimationFrame(animateStatus);
      };
      animFrameRef.current = requestAnimationFrame(animateStatus);
    } catch (err) { setIsListening(false); setStatus('ERROR'); }
  };

  const stopPlayback = () => {
    for (const s of sourcesRef.current) try { s.stop(); } catch(e) {}
    sourcesRef.current.clear();
    nextStartTimeRef.current = 0; setIsSpeaking(false);
  };

  const stopEverything = () => {
    stopPlayback();
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    sessionRef.current?.close();
    if (audioCtxIn.current && audioCtxIn.current.state !== 'closed') audioCtxIn.current.close().catch(() => {});
    if (audioCtxOut.current && audioCtxOut.current.state !== 'closed') audioCtxOut.current.close().catch(() => {});
    audioCtxIn.current = null; audioCtxOut.current = null;
    setIsSpeaking(false); setIsListening(false); setStatus('OFFLINE');
  };

  if (!active) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-[#0c0c0c] flex flex-col items-center justify-center pointer-events-auto animate-teleport overflow-hidden">
      <div className="absolute inset-0 bg-ambient bg-gradient-to-tr from-slate-400/5 via-transparent to-slate-200/5 pointer-events-none" />
      <button onClick={onClose} className="absolute top-8 right-8 p-4 text-white/30 hover:text-white transition-all bg-white/5 hover:bg-white/10 rounded-full backdrop-blur-lg border border-white/10 shadow-2xl group"><X className="w-8 h-8 group-hover:rotate-90 transition-transform" /></button>
      
      <div className="absolute top-16 text-center animate-in fade-in slide-in-from-top-4 duration-1000">
        <h2 className="font-orbitron text-white text-6xl font-black tracking-[0.8em] mb-2 drop-shadow-[0_0_25px_rgba(203,213,225,0.1)]">CHATTY</h2>
        <div className="h-1 w-48 bg-gradient-to-r from-transparent via-slate-500/30 to-transparent mx-auto opacity-40" />
      </div>

      <RobotCharacter 
        isSpeaking={isSpeaking} 
        isListening={isListening} 
        status={status} 
        volume={currentVolume} 
        isSpinning={isSpinning} 
        isHappy={isHappy} 
        onClick={() => setIsHappy(true)}
      />
      
      <div className="mt-16 text-center relative">
        <div className={`text-[16px] uppercase tracking-[0.6em] font-orbitron font-bold transition-all duration-300 ${status.includes('LISTENING') ? 'text-cyan-400 animate-pulse' : status.includes('TALKING') || status.includes('RESPONDING') ? 'text-slate-300' : 'text-slate-500'}`}>
          {status}
        </div>
      </div>

      <div className="absolute bottom-12 w-full max-w-lg flex items-end justify-center gap-3 h-32 px-10">
        {[...Array(24)].map((_, i) => {
          const intensity = Math.max(0.05, currentVolume * (1.2 + Math.sin(i * 0.4) * 0.4));
          return (
            <div 
              key={i} 
              className="w-2.5 bg-slate-400 rounded-full transition-all duration-75 shadow-[0_0_15px_rgba(148,163,184,0.3)]" 
              style={{ 
                height: isListening || isSpeaking ? `${8 + intensity * 140}px` : '6px', 
                opacity: isListening || isSpeaking ? 0.2 + intensity * 0.8 : 0.05, 
                boxShadow: intensity > 0.5 ? '0 0 25px #94a3b8' : 'none' 
              }} 
            />
          );
        })}
      </div>
    </div>
  );
});

export default SummonOverlay;
