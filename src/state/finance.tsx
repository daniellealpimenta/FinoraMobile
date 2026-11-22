// Os dados do app, lidos com useLiveQuery (o "@Query" do SwiftData): qualquer escrita em
// db/repo.ts atualiza todas as telas sozinha. A conta (resumo do ciclo) sai de domain/forecast.ts.
import { desc } from 'drizzle-orm';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { createContext, type ReactNode, use, useMemo } from 'react';

import { db } from '@/db/client';
import { accounts, budgets, potMoves, savingsPots, settings, transactions, type SavingsPot, type Transaction } from '@/db/schema';
import { type Cycle, cycleFor, inCycle, toISO } from '@/domain/cycle';
import { DEFAULT_PLANNING, type Planning, type Summary, summarize } from '@/domain/forecast';
import type { BudgetRow } from '@/domain/pila';

type Finance = {
  ready: boolean;
  today: Date;
  cycle: Cycle;
  summary: Summary;
  txs: Transaction[]; // do ciclo atual, mais recentes primeiro
  cardId: number;
  pots: SavingsPot[];
  budgets: BudgetRow[];
  profileName: string;
};

const Ctx = createContext<Finance | null>(null);

export function FinanceProvider({ children }: { children: ReactNode }) {
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
    const card = accounts_.find((a) => a.type === 'CREDIT_CARD');
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
      ready: set.data !== undefined && set.data.length > 0,
      today,
      cycle,
      summary,
      txs: cycleTxs,
      cardId: card?.id ?? 2,
      pots: pots.data ?? [],
      budgets: budgetRows,
      profileName: String((s.profile as { name?: string } | undefined)?.name ?? ''),
    };
    // todayKey: recalcula quando vira o dia
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tx.data, acc.data, pots.data, moves.data, bud.data, set.data, todayKey]);

  return <Ctx value={value}>{children}</Ctx>;
}

export function useFinance() {
  const v = use(Ctx);
  if (!v) throw new Error('useFinance fora do FinanceProvider');
  return v;
}
