// Guardar dinheiro num cofrinho: sai do "Livre agora" e conta na meta de guardar do ciclo.
import * as Haptics from 'expo-haptics';
import { PiggyBank } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { saveToPot } from '@/db/repo';
import type { Family } from '@/domain/categories';
import { money } from '@/lib/format';
import { useFinance } from '@/state/finance';
import { usePrefs } from '@/state/prefs';
import { FONT, RADIUS, useTheme } from '@/theme/tokens';

import { Sheet } from '../sheet';
import { Bar, Row, T } from '../ui';

type Toast = (text: string, mood?: 'happy' | 'neutral' | 'worried' | 'celebrate') => void;
const AMOUNTS = [5_000, 10_000, 20_000, 50_000];

export function SaveSheet({ potId, onClose, toast }: { potId: number | null; onClose: () => void; toast: Toast }) {
  const { c, tint } = useTheme();
  const { pots, summary } = useFinance();
  const { hidden } = usePrefs();
  const [amount, setAmount] = useState(10_000);
  const pot = pots.find((p) => p.id === potId);

  const close = () => {
    setAmount(10_000);
    onClose();
  };

  const tone = pot ? c.cat[pot.color as Family] ?? c.accent : c.accent;
  const after = pot?.goalCents ? Math.min((pot.balanceCents + amount) / pot.goalCents, 1) : 0;
  const goalLeftAfter = Math.max(0, summary.goalLeftCents - amount);

  const save = () => {
    if (!pot) return;
    saveToPot(pot.id, amount);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    close();
    toast(
      pot.goalCents ? `Guardado! ${pot.name} chegou a ${Math.round(after * 100)}% da meta.` : `Guardado em ${pot.name}!`,
      'celebrate',
    );
  };

  return (
    <Sheet visible={!!pot} onClose={close} label="Guardar no cofrinho">
      {pot && (
        <>
          <Row gap={12}>
            <View style={[s.icon, { backgroundColor: tint(tone) }]}>
              <PiggyBank size={18} color={tone} />
            </View>
            <View style={{ flex: 1 }}>
              <T v="strong" style={{ fontSize: 16 }}>
                Guardar em {pot.name}
              </T>
              <T v="label">
                Tem {money(pot.balanceCents, { hidden })}
                {pot.goalCents ? ` de ${money(pot.goalCents, { cents: false, hidden })}` : ''}
              </T>
            </View>
          </Row>
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
      )}
    </Sheet>
  );
}

const s = StyleSheet.create({
  icon: { width: 36, height: 36, borderRadius: RADIUS.chip, alignItems: 'center', justifyContent: 'center' },
  quick: { flexDirection: 'row', gap: 8, marginVertical: 14 },
  amt: { flex: 1, minHeight: 48, borderRadius: 14, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  cta: { minHeight: 52, borderRadius: RADIUS.control + 4, alignItems: 'center', justifyContent: 'center', marginTop: 16 },
});
