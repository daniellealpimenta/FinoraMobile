// Ciclo de planejamento, como em Finora/backend/app/services/cycles.py (modo "dia de início"):
// do dia escolhido até a véspera dele no mês seguinte. A chave é o mês em que começa
// ("2026-10" = ciclo de outubro, de 11/10 a 10/11). Datas sempre locais, em "AAAA-MM-DD".

export type Cycle = { key: string; start: string; end: string; startDay: number };

const pad = (n: number) => String(n).padStart(2, '0');
export const toISO = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const fromISO = (s: string) => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
};
export const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const DAY = 86_400_000;
/** Dias inteiros de a até b (b − a), sem erro de horário de verão */
export const diffDays = (a: Date, b: Date) =>
  Math.round(
    (Date.UTC(b.getFullYear(), b.getMonth(), b.getDate()) - Date.UTC(a.getFullYear(), a.getMonth(), a.getDate())) / DAY,
  );

// Até 28: todo mês tem esse dia
export const MAX_START_DAY = 28;
export const clampStartDay = (d: number) => Math.min(Math.max(Math.round(d), 1), MAX_START_DAY);

export function cycleFor(today: Date, startDay: number): Cycle {
  const sd = clampStartDay(startDay);
  let y = today.getFullYear();
  let m = today.getMonth();
  if (today.getDate() < sd) {
    m -= 1;
    if (m < 0) {
      m = 11;
      y -= 1;
    }
  }
  const start = new Date(y, m, sd);
  const end = addDays(new Date(y, m + 1, sd), -1);
  return { key: `${y}-${pad(m + 1)}`, start: toISO(start), end: toISO(end), startDay: sd };
}

export const inCycle = (c: Cycle, iso: string) => iso >= c.start && iso <= c.end;
export const cycleLength = (c: Cycle) => diffDays(fromISO(c.start), fromISO(c.end)) + 1;
/** Dia do ciclo, começando em 1 */
export const dayOfCycle = (c: Cycle, today: Date) => diffDays(fromISO(c.start), today) + 1;
/** Dias que faltam depois de hoje (o "faltam 15 dias" do Finora web); nunca menos de 1 */
export const daysLeft = (c: Cycle, today: Date) => Math.max(1, diffDays(today, fromISO(c.end)));

const MONTHS = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const MONTHS_SHORT = ['jan.', 'fev.', 'mar.', 'abr.', 'maio', 'jun.', 'jul.', 'ago.', 'set.', 'out.', 'nov.', 'dez.'];

export const cycleName = (c: Cycle) => `Ciclo de ${MONTHS[Number(c.key.slice(5, 7)) - 1]}`;
export const shortDate = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;
export const cycleRange = (c: Cycle) => `${shortDate(c.start)} a ${shortDate(c.end)}`;

/** "Hoje", "Ontem" ou "24 de out." */
export function dayLabel(iso: string, today: Date) {
  const d = diffDays(fromISO(iso), today);
  if (d === 0) return 'Hoje';
  if (d === 1) return 'Ontem';
  const date = fromISO(iso);
  return `${date.getDate()} de ${MONTHS_SHORT[date.getMonth()]}`;
}

export function longToday(today: Date) {
  const weekday = today.toLocaleDateString('pt-BR', { weekday: 'long' });
  return `${weekday}, ${today.getDate()} de ${MONTHS[today.getMonth()]}`;
}
