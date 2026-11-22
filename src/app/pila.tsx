// Conversa com o Pila.
//  - Conectado e com o Ollama ligado no computador: conversa livre com o modelo local (o mesmo
//    assistente da web), em streaming. Nenhuma transação sai do computador.
//  - Senão (demo, ou Ollama desligado): perguntas prontas com respostas calculadas aqui
//    (domain/pila.ts).
import { router } from 'expo-router';
import { ChevronLeft, Send } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, type ScrollViewInstance, StyleSheet, TextInput, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { type ChatMessage, streamChat } from '@/api/chat';
import type { AssistantStatus } from '@/api/types';
import { Pila } from '@/components/pila';
import { IconButton, Pill, Row, T } from '@/components/ui';
import { answer, type Mood, QUESTIONS } from '@/domain/pila';
import { useFinance } from '@/state/finance';
import { usePrefs } from '@/state/prefs';
import { useSession } from '@/state/session';
import { FONT, useTheme } from '@/theme/tokens';

type Msg = { id: number; me: boolean; text: string; mood?: Mood; working?: string };

const AI_SUGGESTIONS = ['Quanto posso gastar hoje?', 'Onde gastei mais neste ciclo?', 'Cabe um fone de R$ 350?', 'Como fechei o ciclo passado?'];

