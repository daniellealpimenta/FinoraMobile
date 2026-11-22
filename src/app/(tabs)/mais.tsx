// Mais: o Finora conectado (sincronizar, contas, desejos, jogo, desconectar) ou o convite para
// conectar, e as preferências do app.
import { router } from 'expo-router';
import {
  ChevronRight,
  Eye,
  Gift,
  Heart,
  Landmark,
  Laptop,
  Lock,
  MessageCircle,
  RefreshCw,
  RotateCcw,
  ScanFace,
  SunMoon,
  Target,
  Unplug,
} from 'lucide-react-native';
import type { ReactNode } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Switch, View } from 'react-native';

import { Card, Row, Screen, T } from '@/components/ui';
import { resetDemo } from '@/db/repo';
import { budgetStatus } from '@/domain/forecast';
import { useFinance } from '@/state/finance';
import { setPref, setPrefs, type ThemePref, usePrefs } from '@/state/prefs';
import { useSession } from '@/state/session';
import { useSync } from '@/state/sync';
import { useUI } from '@/state/ui';
import { RADIUS, useTheme } from '@/theme/tokens';

const THEME_LABEL: Record<ThemePref, string> = { system: 'Sistema', light: 'Claro', dark: 'Escuro' };
const NEXT_THEME: Record<ThemePref, ThemePref> = { system: 'light', light: 'dark', dark: 'system' };

const ago = (ms: number | null) => {
  if (!ms) return 'nunca';
  const min = Math.round((Date.now() - ms) / 60_000);
  if (min < 1) return 'agora';
  if (min < 60) return `há ${min} min`;
  return `há ${Math.round(min / 60)} h`;
};

export default function Mais() {
  const { c, tint } = useTheme();
  const { budgets, mode, status } = useFinance();
  const prefs = usePrefs();
  const { lock, toast } = useUI();
  const { email, serverUrl, disconnect } = useSession();
  const sync = useSync();
  const over = budgets.filter((b) => budgetStatus(b.spentCents, b.limitCents) === 'over').length;
  const near = budgets.filter((b) => budgetStatus(b.spentCents, b.limitCents) === 'near').length;
  const remote = mode === 'remote';

  const reset = () =>
    Alert.alert('Reiniciar dados de exemplo?', 'Os lançamentos que você fez somem e o mês de exemplo volta como no primeiro uso.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Reiniciar',
        style: 'destructive',
        onPress: () => {
          resetDemo();
          toast('Pronto, os dados de exemplo voltaram.', 'happy');
        },
      },
    ]);

  const askDisconnect = () =>
    Alert.alert('Desconectar este celular?', 'Ele sai da lista de aparelhos do seu Finora. Para voltar, é só parear de novo.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Desconectar', style: 'destructive', onPress: () => disconnect() },
    ]);

  return (
    <Screen>
      <T v="page">Mais</T>
      <Row gap={10} style={{ alignItems: 'stretch' }}>
        <Big
          icon={<Target size={18} color={c.cat.move} />}
          tone={tint(c.cat.move)}
          title="Orçamentos"
          sub={over ? `${over} estourou` : near ? `${near} perto do limite` : 'tudo em dia'}
          onPress={() => router.push('/orcamentos')}
        />
        <Big icon={<MessageCircle size={18} color={c.cat.care} />} tone={tint(c.cat.care)} title="Pila" sub="Pergunte sobre seus números" onPress={() => router.push('/pila')} />
      </Row>

      {remote ? (
        <>
          <T v="label" style={{ marginTop: 8 }}>
            Seu Finora
          </T>
          <Card style={{ paddingVertical: 4, paddingHorizontal: 14 }}>
            <Item icon={<Laptop size={16} color={c.accent} />} tone={c.accent} label={email ?? 'Conectado'} first>
              <T muted style={{ fontSize: 12 }}>
                {ago(status.updatedAt)}
              </T>
            </Item>
            <Item icon={<RefreshCw size={16} color={c.accent} />} tone={c.accent} label="Sincronizar com o banco" onPress={sync.run}>
              {sync.syncing ? <ActivityIndicator size="small" color={c.accent} /> : <ChevronRight size={16} color={c.muted} />}
            </Item>
            <Item icon={<Landmark size={16} color={c.cat.fun} />} tone={c.cat.fun} label="Contas e bancos" onPress={() => router.push('/contas')}>
              <ChevronRight size={16} color={c.muted} />
            </Item>
            <Item icon={<Gift size={16} color={c.cat.shop} />} tone={c.cat.shop} label="Desejos" onPress={() => router.push('/desejos')}>
              <ChevronRight size={16} color={c.muted} />
            </Item>
            <Item icon={<Heart size={16} color={c.cat.care} />} tone={c.cat.care} label="Precisava ou foi vontade?" onPress={() => router.push('/precisava')}>
              <ChevronRight size={16} color={c.muted} />
            </Item>
            <Item icon={<Unplug size={16} color={c.negative} />} tone={c.negative} label="Desconectar este celular" color={c.negative} onPress={askDisconnect} />
          </Card>
          <T v="label" style={{ textAlign: 'center' }}>
            {serverUrl}
          </T>
        </>
      ) : (
        <Pressable
          onPress={() => setPrefs({ mode: null })}
          accessibilityRole="button"
          style={({ pressed }) => [st.invite, { backgroundColor: tint(c.accent), opacity: pressed ? 0.8 : 1 }]}>
          <Laptop size={22} color={c.accent} />
          <View style={{ flex: 1 }}>
            <T v="strong">Conectar ao meu Finora</T>
            <T v="label">Contas reais pela Pluggy, sincronizar, desejos, o jogo e o Pila com IA</T>
          </View>
          <ChevronRight size={18} color={c.accent} />
        </Pressable>
      )}

      <T v="label" style={{ marginTop: 8 }}>
        App
      </T>
      <Card style={{ paddingVertical: 4, paddingHorizontal: 14 }}>
        <Item icon={<Eye size={16} color={c.cat.fin} />} label="Esconder valores" first>
          <Switch value={prefs.hidden} onValueChange={(v) => setPref('hidden', v)} trackColor={{ true: c.accent, false: c.border }} thumbColor={c.surface} />
        </Item>
        <Item icon={<ScanFace size={16} color={c.cat.fin} />} label="Pedir Face ID ao abrir">
          <Switch value={prefs.lockOnOpen} onValueChange={(v) => setPref('lockOnOpen', v)} trackColor={{ true: c.accent, false: c.border }} thumbColor={c.surface} />
        </Item>
        <Item icon={<SunMoon size={16} color={c.cat.fin} />} label="Tema" onPress={() => setPref('theme', NEXT_THEME[prefs.theme])}>
          <T muted style={{ fontSize: 13 }}>
            {THEME_LABEL[prefs.theme]}
          </T>
        </Item>
        {!remote && (
          <Item icon={<RotateCcw size={16} color={c.accent} />} tone={c.accent} label="Reiniciar dados de exemplo" onPress={reset}>
            <ChevronRight size={16} color={c.muted} />
          </Item>
        )}
        <Item icon={<Lock size={16} color={c.negative} />} tone={c.negative} label="Bloquear agora" color={c.negative} onPress={lock} />
      </Card>
      <T v="label" style={{ textAlign: 'center', marginTop: 8, lineHeight: 18 }}>
        {remote ? 'Os números vêm do seu computador, pela Tailscale.' : 'Demonstração: os dados ficam só neste celular, num banco SQLite.'}
        {'\n'}Finora · versão 1.1
      </T>
    </Screen>
  );
}

