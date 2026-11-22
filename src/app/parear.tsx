// Abre pelo link do QR do Perfil (finora://parear?url=…&code=…): lido pela câmera do celular,
// o app já abre pareando. No Expo Go, o mesmo caminho abre por exp://…/--/parear?url=…&code=…
import * as Device from 'expo-device';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';

import { createApi } from '@/api/client';
import type { PairOut } from '@/api/types';
import { Pila } from '@/components/pila';
import { T } from '@/components/ui';
import { useSession } from '@/state/session';
import { FONT, useTheme } from '@/theme/tokens';

export default function Parear() {
  const { c } = useTheme();
  const { url, code } = useLocalSearchParams<{ url?: string; code?: string }>();
  const { connect } = useSession();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!url || !code || !/^\d{6}$/.test(code)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- link inválido: só mostra o aviso
      setError('Este link de pareamento está incompleto. Gere um novo no Perfil do Finora.');
      return;
    }
    const name = (Device.deviceName || Device.modelName || 'Celular').slice(0, 80);
    createApi(url)
      .post<PairOut>('/devices/pair', { code, name })
      .then((pair) => connect(url, pair))
      .then(() => router.replace('/'))
      .catch((e) => setError(e instanceof Error ? e.message : String(e)));
  }, [url, code, connect]);

  return (
    <View style={{ flex: 1, backgroundColor: c.bg, alignItems: 'center', justifyContent: 'center', gap: 14, padding: 28 }}>
      <Pila size={96} mood={error ? 'worried' : 'neutral'} />
      <T style={{ fontFamily: FONT.displayBold, fontSize: 22, textAlign: 'center' }}>{error ? 'Não deu para parear' : 'Pareando com o seu Finora…'}</T>
      {error ? (
        <>
          <T muted style={{ textAlign: 'center', lineHeight: 21 }}>
            {error}
          </T>
          <Pressable onPress={() => router.replace('/')} style={{ padding: 12 }} accessibilityRole="button">
            <T style={{ color: c.accent, fontFamily: FONT.bold }}>Voltar</T>
          </Pressable>
        </>
      ) : (
        <ActivityIndicator color={c.accent} />
      )}
    </View>
  );
}
