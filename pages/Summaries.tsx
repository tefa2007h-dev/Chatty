
import React, { useState } from 'react';
import { FileText, Copy, Sparkles, AlertCircle, ExternalLink } from 'lucide-react';
import { summarizeContent } from '../services/geminiService';

interface SummariesPageProps { t: any; lang: 'en' | 'ar'; }

const SummariesPage: React.FC<SummariesPageProps> = ({ t, lang }) => {
  const [input, setInput] = useState('');
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSummarize = async () => {
    if (!input.trim()) return;
    setLoading(true);
    try {
      const res = await summarizeContent(input, lang);
      setSummary(res || null);
    } catch (err) {
      console.error(err);
      setSummary(lang === 'ar' ? 'عذراً، حدث خطأ أثناء التلخيص.' : 'Sorry, an error occurred during summarization.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (summary) {
      navigator.clipboard.writeText(summary);
      alert(lang === 'ar' ? 'تم النسخ إلى الحافظة!' : 'Copied to clipboard!');
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 max-w-4xl mx-auto w-full">
      <div className="mb-8 text-center">
        <div className="w-16 h-16 bg-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <FileText className="text-blue-500 w-8 h-8" />
        </div>
        <h1 className="text-3xl font-bold mb-2">{t.summaries}</h1>
        <p className="text-slate-400">Save time by summarizing long documents or YouTube videos instantly.</p>
      </div>

      <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl mb-8 shadow-xl">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t.summaryPlaceholder}
          className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-2xl p-6 focus:outline-none focus:ring-2 focus:ring-blue-500/50 mb-4 h-64 resize-none text-sm md:text-base"
        />
        <button
          onClick={handleSummarize}
          disabled={loading || !input.trim()}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Sparkles className="w-5 h-5" />
          )}
          {t.generate}
        </button>
      </div>

      {summary && (
        <div className="bg-slate-800/50 border border-blue-500/30 rounded-3xl p-6 md:p-8 animate-in zoom-in duration-300 relative">
          <button 
            onClick={copyToClipboard}
            className="absolute top-6 right-6 p-2 bg-slate-900 hover:bg-slate-700 text-slate-400 rounded-xl transition-all"
            title="Copy to clipboard"
          >
            <Copy className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-2 mb-6 text-blue-400">
            <AlertCircle className="w-5 h-5" />
            <h3 className="font-bold text-lg">
              {lang === 'ar' ? 'النتائج الرئيسية' : 'Key Takeaways'}
            </h3>
          </div>
          
          <div className="prose prose-invert max-w-none text-slate-100 leading-relaxed text-sm md:text-base whitespace-pre-wrap">
            {summary}
          </div>
        </div>
      )}
    </div>
  );
};

export default SummariesPage;
