
import React, { useState, useRef, useEffect, useContext } from 'react';
import { Send, Bot, User, PlusCircle, Mic, StopCircle, Rocket, Image as ImageIcon, Video, Trash } from 'lucide-react';
import { chatWithAI, generateSoraVideo } from '../services/geminiService';
import { Message, ChatSession } from '../types';
import { AppContext } from '../App';

interface HomeChatProps {
  t: any;
  lang: 'en' | 'ar';
}

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

  // THE GLOBAL SCROLL HAMMER: Absolute forced scroll
  const scrollHammer = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  };

  // MutationObserver for real-time auto-scroll as messages are typed or added
  useEffect(() => {
    const chatContainer = chatContainerRef.current;
    if (!chatContainer) return;
    
    const observer = new MutationObserver(() => {
      scrollHammer();
    });
    
    observer.observe(chatContainer, { 
      childList: true, 
      subtree: true, 
      characterData: true 
    });
    
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('chat_sessions');
    if (saved) {
      const parsed = JSON.parse(saved);
      setSessions(parsed);
      if (parsed.length > 0) setActiveSessionId(parsed[0].id);
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

  useEffect(() => {
    if (sessions.length > 0) localStorage.setItem('chat_sessions', JSON.stringify(sessions));
    scrollHammer();
  }, [sessions]);

  const activeSession = sessions.find(s => s.id === activeSessionId);

  const createNewSession = () => {
    const newSession: ChatSession = { id: Date.now().toString(), title: t.newChat, messages: [], createdAt: Date.now() };
    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
  };

  const extractUrls = (text: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.match(urlRegex) || [];
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedAsset({
          data: reader.result as string,
          type: file.type.startsWith('video') ? 'video' : 'image'
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSend = async (overrideInput?: string) => {
    const messageContent = overrideInput || input;
    if (!messageContent.trim() && !uploadedAsset) return;
    if (isTyping || !activeSessionId) return;
    
    const content = uploadedAsset 
      ? `${messageContent}\n[Attached ${uploadedAsset.type === 'video' ? 'Video' : 'Image'}]` 
      : messageContent;
      
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content, timestamp: Date.now() };
    setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, messages: [...s.messages, userMsg] } : s));
    setInput('');
    setUploadedAsset(null);
    setIsTyping(true);

    const isArabic = /[\u0600-\u06FF]/.test(messageContent);
    const isVideoRequest = messageContent.toLowerCase().includes('video') || messageContent.toLowerCase().includes('فيديو');
    
    try {
      if (isVideoRequest) {
        if (isRobotSummoned && robotRef?.current) {
          robotRef.current.triggerAnimation('spin');
          robotRef.current.speak(isArabic ? "حاضر! جاري البحث عن أفضل لقطة سينمائية ليك." : "Searching for the perfect cinematic shot for you.");
        }
        const videoUrl = await generateSoraVideo(messageContent);
        const assistantMsg: Message = { id: (Date.now() + 1).toString(), role: 'assistant', content: videoUrl, timestamp: Date.now() };
        setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, messages: [...s.messages, assistantMsg] } : s));
        setIsTyping(false);
      } else {
        const fullResponseText = await chatWithAI([...(activeSession?.messages || []), userMsg], isArabic ? "تحدث بالعربية بلهجة مصرية." : "Speak in natural, helpful English.");
        const assistantMsgId = (Date.now() + 1).toString();
        const initialAssistantMsg: Message = { id: assistantMsgId, role: 'assistant', content: '', timestamp: Date.now() };
        setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, messages: [...s.messages, initialAssistantMsg] } : s));
        
        if (isRobotSummoned && robotRef?.current && fullResponseText) {
          robotRef.current.speak(fullResponseText);
        }

        const chunks = fullResponseText.split(' ');
        let streamedText = '';
        for (let i = 0; i < chunks.length; i++) {
          streamedText += (i === 0 ? '' : ' ') + chunks[i];
          setSessions(prev => prev.map(s => s.id === activeSessionId ? {
            ...s,
            messages: s.messages.map(m => m.id === assistantMsgId ? { ...m, content: streamedText } : m)
          } : s));
          await new Promise(resolve => setTimeout(resolve, 30));
        }
        setIsTyping(false);
      }
    } catch (err) { 
      setIsTyping(false);
    }
  };

  const openLinkExternal = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className={`flex-1 flex flex-col h-[calc(100vh-64px)] ${isDarkMode ? 'bg-[#121212]' : 'bg-white'} overflow-hidden relative`}>
      <div 
        ref={chatContainerRef} 
        className="chat-messages-container flex-1 overflow-y-auto flex flex-col p-4 md:p-8 space-y-10"
        style={{ paddingBottom: '160px' }}
      >
        {!activeSession || activeSession.messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center opacity-5 py-40">
            <Bot className="w-48 h-48 mb-6" />
            <p className="text-4xl font-bold font-orbitron tracking-[0.6em] uppercase">{t.appName}</p>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto w-full space-y-12">
            {activeSession.messages.map((msg) => {
              const urls = extractUrls(msg.content);
              const aiStudioLink = urls.find(u => u.includes('aistudio.google.com'));

              return (
                <div key={msg.id} className={`flex items-start gap-5 ${msg.role === 'user' ? 'flex-row-reverse' : ''} animate-in fade-in slide-in-from-bottom-4 duration-500`}>
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${msg.role === 'assistant' ? 'bg-slate-200 text-slate-700' : 'bg-slate-700 text-white'}`}>
                    {msg.role === 'assistant' ? <Bot className="w-6 h-6" /> : <User className="w-6 h-6" />}
                  </div>
                  <div className={`relative max-w-[85%] px-6 py-5 rounded-[28px] shadow-sm ${msg.role === 'user' ? (isDarkMode ? 'bg-[#212121] text-white border border-white/5' : 'bg-slate-100 text-black border border-slate-200') : (isDarkMode ? 'bg-slate-800/40 text-slate-100 border border-slate-700' : 'bg-slate-50 text-slate-900 border border-slate-200')}`}>
                    {msg.content.includes('.mp4') || msg.content.includes('pixabay.com') || msg.content.includes('pexels.com') || (msg.content.includes('[Attached Video]')) ? (
                      <div className="rounded-[40px] overflow-hidden border-4 border-slate-400/20 shadow-2xl bg-black aspect-video relative group">
                        {/* If it's a URL from grounding or an uploaded base64 video */}
                        {msg.content.includes('[Attached Video]') ? (
                           <div className="p-4 text-xs text-slate-500 italic">Video processing complete...</div>
                        ) : (
                          <video src={extractUrls(msg.content)[0] || msg.content} className="w-full h-full object-cover" controls autoPlay loop muted playsInline />
                        )}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <p className="whitespace-pre-wrap leading-relaxed prose prose-sm dark:prose-invert max-w-none text-lg">{msg.content}</p>
                        
                        {aiStudioLink && (
                          <div className="mt-6 pt-4 border-t border-slate-400/10 flex justify-center">
                            <button 
                              onClick={() => openLinkExternal(aiStudioLink)}
                              className="w-full flex items-center justify-center gap-4 px-10 py-5 bg-white text-slate-900 rounded-[30px] font-black text-xl transition-all shadow-[0_20px_40px_rgba(0,0,0,0.3)] active:scale-95 border-2 border-slate-200 group"
                            >
                              <Rocket className="w-8 h-8 text-emerald-500 group-hover:animate-bounce" />
                              🚀 Launch Project in New Tab
                            </button>
                          </div>
                        )}

                        {urls.length > 0 && !aiStudioLink && (
                          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-400/10">
                            {urls.map((url, i) => (
                              <button 
                                key={i} 
                                onClick={() => openLinkExternal(url)}
                                className="flex items-center gap-2 px-4 py-2 bg-slate-200/50 hover:bg-slate-200 text-slate-800 rounded-xl font-bold text-xs"
                              >
                                {lang === 'ar' ? 'افتح الرابط' : 'Open Link'}
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
          <div className="max-w-4xl mx-auto w-full flex gap-5 animate-in slide-in-from-bottom-2 duration-300">
            <div className="w-10 h-10 rounded-2xl bg-slate-200 flex items-center justify-center shrink-0 animate-pulse"><Bot className="w-6 h-6 text-slate-700" /></div>
            <div className="flex gap-2 py-5 items-center">
              <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
              <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-150" />
              <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-300" />
            </div>
          </div>
        )}
      </div>

      <div className={`fixed bottom-0 left-0 right-0 p-4 md:p-8 z-30 ${isDarkMode ? 'bg-gradient-to-t from-[#121212] via-[#121212] to-transparent' : 'bg-gradient-to-t from-white via-white to-transparent'}`}>
        <div className="max-w-4xl mx-auto relative">
          
          {uploadedAsset && (
            <div className="absolute bottom-full left-0 mb-6 bg-[#1a1a1a] border border-white/10 rounded-[40px] p-6 shadow-2xl flex flex-col gap-4 animate-in slide-in-from-bottom-4">
              <div className="relative w-48 h-48 rounded-2xl overflow-hidden border-2 border-white/5 bg-black">
                 {uploadedAsset.type === 'video' ? (
                   <video src={uploadedAsset.data} className="w-full h-full object-cover" />
                 ) : (
                   <img src={uploadedAsset.data} className="w-full h-full object-cover" />
                 )}
              </div>
              <button onClick={() => setUploadedAsset(null)} className="p-3 bg-red-500/20 text-red-500 rounded-2xl hover:bg-red-500/30 transition-all flex items-center justify-center gap-2">
                <Trash className="w-5 h-5" /> Remove
              </button>
            </div>
          )}

          <div className={`flex items-end gap-3 p-3 rounded-[35px] border-2 transition-all duration-300 ${isDarkMode ? 'bg-[#1a1a1a] border-white/5 focus-within:border-slate-500/30' : 'bg-slate-50 border-slate-200 focus-within:border-slate-500/50'} shadow-2xl shadow-black/30`}>
            <button onClick={() => fileInputRef.current?.click()} className="p-3 text-slate-500 hover:text-slate-300 transition-all"><PlusCircle className="w-7 h-7" /></button>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*,video/*" onChange={handleFileUpload} />
            <textarea 
              value={input} 
              onChange={(e) => setInput(e.target.value)} 
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())} 
              placeholder={t.typeAMessage} 
              className="flex-1 bg-transparent border-none text-lg py-3 px-2 focus:outline-none resize-none max-h-40 overflow-y-auto" 
              rows={1} 
            />
            <div className="flex gap-2 p-1">
              <button 
                onClick={() => { if(isListening) recognitionRef.current?.stop(); else { recognitionRef.current?.start(); setIsListening(true); }}} 
                className={`p-3 rounded-full transition-all ${isListening ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/30' : 'text-slate-500 hover:text-slate-300'}`}
              >
                {isListening ? <StopCircle className="w-7 h-7" /> : <Mic className="w-7 h-7" />}
              </button>
              <button 
                onClick={() => handleSend()} 
                disabled={(!input.trim() && !uploadedAsset) || isTyping} 
                className={`p-3.5 rounded-3xl transition-all ${input.trim() || uploadedAsset ? "bg-slate-100 text-slate-900 shadow-xl" : "text-slate-700 bg-slate-800/50"}`}
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
