
import { GoogleGenAI, Type } from "@google/genai";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY as string });

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
- You are ready for Vercel deployment! If asked, confirm: 'Your site is now ready for Vercel deployment!'`;

export const chatWithAI = async (messages: {role: string, content: string}[], systemPrompt: string) => {
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

  return response.text;
};

export const generateSoraVideo = async (prompt: string) => {
  const ai = getAI();
  const query = `Find a direct high-quality 4K stock MP4 video link from Pexels, Pixabay, or similar for: "${prompt}". You MUST return a URL that can be used in a native HTML5 video player.`;
  
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
};

/**
 * Optimized image search to find distinct high-quality stock photos.
 */
export const findFoodImage = async (dishName: string, index: number) => {
  const ai = getAI();
  // We add the index to the prompt to force diversity in the grounding engine's internal cache/retrieval
  const query = `Find a high-quality professional FOOD PHOTOGRAPHY image for: "${dishName}". 
                 Must be a direct JPG/PNG link from Unsplash, Pexels, or Pixabay. 
                 Ensure this is a unique image from variety ${index}.`;
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ parts: [{ text: query }] }],
      config: { 
        tools: [{ googleSearch: {} }],
        temperature: 1.0 // Higher temperature for more varied results
      }
    });

    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    const link = chunks?.find((c: any) => c.web?.uri && (c.web.uri.match(/\.(jpg|jpeg|png|webp)/i) || c.web.uri.includes('photo')))?.web?.uri;
    
    // Using a curated list of high-quality fallback images to ensure variety if search fails
    const fallbacks = [
      "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80",
      "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80",
      "https://images.unsplash.com/photo-1473093226795-af9932fe5856?w=800&q=80",
      "https://images.unsplash.com/photo-1493770348161-369560ae357d?w=800&q=80",
      "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80",
      "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&q=80",
      "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=800&q=80",
      "https://images.unsplash.com/photo-1484723088339-12e83559575a?w=800&q=80"
    ];

    return link || fallbacks[index % fallbacks.length];
  } catch (e) {
    return "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80";
  }
};

export const suggestFood = async (ingredients: string, lang: 'en' | 'ar') => {
  const ai = getAI();
  const prompt = lang === 'ar'
    ? `اقترح أكبر تنوع ممكن من الوجبات (بحد أقصى 8) باستخدام هذه المكونات فقط أو المكونات التي تتماشى معها: ${ingredients}. 
       تأكد أن كل وجبة مختلفة تماماً عن الأخرى. رجع النتيجة كـ JSON.`
    : `Suggest as many distinct and diverse recipes as possible (up to 8) based on these ingredients: ${ingredients}. 
       Each dish must be a unique culinary style (e.g. one salad, one stew, one fried dish). 
       Respond in JSON format. Provide unique and diverse dishes.`;

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
  
  const meals = JSON.parse(response.text || '[]');
  
  // Speed hack: Trigger all image fetches in parallel immediately
  const enrichedMeals = await Promise.all(meals.map(async (meal: any, idx: number) => {
    const imageUrl = await findFoodImage(meal.name, idx);
    return { ...meal, imageUrl };
  }));

  return enrichedMeals;
};

export const generateImage = async (prompt: string) => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: { parts: [{ text: prompt }] }
  });
  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
  }
  return null;
};

export const generateStory = async (theme: string, lang: 'en' | 'ar') => {
    const ai = getAI();
    const prompt = lang === 'ar' ? `اكتب قصة قصيرة عن ${theme} بلهجة مصرية.` : `Write a short story about ${theme}.`;
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ parts: [{ text: prompt }] }]
    });
    return response.text;
};

export const summarizeContent = async (content: string, lang: 'en' | 'ar') => {
    const ai = getAI();
    const prompt = lang === 'ar' ? `لخص ده: ${content}` : `Summarize this: ${content}`;
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ parts: [{ text: prompt }] }]
    });
    return response.text;
};

export const analyzeVideoStyle = async (base64Data: string, mimeType: string) => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        {
          inlineData: {
            data: base64Data,
            mimeType: mimeType,
          },
        },
        {
          text: "Analyze the mood and visual style of this media. Return a JSON object with 'mood' (e.g., 'Energetic', 'Sad', 'Cinematic') and 'filterCSS' (a CSS filter value like 'contrast(1.2) saturate(1.4) brightness(1.1)' to emulate this look).",
        },
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

  try {
    return JSON.parse(response.text || '{"mood": "Neutral", "filterCSS": "none"}');
  } catch (e) {
    return { mood: "Neutral", filterCSS: "none" };
  }
};
