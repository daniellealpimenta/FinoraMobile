// Folha que sobe de baixo (novo lançamento, trocar categoria, guardar).
// Modal + Reanimated, sem biblioteca extra: funciona no Expo Go de qualquer SDK.
import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RADIUS, useTheme } from '@/theme/tokens';

export function Sheet({ visible, onClose, children, label }: { visible: boolean; onClose: () => void; children: ReactNode; label: string }) {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent navigationBarTranslucent>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <Animated.View entering={FadeIn.duration(180)} style={[StyleSheet.absoluteFill, { backgroundColor: c.veil }]}>
          <Pressable style={{ flex: 1 }} onPress={onClose} accessibilityLabel="Fechar" />
        </Animated.View>
        <View style={{ flex: 1 }} pointerEvents="box-none" />
        <Animated.View
          entering={SlideInDown.duration(300)}
          accessibilityViewIsModal
          accessibilityLabel={label}
          style={[s.sheet, { backgroundColor: c.surface, paddingBottom: insets.bottom + 18, maxHeight: '92%' }]}>
          <View style={[s.grab, { backgroundColor: c.border }]} />
          <ScrollView bounces={false} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {children}
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const s = StyleSheet.create({
  sheet: { borderTopLeftRadius: RADIUS.sheet, borderTopRightRadius: RADIUS.sheet, paddingHorizontal: 18, paddingTop: 10 },
  grab: { width: 40, height: 5, borderRadius: 5, alignSelf: 'center', marginBottom: 12 },
});
