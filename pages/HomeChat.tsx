
import React, { useState, useRef, useEffect, useContext } from 'react';
import { Send, Bot, User, PlusCircle, Mic, StopCircle, Rocket, Trash } from 'lucide-react';
import { chatWithAI, generateSoraVideo } from '../services/geminiService';
import { Message, ChatSession } from '../types';
import { AppContext } from '../App';

interface HomeChatProps { t: any; lang: 'en' | 'ar'; }

const HomeChat: React.FC<HomeChatProps> = ({ t, lang }) => {
  const { isRobotSummoned, isDarkMode, robotRef } = useContext(AppContext);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [uploadedAsset, setUploadedAsset] = useState<{data: string, type: 'image' | 'video'} | null>(null);
  
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Core Fix: Targeted Auto-Scroll for Local Container
  const scrollToBottom = (force = false) => {
    if (chatContainerRef.current) {
      const { scrollHeight, clientHeight } = chatContainerRef.current;
      chatContainerRef.current.scrollTo({
        top: scrollHeight - clientHeight,
        behavior: force ? 'auto' : 'smooth'
      });
    }
  };

  // MutationObserver to watch for any DOM changes in chat and scroll
  useEffect(() => {
    const observer = new MutationObserver(() => scrollToBottom());
    if (chatContainerRef.current) {
      observer.observe(chatContainerRef.current, { childList: true, subtree: true });
    }
    return () => observer.disconnect();
  }, []);

  // Initial session setup
  useEffect(() => {
    const saved = localStorage.getItem('chat_sessions');
    if (saved) {
      const parsed = JSON.parse(saved);
      setSessions(parsed);
      if (parsed.length > 0) {
        setActiveSessionId(parsed[0].id);
      } else {
        createNewSession();
      }
    } else {
      createNewSession();
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.lang = lang === 'ar' ? 'ar-EG' : 'en-US';
      recognitionRef.current.onresult = (event: any) => {
        setInput(prev => prev + event.results[0][0].transcript);
        setIsListening(false);
      };
      recognitionRef.current.onend = () => setIsListening(false);
    }
  }, [lang]);

  // Save sessions whenever they change
  useEffect(() => {
    if (sessions.length > 0) {
      localStorage.setItem('chat_sessions', JSON.stringify(sessions));
    }
  }, [sessions]);

  const activeSession = sessions.find(s => s.id === activeSessionId);

  const createNewSession = () => {
    const newSession: ChatSession = { 
      id: Date.now().toString(), 
      title: t.newChat, 
      messages: [], 
      createdAt: Date.now() 
    };
    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
  };

  const extractUrls = (text: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return Array.from(new Set(text.match(urlRegex) || []));
  };

  const handleSend = async (overrideInput?: string) => {
    const messageContent = (overrideInput || input).trim();
    if (!messageContent && !uploadedAsset) return;
    if (isTyping || !activeSessionId) return;
    
    const content = uploadedAsset ? `${messageContent}\n[Attached ${uploadedAsset.type}]` : messageContent;
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content, timestamp: Date.now() };
    
    // Immediately update local state so message appears
    setSessions(prev => prev.map(s => 
      s.id === activeSessionId ? { ...s, messages: [...s.messages, userMsg] } : s
    ));
    
    setInput('');
    setUploadedAsset(null);
    setIsTyping(true);
    
    // Small delay to ensure the DOM has updated before we scroll
    setTimeout(scrollToBottom, 50);

    const isArabic = /[\u0600-\u06FF]/.test(messageContent);
    const isVideoRequest = messageContent.toLowerCase().includes('video') || messageContent.toLowerCase().includes('فيديو');
    
    try {
      if (isVideoRequest) {
        if (isRobotSummoned && robotRef?.current) {
          robotRef.current.triggerAnimation('spin');
          robotRef.current.speak(isArabic ? "حاضر! جاري البحث." : "Searching for video.");
        }
        const videoUrl = await generateSoraVideo(messageContent);
        const assistantMsg: Message = { id: (Date.now() + 1).toString(), role: 'assistant', content: videoUrl, timestamp: Date.now() };
        setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, messages: [...s.messages, assistantMsg] } : s));
        setIsTyping(false);
      } else {
        const fullResponseText = await chatWithAI([...(activeSession?.messages || []), userMsg], isArabic ? "تحدث بالعربية بلهجة مصرية." : "Speak in natural English.");
        const assistantMsgId = (Date.now() + 1).toString();
        
        // Add empty assistant message
        const initialAssistantMsg: Message = { id: assistantMsgId, role: 'assistant', content: '', timestamp: Date.now() };
        setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, messages: [...s.messages, initialAssistantMsg] } : s));
        
        if (isRobotSummoned && robotRef?.current && fullResponseText) {
          robotRef.current.speak(fullResponseText);
        }

        // Stream text for better UX
        const chunks = fullResponseText.split(' ');
        let streamedText = '';
        for (let i = 0; i < chunks.length; i++) {
          streamedText += (i === 0 ? '' : ' ') + chunks[i];
          setSessions(prev => prev.map(s => s.id === activeSessionId ? {
            ...s,
            messages: s.messages.map(m => m.id === assistantMsgId ? { ...m, content: streamedText } : m)
          } : s));
          await new Promise(resolve => setTimeout(resolve, 20));
        }
        setIsTyping(false);
      }
    } catch (err) { 
      setIsTyping(false); 
    }
  };

  return (
    <div className={`flex-1 flex flex-col h-[calc(100vh-64px)] ${isDarkMode ? 'bg-[#121212]' : 'bg-white'} overflow-hidden relative`}>
      <div 
        ref={chatContainerRef} 
        className="flex-1 overflow-y-auto flex flex-col p-4 md:p-8 space-y-10 pb-[160px] scroll-smooth"
      >
        {!activeSession || activeSession.messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center opacity-10 py-40">
            <Bot className="w-48 h-48 mb-6" />
            <p className="text-4xl font-bold font-orbitron tracking-[0.6em] uppercase">{t.appName}</p>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto w-full space-y-12">
            {activeSession.messages.map((msg) => {
              const urls = extractUrls(msg.content);
              const isMedia = msg.content.includes('.mp4') || msg.content.includes('pixabay.com') || msg.content.includes('pexels.com');
              return (
                <div key={msg.id} className={`flex items-start gap-5 ${msg.role === 'user' ? 'flex-row-reverse' : ''} animate-in fade-in slide-in-from-bottom-4 duration-300`}>
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${msg.role === 'assistant' ? 'bg-slate-200 text-slate-700' : 'bg-slate-700 text-white'}`}>
                    {msg.role === 'assistant' ? <Bot className="w-6 h-6" /> : <User className="w-6 h-6" />}
                  </div>
                  <div className={`relative max-w-[85%] px-6 py-5 rounded-[28px] shadow-sm ${msg.role === 'user' ? (isDarkMode ? 'bg-slate-700 text-white border border-slate-600' : 'bg-slate-100 text-black border border-slate-200') : (isDarkMode ? 'bg-zinc-800 text-slate-100 border border-zinc-700' : 'bg-slate-50 text-slate-900 border border-slate-200')}`}>
                    {isMedia ? (
                      <video src={urls[0] || msg.content} className="w-full rounded-2xl shadow-lg" controls autoPlay loop muted playsInline />
                    ) : (
                      <div className="space-y-4">
                        <p className="whitespace-pre-wrap leading-relaxed text-lg">{msg.content}</p>
                        {urls.length > 0 && (
                          <div className="mt-4 pt-4 border-t border-slate-400/10 flex flex-col gap-3">
                            {urls.map((url, i) => (
                              <button key={i} onClick={() => window.open(url, '_blank')} className="w-full flex items-center justify-center gap-4 px-6 py-4 rounded-[20px] font-black transition-all shadow-lg active:scale-95 bg-white text-slate-900 border-2 border-slate-200 group">
                                <Rocket className="w-6 h-6 text-emerald-500 group-hover:animate-bounce" /> Open Project in New Tab
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {isTyping && (
          <div className="max-w-4xl mx-auto w-full flex gap-3 animate-pulse px-2">
            <div className="w-8 h-8 rounded-full bg-slate-400/20" />
            <div className="flex gap-1.5 py-4 items-center">
              <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
              <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]" />
              <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]" />
            </div>
          </div>
        )}
      </div>

      <div className={`fixed bottom-0 left-0 right-0 p-4 md:p-8 z-30 ${isDarkMode ? 'bg-gradient-to-t from-zinc-900 via-zinc-900 to-transparent' : 'bg-gradient-to-t from-white via-white to-transparent'}`}>
        <div className="max-w-4xl mx-auto relative">
          <div className={`flex items-end gap-3 p-3 rounded-[35px] border-2 shadow-2xl transition-colors ${isDarkMode ? 'bg-zinc-800 border-white/10' : 'bg-white border-slate-200'}`}>
            <button 
              onClick={() => fileInputRef.current?.click()} 
              className="p-3 text-slate-500 hover:text-emerald-500 transition-colors"
            >
              <PlusCircle className="w-7 h-7" />
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*,video/*" 
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onloadend = () => setUploadedAsset({ data: reader.result as string, type: file.type.startsWith('video') ? 'video' : 'image' });
                  reader.readAsDataURL(file);
                }
              }} 
            />
            <textarea 
              value={input} 
              onChange={(e) => setInput(e.target.value)} 
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())} 
              placeholder={t.typeAMessage} 
              className="flex-1 bg-transparent border-none text-lg py-3 focus:outline-none resize-none max-h-40" 
              rows={1} 
            />
            <div className="flex gap-2">
              <button 
                onClick={() => { if(isListening) recognitionRef.current?.stop(); else { recognitionRef.current?.start(); setIsListening(true); }}} 
                className={`p-3 rounded-full transition-all ${isListening ? 'bg-red-500 text-white animate-pulse' : 'text-slate-500'}`}
              >
                {isListening ? <StopCircle className="w-7 h-7" /> : <Mic className="w-7 h-7" />}
              </button>
              <button 
                onClick={() => handleSend()} 
                disabled={(!input.trim() && !uploadedAsset) || isTyping} 
                className={`p-3.5 rounded-3xl transition-all ${input.trim() || uploadedAsset ? "bg-emerald-500 text-white shadow-lg" : "bg-slate-700 text-slate-400"}`}
              >
                <Send className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeChat;
