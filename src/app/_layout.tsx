import { BricolageGrotesque_400Regular, BricolageGrotesque_600SemiBold, BricolageGrotesque_700Bold } from '@expo-google-fonts/bricolage-grotesque';
import { Manrope_400Regular, Manrope_500Medium, Manrope_600SemiBold, Manrope_700Bold, useFonts } from '@expo-google-fonts/manrope';
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { View } from 'react-native';

import { Pila } from '@/components/pila';
import { T } from '@/components/ui';
import { db } from '@/db/client';
import { seedIfEmpty } from '@/db/repo';
import { FinanceProvider } from '@/state/finance';
import { UIProvider } from '@/state/ui';
import { useTheme } from '@/theme/tokens';

import migrations from '../../drizzle/migrations';

SplashScreen.preventAutoHideAsync();

let seededOnce = false;
function ensureSeeded() {
  if (!seededOnce) {
    seedIfEmpty();
    seededOnce = true;
  }
  return true;
}

export default function RootLayout() {
  const { c, dark } = useTheme();
  const [fontsLoaded] = useFonts({
    BricolageGrotesque_400Regular,
    BricolageGrotesque_600SemiBold,
    BricolageGrotesque_700Bold,
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
  });
  // Cria/atualiza as tabelas no aparelho (drizzle/), como a migração do SwiftData
  const { success, error } = useMigrations(db, migrations);
  // Com as tabelas prontas, grava o mês de exemplo no primeiro uso (uma vez só)
  const seeded = success && ensureSeeded();

  const ready = fontsLoaded && seeded;
  useEffect(() => {
    if (ready || error) SplashScreen.hideAsync();
  }, [ready, error]);

  if (error)
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24, backgroundColor: c.bg }}>
        <Pila size={80} mood="worried" />
        <T v="title">Não deu para abrir o banco de dados</T>
        <T muted style={{ textAlign: 'center' }}>
          {error.message}
        </T>
      </View>
    );
  if (!ready) return null;

  const base = dark ? DarkTheme : DefaultTheme;
  return (
    <ThemeProvider value={{ ...base, colors: { ...base.colors, background: c.bg, card: c.surface, primary: c.accent, text: c.fg, border: c.border } }}>
      <FinanceProvider>
        <UIProvider>
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.bg } }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="orcamentos" />
            <Stack.Screen name="pila" />
          </Stack>
          <StatusBar style={dark ? 'light' : 'dark'} />
        </UIProvider>
      </FinanceProvider>
    </ThemeProvider>
  );
}
