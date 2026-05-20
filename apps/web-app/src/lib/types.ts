export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  pinned: boolean;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
}

export interface SubscriptionStatus {
  subscription_status: 'trial' | 'paid' | 'expired' | null;
  trial_ends_at?: string;
  days_left?: number;
  can_sync?: boolean;
  email?: string;
}

export interface AiSettings {
  provider: 'disabled' | 'ollama' | 'groq';
  ollamaUrl: string;
  ollamaModel: string;
}

export interface SummarizeResult {
  summary: string;
  tags: string[];
}

export interface Deadline {
  text: string;
  date?: string;
}

export interface FlashCard {
  front: string;
  back: string;
}

export interface NoteAnalysis {
  deadlines:  Deadline[];
  todos:      { text: string }[];
  followUps:  Deadline[];
  flashCards: FlashCard[];
}

export type AiAnalyzeProvider = 'ollama' | 'openai'

export interface AiAnalyzeConfig {
  provider: AiAnalyzeProvider
  baseUrl: string
  model: string
  apiKey: string
  autoAnalyze: boolean
}
