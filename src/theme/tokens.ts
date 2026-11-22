// Tokens do Finora (Finora/MASTER.md e frontend/src/app/globals.css), claro e escuro.
import { useColorScheme } from 'react-native';

import type { Family } from '@/domain/categories';

const light = {
  bg: '#eef1f5',
  fg: '#111827',
  surface: '#ffffff',
  surface2: '#f1f4f8',
  border: '#d9dfe7',
  grid: '#e7ebf0',
  muted: '#4b5563',
  accent: '#8a5300',
  accentFg: '#ffffff',
  accent2: '#6436e0',
  positive: '#00745b',
  negative: '#c1311a',
  warning: '#9a5000',
  cardEdge: '#e1e6ed',
  toastBg: '#111827',
  toastFg: '#eef1f5',
  veil: 'rgba(0,0,0,0.45)',
  tint: 0.22,
  cat: {
    home: '#1d5fd6',
    food: '#a34600',
    move: '#6436e0',
    care: '#c01f6a',
    fun: '#006b7c',
    shop: '#4a7300',
    fin: '#4a5868',
    income: '#00745b',
  } as Record<Family, string>,
};

export type Palette = typeof light;

const dark: Palette = {
  bg: '#0d1115',
  fg: '#e6ebef',
  surface: '#141a20',
  surface2: '#1b232a',
  border: '#26303a',
  grid: '#1f272f',
  muted: '#8c99a5',
  accent: '#d2ac6a',
  accentFg: '#17120a',
  accent2: '#a78bfa',
  positive: '#4fcba8',
  negative: '#f2876b',
  warning: '#f0a848',
  cardEdge: 'transparent',
  toastBg: '#e6ebef',
  toastFg: '#0d1115',
  veil: 'rgba(0,0,0,0.55)',
  tint: 0.15,
  cat: {
    home: '#6ea8fe',
    food: '#f2a65a',
    move: '#a78bfa',
    care: '#f28ab5',
    fun: '#5bc8db',
    shop: '#b5cf6b',
    fin: '#9aa7b4',
    income: '#4fcba8',
  },
};

// Iguais nos dois temas (ilustração e atalhos em pastel)
export const TILE = { gold: '#e8cf8f', blue: '#a9c7d8', violet: '#c3b2f0', pink: '#f2b8cf', ink: '#1d1a16' };

export const FONT = {
  display: 'BricolageGrotesque_400Regular',
  displaySemi: 'BricolageGrotesque_600SemiBold',
  displayBold: 'BricolageGrotesque_700Bold',
  regular: 'Manrope_400Regular',
  medium: 'Manrope_500Medium',
  semi: 'Manrope_600SemiBold',
  bold: 'Manrope_700Bold',
};

export const RADIUS = { chip: 10, control: 12, card: 18, sheet: 28 };

/** Cor com transparência: o "color-mix(... var(--tint), transparent)" do web */
export function alpha(hex: string, a: number) {
  if (!hex.startsWith('#')) return hex;
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

export function useTheme() {
  const dark_ = useColorScheme() === 'dark';
  const c = dark_ ? dark : light;
  return { c, dark: dark_, tint: (hex: string) => alpha(hex, c.tint) };
}
