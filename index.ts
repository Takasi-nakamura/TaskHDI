// ============================================
// TaskHDI 型定義
// ============================================

export type Role = 'user' | 'assistant' | 'system';

/** 再編集・再生成による複数バリエーションを持つメッセージノード */
export interface MessageVariant {
  id: string;
  content: string;
  createdAt: number;
  /** このバリエーション生成時に参照されたメモリID群（デバッグ/透明性用） */
  usedMemoryIds?: string[];
}

export interface ChatMessage {
  id: string;
  role: Role;
  /** 複数バリエーション（再編集/再生成の結果） */
  variants: MessageVariant[];
  /** 現在表示中のバリエーションindex */
  activeVariantIndex: number;
  /** 添付ファイル */
  attachments?: ChatAttachment[];
  createdAt: number;
}

export interface ChatAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  /** テキスト系は中身を保持、画像はdataURL */
  content?: string;
  dataUrl?: string;
}

/**
 * 会話は分岐構造を持つ。
 * 過去メッセージを編集して再送信すると、その時点から新しい分岐(branch)が生まれる。
 * messages は「現在アクティブな分岐」のフラットな配列として保持し、
 * branches に分岐のスナップショットを保存する。
 */
export interface ChatBranch {
  id: string;
  /** 分岐が始まった元メッセージのindex */
  forkFromIndex: number;
  messages: ChatMessage[];
  createdAt: number;
}

export interface Chat {
  id: string;
  title: string;
  messages: ChatMessage[];
  branches: ChatBranch[];
  activeBranchId: string | null;
  /** このチャットで長期記憶を利用するか */
  longTermMemoryEnabled: boolean;
  createdAt: number;
  updatedAt: number;
  pinned?: boolean;
}

// ============================================
// メモリ (自律学習・長期記憶)
// ============================================

export type MemoryCategory =
  | 'preference'   // 好み・性格傾向
  | 'fact'         // 事実情報
  | 'context'      // 進行中の文脈・プロジェクト
  | 'skill'        // スキル・専門性
  | 'communication'; // 話し方の好み

export interface MemoryItem {
  id: string;
  category: MemoryCategory;
  /** 短い要約文 */
  summary: string;
  /** 重要度 (0-100)。高いほど優先的に呼び出される */
  importance: number;
  /** 由来チャットID */
  sourceChatId: string;
  /** このメモリが長期記憶(チャット横断)として昇格しているか */
  isLongTerm: boolean;
  createdAt: number;
  updatedAt: number;
  /** ユーザーが手動編集したか（自動更新から保護） */
  userEdited?: boolean;
}

// ============================================
// パーソナルインテリジェンス (ユーザープロファイル)
// ============================================

export interface PersonalIntelligenceProfile {
  /** セットアップが完了しているか */
  setupCompleted: boolean;
  /** 現在の質問ステップ（未完了時） */
  currentStep: number;
  /** 自然文で蓄積された回答群 */
  entries: PersonalIntelligenceEntry[];
}

export interface PersonalIntelligenceEntry {
  id: string;
  question: string;
  answer: string;
  createdAt: number;
}

// ============================================
// 設定
// ============================================

export type ThemeMode = 'light' | 'dark' | 'system';

export interface DesignSettings {
  themeMode: ThemeMode;
  accentColor: string;
  fontFamily: 'default' | 'rounded' | 'mono' | 'serif';
}

export interface ApiSettings {
  provider: 'openrouter';
  apiKey: string;
  model: string;
  /** 応答の多様性 */
  temperature: number;
}

export interface FeatureSettings {
  /** 自律学習そのもののON/OFF（大元スイッチ） */
  autonomousLearningEnabled: boolean;
  /** コンテキスト・インテリジェンス */
  contextIntelligenceEnabled: boolean;
  /** Natural Language Intelligence */
  nliEnabled: boolean;
  /** 表示形式群（Markdown拡張、図解など）を許可するか */
  richRenderingEnabled: boolean;
}

export interface AppSettings {
  api: ApiSettings;
  design: DesignSettings;
  features: FeatureSettings;
}

// ============================================
// HDI Engine 関連
// ============================================

export interface HDIEngineContext {
  /** 呼び出すBase AIモデル */
  model: string;
  /** このターンで実際に注入されたメモリ */
  injectedMemories: MemoryItem[];
  /** 会話状態の推定（雑談/相談/冗談 等） */
  estimatedMood?: ConversationMood;
  /** パーソナリティ適応の要約（システムプロンプトに混ぜ込む） */
  personaHints?: string;
}

export type ConversationMood =
  | 'casual'      // 雑談
  | 'consultation'// 相談
  | 'joking'      // 冗談
  | 'venting'     // 愚痴
  | 'ideation'    // アイデア出し
  | 'focused';    // 作業寄り・明確なタスク

export interface HDIEngineResult {
  /** Base AIへ渡す最終システムプロンプト */
  systemPrompt: string;
  /** Base AIへ渡すメッセージ列 */
  messages: { role: Role; content: string }[];
  context: HDIEngineContext;
}

/** メモリ抽出（自律学習）の結果 */
export interface MemoryExtractionResult {
  newMemories: Omit<MemoryItem, 'id' | 'createdAt' | 'updatedAt' | 'sourceChatId'>[];
  updatedMemories: { id: string; summary?: string; importance?: number }[];
  /** 重複などで削除すべきメモリID */
  deprecatedMemoryIds: string[];
}

// ============================================
// User / Auth
// ============================================

export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}
