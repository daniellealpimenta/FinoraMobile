// As escritas do app (o "context.insert/delete" do SwiftData). Tudo dentro de transação: o
// saldo da conta e a transação mudam juntos ou não mudam. As telas leem com useLiveQuery e
// se atualizam sozinhas depois de cada escrita.

import { eq } from 'drizzle-orm';

import { toISO } from '@/domain/cycle';

import { db } from './client';
import { accounts, budgets, categories, potMoves, savingsPots, settings, transactions } from './schema';
import { buildSeed, CARD_ID, CHECKING_ID } from './seed';

export type NewEntry = {
  kind: 'out' | 'in';
  cents: number;
  categoryKey: string;
  pay: 'card' | 'pix';
  description: string;
};

const addToChecking = (tx: Parameters<Parameters<typeof db.transaction>[0]>[0], delta: number) => {
  const acc = tx.select().from(accounts).where(eq(accounts.id, CHECKING_ID)).get();
  if (acc) tx.update(accounts).set({ balanceCents: acc.balanceCents + delta }).where(eq(accounts.id, CHECKING_ID)).run();
};

/** Gasto no cartão entra na fatura; Pix/débito sai da conta; entrada soma na conta. */
export function addEntry(e: NewEntry, today = new Date()) {
  if (e.cents <= 0) return;
  const amount = e.kind === 'out' ? -e.cents : e.cents;
  const onCard = e.kind === 'out' && e.pay === 'card';
  db.transaction((tx) => {
    tx.insert(transactions)
      .values({
        accountId: onCard ? CARD_ID : CHECKING_ID,
        date: toISO(today),
        amountCents: amount,
        description: e.description.trim().toUpperCase() || e.categoryKey,
        categoryKey: e.categoryKey,
        source: 'MANUAL',
        userCategorized: true,
      })
      .run();
    if (!onCard) addToChecking(tx, amount);
  });
}

/** Troca a categoria; com `similar`, vale para todas com a mesma descrição. Devolve quantas mudaram. */
export function recategorize(id: number, categoryKey: string, similar: boolean) {
  const t = db.select().from(transactions).where(eq(transactions.id, id)).get();
  if (!t) return 0;
  const where = similar ? eq(transactions.description, t.description) : eq(transactions.id, id);
  const count = db.select().from(transactions).where(where).all().length;
  db.update(transactions).set({ categoryKey, userCategorized: true }).where(where).run();
  return count;
}

/** Apaga um lançamento manual e desfaz o efeito no saldo da conta. */
export function deleteEntry(id: number) {
  db.transaction((tx) => {
    const t = tx.select().from(transactions).where(eq(transactions.id, id)).get();
    if (!t) return;
    tx.delete(transactions).where(eq(transactions.id, id)).run();
    if (t.accountId === CHECKING_ID) addToChecking(tx, -t.amountCents);
  });
}

/** Guardar: sai da conta e entra no cofrinho (com histórico em pot_moves). */
export function saveToPot(potId: number, cents: number, today = new Date()) {
  if (cents <= 0) return;
  db.transaction((tx) => {
    const pot = tx.select().from(savingsPots).where(eq(savingsPots.id, potId)).get();
    if (!pot) return;
    tx.update(savingsPots).set({ balanceCents: pot.balanceCents + cents }).where(eq(savingsPots.id, potId)).run();
    tx.insert(potMoves).values({ potId, date: toISO(today), amountCents: cents }).run();
    addToChecking(tx, -cents);
  });
}

/** Apaga tudo e grava o mês de exemplo de novo (botão "Reiniciar dados de exemplo"). */
export function resetDemo(today = new Date()) {
  const seed = buildSeed(today);
  db.transaction((tx) => {
    for (const t of [potMoves, transactions, budgets, savingsPots, accounts, categories, settings]) tx.delete(t).run();
    tx.insert(categories).values(seed.categories).run();
    tx.insert(accounts).values(seed.accounts).run();
    tx.insert(transactions).values(seed.transactions).run();
    tx.insert(budgets).values(seed.budgets).run();
    tx.insert(savingsPots).values(seed.pots).run();
    tx.insert(settings).values(seed.settings).run();
  });
}

/** Primeiro uso: grava o mês de exemplo se o banco estiver vazio. */
export function seedIfEmpty() {
  const done = db.select().from(settings).where(eq(settings.key, 'seeded')).get();
  if (!done) resetDemo();
}
