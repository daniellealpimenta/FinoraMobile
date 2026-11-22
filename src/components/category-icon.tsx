// Selo da categoria: fundo tingido + ícone Lucide na cor da família (MASTER.md, "CategoryIcon").
import {
  ArrowDownLeft,
  ArrowLeftRight,
  Bike,
  BriefcaseBusiness,
  Bus,
  Car,
  CarTaxiFront,
  CircleDashed,
  CirclePlus,
  CreditCard,
  Dices,
  Dumbbell,
  Fuel,
  GraduationCap,
  HandHeart,
  House,
  Lightbulb,
  type LucideIcon,
  PawPrint,
  Percent,
  PiggyBank,
  Pill,
  Plane,
  Receipt,
  Send,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Stethoscope,
  Tag,
  Ticket,
  TrendingUp,
  Tv,
  UtensilsCrossed,
  Wifi,
} from 'lucide-react-native';
import { View } from 'react-native';

import { category, type IconName } from '@/domain/categories';
import { RADIUS, useTheme } from '@/theme/tokens';

const ICONS: Record<IconName, LucideIcon> = {
  ArrowDownLeft,
  ArrowLeftRight,
  Bike,
  BriefcaseBusiness,
  Bus,
  Car,
  CarTaxiFront,
  CircleDashed,
  CirclePlus,
  CreditCard,
  Dices,
  Dumbbell,
  Fuel,
  GraduationCap,
  HandHeart,
  House,
  Lightbulb,
  PawPrint,
  Percent,
  PiggyBank,
  Pill,
  Plane,
  Receipt,
  Send,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Stethoscope,
  Tag,
  Ticket,
  TrendingUp,
  Tv,
  UtensilsCrossed,
  Wifi,
};

export function useCategoryColor(key: string | null | undefined) {
  const { c } = useTheme();
  return c.cat[category(key).family];
}

export function CategoryGlyph({ categoryKey, size = 18, color }: { categoryKey: string | null; size?: number; color?: string }) {
  const tone = useCategoryColor(categoryKey);
  const Icon = ICONS[category(categoryKey).icon];
  return <Icon size={size} color={color ?? tone} strokeWidth={2.2} />;
}

export function CategoryIcon({ categoryKey, small }: { categoryKey: string | null; small?: boolean }) {
  const { tint } = useTheme();
  const tone = useCategoryColor(categoryKey);
  const box = small ? 30 : 36;
  return (
    <View style={{ width: box, height: box, borderRadius: RADIUS.chip, backgroundColor: tint(tone), alignItems: 'center', justifyContent: 'center' }}>
      <CategoryGlyph categoryKey={categoryKey} size={small ? 16 : 18} />
    </View>
  );
}
