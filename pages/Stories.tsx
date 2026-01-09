
import React, { useState, useContext } from 'react';
import { BookOpen, Sparkles, Save, Trash, Search, Bot, Volume2, Globe } from 'lucide-react';
import { generateStory } from '../services/geminiService';
import { Story } from '../types';
import { AppContext } from '../App';

interface StoriesPageProps { t: any; lang: 'en' | 'ar'; }

const StoriesPage: React.FC<StoriesPageProps> = ({ t, lang }) => {
  const { robotRef, setIsRobotSummoned } = useContext(AppContext);
  const [theme, setTheme] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [story, setStory] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [storyLang, setStoryLang] = useState<'en' | 'ar'>(lang);
  
  const [savedStories, setSavedStories] = useState<Story[]>(() => {
    const s = localStorage.getItem('saved_stories');
    return s ? JSON.parse(s) : [];
  });

  const handleGenerate = async () => {
    if (!theme.trim()) return;
    setLoading(true);
    try {
      const res = await generateStory(theme, storyLang);
      setStory(res || null);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    if (!story) return;
    const newStory: Story = {
      id: Date.now().toString(),
      theme,
      content: story,
      createdAt: Date.now()
    };
    const updated = [newStory, ...savedStories];
    setSavedStories(updated);
    localStorage.setItem('saved_stories', JSON.stringify(updated));
    setStory(null);
    setTheme('');
  };

  const deleteStory = (id: string) => {
    const updated = savedStories.filter(s => s.id !== id);
    setSavedStories(updated);
    localStorage.setItem('saved_stories', JSON.stringify(updated));
  };

  const readStory = (text: string) => {
    setIsRobotSummoned(true);
    // Ensure the overlay has time to mount and connect
    setTimeout(() => {
      if (robotRef?.current) {
        robotRef.current.triggerAnimation('happy');
        // Pass the explicit language of the story to ensure correct accent
        robotRef.current.speak(text, storyLang);
      }
    }, 500);
  };

  const filteredStories = savedStories.filter(s => 
    s.theme.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 max-w-5xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{t.stories}</h1>
        <p className="text-slate-400">Craft extremely long, detailed novels and listen to them with Chatty.</p>
      </div>

      <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl mb-8">
        <div className="flex justify-end gap-2 mb-4">
           <button 
             onClick={() => setStoryLang('en')} 
             className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${storyLang === 'en' ? 'bg-emerald-500 text-white shadow-lg' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
           >
             <Globe className="w-4 h-4" /> English
           </button>
           <button 
             onClick={() => setStoryLang('ar')} 
             className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${storyLang === 'ar' ? 'bg-emerald-500 text-white shadow-lg' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
           >
             <Globe className="w-4 h-4" /> العربية
           </button>
        </div>
        <textarea
          value={theme}
          onChange={(e) => setTheme(e.target.value)}
          placeholder={t.storyThemePlaceholder}
          className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-2xl p-4 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 mb-4 h-24"
        />
        <button
          onClick={handleGenerate}
          disabled={loading || !theme.trim()}
          className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg"
        >
          {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Sparkles className="w-5 h-5" />}
          {t.generate}
        </button>
      </div>

      {story && (
        <div className="bg-slate-800 border border-emerald-500/30 p-8 rounded-3xl mb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex flex-wrap gap-4 justify-between items-center mb-6 border-b border-white/10 pb-4">
            <h3 className="text-xl font-bold text-emerald-400">{theme}</h3>
            <div className="flex gap-2">
              <button onClick={() => readStory(story)} className="flex items-center gap-2 text-white bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-xl transition-all shadow-lg">
                <Bot className="w-5 h-5" /> Read to Me
              </button>
              <button onClick={handleSave} className="flex items-center gap-2 text-slate-300 hover:text-emerald-400 bg-slate-900 px-4 py-2 rounded-xl transition-all">
                <Save className="w-5 h-5" /> {t.save}
              </button>
            </div>
          </div>
          <div className="prose prose-invert max-w-none">
            <p className="text-slate-100 leading-relaxed text-lg whitespace-pre-wrap">{story}</p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
            <BookOpen className="text-emerald-500" />
            Library
        </h2>
        <div className="relative">
          <input 
            type="text" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search stories..." 
            className="bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-2 focus:outline-none focus:border-emerald-500 text-sm w-48 md:w-64"
          />
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
        </div>
      </div>

      {filteredStories.length === 0 ? (
        <div className="text-center py-12 text-slate-500 bg-slate-900/30 rounded-3xl">
          <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <p>No stories found. Generate one!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredStories.map((s) => (
            <div key={s.id} className="bg-slate-900/50 border border-slate-800 p-6 rounded-3xl group relative hover:border-emerald-500/30 transition-all">
              <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => readStory(s.content)}
                  className="text-blue-400 hover:bg-blue-500/20 p-2 rounded-lg"
                  title="Read Aloud"
                >
                  <Volume2 className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => deleteStory(s.id)}
                  className="text-red-400 hover:bg-red-500/20 p-2 rounded-lg"
                  title="Delete"
                >
                  <Trash className="w-5 h-5" />
                </button>
              </div>
              <h4 className="font-bold text-slate-100 mb-2 truncate pr-16 text-lg">{s.theme}</h4>
              <p className="text-slate-400 text-sm line-clamp-4 mb-4 leading-relaxed">{s.content}</p>
              <div className="flex items-center justify-between mt-4 border-t border-white/5 pt-4">
                 <span className="text-xs text-slate-600">{new Date(s.createdAt).toLocaleDateString()}</span>
                 <span className="text-xs text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-md">Novel Chapter</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StoriesPage;
