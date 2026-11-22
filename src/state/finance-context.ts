// Tipos e contexto da fonte de dados (ver state/finance.tsx). Separado para as fontes
// (sources/demo.tsx e sources/remote.tsx) não importarem o provider que as escolhe.
import { createContext } from 'react';

import type { Family } from '@/domain/categories';
import type { Cycle } from '@/domain/cycle';
import type { Summary } from '@/domain/forecast';
import type { BudgetRow } from '@/domain/pila';

export type TxView = {
  id: number;
  date: string; // "2026-10-26"
  amountCents: number; // negativo = saída
  description: string;
  categoryKey: string | null;
  accountId: number;
  accountName: string;
  /** Anotado à mão (no modo conectado: ainda esperando o banco confirmar) */
  manual: boolean;
};

export type PotView = { id: number; name: string; goalCents: number | null; balanceCents: number; color: Family; earnedCents: number | null };

export type NewEntry = { kind: 'out' | 'in'; cents: number; categoryKey: string; pay: 'card' | 'pix'; description: string };

export type SyncOutcome = { created: number; errors: string[] };

export type Finance = {
  mode: 'demo' | 'remote';
  ready: boolean;
  today: Date;
  cycle: Cycle;
  summary: Summary;
  txs: TxView[]; // do ciclo atual, mais recentes primeiro
  pots: PotView[];
  budgets: BudgetRow[];
  profileName: string;
  /** Modo conectado: carregando, erro da última tentativa e quando os dados chegaram */
  status: { loading: boolean; error: string | null; updatedAt: number | null };
  refresh: () => Promise<void>;
  actions: {
    addEntry: (e: NewEntry) => Promise<void>;
    /** Devolve quantas mudaram, ou "rule" quando o computador criou uma regra para as parecidas */
    recategorize: (id: number, categoryKey: string, similar: boolean) => Promise<number | 'rule'>;
    deleteEntry: (id: number) => Promise<void>;
    /** Só no demo: no conectado o dinheiro se move no app do banco e chega pelo sync */
    saveToPot: ((potId: number, cents: number) => Promise<void>) | null;
    setPotGoal: (potId: number, goalCents: number | null) => Promise<void>;
    /** Só no conectado: sincroniza com a Pluggy pelo computador */
    sync: (() => Promise<SyncOutcome>) | null;
  };
};

export const FinanceCtx = createContext<Finance | null>(null);
