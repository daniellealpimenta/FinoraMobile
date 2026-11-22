// Cofrinhos: total guardado, anéis de meta e "guardar" ao tocar num cofrinho.
import { TrendingUp } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Circle, Text as SvgText } from 'react-native-svg';

import { Guilloche } from '@/components/guilloche';
import { HeroNumber } from '@/components/hero-number';
import { Pila } from '@/components/pila';
import { Card, Pill, Row, Screen, T } from '@/components/ui';
import { money } from '@/lib/format';
import { type PotView, useFinance } from '@/state/finance';
import { usePrefs } from '@/state/prefs';
import { useUI } from '@/state/ui';
import { FONT, useTheme } from '@/theme/tokens';

export default function Cofrinhos() {
  const { c } = useTheme();
  const { pots, summary: s, mode, status, refresh, actions } = useFinance();
  const { hidden } = usePrefs();
  const { openSave } = useUI();
  const total = pots.reduce((a, p) => a + p.balanceCents, 0);
  const reserve = pots.find((p) => p.goalCents);

  return (
    <Screen onRefresh={mode === 'remote' ? refresh : undefined} refreshing={status.loading && status.updatedAt !== null}>
      <T v="page">Cofrinhos</T>
      <T v="label" style={{ marginTop: -10 }}>
        Ficam fora do &quot;Livre agora&quot;
      </T>

      <Card style={{ overflow: 'hidden' }}>
        <Guilloche />
        <T v="label">Guardado no total</T>
        <View style={{ marginTop: 6, marginBottom: 12 }}>
          <HeroNumber cents={total} hidden={hidden} />
        </View>
        <Pill color={c.positive} icon={<TrendingUp size={13} color={c.positive} strokeWidth={2.4} />}>
          Meta do ciclo:{' '}
          {s.goalLeftCents ? `faltam ${money(s.goalLeftCents, { cents: false, hidden })}` : 'completa'}
        </Pill>
      </Card>

      <Card style={{ paddingVertical: 4, paddingHorizontal: 16 }}>
        {pots.map((p, i) => (
          <Pressable
            key={p.id}
            onPress={() => openSave(p.id)}
            accessibilityRole="button"
            accessibilityLabel={`${p.name}, ${money(p.balanceCents, { hidden })}. ${actions.saveToPot ? 'Toque para guardar.' : 'Toque para ajustar a meta.'}`}
            style={({ pressed }) => [st.row, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth * 2, borderTopColor: c.border }, pressed && { opacity: 0.6 }]}>
            <Ring pot={p} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <T v="title" numberOfLines={1}>
                {p.name}
              </T>
              <T v="label">{p.goalCents ? `meta ${money(p.goalCents, { cents: false, hidden })}` : 'sem meta'}</T>
            </View>
            <T v="value">{money(p.balanceCents, { hidden })}</T>
          </Pressable>
        ))}
      </Card>

      {reserve?.goalCents && (
        <Row style={{ alignItems: 'flex-end' }}>
          <Pila size={44} mood={reserve.balanceCents >= reserve.goalCents ? 'celebrate' : 'happy'} />
          <View style={[st.bubble, { backgroundColor: c.surface, borderColor: c.cardEdge }]}>
            <T style={{ fontSize: 14, lineHeight: 20 }}>
              {reserve.balanceCents >= reserve.goalCents
                ? `${reserve.name} bateu a meta!`
                : `Faltam ${money(reserve.goalCents - reserve.balanceCents, { hidden })} para a ${reserve.name.toLowerCase()}. ${actions.saveToPot ? 'Toque num cofrinho para guardar.' : 'Toque num cofrinho para ajustar a meta.'}`}
            </T>
          </View>
        </Row>
      )}
    </Screen>
  );
}

function Ring({ pot }: { pot: PotView }) {
  const { c } = useTheme();
  const tone = c.cat[pot.color] ?? c.accent;
  const r = 18;
  const C = 2 * Math.PI * r;
  const p = pot.goalCents ? Math.min(pot.balanceCents / pot.goalCents, 1) : 0;
  return (
    <Svg width={48} height={48} viewBox="0 0 48 48">
      <Circle cx={24} cy={24} r={r} fill="none" stroke={c.surface2} strokeWidth={6} />
      {!!pot.goalCents && (
        <Circle cx={24} cy={24} r={r} fill="none" stroke={tone} strokeWidth={6} strokeLinecap="round" strokeDasharray={`${C * p} ${C}`} transform="rotate(-90 24 24)" />
      )}
      <SvgText x={24} y={28} textAnchor="middle" fontSize={12} fontFamily={FONT.bold} fill={c.fg}>
        {pot.goalCents ? `${Math.round(p * 100)}%` : '–'}
      </SvgText>
    </Svg>
  );
}

const st = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12, minHeight: 68 },
  bubble: { flex: 1, borderWidth: 1, borderRadius: 16, borderBottomLeftRadius: 6, paddingVertical: 10, paddingHorizontal: 14 },
});
