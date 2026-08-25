import { nanoid } from 'nanoid';
import type { Chat, ChatMessage, MessageVariant, Role } from '../types';

export function genId(): string {
  return nanoid(12);
}

export function createMessage(role: Role, content: string, attachments?: ChatMessage['attachments']): ChatMessage {
  const variant: MessageVariant = {
    id: genId(),
    content,
    createdAt: Date.now(),
  };
  return {
    id: genId(),
    role,
    variants: [variant],
    activeVariantIndex: 0,
    attachments,
    createdAt: Date.now(),
  };
}

export function createEmptyChat(): Chat {
  const now = Date.now();
  return {
    id: genId(),
    title: '新規チャット',
    messages: [],
    branches: [],
    activeBranchId: null,
    longTermMemoryEnabled: false,
    createdAt: now,
    updatedAt: now,
  };
}

/** メッセージ内容から短いタイトルを生成 */
export function deriveTitleFromText(text: string): string {
  const trimmed = text.trim().replace(/\s+/g, ' ');
  if (trimmed.length <= 24) return trimmed || '新規チャット';
  return trimmed.slice(0, 24) + '…';
}

export function formatRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'たった今';
  if (min < 60) return `${min}分前`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}時間前`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}日前`;
  return new Date(timestamp).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' });
}

export function groupChatsByRecency<T extends { updatedAt: number; pinned?: boolean }>(
  chats: T[]
): { label: string; items: T[] }[] {
  const now = Date.now();
  const oneDay = 86400000;
  const groups: Record<string, T[]> = {
    ピン留め: [],
    今日: [],
    昨日: [],
    過去7日間: [],
    過去30日間: [],
    それ以前: [],
  };

  for (const chat of chats) {
    if (chat.pinned) {
      groups['ピン留め'].push(chat);
      continue;
    }
    const diff = now - chat.updatedAt;
    if (diff < oneDay) groups['今日'].push(chat);
    else if (diff < oneDay * 2) groups['昨日'].push(chat);
    else if (diff < oneDay * 7) groups['過去7日間'].push(chat);
    else if (diff < oneDay * 30) groups['過去30日間'].push(chat);
    else groups['それ以前'].push(chat);
  }

  return Object.entries(groups)
    .filter(([, items]) => items.length > 0)
    .map(([label, items]) => ({ label, items }));
}

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

export function isImageFile(type: string): boolean {
  return type.startsWith('image/');
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}
