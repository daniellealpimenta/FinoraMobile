// Transações do ciclo: busca, filtro por categoria em chips e troca de categoria pela folha.
import { Eye, EyeOff, List, Search, X } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { CategoryGlyph } from '@/components/category-icon';
import { Pila } from '@/components/pila';
import { TxRow } from '@/components/tx-row';
import { Card, IconButton, Row, Screen, T } from '@/components/ui';
import { category } from '@/domain/categories';
import { cycleName, cycleRange, dayLabel } from '@/domain/cycle';
import { money, percent } from '@/lib/format';
import { useFinance } from '@/state/finance';
import { setPref, usePrefs } from '@/state/prefs';
import { useUI } from '@/state/ui';
import { FONT, useTheme } from '@/theme/tokens';

export default function Transacoes() {
  const { c } = useTheme();
  const { txs, summary: s, cycle, today } = useFinance();
  const { hidden } = usePrefs();
  const { openEdit } = useUI();
  const [filter, setFilter] = useState<string>('all');
  const [q, setQ] = useState('');

  const list = useMemo(() => {
    const term = q.trim().toLowerCase();
    return txs.filter((t) => (filter === 'all' || t.categoryKey === filter) && (!term || t.description.toLowerCase().includes(term)));
  }, [txs, filter, q]);

  const groups = useMemo(() => {
    const m = new Map<string, typeof list>();
    for (const t of list) m.set(t.date, [...(m.get(t.date) ?? []), t]);
    return [...m.entries()];
  }, [list]);

  return (
    <Screen>
      <Row>
        <T v="page" style={{ flex: 1 }}>
          Transações
        </T>
        <IconButton label={hidden ? 'Mostrar valores' : 'Esconder valores'} onPress={() => setPref('hidden', !hidden)}>
          {hidden ? <EyeOff size={22} color={c.fg} /> : <Eye size={22} color={c.fg} />}
        </IconButton>
      </Row>
      <T v="label" style={{ marginTop: -10 }}>
        {cycleName(cycle)} · {cycleRange(cycle)}
      </T>

      <View style={[st.search, { backgroundColor: c.surface, borderColor: c.border }]}>
        <Search size={18} color={c.muted} />
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder="Buscar descrição ou estabelecimento"
          placeholderTextColor={c.muted}
          style={{ flex: 1, fontFamily: FONT.regular, fontSize: 14, color: c.fg }}
          returnKeyType="search"
          autoCorrect={false}
        />
        {!!q && (
          <Pressable onPress={() => setQ('')} hitSlop={10} accessibilityLabel="Limpar busca">
            <X size={18} color={c.muted} />
          </Pressable>
        )}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -16 }} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
        <Chip on={filter === 'all'} onPress={() => setFilter('all')} title="Todas" sub={money(s.spentCents, { hidden })} icon={<List size={15} color={c.fg} />} />
        {s.byCategory.map(([k, v]) => (
          <Chip
            key={k}
            on={filter === k}
            onPress={() => setFilter(filter === k ? 'all' : k)}
            title={category(k).name}
            sub={`${money(v, { hidden })} · ${percent(v, s.spentCents)}`}
            icon={<CategoryGlyph categoryKey={k} size={15} />}
          />
        ))}
      </ScrollView>

      <Row gap={8}>
        <View style={[st.split, { backgroundColor: c.surface }]}>
          <T v="label">Entradas</T>
          <T v="title" color={c.positive}>
            {money(s.incomeCents, { sign: true, hidden })}
          </T>
        </View>
        <View style={[st.split, { backgroundColor: c.surface }]}>
          <T v="label">Saídas</T>
          <T v="title" color={c.negative}>
            {money(-s.spentCents, { hidden })}
          </T>
        </View>
      </Row>
      <T v="label">
        Fatura aberta: <T v="label" color={c.fg} style={{ fontFamily: FONT.semi }}>{money(s.billCents, { hidden })}</T>
      </T>

      {groups.map(([date, items]) => (
        <View key={date} style={{ gap: 4 }}>
          <Row style={{ justifyContent: 'space-between', paddingHorizontal: 2, paddingTop: 4 }}>
            <T v="label" style={{ fontFamily: FONT.semi }}>
              {dayLabel(date, today)}
            </T>
            <T v="label" style={{ fontFamily: FONT.semi }}>
              {money(
                items.reduce((a, t) => a + t.amountCents, 0),
                { sign: true, hidden },
              )}
            </T>
          </Row>
          <Card style={{ paddingVertical: 2, paddingHorizontal: 14 }}>
            {items.map((t, i) => (
              <TxRow key={t.id} tx={t} first={i === 0} onPress={() => openEdit(t.id)} />
            ))}
          </Card>
        </View>
      ))}

      {!groups.length && (
        <View style={{ alignItems: 'center', gap: 8, paddingVertical: 28 }}>
          <Pila size={64} mood="sleep" />
          <T muted style={{ textAlign: 'center' }}>
            {q ? `Nada encontrado para "${q}".` : 'Nenhuma transação nesta categoria por enquanto.'}
          </T>
        </View>
      )}
      {!!groups.length && (
        <T v="label" style={{ textAlign: 'center' }}>
          Toque numa transação para trocar a categoria.
        </T>
      )}
    </Screen>
  );
}

function Chip({ on, onPress, title, sub, icon }: { on: boolean; onPress: () => void; title: string; sub: string; icon: React.ReactNode }) {
  const { c } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: on }}
      style={[st.chip, { backgroundColor: c.surface, borderColor: on ? c.accent : c.cardEdge, borderWidth: on ? 2 : 1 }]}>
      <Row gap={6}>
        {icon}
        <T style={{ fontFamily: FONT.semi, fontSize: 13 }}>{title}</T>
      </Row>
      <T v="label">{sub}</T>
    </Pressable>
  );
}

const st = StyleSheet.create({
  search: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 46, borderRadius: 14, borderWidth: 1, paddingHorizontal: 14 },
  chip: { borderRadius: 14, paddingVertical: 9, paddingHorizontal: 12, minWidth: 118, gap: 2 },
  split: { flex: 1, borderRadius: 14, paddingVertical: 10, paddingHorizontal: 12, gap: 2 },
});
