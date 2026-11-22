// Trocar a categoria de uma transação (e das parecidas). Lançamento manual também pode ser apagado.
import { Trash2 } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Switch, View } from 'react-native';

import { deleteEntry, recategorize } from '@/db/repo';
import { category, EXPENSE_KEYS, INCOME_KEYS } from '@/domain/categories';
import { dayLabel } from '@/domain/cycle';
import { money } from '@/lib/format';
import { useFinance } from '@/state/finance';
import { usePrefs } from '@/state/prefs';
import { FONT, RADIUS, useTheme } from '@/theme/tokens';

import { CategoryIcon } from '../category-icon';
import { Sheet } from '../sheet';
import { Row, T } from '../ui';

type Toast = (text: string, mood?: 'happy' | 'neutral' | 'worried' | 'celebrate') => void;

export function EditSheet({ id, onClose, toast }: { id: number | null; onClose: () => void; toast: Toast }) {
  const { c } = useTheme();
  const { txs, today, cardId } = useFinance();
  const { hidden } = usePrefs();
  const [similar, setSimilar] = useState(true);
  const t = txs.find((x) => x.id === id);
  const others = t ? txs.filter((x) => x.description === t.description && x.id !== t.id).length : 0;
  const options = t && t.amountCents > 0 ? INCOME_KEYS : EXPENSE_KEYS;

  const choose = (key: string) => {
    if (!t) return;
    const n = recategorize(t.id, key, similar && others > 0);
    toast(n > 1 ? `Troquei ${n} transações para ${category(key).name}.` : `Agora é ${category(key).name}.`, 'happy');
    onClose();
  };

  const remove = () => {
    if (!t) return;
    Alert.alert('Apagar lançamento?', `${t.description}, ${money(t.amountCents, { sign: true })}`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Apagar',
        style: 'destructive',
        onPress: () => {
          deleteEntry(t.id);
          onClose();
          toast('Lançamento apagado.', 'neutral');
        },
      },
    ]);
  };

  return (
    <Sheet visible={!!t} onClose={onClose} label="Trocar categoria">
      {t && (
        <>
          <Row style={{ marginBottom: 14 }} gap={12}>
            <CategoryIcon categoryKey={t.categoryKey} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <T v="title" numberOfLines={1}>
                {t.description}
              </T>
              <T v="label">
                {dayLabel(t.date, today)} · {t.accountId === cardId ? 'Cartão' : 'Conta'}
              </T>
            </View>
            <T v="value" color={t.amountCents > 0 ? c.positive : c.fg}>
              {money(t.amountCents, { sign: true, hidden })}
            </T>
          </Row>
          <T v="label" style={{ marginBottom: 8 }}>
            Categoria
          </T>
          <View style={s.grid}>
            {options.map((k) => {
              const on = k === t.categoryKey;
              return (
                <Pressable
                  key={k}
                  onPress={() => choose(k)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: on }}
                  style={[s.cell, { backgroundColor: c.surface2, borderColor: on ? c.accent : 'transparent' }]}>
                  <CategoryIcon categoryKey={k} small />
                  <T v="label" color={c.fg} style={{ fontFamily: FONT.semi, textAlign: 'center' }}>
                    {category(k).name}
                  </T>
                </Pressable>
              );
            })}
          </View>
          {others > 0 && (
            <Row style={{ marginTop: 16 }}>
              <View style={{ flex: 1 }}>
                <T v="title">Aplicar às parecidas</T>
                <T v="label">
                  Mais {others} com &quot;{t.description}&quot;
                </T>
              </View>
              <Switch value={similar} onValueChange={setSimilar} trackColor={{ true: c.accent, false: c.border }} thumbColor={c.surface} />
            </Row>
          )}
          {t.source === 'MANUAL' && (
            <Pressable onPress={remove} accessibilityRole="button" style={[s.danger, { borderColor: c.border }]}>
              <Trash2 size={18} color={c.negative} />
              <T v="title" color={c.negative}>
                Apagar lançamento
              </T>
            </Pressable>
          )}
        </>
      )}
    </Sheet>
  );
}

const s = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  cell: { width: '31.5%', flexGrow: 1, minHeight: 78, borderRadius: 14, borderWidth: 2, alignItems: 'center', justifyContent: 'center', gap: 6, padding: 8 },
  danger: { flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', minHeight: 48, borderRadius: RADIUS.control, borderWidth: 1, marginTop: 16 },
});
