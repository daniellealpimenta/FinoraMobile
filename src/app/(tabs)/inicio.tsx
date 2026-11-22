// Início: Livre agora no topo, atalhos, Dá para gastar, Para onde foi e últimas transações.
import { router } from 'expo-router';
import { CreditCard, Eye, EyeOff, MessageCircle, PiggyBank, Target } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { useCategoryColor } from '@/components/category-icon';
import { ConnectionNote } from '@/components/connection-note';
import { Guilloche } from '@/components/guilloche';
import { HeroNumber, useCountUp } from '@/components/hero-number';
import { Pila } from '@/components/pila';
import { TxRow } from '@/components/tx-row';
import { Card, IconButton, Row, Screen, Segmented, T } from '@/components/ui';
import { category } from '@/domain/categories';
import { cycleName, cycleRange } from '@/domain/cycle';
import { budgetStatus } from '@/domain/forecast';
import { money, percent } from '@/lib/format';
import { useFinance } from '@/state/finance';
import { setPref, usePrefs } from '@/state/prefs';
import { useUI } from '@/state/ui';
import { FONT, TILE, useTheme } from '@/theme/tokens';

function greeting(d: Date) {
  const h = d.getHours();
  return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
}

export default function Home() {
  const { c } = useTheme();
  const { summary: s, cycle, txs, pots, budgets, profileName, today, mode, status, refresh, actions } = useFinance();
  const { hidden } = usePrefs();
  const { openSave, openEdit } = useUI();
  const [per, setPer] = useState<'dia' | 'ciclo'>('dia');
  const perDay = useCountUp(s.perDayCents);

  const reserve = pots.find((p) => p.goalCents) ?? pots[0];
  const over = budgets.filter((b) => budgetStatus(b.spentCents, b.limitCents) === 'over').length;
  const progress = s.day / s.length;

  return (
    <Screen onRefresh={mode === 'remote' ? refresh : undefined} refreshing={status.loading && status.updatedAt !== null}>
      <Row>
        <View style={[st.avatar, { backgroundColor: c.surface2 }]}>
          <T style={{ fontFamily: FONT.displayBold, color: c.accent }}>{(profileName || 'F').slice(0, 1)}</T>
        </View>
        <View style={{ flex: 1 }}>
          <T v="label">{greeting(today)}</T>
          <T v="title">{profileName || 'Finora'}</T>
        </View>
        <IconButton label={hidden ? 'Mostrar valores' : 'Esconder valores'} onPress={() => setPref('hidden', !hidden)}>
          {hidden ? <EyeOff size={22} color={c.fg} /> : <Eye size={22} color={c.fg} />}
        </IconButton>
        <IconButton label="Falar com o Pila" onPress={() => router.push('/pila')}>
          <Pila size={34} />
        </IconButton>
      </Row>

      <ConnectionNote />

      <Card style={{ paddingVertical: 10, alignItems: 'center' }}>
        <T v="title">{cycleName(cycle)}</T>
        <T v="label">
          {cycleRange(cycle)} · faltam {s.daysLeft} {s.daysLeft === 1 ? 'dia' : 'dias'}
        </T>
      </Card>

      <Card style={{ overflow: 'hidden' }}>
        <Guilloche />
        <T v="label">Livre agora</T>
        <View style={{ marginTop: 6, marginBottom: 16 }}>
          <HeroNumber cents={s.freeCents} hidden={hidden} />
        </View>
        <Row gap={8}>
          <View style={[st.split, { backgroundColor: c.surface2 }]}>
            <T v="label">Em conta</T>
            <T v="title">{money(s.checkingCents, { hidden })}</T>
          </View>
          <View style={[st.split, { backgroundColor: c.surface2 }]}>
            <T v="label">Fatura a pagar</T>
            <T v="title" color={c.negative}>
              {money(-s.billCents, { hidden })}
            </T>
          </View>
        </Row>
      </Card>

      <Row gap={8}>
        <Tile color={TILE.gold} label={actions.saveToPot ? 'Guardar' : 'Metas'} sub={reserve?.goalCents ? `${Math.round((reserve.balanceCents / reserve.goalCents) * 100)}% da meta` : 'cofrinhos'} onPress={() => reserve && openSave(reserve.id)}>
          <PiggyBank size={22} color={TILE.ink} />
        </Tile>
        <Tile color={TILE.violet} label="Limites" sub={over ? `${over} estourou` : 'tudo ok'} onPress={() => router.push('/orcamentos')}>
          <Target size={22} color={TILE.ink} />
        </Tile>
        <Tile color={TILE.blue} label="Fatura" sub={hidden ? '••••' : money(s.billCents, { cents: false })} onPress={() => router.navigate('/transacoes')}>
          <CreditCard size={22} color={TILE.ink} />
        </Tile>
        <Tile color={TILE.pink} label="Pila" sub="perguntar" onPress={() => router.push('/pila')}>
          <MessageCircle size={22} color={TILE.ink} />
        </Tile>
      </Row>

      <Card>
        <Row>
          <T v="title" style={{ flex: 1 }}>
            Dá para gastar
          </T>
          <Segmented
            options={[
              ['dia', 'Por dia'],
              ['ciclo', 'No ciclo'],
            ]}
            value={per}
            onChange={setPer}
          />
        </Row>
        <Row gap={6} style={{ alignItems: 'baseline', marginTop: 12 }}>
          <T v="display" color={s.spendableCents < 0 ? c.negative : c.fg}>
            {money(per === 'dia' ? perDay : s.spendableCents, { cents: false, hidden })}
          </T>
          <T muted style={{ fontSize: 14 }}>
            {per === 'dia' ? '/dia' : `até ${cycleRange(cycle).split(' a ')[1]}`}
          </T>
        </Row>
        <View style={[st.track, { backgroundColor: c.surface2 }]}>
          <View style={{ width: `${progress * 100}%`, height: '100%', borderRadius: 999, backgroundColor: c.accent }} />
          <View style={[st.marker, { left: `${progress * 100}%`, backgroundColor: c.fg }]} />
        </View>
        <Row>
          <T v="label">{cycleRange(cycle).split(' a ')[0]}</T>
          <T v="label" style={{ flex: 1, textAlign: 'center' }}>
            dia {s.day} de {s.length}
          </T>
          <T v="label">{cycleRange(cycle).split(' a ')[1]}</T>
        </Row>
        <T v="label" style={{ marginTop: 10, fontSize: 13, lineHeight: 18 }}>
          Já separa {money(s.goalLeftCents, { cents: false, hidden })} para guardar, {money(s.fixedCents, { cents: false, hidden })} de gastos fixos
          {s.salaryPendingCents ? ' e conta com o salário previsto' : ''}.
        </T>
      </Card>

      <Card>
        <Row>
          <T v="title" style={{ flex: 1 }}>
            Para onde foi
          </T>
          <T v="value">{money(s.spentCents, { hidden })}</T>
        </Row>
        <View style={st.stack}>
          {s.byCategory.map(([k, v]) => (
            <StackSegment key={k} categoryKey={k} flex={v} />
          ))}
        </View>
        {s.byCategory.slice(0, 4).map(([k, v]) => (
          <Legend key={k} categoryKey={k} cents={v} total={s.spentCents} hidden={hidden} />
        ))}
        {!s.byCategory.length && <T muted>Nenhum gasto neste ciclo ainda.</T>}
      </Card>

      <Card style={{ paddingVertical: 12 }}>
        <Row>
          <T v="title" style={{ flex: 1 }}>
            Últimas transações
          </T>
          <Pressable onPress={() => router.navigate('/transacoes')} hitSlop={10} accessibilityRole="link">
            <T style={{ color: c.accent, fontFamily: FONT.bold, fontSize: 13 }}>Ver todas</T>
          </Pressable>
        </Row>
        {txs.slice(0, 4).map((t, i) => (
          <TxRow key={t.id} tx={t} first={i === 0} onPress={() => openEdit(t.id)} />
        ))}
      </Card>
    </Screen>
  );
}

