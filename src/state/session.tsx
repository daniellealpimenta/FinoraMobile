// Sessão com o Finora do computador: endereço (Tailscale) e token de aparelho.
// O token fica no armazenamento seguro do sistema (Keychain no iPhone, Keystore no Android).
import * as SecureStore from 'expo-secure-store';
import { createContext, type ReactNode, use, useCallback, useEffect, useMemo, useState } from 'react';

import { type Api, createApi, normalizeUrl } from '@/api/client';
import type { PairOut } from '@/api/types';

import { getPrefs, setPrefs, usePrefs } from './prefs';

const TOKEN_KEY = 'finora_device_token';

type Session = {
  /** false enquanto lê o token do armazenamento seguro */
  loaded: boolean;
  api: Api | null;
  email: string | null;
  serverUrl: string | null;
  /** Guarda o resultado do pareamento e entra no modo conectado */
  connect: (serverUrl: string, pair: PairOut) => Promise<void>;
  /** Avisa o computador (se der), apaga o token e volta para a tela de entrada */
  disconnect: () => Promise<void>;
  chooseDemo: () => void;
};

const Ctx = createContext<Session | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const prefs = usePrefs();
  const [token, setToken] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    SecureStore.getItemAsync(TOKEN_KEY)
      .then(setToken)
      .catch(() => setToken(null))
      .finally(() => setLoaded(true));
  }, []);

  const connect = useCallback(async (serverUrl: string, pair: PairOut) => {
    await SecureStore.setItemAsync(TOKEN_KEY, pair.token);
    setToken(pair.token);
    setPrefs({ mode: 'remote', serverUrl: normalizeUrl(serverUrl), deviceId: pair.device.id, email: pair.email });
  }, []);

  const disconnect = useCallback(async () => {
    const { serverUrl, deviceId } = getPrefs();
    if (serverUrl && token && deviceId) {
      // Melhor esforço: some da lista de aparelhos do computador
      await createApi(serverUrl, token)
        .del(`/devices/${deviceId}`)
        .catch(() => undefined);
    }
    await SecureStore.deleteItemAsync(TOKEN_KEY).catch(() => undefined);
    setToken(null);
    setPrefs({ mode: null, serverUrl: null, deviceId: null, email: null });
  }, [token]);

  const chooseDemo = useCallback(() => setPrefs({ mode: 'demo' }), []);

  const value = useMemo<Session>(
    () => ({
      loaded,
      api: prefs.serverUrl && token ? createApi(prefs.serverUrl, token) : null,
      email: prefs.email,
      serverUrl: prefs.serverUrl,
      connect,
      disconnect,
      chooseDemo,
    }),
    [loaded, prefs.serverUrl, prefs.email, token, connect, disconnect, chooseDemo],
  );

  return <Ctx value={value}>{children}</Ctx>;
}

export function useSession() {
  const v = use(Ctx);
  if (!v) throw new Error('useSession fora do SessionProvider');
  return v;
}

/** Cliente da API já autenticado (só no modo conectado) */
export function useApi(): Api {
  const { api } = useSession();
  if (!api) throw new Error('Sem conexão com o Finora');
  return api;
}