function Big({ icon, tone, title, sub, onPress }: { icon: ReactNode; tone: string; title: string; sub: string; onPress: () => void }) {
  const { c } = useTheme();
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => [st.big, { backgroundColor: c.surface, borderColor: c.cardEdge, opacity: pressed ? 0.7 : 1 }]}>
      <View style={[st.ico, { backgroundColor: tone }]}>{icon}</View>
      <View>
        <T v="strong">{title}</T>
        <T v="label">{sub}</T>
      </View>
    </Pressable>
  );
}

function Item({
  icon,
  label,
  children,
  onPress,
  first,
  color,
  tone,
}: {
  icon: ReactNode;
  label: string;
  children?: ReactNode;
  onPress?: () => void;
  first?: boolean;
  color?: string;
  tone?: string;
}) {
  const { c, tint } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      style={({ pressed }) => [st.item, !first && { borderTopWidth: StyleSheet.hairlineWidth * 2, borderTopColor: c.border }, pressed && { opacity: 0.6 }]}>
      <View style={[st.ico, { width: 30, height: 30, backgroundColor: tint(tone ?? c.cat.fin) }]}>{icon}</View>
      <T v="title" color={color} style={{ flex: 1, fontSize: 14 }} numberOfLines={1}>
        {label}
      </T>
      {children}
    </Pressable>
  );
}

const st = StyleSheet.create({
  big: { flex: 1, borderWidth: 1, borderRadius: RADIUS.card, padding: 14, gap: 10, minHeight: 108 },
  ico: { width: 36, height: 36, borderRadius: RADIUS.chip, alignItems: 'center', justifyContent: 'center' },
  item: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 54 },
  invite: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: RADIUS.card, padding: 16 },
});
