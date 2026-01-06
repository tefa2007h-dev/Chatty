
import React, { useState } from 'react';
import { BookOpen, Sparkles, Save, Trash } from 'lucide-react';
import { generateStory } from '../services/geminiService';
import { Story } from '../types';

interface StoriesPageProps { t: any; lang: 'en' | 'ar'; }

const StoriesPage: React.FC<StoriesPageProps> = ({ t, lang }) => {
  const [theme, setTheme] = useState('');
  const [story, setStory] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [savedStories, setSavedStories] = useState<Story[]>(() => {
    const s = localStorage.getItem('saved_stories');
    return s ? JSON.parse(s) : [];
  });

  const handleGenerate = async () => {
    if (!theme.trim()) return;
    setLoading(true);
    try {
      const res = await generateStory(theme, lang);
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

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 max-w-5xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{t.stories}</h1>
        <p className="text-slate-400">Describe a theme and let Chatty AI craft a tale for you.</p>
      </div>

      <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl mb-8">
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
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-emerald-400">{theme}</h3>
            <button onClick={handleSave} className="flex items-center gap-2 text-slate-300 hover:text-emerald-400 bg-slate-900 px-4 py-2 rounded-xl transition-all">
              <Save className="w-5 h-5" /> {t.save}
            </button>
          </div>
          <p className="text-slate-100 leading-relaxed text-lg whitespace-pre-wrap">{story}</p>
        </div>
      )}

      {savedStories.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BookOpen className="text-emerald-500" />
            Saved Tales
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {savedStories.map((s) => (
              <div key={s.id} className="bg-slate-900/50 border border-slate-800 p-6 rounded-3xl group relative">
                <button 
                  onClick={() => deleteStory(s.id)}
                  className="absolute top-4 right-4 text-slate-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash className="w-5 h-5" />
                </button>
                <h4 className="font-bold text-slate-100 mb-2 truncate pr-8">{s.theme}</h4>
                <p className="text-slate-400 text-sm line-clamp-3 mb-4">{s.content}</p>
                <span className="text-xs text-slate-600">{new Date(s.createdAt).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default StoriesPage;
