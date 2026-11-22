// Sincronizar com o banco (Pluggy) pelo Finora do computador, com o Pila contando o resultado.
import * as Haptics from 'expo-haptics';
import { useState } from 'react';

import { useFinance } from './finance';
import { useUI } from './ui';

export function useSync() {
  const { actions } = useFinance();
  const { toast } = useUI();
  const [syncing, setSyncing] = useState(false);

  const run = async () => {
    if (!actions.sync || syncing) return;
    setSyncing(true);
    try {
      const r = await actions.sync();
      Haptics.notificationAsync(r.errors.length ? Haptics.NotificationFeedbackType.Warning : Haptics.NotificationFeedbackType.Success);
      if (r.errors.length) toast(`Sincronizei, mas um banco reclamou: ${r.errors[0]}`, 'worried');
      else if (r.created) toast(`Chegaram ${r.created} ${r.created === 1 ? 'transação nova' : 'transações novas'} do banco.`, 'celebrate');
      else toast('Tudo em dia: nada novo no banco.', 'happy');
    } catch (e) {
      toast(e instanceof Error ? e.message : String(e), 'worried');
    } finally {
      setSyncing(false);
    }
  };

  return { available: !!actions.sync, syncing, run };
}
