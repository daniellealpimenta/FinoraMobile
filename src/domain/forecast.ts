// Previsão do ciclo, versão enxuta de Finora/backend/app/services/forecast.py:
//
//   livre agora     = saldo da conta − fatura aberta do cartão
// + salário previsto (se ainda não caiu neste ciclo)
// − gastos fixos que faltam
// − o que falta da meta de guardar (o que já foi para os cofrinhos no ciclo conta)
// = dá para gastar no ciclo;  ÷ dias que faltam = por dia
//
// Tudo em centavos inteiros.

import { CATEGORY } from './categories';
import { type Cycle, cycleLength, dayOfCycle, daysLeft, inCycle } from './cycle';

export type Planning = {
  salaryCents: number;
  salaryDay: number;
  fixedCents: number;
  goalCents: number;
};

export const DEFAULT_PLANNING: Planning = { salaryCents: 620_000, salaryDay: 5, fixedCents: 136_663, goalCents: 200_000 };

export type TxLike = { date: string; amountCents: number; categoryKey: string | null; accountType: 'CHECKING' | 'CREDIT_CARD' };

export type Summary = {
  checkingCents: number;
  billCents: number;
  freeCents: number;
  salaryPendingCents: number;
  fixedCents: number;
  goalLeftCents: number;
  savedInCycleCents: number;
  spendableCents: number;
  perDayCents: number;
  daysLeft: number;
  day: number;
  length: number;
  incomeCents: number;
  spentCents: number;
  /** [categoria, centavos gastos], do maior para o menor */
  byCategory: [string, number][];
};

// Saída que é gasto: fica de fora o que é receita ou movimentação entre contas (fatura, cofrinho)
const isExpense = (t: TxLike) => {
  const kind = CATEGORY[t.categoryKey ?? '']?.kind;
  return t.amountCents < 0 && kind !== 'INCOME' && kind !== 'TRANSFER';
};

export function summarize(args: {
  cycle: Cycle;
  today: Date;
  checkingCents: number;
  txs: TxLike[];
  savedInCycleCents: number;
  planning: Planning;
}): Summary {
  const { cycle, today, checkingCents, planning } = args;
  const txs = args.txs.filter((t) => inCycle(cycle, t.date));

  const billCents = -txs.filter((t) => t.accountType === 'CREDIT_CARD').reduce((a, t) => a + t.amountCents, 0);
  const freeCents = checkingCents - billCents;

  const salaryReceived = txs.some((t) => t.categoryKey === 'salary' && t.amountCents > 0);
  const salaryPendingCents = salaryReceived ? 0 : planning.salaryCents;
  const savedInCycleCents = Math.max(0, args.savedInCycleCents);
  const goalLeftCents = Math.max(0, planning.goalCents - savedInCycleCents);

  const spendableCents = freeCents + salaryPendingCents - planning.fixedCents - goalLeftCents;
  const left = daysLeft(cycle, today);

  const totals = new Map<string, number>();
  let spentCents = 0;
  let incomeCents = 0;
  for (const t of txs) {
    if (isExpense(t)) {
      const k = t.categoryKey ?? 'other';
      totals.set(k, (totals.get(k) ?? 0) - t.amountCents);
      spentCents -= t.amountCents;
    } else if (t.amountCents > 0) {
      incomeCents += t.amountCents;
    }
  }

  return {
    checkingCents,
    billCents,
    freeCents,
    salaryPendingCents,
    fixedCents: planning.fixedCents,
    goalLeftCents,
    savedInCycleCents,
    spendableCents,
    perDayCents: Math.floor(spendableCents / left),
    daysLeft: left,
    day: Math.min(dayOfCycle(cycle, today), cycleLength(cycle)),
    length: cycleLength(cycle),
    incomeCents,
    spentCents,
    byCategory: [...totals.entries()].filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]),
  };
}

export type BudgetStatus = 'ok' | 'near' | 'over';
/** ● ok, ▲ a partir de 80% do limite, ■ acima do limite (MASTER.md, "Pill de status") */
export const budgetStatus = (spent: number, limit: number): BudgetStatus =>
  spent > limit ? 'over' : spent >= limit * 0.8 ? 'near' : 'ok';
