// Preferências pequenas (o "@AppStorage" do app), no kv-store do expo-sqlite.
import Storage from 'expo-sqlite/kv-store';
import { useSyncExternalStore } from 'react';
import { Appearance } from 'react-native';

export type ThemePref = 'system' | 'light' | 'dark';
/** demo = mês de exemplo no celular; remote = Finora do computador pela Tailscale */
export type Mode = 'demo' | 'remote';
type Prefs = {
  hidden: boolean;
  lockOnOpen: boolean;
  theme: ThemePref;
  mode: Mode | null;
  // Finora conectado (o token fica no expo-secure-store, não aqui)
  serverUrl: string | null;
  deviceId: number | null;
  email: string | null;
};

const DEFAULTS: Prefs = { hidden: false, lockOnOpen: true, theme: 'system', mode: null, serverUrl: null, deviceId: null, email: null };

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
  setPrefs({ [key]: value } as Partial<Prefs>);
}

export function setPrefs(patch: Partial<Prefs>) {
  state = { ...state, ...patch };
  try {
    Storage.setItemSync('prefs', JSON.stringify(state));
  } catch {
    // sem armazenamento: vale só nesta sessão
  }
  if (patch.theme) applyTheme(patch.theme);
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