function Tile({ color, label, sub, onPress, children }: { color: string; label: string; sub: string; onPress: () => void; children: React.ReactNode }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${label}, ${sub}`}
      style={({ pressed }) => [st.tile, { backgroundColor: color, transform: [{ scale: pressed ? 0.95 : 1 }] }]}>
      {children}
      <T style={{ fontFamily: FONT.bold, fontSize: 12, color: TILE.ink }}>{label}</T>
      <T style={{ fontFamily: FONT.semi, fontSize: 12, color: TILE.ink, opacity: 0.75 }} numberOfLines={1}>
        {sub}
      </T>
    </Pressable>
  );
}

function StackSegment({ categoryKey, flex }: { categoryKey: string; flex: number }) {
  return <View style={{ flex, backgroundColor: useCategoryColor(categoryKey) }} />;
}

function Legend({ categoryKey, cents, total, hidden }: { categoryKey: string; cents: number; total: number; hidden: boolean }) {
  const tone = useCategoryColor(categoryKey);
  return (
    <Row style={{ paddingVertical: 6 }}>
      <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: tone }} />
      <T style={{ flex: 1, fontSize: 14 }}>{category(categoryKey).name}</T>
      <T v="label">{percent(cents, total)}</T>
      <T v="value" style={{ minWidth: 92, textAlign: 'right', fontSize: 14 }}>
        {money(cents, { hidden })}
      </T>
    </Row>
  );
}

const st = StyleSheet.create({
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  split: { flex: 1, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 12, gap: 2 },
  tile: { flex: 1, borderRadius: 18, paddingVertical: 10, paddingHorizontal: 4, alignItems: 'center', gap: 3, minHeight: 80 },
  track: { height: 8, borderRadius: 999, marginTop: 16, marginBottom: 6, justifyContent: 'center' },
  marker: { position: 'absolute', width: 4, height: 18, borderRadius: 3, marginLeft: -2 },
  stack: { flexDirection: 'row', height: 12, borderRadius: 999, overflow: 'hidden', gap: 2, marginTop: 12, marginBottom: 10 },
});
