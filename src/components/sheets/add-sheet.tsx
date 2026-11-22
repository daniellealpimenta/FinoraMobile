// Novo lançamento em três toques: valor (teclado próprio), categoria, salvar.
// Mostra antes de salvar quanto vai sobrar por dia.
import * as Haptics from 'expo-haptics';
import { Delete, List, X } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { addEntry } from '@/db/repo';
import { category, EXPENSE_KEYS, INCOME_KEYS } from '@/domain/categories';
import { budgetStatus } from '@/domain/forecast';
import { keypadCents, money } from '@/lib/format';
import { useFinance } from '@/state/finance';
import { usePrefs } from '@/state/prefs';
import { FONT, RADIUS, useTheme } from '@/theme/tokens';

import { CategoryIcon } from '../category-icon';
import { Sheet } from '../sheet';
import { IconButton, Row, Segmented, T } from '../ui';

type Toast = (text: string, mood?: 'happy' | 'neutral' | 'worried' | 'celebrate') => void;

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '00', '0', 'del'];

export function AddSheet({ visible, onClose, toast }: { visible: boolean; onClose: () => void; toast: Toast }) {
  const { c, tint } = useTheme();
  const { summary, budgets } = useFinance();
  const { hidden } = usePrefs();
  const [digits, setDigits] = useState('');
  const [kind, setKind] = useState<'out' | 'in'>('out');
  const [cat, setCat] = useState('delivery');
  const [pay, setPay] = useState<'card' | 'pix'>('card');
  const [desc, setDesc] = useState('');

  // Zera o valor e a descrição ao fechar (o tipo e a categoria ficam para o próximo)
  const close = () => {
    setDigits('');
    setDesc('');
    onClose();
  };

  const cents = keypadCents(digits);
  const after = Math.floor((summary.spendableCents + (kind === 'out' ? -cents : cents)) / summary.daysLeft);
  const cats = kind === 'out' ? EXPENSE_KEYS : INCOME_KEYS;

  const press = (k: string) => {
    Haptics.selectionAsync();
    setDigits((d) => (k === 'del' ? d.slice(0, -1) : d.length >= 8 ? d : (d + k).replace(/^0+/, '')));
  };

  const save = () => {
    if (!cents) return;
    const before = summary.perDayCents;
    const budget = budgets.find((b) => b.categoryKey === cat);
    addEntry({ kind, cents, categoryKey: cat, pay, description: desc || category(cat).name });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    close();
    const perDay = (v: number) => money(v, { cents: false, hidden });
    if (kind === 'in') {
      toast(`Entrou ${money(cents, { hidden })}! Agora dá ${perDay(after)}/dia.`, 'celebrate');
    } else if (budget && budgetStatus(budget.spentCents + cents, budget.limitCents) === 'over' && budgetStatus(budget.spentCents, budget.limitCents) !== 'over') {
      toast(`${category(cat).name} passou do limite. Agora dá ${perDay(after)}/dia.`, 'worried');
    } else if (budget && budgetStatus(budget.spentCents + cents, budget.limitCents) === 'near') {
      toast(`Anotado! Agora dá ${perDay(after)}/dia, e ${category(cat).name} está perto do limite.`, 'neutral');
    } else {
      toast(`Anotado! Antes dava ${perDay(before)}/dia, agora dá ${perDay(after)}/dia.`, 'neutral');
    }
  };

  return (
    <Sheet visible={visible} onClose={close} label="Novo lançamento">
      <Row>
        <T v="strong" style={{ flex: 1, fontSize: 17 }}>
          Novo lançamento
        </T>
        <IconButton label="Fechar" onPress={close}>
          <X size={20} color={c.fg} />
        </IconButton>
      </Row>
      <Segmented
        full
        options={[
          ['out', 'Gasto'],
          ['in', 'Entrada'],
        ]}
        value={kind}
        onChange={(k) => {
          setKind(k);
          setCat(k === 'out' ? 'delivery' : 'transfers_in');
        }}
      />

      <Row gap={4} style={{ justifyContent: 'center', marginTop: 10 }}>
        <T style={{ fontFamily: FONT.displaySemi, fontSize: 20, color: c.accent, alignSelf: 'flex-start', marginTop: 8 }}>R$</T>
        <T style={{ fontFamily: FONT.display, fontSize: 48, letterSpacing: -1.4, color: cents ? c.fg : c.muted }}>{money(cents).replace('R$ ', '')}</T>
      </Row>
      <T v="label" style={{ textAlign: 'center', minHeight: 18 }}>
        {cents ? `Depois disso, dá para gastar ${money(after, { cents: false, hidden })}/dia` : 'Digite o valor'}
      </T>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -18, marginTop: 12 }} contentContainerStyle={{ paddingHorizontal: 18, gap: 8 }}>
        {cats.map((k) => {
          const on = k === cat;
          return (
            <Pressable
              key={k}
              onPress={() => setCat(k)}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              style={[s.chip, { backgroundColor: on ? tint(c.accent) : c.surface2, borderColor: on ? c.accent : 'transparent' }]}>
              <CategoryIcon categoryKey={k} small />
              <T style={{ fontFamily: FONT.semi, fontSize: 13 }}>{category(k).name}</T>
            </Pressable>
          );
        })}
      </ScrollView>

      {kind === 'out' && (
        <View style={{ marginTop: 10 }}>
          <Segmented
            full
            options={[
              ['card', 'Cartão (vai na fatura)'],
              ['pix', 'Pix ou débito'],
            ]}
            value={pay}
            onChange={setPay}
          />
        </View>
      )}

      <View style={[s.field, { backgroundColor: c.surface2 }]}>
        <List size={16} color={c.muted} />
        <TextInput
          value={desc}
          onChangeText={setDesc}
          placeholder="Descrição (opcional)"
          placeholderTextColor={c.muted}
          style={{ flex: 1, fontFamily: FONT.regular, fontSize: 14, color: c.fg }}
          returnKeyType="done"
        />
      </View>

      <View style={s.keypad}>
        {KEYS.map((k) => (
          <Pressable
            key={k}
            onPress={() => press(k)}
            accessibilityRole="button"
            accessibilityLabel={k === 'del' ? 'Apagar' : k}
            style={({ pressed }) => [s.key, { backgroundColor: pressed ? c.border : c.surface2 }]}>
            {k === 'del' ? <Delete size={22} color={c.fg} /> : <T style={{ fontFamily: FONT.displaySemi, fontSize: 22 }}>{k}</T>}
          </Pressable>
        ))}
      </View>

      <Pressable
        onPress={save}
        disabled={!cents}
        accessibilityRole="button"
        style={({ pressed }) => [s.cta, { backgroundColor: c.accent, opacity: !cents ? 0.4 : pressed ? 0.85 : 1 }]}>
        <T v="strong" color={c.accentFg}>
          {cents ? `Salvar ${money(kind === 'out' ? -cents : cents)}` : 'Salvar'}
        </T>
      </Pressable>
    </Sheet>
  );
}

const s = StyleSheet.create({
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingLeft: 6, paddingRight: 12, minHeight: 42, borderRadius: 999, borderWidth: 2 },
  field: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 46, borderRadius: 14, paddingHorizontal: 14, marginTop: 10 },
  keypad: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginVertical: 12 },
  key: { width: '32.4%', minHeight: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexGrow: 1 },
  cta: { minHeight: 52, borderRadius: RADIUS.control + 4, alignItems: 'center', justifyContent: 'center' },
});
