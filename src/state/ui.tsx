// Estado de interface que atravessa as abas: as três folhas, o aviso do Pila e o bloqueio.
import { createContext, type ReactNode, use, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, StyleSheet, View } from 'react-native';
import Animated, { FadeOutDown, ZoomIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LockScreen } from '@/components/lock-screen';
import { Pila } from '@/components/pila';
import { AddSheet } from '@/components/sheets/add-sheet';
import { EditSheet } from '@/components/sheets/edit-sheet';
import { SaveSheet } from '@/components/sheets/save-sheet';
import { T } from '@/components/ui';
import type { Mood } from '@/domain/pila';
import { FONT, useTheme } from '@/theme/tokens';

import { getPrefs, usePrefs } from './prefs';

type UI = {
  openAdd: () => void;
  openEdit: (txId: number) => void;
  openSave: (potId: number) => void;
  toast: (text: string, mood?: Mood) => void;
  lock: () => void;
};

const Ctx = createContext<UI | null>(null);

export function UIProvider({ children }: { children: ReactNode }) {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const [add, setAdd] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [potId, setPotId] = useState<number | null>(null);
  // Bloqueia ao abrir (se a opção estiver ligada), mas nunca na tela de entrada
  const [locked, setLocked] = useState(() => getPrefs().lockOnOpen && getPrefs().mode !== null);
  const { mode } = usePrefs();
  const [msg, setMsg] = useState<{ id: number; text: string; mood: Mood } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // "Pedir Face ID ao abrir" vale também ao voltar para o app, não só ao abrir do zero.
  // Só em "background": o aviso do Face ID e a central de controle deixam o app "inactive"
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => {
      const p = getPrefs();
      if (s === 'background' && p.lockOnOpen && p.mode !== null) setLocked(true);
    });
    return () => sub.remove();
  }, []);

  const toast = useCallback((text: string, mood: Mood = 'happy') => {
    clearTimeout(timer.current);
    // Espera a folha fechar antes de mostrar
    setTimeout(() => setMsg({ id: Date.now(), text, mood }), 250);
    timer.current = setTimeout(() => setMsg(null), 3600);
  }, []);

  const value = useMemo<UI>(
    () => ({
      openAdd: () => setAdd(true),
      openEdit: setEditId,
      openSave: setPotId,
      toast,
      lock: () => setLocked(true),
    }),
    [toast],
  );

  return (
    <Ctx value={value}>
      {children}
      {msg && (
        <Animated.View
          key={msg.id}
          entering={ZoomIn.springify().damping(14)}
          exiting={FadeOutDown.duration(200)}
          accessibilityLiveRegion="polite"
          style={[s.toast, { backgroundColor: c.toastBg, bottom: Math.max(insets.bottom, 10) + 78 }]}>
          <View style={{ marginLeft: -2 }}>
            <Pila size={36} mood={msg.mood} />
          </View>
          <T color={c.toastFg} style={{ flex: 1, fontFamily: FONT.semi, fontSize: 13, lineHeight: 18 }}>
            {msg.text}
          </T>
        </Animated.View>
      )}
      <AddSheet visible={add} onClose={() => setAdd(false)} toast={toast} />
      <EditSheet id={editId} onClose={() => setEditId(null)} toast={toast} />
      <SaveSheet potId={potId} onClose={() => setPotId(null)} toast={toast} />
      {locked && mode !== null && <LockScreen onUnlock={() => setLocked(false)} />}
    </Ctx>
  );
}

export function useUI() {
  const v = use(Ctx);
  if (!v) throw new Error('useUI fora do UIProvider');
  return v;
}

const s = StyleSheet.create({
  toast: { position: 'absolute', left: 12, right: 12, flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 18, paddingVertical: 8, paddingRight: 14, paddingLeft: 8 },
});
