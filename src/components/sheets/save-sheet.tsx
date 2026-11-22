// Cofrinho tocado:
//  - demo: guardar dinheiro (sai do "Livre agora" e conta na meta de guardar do ciclo);
//  - conectado: o dinheiro de verdade se move no app do banco e chega pelo sync, então aqui
//    a pessoa ajusta a meta do cofrinho e vê quanto já rendeu.
import * as Haptics from 'expo-haptics';
import { PiggyBank, TrendingUp } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from 'react-native';

import type { Mood } from '@/domain/pila';
import { money } from '@/lib/format';
import { type PotView, useFinance } from '@/state/finance';
import { usePrefs } from '@/state/prefs';
import { FONT, RADIUS, useTheme } from '@/theme/tokens';

import { Sheet } from '../sheet';
import { Bar, Row, T } from '../ui';

type Toast = (text: string, mood?: Mood) => void;
const AMOUNTS = [5_000, 10_000, 20_000, 50_000];
const errorText = (e: unknown) => (e instanceof Error ? e.message : String(e));

export function SaveSheet({ potId, onClose, toast }: { potId: number | null; onClose: () => void; toast: Toast }) {
  const { pots, actions } = useFinance();
  const pot = pots.find((p) => p.id === potId);
  return (
    <Sheet visible={!!pot} onClose={onClose} label={actions.saveToPot ? 'Guardar no cofrinho' : 'Meta do cofrinho'}>
      {pot && (actions.saveToPot ? <SaveMoney pot={pot} onClose={onClose} toast={toast} /> : <EditGoal pot={pot} onClose={onClose} toast={toast} />)}
    </Sheet>
  );
}

function Header({ pot, subtitle }: { pot: PotView; subtitle: string }) {
  const { c, tint } = useTheme();
  const tone = c.cat[pot.color] ?? c.accent;
  return (
    <Row gap={12}>
      <View style={[s.icon, { backgroundColor: tint(tone) }]}>
        <PiggyBank size={18} color={tone} />
      </View>
      <View style={{ flex: 1 }}>
        <T v="strong" style={{ fontSize: 16 }}>
          {pot.name}
        </T>
        <T v="label">{subtitle}</T>
      </View>
    </Row>
  );
}

