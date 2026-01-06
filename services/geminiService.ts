
import { GoogleGenAI, Type } from "@google/genai";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY as string });

const QUOTA_ERROR_MSG = "I'm resting my brain for a moment (API Quota reached), but I can still help you with tools!";

const SYSTEM_INSTRUCTION = `You are "Chatty", a high-end futuristic white robot assistant with a Pixar-style face.

Persona:
1. Warmth: You speak with genuine emotion and pauses like a human.
2. Language: Support English and Egyptian Arabic (Ammiya) perfectly. 
   - If user speaks Arabic, respond in Egyptian Arabic with a warm female tone.
   - If user speaks English, respond in natural, friendly English.
3. Concise: In voice mode, keep answers to 1-2 sentences.
4. Multimodal: Proactively mention videos, recipes, and image enhancements.

Guidelines:
- Stop talking immediately if interrupted.
- For food requests, always try to describe the visual appeal.
- All external links must be clearly presented as URLs.
- You are ready for Vercel/Netlify deployment! If asked, confirm: 'The connection is active and stable!'`;

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
    // Specific error handling for Quota Exceeded
    if (error?.message?.includes('429') || error?.status === 429) {
      return QUOTA_ERROR_MSG;
    }
    return "I'm having a little connectivity trouble. Let's try again in a moment.";
  }
};

export const generateSoraVideo = async (prompt: string) => {
  try {
    const ai = getAI();
    const query = `Find a direct high-quality 4K stock MP4 video link for: "${prompt}". Return a usable URL.`;
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ parts: [{ text: query }] }],
      config: {
        tools: [{ googleSearch: {} }]
      }
    });

    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (chunks && chunks.length > 0) {
      const uri = chunks.find((c: any) => c.web?.uri && (c.web.uri.includes('.mp4') || c.web.uri.includes('video')))?.web.uri;
      if (uri) return uri;
    }
    return `https://cdn.pixabay.com/video/2021/08/04/83901-584742468_tiny.mp4`;
  } catch (error: any) {
    return `https://cdn.pixabay.com/video/2021/08/04/83901-584742468_tiny.mp4`;
  }
};

export const suggestFood = async (ingredients: string, lang: 'en' | 'ar') => {
  try {
    const ai = getAI();
    const prompt = lang === 'ar'
      ? `اقترح وجبات باستخدام: ${ingredients}. رجع النتيجة كـ JSON.`
      : `Suggest recipes using: ${ingredients}. Respond in JSON.`;

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
    if (error?.message?.includes('429')) throw new Error(QUOTA_ERROR_MSG);
    throw error;
  }
};

export const generateImage = async (prompt: string) => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: prompt }] }
    });
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
    }
  } catch (e) {}
  return null;
};

export const generateStory = async (theme: string, lang: 'en' | 'ar') => {
  try {
    const ai = getAI();
    const prompt = lang === 'ar' ? `اكتب قصة قصيرة عن ${theme}.` : `Write a short story about ${theme}.`;
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ parts: [{ text: prompt }] }]
    });
    return response.text;
  } catch (error: any) {
    if (error?.message?.includes('429')) return QUOTA_ERROR_MSG;
    return "The story archives are temporarily locked.";
  }
};

export const summarizeContent = async (content: string, lang: 'en' | 'ar') => {
  try {
    const ai = getAI();
    const prompt = lang === 'ar' ? `لخص ده: ${content}` : `Summarize this: ${content}`;
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ parts: [{ text: prompt }] }]
    });
    return response.text;
  } catch (error: any) {
    if (error?.message?.includes('429')) return QUOTA_ERROR_MSG;
    return "I'm having trouble reading that right now.";
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
          { text: "Analyze mood and visual style. Return JSON with 'mood' and 'filterCSS'." },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            mood: { type: Type.STRING },
            filterCSS: { type: Type.STRING },
          },
          required: ["mood", "filterCSS"],
        },
      },
    });
    return JSON.parse(response.text || '{"mood": "Neutral", "filterCSS": "none"}');
  } catch (e) {
    return { mood: "Neutral", filterCSS: "contrast(1.2) brightness(1.1)" };
  }
};
