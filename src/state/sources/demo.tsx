// Modo demonstração: o mês de exemplo no SQLite do celular, lido com useLiveQuery (o "@Query"
// do SwiftData). Qualquer escrita em db/repo.ts atualiza as telas sozinha.
import { desc, eq } from 'drizzle-orm';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { type ReactNode, useMemo } from 'react';

import { db } from '@/db/client';
import { addEntry, deleteEntry, recategorize, saveToPot } from '@/db/repo';
import { accounts, budgets, potMoves, savingsPots, settings, transactions } from '@/db/schema';
import type { Family } from '@/domain/categories';
import { cycleFor, inCycle, toISO } from '@/domain/cycle';
import { DEFAULT_PLANNING, type Planning, summarize } from '@/domain/forecast';
import type { BudgetRow } from '@/domain/pila';

import { type Finance, FinanceCtx } from '../finance-context';

const ACTIONS: Finance['actions'] = {
  addEntry: async (e) => addEntry(e),
  recategorize: async (id, key, similar) => recategorize(id, key, similar),
  deleteEntry: async (id) => deleteEntry(id),
  saveToPot: async (potId, cents) => saveToPot(potId, cents),
  setPotGoal: async (potId, goalCents) => {
    db.update(savingsPots).set({ goalCents }).where(eq(savingsPots.id, potId)).run();
  },
  sync: null,
};

const STATUS: Finance['status'] = { loading: false, error: null, updatedAt: null };
const refresh = async () => undefined;

export function DemoFinance({ children }: { children: ReactNode }) {
  const tx = useLiveQuery(db.select().from(transactions).orderBy(desc(transactions.date), desc(transactions.id)));
  const acc = useLiveQuery(db.select().from(accounts));
  const pots = useLiveQuery(db.select().from(savingsPots));
  const moves = useLiveQuery(db.select().from(potMoves));
  const bud = useLiveQuery(db.select().from(budgets));
  const set = useLiveQuery(db.select().from(settings));

  const todayKey = toISO(new Date());

  const value = useMemo<Finance>(() => {
    const today = new Date();
    const s = Object.fromEntries((set.data ?? []).map((r) => [r.key, r.value as Record<string, unknown>]));
    const startDay = Number((s.cycle as { startDay?: number } | undefined)?.startDay ?? 11);
    const planning = { ...DEFAULT_PLANNING, ...(s.planning as Partial<Planning> | undefined) };
    const cycle = cycleFor(today, startDay);

    const accounts_ = acc.data ?? [];
    const checking = accounts_.find((a) => a.type === 'CHECKING');
    const typeOf = new Map(accounts_.map((a) => [a.id, a.type]));

    const cycleTxs = (tx.data ?? []).filter((t) => inCycle(cycle, t.date));
    const saved = (moves.data ?? []).filter((m) => inCycle(cycle, m.date)).reduce((a, m) => a + m.amountCents, 0);

    const summary = summarize({
      cycle,
      today,
      checkingCents: checking?.balanceCents ?? 0,
      savedInCycleCents: saved,
      planning,
      txs: cycleTxs.map((t) => ({
        date: t.date,
        amountCents: t.amountCents,
        categoryKey: t.categoryKey,
        accountType: typeOf.get(t.accountId) ?? 'CHECKING',
      })),
    });

    const spentBy = new Map(summary.byCategory);
    const budgetRows: BudgetRow[] = (bud.data ?? [])
      .filter((b) => b.cycleKey === cycle.key)
      .map((b) => ({ categoryKey: b.categoryKey, limitCents: b.limitCents, spentCents: spentBy.get(b.categoryKey) ?? 0 }));

    return {
      mode: 'demo',
      ready: set.data !== undefined && set.data.length > 0,
      today,
      cycle,
      summary,
      txs: cycleTxs.map((t) => ({
        id: t.id,
        date: t.date,
        amountCents: t.amountCents,
        description: t.description,
        categoryKey: t.categoryKey,
        accountId: t.accountId,
        accountName: typeOf.get(t.accountId) === 'CREDIT_CARD' ? 'Cartão' : 'Conta',
        manual: t.source === 'MANUAL',
      })),
      pots: (pots.data ?? []).map((p) => ({
        id: p.id,
        name: p.name,
        goalCents: p.goalCents,
        balanceCents: p.balanceCents,
        color: p.color as Family,
        earnedCents: null,
      })),
      budgets: budgetRows,
      profileName: String((s.profile as { name?: string } | undefined)?.name ?? ''),
      status: STATUS,
      refresh,
      actions: ACTIONS,
    };
    // todayKey: recalcula quando vira o dia
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tx.data, acc.data, pots.data, moves.data, bud.data, set.data, todayKey]);

  return <FinanceCtx value={value}>{children}</FinanceCtx>;
}
