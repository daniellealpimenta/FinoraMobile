// Catálogo de categorias do Finora (Finora/backend/app/services/categories.py e MASTER.md):
// mesma chave e mesmo nome do backend. A família define a cor; o ícone é um nome Lucide
// (ver components/category-icon.tsx).

export type Family = 'home' | 'food' | 'move' | 'care' | 'fun' | 'shop' | 'fin' | 'income' | 'transfer';
export type CategoryKind = 'EXPENSE' | 'INCOME' | 'TRANSFER';
export type IconName =
  | 'House'
  | 'Lightbulb'
  | 'Wifi'
  | 'ShoppingCart'
  | 'UtensilsCrossed'
  | 'Bike'
  | 'Bus'
  | 'CarTaxiFront'
  | 'Fuel'
  | 'Car'
  | 'Plane'
  | 'Stethoscope'
  | 'Pill'
  | 'Dumbbell'
  | 'Ticket'
  | 'Tv'
  | 'GraduationCap'
  | 'Dices'
  | 'ShoppingBag'
  | 'PawPrint'
  | 'HandHeart'
  | 'Receipt'
  | 'Percent'
  | 'ShieldCheck'
  | 'Send'
  | 'CircleDashed'
  | 'BriefcaseBusiness'
  | 'Sparkles'
  | 'TrendingUp'
  | 'ArrowDownLeft'
  | 'CirclePlus'
  | 'ArrowLeftRight'
  | 'CreditCard'
  | 'PiggyBank'
  | 'Tag';

export type Category = { key: string; name: string; kind: CategoryKind; family: Family; icon: IconName };

const E = 'EXPENSE' as const;
const I = 'INCOME' as const;
const T = 'TRANSFER' as const;

export const CATEGORIES: Category[] = [
  // Despesas, na ordem em que aparecem para escolher (as mais usadas primeiro)
  { key: 'delivery', name: 'Delivery', kind: E, family: 'food', icon: 'Bike' },
  { key: 'groceries', name: 'Supermercado', kind: E, family: 'food', icon: 'ShoppingCart' },
  { key: 'eating_out', name: 'Restaurantes e bares', kind: E, family: 'food', icon: 'UtensilsCrossed' },
  { key: 'ride_hailing', name: 'Táxi e apps', kind: E, family: 'move', icon: 'CarTaxiFront' },
  { key: 'fuel', name: 'Combustível', kind: E, family: 'move', icon: 'Fuel' },
  { key: 'transport', name: 'Transporte', kind: E, family: 'move', icon: 'Bus' },
  { key: 'pharmacy', name: 'Farmácia', kind: E, family: 'care', icon: 'Pill' },
  { key: 'subscriptions', name: 'Assinaturas e streaming', kind: E, family: 'fun', icon: 'Tv' },
  { key: 'leisure', name: 'Lazer', kind: E, family: 'fun', icon: 'Ticket' },
  { key: 'shopping', name: 'Compras', kind: E, family: 'shop', icon: 'ShoppingBag' },
  { key: 'housing', name: 'Moradia', kind: E, family: 'home', icon: 'House' },
  { key: 'utilities', name: 'Contas da casa', kind: E, family: 'home', icon: 'Lightbulb' },
  { key: 'telecom', name: 'Internet e celular', kind: E, family: 'home', icon: 'Wifi' },
  { key: 'vehicle', name: 'Veículo', kind: E, family: 'move', icon: 'Car' },
  { key: 'travel', name: 'Viagens', kind: E, family: 'move', icon: 'Plane' },
  { key: 'health', name: 'Saúde', kind: E, family: 'care', icon: 'Stethoscope' },
  { key: 'fitness', name: 'Academia e bem-estar', kind: E, family: 'care', icon: 'Dumbbell' },
  { key: 'education', name: 'Educação', kind: E, family: 'fun', icon: 'GraduationCap' },
  { key: 'gambling', name: 'Apostas', kind: E, family: 'fun', icon: 'Dices' },
  { key: 'pets', name: 'Pets', kind: E, family: 'shop', icon: 'PawPrint' },
  { key: 'donations', name: 'Doações', kind: E, family: 'shop', icon: 'HandHeart' },
  { key: 'taxes_fees', name: 'Impostos e tarifas', kind: E, family: 'fin', icon: 'Receipt' },
  { key: 'debt', name: 'Juros e empréstimos', kind: E, family: 'fin', icon: 'Percent' },
  { key: 'insurance', name: 'Seguros', kind: E, family: 'fin', icon: 'ShieldCheck' },
  { key: 'transfers_out', name: 'Pix e transferências enviadas', kind: E, family: 'fin', icon: 'Send' },
  { key: 'other', name: 'Outros', kind: E, family: 'fin', icon: 'CircleDashed' },
  // Receitas
  { key: 'salary', name: 'Salário', kind: I, family: 'income', icon: 'BriefcaseBusiness' },
  { key: 'transfers_in', name: 'Transferências recebidas', kind: I, family: 'income', icon: 'ArrowDownLeft' },
  { key: 'extra_income', name: 'Renda extra', kind: I, family: 'income', icon: 'Sparkles' },
  { key: 'investment_income', name: 'Rendimentos', kind: I, family: 'income', icon: 'TrendingUp' },
  { key: 'other_income', name: 'Outras receitas', kind: I, family: 'income', icon: 'CirclePlus' },
  // Movimentações (nem gasto nem receita)
  { key: 'own_transfer', name: 'Transferência entre contas', kind: T, family: 'transfer', icon: 'ArrowLeftRight' },
  { key: 'card_payment', name: 'Pagamento de fatura', kind: T, family: 'transfer', icon: 'CreditCard' },
  { key: 'investments', name: 'Investimentos', kind: T, family: 'transfer', icon: 'PiggyBank' },
];

export const CATEGORY: Record<string, Category> = Object.fromEntries(CATEGORIES.map((c) => [c.key, c]));
export const EXPENSE_KEYS = CATEGORIES.filter((c) => c.kind === 'EXPENSE').map((c) => c.key);
export const INCOME_KEYS = CATEGORIES.filter((c) => c.kind === 'INCOME').map((c) => c.key);
/** As da faixa de chips do "Lançar": as do dia a dia */
export const QUICK_EXPENSE_KEYS = EXPENSE_KEYS.slice(0, 10);

const UNCATEGORIZED: Category = { key: 'uncategorized', name: 'Sem categoria', kind: 'EXPENSE', family: 'transfer', icon: 'Tag' };

export const category = (key: string | null | undefined): Category => (key && CATEGORY[key]) || UNCATEGORIZED;
