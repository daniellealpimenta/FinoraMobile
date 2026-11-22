// Mês de exemplo (o mesmo "Pluggy Bank" fictício dos prints do Finora), montado em volta de
// hoje: o ciclo começa 15 dias atrás, então a demonstração sempre parece "deste ciclo".
// Puro (sem banco) para dar para testar; repo.resetDemo() grava as linhas.

import { CATEGORIES } from '@/domain/categories';
import { addDays, clampStartDay, cycleFor, toISO } from '@/domain/cycle';
import { DEFAULT_PLANNING } from '@/domain/forecast';

export const CHECKING_ID = 1;
export const CARD_ID = 2;

// [dias atrás, descrição, centavos, categoria, conta]
const TXS: [number, string, number, string, number][] = [
  [0, 'UBER *TRIP', -3710, 'ride_hailing', CARD_ID],
  [1, 'UBER *TRIP', -3729, 'ride_hailing', CARD_ID],
  [2, 'IFOOD *PIZZARIA', -7081, 'delivery', CARD_ID],
  [2, 'CARREFOUR HIPER', -18640, 'groceries', CARD_ID],
  [3, 'PIX RECEBIDO', 135000, 'transfers_in', CHECKING_ID],
  [3, 'POSTO SHELL', -12000, 'fuel', CARD_ID],
  [3, 'DROGASIL', -4290, 'pharmacy', CARD_ID],
  [4, 'NETFLIX.COM', -4490, 'subscriptions', CARD_ID],
  [4, 'OUTBACK', -9860, 'eating_out', CARD_ID],
  [5, 'ASSAI ATACADISTA', -28522, 'groceries', CARD_ID],
  [6, 'IFOOD *RESTAURANTE', -9640, 'delivery', CARD_ID],
  [7, '99APP *CORRIDA', -11627, 'ride_hailing', CARD_ID],
  [8, 'SPOTIFY', -2190, 'subscriptions', CARD_ID],
  [9, 'IFOOD *RESTAURANTE', -8091, 'delivery', CARD_ID],
  [10, 'IPIRANGA', -6789, 'fuel', CARD_ID],
  [11, 'DROGA RAIA', -3934, 'pharmacy', CARD_ID],
  [12, 'PADARIA REAL', -5196, 'eating_out', CARD_ID],
  [12, 'APPLE.COM/BILL', -1100, 'subscriptions', CARD_ID],
];

export function buildSeed(today: Date) {
  const startDay = clampStartDay(addDays(today, -15).getDate());
  const cycle = cycleFor(today, startDay);
  const closingDay = startDay === 1 ? 28 : startDay - 1;

  return {
    startDay,
    cycle,
    accounts: [
      { id: CHECKING_ID, name: 'Pluggy Bank Conta', type: 'CHECKING' as const, balanceCents: 438_052 },
      {
        id: CARD_ID,
        name: 'Mastercard Gold',
        type: 'CREDIT_CARD' as const,
        balanceCents: 0,
        closingDay,
        dueDay: ((closingDay + 6) % 28) + 1,
      },
    ],
    categories: CATEGORIES.map(({ key, name, kind, family, icon }) => ({ key, name, kind, family, icon })),
    transactions: TXS.map(([ago, description, amountCents, categoryKey, accountId]) => ({
      accountId,
      date: toISO(addDays(today, -ago)),
      amountCents,
      description,
      categoryKey,
      source: 'SEED' as const,
    })),
    budgets: (
      [
        ['groceries', 60_000],
        ['delivery', 30_000],
        ['ride_hailing', 25_000],
        ['eating_out', 18_000],
        ['leisure', 15_000],
      ] as const
    ).map(([categoryKey, limitCents]) => ({ categoryKey, limitCents, cycleKey: cycle.key })),
    pots: [
      { name: 'Reserva de emergência', goalCents: 1_200_000, balanceCents: 982_040, color: 'care' },
      { name: 'Viagem para o Chile', goalCents: 600_000, balanceCents: 341_080, color: 'fun' },
      { name: 'PicPay CDB 110% do CDI', goalCents: null, balanceCents: 241_500, color: 'home' },
    ],
    settings: [
      { key: 'planning', value: DEFAULT_PLANNING },
      { key: 'cycle', value: { startDay } },
      { key: 'profile', value: { name: 'Daniel' } },
      { key: 'seeded', value: { at: toISO(today) } },
    ],
  };
}
