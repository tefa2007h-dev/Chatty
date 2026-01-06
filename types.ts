
export type Language = 'en' | 'ar';

export interface User {
  id: string;
  name: string;
  email: string;
  photoURL: string;
  isPremium: boolean;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
}

export interface Story {
  id: string;
  theme: string;
  content: string;
  createdAt: number;
}

export interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  timestamp: number;
}
