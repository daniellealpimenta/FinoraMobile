// Desejos (modo conectado): a lista do Finora com o "cabe neste ciclo?" calculado no computador
// (services/affordability.py). Adiciona por link (o computador lê nome e preço da loja) ou à mão.
import { router } from 'expo-router';
import { Check, ChevronLeft, Gift, Link, Plus, Trash2 } from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { cents } from '@/api/client';
import type { AffordabilityOut, PreviewOut, Verdict, WishItemOut, WishlistOut } from '@/api/types';
import { Pila } from '@/components/pila';
import { Sheet } from '@/components/sheet';
import { Card, Divider, IconButton, Pill, Row, Screen, Segmented, T } from '@/components/ui';
import { money } from '@/lib/format';
import { usePrefs } from '@/state/prefs';
import { useApi } from '@/state/session';
import { useUI } from '@/state/ui';
import { FONT, RADIUS, useTheme } from '@/theme/tokens';

const errorText = (e: unknown) => (e instanceof Error ? e.message : String(e));

export default function Desejos() {
  const { c, tint } = useTheme();
  const api = useApi();
  const { toast } = useUI();
  const { hidden } = usePrefs();
  const [list, setList] = useState<WishlistOut | null>(null);
  const [fit, setFit] = useState<AffordabilityOut['items']>({});
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    try {
      const [l, a] = await Promise.all([api.get<WishlistOut>('/wishlist'), api.get<AffordabilityOut>('/wishlist/affordability')]);
      setList(l);
      setFit(a.items);
      setError(null);
    } catch (e) {
      setError(errorText(e));
    }
  }, [api]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- busca na API; o setState vem depois do await
    load();
  }, [load]);

  const VERDICT: Record<Verdict, { label: string; color: string }> = {
    cabe: { label: '● cabe neste ciclo', color: c.positive },
    aperta: { label: '▲ aperta', color: c.warning },
    nao_cabe: { label: '■ não cabe', color: c.negative },
  };

  const wanted = (list?.items ?? []).filter((i) => i.status === 'WANTED');

  async function markBought(item: WishItemOut) {
    try {
      await api.patch(`/wishlist/items/${item.id}`, { status: 'BOUGHT' });
      toast(`${item.name} comprado!`, 'celebrate');
      load();
    } catch (e) {
      toast(errorText(e), 'worried');
    }
  }

  function remove(item: WishItemOut) {
    Alert.alert('Tirar da lista?', item.name, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Tirar',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.del(`/wishlist/items/${item.id}`);
            load();
          } catch (e) {
            toast(errorText(e), 'worried');
          }
        },
      },
    ]);
  }

  return (
    <Screen tabs={false} onRefresh={load} refreshing={false}>
      <Row style={{ marginLeft: -10 }} gap={0}>
        <IconButton label="Voltar" onPress={() => router.back()}>
          <ChevronLeft size={24} color={c.fg} />
        </IconButton>
        <T v="title">Voltar</T>
      </Row>
      <Row>
        <T v="page" style={{ flex: 1 }}>
          Desejos
        </T>
        <IconButton label="Adicionar desejo" onPress={() => setAdding(true)} style={{ backgroundColor: c.accent }}>
          <Plus size={22} color={c.accentFg} />
        </IconButton>
      </Row>
      {list && (
        <T v="label" style={{ marginTop: -10 }}>
          {list.count} {list.count === 1 ? 'desejo' : 'desejos'} · {money(cents(list.total), { hidden })} no total
        </T>
      )}

      {error && <T color={c.negative}>{error}</T>}
      {!list && !error && <ActivityIndicator color={c.accent} />}
      {list && wanted.length === 0 && (
        <View style={{ alignItems: 'center', gap: 8, paddingVertical: 24 }}>
          <Pila size={72} mood="sleep" />
          <T muted style={{ textAlign: 'center' }}>
            Nada na lista. Toque no + e cole o link de algo que você quer comprar.
          </T>
        </View>
      )}

      {wanted.length > 0 && (
        <Card style={{ paddingVertical: 4, paddingHorizontal: 14 }}>
          {wanted.map((item, i) => {
            const f = fit[String(item.id)];
            const v = f ? VERDICT[f.veredito] : null;
            const drop = cents(item.first_price) - cents(item.price);
            return (
              <View key={item.id}>
                {i > 0 && <Divider />}
                <View style={{ paddingVertical: 12, gap: 8 }}>
                  <Row gap={12} style={{ alignItems: 'flex-start' }}>
                    {item.image_url ? (
                      <Image source={{ uri: item.image_url }} style={[st.thumb, { backgroundColor: '#fff' }]} resizeMode="contain" />
                    ) : (
                      <View style={[st.thumb, { backgroundColor: tint(c.cat.shop), alignItems: 'center', justifyContent: 'center' }]}>
                        <Gift size={20} color={c.cat.shop} />
                      </View>
                    )}
                    <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                      <T v="title" numberOfLines={2}>
                        {item.name}
                      </T>
                      <T v="label">{item.store ?? 'Sem loja'}</T>
                      {drop > 0 && (
                        <T v="label" color={c.positive}>
                          Caiu {money(drop, { hidden })} desde que entrou na lista
                        </T>
                      )}
                    </View>
                    <T v="value">{money(cents(item.price), { hidden })}</T>
                  </Row>
                  {v && f && (
                    <View style={{ gap: 4 }}>
                      <Pill color={v.color}>{v.label}</Pill>
                      <T v="label" style={{ lineHeight: 17 }}>
                        {f.motivo}
                      </T>
                    </View>
                  )}
                  <Row gap={8}>
                    <Small icon={<Check size={16} color={c.positive} />} label="Comprei" onPress={() => markBought(item)} />
                    <Small icon={<Trash2 size={16} color={c.negative} />} label="Tirar" onPress={() => remove(item)} />
                  </Row>
                </View>
              </View>
            );
          })}
        </Card>
      )}

      <AddWish visible={adding} onClose={() => setAdding(false)} onAdded={load} />
    </Screen>
  );
}

