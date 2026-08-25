import type { ChatMessage, MemoryExtractionResult, MemoryItem } from '../types';
import { callBaseAI } from '../providers/aiProvider';

/**
 * HDI Engine: 自律学習モジュール（設計書 4章）
 *
 * 会話をすべて学習対象にするが、全メモリを毎回送らない方針に対応するため、
 * このモジュールは「会話からメモリ候補を抽出する」役割のみを担う。
 * 呼び出し頻度はコスト最適化のため、呼び出し側（useChat）で間引く。
 */

const EXTRACTION_SYSTEM_PROMPT = `あなたは会話からユーザーに関する有用な情報を抽出するモジュールです。
以下のやり取りを分析し、今後の会話で役立つ「ユーザーについての情報」を抽出してください。

抽出対象:
- preference: 好み・価値観・性格傾向
- fact: 客観的な事実情報（職業、環境、所有物など）
- context: 進行中のプロジェクトや継続的な話題
- skill: スキル・専門性・知識レベル
- communication: 話し方や回答の好み（例: 簡潔に、専門用語OK、絵文字不要 など）

ルール:
- 一時的・些末な内容は抽出しない
- 既に自明な内容（一般常識）は抽出しない
- 各項目は1文の短い要約にする
- 重要度は0-100で、長期的に役立つほど高くする
- 既存メモリと重複・矛盾する場合は updatedMemories で更新を提案する

必ず以下のJSON形式のみで出力してください。前置きや説明文、マークダウンのコードフェンスは一切不要です。

{
  "newMemories": [
    { "category": "preference|fact|context|skill|communication", "summary": "string", "importance": number, "isLongTerm": boolean }
  ],
  "updatedMemories": [
    { "id": "string", "summary": "string (optional)", "importance": number (optional) }
  ],
  "deprecatedMemoryIds": ["string"]
}

新しい情報がなければ、すべて空配列で返してください。`;

function messageText(msg: ChatMessage): string {
  return msg.variants[msg.activeVariantIndex]?.content ?? '';
}

export async function extractMemoriesFromExchange(params: {
  apiKey: string;
  model: string;
  recentMessages: ChatMessage[];
  existingMemories: MemoryItem[];
}): Promise<MemoryExtractionResult> {
  const { apiKey, model, recentMessages, existingMemories } = params;

  const transcript = recentMessages
    .map((m) => `${m.role === 'user' ? 'ユーザー' : 'AI'}: ${messageText(m)}`)
    .join('\n');

  const existingSummary = existingMemories
    .map((m) => `- id:${m.id} [${m.category}] ${m.summary} (重要度:${m.importance})`)
    .join('\n');

  const userPrompt = `【既存メモリ一覧】
${existingSummary || '（なし）'}

【直近の会話】
${transcript}`;

  try {
    const raw = await callBaseAI({
      apiKey,
      model,
      systemPrompt: EXTRACTION_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
      temperature: 0.3,
      stream: false,
    });

    const cleaned = raw.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    return {
      newMemories: Array.isArray(parsed.newMemories) ? parsed.newMemories : [],
      updatedMemories: Array.isArray(parsed.updatedMemories) ? parsed.updatedMemories : [],
      deprecatedMemoryIds: Array.isArray(parsed.deprecatedMemoryIds) ? parsed.deprecatedMemoryIds : [],
    };
  } catch (err) {
    console.error('[HDI Engine] memory extraction failed', err);
    return { newMemories: [], updatedMemories: [], deprecatedMemoryIds: [] };
  }
}

/**
 * メモリ選定: 現在の入力に関連するメモリのみを呼び出す（設計書 4章「必要時のみ呼び出す」）。
 * 簡易実装として、重要度上位 + キーワード一致で選定する。
 * トークン消費を抑えるため上限を設ける。
 */
export function selectRelevantMemories(params: {
  allMemories: MemoryItem[];
  currentChatId: string;
  longTermMemoryEnabled: boolean;
  latestInput: string;
  maxItems?: number;
}): MemoryItem[] {
  const { allMemories, currentChatId, longTermMemoryEnabled, latestInput, maxItems = 12 } = params;

  const scoped = allMemories.filter((m) => {
    if (m.sourceChatId === currentChatId) return true;
    return longTermMemoryEnabled && m.isLongTerm;
  });

  const inputLower = latestInput.toLowerCase();
  const scored = scoped.map((m) => {
    const keywordHit = m.summary
      .split(/[、。\s]+/)
      .some((token) => token.length > 1 && inputLower.includes(token.toLowerCase()));
    const score = m.importance + (keywordHit ? 30 : 0);
    return { memory: m, score };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, maxItems)
    .map((s) => s.memory);
}
