// Primeira tela: conectar ao Finora do computador ou ver a demonstração (mês de exemplo).
import { router } from 'expo-router';
import { Laptop, Sparkles } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Pila } from '@/components/pila';
import { T } from '@/components/ui';
import { useSession } from '@/state/session';
import { alpha, FONT, RADIUS, useTheme } from '@/theme/tokens';

export default function BemVindo() {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const { chooseDemo } = useSession();

  return (
    <View style={[s.wrap, { backgroundColor: c.bg, paddingTop: insets.top + 48, paddingBottom: insets.bottom + 24 }]}>
      <View style={{ alignItems: 'center', gap: 10 }}>
        <Pila size={112} mood="happy" />
        <T style={{ fontFamily: FONT.displayBold, fontSize: 34, letterSpacing: -0.8 }}>Finora</T>
        <T muted style={{ textAlign: 'center', fontSize: 16, lineHeight: 23, maxWidth: 300 }}>
          Quanto dá para gastar até a fatura fechar, no seu bolso.
        </T>
      </View>

      <View style={{ gap: 12, alignSelf: 'stretch' }}>
        <Choice
          primary
          icon={<Laptop size={22} color={c.accentFg} />}
          title="Conectar ao meu Finora"
          sub="Seus números reais, do Finora do computador, pela Tailscale"
          onPress={() => router.push('/conectar')}
        />
        <Choice
          icon={<Sparkles size={22} color={c.accent} />}
          title="Ver demonstração"
          sub="Um mês de exemplo, guardado só neste celular"
          onPress={chooseDemo}
        />
        <T v="label" style={{ textAlign: 'center', marginTop: 4 }}>
          Dá para trocar depois, em Mais.
        </T>
      </View>
    </View>
  );
}

function Choice({ icon, title, sub, onPress, primary }: { icon: ReactNode; title: string; sub: string; onPress: () => void; primary?: boolean }) {
  const { c, tint } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [
        s.choice,
        { backgroundColor: primary ? c.accent : c.surface, borderColor: primary ? c.accent : c.cardEdge, transform: [{ scale: pressed ? 0.98 : 1 }] },
      ]}>
      <View style={[s.icon, { backgroundColor: primary ? alpha('#ffffff', 0.18) : tint(c.accent) }]}>{icon}</View>
      <View style={{ flex: 1 }}>
        <T v="strong" color={primary ? c.accentFg : c.fg} style={{ fontSize: 16 }}>
          {title}
        </T>
        <T color={primary ? alpha(c.accentFg, 0.8) : c.muted} style={{ fontSize: 13, lineHeight: 18 }}>
          {sub}
        </T>
      </View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20 },
  choice: { flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: RADIUS.card + 2, borderWidth: 1, padding: 16, minHeight: 84 },
  icon: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
});
