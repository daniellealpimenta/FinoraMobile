// Jogo "Precisava ou foi vontade?" (modo conectado): cada gasto do ciclo vira uma carta.
// Arrastar para a direita = precisava, para a esquerda = foi vontade (ou usar os botões).
// Grava em PUT /transactions/{id}/need, como na web (Finora/frontend/src/components/needs).
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { ChevronLeft, Heart, ShieldCheck, Undo2 } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Animated, PanResponder, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';

import type { NeedCard, NeedsSummary } from '@/api/types';
import { CategoryIcon } from '@/components/category-icon';
import { Pila } from '@/components/pila';
import { Bar, Card, IconButton, Row, Screen, T } from '@/components/ui';
import { category } from '@/domain/categories';
import { dayLabel } from '@/domain/cycle';
import { money, percent } from '@/lib/format';
import { usePrefs } from '@/state/prefs';
import { useApi } from '@/state/session';
import { useUI } from '@/state/ui';
import { FONT, RADIUS, useTheme } from '@/theme/tokens';

const SWIPE = 110;

export default function Precisava() {
  const { c } = useTheme();
  const api = useApi();
  const { toast } = useUI();
  const { hidden } = usePrefs();
  const [deck, setDeck] = useState<NeedCard[] | null>(null);
  const [summary, setSummary] = useState<NeedsSummary | null>(null);
  const [last, setLast] = useState<NeedCard | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [d, s] = await Promise.all([api.get<NeedCard[]>('/needs/deck'), api.get<NeedsSummary>('/needs/summary')]);
      setDeck(d.filter((card) => card.need === null));
      setSummary(s);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [api]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- busca na API; o setState vem depois do await
    load();
  }, [load]);

  const answer = useCallback(
    async (card: NeedCard, need: boolean) => {
      setDeck((d) => (d ? d.filter((x) => x.id !== card.id) : d));
      setLast(card);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      try {
        await api.put(`/transactions/${card.id}/need`, { need });
        setSummary(await api.get<NeedsSummary>('/needs/summary'));
      } catch (e) {
        toast(e instanceof Error ? e.message : String(e), 'worried');
        load();
      }
    },
    [api, load, toast],
  );

  const undo = async () => {
    if (!last) return;
    const card = last;
    setLast(null);
    try {
      await api.put(`/transactions/${card.id}/need`, { need: null });
      setDeck((d) => (d ? [card, ...d] : [card]));
      setSummary(await api.get<NeedsSummary>('/needs/summary'));
    } catch (e) {
      toast(e instanceof Error ? e.message : String(e), 'worried');
    }
  };

  const top = deck?.[0];
  const answered = summary ? summary.need + summary.want : 0;

  return (
    <Screen tabs={false}>
      <Row style={{ marginLeft: -10 }} gap={0}>
        <IconButton label="Voltar" onPress={() => router.back()}>
          <ChevronLeft size={24} color={c.fg} />
        </IconButton>
        <T v="title">Voltar</T>
      </Row>
      <T v="page">Precisava ou foi vontade?</T>
      <T v="label" style={{ marginTop: -10 }}>
        Arraste para a direita se precisava, para a esquerda se foi vontade.
      </T>

      {error && <T color={c.negative}>{error}</T>}
      {!deck && !error && <ActivityIndicator color={c.accent} />}

      {deck && (
        <View style={{ height: 300, alignItems: 'center', justifyContent: 'center' }}>
          {deck.slice(1, 3).reverse().map((card, i, arr) => (
            <View key={card.id} style={[st.card, st.behind, { backgroundColor: c.surface, borderColor: c.cardEdge, transform: [{ scale: 0.94 - (arr.length - 1 - i) * 0.04 }, { translateY: 14 + (arr.length - 1 - i) * 10 }] }]} />
          ))}
          {top ? (
            <SwipeCard key={top.id} card={top} hidden={hidden} onAnswer={answer} />
          ) : (
            <View style={{ alignItems: 'center', gap: 10 }}>
              <Pila size={96} mood="celebrate" />
              <T style={{ fontFamily: FONT.displayBold, fontSize: 20 }}>Todas as cartas jogadas!</T>
              <T muted>Volte quando chegarem gastos novos.</T>
            </View>
          )}
        </View>
      )}

      {top && (
        <Row gap={10}>
          <Choice label="Foi vontade" color={c.cat.care} icon={<Heart size={20} color={c.cat.care} />} onPress={() => answer(top, false)} />
          <Choice label="Precisava" color={c.cat.home} icon={<ShieldCheck size={20} color={c.cat.home} />} onPress={() => answer(top, true)} />
        </Row>
      )}
      {last && (
        <Pressable onPress={undo} style={{ alignSelf: 'center', flexDirection: 'row', gap: 6, alignItems: 'center', padding: 8 }} accessibilityRole="button">
          <Undo2 size={16} color={c.accent} />
          <T style={{ color: c.accent, fontFamily: FONT.bold, fontSize: 13 }}>Desfazer {last.label}</T>
        </Pressable>
      )}

      {summary && answered > 0 && (
        <Card style={{ gap: 10 }}>
          <T v="title">Neste ciclo</T>
          <Bar value={summary.need / answered} color={c.cat.home} height={14} />
          <Row>
            <T v="label" style={{ flex: 1 }}>
              <T v="label" color={c.cat.home} style={{ fontFamily: FONT.bold }}>
                {percent(summary.need, answered)}
              </T>{' '}
              precisava · {money(Math.round(summary.need * 100), { hidden })}
            </T>
            <T v="label">
              <T v="label" color={c.cat.care} style={{ fontFamily: FONT.bold }}>
                {percent(summary.want, answered)}
              </T>{' '}
              vontade · {money(Math.round(summary.want * 100), { hidden })}
            </T>
          </Row>
          {summary.half_want > 0 && (
            <T muted style={{ fontSize: 13, lineHeight: 19 }}>
              Cortando metade das vontades, sobrariam {money(Math.round(summary.half_want * 100), { hidden })} no ciclo.
            </T>
          )}
          <T v="label">Faltam {summary.open_count} de {summary.count} cartas.</T>
        </Card>
      )}
    </Screen>
  );
}

