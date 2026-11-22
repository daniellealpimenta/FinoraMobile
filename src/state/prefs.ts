// Preferências pequenas (o "@AppStorage" do app), no kv-store do expo-sqlite.
import Storage from 'expo-sqlite/kv-store';
import { useSyncExternalStore } from 'react';
import { Appearance } from 'react-native';

export type ThemePref = 'system' | 'light' | 'dark';
type Prefs = { hidden: boolean; lockOnOpen: boolean; theme: ThemePref };

const DEFAULTS: Prefs = { hidden: false, lockOnOpen: true, theme: 'system' };

function load(): Prefs {
  try {
    const raw = Storage.getItemSync('prefs');
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS;
  } catch {
    return DEFAULTS;
  }
}

let state = load();
const listeners = new Set<() => void>();

function applyTheme(t: ThemePref) {
  Appearance.setColorScheme(t === 'system' ? 'unspecified' : t);
}
applyTheme(state.theme);

export function setPref<K extends keyof Prefs>(key: K, value: Prefs[K]) {
  state = { ...state, [key]: value };
  try {
    Storage.setItemSync('prefs', JSON.stringify(state));
  } catch {
    // sem armazenamento: vale só nesta sessão
  }
  if (key === 'theme') applyTheme(value as ThemePref);
  listeners.forEach((l) => l());
}

export function getPrefs() {
  return state;
}

export function usePrefs() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => state,
  );
}