function Small({ icon, label, onPress }: { icon: React.ReactNode; label: string; onPress: () => void }) {
  const { c } = useTheme();
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => [st.small, { backgroundColor: c.surface2, opacity: pressed ? 0.7 : 1 }]}>
      {icon}
      <T style={{ fontFamily: FONT.semi, fontSize: 13 }}>{label}</T>
    </Pressable>
  );
}

function AddWish({ visible, onClose, onAdded }: { visible: boolean; onClose: () => void; onAdded: () => void }) {
  const { c } = useTheme();
  const api = useApi();
  const { toast } = useUI();
  const [how, setHow] = useState<'link' | 'manual'>('link');
  const [url, setUrl] = useState('');
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [preview, setPreview] = useState<PreviewOut | null>(null);
  const [busy, setBusy] = useState(false);

  const close = () => {
    setUrl('');
    setName('');
    setPrice('');
    setPreview(null);
    onClose();
  };

  async function lookUp() {
    setBusy(true);
    try {
      const p = await api.post<PreviewOut>('/wishlist/preview', { url: url.trim() });
      setPreview(p);
      setName(p.name ?? '');
      setPrice(p.price != null ? String(Number(p.price).toFixed(2)).replace('.', ',') : '');
    } catch (e) {
      toast(errorText(e), 'worried');
    } finally {
      setBusy(false);
    }
  }

  async function save() {
    const value = Number(price.replace(/\./g, '').replace(',', '.'));
    if (!name.trim() || !Number.isFinite(value) || value < 0) return;
    setBusy(true);
    try {
      await api.post('/wishlist/items', {
        name: name.trim(),
        price: value.toFixed(2),
        url: how === 'link' && url.trim() ? url.trim() : null,
        store: preview?.store ?? null,
        image_url: preview?.image_url ?? null,
      });
      toast(`${name.trim()} entrou na lista.`, 'happy');
      close();
      onAdded();
    } catch (e) {
      toast(errorText(e), 'worried');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet visible={visible} onClose={close} label="Novo desejo">
      <T v="strong" style={{ fontSize: 17, marginBottom: 10 }}>
        Novo desejo
      </T>
      <Segmented
        full
        options={[
          ['link', 'Colar link'],
          ['manual', 'Digitar'],
        ]}
        value={how}
        onChange={setHow}
      />
      {how === 'link' && (
        <Row style={{ marginTop: 12 }}>
          <View style={[st.field, { flex: 1, backgroundColor: c.surface2 }]}>
            <Link size={16} color={c.muted} />
            <TextInput
              value={url}
              onChangeText={setUrl}
              placeholder="https://loja.com/produto"
              placeholderTextColor={c.muted}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              style={{ flex: 1, fontFamily: FONT.regular, fontSize: 14, color: c.fg }}
            />
          </View>
          <Pressable onPress={lookUp} disabled={!url.trim() || busy} style={[st.go, { backgroundColor: c.accent, opacity: !url.trim() ? 0.4 : 1 }]}>
            {busy ? <ActivityIndicator color={c.accentFg} /> : <T v="strong" color={c.accentFg}>Buscar</T>}
          </Pressable>
        </Row>
      )}
      {(how === 'manual' || preview) && (
        <View style={{ gap: 10, marginTop: 12 }}>
          <View style={[st.field, { backgroundColor: c.surface2 }]}>
            <TextInput value={name} onChangeText={setName} placeholder="O que é" placeholderTextColor={c.muted} style={{ flex: 1, fontFamily: FONT.regular, fontSize: 15, color: c.fg }} />
          </View>
          <View style={[st.field, { backgroundColor: c.surface2 }]}>
            <T style={{ fontFamily: FONT.displaySemi, color: c.accent }}>R$</T>
            <TextInput
              value={price}
              onChangeText={setPrice}
              placeholder="0,00"
              placeholderTextColor={c.muted}
              keyboardType="decimal-pad"
              style={{ flex: 1, fontFamily: FONT.display, fontSize: 22, color: c.fg }}
            />
          </View>
          <Pressable onPress={save} disabled={busy || !name.trim() || !price} style={[st.cta, { backgroundColor: c.accent, opacity: !name.trim() || !price ? 0.4 : 1 }]}>
            {busy ? <ActivityIndicator color={c.accentFg} /> : <T v="strong" color={c.accentFg}>Pôr na lista</T>}
          </Pressable>
        </View>
      )}
    </Sheet>
  );
}

const st = StyleSheet.create({
  thumb: { width: 52, height: 52, borderRadius: RADIUS.control },
  small: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, minHeight: 36, borderRadius: 999 },
  field: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 50, borderRadius: 14, paddingHorizontal: 14 },
  go: { minHeight: 50, paddingHorizontal: 16, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  cta: { minHeight: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
});
