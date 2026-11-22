// Modo conectado: os números vêm do Finora do computador (FastAPI) pela Tailscale.
// Os mesmos campos que a Visão geral da web mostra, para os dois baterem:
//   Livre agora = summary.flow.ended_with · Em conta = liquid_balance
//   Dá para gastar / por dia / dias = forecast.spendable, daily_allowance, days_left
// A última resposta fica guardada no celular: o app abre com ela mesmo sem conexão.
import Storage from 'expo-sqlite/kv-store';
import { RefreshCw, Unplug } from 'lucide-react-native';
import { type ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { AppState, Pressable, View } from 'react-native';

import { ApiError, cents } from '@/api/client';
import type {
  AccountOut,
  CategoryOut,
  CategorySpendOut,
  ForecastOut,
  MeOut,
  PotOut,
  SummaryOut,
  SyncStatus,
  TransactionOut,
  TransactionPage,
} from '@/api/types';
import { Pila } from '@/components/pila';
import { T } from '@/components/ui';
import type { Family } from '@/domain/categories';
import { type Cycle, cycleLength, dayOfCycle, toISO } from '@/domain/cycle';
import type { Summary } from '@/domain/forecast';
import type { BudgetRow } from '@/domain/pila';
import { useSession } from '@/state/session';
import { FONT, useTheme } from '@/theme/tokens';

import { type Finance, FinanceCtx, type TxView } from '../finance-context';

type Snapshot = {
  at: number;
  summary: SummaryOut;
  forecast: ForecastOut;
  page: TransactionPage;
  spend: CategorySpendOut[];
  pots: PotOut[];
  accounts: AccountOut[];
  categories: CategoryOut[];
  me: MeOut;
};

const POT_COLORS: Family[] = ['care', 'fun', 'home', 'shop', 'move', 'food'];
const STALE_MS = 30_000;
const cacheKey = (url: string) => `remote:${url}`;

function readCache(url: string): Snapshot | null {
  try {
    const raw = Storage.getItemSync(cacheKey(url));
    return raw ? (JSON.parse(raw) as Snapshot) : null;
  } catch {
    return null;
  }
}

function writeCache(url: string, snap: Snapshot) {
  try {
    Storage.setItemSync(cacheKey(url), JSON.stringify(snap));
  } catch {
    // sem cache: só não abre offline
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
// Uma busca por vez por servidor: quem chamar durante uma busca espera a mesma
const inflight = new Map<string, Promise<void>>();

export function RemoteFinance({ children }: { children: ReactNode }) {
  const { api, serverUrl } = useSession();
  const [snap, setSnap] = useState<Snapshot | null>(() => (serverUrl ? readCache(serverUrl) : null));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unauthorized, setUnauthorized] = useState(false);

  const refresh = useCallback(async () => {
    if (!api || !serverUrl) return;
    const pending = inflight.get(serverUrl);
    if (pending) {
      // Outra busca já está a caminho (talvez de outra montagem deste componente): espera e
      // lê o resultado do cache, que ela grava ao terminar
      await pending;
      const cached = readCache(serverUrl);
      if (cached) setSnap(cached);
      setLoading(false);
      return;
    }
    const run = (async () => {
      setLoading(true);
      try {
        const [summary, forecast, spend, pots, accounts, categories, me] = await Promise.all([
          api.get<SummaryOut>('/dashboard/summary'),
          api.get<ForecastOut>('/dashboard/forecast'),
          api.get<CategorySpendOut[]>('/dashboard/categories'),
          api.get<PotOut[]>('/pots'),
          api.get<AccountOut[]>('/accounts'),
          api.get<CategoryOut[]>('/categories'),
          api.get<MeOut>('/auth/me'),
        ]);
        const page = await api.get<TransactionPage>(`/transactions?month=${summary.cycle.key}&page_size=200`);
        const next: Snapshot = { at: Date.now(), summary, forecast, page, spend, pots, accounts, categories, me };
        setSnap(next);
        writeCache(serverUrl, next);
        setError(null);
        setUnauthorized(false);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
        if (e instanceof ApiError && e.status === 401) setUnauthorized(true);
      } finally {
        setLoading(false);
        inflight.delete(serverUrl);
      }
    })();
    inflight.set(serverUrl, run);
    return run;
  }, [api, serverUrl]);

  // Busca ao abrir e sempre que o app volta para a frente (se os dados tiverem mais de 30 s)
  const lastAt = snap?.at ?? 0;
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- busca na API ao abrir
    refresh();
  }, [refresh]);
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active' && Date.now() - lastAt > STALE_MS) refresh();
    });
    return () => sub.remove();
  }, [refresh, lastAt]);

  const value = useMemo<Finance | null>(() => {
    if (!snap || !api) return null;
    const today = new Date();
    const keyById = new Map(snap.categories.map((c) => [c.id, c.key]));
    const idByKey = new Map(snap.categories.filter((c) => c.key).map((c) => [c.key as string, c.id]));
    const c = snap.summary.cycle;
    const cycle: Cycle = { key: c.key, start: c.start, end: c.end, startDay: c.start_day ?? Number(c.start.slice(8, 10)) };

    const f = snap.forecast;
    const free = cents(snap.summary.flow.ended_with);
    const checking = cents(snap.summary.liquid_balance);
    const byCategory: [string, number][] = snap.spend
      .filter((s) => cents(s.spent) > 0)
      .map((s): [string, number] => [(s.category_id != null && keyById.get(s.category_id)) || 'other', cents(s.spent)])
      .sort((a, b) => b[1] - a[1]);

    const summary: Summary = {
      checkingCents: checking,
      billCents: checking - free,
      freeCents: free,
      salaryPendingCents: cents(f.income_left),
      fixedCents: cents(f.fixed_left) + cents(f.installments_left),
      goalLeftCents: cents(f.savings.left),
      savedInCycleCents: cents(f.savings.saved),
      spendableCents: cents(f.spendable),
      perDayCents: cents(f.daily_allowance ?? 0),
      daysLeft: f.days_left,
      day: Math.min(dayOfCycle(cycle, today), cycleLength(cycle)),
      length: cycleLength(cycle),
      incomeCents: cents(snap.summary.income),
      spentCents: cents(snap.summary.expense),
      byCategory,
    };

    const budgets: BudgetRow[] = snap.spend
      .filter((s) => s.budget != null && s.category_id != null)
      .map((s) => ({ categoryKey: keyById.get(s.category_id as number) ?? 'other', limitCents: cents(s.budget), spentCents: cents(s.spent) }));

    const txs: TxView[] = snap.page.items.map((t: TransactionOut) => ({
      id: t.id,
      date: t.date,
      amountCents: cents(t.amount),
      description: t.description,
      categoryKey: t.category_id != null ? (keyById.get(t.category_id) ?? null) : null,
      accountId: t.account_id,
      accountName: t.account_name,
      manual: t.source === 'MANUAL',
    }));

    const card = snap.accounts.find((a) => a.type === 'CREDIT_CARD');
    const cash = snap.accounts.find((a) => a.type === 'CHECKING') ?? snap.accounts.find((a) => a.type === 'SAVINGS');

    const actions: Finance['actions'] = {
      addEntry: async (e) => {
        const account = e.kind === 'out' && e.pay === 'card' ? card : cash;
        if (!account) throw new Error(e.pay === 'card' ? 'Nenhum cartão no seu Finora ainda.' : 'Nenhuma conta corrente no seu Finora ainda.');
        const value = (e.kind === 'out' ? -e.cents : e.cents) / 100;
        await api.post('/transactions', {
          account_id: account.id,
          date: toISO(new Date()),
          amount: value.toFixed(2),
          description: e.description.trim() || 'Lançamento',
          category_id: idByKey.get(e.categoryKey) ?? null,
        });
        await refresh();
      },
      recategorize: async (id, key, similar) => {
        const categoryId = idByKey.get(key);
        if (categoryId == null) throw new Error('Categoria não encontrada no seu Finora.');
        await api.patch(`/transactions/${id}`, { category_id: categoryId, create_rule: similar });
        await refresh();
        return similar ? 'rule' : 1;
      },
      deleteEntry: async (id) => {
        await api.del(`/transactions/${id}`);
        await refresh();
      },
      saveToPot: null,
      setPotGoal: async (potId, goalCents) => {
        await api.patch(`/pots/${potId}`, { goal_amount: goalCents == null ? null : (goalCents / 100).toFixed(2) });
        await refresh();
      },
      sync: async () => {
        await api.post<SyncStatus>('/sync');
        let status: SyncStatus | null = null;
        // O sync roda em segundo plano no computador; acompanha até terminar (no máximo 2 min)
        for (let i = 0; i < 80; i++) {
          await sleep(1500);
          status = await api.get<SyncStatus>('/sync/status');
          if (!status.running) break;
        }
        await refresh();
        const r = status?.last_result;
        const errors = [...(r?.errors ?? []), ...(status?.last_error ? [status.last_error] : [])];
        return { created: r?.created ?? 0, errors };
      },
    };

    return {
      mode: 'remote',
      ready: true,
      today,
      cycle,
      summary,
      txs,
      pots: snap.pots.map((p, i) => ({
        id: p.id,
        name: p.name,
        goalCents: p.goal_amount != null ? cents(p.goal_amount) : null,
        balanceCents: cents(p.balance),
        color: POT_COLORS[i % POT_COLORS.length],
        earnedCents: cents(p.earned),
      })),
      budgets,
      profileName: snap.me.username || snap.me.email.split('@')[0],
      status: { loading, error, updatedAt: snap.at },
      refresh,
      actions,
    };
  }, [snap, api, loading, error, refresh]);

  if (!value || unauthorized) return <RemoteGate loading={loading} error={error} unauthorized={unauthorized} onRetry={refresh} />;
  return <FinanceCtx value={value}>{children}</FinanceCtx>;
}

