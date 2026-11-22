// O Pila, porquinho do Finora (docs/pila.svg), em react-native-svg. Cores iguais nos dois temas.
import Svg, { Circle, Ellipse, Path, Rect } from 'react-native-svg';

import type { Mood } from '@/domain/pila';

const C = { body: '#f28ab5', light: '#f9b6d2', ear: '#e06f9f', blush: '#e0567f', line: '#8f2f5a', ink: '#3a1426', coin: '#d2ac6a' };

function Eyes({ mood }: { mood: Mood }) {
  if (mood === 'worried')
    return (
      <>
        <Circle cx={43} cy={56} r={4.5} fill={C.ink} />
        <Circle cx={77} cy={56} r={4.5} fill={C.ink} />
        <Path d="M36 46l12 4M84 46l-12 4" stroke={C.ink} strokeWidth={3.5} strokeLinecap="round" />
      </>
    );
  if (mood === 'neutral' || mood === 'celebrate')
    return (
      <>
        <Circle cx={43} cy={56} r={5} fill={C.ink} />
        <Circle cx={77} cy={56} r={5} fill={C.ink} />
        <Circle cx={44.5} cy={54.5} r={1.6} fill="#fff" />
        <Circle cx={78.5} cy={54.5} r={1.6} fill="#fff" />
      </>
    );
  if (mood === 'sleep' || mood === 'shy')
    return <Path d="M37 57h12M71 57h12" stroke={C.ink} strokeWidth={4} strokeLinecap="round" />;
  return <Path d="M37 58q6-8 12 0M71 58q6-8 12 0" stroke={C.ink} strokeWidth={4} fill="none" strokeLinecap="round" />;
}

function Mouth({ mood }: { mood: Mood }) {
  if (mood === 'worried') return <Path d="M50 92q10-7 20 0" stroke={C.ink} strokeWidth={4} fill="none" strokeLinecap="round" />;
  if (mood === 'neutral' || mood === 'sleep' || mood === 'shy')
    return <Path d="M52 89q8 5 16 0" stroke={C.ink} strokeWidth={4} fill="none" strokeLinecap="round" />;
  return (
    <>
      <Path d="M45 87q15 20 30 0z" fill={C.ink} />
      <Path d="M51 94q9 6 18 0q-9-4-18 0z" fill={C.blush} />
    </>
  );
}

export function Pila({ size = 40, mood = 'happy' }: { size?: number; mood?: Mood }) {
  const blush = mood === 'shy' ? 0.85 : 0.5;
  return (
    <Svg width={size} height={size} viewBox="0 -4 120 124" accessibilityLabel="Pila, o porquinho do Finora">
      <Rect x={34} y={90} width={17} height={19} rx={7} fill={C.ear} />
      <Rect x={69} y={90} width={17} height={19} rx={7} fill={C.ear} />
      <Path d="M26 42Q19 26 25 19Q31 14 52 30z" fill={C.ear} />
      <Path d="M94 42Q101 26 95 19Q89 14 68 30z" fill={C.ear} />
      <Ellipse cx={60} cy={63} rx={42} ry={39} fill={C.body} />
      <Ellipse cx={44} cy={40} rx={15} ry={8} fill={C.light} opacity={0.55} transform="rotate(-18 44 40)" />
      <Rect x={49} y={27} width={22} height={5} rx={2.5} fill={C.line} />
      <Ellipse cx={30} cy={74} rx={7} ry={4.5} fill={C.blush} opacity={blush} />
      <Ellipse cx={90} cy={74} rx={7} ry={4.5} fill={C.blush} opacity={blush} />
      <Eyes mood={mood} />
      <Ellipse cx={60} cy={73} rx={15} ry={11} fill={C.light} />
      <Ellipse cx={54.5} cy={73} rx={2.6} ry={3.8} fill={C.line} />
      <Ellipse cx={65.5} cy={73} rx={2.6} ry={3.8} fill={C.line} />
      <Mouth mood={mood} />
      {mood === 'celebrate' && (
        <Path d="M14 30l3-7l3 7l7 3l-7 3l-3 7l-3-7l-7-3zM100 12l2-5l2 5l5 2l-5 2l-2 5l-2-5l-5-2z" fill={C.coin} />
      )}
      {mood === 'sleep' && <Path d="M92 18h10l-10 10h10" stroke={C.line} strokeWidth={3} fill="none" strokeLinecap="round" strokeLinejoin="round" />}
    </Svg>
  );
}
