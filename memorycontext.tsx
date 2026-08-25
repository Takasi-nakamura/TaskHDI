import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import type { MemoryItem, MemoryExtractionResult } from '../types';
import { localStore } from '../lib/localStore';
import {
  saveMemory as saveMemoryRemote,
  saveMemoriesBatch,
  deleteMemoryDoc,
  deleteAllMemoriesDoc,
  loadAllMemories,
} from '../lib/firestoreRepo';
import { useAuth } from './AuthContext';
import { genId } from '../lib/utils';

interface MemoryContextValue {
  memories: MemoryItem[];
  applyExtractionResult: (result: MemoryExtractionResult, sourceChatId: string) => void;
  updateMemory: (id: string, patch: Partial<MemoryItem>) => void;
  deleteMemory: (id: string) => void;
  deleteAllMemories: () => void;
  toggleLongTerm: (id: string) => void;
}

const MemoryContext = createContext<MemoryContextValue | null>(null);

export function MemoryProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [memories, setMemories] = useState<MemoryItem[]>(() => localStore.getMemories());
  const loadedForUser = useRef<string | null>(null);

  useEffect(() => {
    if (!user) {
      loadedForUser.current = null;
      return;
    }
    if (loadedForUser.current === user.uid) return;
    loadedForUser.current = user.uid;

    loadAllMemories(user.uid).then((remote) => {
      if (remote.length > 0) {
        setMemories(remote);
        localStore.setMemories(remote);
      }
    });
  }, [user]);

  useEffect(() => {
    localStore.setMemories(memories);
  }, [memories]);

  const applyExtractionResult = useCallback(
    (result: MemoryExtractionResult, sourceChatId: string) => {
      setMemories((prev) => {
        let next = [...prev];

        // 更新
        for (const upd of result.updatedMemories) {
          next = next.map((m) =>
            m.id === upd.id && !m.userEdited
              ? {
                  ...m,
                  summary: upd.summary ?? m.summary,
                  importance: upd.importance ?? m.importance,
                  updatedAt: Date.now(),
                }
              : m
          );
        }

        // 廃止
        next = next.filter((m) => !result.deprecatedMemoryIds.includes(m.id));

        // 新規追加
        const now = Date.now();
        const created: MemoryItem[] = result.newMemories.map((nm) => ({
          ...nm,
          id: genId(),
          sourceChatId,
          createdAt: now,
          updatedAt: now,
        }));
        next = [...next, ...created];

        if (user) {
          saveMemoriesBatch(user.uid, [...created]).catch((err) =>
            console.error('[Memory] batch save failed', err)
          );
        }

        return next;
      });
    },
    [user]
  );

  const updateMemory = useCallback(
    (id: string, patch: Partial<MemoryItem>) => {
      setMemories((prev) => {
        const next = prev.map((m) =>
          m.id === id ? { ...m, ...patch, userEdited: true, updatedAt: Date.now() } : m
        );
        const updated = next.find((m) => m.id === id);
        if (user && updated) {
          saveMemoryRemote(user.uid, updated).catch((err) => console.error('[Memory] save failed', err));
        }
        return next;
      });
    },
    [user]
  );

  const deleteMemory = useCallback(
    (id: string) => {
      setMemories((prev) => prev.filter((m) => m.id !== id));
      if (user) {
        deleteMemoryDoc(user.uid, id).catch((err) => console.error('[Memory] delete failed', err));
      }
    },
    [user]
  );

  const deleteAllMemories = useCallback(() => {
    setMemories([]);
    if (user) {
      deleteAllMemoriesDoc(user.uid).catch((err) => console.error('[Memory] delete all failed', err));
    }
  }, [user]);

  const toggleLongTerm = useCallback(
    (id: string) => {
      setMemories((prev) => {
        const next = prev.map((m) =>
          m.id === id ? { ...m, isLongTerm: !m.isLongTerm, updatedAt: Date.now() } : m
        );
        const updated = next.find((m) => m.id === id);
        if (user && updated) {
          saveMemoryRemote(user.uid, updated).catch((err) => console.error('[Memory] save failed', err));
        }
        return next;
      });
    },
    [user]
  );

  return (
    <MemoryContext.Provider
      value={{ memories, applyExtractionResult, updateMemory, deleteMemory, deleteAllMemories, toggleLongTerm }}
    >
      {children}
    </MemoryContext.Provider>
  );
}

export function useMemory(): MemoryContextValue {
  const ctx = useContext(MemoryContext);
  if (!ctx) throw new Error('useMemory must be used within MemoryProvider');
  return ctx;
}
