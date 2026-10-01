import type { ShoppingItem } from '../types';
import {
  classifyStoreAisle,
  normalizeAisleText,
  STORE_AISLE_ICONS,
  STORE_AISLE_ORDER,
  type StoreAisleId,
} from './storeAisles';

export type ShoppingFilterMode = 'byRecipe' | 'byCategoryInRecipe' | 'byCategoryMerged';

export interface ShoppingLine {
  key: string;
  ids: string[];
  title: string;
  isBought: boolean;
}

export interface ShoppingSection {
  id: string;
  title: string;
  lines: ShoppingLine[];
}

export interface ShoppingGroupView {
  id: string;
  eyebrow: string;
  title: string;
  icon: string;
  canDelete: boolean;
  sections: ShoppingSection[];
}

export interface ShoppingGroupLabels {
  aisles: Record<StoreAisleId, string>;
  recipe: string;
  privateGroup: string;
  aisle: string;
}

const FRACTIONS: Record<string, number> = {
  '¼': 1 / 4,
  '½': 1 / 2,
  '¾': 3 / 4,
  '⅓': 1 / 3,
  '⅔': 2 / 3,
  '⅛': 1 / 8,
};

const UNIT_FORMS: { canon: string; forms: string[] }[] = [
  { canon: 'kg', forms: ['kg', 'kilogram', 'kilogramy', 'kilogramów', 'kilograma', 'kilograms', 'kilogram'] },
  { canon: 'g', forms: ['g', 'gram', 'gramy', 'gramów', 'grama', 'grams'] },
  { canon: 'ml', forms: ['ml', 'mililitr', 'mililitry', 'mililitrów', 'mililitra'] },
  { canon: 'l', forms: ['l', 'litr', 'litry', 'litrów', 'litra', 'liter', 'litre', 'liters', 'litres'] },
  { canon: 'lyzka', forms: ['łyżka', 'łyżki', 'łyżkę', 'łyżek', 'tablespoon', 'tablespoons', 'tbsp'] },
  { canon: 'lyzeczka', forms: ['łyżeczka', 'łyżeczki', 'łyżeczkę', 'łyżeczek', 'teaspoon', 'teaspoons', 'tsp'] },
  { canon: 'szklanka', forms: ['szklanka', 'szklanki', 'szklankę', 'szklanek'] },
  { canon: 'cup', forms: ['cup', 'cups'] },
  { canon: 'szt', forms: ['szt', 'szt.', 'sztuka', 'sztuki', 'sztukę', 'sztuk'] },
];

const UNIT_LABELS: Record<string, { one: string; few: string; many: string }> = {
  kg: { one: 'kg', few: 'kg', many: 'kg' },
  g: { one: 'g', few: 'g', many: 'g' },
  ml: { one: 'ml', few: 'ml', many: 'ml' },
  l: { one: 'l', few: 'l', many: 'l' },
  lyzka: { one: 'łyżka', few: 'łyżki', many: 'łyżek' },
  lyzeczka: { one: 'łyżeczka', few: 'łyżeczki', many: 'łyżeczek' },
  szklanka: { one: 'szklanka', few: 'szklanki', many: 'szklanek' },
  cup: { one: 'cup', few: 'cups', many: 'cups' },
  szt: { one: 'szt.', few: 'szt.', many: 'szt.' },
};

const UNIT_LOOKUP = new Map<string, string>();
for (const unit of UNIT_FORMS) {
  for (const form of unit.forms) UNIT_LOOKUP.set(normalizeAisleText(form), unit.canon);
}

const PREP_WORDS = new Set([
  'swiezy', 'swieza', 'swieze', 'swiezego', 'swiezo', 'fresh', 'freshly',
  'posiekany', 'posiekana', 'posiekane', 'posiekanego', 'posiekanej', 'posiekanych',
  'chopped', 'diced', 'minced', 'sliced', 'finely', 'thinly', 'roughly',
  'drobno', 'pokrojony', 'pokrojona', 'pokrojone', 'pokrojonego', 'pokrojonych',
  'peeled', 'obrane', 'obrany', 'crushed', 'grated', 'starty', 'startego',
  'large', 'small', 'medium', 'duza', 'duzy', 'duze', 'mala', 'male', 'maly',
  'optional', 'opcjonalnie', 'about', 'okolo', 'taste', 'smaku', 'plus',
  'serving', 'garnish', 'dekoracji', 'kosher', 'koszerna', 'koszernej',
  'unsalted', 'niesolonego', 'salted',
]);

