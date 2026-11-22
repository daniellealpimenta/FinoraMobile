import { Pressable, StyleSheet, View } from 'react-native';

import { category } from '@/domain/categories';
import { money } from '@/lib/format';
import type { TxView } from '@/state/finance';
import { usePrefs } from '@/state/prefs';
import { FONT, useTheme } from '@/theme/tokens';

import { CategoryIcon } from './category-icon';
import { T } from './ui';

export function TxRow({ tx, first, onPress }: { tx: TxView; first?: boolean; onPress: () => void }) {
  const { c } = useTheme();
  const { hidden } = usePrefs();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${tx.description}, ${money(tx.amountCents, { sign: true, hidden })}. Toque para trocar a categoria.`}
      style={({ pressed }) => [s.row, !first && { borderTopWidth: StyleSheet.hairlineWidth * 2, borderTopColor: c.border }, pressed && { opacity: 0.6 }]}>
      <CategoryIcon categoryKey={tx.categoryKey} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <T style={{ fontSize: 14, fontFamily: FONT.semi }} numberOfLines={1}>
          {tx.description}
        </T>
        <T v="label" numberOfLines={1}>
          {category(tx.categoryKey).name} · {tx.manual ? 'anotado' : tx.accountName}
        </T>
      </View>
      <T v="value" color={tx.amountCents > 0 ? c.positive : c.fg} style={{ fontSize: 14 }}>
        {money(tx.amountCents, { sign: true, hidden })}
      </T>
    </Pressable>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, minHeight: 58 },
});
