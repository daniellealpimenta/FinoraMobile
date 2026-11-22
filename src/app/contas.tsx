// Contas e bancos (modo conectado): conexões da Pluggy, saldos, aviso de banco parado,
// sincronizar e conectar um banco novo pelo Pluggy Connect (react-native-pluggy-connect).
// Como na web: com a aplicação Pluggy em trial, os bancos entram pelo conector MeuPluggy
// (meu.pluggy.ai); o banco de testes da Pluggy serve para experimentar.
import { router } from 'expo-router';
import { ChevronLeft, Landmark, Plus, RefreshCw, TriangleAlert, X } from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Switch, View } from 'react-native';
import { PluggyConnect } from 'react-native-pluggy-connect';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { cents } from '@/api/client';
import type { AccountOut, ConnectionOut } from '@/api/types';
import { Card, Divider, IconButton, Pill, Row, Screen, T } from '@/components/ui';
import { diffDays, fromISO, shortDate } from '@/domain/cycle';
import { money } from '@/lib/format';
import { useFinance } from '@/state/finance';
import { usePrefs } from '@/state/prefs';
import { useApi } from '@/state/session';
import { useSync } from '@/state/sync';
import { useUI } from '@/state/ui';
import { FONT, RADIUS, useTheme } from '@/theme/tokens';

const MEU_PLUGGY_CONNECTOR_ID = 200;
// Como em Finora/frontend/src/lib/stale.ts: banco sem transação nova há mais de 10 dias
const STALE_DAYS = 10;

const TYPE_LABEL: Record<AccountOut['type'], string> = {
  CHECKING: 'Conta corrente',
  SAVINGS: 'Poupança',
  CREDIT_CARD: 'Cartão de crédito',
  INVESTMENT: 'Investimentos',
  LOAN: 'Empréstimo',
  OTHER: 'Outra',
};

