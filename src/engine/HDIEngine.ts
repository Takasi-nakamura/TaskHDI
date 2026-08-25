import type {
  ChatMessage,
  MemoryItem,
  PersonalIntelligenceProfile,
  FeatureSettings,
  ConversationMood,
} from '../types';

import {
  buildHDIPrompt,
  estimateMood,
} from '../prompt/promptBuilder';

import {
  callBaseAIStream,
  callBaseAI,
  AIProviderError,
  DEFAULT_MODEL,
} from '../providers/aiProvider';

interface HDIEngineOptions {
  apiKey: string;
  model?: string;
  temperature?: number;

  history: ChatMessage[];

  memories?: MemoryItem[];

  personaProfile?: PersonalIntelligenceProfile | null;

  features: FeatureSettings;

  mood?: ConversationMood;

  signal?: AbortSignal;
}

interface SendMessageOptions extends HDIEngineOptions {
  userInput: string;

  onToken?: (token: string) => void;
}

/**
 * TaskHDI HDI Engine
 *
 * UIとBase AIの間に存在する唯一のエンジン。
 *
 * UI
 *  ↓
 * HDIEngine
 *  ↓
 * promptBuilder
 *  ↓
 * aiProvider
 *  ↓
 * OpenRouter / Base AI
 */
export class HDIEngine {
  private readonly apiKey: string;

  private readonly model: string;

  private readonly temperature: number;

  constructor(options: {
    apiKey: string;
    model?: string;
    temperature?: number;
  }) {
    this.apiKey = options.apiKey;
    this.model = options.model || DEFAULT_MODEL;
    this.temperature = options.temperature ?? 0.7;
  }

  /**
   * 通常の会話送信。
   *
   * ストリーミングでBase AIの回答を返す。
   */
  async sendMessage(
    options: SendMessageOptions,
  ): Promise<string> {
    const {
      userInput,
      history,
      memories = [],
      personaProfile = null,
      features,
      mood,
      onToken,
      signal,
    } = options;

    if (!userInput.trim()) {
      return '';
    }

    const actualMood = features.contextIntelligenceEnabled
      ? mood ?? estimateMood(userInput)
      : undefined;

    const prompt = buildHDIPrompt({
      history,
      latestUserInput: userInput,
      memories,
      personaProfile,
      features,
      mood: actualMood,
      model: this.model,
    });

    const messages = [
      ...prompt.messages,
      {
        role: 'user' as const,
        content: userInput,
      },
    ];

    return callBaseAIStream({
      apiKey: this.apiKey,
      model: this.model,
      systemPrompt: prompt.systemPrompt,
      messages,
      temperature: this.temperature,
      stream: true,
      signal,
      onToken: onToken ?? (() => {}),
    });
  }

  /**
   * ストリーミングを使用しない呼び出し。
   *
   * 内部処理・分析などで使用する。
   */
  async callInternal(options: {
    history: ChatMessage[];
    userInput: string;
    memories?: MemoryItem[];
    personaProfile?: PersonalIntelligenceProfile | null;
    features: FeatureSettings;
    mood?: ConversationMood;
  }): Promise<string> {
    const {
      history,
      userInput,
      memories = [],
      personaProfile = null,
      features,
      mood,
    } = options;

    const actualMood = features.contextIntelligenceEnabled
      ? mood ?? estimateMood(userInput)
      : undefined;

    const prompt = buildHDIPrompt({
      history,
      latestUserInput: userInput,
      memories,
      personaProfile,
      features,
      mood: actualMood,
      model: this.model,
    });

    return callBaseAI({
      apiKey: this.apiKey,
      model: this.model,
      systemPrompt: prompt.systemPrompt,
      messages: [
        ...prompt.messages,
        {
          role: 'user',
          content: userInput,
        },
      ],
      temperature: this.temperature,
      stream: false,
    });
  }
}

/**
 * 便利関数。
 *
 * UI側で毎回new HDIEngine()を書く必要をなくす。
 */
export function createHDIEngine(options: {
  apiKey: string;
  model?: string;
  temperature?: number;
}): HDIEngine {
  return new HDIEngine(options);
}

/**
 * APIエラー判定用。
 */
export function isHDIEngineError(
  error: unknown,
): error is AIProviderError {
  return error instanceof AIProviderError;
}