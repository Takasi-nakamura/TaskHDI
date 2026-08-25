import type { AppSettings, Chat, MemoryItem, PersonalIntelligenceProfile } from '../types';

/**
 * ローカルストレージ層。
 * Firestoreへの書き込みは非同期のため、即時反映されるUI用にローカルキャッシュを持つ。
 * 未ログイン時（ゲスト利用）はこちらのみが真実のソースになる。
 */

const KEYS = {
  chats: 'taskhdi:chats',
  memories: 'taskhdi:memories',
  settings: 'taskhdi:settings',
  personalProfile: 'taskhdi:personalProfile',
} as const;

function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJSON<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error('[localStore] write failed', key, err);
  }
}

export const localStore = {
  getChats(): Chat[] {
    return readJSON<Chat[]>(KEYS.chats, []);
  },
  setChats(chats: Chat[]): void {
    writeJSON(KEYS.chats, chats);
  },

  getMemories(): MemoryItem[] {
    return readJSON<MemoryItem[]>(KEYS.memories, []);
  },
  setMemories(memories: MemoryItem[]): void {
    writeJSON(KEYS.memories, memories);
  },

  getSettings(): AppSettings | null {
    return readJSON<AppSettings | null>(KEYS.settings, null);
  },
  setSettings(settings: AppSettings): void {
    writeJSON(KEYS.settings, settings);
  },

  getPersonalProfile(): PersonalIntelligenceProfile | null {
    return readJSON<PersonalIntelligenceProfile | null>(KEYS.personalProfile, null);
  },
  setPersonalProfile(profile: PersonalIntelligenceProfile): void {
    writeJSON(KEYS.personalProfile, profile);
  },
};

export const defaultSettings: AppSettings = {
  api: {
    provider: 'openrouter',
    apiKey: '',
    model: 'openai/gpt-oss-120b',
    temperature: 0.7,
  },
  design: {
    themeMode: 'light',
    accentColor: '#1E2A4A',
    fontFamily: 'default',
  },
  features: {
    autonomousLearningEnabled: true,
    contextIntelligenceEnabled: true,
    nliEnabled: true,
    richRenderingEnabled: true,
  },
};

export const defaultPersonalProfile: PersonalIntelligenceProfile = {
  setupCompleted: false,
  currentStep: 0,
  entries: [],
};