export default function PilaScreen() {
  const { c, tint } = useTheme();
  const insets = useSafeAreaInsets();
  const { summary, budgets, pots, mode } = useFinance();
  const { api } = useSession();
  const { hidden } = usePrefs();
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [ai, setAi] = useState<boolean | null>(mode === 'remote' ? null : false);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const scroll = useRef<ScrollViewInstance>(null);
  const nextId = useRef(1);

  // Ollama ligado no computador? Já aquece o modelo (a primeira resposta sai mais rápido)
  useEffect(() => {
    if (mode !== 'remote' || !api) return;
    api
      .get<AssistantStatus>('/assistant/status')
      .then((s) => {
        const on = s.ollama && !!s.active_model;
        setAi(on);
        if (on) api.post('/assistant/warmup').catch(() => undefined);
      })
      .catch(() => setAi(false));
  }, [mode, api]);

  const toEnd = () => setTimeout(() => scroll.current?.scrollToEnd({ animated: true }), 60);

  const askCanned = (i: number) => {
    const a = hidden ? { text: 'Seus valores estão escondidos. Toque no olho para eu mostrar os números.', mood: 'shy' as Mood } : answer(i, summary, budgets, pots);
    const askId = nextId.current++;
    const replyId = nextId.current++;
    setMsgs((m) => [...m, { id: askId, me: true, text: QUESTIONS[i] }, { id: replyId, me: false, text: a.text, mood: a.mood }]);
    toEnd();
  };

  const askAI = async (question: string) => {
    const q = question.trim();
    if (!q || busy || !api) return;
    setText('');
    setBusy(true);
    const past = msgs.filter((m) => !m.working && m.text).map((m): ChatMessage => ({ role: m.me ? 'user' : 'assistant', content: m.text }));
    const history: ChatMessage[] = [...past, { role: 'user' as const, content: q }].slice(-20);
    const askId = nextId.current++;
    const replyId = nextId.current++;
    setMsgs((m) => [...m, { id: askId, me: true, text: q }, { id: replyId, me: false, text: '', mood: 'neutral', working: 'Pensando…' }]);
    toEnd();
    const patch = (fn: (m: Msg) => Msg) => setMsgs((all) => all.map((m) => (m.id === replyId ? fn(m) : m)));
    try {
      await streamChat(api, history, (e) => {
        if (e.type === 'text') patch((m) => ({ ...m, text: m.text + e.delta, working: undefined, mood: 'happy' }));
        else if (e.type === 'tool') patch((m) => ({ ...m, working: `${e.label}…` }));
        else if (e.type === 'error') patch((m) => ({ ...m, text: e.message, working: undefined, mood: 'worried' }));
        toEnd();
      });
    } catch {
      patch((m) => ({ ...m, text: 'Perdi a conexão com o seu Finora no meio da resposta.', working: undefined, mood: 'worried' }));
    } finally {
      patch((m) => ({ ...m, working: undefined, text: m.text || 'Não cheguei a uma resposta. Tente reformular.' }));
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: c.bg, paddingTop: insets.top + 4 }}>
      <Row style={{ paddingHorizontal: 6 }} gap={4}>
        <IconButton label="Voltar" onPress={() => router.back()}>
          <ChevronLeft size={24} color={c.fg} />
        </IconButton>
        <T v="strong" style={{ flex: 1, fontSize: 17 }}>
          Pila
        </T>
        <View style={{ marginRight: 12 }}>
          <Pill color={ai ? c.accent2 : c.positive}>{ai ? '● IA no seu computador' : mode === 'remote' ? '● respostas prontas' : '● no seu celular'}</Pill>
        </View>
      </Row>

      <ScrollView ref={scroll} style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 14 }} keyboardShouldPersistTaps="handled">
        <Bubble
          mood="happy"
          text={
            ai
              ? 'Oi! Pode perguntar o que quiser sobre os seus números. Eu leio o seu Finora no computador e respondo sem inventar.'
              : 'Oi! Pergunte sobre os seus números. Eu respondo com o que está no app, sem inventar.'
          }
        />
        {msgs.map((m) =>
          m.me ? (
            <Animated.View key={m.id} entering={FadeInUp.duration(220)} style={[st.me, { backgroundColor: c.accent }]}>
              <T color={c.accentFg} style={{ fontFamily: FONT.semi, fontSize: 14 }}>
                {m.text}
              </T>
            </Animated.View>
          ) : (
            <Animated.View key={m.id} entering={FadeInUp.delay(150).duration(260)}>
              <Bubble mood={m.mood ?? 'happy'} text={m.text} working={m.working} />
            </Animated.View>
          ),
        )}
      </ScrollView>

      <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: insets.bottom + 12, gap: 8 }}>
        {ai === null ? (
          <ActivityIndicator color={c.accent} />
        ) : (
          <>
            <T v="label">{ai ? 'Sugestões' : 'Perguntas'}</T>
            <ScrollView horizontal={!!ai} showsHorizontalScrollIndicator={false} contentContainerStyle={ai ? { gap: 8 } : st.sugg} keyboardShouldPersistTaps="handled">
              {(ai ? AI_SUGGESTIONS : QUESTIONS).map((q, i) => (
                <Pressable
                  key={q}
                  onPress={() => (ai ? askAI(q) : askCanned(i))}
                  disabled={busy}
                  accessibilityRole="button"
                  style={({ pressed }) => [st.chip, { backgroundColor: tint(c.accent), opacity: pressed || busy ? 0.6 : 1 }]}>
                  <T color={c.accent} style={{ fontFamily: FONT.semi, fontSize: 13 }}>
                    {q}
                  </T>
                </Pressable>
              ))}
            </ScrollView>
            {ai && (
              <View style={[st.input, { backgroundColor: c.surface, borderColor: c.border }]}>
                <TextInput
                  value={text}
                  onChangeText={setText}
                  placeholder="Pergunte ao Pila…"
                  placeholderTextColor={c.muted}
                  style={{ flex: 1, fontFamily: FONT.regular, fontSize: 15, color: c.fg, maxHeight: 100 }}
                  multiline
                  onSubmitEditing={() => askAI(text)}
                  returnKeyType="send"
                  blurOnSubmit
                />
                <Pressable onPress={() => askAI(text)} disabled={busy || !text.trim()} accessibilityLabel="Enviar" hitSlop={8}>
                  {busy ? <ActivityIndicator color={c.accent} /> : <Send size={20} color={text.trim() ? c.accent : c.muted} />}
                </Pressable>
              </View>
            )}
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

function Bubble({ mood, text, working }: { mood: Mood; text: string; working?: string }) {
  const { c } = useTheme();
  return (
    <Row style={{ alignItems: 'flex-end' }}>
      <Pila size={40} mood={mood} />
      <View style={[st.bubble, { backgroundColor: c.surface, borderColor: c.cardEdge }]}>
        {working && !text ? (
          <Row gap={8}>
            <ActivityIndicator size="small" color={c.accent} />
            <T muted style={{ fontSize: 14 }}>
              {working}
            </T>
          </Row>
        ) : (
          <T style={{ fontSize: 14, lineHeight: 20 }}>{text}</T>
        )}
      </View>
    </Row>
  );
}

const st = StyleSheet.create({
  me: { alignSelf: 'flex-end', maxWidth: '80%', borderRadius: 16, borderBottomRightRadius: 6, paddingVertical: 10, paddingHorizontal: 14 },
  bubble: { flex: 1, borderWidth: 1, borderRadius: 16, borderBottomLeftRadius: 6, paddingVertical: 10, paddingHorizontal: 14 },
  sugg: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderRadius: 999, paddingVertical: 9, paddingHorizontal: 13, minHeight: 40, justifyContent: 'center' },
  input: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: 18, paddingHorizontal: 14, paddingVertical: 8, minHeight: 50 },
});
