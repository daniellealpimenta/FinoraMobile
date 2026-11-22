// O "@Model" do app: cada tabela é uma classe do SwiftData. Valores em centavos inteiros.
import { sql } from 'drizzle-orm';
import { integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

export const accounts = sqliteTable('accounts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  type: text('type', { enum: ['CHECKING', 'CREDIT_CARD'] }).notNull(),
  // Só a conta corrente tem saldo guardado; a fatura do cartão sai das transações do ciclo
  balanceCents: integer('balance_cents').notNull().default(0),
  closingDay: integer('closing_day'),
  dueDay: integer('due_day'),
});

export const categories = sqliteTable('categories', {
  key: text('key').primaryKey(),
  name: text('name').notNull(),
  kind: text('kind', { enum: ['EXPENSE', 'INCOME'] }).notNull(),
  family: text('family').notNull(),
  icon: text('icon').notNull(),
});

export const transactions = sqliteTable('transactions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  accountId: integer('account_id')
    .notNull()
    .references(() => accounts.id),
  date: text('date').notNull(), // "2026-10-26", data local
  amountCents: integer('amount_cents').notNull(), // negativo = saída
  description: text('description').notNull(),
  categoryKey: text('category_key').references(() => categories.key),
  source: text('source', { enum: ['SEED', 'MANUAL'] }).notNull(),
  userCategorized: integer('user_categorized', { mode: 'boolean' }).notNull().default(false),
  createdAt: integer('created_at').notNull().default(sql`(unixepoch())`),
});

export const budgets = sqliteTable(
  'budgets',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    categoryKey: text('category_key')
      .notNull()
      .references(() => categories.key),
    cycleKey: text('cycle_key').notNull(), // "2026-10" = ciclo que começa em outubro
    limitCents: integer('limit_cents').notNull(),
  },
  (t) => [uniqueIndex('budgets_category_cycle').on(t.categoryKey, t.cycleKey)],
);

export const savingsPots = sqliteTable('savings_pots', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  goalCents: integer('goal_cents'),
  balanceCents: integer('balance_cents').notNull().default(0),
  color: text('color').notNull(), // família de cor: care, fun, home…
});

export const potMoves = sqliteTable('pot_moves', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  potId: integer('pot_id')
    .notNull()
    .references(() => savingsPots.id),
  date: text('date').notNull(),
  amountCents: integer('amount_cents').notNull(), // positivo = guardou, negativo = resgatou
});

export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  value: text('value', { mode: 'json' }).notNull(),
});

export type Account = typeof accounts.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
export type Budget = typeof budgets.$inferSelect;
export type SavingsPot = typeof savingsPots.$inferSelect;
export type PotMove = typeof potMoves.$inferSelect;