interface ParsedAmount {
  amount: number;
  unit: string | null;
  name: string;
}

function parseQty(raw: string): number | null {
  const text = raw.trim();
  const range = text.split(/\s*[-–—]\s*/);
  if (range.length === 2 && range[0] && range[1]) {
    const left = parseQty(range[0]);
    const right = parseQty(range[1]);
    if (left !== null && right !== null) return Math.max(left, right);
  }
  const mixed = text.match(/^(\d+)\s+(\d+)\s*\/\s*(\d+)$/);
  if (mixed) return Number(mixed[1]) + Number(mixed[2]) / Number(mixed[3]);
  const slash = text.match(/^(\d+)\s*\/\s*(\d+)$/);
  if (slash) {
    const denominator = Number(slash[2]);
    return denominator === 0 ? null : Number(slash[1]) / denominator;
  }
  if (FRACTIONS[text] !== undefined) return FRACTIONS[text];
  const withFraction = text.match(/^(\d+)\s*([¼½¾⅓⅔⅛])$/);
  if (withFraction && FRACTIONS[withFraction[2]] !== undefined) {
    return Number(withFraction[1]) + FRACTIONS[withFraction[2]];
  }
  const numeric = Number(text.replace(',', '.'));
  return Number.isFinite(numeric) ? numeric : null;
}

function parseLeadingAmount(title: string): ParsedAmount | null {
  const rest = title.trim().replace(/^(?:około|okolo|ok\.?|about|approximately|approx\.?)\s+/i, '');
  const match = rest.match(
    /^(\d+(?:[.,]\d+)?(?:\s+\d+\s*\/\s*\d+)?|\d+\s*\/\s*\d+|[¼½¾⅓⅔⅛])(?:\s*[-–—]\s*(\d+(?:[.,]\d+)?|\d+\s*\/\s*\d+|[¼½¾⅓⅔⅛]))?\s+([\s\S]+)$/,
  );
  if (!match) return null;
  const amount = parseQty(match[2] ? `${match[1]}-${match[2]}` : match[1]);
  if (amount === null || amount <= 0) return null;
  let name = match[3].trim();
  let unit: string | null = null;
  const unitMatch = name.match(/^([^\s,;()]+)\s+([\s\S]+)$/);
  if (unitMatch) {
    const canon = UNIT_LOOKUP.get(normalizeAisleText(unitMatch[1])) ?? null;
    if (canon) {
      unit = canon;
      name = unitMatch[2].trim();
    }
  }
  if (!name) return null;
  return { amount, unit, name };
}

function productKey(name: string): string {
  const tokens = normalizeAisleText(name)
    .split(' ')
    .filter((token) => token.length > 2 && !PREP_WORDS.has(token) && !/^\d+$/.test(token));
  if (!tokens.length) return '';
  return tokens.map((token) => (token.length >= 6 ? token.slice(0, 5) : token)).sort().join(' ');
}

function formatAmount(amount: number): string {
  const rounded = Math.round(amount * 100) / 100;
  if (Number.isInteger(rounded)) return String(rounded);
  return String(rounded).replace('.', ',');
}

function unitLabel(canon: string, amount: number): string {
  const labels = UNIT_LABELS[canon];
  if (!labels) return canon;
  if (!Number.isInteger(amount)) return labels.few;
  const value = Math.abs(amount);
  if (value === 1) return labels.one;
  const mod10 = value % 10;
  const mod100 = value % 100;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return labels.few;
  return labels.many;
}

