// Formato das respostas da API do Finora (Finora/backend/app/api/routes). Decimais chegam como
// número ou texto ("123.45"); a conversão para centavos fica em api/client.ts (cents).

type Num = number | string;

export type CycleOut = { key: string; start: string; end: string; is_current: boolean; start_day: number | null };

export type SummaryOut = {
  cycle: CycleOut;
  income: Num;
  expense: Num;
  liquid_balance: Num;
  card_debt: Num;
  available_now: Num;
  invested: Num;
  next_bill_due: string | null;
  next_bill_amount: Num | null;
  flow: { ended_with: Num; started_with: Num };
};

export type ForecastOut = {
  cycle: CycleOut;
  days_left: number;
  available_now: Num;
  income_left: Num;
  savings: { goal: Num; saved: Num; left: Num };
  fixed_left: Num;
  installments_left: Num;
  spendable: Num;
  daily_allowance: Num | null;
};

export type CategoryOut = { id: number; key: string | null; name: string; kind: 'EXPENSE' | 'INCOME' | 'TRANSFER' };

export type CategorySpendOut = { category_id: number | null; category_name: string; spent: Num; budget: Num | null };

export type TransactionOut = {
  id: number;
  date: string;
  amount: Num;
  description: string;
  merchant: string | null;
  account_id: number;
  account_name: string;
  category_id: number | null;
  category_name: string | null;
  category_kind: CategoryOut['kind'] | null;
  status: 'POSTED' | 'PENDING';
  user_categorized: boolean;
  source: 'PLUGGY' | 'OFX' | 'CSV' | 'MANUAL';
};

export type TransactionPage = { items: TransactionOut[]; total: number; income: Num; expense: Num };

export type PotOut = { id: number; name: string; goal_amount: Num | null; balance: Num; applied: Num; earned: Num; investments: number };

export type AccountOut = {
  id: number;
  connection_id: number | null;
  name: string;
  type: 'CHECKING' | 'SAVINGS' | 'CREDIT_CARD' | 'INVESTMENT' | 'LOAN' | 'OTHER';
  balance: Num;
  credit_limit: Num | null;
  closing_day: number | null;
  last_transaction_date: string | null;
  bank: string | null;
};

export type ConnectionOut = {
  id: number;
  institution_name: string;
  institution_logo_url: string | null;
  status: string;
  last_synced_at: string | null;
  last_sync_error: string | null;
  accounts: AccountOut[];
};

export type SyncStatus = {
  running: boolean;
  last_started_at: string | null;
  last_finished_at: string | null;
  last_error: string | null;
  last_result: { created: number; updated: number; deleted: number; errors: string[] } | null;
};

export type MeOut = { id: number; email: string; username: string | null; mascot: string };

export type PairOut = { token: string; device: { id: number; name: string }; email: string };

export type WishItemOut = {
  id: number;
  name: string;
  url: string | null;
  price: Num;
  store: string | null;
  image_url: string | null;
  priority: number;
  status: 'WANTED' | 'BOUGHT' | 'DROPPED';
  first_price: Num;
  lowest_price: Num;
  saved: Num;
};

export type WishlistOut = { items: WishItemOut[]; total: Num; count: number };

export type Verdict = 'cabe' | 'aperta' | 'nao_cabe';
export type AffordabilityOut = {
  items: Record<string, { veredito: Verdict; titulo: string; motivo: string; recomendacao: string | null }>;
};

export type PreviewOut = { url: string; name: string | null; price: Num | null; image_url: string | null; store: string | null };

export type NeedCard = {
  id: number;
  date: string;
  label: string;
  amount: number;
  category_name: string | null;
  category_key: string | null;
  need: boolean | null;
};

export type NeedsSummary = { need: number; want: number; open: number; want_share: number | null; count: number; open_count: number; half_want: number };

export type AssistantStatus = { ollama: boolean; active_model: string | null };
