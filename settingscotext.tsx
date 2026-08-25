import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import type { AppSettings } from '../types';
import { localStore, defaultSettings } from '../lib/localStore';
import { saveSettings as saveSettingsRemote, loadSettings as loadSettingsRemote } from '../lib/firestoreRepo';
import { useAuth } from './AuthContext';

interface SettingsContextValue {
  settings: AppSettings;
  updateSettings: (patch: Partial<AppSettings>) => void;
  updateApi: (patch: Partial<AppSettings['api']>) => void;
  updateDesign: (patch: Partial<AppSettings['design']>) => void;
  updateFeatures: (patch: Partial<AppSettings['features']>) => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

function hexToRgb(hex: string): string {
  const cleaned = hex.replace('#', '');
  const bigint = parseInt(cleaned, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `${r}, ${g}, ${b}`;
}

function applyDesignToDOM(design: AppSettings['design']) {
  const root = document.documentElement;

  // テーマモード解決
  let resolvedTheme: 'light' | 'dark' = 'light';
  if (design.themeMode === 'dark') resolvedTheme = 'dark';
  else if (design.themeMode === 'system') {
    resolvedTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  root.setAttribute('data-theme', resolvedTheme);
  root.setAttribute('data-font', design.fontFamily === 'default' ? '' : design.fontFamily);

  if (design.accentColor) {
    root.style.setProperty('--hdi-accent', design.accentColor);
    try {
      root.style.setProperty('--hdi-accent-rgb', hexToRgb(design.accentColor));
    } catch {
      // 不正なカラー値は無視
    }
  }
}

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [settings, setSettings] = useState<AppSettings>(() => localStore.getSettings() ?? defaultSettings);
  const loadedForUser = useRef<string | null>(null);

  // ログイン時にリモート設定を読み込む
  useEffect(() => {
    if (!user) {
      loadedForUser.current = null;
      return;
    }
    if (loadedForUser.current === user.uid) return;
    loadedForUser.current = user.uid;

    loadSettingsRemote(user.uid).then((remote) => {
      if (remote) {
        setSettings(remote);
        localStore.setSettings(remote);
      }
    });
  }, [user]);

  useEffect(() => {
    applyDesignToDOM(settings.design);
  }, [settings.design]);

  useEffect(() => {
    localStore.setSettings(settings);
    if (user) {
      saveSettingsRemote(user.uid, settings).catch((err) =>
        console.error('[Settings] remote save failed', err)
      );
    }
  }, [settings, user]);

  const updateSettings = useCallback((patch: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  }, []);

  const updateApi = useCallback((patch: Partial<AppSettings['api']>) => {
    setSettings((prev) => ({ ...prev, api: { ...prev.api, ...patch } }));
  }, []);

  const updateDesign = useCallback((patch: Partial<AppSettings['design']>) => {
    setSettings((prev) => ({ ...prev, design: { ...prev.design, ...patch } }));
  }, []);

  const updateFeatures = useCallback((patch: Partial<AppSettings['features']>) => {
    setSettings((prev) => ({ ...prev, features: { ...prev.features, ...patch } }));
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, updateApi, updateDesign, updateFeatures }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}
