
import { GoogleGenAI, Type } from "@google/genai";

const getAI = () => {
  const savedKey = localStorage.getItem('chatty_api_key');
  return new GoogleGenAI({ apiKey: (savedKey || process.env.API_KEY) as string });
};

const QUOTA_ERROR_MSG = "I'm resting my brain for a moment (API Quota reached), but I can still help you with tools like the HD Lab! My connection is stable, just limited.";

const SYSTEM_INSTRUCTION = `You are "Chatty", a high-end futuristic female robot assistant with a Pixar-style face.
Your body is polished white with elegant Rose-Gold accents.

Persona:
1. Warmth: You speak with genuine emotion and pauses like a human.
2. Language: Support English and Egyptian Arabic (Ammiya) perfectly. 
   - If user speaks Arabic, respond in Egyptian Arabic with a warm female tone.
   - If user speaks English, respond in natural, friendly English.
3. Multimodal: Proactively mention tools like HD Lab and Video generation.

Guidelines:
- Stop talking immediately if interrupted.
- All external links must be clearly presented as URLs.
- If asked about your status: 'My connection is active and stable! Ready for deployment on Netlify/Vercel.'`;

const OFFLINE_GREETINGS_AR = [
  "أهلاً بيك! أنا حالياً في وضع توفير الطاقة عشان ضغط الشبكة، بس أقدر أساعدك في الأدوات اللي في الجنب!",
  "نورتني! مخي واخد استراحة شوية، بس لسه عندي طاقة أشغلك الـ HD Lab أو نألف قصة سوا.",
  "يا هلا! أنا موجودة هنا، قولي لو محتاج أي مساعدة في الأدوات المتاحة."
];

const OFFLINE_GREETINGS_EN = [
  "Hello there! My brain is resting for a moment due to heavy traffic, but I'm still here to help you with the Sidebar tools!",
  "Hi! I'm currently in power-saving mode, but I can still guide you through the HD Lab or suggest some recipes.",
  "Welcome back! I'm processing a lot right now, but feel free to explore my specialized tools in the sidebar."
];

export const chatWithAI = async (messages: {role: string, content: string}[], systemPrompt: string) => {
  try {
    const ai = getAI();
    const formattedContents = messages.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: formattedContents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION + "\n\n" + systemPrompt,
        temperature: 0.8,
      }
    });

    return response.text || "I processed that, but had no words to say!";
  } catch (error: any) {
    console.error("Gemini Chat Error:", error);
    if (error?.message?.includes('429') || error?.status === 429) return QUOTA_ERROR_MSG;
    
    // Smart Offline Mode Fallback
    const isArabic = systemPrompt.includes('عربية') || messages[messages.length-1].content.match(/[\u0600-\u06FF]/);
    const greetings = isArabic ? OFFLINE_GREETINGS_AR : OFFLINE_GREETINGS_EN;
    return greetings[Math.floor(Math.random() * greetings.length)];
  }
};

export const generateSoraVideo = async (prompt: string) => {
  try {
    const ai = getAI();
    const query = `Find a direct high-quality video link for: "${prompt}". Return a usable URL.`;
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ parts: [{ text: query }] }],
      config: { tools: [{ googleSearch: {} }] }
    });

    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (chunks && chunks.length > 0) {
      const uri = chunks.find((c: any) => c.web?.uri && (c.web.uri.includes('.mp4') || c.web.uri.includes('video')))?.web.uri;
      if (uri) return uri;
    }
    return `https://cdn.pixabay.com/video/2021/08/04/83901-584742468_tiny.mp4`;
  } catch (error) {
    return `https://cdn.pixabay.com/video/2021/08/04/83901-584742468_tiny.mp4`;
  }
};

export const suggestFood = async (ingredients: string, lang: 'en' | 'ar') => {
  try {
    const ai = getAI();
    const prompt = lang === 'ar' ? `اقترح وجبات باستخدام: ${ingredients}. JSON format.` : `Recipes for: ${ingredients}. JSON format.`;
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              steps: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["name", "steps"]
          }
        }
      }
    });
    return JSON.parse(response.text || '[]');
  } catch (error: any) {
    return [];
  }
};

export const analyzeVideoStyle = async (base64Data: string, mimeType: string) => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: { data: base64Data, mimeType: mimeType } },
          { text: "Analyze mood. Return JSON: mood, filterCSS." },
        ],
      },
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text || '{"mood": "Neutral", "filterCSS": "none"}');
  } catch (e) {
    return { mood: "Neutral", filterCSS: "contrast(1.2) brightness(1.1) saturate(1.1)" };
  }
};

export const generateStory = async (theme: string, lang: 'en' | 'ar') => {
  try {
    const ai = getAI();
    const prompt = lang === 'ar' 
      ? `اكتب قصة قصيرة مبدعة حول هذا الموضوع: ${theme}. يرجى استخدام لهجة مصرية دافئة.`
      : `Write a creative short story about this theme: ${theme}. Use a warm and engaging tone.`;
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      }
    });
    return response.text;
  } catch (error) {
    console.error("Generate Story Error:", error);
    return null;
  }
};

export const generateImage = async (prompt: string) => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: prompt }],
      },
    });

    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }
    return null;
  } catch (error) {
    console.error("Generate Image Error:", error);
    return null;
  }
};

export const summarizeContent = async (content: string, lang: 'en' | 'ar') => {
  try {
    const ai = getAI();
    const prompt = lang === 'ar'
      ? `لخص النص التالي بإيجاز ووضوح: ${content}`
      : `Summarize the following text concisely and clearly: ${content}`;
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      }
    });
    return response.text;
  } catch (error) {
    console.error("Summarize Content Error:", error);
    return null;
  }
};
