export interface Note {
  id: string;
  text: string;
  note: string;
  tag: string;
  date: string;
  pinned: boolean;
  updated_at: number;
  cloudId?: number;
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
