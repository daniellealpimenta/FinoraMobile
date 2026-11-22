// Formatação de dinheiro (como Finora/frontend/src/lib/format.ts), em centavos.
// Saída leva "−" (sinal de menos de verdade); zero fica sem sinal.

const brl = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const brl0 = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 });

export const HIDDEN = 'R$ ••••';

export function money(cents: number, opts: { sign?: boolean; cents?: boolean; hidden?: boolean } = {}) {
  if (opts.hidden) return HIDDEN;
  const v = Math.abs(cents) / 100;
  const body = opts.cents === false ? brl0.format(Math.round(v)) : brl.format(v);
  const pre = cents < 0 && Math.abs(cents) >= 1 ? '−' : opts.sign && cents > 0 ? '+' : '';
  return `${pre}R$ ${body}`;
}

/** Inteiro e centavos separados, para o número herói: ["2.971", "63"] */
export function moneyParts(cents: number): [string, string] {
  const [i, c] = brl.format(Math.abs(cents) / 100).split(',');
  return [`${cents < 0 ? '−' : ''}${i}`, c];
}

export const percent = (part: number, total: number) =>
  total > 0 ? `${(Math.round((part / total) * 1000) / 10).toString().replace('.', ',')}%` : '0%';

/** Valor digitado no teclado ("4590") -> centavos */
export const keypadCents = (digits: string) => (digits ? parseInt(digits, 10) : 0);
