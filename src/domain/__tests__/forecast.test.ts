import { buildSeed, CARD_ID } from '@/db/seed';

import { cycleFor, cycleRange, dayLabel, daysLeft } from '../cycle';
import { budgetStatus, DEFAULT_PLANNING, summarize, type TxLike } from '../forecast';

const today = new Date(2026, 9, 26); // 26/10/2026, dia 16 do ciclo de outubro

function seededSummary(extra: TxLike[] = [], saved = 0, checkingDelta = 0) {
  const seed = buildSeed(today);
  const txs: TxLike[] = seed.transactions.map((t) => ({
    date: t.date,
    amountCents: t.amountCents,
    categoryKey: t.categoryKey,
    accountType: t.accountId === CARD_ID ? 'CREDIT_CARD' : 'CHECKING',
  }));
  return summarize({
    cycle: seed.cycle,
    today,
    checkingCents: seed.accounts[0].balanceCents + checkingDelta,
    txs: [...txs, ...extra],
    savedInCycleCents: saved,
    planning: DEFAULT_PLANNING,
  });
}

describe('ciclo', () => {
  it('vai do dia de início até a véspera dele no mês seguinte', () => {
    const c = cycleFor(today, 11);
    expect(c).toEqual({ key: '2026-10', start: '2026-10-11', end: '2026-11-10', startDay: 11 });
    expect(cycleRange(c)).toBe('11/10 a 10/11');
    expect(daysLeft(c, today)).toBe(15);
  });

  it('antes do dia de início, ainda é o ciclo do mês anterior', () => {
    expect(cycleFor(new Date(2026, 0, 5), 11).key).toBe('2025-12');
  });

  it('dá nome aos dias recentes', () => {
    expect(dayLabel('2026-10-26', today)).toBe('Hoje');
    expect(dayLabel('2026-10-25', today)).toBe('Ontem');
    expect(dayLabel('2026-10-24', today)).toBe('24 de out.');
  });
});

describe('previsão com o mês de exemplo', () => {
  it('bate com o protótipo: R$ 2.971,63 livres e R$ 387 por dia', () => {
    const s = seededSummary();
    expect(s.freeCents).toBe(297_163);
    expect(s.billCents).toBe(140_889);
    expect(s.spentCents).toBe(140_889);
    expect(s.spendableCents).toBe(580_500);
    expect(s.perDayCents).toBe(38_700);
    expect(s.day).toBe(16);
    expect(s.byCategory[0]).toEqual(['groceries', 47_162]);
  });

  it('gasto no cartão aumenta a fatura e baixa o por dia', () => {
    const s = seededSummary([{ date: '2026-10-26', amountCents: -4590, categoryKey: 'delivery', accountType: 'CREDIT_CARD' }]);
    expect(s.billCents).toBe(145_479);
    expect(s.perDayCents).toBe(Math.floor((580_500 - 4590) / 15));
  });

  it('guardar no cofrinho baixa o livre agora, mas conta na meta: o por dia não muda', () => {
    const s = seededSummary([], 10_000, -10_000);
    expect(s.freeCents).toBe(287_163);
    expect(s.perDayCents).toBe(38_700);
  });

  it('salário que já caiu não entra de novo na previsão', () => {
    const s = seededSummary([{ date: '2026-10-26', amountCents: 620_000, categoryKey: 'salary', accountType: 'CHECKING' }], 0, 620_000);
    expect(s.salaryPendingCents).toBe(0);
    expect(s.spendableCents).toBe(580_500);
  });
});

describe('orçamento', () => {
  it('usa ● ok, ▲ a partir de 80% e ■ acima do limite', () => {
    expect(budgetStatus(100, 1000)).toBe('ok');
    expect(budgetStatus(800, 1000)).toBe('near');
    expect(budgetStatus(1001, 1000)).toBe('over');
  });
});
