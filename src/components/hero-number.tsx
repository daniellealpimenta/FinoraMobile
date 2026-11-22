// Número herói: "R$" pequeno em latão, inteiro grande, centavos como etiqueta de preço.
// Quando o valor muda, conta do antigo até o novo (o "odômetro" do Finora web).
import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, View } from 'react-native';

import { money, moneyParts } from '@/lib/format';
import { FONT, useTheme } from '@/theme/tokens';

import { T } from './ui';

export function useCountUp(target: number, duration = 900) {
  const [shown, setShown] = useState(target);
  const from = useRef(target);
  useEffect(() => {
    let raf = 0;
    let cancelled = false;
    const start = from.current;
    if (start === target) return;
    AccessibilityInfo.isReduceMotionEnabled().then((reduce) => {
      if (cancelled) return;
      if (reduce) {
        from.current = target;
        setShown(target);
        return;
      }
      const t0 = Date.now();
      const step = () => {
        const k = Math.min((Date.now() - t0) / duration, 1);
        const e = 1 - Math.pow(1 - k, 3);
        const v = Math.round(start + (target - start) * e);
        from.current = v;
        setShown(v);
        if (k < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, [target, duration]);
  return shown;
}

export function HeroNumber({ cents, size = 52, hidden, showCents = true, animate = true }: { cents: number; size?: number; hidden?: boolean; showCents?: boolean; animate?: boolean }) {
  const { c } = useTheme();
  const counted = useCountUp(cents);
  const v = animate ? counted : cents;
  const [int, cts] = moneyParts(v);
  return (
    <View
      style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 4 }}
      accessible
      accessibilityLabel={hidden ? 'Valor escondido' : money(cents)}>
      <T style={{ fontFamily: FONT.displaySemi, fontSize: size * 0.42, color: c.accent, marginTop: size * 0.16 }}>R$</T>
      <T style={{ fontFamily: FONT.display, fontSize: size, letterSpacing: -size * 0.03, lineHeight: size * 1.08 }}>{hidden ? '••••' : int}</T>
      {showCents && !hidden && (
        <T muted style={{ fontFamily: FONT.display, fontSize: size * 0.45, marginTop: size * 0.04 }}>
          ,{cts}
        </T>
      )}
    </View>
  );
}