function SwipeCard({ card, hidden, onAnswer }: { card: NeedCard; hidden: boolean; onAnswer: (card: NeedCard, need: boolean) => void }) {
  const { c } = useTheme();
  const { width } = useWindowDimensions();
  const [pos] = useState(() => new Animated.ValueXY());

  // Responder duas vezes a mesma carta não tem efeito (PUT idempotente, e ela já saiu da pilha)
  const responder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 8,
        onPanResponderMove: Animated.event([null, { dx: pos.x, dy: pos.y }], { useNativeDriver: false }),
        onPanResponderRelease: (_, g) => {
          if (Math.abs(g.dx) > SWIPE) {
            const need = g.dx > 0;
            Animated.timing(pos, { toValue: { x: (need ? 1 : -1) * width * 1.2, y: g.dy }, duration: 220, useNativeDriver: false }).start(() => onAnswer(card, need));
          } else {
            Animated.spring(pos, { toValue: { x: 0, y: 0 }, useNativeDriver: false, friction: 6 }).start();
          }
        },
      }),
    [card, onAnswer, pos, width],
  );

  const rotate = pos.x.interpolate({ inputRange: [-width, 0, width], outputRange: ['-14deg', '0deg', '14deg'] });
  const needOpacity = pos.x.interpolate({ inputRange: [0, SWIPE], outputRange: [0, 1], extrapolate: 'clamp' });
  const wantOpacity = pos.x.interpolate({ inputRange: [-SWIPE, 0], outputRange: [1, 0], extrapolate: 'clamp' });

  return (
    <Animated.View
      {...responder.panHandlers}
      accessible
      accessibilityLabel={`${card.label}, ${money(Math.round(card.amount * 100))}`}
      style={[st.card, { backgroundColor: c.surface, borderColor: c.cardEdge, transform: [{ translateX: pos.x }, { translateY: pos.y }, { rotate }] }]}>
      <Animated.View style={[st.stamp, { borderColor: c.cat.home, opacity: needOpacity, left: 18, transform: [{ rotate: '-12deg' }] }]}>
        <T style={{ fontFamily: FONT.displayBold, color: c.cat.home, fontSize: 18 }}>PRECISAVA</T>
      </Animated.View>
      <Animated.View style={[st.stamp, { borderColor: c.cat.care, opacity: wantOpacity, right: 18, transform: [{ rotate: '12deg' }] }]}>
        <T style={{ fontFamily: FONT.displayBold, color: c.cat.care, fontSize: 18 }}>VONTADE</T>
      </Animated.View>
      <CategoryIcon categoryKey={card.category_key} />
      <T v="label" style={{ marginTop: 10 }}>
        {card.category_name ?? category(card.category_key).name} · {dayLabel(card.date, new Date())}
      </T>
      <T style={{ fontFamily: FONT.displayBold, fontSize: 22, textAlign: 'center' }} numberOfLines={2}>
        {card.label}
      </T>
      <T style={{ fontFamily: FONT.display, fontSize: 40, letterSpacing: -1, marginTop: 6 }}>{money(Math.round(card.amount * 100), { hidden })}</T>
    </Animated.View>
  );
}

function Choice({ label, color, icon, onPress }: { label: string; color: string; icon: React.ReactNode; onPress: () => void }) {
  const { tint } = useTheme();
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => [st.choice, { backgroundColor: tint(color), opacity: pressed ? 0.75 : 1 }]}>
      {icon}
      <T style={{ fontFamily: FONT.bold }} color={color}>
        {label}
      </T>
    </Pressable>
  );
}

const st = StyleSheet.create({
  card: { position: 'absolute', width: '100%', height: 270, borderRadius: RADIUS.card + 6, borderWidth: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  behind: { opacity: 0.7 },
  stamp: { position: 'absolute', top: 18, borderWidth: 3, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 },
  choice: { flex: 1, minHeight: 54, borderRadius: 16, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center' },
});
