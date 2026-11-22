// Barra de abas da versão A: Início, Transações, [+ Lançar], Cofrinhos, Mais.
// O "+" não é uma tela: abre a folha de novo lançamento por cima de qualquer aba.
import type { BottomTabBarProps } from 'expo-router/tabs';
import * as Haptics from 'expo-haptics';
import { Ellipsis, House, List, type LucideIcon, PiggyBank, Plus } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useUI } from '@/state/ui';
import { FONT, useTheme } from '@/theme/tokens';

import { T } from './ui';

const TABS: Record<string, { label: string; icon: LucideIcon; tone: 'accent' | 'home' | 'care' | 'muted' }> = {
  inicio: { label: 'Início', icon: House, tone: 'accent' },
  transacoes: { label: 'Transações', icon: List, tone: 'home' },
  cofrinhos: { label: 'Cofrinhos', icon: PiggyBank, tone: 'care' },
  mais: { label: 'Mais', icon: Ellipsis, tone: 'muted' },
};

export function TabBar({ state, navigateToTab }: BottomTabBarProps) {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const { openAdd } = useUI();

  const tab = (routeName: string, key: string, index: number) => {
    const t = TABS[routeName];
    if (!t) return null;
    const focused = state.index === index;
    const tone = t.tone === 'accent' ? c.accent : t.tone === 'muted' ? c.fg : c.cat[t.tone];
    const Icon = t.icon;
    return (
      <Pressable
        key={key}
        accessibilityRole="tab"
        accessibilityState={{ selected: focused }}
        accessibilityLabel={t.label}
        onPress={() => {
          if (focused) return;
          Haptics.selectionAsync();
          navigateToTab(key);
        }}
        style={s.tab}>
        <Icon size={22} color={focused ? tone : c.muted} strokeWidth={focused ? 2.4 : 2} />
        <T v="label" color={focused ? c.fg : c.muted} style={{ fontFamily: FONT.semi }}>
          {t.label}
        </T>
      </Pressable>
    );
  };

  const routes = state.routes.map((r, i) => tab(r.name, r.key, i));

  return (
    <View style={[s.bar, { backgroundColor: c.surface, borderTopColor: c.border, paddingBottom: Math.max(insets.bottom, 10) }]}>
      {routes.slice(0, 2)}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Novo lançamento"
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          openAdd();
        }}
        style={s.tab}>
        <View style={[s.add, { backgroundColor: c.accent, borderColor: c.bg }]}>
          <Plus size={28} color={c.accentFg} strokeWidth={2.6} />
        </View>
        <T v="label" style={{ fontFamily: FONT.semi }} muted>
          Lançar
        </T>
      </Pressable>
      {routes.slice(2)}
    </View>
  );
}

const s = StyleSheet.create({
  bar: { position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 10, elevation: 10, flexDirection: 'row', alignItems: 'flex-end', paddingTop: 6, paddingHorizontal: 6, borderTopWidth: StyleSheet.hairlineWidth * 2 },
  tab: { flex: 1, alignItems: 'center', gap: 2, minHeight: 48, justifyContent: 'flex-end' },
  add: { width: 58, height: 58, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginTop: -26, borderWidth: 5 },
});
