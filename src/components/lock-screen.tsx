// Bloqueio na entrada: Face ID / digital / código do aparelho (expo-local-authentication).
// No Expo Go para iOS o Face ID não está disponível e o sistema pede o código do aparelho.
// Sem nenhuma proteção no aparelho (nem código; ex.: simulador), o toque desbloqueia direto.
import * as LocalAuthentication from 'expo-local-authentication';
import { ScanFace } from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

import { longToday } from '@/domain/cycle';
import { FONT, RADIUS, useTheme } from '@/theme/tokens';

import { Pila } from './pila';
import { T } from './ui';

// Cancelado por quem usa ou pelo sistema (app foi para segundo plano, chegou uma ligação):
// não é erro, só volta para o "Toque para entrar"
const CANCELLED = new Set(['user_cancel', 'system_cancel', 'app_cancel']);

function failureText(error: string): string | null {
  if (CANCELLED.has(error)) return null;
  if (error === 'lockout') return 'Muitas tentativas. Desbloqueie o celular com o código e tente de novo.';
  return 'Não deu para confirmar. Toque para tentar de novo.';
}

export function LockScreen({ onUnlock }: { onUnlock: () => void }) {
  const { c, tint } = useTheme();
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Ref e não estado: o pedido automático e o toque usam a mesma trava sem closure velha
  const busy = useRef(false);
  const pulse = useSharedValue(1);
  const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));

  const unlock = useCallback(async () => {
    if (busy.current) return;
    busy.current = true;
    setError(null);
    setScanning(true);
    pulse.set(withRepeat(withTiming(1.1, { duration: 500 }), -1, true));
    try {
      // NONE: o aparelho não tem nem código, então não há com o que confirmar.
      // Com só o código (sem Face ID/digital cadastrados), o sistema pede o código.
      const level = await LocalAuthentication.getEnrolledLevelAsync();
      if (level === LocalAuthentication.SecurityLevel.NONE) {
        onUnlock();
        return;
      }
      const r = await LocalAuthentication.authenticateAsync({ promptMessage: 'Entrar no Finora', cancelLabel: 'Cancelar' });
      if (r.success) onUnlock();
      else setError(failureText(r.error));
    } catch {
      // Falha do módulo não abre o app: os valores continuam protegidos
      setError('Não deu para confirmar. Toque para tentar de novo.');
    } finally {
      pulse.set(withTiming(1));
      setScanning(false);
      busy.current = false;
    }
  }, [onUnlock, pulse]);

  // Pede assim que a tela aparece, mas só com o app em primeiro plano: pedido feito com o app
  // ainda abrindo é cancelado pelo sistema (app_cancel). Volta a pedir só ao voltar do segundo
  // plano: o próprio aviso do Face ID deixa o app "inactive" por um instante, e pedir de novo
  // em todo "active" faria um laço depois de um Cancelar.
  useEffect(() => {
    let t: ReturnType<typeof setTimeout> | undefined;
    let askedOnce = false;
    let wasBackground = false;
    const ask = () => {
      askedOnce = true;
      wasBackground = false;
      clearTimeout(t);
      t = setTimeout(unlock, 400);
    };
    if (AppState.currentState === 'active') ask();
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'background') wasBackground = true;
      if (s === 'active' && (!askedOnce || wasBackground)) ask();
    });
    return () => {
      clearTimeout(t);
      sub.remove();
    };
  }, [unlock]);

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
