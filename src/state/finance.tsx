// O que as telas enxergam, venha de onde vier:
//  - demo: o mês de exemplo no SQLite do celular (sources/demo.tsx, com useLiveQuery);
//  - remote: o Finora do computador pela Tailscale (sources/remote.tsx).
// As telas só usam useFinance(); a fonte é escolhida pelo modo (prefs.mode).
import { type ReactNode, use } from 'react';

import { FinanceCtx } from './finance-context';
import { usePrefs } from './prefs';
import { DemoFinance } from './sources/demo';
import { RemoteFinance } from './sources/remote';

export type { Finance, NewEntry, PotView, SyncOutcome, TxView } from './finance-context';

export function FinanceProvider({ children }: { children: ReactNode }) {
  const { mode } = usePrefs();
  if (mode === 'remote') return <RemoteFinance>{children}</RemoteFinance>;
  return <DemoFinance>{children}</DemoFinance>;
}

export function useFinance() {
  const v = use(FinanceCtx);
  if (!v) throw new Error('useFinance fora do FinanceProvider');
  return v;
}
