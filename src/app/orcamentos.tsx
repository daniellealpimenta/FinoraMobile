// Orçamentos do ciclo: barra por categoria com forma + cor (● ok, ▲ perto, ■ estourou).
import { router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { View } from 'react-native';

import { CategoryIcon } from '@/components/category-icon';
import { Pila } from '@/components/pila';
import { Bar, Card, Divider, IconButton, Pill, Row, Screen, T } from '@/components/ui';
import { category } from '@/domain/categories';
import { cycleName } from '@/domain/cycle';
import { budgetStatus } from '@/domain/forecast';
import { budgetNote } from '@/domain/pila';
import { money } from '@/lib/format';
import { useFinance } from '@/state/finance';
import { usePrefs } from '@/state/prefs';
import { useTheme } from '@/theme/tokens';

export default function Orcamentos() {
  const { c } = useTheme();
  const { budgets, cycle } = useFinance();
  const { hidden } = usePrefs();
  const note = budgetNote(budgets);

  const STATUS = {
    ok: { shape: '●', label: 'ok', color: c.positive },
    near: { shape: '▲', label: 'perto do limite', color: c.warning },
    over: { shape: '■', label: 'estourou', color: c.negative },
  } as const;

  return (
    <Screen tabs={false}>
      <Row style={{ marginLeft: -10 }} gap={0}>
        <IconButton label="Voltar" onPress={() => router.back()}>
          <ChevronLeft size={24} color={c.fg} />
        </IconButton>
        <T v="title">Voltar</T>
      </Row>
      <T v="page">Orçamentos</T>
      <T v="label" style={{ marginTop: -10 }}>
        Limite por categoria no {cycleName(cycle).toLowerCase()}
      </T>

      <Row style={{ alignItems: 'flex-end' }}>
        <Pila size={42} mood={note.mood} />
        <View style={{ flex: 1, backgroundColor: c.surface, borderColor: c.cardEdge, borderWidth: 1, borderRadius: 16, borderBottomLeftRadius: 6, padding: 12 }}>
          <T style={{ fontSize: 14, lineHeight: 20 }}>{hidden ? 'Os valores estão escondidos.' : note.text}</T>
        </View>
      </Row>

      <Card style={{ paddingVertical: 4, paddingHorizontal: 16 }}>
        {budgets.map((b, i) => {
          const st = STATUS[budgetStatus(b.spentCents, b.limitCents)];
          const overBy = b.spentCents - b.limitCents;
          return (
            <View key={b.categoryKey}>
              {i > 0 && <Divider />}
              <View style={{ paddingVertical: 12, gap: 8 }}>
                <Row>
                  <CategoryIcon categoryKey={b.categoryKey} small />
                  <T v="title" style={{ flex: 1, fontSize: 14 }}>
                    {category(b.categoryKey).name}
                  </T>
                  <Pill color={st.color}>
                    {st.shape} {st.label}
                  </Pill>
                </Row>
                <Bar value={b.spentCents / b.limitCents} color={st.color} />
                <Row>
                  <T v="label" style={{ flex: 1 }}>
                    {money(b.spentCents, { hidden })} de {money(b.limitCents, { cents: false, hidden })}
                  </T>
                  <T v="label">{overBy > 0 ? `${money(overBy, { hidden })} acima` : `sobram ${money(-overBy, { hidden })}`}</T>
                </Row>
              </View>
            </View>
          );
        })}
        {!budgets.length && (
          <T muted style={{ paddingVertical: 16 }}>
            Nenhum orçamento neste ciclo.
          </T>
        )}
      </Card>
    </Screen>
  );
}
