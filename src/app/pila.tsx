// Conversa com o Pila: perguntas prontas, respostas com os números de agora (domain/pila.ts).
import { router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { Pressable, ScrollView, type ScrollViewInstance, StyleSheet, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Pila } from '@/components/pila';
import { IconButton, Pill, Row, T } from '@/components/ui';
import { answer, type Mood, QUESTIONS } from '@/domain/pila';
import { useFinance } from '@/state/finance';
import { usePrefs } from '@/state/prefs';
import { FONT, useTheme } from '@/theme/tokens';

type Msg = { id: number; me: boolean; text: string; mood?: Mood };

export default function PilaScreen() {
  const { c, tint } = useTheme();
  const insets = useSafeAreaInsets();
  const { summary, budgets, pots } = useFinance();
  const { hidden } = usePrefs();
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const scroll = useRef<ScrollViewInstance>(null);

  const ask = (i: number) => {
    const a = hidden ? { text: 'Seus valores estão escondidos. Toque no olho para eu mostrar os números.', mood: 'shy' as Mood } : answer(i, summary, budgets, pots);
    setMsgs((m) => [...m, { id: Date.now(), me: true, text: QUESTIONS[i] }, { id: Date.now() + 1, me: false, text: a.text, mood: a.mood }]);
    setTimeout(() => scroll.current?.scrollToEnd({ animated: true }), 80);
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.bg, paddingTop: insets.top + 4 }}>
      <Row style={{ paddingHorizontal: 6 }} gap={4}>
        <IconButton label="Voltar" onPress={() => router.back()}>
          <ChevronLeft size={24} color={c.fg} />
        </IconButton>
        <T v="strong" style={{ flex: 1, fontSize: 17 }}>
          Pila
        </T>
        <View style={{ marginRight: 12 }}>
          <Pill color={c.positive}>● no seu celular</Pill>
        </View>
      </Row>

      <ScrollView ref={scroll} style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 14 }}>
        <Bubble mood="happy" text="Oi! Pergunte sobre os seus números. Eu respondo com o que está no app, sem inventar." />
        {msgs.map((m) =>
          m.me ? (
            <Animated.View key={m.id} entering={FadeInUp.duration(220)} style={[st.me, { backgroundColor: c.accent }]}>
              <T color={c.accentFg} style={{ fontFamily: FONT.semi, fontSize: 14 }}>
                {m.text}
              </T>
            </Animated.View>
          ) : (
            <Animated.View key={m.id} entering={FadeInUp.delay(250).duration(260)}>
              <Bubble mood={m.mood ?? 'happy'} text={m.text} />
            </Animated.View>
          ),
        )}
      </ScrollView>

      <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: insets.bottom + 12, gap: 8 }}>
        <T v="label">Perguntas</T>
        <View style={st.sugg}>
          {QUESTIONS.map((q, i) => (
            <Pressable
              key={q}
              onPress={() => ask(i)}
              accessibilityRole="button"
              style={({ pressed }) => [st.chip, { backgroundColor: tint(c.accent), opacity: pressed ? 0.7 : 1 }]}>
              <T color={c.accent} style={{ fontFamily: FONT.semi, fontSize: 13 }}>
                {q}
              </T>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
}

function Bubble({ mood, text }: { mood: Mood; text: string }) {
  const { c } = useTheme();
  return (
    <Row style={{ alignItems: 'flex-end' }}>
      <Pila size={40} mood={mood} />
      <View style={[st.bubble, { backgroundColor: c.surface, borderColor: c.cardEdge }]}>
        <T style={{ fontSize: 14, lineHeight: 20 }}>{text}</T>
      </View>
    </Row>
  );
}

const st = StyleSheet.create({
  me: { alignSelf: 'flex-end', maxWidth: '80%', borderRadius: 16, borderBottomRightRadius: 6, paddingVertical: 10, paddingHorizontal: 14 },
  bubble: { flex: 1, borderWidth: 1, borderRadius: 16, borderBottomLeftRadius: 6, paddingVertical: 10, paddingHorizontal: 14 },
  sugg: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderRadius: 999, paddingVertical: 9, paddingHorizontal: 13, minHeight: 40, justifyContent: 'center' },
});
