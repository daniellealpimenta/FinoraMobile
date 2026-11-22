// Peças básicas no padrão do Finora web (MASTER.md, "Componentes").
import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, type TextStyle, View, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FONT, RADIUS, useTheme } from '@/theme/tokens';

type TV = 'body' | 'label' | 'title' | 'value' | 'strong' | 'page' | 'display';

const VARIANT: Record<TV, TextStyle> = {
  body: { fontFamily: FONT.regular, fontSize: 15, lineHeight: 22 },
  label: { fontFamily: FONT.medium, fontSize: 12, lineHeight: 16 },
  title: { fontFamily: FONT.semi, fontSize: 15, lineHeight: 20 },
  value: { fontFamily: FONT.medium, fontSize: 15 },
  strong: { fontFamily: FONT.bold, fontSize: 15 },
  page: { fontFamily: FONT.displayBold, fontSize: 28, letterSpacing: -0.6, lineHeight: 34 },
  display: { fontFamily: FONT.display, fontSize: 38, letterSpacing: -1.1 },
};

export function T({
  v = 'body',
  color,
  muted,
  style,
  children,
  numberOfLines,
}: {
  v?: TV;
  color?: string;
  muted?: boolean;
  style?: TextStyle | TextStyle[];
  children: ReactNode;
  numberOfLines?: number;
}) {
  const { c } = useTheme();
  return (
    <Text
      numberOfLines={numberOfLines}
      style={[VARIANT[v], { color: color ?? (muted || v === 'label' ? c.muted : c.fg), fontVariant: ['tabular-nums'] }, style]}>
      {children}
    </Text>
  );
}

export function Card({ children, style, padded = true }: { children: ReactNode; style?: ViewStyle; padded?: boolean }) {
  const { c } = useTheme();
  return (
    <View
      style={[
        { backgroundColor: c.surface, borderRadius: RADIUS.card, borderWidth: 1, borderColor: c.cardEdge },
        padded && { padding: 18 },
        style,
      ]}>
      {children}
    </View>
  );
}

export function Row({ children, style, gap = 10 }: { children: ReactNode; style?: ViewStyle; gap?: number }) {
  return <View style={[{ flexDirection: 'row', alignItems: 'center', gap }, style]}>{children}</View>;
}

export function IconButton({ onPress, label, children, style }: { onPress?: () => void; label: string; children: ReactNode; style?: ViewStyle }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={4}
      style={({ pressed }) => [s.iconBtn, pressed && { opacity: 0.6 }, style]}>
      {children}
    </Pressable>
  );
}

export function Pill({ color, icon, children }: { color: string; icon?: ReactNode; children: ReactNode }) {
  const { tint } = useTheme();
  return (
    <View style={[s.pill, { backgroundColor: tint(color) }]}>
      {icon}
      <T v="label" color={color} style={{ fontFamily: FONT.semi }}>
        {children}
      </T>
    </View>
  );
}

export function Segmented<K extends string>({
  options,
  value,
  onChange,
  full,
}: {
  options: [K, string][];
  value: K;
  onChange: (k: K) => void;
  full?: boolean;
}) {
  const { c } = useTheme();
  return (
    <View style={[s.seg, { backgroundColor: c.surface2 }, full && { alignSelf: 'stretch' }]}>
      {options.map(([k, label]) => {
        const on = k === value;
        return (
          <Pressable
            key={k}
            onPress={() => onChange(k)}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            style={[s.segBtn, full && { flex: 1 }, on && { backgroundColor: c.surface }]}>
            <T v="label" color={on ? c.fg : c.muted} style={{ fontFamily: FONT.semi, fontSize: 13 }}>
              {label}
            </T>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Bar({ value, color, height = 8 }: { value: number; color: string; height?: number }) {
  const { c } = useTheme();
  return (
    <View style={{ height, borderRadius: 999, backgroundColor: c.surface2, overflow: 'hidden' }}>
      <View style={{ width: `${Math.max(0, Math.min(value, 1)) * 100}%`, height: '100%', borderRadius: 999, backgroundColor: color }} />
    </View>
  );
}

export function Divider() {
  const { c } = useTheme();
  return <View style={{ height: StyleSheet.hairlineWidth * 2, backgroundColor: c.border }} />;
}

/** Tela com rolagem, já respeitando o entalhe e a barra de abas */
export function Screen({ children, tabs = true }: { children: ReactNode; tabs?: boolean }) {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: c.bg }}
      contentContainerStyle={{ paddingTop: insets.top + 8, paddingHorizontal: 16, paddingBottom: (tabs ? 110 : 24) + insets.bottom, gap: 12 }}
      showsVerticalScrollIndicator={false}>
      {children}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  iconBtn: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 9, paddingVertical: 3, borderRadius: 999, alignSelf: 'flex-start' },
  seg: { flexDirection: 'row', padding: 3, borderRadius: RADIUS.control, alignSelf: 'flex-start' },
  segBtn: { minHeight: 34, paddingHorizontal: 12, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
});