/** Sem dados ainda (primeira vez) ou celular desconectado pelo computador */
function RemoteGate({ loading, error, unauthorized, onRetry }: { loading: boolean; error: string | null; unauthorized: boolean; onRetry: () => void }) {
  const { c } = useTheme();
  const { disconnect, serverUrl } = useSession();
  return (
    <View style={{ flex: 1, backgroundColor: c.bg, alignItems: 'center', justifyContent: 'center', padding: 28, gap: 12 }}>
      <Pila size={96} mood={loading ? 'neutral' : 'worried'} />
      <T style={{ fontFamily: FONT.displayBold, fontSize: 22, textAlign: 'center' }}>
        {loading ? 'Buscando seus números…' : unauthorized ? 'Este celular foi desconectado' : 'Não deu para falar com o seu Finora'}
      </T>
      <T muted style={{ textAlign: 'center', lineHeight: 21 }}>
        {loading ? serverUrl : unauthorized ? 'Pareie de novo pelo Perfil do Finora no computador.' : error}
      </T>
      {!loading && (
        <View style={{ gap: 10, marginTop: 8, alignSelf: 'stretch' }}>
          {!unauthorized && <GateButton onPress={onRetry} icon={<RefreshCw size={18} color={c.accentFg} />} label="Tentar de novo" primary />}
          <GateButton onPress={disconnect} icon={<Unplug size={18} color={c.fg} />} label={unauthorized ? 'Parear de novo' : 'Desconectar e voltar'} />
        </View>
      )}
    </View>
  );
}

function GateButton({ onPress, icon, label, primary }: { onPress: () => void; icon: ReactNode; label: string; primary?: boolean }) {
  const { c } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => ({
        minHeight: 50,
        borderRadius: 16,
        flexDirection: 'row',
        gap: 8,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: primary ? c.accent : c.surface2,
        opacity: pressed ? 0.8 : 1,
      })}>
      {icon}
      <T style={{ fontFamily: FONT.bold }} color={primary ? c.accentFg : c.fg}>
        {label}
      </T>
    </Pressable>
  );
}
