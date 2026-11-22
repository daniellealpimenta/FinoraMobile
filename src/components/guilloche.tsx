// Guilhoché das cédulas, atrás do número herói (só no card do topo, como no web).
import { useMemo } from 'react';
import Svg, { Path } from 'react-native-svg';

import { useTheme } from '@/theme/tokens';

export function Guilloche() {
  const { c } = useTheme();
  const paths = useMemo(
    () =>
      Array.from({ length: 9 }, (_, k) => {
        let d = '';
        for (let x = 0; x <= 220; x += 6) {
          const y = 70 + Math.sin(x / 22 + k * 0.55) * (22 + k * 2) + Math.cos(x / 41 + k) * 8;
          d += `${x ? 'L' : 'M'}${x} ${y.toFixed(1)}`;
        }
        return d;
      }),
    [],
  );
  return (
    <Svg width={220} height={150} viewBox="0 0 220 150" style={{ position: 'absolute', right: -30, top: -10, opacity: 0.5 }} pointerEvents="none">
      {paths.map((d, k) => (
        <Path key={k} d={d} fill="none" stroke={c.accent} strokeWidth={0.8} opacity={0.15 + k * 0.03} />
      ))}
    </Svg>
  );
}
