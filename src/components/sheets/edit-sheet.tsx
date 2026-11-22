// Trocar a categoria de uma transação (e das parecidas). Lançamento manual também pode ser apagado.
// No modo conectado, "aplicar às parecidas" cria uma regra no Finora do computador, que passa a
// valer também para o que chegar do banco depois.
import { Trash2 } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Switch, View } from 'react-native';

import { category, EXPENSE_KEYS, INCOME_KEYS } from '@/domain/categories';
import { dayLabel } from '@/domain/cycle';
import type { Mood } from '@/domain/pila';
import { money } from '@/lib/format';
import { useFinance } from '@/state/finance';
import { usePrefs } from '@/state/prefs';
import { FONT, RADIUS, useTheme } from '@/theme/tokens';

import { CategoryIcon } from '../category-icon';
import { Sheet } from '../sheet';
import { Row, T } from '../ui';

type Toast = (text: string, mood?: Mood) => void;

const errorText = (e: unknown) => (e instanceof Error ? e.message : String(e));

export function EditSheet({ id, onClose, toast }: { id: number | null; onClose: () => void; toast: Toast }) {
  const { c } = useTheme();
  const { txs, today, actions, mode } = useFinance();
  const { hidden } = usePrefs();
  const [similar, setSimilar] = useState(true);
  const [busy, setBusy] = useState(false);
  const t = txs.find((x) => x.id === id);
  const others = t ? txs.filter((x) => x.description === t.description && x.id !== t.id).length : 0;
  // No conectado a regra vale para o histórico todo, não só para as deste ciclo
  const canApplySimilar = mode === 'remote' || others > 0;
  const options = t && t.amountCents > 0 ? INCOME_KEYS : EXPENSE_KEYS;

  const choose = async (key: string) => {
    if (!t || busy) return;
    setBusy(true);
    try {
      const n = await actions.recategorize(t.id, key, similar && canApplySimilar);
      onClose();
      toast(
        n === 'rule'
          ? `Agora é ${category(key).name}, e as parecidas também.`
          : n > 1
            ? `Troquei ${n} transações para ${category(key).name}.`
            : `Agora é ${category(key).name}.`,
        'happy',
      );
    } catch (e) {
      toast(errorText(e), 'worried');
    } finally {
      setBusy(false);
    }
  };

  const remove = () => {
    if (!t) return;
    Alert.alert('Apagar lançamento?', `${t.description}, ${money(t.amountCents, { sign: true })}`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Apagar',
        style: 'destructive',
        onPress: async () => {
          try {
            await actions.deleteEntry(t.id);
            onClose();
            toast('Lançamento apagado.', 'neutral');
          } catch (e) {
            toast(errorText(e), 'worried');
          }
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
                {dayLabel(t.date, today)} · {t.accountName}
              </T>
            </View>
            <T v="value" color={t.amountCents > 0 ? c.positive : c.fg}>
              {money(t.amountCents, { sign: true, hidden })}
            </T>
          </Row>
          {t.manual && mode === 'remote' && (
            <T v="label" style={{ marginTop: -6, marginBottom: 12, lineHeight: 17 }}>
              Anotado no celular. Quando o banco mandar este gasto, o Finora troca este pelo do banco e mantém a categoria.
            </T>
          )}
          <Row style={{ marginBottom: 8 }}>
            <T v="label" style={{ flex: 1 }}>
              Categoria
            </T>
            {busy && <ActivityIndicator size="small" color={c.accent} />}
          </Row>
          <View style={s.grid}>
            {options.map((k) => {
              const on = k === t.categoryKey;
              return (
                <Pressable
                  key={k}
                  onPress={() => choose(k)}
                  disabled={busy}
                  accessibilityRole="button"
                  accessibilityState={{ selected: on }}
                  style={[s.cell, { backgroundColor: c.surface2, borderColor: on ? c.accent : 'transparent', opacity: busy ? 0.5 : 1 }]}>
                  <CategoryIcon categoryKey={k} small />
                  <T v="label" color={c.fg} style={{ fontFamily: FONT.semi, textAlign: 'center' }} numberOfLines={2}>
                    {category(k).name}
                  </T>
                </Pressable>
              );
            })}
          </View>
          {canApplySimilar && (
            <Row style={{ marginTop: 16 }}>
              <View style={{ flex: 1 }}>
                <T v="title">Aplicar às parecidas</T>
                <T v="label">
                  {mode === 'remote' ? `Cria uma regra para "${t.description}"` : `Mais ${others} com "${t.description}"`}
                </T>
              </View>
              <Switch value={similar} onValueChange={setSimilar} trackColor={{ true: c.accent, false: c.border }} thumbColor={c.surface} />
            </Row>
          )}
          {t.manual && (
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