function SaveMoney({ pot, onClose, toast }: { pot: PotView; onClose: () => void; toast: Toast }) {
  const { c, tint } = useTheme();
  const { summary, actions } = useFinance();
  const { hidden } = usePrefs();
  const [amount, setAmount] = useState(10_000);
  const tone = c.cat[pot.color] ?? c.accent;
  const after = pot.goalCents ? Math.min((pot.balanceCents + amount) / pot.goalCents, 1) : 0;
  const goalLeftAfter = Math.max(0, summary.goalLeftCents - amount);

  const save = async () => {
    try {
      await actions.saveToPot?.(pot.id, amount);
    } catch (e) {
      toast(errorText(e), 'worried');
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onClose();
    toast(pot.goalCents ? `Guardado! ${pot.name} chegou a ${Math.round(after * 100)}% da meta.` : `Guardado em ${pot.name}!`, 'celebrate');
  };

  return (
    <>
      <Header pot={pot} subtitle={`Tem ${money(pot.balanceCents, { hidden })}${pot.goalCents ? ` de ${money(pot.goalCents, { cents: false, hidden })}` : ''}`} />
      <View style={s.quick}>
        {AMOUNTS.map((a) => {
          const on = a === amount;
          return (
            <Pressable
              key={a}
              onPress={() => setAmount(a)}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              style={[s.amt, { backgroundColor: on ? tint(c.accent) : c.surface2, borderColor: on ? c.accent : 'transparent' }]}>
              <T style={{ fontFamily: FONT.bold, fontSize: 14 }}>{money(a, { cents: false })}</T>
            </Pressable>
          );
        })}
      </View>
      {!!pot.goalCents && (
        <>
          <Bar value={after} color={tone} height={10} />
          <T v="label" style={{ marginTop: 6 }}>
            Com isso, chega a {Math.round(after * 100)}% da meta.
          </T>
        </>
      )}
      <T v="label" style={{ marginTop: 10 }}>
        O Livre agora vai de {money(summary.freeCents, { hidden })} para {money(summary.freeCents - amount, { hidden })}. Isso conta na meta de guardar do ciclo
        {goalLeftAfter ? ` (faltam ${money(goalLeftAfter, { cents: false, hidden })})` : ', que fica completa'}, então o &quot;por dia&quot; não muda.
      </T>
      <Pressable onPress={save} accessibilityRole="button" style={({ pressed }) => [s.cta, { backgroundColor: c.accent, opacity: pressed ? 0.85 : 1 }]}>
        <T v="strong" color={c.accentFg}>
          Guardar {money(amount, { cents: false })}
        </T>
      </Pressable>
    </>
  );
}

function EditGoal({ pot, onClose, toast }: { pot: PotView; onClose: () => void; toast: Toast }) {
  const { c } = useTheme();
  const { actions } = useFinance();
  const { hidden } = usePrefs();
  const [text, setText] = useState(pot.goalCents ? String(Math.round(pot.goalCents / 100)) : '');
  const [busy, setBusy] = useState(false);
  const tone = c.cat[pot.color] ?? c.accent;
  const goal = parseInt(text.replace(/\D/g, '') || '0', 10) * 100;

  const save = async (goalCents: number | null) => {
    setBusy(true);
    try {
      await actions.setPotGoal(pot.id, goalCents);
      onClose();
      toast(goalCents ? `Meta de ${pot.name}: ${money(goalCents, { cents: false })}.` : `${pot.name} ficou sem meta.`, 'happy');
    } catch (e) {
      toast(errorText(e), 'worried');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Header pot={pot} subtitle={`Tem ${money(pot.balanceCents, { hidden })}`} />
      {pot.earnedCents != null && pot.earnedCents !== 0 && (
        <Row gap={6} style={{ marginTop: 12 }}>
          <TrendingUp size={16} color={c.positive} />
          <T v="label" color={c.positive} style={{ fontFamily: FONT.semi }}>
            Rendeu {money(pot.earnedCents, { hidden })} desde que foi aplicado
          </T>
        </Row>
      )}
      <T v="label" style={{ marginTop: 16, marginBottom: 6 }}>
        Meta do cofrinho
      </T>
      <View style={[s.field, { backgroundColor: c.surface2 }]}>
        <T style={{ fontFamily: FONT.displaySemi, color: c.accent }}>R$</T>
        <TextInput
          value={text}
          onChangeText={setText}
          keyboardType="number-pad"
          placeholder="Sem meta"
          placeholderTextColor={c.muted}
          style={{ flex: 1, fontFamily: FONT.display, fontSize: 24, color: c.fg }}
          maxLength={9}
        />
      </View>
      {goal > 0 && (
        <View style={{ marginTop: 12, gap: 6 }}>
          <Bar value={pot.balanceCents / goal} color={tone} height={10} />
          <T v="label">{Math.min(100, Math.round((pot.balanceCents / goal) * 100))}% da meta</T>
        </View>
      )}
      <T v="label" style={{ marginTop: 12, lineHeight: 17 }}>
        Para guardar de verdade, aplique pelo app do banco: no próximo sync o Finora traz a aplicação para este cofrinho.
      </T>
      <Pressable
        onPress={() => save(goal || null)}
        disabled={busy}
        accessibilityRole="button"
        style={({ pressed }) => [s.cta, { backgroundColor: c.accent, opacity: pressed ? 0.85 : 1 }]}>
        {busy ? <ActivityIndicator color={c.accentFg} /> : <T v="strong" color={c.accentFg}>{goal ? 'Salvar meta' : 'Salvar sem meta'}</T>}
      </Pressable>
    </>
  );
}

const s = StyleSheet.create({
  icon: { width: 36, height: 36, borderRadius: RADIUS.chip, alignItems: 'center', justifyContent: 'center' },
  quick: { flexDirection: 'row', gap: 8, marginVertical: 14 },
  amt: { flex: 1, minHeight: 48, borderRadius: 14, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  field: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 56, borderRadius: 14, paddingHorizontal: 16 },
  cta: { minHeight: 52, borderRadius: RADIUS.control + 4, alignItems: 'center', justifyContent: 'center', marginTop: 16 },
});
