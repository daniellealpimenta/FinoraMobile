// Bloqueio na entrada: Face ID / digital / código do aparelho (expo-local-authentication).
// No Expo Go para iOS o Face ID não está disponível e o sistema pede o código do aparelho.
// Sem biometria cadastrada (simulador), o toque desbloqueia direto.
import * as LocalAuthentication from 'expo-local-authentication';
import { ScanFace } from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

import { longToday } from '@/domain/cycle';
import { FONT, RADIUS, useTheme } from '@/theme/tokens';

import { Pila } from './pila';
import { T } from './ui';

export function LockScreen({ onUnlock }: { onUnlock: () => void }) {
  const { c, tint } = useTheme();
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pulse = useSharedValue(1);
  const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));

  const unlock = useCallback(async () => {
    if (scanning) return;
    setError(null);
    setScanning(true);
    pulse.set(withRepeat(withTiming(1.1, { duration: 500 }), -1, true));
    try {
      const has = (await LocalAuthentication.hasHardwareAsync()) && (await LocalAuthentication.isEnrolledAsync());
      if (!has) {
        onUnlock();
        return;
      }
      const r = await LocalAuthentication.authenticateAsync({ promptMessage: 'Entrar no Finora', cancelLabel: 'Cancelar' });
      if (r.success) onUnlock();
      else setError('Não deu para confirmar. Toque para tentar de novo.');
    } catch {
      onUnlock();
    } finally {
      pulse.set(withTiming(1));
      setScanning(false);
    }
  }, [onUnlock, pulse, scanning]);

  // Pede assim que a tela aparece
  useEffect(() => {
    const t = setTimeout(unlock, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const now = new Date();
  const hh = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  return (
    <Animated.View entering={FadeIn} exiting={FadeOut.duration(250)} style={[StyleSheet.absoluteFill, s.wrap, { backgroundColor: c.bg }]}>
      <View style={{ alignItems: 'center' }}>
        <T style={{ fontFamily: FONT.display, fontSize: 76, letterSpacing: -3 }}>{hh}</T>
        <T muted style={{ fontFamily: FONT.semi }}>
          {longToday(now)}
        </T>
      </View>
      <View style={{ alignItems: 'center', gap: 8 }}>
        <Pila size={104} mood={scanning ? 'neutral' : error ? 'worried' : 'sleep'} />
        <T style={{ fontFamily: FONT.displayBold, fontSize: 26 }}>Finora</T>
        <T muted style={{ fontSize: 14 }}>
          Suas finanças, guardadas no seu celular
        </T>
      </View>
      <View style={{ alignItems: 'center', gap: 10 }}>
        <Pressable onPress={unlock} accessibilityRole="button" accessibilityLabel="Desbloquear com Face ID">
          <Animated.View style={[s.face, { backgroundColor: tint(c.accent) }, pulseStyle]}>
            <ScanFace size={40} color={c.accent} strokeWidth={1.8} />
          </Animated.View>
        </Pressable>
        <T v="label" style={{ fontSize: 13, textAlign: 'center' }}>
          {error ?? (scanning ? 'Reconhecendo…' : 'Toque para entrar')}
        </T>
      </View>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  wrap: { zIndex: 100, alignItems: 'center', justifyContent: 'space-between', paddingTop: 110, paddingBottom: 70, paddingHorizontal: 24 },
  face: { width: 76, height: 76, borderRadius: RADIUS.card + 4, alignItems: 'center', justifyContent: 'center' },
});
