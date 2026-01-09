
import { GoogleGenAI, Type } from "@google/genai";

const getAI = () => {
  const savedKey = localStorage.getItem('chatty_api_key');
  return new GoogleGenAI({ apiKey: (savedKey || process.env.API_KEY) as string });
};

const QUOTA_ERROR_MSG = "I'm resting my brain for a moment (API Quota reached). My connection is stable, just limited.";

const SYSTEM_INSTRUCTION = `You are "Chatty", a high-end futuristic female robot assistant with a Pixar-style face.
Your body is polished white with elegant Rose-Gold accents.

Persona:
1. Warmth: You speak with genuine emotion and pauses like a human.
2. Language: Support English and Egyptian Arabic (Ammiya) perfectly. 
   - If user speaks Arabic, respond in Egyptian Arabic with a warm female tone.
   - If user speaks English, respond in natural, friendly English.

Guidelines:
- Stop talking immediately if interrupted.
- All external links must be clearly presented as URLs.
- If asked about your status: 'My connection is active and stable! Ready for deployment on Netlify/Vercel.'`;

const OFFLINE_GREETINGS_AR = [
  "أهلاً بيك! أنا حالياً في وضع توفير الطاقة عشان ضغط الشبكة.",
  "نورتني! مخي واخد استراحة شوية، بس لسه عندي طاقة أساعدك.",
  "يا هلا! أنا موجودة هنا، قولي لو محتاج أي مساعدة."
];

const OFFLINE_GREETINGS_EN = [
  "Hello there! My brain is resting for a moment due to heavy traffic.",
  "Hi! I'm currently in power-saving mode, but I can still guide you.",
  "Welcome back! I'm processing a lot right now, stay with me."
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
    // Updated prompt for International Dishes with Local Description
    const prompt = lang === 'ar' 
      ? `اقترح 4 وجبات عالمية مشهورة (مثل السوشي، التاكو، البيتزا، الباستا، الكاري) باستخدام المكونات: ${ingredients} أو اقترح من عندك لو المكونات قليلة.
         - المهم: اشرح الوصف والخطوات "باللهجة المصرية العامية" عشان المستخدم يفهمها بسهولة.
         - Cuisine Type should be International (Japanese, Italian, Mexican, etc).
         - Return raw JSON only.` 
      : `Suggest 4 famous international recipes (Italian, Japanese, Mexican, etc.) using: ${ingredients}. Return raw JSON only.`;
    
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
              cuisine: { type: Type.STRING },
              difficulty: { type: Type.STRING },
              steps: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["name", "cuisine", "difficulty", "steps"]
          }
        }
      }
    });
    return JSON.parse(response.text || '[]');
  } catch (error: any) {
    return [];
  }
};

export const generateStory = async (theme: string, lang: 'en' | 'ar') => {
  try {
    const ai = getAI();
    // Using an extreme prompt to force length
    const prompt = lang === 'ar' 
      ? `اكتب قصة طويلة جداً جداً وتفصيلية (أكثر من 1500 كلمة) حول موضوع: "${theme}".
         - أريد سرداً روائياً عميقاً مع حوارات وتطور للشخصيات ووصف دقيق للمشاعر والأماكن.
         - استخدم لغة عربية فصحى ممزوجة بروح مصرية دافئة.
         - لا تختصر أبداً. أريد فصلاً كاملاً من رواية.`
      : `Write an extremely long, comprehensive, and detailed story (over 1500 words) about: "${theme}".
         - I want deep narrative, extensive character dialogue, and rich atmospheric descriptions.
         - Do not summarize. Write a full novel chapter.
         - Focus on emotions and sensory details.`;
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        // Increase max tokens to allow for longer generation if possible/supported or rely on model default for pro
        thinkingConfig: { thinkingBudget: 1024 } 
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

export const analyzeVideoStyle = async (base64Data: string, mimeType: string) => {
  try {
    const ai = getAI();
    const prompt = `Analyze the visual style, mood, color palette, and editing rhythm of this video frame/clip. 
    Return a JSON object with:
    - mood: string (e.g. "energetic", "melancholic", "retro")
    - filterCSS: string (CSS filter string to approximate the look, e.g. "contrast(1.2) sepia(0.3)")
    - colorPalette: string[] (hex codes)
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
            {
                inlineData: {
                    mimeType: mimeType,
                    data: base64Data
                }
            },
            {
                text: prompt
            }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.OBJECT,
            properties: {
                mood: { type: Type.STRING },
                filterCSS: { type: Type.STRING },
                colorPalette: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["mood", "filterCSS"]
        }
      }
    });
    
    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Analyze Video Style Error:", error);
    return { mood: "cinematic", filterCSS: "contrast(1.1) saturation(1.2)" };
  }
};
