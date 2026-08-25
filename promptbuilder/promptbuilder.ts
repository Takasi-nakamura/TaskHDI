import type {
  ChatMessage,
  MemoryItem,
  PersonalIntelligenceProfile,
  FeatureSettings,
  ConversationMood,
  HDIEngineResult,
  Role,
} from '../types';

/**
 * HDI Engine のプロンプト構築モジュール。
 *
 * 設計書 3〜4章に基づき、Base AI (GPT-OSS 120B) に「装備」を与える。
 * UIはこのモジュールの結果のみを AI Provider に渡し、Base AI を直接扱わない。
 */

const BASE_IDENTITY = `あなたは TaskHDI(タスクHDI) の思考エンジンです。
TaskHDI は「その人専用のAI、自分専用の相棒」というコンセプトを持つ会話特化AIです。
あなた自身は「頭脳」であり、TaskHDI という製品そのものではありません。TaskHDI は HDI Engine (この指示を含む仕組み) があなたに装備を与えることで成立しています。

会話特化AIとして振る舞ってください。コード生成・コード編集・IDE操作・開発エージェント的な自律操作・PC自律操作は TaskHDI の対象外です（求められた場合は自然に、通常の会話の範囲でコードの説明や短いスニペットを示す程度に留め、大規模なコード生成やファイル操作の実行主体にはならないでください）。`;

const NLI_INSTRUCTION = `【自然言語理解】
比喩、誇張、冗談、皮肉、婉曲表現、ネットスラング、口語表現を文脈から適切に理解してください。
字面通りに過剰反応せず、ユーザーの意図を汲んでください。
ただし安全性に関わる内容（自傷・他害・違法行為の実行支援など）は文脈に関わらず慎重に扱ってください。`;

function buildMemorySection(memories: MemoryItem[]): string {
  if (memories.length === 0) return '';
  const lines = memories
    .sort((a, b) => b.importance - a.importance)
    .map((m) => `- [${m.category}] ${m.summary}`)
    .join('\n');
  return `【ユーザーについて記憶している情報】
以下はこれまでの会話から学習した、このユーザーに関する情報です。自然に会話に活かしてください。記憶していることを毎回明示的に述べる必要はありません。
${lines}`;
}

function buildPersonaSection(profile: PersonalIntelligenceProfile | null): string {
  if (!profile || profile.entries.length === 0) return '';
  const lines = profile.entries.map((e) => `- ${e.question} → ${e.answer}`).join('\n');
  return `【パーソナルインテリジェンス（ユーザーが直接答えた自己紹介情報）】
${lines}`;
}

function buildMoodSection(mood?: ConversationMood): string {
  if (!mood) return '';
  const moodMap: Record<ConversationMood, string> = {
    casual: '雑談として、リラックスした調子で応答してください。',
    consultation: '相談として受け止め、丁寧に状況を整理しながら応答してください。',
    joking: '冗談・軽いノリとして受け止めてください。過剰に真面目に返さないでください。',
    venting: '愚痴・不満の共有として受け止め、まず気持ちを受け止めることを優先してください。',
    ideation: 'アイデア出しの場として、発想を広げる方向で応答してください。',
    focused: '明確なタスク遂行として、簡潔かつ実用的に応答してください。',
  };
  return `【現在の会話状態の推定】\n${moodMap[mood]}`;
}

function buildRichRenderingSection(enabled: boolean): string {
  if (!enabled) return '';
  return `【表示形式】
必要に応じて Markdown（見出し、リスト、表、コードブロック）を活用して構造化された回答を作成してください。過剰な装飾は避け、内容に応じて自然に使い分けてください。`;
}

interface BuildPromptParams {
  history: ChatMessage[];
  latestUserInput: string;
  memories: MemoryItem[];
  personaProfile: PersonalIntelligenceProfile | null;
  features: FeatureSettings;
  mood?: ConversationMood;
  model: string;
}

/** 簡易的な会話状態推定。将来的にはBase AI自体に推定させる拡張も可能。 */
export function estimateMood(input: string): ConversationMood {
  const jokeMarkers = ['笑', 'w', 'ｗ', '草', 'lol'];
  const ventMarkers = ['疲れた', 'しんどい', 'つらい', 'ムカつく', '最悪'];
  const consultMarkers = ['どうすれば', 'どうしたら', '相談', 'べきですか', '悩んで'];
  const ideaMarkers = ['アイデア', 'ブレスト', '案を', '考えて'];

  const lower = input.toLowerCase();
  if (ventMarkers.some((m) => input.includes(m))) return 'venting';
  if (consultMarkers.some((m) => input.includes(m))) return 'consultation';
  if (ideaMarkers.some((m) => input.includes(m))) return 'ideation';
  if (jokeMarkers.some((m) => lower.includes(m))) return 'joking';
  return 'casual';
}

function messageToText(msg: ChatMessage): string {
  return msg.variants[msg.activeVariantIndex]?.content ?? '';
}

/**
 * HDI Engine のメインエントリーポイント。
 * 会話履歴・メモリ・パーソナリティ・機能設定を統合し、Base AI へ渡す最終形を組み立てる。
 */
export function buildHDIPrompt(params: BuildPromptParams): HDIEngineResult {
  const { history, latestUserInput, memories, personaProfile, features, model } = params;

  const mood = features.contextIntelligenceEnabled
    ? params.mood ?? estimateMood(latestUserInput)
    : undefined;

  const sections = [
    BASE_IDENTITY,
    features.nliEnabled ? NLI_INSTRUCTION : '',
    features.autonomousLearningEnabled ? buildMemorySection(memories) : '',
    buildPersonaSection(personaProfile),
    buildMoodSection(mood),
    buildRichRenderingSection(features.richRenderingEnabled),
  ].filter(Boolean);

  const systemPrompt = sections.join('\n\n');

  const messages: { role: Role; content: string }[] = history.map((m) => ({
    role: m.role,
    content: messageToText(m),
  }));

  return {
    systemPrompt,
    messages,
    context: {
      model,
      injectedMemories: memories,
      estimatedMood: mood,
      personaHints: personaProfile?.entries.map((e) => e.answer).join(' / '),
    },
  };
}
