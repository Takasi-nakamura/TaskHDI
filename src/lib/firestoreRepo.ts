import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  orderBy,
  writeBatch,
} from 'firebase/firestore';
import { db } from './firebase';
import type { AppSettings, Chat, MemoryItem, PersonalIntelligenceProfile } from '../types';

/**
 * Firestore データ構造:
 * users/{uid}/chats/{chatId}
 * users/{uid}/memories/{memoryId}
 * users/{uid}/settings/app   (単一ドキュメント)
 * users/{uid}/personalIntelligence/profile  (単一ドキュメント)
 */

function chatsCol(uid: string) {
  return collection(db, 'users', uid, 'chats');
}
function memoriesCol(uid: string) {
  return collection(db, 'users', uid, 'memories');
}

// --- Chats ---

export async function saveChat(uid: string, chat: Chat): Promise<void> {
  await setDoc(doc(chatsCol(uid), chat.id), chat);
}

export async function deleteChatDoc(uid: string, chatId: string): Promise<void> {
  await deleteDoc(doc(chatsCol(uid), chatId));
}

export async function loadAllChats(uid: string): Promise<Chat[]> {
  const q = query(chatsCol(uid), orderBy('updatedAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as Chat);
}

// --- Memories ---

export async function saveMemory(uid: string, memory: MemoryItem): Promise<void> {
  await setDoc(doc(memoriesCol(uid), memory.id), memory);
}

export async function saveMemoriesBatch(uid: string, memories: MemoryItem[]): Promise<void> {
  const batch = writeBatch(db);
  for (const m of memories) {
    batch.set(doc(memoriesCol(uid), m.id), m);
  }
  await batch.commit();
}

export async function deleteMemoryDoc(uid: string, memoryId: string): Promise<void> {
  await deleteDoc(doc(memoriesCol(uid), memoryId));
}

export async function deleteAllMemoriesDoc(uid: string): Promise<void> {
  const snap = await getDocs(memoriesCol(uid));
  const batch = writeBatch(db);
  snap.docs.forEach((d) => batch.delete(d.ref));
  await batch.commit();
}

export async function loadAllMemories(uid: string): Promise<MemoryItem[]> {
  const snap = await getDocs(memoriesCol(uid));
  return snap.docs.map((d) => d.data() as MemoryItem);
}

// --- Settings ---

export async function saveSettings(uid: string, settings: AppSettings): Promise<void> {
  await setDoc(doc(db, 'users', uid, 'settings', 'app'), settings);
}

export async function loadSettings(uid: string): Promise<AppSettings | null> {
  const snap = await getDoc(doc(db, 'users', uid, 'settings', 'app'));
  return snap.exists() ? (snap.data() as AppSettings) : null;
}

// --- Personal Intelligence ---

export async function savePersonalProfile(uid: string, profile: PersonalIntelligenceProfile): Promise<void> {
  await setDoc(doc(db, 'users', uid, 'personalIntelligence', 'profile'), profile);
}

export async function loadPersonalProfile(uid: string): Promise<PersonalIntelligenceProfile | null> {
  const snap = await getDoc(doc(db, 'users', uid, 'personalIntelligence', 'profile'));
  return snap.exists() ? (snap.data() as PersonalIntelligenceProfile) : null;
}
