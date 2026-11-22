// Respostas do Pila, sempre a partir dos números do app (MASTER.md: "sem inventar número").
// Sem IA no MVP: perguntas prontas, respostas calculadas na hora.

import { category } from './categories';
import { budgetStatus, type Summary } from './forecast';
import { money, percent } from '@/lib/format';

export type Mood = 'happy' | 'neutral' | 'worried' | 'sleep' | 'shy' | 'celebrate';
export type BudgetRow = { categoryKey: string; limitCents: number; spentCents: number };
export type PotRow = { name: string; balanceCents: number; goalCents: number | null };

export const QUESTIONS = [
  'Quanto posso gastar hoje?',
  'Como estão meus orçamentos?',
  'Onde gastei mais?',
  'Quanto já guardei?',
] as const;

const names = (keys: string[]) => keys.map((k) => category(k).name).join(' e ');

export function budgetNote(rows: BudgetRow[]): { text: string; mood: Mood } {
  const over = rows.filter((r) => budgetStatus(r.spentCents, r.limitCents) === 'over');
  const near = rows.filter((r) => budgetStatus(r.spentCents, r.limitCents) === 'near');
  if (over.length) {
    const r = over[0];
    return { text: `${category(r.categoryKey).name} passou do limite em ${money(r.spentCents - r.limitCents)}. Segura um pouco até o fim do ciclo?`, mood: 'worried' };
  }
  if (near.length) {
    const r = near[0];
    return { text: `${category(r.categoryKey).name} está perto do limite: sobram ${money(r.limitCents - r.spentCents)}.`, mood: 'neutral' };
  }
  return { text: 'Todos os limites estão em dia. Bom ciclo!', mood: 'happy' };
}

export function answer(i: number, s: Summary, budgets: BudgetRow[], pots: PotRow[]): { text: string; mood: Mood } {
  switch (i) {
    case 0:
      if (s.spendableCents <= 0)
        return { text: `Neste ciclo não sobra para o dia a dia: faltam ${money(-s.spendableCents)} para fechar as contas e a meta.`, mood: 'worried' };
      return {
        text: `Hoje dá para gastar ${money(s.perDayCents, { cents: false })}. Isso já separa ${money(s.goalLeftCents, { cents: false })} para guardar e ${money(s.fixedCents, { cents: false })} de gastos fixos até o fim do ciclo.`,
        mood: 'happy',
      };
    case 1: {
      const over = budgets.filter((r) => budgetStatus(r.spentCents, r.limitCents) === 'over').map((r) => r.categoryKey);
      const near = budgets.filter((r) => budgetStatus(r.spentCents, r.limitCents) === 'near').map((r) => r.categoryKey);
      if (over.length)
        return { text: `${names(over)} ${over.length > 1 ? 'passaram' : 'passou'} do limite.${near.length ? ` ${names(near)} ${near.length > 1 ? 'estão' : 'está'} perto.` : ' O resto está em dia.'}`, mood: 'worried' };
      if (near.length) return { text: `Nenhum estourou, mas ${names(near)} ${near.length > 1 ? 'estão' : 'está'} acima de 80% do limite.`, mood: 'neutral' };
      return { text: 'Todos os orçamentos estão em dia.', mood: 'happy' };
    }
    case 2: {
      const top = s.byCategory[0];
      if (!top) return { text: 'Ainda não tem gasto neste ciclo.', mood: 'sleep' };
      return { text: `Seu maior gasto é ${category(top[0]).name}: ${money(top[1])}, ${percent(top[1], s.spentCents)} do que saiu no ciclo.`, mood: 'neutral' };
    }
    default: {
      const total = pots.reduce((a, p) => a + p.balanceCents, 0);
      const goal = pots.find((p) => p.goalCents);
      const extra = goal?.goalCents ? ` ${goal.name} está em ${Math.round((goal.balanceCents / goal.goalCents) * 100)}% da meta.` : '';
      return { text: `Você tem ${money(total)} nos cofrinhos.${extra}`, mood: 'celebrate' };
    }
  }
}
