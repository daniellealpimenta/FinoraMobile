// Parear com o Finora do computador. Três jeitos:
//  - ler o QR do Perfil do Finora (endereço na Tailscale + código de 6 dígitos);
//  - digitar o endereço e o código;
//  - entrar com e-mail e senha (e o código de 2FA, se tiver) e trocar por um token de aparelho.
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Device from 'expo-device';
import { router } from 'expo-router';
import { Camera, ChevronLeft, Keyboard, KeyRound } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ApiError, createApi } from '@/api/client';
import type { PairOut } from '@/api/types';
import { Pila } from '@/components/pila';
import { Card, IconButton, Row, Segmented, T } from '@/components/ui';
import { parsePairLink } from '@/lib/pair';
import { useSession } from '@/state/session';
import { FONT, RADIUS, useTheme } from '@/theme/tokens';

type Way = 'qr' | 'code' | 'login';

const deviceName = () => (Device.deviceName || Device.modelName || 'Celular').slice(0, 80);
const errorText = (e: unknown) => (e instanceof Error ? e.message : String(e));

export default function Conectar() {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const { connect } = useSession();
  const [way, setWay] = useState<Way>('qr');
  const [url, setUrl] = useState('');
  const [code, setCode] = useState('');
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [totp, setTotp] = useState('');
  const [needTotp, setNeedTotp] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pair(serverUrl: string, pairCode: string) {
    setBusy(true);
    setError(null);
    try {
      const result = await createApi(serverUrl).post<PairOut>('/devices/pair', { code: pairCode, name: deviceName() });
      await connect(serverUrl, result);
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  }

  async function signIn() {
    setBusy(true);
    setError(null);
    try {
      const api = createApi(url);
      const { access_token } = await api.post<{ access_token: string }>('/auth/login', {
        login: login.trim(),
        password,
        totp_code: needTotp ? totp.trim() : null,
      });
      const result = await createApi(url, access_token).post<PairOut>('/devices', { name: deviceName() });
      await connect(url, result);
    } catch (e) {
      if (e instanceof ApiError && e.message === 'TOTP_REQUIRED') {
        setNeedTotp(true);
        setError('Digite o código do app autenticador.');
      } else setError(errorText(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: c.bg }}>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 4, paddingBottom: insets.bottom + 24, paddingHorizontal: 16, gap: 14 }}
        keyboardShouldPersistTaps="handled">
        <Row style={{ marginLeft: -10 }} gap={0}>
          <IconButton label="Voltar" onPress={() => router.back()}>
            <ChevronLeft size={24} color={c.fg} />
          </IconButton>
          <T v="title">Voltar</T>
        </Row>
        <T v="page">Conectar ao meu Finora</T>
        <Card style={{ gap: 6 }}>
          <T v="title">No computador</T>
          <T muted style={{ fontSize: 14, lineHeight: 20 }}>
            1. Instale a Tailscale no computador e neste celular, com a mesma conta.{'\n'}
            2. No Finora do computador, abra Perfil → Celular e ligue o acesso.{'\n'}
            3. Toque em &quot;Parear um celular&quot; e leia o QR aqui.
          </T>
        </Card>

        <Segmented
          full
          options={[
            ['qr', 'Ler QR'],
            ['code', 'Digitar código'],
            ['login', 'E-mail e senha'],
          ]}
          value={way}
          onChange={(w) => {
            setWay(w);
            setError(null);
          }}
        />

        {way === 'qr' && <Scanner busy={busy} onCode={(u, k) => pair(u, k)} onInvalid={() => setError('Esse QR não é do Finora. Abra Perfil → Celular no computador.')} />}

        {way === 'code' && (
          <View style={{ gap: 10 }}>
            <Field icon={<Keyboard size={18} color={c.muted} />} value={url} onChange={setUrl} placeholder="Endereço (ex.: 100.101.1.2:8765)" keyboard="url" />
            <Field
              icon={<KeyRound size={18} color={c.muted} />}
              value={code}
              onChange={(v) => setCode(v.replace(/\D/g, '').slice(0, 6))}
              placeholder="Código de 6 dígitos"
              keyboard="number-pad"
              big
            />
            <Primary label="Conectar" busy={busy} disabled={!url || code.length !== 6} onPress={() => pair(url, code)} />
          </View>
        )}

        {way === 'login' && (
          <View style={{ gap: 10 }}>
            <Field icon={<Keyboard size={18} color={c.muted} />} value={url} onChange={setUrl} placeholder="Endereço (ex.: 100.101.1.2:8765)" keyboard="url" />
            <Field value={login} onChange={setLogin} placeholder="E-mail ou nome de usuário" keyboard="email-address" />
            <Field value={password} onChange={setPassword} placeholder="Senha" secure />
            {needTotp && (
              <Field value={totp} onChange={(v) => setTotp(v.replace(/\D/g, '').slice(0, 6))} placeholder="Código de 2 etapas" keyboard="number-pad" big />
            )}
            <Primary label="Entrar" busy={busy} disabled={!url || !login || !password} onPress={signIn} />
            <T v="label" style={{ textAlign: 'center' }}>
              A senha só é usada agora: este celular recebe um acesso próprio, que dá para desconectar pelo computador.
            </T>
          </View>
        )}

        {error && (
          <Row style={{ alignItems: 'flex-start' }}>
            <Pila size={40} mood="worried" />
            <View style={[s.bubble, { backgroundColor: c.surface, borderColor: c.cardEdge }]}>
              <T style={{ fontSize: 14, lineHeight: 20 }}>{error}</T>
            </View>
          </Row>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Scanner({ busy, onCode, onInvalid }: { busy: boolean; onCode: (url: string, code: string) => void; onInvalid: () => void }) {
  const { c } = useTheme();
  const [permission, request] = useCameraPermissions();
  const handled = useRef<string | null>(null);

  if (!permission) return <ActivityIndicator color={c.accent} />;
  if (!permission.granted)
    return (
      <Card style={{ alignItems: 'center', gap: 10 }}>
        <Camera size={28} color={c.accent} />
        <T muted style={{ textAlign: 'center' }}>
          O Finora precisa da câmera só para ler o QR do pareamento.
        </T>
        <Primary label="Permitir câmera" onPress={request} />
      </Card>
    );

  return (
    <View style={[s.camera, { borderColor: c.accent }]}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={
          busy
            ? undefined
            : ({ data }) => {
                if (handled.current === data) return;
                handled.current = data;
                const parsed = parsePairLink(data);
                if (parsed) onCode(parsed.url, parsed.code);
                else onInvalid();
              }
        }
      />
      {busy && (
        <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.45)' }]}>
          <ActivityIndicator color="#fff" size="large" />
        </View>
      )}
    </View>
  );
}

function Field({
  value,
  onChange,
  placeholder,
  keyboard = 'default',
  secure,
  icon,
  big,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  keyboard?: 'default' | 'url' | 'number-pad' | 'email-address';
  secure?: boolean;
  icon?: React.ReactNode;
  big?: boolean;
}) {
  const { c } = useTheme();
  return (
    <View style={[s.field, { backgroundColor: c.surface, borderColor: c.border }]}>
      {icon}
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={c.muted}
        keyboardType={keyboard}
        secureTextEntry={secure}
        autoCapitalize="none"
        autoCorrect={false}
        style={{ flex: 1, color: c.fg, fontFamily: big ? FONT.displaySemi : FONT.regular, fontSize: big ? 22 : 15, letterSpacing: big ? 4 : 0 }}
      />
    </View>
  );
}

function Primary({ label, onPress, busy, disabled }: { label: string; onPress: () => void; busy?: boolean; disabled?: boolean }) {
  const { c } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || busy}
      accessibilityRole="button"
      style={({ pressed }) => [s.primary, { backgroundColor: c.accent, opacity: disabled ? 0.4 : pressed ? 0.85 : 1 }]}>
      {busy ? <ActivityIndicator color={c.accentFg} /> : <T v="strong" color={c.accentFg}>{label}</T>}
    </Pressable>
  );
}

const s = StyleSheet.create({
  camera: { height: 300, borderRadius: RADIUS.card + 4, overflow: 'hidden', borderWidth: 3 },
  field: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 52, borderRadius: 14, borderWidth: 1, paddingHorizontal: 14 },
  primary: { minHeight: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  bubble: { flex: 1, borderWidth: 1, borderRadius: 16, borderTopLeftRadius: 6, paddingVertical: 10, paddingHorizontal: 14 },
});
