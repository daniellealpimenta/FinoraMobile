// Categorias do Finora web (MASTER.md, "Categorias"): a chave é a mesma do backend.
// A família define a cor; o ícone é o nome do componente Lucide (ver components/category-icon.tsx).

export type Family = 'home' | 'food' | 'move' | 'care' | 'fun' | 'shop' | 'fin' | 'income';
export type CategoryKind = 'EXPENSE' | 'INCOME';
export type IconName =
  | 'ShoppingCart'
  | 'Bike'
  | 'UtensilsCrossed'
  | 'CarTaxiFront'
  | 'Fuel'
  | 'Pill'
  | 'Tv'
  | 'Sparkles'
  | 'Gift'
  | 'BriefcaseBusiness'
  | 'ArrowDownLeft';

export type Category = { key: string; name: string; kind: CategoryKind; family: Family; icon: IconName };

export const CATEGORIES: Category[] = [
  { key: 'delivery', name: 'Delivery', kind: 'EXPENSE', family: 'food', icon: 'Bike' },
  { key: 'groceries', name: 'Supermercado', kind: 'EXPENSE', family: 'food', icon: 'ShoppingCart' },
  { key: 'eating_out', name: 'Restaurantes', kind: 'EXPENSE', family: 'food', icon: 'UtensilsCrossed' },
  { key: 'ride_hailing', name: 'Táxi e apps', kind: 'EXPENSE', family: 'move', icon: 'CarTaxiFront' },
  { key: 'fuel', name: 'Combustível', kind: 'EXPENSE', family: 'move', icon: 'Fuel' },
  { key: 'pharmacy', name: 'Farmácia', kind: 'EXPENSE', family: 'care', icon: 'Pill' },
  { key: 'subscriptions', name: 'Assinaturas', kind: 'EXPENSE', family: 'fun', icon: 'Tv' },
  { key: 'leisure', name: 'Lazer', kind: 'EXPENSE', family: 'fun', icon: 'Sparkles' },
  { key: 'shopping', name: 'Compras', kind: 'EXPENSE', family: 'shop', icon: 'Gift' },
  { key: 'salary', name: 'Salário', kind: 'INCOME', family: 'income', icon: 'BriefcaseBusiness' },
  { key: 'transfers_in', name: 'Pix recebido', kind: 'INCOME', family: 'income', icon: 'ArrowDownLeft' },
];

export const CATEGORY: Record<string, Category> = Object.fromEntries(CATEGORIES.map((c) => [c.key, c]));
export const EXPENSE_KEYS = CATEGORIES.filter((c) => c.kind === 'EXPENSE').map((c) => c.key);
export const INCOME_KEYS = CATEGORIES.filter((c) => c.kind === 'INCOME').map((c) => c.key);

export const category = (key: string | null | undefined): Category =>
  (key && CATEGORY[key]) || { key: 'other', name: 'Sem categoria', kind: 'EXPENSE', family: 'fin', icon: 'Sparkles' };
