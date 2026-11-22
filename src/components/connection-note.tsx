// Modo conectado sem resposta do computador: os números na tela são os últimos que chegaram.
import { CloudOff } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { useFinance } from '@/state/finance';
import { FONT, RADIUS, useTheme } from '@/theme/tokens';

import { T } from './ui';

const hhmm = (ms: number) => {
  const d = new Date(ms);
  const sameDay = new Date().toDateString() === d.toDateString();
  const time = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  return sameDay ? `de hoje, ${time}` : `de ${d.getDate()}/${d.getMonth() + 1}, ${time}`;
};

export function ConnectionNote() {
  const { c, tint } = useTheme();
  const { mode, status, refresh } = useFinance();
  if (mode !== 'remote' || !status.error || status.loading) return null;
  return (
    <Pressable
      onPress={refresh}
      accessibilityRole="button"
      accessibilityLabel="Sem conexão com o computador. Toque para tentar de novo."
      style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: tint(c.warning), borderRadius: RADIUS.card, padding: 12 }}>
      <CloudOff size={18} color={c.warning} />
      <View style={{ flex: 1 }}>
        <T style={{ fontFamily: FONT.semi, fontSize: 13 }}>Sem conexão com o computador</T>
        <T v="label">
          Mostrando os números {status.updatedAt ? hhmm(status.updatedAt) : 'guardados'}. Toque para tentar de novo.
        </T>
      </View>
    </Pressable>
  );
}
