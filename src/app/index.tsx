// Raiz: sem modo escolhido vai para a entrada; com modo, para o Início.
import { Redirect } from 'expo-router';

import { usePrefs } from '@/state/prefs';

export default function Index() {
  const { mode } = usePrefs();
  return <Redirect href={mode ? '/inicio' : '/bem-vindo'} />;
}
