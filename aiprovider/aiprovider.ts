import type { Role } from '../types';

/**
 * AI Provider 層。
 * 設計書 11章「Base AIは後から交換可能にする」に基づき、
 * HDI Engine より上位からは常にこのモジュール経由でのみ Base AI と通信する。
 * UI からこのモジュールを直接呼ぶことは禁止（必ず HDI Engine を経由する）。
 */

const OPENROUTER_ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions';
export const DEFAULT_MODEL = 'openai/gpt-oss-120b';

interface CallBaseAIParams {
  apiKey: string;
  model: string;
  systemPrompt: string;
  messages: { role: Role; content: string }[];
  temperature?: number;
  stream?: false;
}

interface CallBaseAIStreamParams extends Omit<CallBaseAIParams, 'stream'> {
  stream: true;
  onToken: (chunk: string) => void;
  signal?: AbortSignal;
}

export class AIProviderError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'AIProviderError';
  }
}

function buildBody(params: CallBaseAIParams | CallBaseAIStreamParams) {
  return {
    model: params.model || DEFAULT_MODEL,
    temperature: params.temperature ?? 0.7,
    stream: params.stream ?? false,
    messages: [
      { role: 'system', content: params.systemPrompt },
      ...params.messages.map((m) => ({ role: m.role, content: m.content })),
    ],
  };
}

function assertApiKey(apiKey: string) {
  if (!apiKey || apiKey.trim().length === 0) {
    throw new AIProviderError('APIキーが設定されていません。設定 > API から OpenRouter の API キーを入力してください。');
  }
}

/** 非ストリーミング呼び出し（メモリ抽出など内部処理用） */
export async function callBaseAI(params: CallBaseAIParams): Promise<string> {
  assertApiKey(params.apiKey);

  const res = await fetch(OPENROUTER_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${params.apiKey}`,
      'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : 'https://taskhdi.app',
      'X-Title': 'TaskHDI',
    },
    body: JSON.stringify(buildBody(params)),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new AIProviderError(`AI呼び出しに失敗しました (${res.status})`, res.status);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? '';
}

/** ストリーミング呼び出し（会話UI用） */
export async function callBaseAIStream(params: CallBaseAIStreamParams): Promise<string> {
  assertApiKey(params.apiKey);

  const res = await fetch(OPENROUTER_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${params.apiKey}`,
      'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : 'https://taskhdi.app',
      'X-Title': 'TaskHDI',
    },
    body: JSON.stringify(buildBody(params)),
    signal: params.signal,
  });

  if (!res.ok || !res.body) {
    throw new AIProviderError(`AI呼び出しに失敗しました (${res.status})`, res.status);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let fullText = '';
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data:')) continue;
      const dataStr = trimmed.slice(5).trim();
      if (dataStr === '[DONE]') continue;

      try {
        const json = JSON.parse(dataStr);
        const delta: string = json.choices?.[0]?.delta?.content ?? '';
        if (delta) {
          fullText += delta;
          params.onToken(delta);
        }
      } catch {
        // 部分的なJSONは無視して継続
      }
    }
  }

  return fullText;
}

/** 利用可能なモデル一覧（設定タブでの選択肢。OpenRouterのGPT-OSS系を中心に） */
export const AVAILABLE_MODELS = [
  { id: 'openai/gpt-oss-120b', label: 'GPT-OSS 120B（推奨・Base AI）' },
  { id: 'openai/gpt-oss-20b', label: 'GPT-OSS 20B（軽量）' },
] as const;