export default function Contas() {
  const { c, tint } = useTheme();
  const api = useApi();
  const { refresh } = useFinance();
  const { toast } = useUI();
  const { hidden } = usePrefs();
  const sync = useSync();
  const insets = useSafeAreaInsets();
  const [connections, setConnections] = useState<ConnectionOut[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [opening, setOpening] = useState(false);
  const [sandbox, setSandbox] = useState(false);

  const load = useCallback(async () => {
    try {
      setConnections(await api.get<ConnectionOut[]>('/connections'));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [api]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- busca na API; o setState vem depois do await
    load();
  }, [load]);

  async function openConnect() {
    setOpening(true);
    try {
      const { access_token } = await api.post<{ access_token: string }>('/pluggy/connect-token');
      setToken(access_token);
    } catch (e) {
      toast(e instanceof Error ? e.message : String(e), 'worried');
    } finally {
      setOpening(false);
    }
  }

  async function onConnected(itemId: string, bank: string) {
    setToken(null);
    try {
      await api.post('/connections', { item_id: itemId });
      toast(`${bank} conectado. Sincronizando…`, 'celebrate');
      await load();
      await sync.run();
      await load();
      await refresh();
    } catch (e) {
      toast(e instanceof Error ? e.message : String(e), 'worried');
    }
  }

  const today = new Date();

  return (
    <Screen tabs={false} onRefresh={load} refreshing={false}>
      <Row style={{ marginLeft: -10 }} gap={0}>
        <IconButton label="Voltar" onPress={() => router.back()}>
          <ChevronLeft size={24} color={c.fg} />
        </IconButton>
        <T v="title">Voltar</T>
      </Row>
      <T v="page">Contas e bancos</T>

      <Row gap={8}>
        <Action icon={<RefreshCw size={18} color={c.accentFg} />} label="Sincronizar" busy={sync.syncing} onPress={async () => { await sync.run(); await load(); }} primary />
        <Action icon={<Plus size={18} color={c.fg} />} label="Conectar banco" busy={opening} onPress={openConnect} />
      </Row>
      <Row>
        <View style={{ flex: 1 }}>
          <T style={{ fontSize: 14 }}>Usar o banco de testes da Pluggy</T>
          <T v="label">Sem isso, o banco entra pelo MeuPluggy (meu.pluggy.ai)</T>
        </View>
        <Switch value={sandbox} onValueChange={setSandbox} trackColor={{ true: c.accent, false: c.border }} thumbColor={c.surface} />
      </Row>

      {error && <T color={c.negative}>{error}</T>}
      {!connections && !error && <ActivityIndicator color={c.accent} />}
      {connections?.length === 0 && (
        <Card style={{ alignItems: 'center', gap: 8 }}>
          <Landmark size={28} color={c.muted} />
          <T muted style={{ textAlign: 'center' }}>
            Nenhum banco conectado ainda. Toque em &quot;Conectar banco&quot;.
          </T>
        </Card>
      )}

      {connections?.map((conn) => (
        <Card key={conn.id} style={{ gap: 4 }}>
          <Row>
            <View style={[st.bank, { backgroundColor: tint(c.cat.fun) }]}>
              <Landmark size={18} color={c.cat.fun} />
            </View>
            <View style={{ flex: 1 }}>
              <T v="title">{conn.institution_name}</T>
              <T v="label">
                {conn.last_synced_at ? `Sincronizado em ${new Date(conn.last_synced_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}` : 'Ainda não sincronizado'}
              </T>
            </View>
            <Pill color={conn.last_sync_error ? c.negative : conn.status === 'UPDATED' ? c.positive : c.warning}>
              {conn.last_sync_error ? '■ erro' : conn.status === 'UPDATED' ? '● em dia' : '▲ atualizando'}
            </Pill>
          </Row>
          {conn.last_sync_error && (
            <T v="label" color={c.negative} style={{ marginTop: 4 }}>
              {conn.last_sync_error}
            </T>
          )}
          {conn.accounts.map((a) => {
            const stale = a.last_transaction_date && diffDays(fromISO(a.last_transaction_date), today) > STALE_DAYS;
            return (
              <View key={a.id}>
                <Divider />
                <Row style={{ paddingVertical: 10 }}>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <T style={{ fontSize: 14, fontFamily: FONT.semi }} numberOfLines={1}>
                      {a.bank ? `${a.bank} · ` : ''}
                      {a.name}
                    </T>
                    <T v="label">{TYPE_LABEL[a.type]}{a.closing_day ? ` · fecha dia ${a.closing_day}` : ''}</T>
                    {stale && (
                      <Row gap={4} style={{ marginTop: 2 }}>
                        <TriangleAlert size={12} color={c.warning} />
                        <T v="label" color={c.warning}>
                          Sem transações novas desde {shortDate(a.last_transaction_date as string)}
                        </T>
                      </Row>
                    )}
                  </View>
                  <T v="value" color={a.type === 'CREDIT_CARD' ? c.negative : c.fg} style={{ fontSize: 14 }}>
                    {money(a.type === 'CREDIT_CARD' ? -Math.abs(cents(a.balance)) : cents(a.balance), { hidden })}
                  </T>
                </Row>
              </View>
            );
          })}
        </Card>
      ))}

      <Modal visible={!!token} animationType="slide" onRequestClose={() => setToken(null)} presentationStyle="fullScreen">
        <View style={{ flex: 1, backgroundColor: '#ffffff', paddingTop: insets.top }}>
          <Row style={{ paddingHorizontal: 8, paddingVertical: 4 }}>
            <IconButton label="Fechar" onPress={() => setToken(null)}>
              <X size={22} color="#111827" />
            </IconButton>
            <T style={{ fontFamily: FONT.semi, color: '#111827' }}>Conectar banco</T>
          </Row>
          {token && (
            <PluggyConnect
              connectToken={token}
              includeSandbox={sandbox}
              {...(sandbox ? {} : { connectorIds: [MEU_PLUGGY_CONNECTOR_ID] })}
              language="pt"
              onSuccess={({ item }) => onConnected(item.id, item.connector?.name ?? 'Banco')}
              onError={({ message }) => {
                setToken(null);
                toast(`Pluggy: ${message}`, 'worried');
              }}
              onClose={() => setToken(null)}
            />
          )}
        </View>
      </Modal>
    </Screen>
  );
}

function Action({ icon, label, onPress, busy, primary }: { icon: React.ReactNode; label: string; onPress: () => void; busy?: boolean; primary?: boolean }) {
  const { c } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={busy}
      accessibilityRole="button"
      style={({ pressed }) => [st.action, { backgroundColor: primary ? c.accent : c.surface2, opacity: pressed ? 0.85 : 1 }]}>
      {busy ? <ActivityIndicator color={primary ? c.accentFg : c.accent} /> : icon}
      <T style={{ fontFamily: FONT.bold, fontSize: 14 }} color={primary ? c.accentFg : c.fg}>
        {label}
      </T>
    </Pressable>
  );
}

const st = StyleSheet.create({
  bank: { width: 36, height: 36, borderRadius: RADIUS.chip, alignItems: 'center', justifyContent: 'center' },
  action: { flex: 1, minHeight: 50, borderRadius: 16, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center' },
});
