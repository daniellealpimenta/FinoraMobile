import { Tabs } from 'expo-router/tabs';

import { TabBar } from '@/components/tab-bar';

export default function TabsLayout() {
  return (
    <Tabs tabBar={(props) => <TabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="inicio" />
      <Tabs.Screen name="transacoes" />
      <Tabs.Screen name="cofrinhos" />
      <Tabs.Screen name="mais" />
    </Tabs>
  );
}