function toShoppingLines(items: ShoppingItem[], merge: boolean): ShoppingLine[] {
  if (!merge) {
    return items.map((item) => ({
      key: item.id,
      ids: [item.id],
      title: item.title,
      isBought: item.isBought,
    }));
  }

  const groups = new Map<string, ShoppingItem[]>();
  const order: string[] = [];
  for (const item of items) {
    const parsed = parseLeadingAmount(item.title);
    const nameKey = parsed ? productKey(parsed.name) : '';
    const key = parsed && nameKey
      ? `sum:${parsed.unit ?? 'count'}:${nameKey}`
      : `raw:${normalizeAisleText(item.title)}`;
    if (!groups.has(key)) {
      groups.set(key, []);
      order.push(key);
    }
    groups.get(key)?.push(item);
  }

  return order.map((key) => {
    const grouped = groups.get(key) ?? [];
    const ids = grouped.map((item) => item.id);
    const isBought = grouped.every((item) => item.isBought);
    if (grouped.length === 1) {
      return { key, ids, title: grouped[0].title, isBought };
    }

    const parsed = grouped.map((item) => parseLeadingAmount(item.title));
    const first = parsed[0];
    const canSum = first && parsed.every((entry) => entry && entry.unit === first.unit && productKey(entry.name) === productKey(first.name));
    if (!canSum || !first) {
      return { key, ids, title: grouped[0].title, isBought };
    }

    const total = parsed.reduce((sum, entry) => sum + (entry?.amount ?? 0), 0);
    const name = parsed.reduce((shortest, entry) => {
      const candidate = entry?.name ?? shortest;
      return candidate.length < shortest.length ? candidate : shortest;
    }, first.name);
    const title = first.unit
      ? `${formatAmount(total)} ${unitLabel(first.unit, total)} ${name}`
      : `${formatAmount(total)} ${name}`;
    return { key, ids, title, isBought };
  });
}

function groupByAisle(items: ShoppingItem[]): Map<StoreAisleId, ShoppingItem[]> {
  const byAisle = new Map<StoreAisleId, ShoppingItem[]>();
  for (const item of items) {
    const aisle = classifyStoreAisle(item.title);
    const list = byAisle.get(aisle) ?? [];
    list.push(item);
    byAisle.set(aisle, list);
  }
  return byAisle;
}

export function buildShoppingGroups(
  items: ShoppingItem[],
  mode: ShoppingFilterMode,
  labels: ShoppingGroupLabels,
): ShoppingGroupView[] {
  if (mode === 'byCategoryMerged') {
    const byAisle = groupByAisle(items);
    return STORE_AISLE_ORDER.filter((aisle) => byAisle.has(aisle)).map((aisle) => ({
      id: aisle,
      eyebrow: labels.aisle,
      title: labels.aisles[aisle],
      icon: STORE_AISLE_ICONS[aisle],
      canDelete: false,
      sections: [{
        id: `${aisle}-items`,
        title: '',
        lines: toShoppingLines(byAisle.get(aisle) ?? [], true),
      }],
    }));
  }

  const groups: { id: string; items: ShoppingItem[] }[] = [];
  const index = new Map<string, { id: string; items: ShoppingItem[] }>();
  for (const item of items) {
    const id = item.group || 'custom';
    let group = index.get(id);
    if (!group) {
      group = { id, items: [] };
      index.set(id, group);
      groups.push(group);
    }
    group.items.push(item);
  }

  return groups.map((group) => {
    const first = group.items[0];
    const isCustom = group.id === 'custom';
    const base = {
      id: group.id,
      eyebrow: isCustom ? labels.privateGroup : labels.recipe,
      title: first?.groupTitle || labels.privateGroup,
      icon: first?.groupIcon || 'shopping_bag',
      canDelete: true,
    };
    if (mode === 'byRecipe') {
      return {
        ...base,
        sections: [{
          id: `${group.id}-items`,
          title: '',
          lines: toShoppingLines(group.items, false),
        }],
      };
    }

    const byAisle = groupByAisle(group.items);
    return {
      ...base,
      sections: STORE_AISLE_ORDER.filter((aisle) => byAisle.has(aisle)).map((aisle) => ({
        id: `${group.id}-${aisle}`,
        title: labels.aisles[aisle],
        lines: toShoppingLines(byAisle.get(aisle) ?? [], false),
      })),
    };
  });
}
