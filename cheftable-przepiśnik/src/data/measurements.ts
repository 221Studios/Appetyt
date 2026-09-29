import type { MeasurementSystem } from '../i18n';

type Dimension = 'mass' | 'volume' | 'temperature' | 'length';

interface UnitDef {
  id: string;
  dimension: Dimension;
  system: MeasurementSystem;
  toBase: (value: number) => number;
  aliases: string[];
  /**
   * Household names such as szklanka and łyżka are rewritten into the selected
   * system, so a language switch cannot leave one text in milliliters and the
   * other in glasses.
   */
  household?: boolean;
  /** Word units such as "degrees" need nearby cooking context. */
  context?: 'fahrenheit' | 'celsius';
}

const OZ_IN_G = 28.349523125;
const LB_IN_G = 453.59237;
const CUP_IN_ML = 240;
const TBSP_IN_ML = 15;
const TSP_IN_ML = 5;
const FL_OZ_IN_ML = 29.5735295625;
const PINT_IN_ML = 473.176473;
const QUART_IN_ML = 946.352946;
const GALLON_IN_ML = 3785.411784;
const STICK_IN_G = 113.398;
const INCH_IN_MM = 25.4;

const UNITS: UnitDef[] = [
  { id: 'kg', dimension: 'mass', system: 'eu', toBase: (value) => value * 1000, aliases: ['kilograms', 'kilogram', 'kilogramów', 'kilogramy', 'kilograma', 'kg'] },
  { id: 'g', dimension: 'mass', system: 'eu', toBase: (value) => value, aliases: ['grams', 'gram', 'gramów', 'gramy', 'grama', 'g'] },
  { id: 'lb', dimension: 'mass', system: 'us', toBase: (value) => value * LB_IN_G, aliases: ['pounds', 'pound', 'funtów', 'funty', 'funta', 'funt', 'lbs', 'lb'] },
  { id: 'oz', dimension: 'mass', system: 'us', toBase: (value) => value * OZ_IN_G, aliases: ['ounces', 'ounce', 'uncji', 'uncje', 'uncja', 'oz'] },
  { id: 'l', dimension: 'volume', system: 'eu', toBase: (value) => value * 1000, aliases: ['liters', 'litres', 'liter', 'litre', 'litrów', 'litry', 'litra', 'litr', 'l'] },
  { id: 'ml', dimension: 'volume', system: 'eu', toBase: (value) => value, aliases: ['milliliters', 'millilitres', 'milliliter', 'millilitre', 'mililitrów', 'mililitry', 'mililitra', 'mililitr', 'ml'] },
  { id: 'szklanka', dimension: 'volume', system: 'eu', household: true, toBase: (value) => value * 250, aliases: ['szklanek', 'szklanki', 'szklankę', 'szklanka'] },
  { id: 'lyzka', dimension: 'volume', system: 'eu', household: true, toBase: (value) => value * TBSP_IN_ML, aliases: ['łyżek', 'łyżkę', 'łyżki', 'łyżka'] },
  { id: 'lyzeczka', dimension: 'volume', system: 'eu', household: true, toBase: (value) => value * TSP_IN_ML, aliases: ['łyżeczek', 'łyżeczkę', 'łyżeczki', 'łyżeczka'] },
  { id: 'gallon', dimension: 'volume', system: 'us', toBase: (value) => value * GALLON_IN_ML, aliases: ['gallons', 'gallon', 'galonów', 'galony', 'galonu', 'galon'] },
  { id: 'stick', dimension: 'mass', system: 'us', toBase: (value) => value * STICK_IN_G, aliases: ['sticks', 'stick'] },
  { id: 'quart', dimension: 'volume', system: 'us', toBase: (value) => value * QUART_IN_ML, aliases: ['quarts', 'quart', 'kwart', 'kwarty', 'kwarta'] },
  { id: 'pint', dimension: 'volume', system: 'us', toBase: (value) => value * PINT_IN_ML, aliases: ['pints', 'pint'] },
  { id: 'floz', dimension: 'volume', system: 'us', toBase: (value) => value * FL_OZ_IN_ML, aliases: ['fluid ounces', 'fluid ounce', 'fl oz', 'fl. oz'] },
  { id: 'cup', dimension: 'volume', system: 'us', toBase: (value) => value * CUP_IN_ML, aliases: ['cups', 'cup'] },
  { id: 'tbsp', dimension: 'volume', system: 'us', toBase: (value) => value * TBSP_IN_ML, aliases: ['tablespoons', 'tablespoon', 'tbsp', 'tbs'] },
  { id: 'tsp', dimension: 'volume', system: 'us', toBase: (value) => value * TSP_IN_ML, aliases: ['teaspoons', 'teaspoon', 'tsp'] },
  { id: 'cm', dimension: 'length', system: 'eu', toBase: (value) => value * 10, aliases: ['centymetrów', 'centymetry', 'centymetra', 'cm'] },
  { id: 'mm', dimension: 'length', system: 'eu', toBase: (value) => value, aliases: ['milimetrów', 'milimetry', 'mm'] },
  { id: 'inch', dimension: 'length', system: 'us', toBase: (value) => value * INCH_IN_MM, aliases: ['inches', 'inch', 'cali', 'cale', 'cala'] },
  { id: 'c', dimension: 'temperature', system: 'eu', toBase: (value) => value, aliases: ['degrees celsius', 'degree celsius', 'celsius', 'stopniach', 'stopni', 'stopnia'] },
  { id: 'f', dimension: 'temperature', system: 'us', toBase: (value) => ((value - 32) * 5) / 9, aliases: ['degrees fahrenheit', 'degree fahrenheit', 'fahrenheit', 'degrees', 'degree'], context: 'fahrenheit' },
];

const ALIAS_TO_UNIT = new Map<string, UnitDef>();
for (const unit of UNITS) {
  for (const alias of unit.aliases) ALIAS_TO_UNIT.set(alias, unit);
}

const UNICODE_FRACTIONS: Record<string, number> = {
  '¼': 1 / 4,
  '½': 1 / 2,
  '¾': 3 / 4,
  '⅓': 1 / 3,
  '⅔': 2 / 3,
  '⅛': 1 / 8,
  '⅜': 3 / 8,
  '⅝': 5 / 8,
  '⅞': 7 / 8,
};

const QTY = String.raw`(?:\d+(?:[.,]\d+)?(?:\s+\d+\s*/\s*\d+|\s*[¼½¾⅓⅔⅛⅜⅝⅞])?|\d+\s*/\s*\d+|[¼½¾⅓⅔⅛⅜⅝⅞])`;
const UNIT_PATTERN = [
  ...UNITS.flatMap((unit) => unit.aliases).sort((a, b) => b.length - a.length).map(escapeRegExp),
  String.raw`°\s*[cC]`,
  String.raw`°\s*[fF]`,
  String.raw`º\s*[cC]`,
  String.raw`º\s*[fF]`,
  '℉',
  '℃',
].join('|');
const MEASURE = String.raw`(?:${QTY})(?:\s*[-–—]\s*(?:${QTY}))?\s*-?\s*(?:${UNIT_PATTERN})(?![\p{L}\p{N}])`;
const MEASURE_RE = new RegExp(String.raw`(${MEASURE})(?:\s*\(\s*(${MEASURE})\s*\)|\s*/\s*(${MEASURE}))?`, 'giu');
const SINGLE_RE = new RegExp(String.raw`^(${QTY})(?:\s*[-–—]\s*(${QTY}))?\s*-?\s*(${UNIT_PATTERN})$`, 'iu');

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function parseQty(raw: string): number | null {
  const text = raw.trim().replace(',', '.');
  if (UNICODE_FRACTIONS[text] !== undefined) return UNICODE_FRACTIONS[text];
  const mixed = text.match(/^(\d+(?:\.\d+)?)\s*([¼½¾⅓⅔⅛⅜⅝⅞]|\d+\s*\/\s*\d+)$/);
  if (mixed) {
    const fraction = UNICODE_FRACTIONS[mixed[2]] ?? slashValue(mixed[2]);
    return fraction === null ? null : Number(mixed[1]) + fraction;
  }
  const slash = slashValue(text);
  if (slash !== null) return slash;
  const value = Number(text);
  return Number.isFinite(value) ? value : null;
}

function slashValue(text: string): number | null {
  const match = text.match(/^(\d+)\s*\/\s*(\d+)$/);
  if (!match || match[2] === '0') return null;
  return Number(match[1]) / Number(match[2]);
}

function unitFromToken(raw: string): UnitDef | null {
  const compact = raw.toLocaleLowerCase('pl-PL').replace(/\s+/g, '').replace('º', '°');
  if (compact === '°c' || compact === '℃') return ALIAS_TO_UNIT.get('celsius') ?? null;
  if (compact === '°f' || compact === '℉') return ALIAS_TO_UNIT.get('fahrenheit') ?? null;
  const spaced = raw.toLocaleLowerCase('pl-PL').replace(/\s+/g, ' ').trim();
  return ALIAS_TO_UNIT.get(spaced) ?? ALIAS_TO_UNIT.get(compact) ?? null;
}

interface ParsedMeasure {
  values: number[];
  unit: UnitDef;
  explicitSymbol: boolean;
}

function parseMeasure(raw: string): ParsedMeasure | null {
  const match = raw.trim().match(SINGLE_RE);
  if (!match) return null;
  const first = parseQty(match[1]);
  const second = match[2] ? parseQty(match[2]) : null;
  const unit = unitFromToken(match[3]);
  if (first === null || !unit || (match[2] && second === null)) return null;
  const token = match[3].toLocaleLowerCase('pl-PL');
  return {
    values: second === null ? [first] : [first, second],
    unit,
    explicitSymbol: /°|º|℉|℃|celsius|fahrenheit/.test(token),
  };
}

function allowsStick(text: string, start: number, end: number, unit: UnitDef) {
  if (unit.id !== 'stick') return true;
  const window = text.slice(Math.max(0, start - 24), Math.min(text.length, end + 48)).toLocaleLowerCase('pl-PL');
  return /butter|masł|margaryn/.test(window);
}

function allowsTemperature(text: string, start: number, end: number, unit: UnitDef, explicitSymbol: boolean) {
  if (unit.dimension !== 'temperature' || explicitSymbol) return true;
  const window = text.slice(Math.max(0, start - 70), Math.min(text.length, end + 24)).toLocaleLowerCase('pl-PL');
  if (/rotate|rotation|angle|kąt|knife|obró|fold into|ostroś|ostros/.test(window)) return false;
  if (unit.context !== 'fahrenheit') return true;
  return /oven|bake|preheat|broil|grill|fry|piekarnik|piecz|nagrze|wypiek|temperatur|heat|olej|gotuj|warm|roast|air/.test(window);
}

type DisplayUnit = 'g' | 'kg' | 'oz' | 'lb' | 'stick' | 'ml' | 'l' | 'tsp' | 'tbsp' | 'cup' | 'quart' | 'gallon' | 'c' | 'f' | 'mm' | 'cm' | 'inch';

function roundTo(value: number, step: number) {
  return Math.round(value / step) * step;
}

function trimNumber(value: number, digits: number) {
  const factor = 10 ** digits;
  const rounded = Math.round(value * factor + 1e-8) / factor;
  return rounded.toFixed(digits).replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '');
}

function snapCooking(value: number): string {
  const first = snapCookingOnce(value);
  const parsed = parseCooking(first);
  if (!Number.isFinite(parsed) || Math.abs(parsed - value) < 1e-6) return first;
  return snapCookingOnce(parsed);
}

function snapCookingOnce(value: number): string {
  if (value >= 10) return String(value >= 100 ? roundTo(value, 5) : Math.round(value));
  const whole = Math.floor(value + 1e-9);
  const fraction = value - whole;
  const steps: Array<[number, string]> = [
    [0, ''],
    [0.125, '⅛'],
    [0.25, '¼'],
    [1 / 3, '⅓'],
    [0.375, '⅜'],
    [0.5, '½'],
    [2 / 3, '⅔'],
    [0.75, '¾'],
    [0.875, '⅞'],
    [1, ''],
  ];
  let best = steps[0];
  let bestDistance = Infinity;
  for (const step of steps) {
    const distance = Math.abs(fraction - step[0]);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = step;
    }
  }
  if (bestDistance > 0.06) return trimNumber(Math.round(value * 10) / 10, 1);
  let shownWhole = whole;
  let fractionText = best[1];
  if (best[0] === 1) {
    shownWhole += 1;
    fractionText = '';
  }
  if (shownWhole <= 0) return fractionText || '0';
  return fractionText ? `${shownWhole} ${fractionText}` : String(shownWhole);
}

function parseCooking(amount: string) {
  const text = amount.trim();
  const mixed = text.match(/^(\d+)\s*([¼½¾⅓⅔⅛⅜⅝⅞])$/);
  if (mixed) return Number(mixed[1]) + (UNICODE_FRACTIONS[mixed[2]] ?? 0);
  if (UNICODE_FRACTIONS[text] !== undefined) return UNICODE_FRACTIONS[text];
  const value = Number(text);
  return Number.isFinite(value) ? value : 0;
}

function amountInUnit(base: number, unit: DisplayUnit): string {
  switch (unit) {
    case 'kg':
      return trimNumber(base / 1000, base >= 10000 ? 1 : 2);
    case 'g':
      return String(base >= 100 ? roundTo(base, base >= 500 ? 5 : 1) : Math.max(1, Math.round(base)));
    case 'lb':
      return snapCooking(base / LB_IN_G);
    case 'stick':
      return snapCooking(base / STICK_IN_G);
    case 'oz': {
      const ounces = base / OZ_IN_G;
      if (ounces < 1) return snapCooking(ounces);
      const rounded = ounces >= 10 ? Math.round(ounces) : Math.round(ounces * 2) / 2;
      return trimNumber(rounded, 1);
    }
    case 'l':
      return trimNumber(base / 1000, 2);
    case 'ml':
      return String(base >= 100 ? roundTo(base, base >= 500 ? 5 : 1) : Math.max(1, Math.round(base)));
    case 'gallon':
      return snapCooking(base / GALLON_IN_ML);
    case 'quart':
      return snapCooking(base / QUART_IN_ML);
    case 'cup':
      return snapCooking(base / CUP_IN_ML);
    case 'tbsp':
      return snapCooking(base / TBSP_IN_ML);
    case 'tsp':
      return snapCooking(base / TSP_IN_ML);
    case 'c':
      return String(Math.round(base));
    case 'f': {
      const fahrenheit = (base * 9) / 5 + 32;
      const rounded = base >= 140 ? roundTo(fahrenheit, 25) : Math.abs(fahrenheit) >= 80 ? roundTo(fahrenheit, 5) : Math.round(fahrenheit);
      return String(rounded);
    }
    case 'mm':
      return String(Math.max(1, Math.round(base)));
    case 'cm':
      return trimNumber(Math.round(base) / 10, base >= 100 ? 0 : 1);
    case 'inch':
      return snapCooking(base / INCH_IN_MM);
    default:
      return String(Math.round(base));
  }
}

function restoredBase(amount: string, unit: DisplayUnit) {
  const value = parseCooking(amount);
  switch (unit) {
    case 'kg': return value * 1000;
    case 'lb': return value * LB_IN_G;
    case 'stick': return value * STICK_IN_G;
    case 'oz': return value * OZ_IN_G;
    case 'l': return value * 1000;
    case 'tsp': return value * TSP_IN_ML;
    case 'tbsp': return value * TBSP_IN_ML;
    case 'cup': return value * CUP_IN_ML;
    case 'quart': return value * QUART_IN_ML;
    case 'gallon': return value * GALLON_IN_ML;
    case 'f': return ((value - 32) * 5) / 9;
    case 'cm': return value * 10;
    case 'inch': return value * INCH_IN_MM;
    default: return value;
  }
}

function snapError(base: number, unit: DisplayUnit) {
  const restored = restoredBase(amountInUnit(base, unit), unit);
  return Math.abs(restored - base) / Math.max(Math.abs(base), 1);
}

function displayChoices(dimension: Dimension, system: MeasurementSystem): DisplayUnit[] {
  if (dimension === 'mass') return system === 'eu' ? ['g', 'kg'] : ['oz', 'lb'];
  if (dimension === 'volume') return system === 'eu' ? ['ml', 'l'] : ['tsp', 'tbsp', 'cup', 'quart', 'gallon'];
  if (dimension === 'temperature') return [system === 'eu' ? 'c' : 'f'];
  return system === 'eu' ? ['mm', 'cm'] : ['inch'];
}

function unitScore(unit: DisplayUnit, bases: number[]) {
  const error = Math.max(...bases.map((base) => snapError(base, unit)));
  const largest = Math.max(...bases.map((base) => parseCooking(amountInUnit(base, unit))));
  let bias = 0;
  if ((unit === 'l' || unit === 'kg') && largest < 1) bias += 1;
  if ((unit === 'ml' || unit === 'g') && largest >= 1000) bias += 0.1;
  if (unit === 'tsp' && largest >= 3) bias += 0.05;
  if (unit === 'tbsp' && largest >= 8) bias += 0.05;
  if (unit === 'cup' && largest < 0.25) bias += 0.01;
  if (unit === 'mm' && largest >= 10) bias += 0.05;
  return error + bias;
}

function rankedUnits(bases: number[], dimension: Dimension, system: MeasurementSystem) {
  const choices = displayChoices(dimension, system);
  return choices
    .map((unit) => ({ unit, score: unitScore(unit, bases) }))
    .sort((left, right) => left.score - right.score || choices.indexOf(left.unit) - choices.indexOf(right.unit));
}

function pickUnit(bases: number[], dimension: Dimension, system: MeasurementSystem): DisplayUnit {
  const ranked = rankedUnits(bases, dimension, system);
  for (const candidate of ranked) {
    const amounts = bases.map((base) => amountInUnit(base, candidate.unit));
    const restored = bases.map((base) => restoredBase(amountInUnit(base, candidate.unit), candidate.unit));
    const collapsed = amounts.every((amount) => amount === amounts[0]) ? restored.slice(0, 1) : restored;
    if (rankedUnits(collapsed, dimension, system)[0]?.unit === candidate.unit) return candidate.unit;
  }
  return ranked[0]?.unit ?? displayChoices(dimension, system)[0];
}

function labelFor(unit: DisplayUnit, amount: string) {
  const plural = parseCooking(amount) > 1;
  switch (unit) {
    case 'kg': return 'kg';
    case 'g': return 'g';
    case 'lb': return 'lb';
    case 'oz': return 'oz';
    case 'stick': return plural ? 'sticks' : 'stick';
    case 'l': return 'l';
    case 'ml': return 'ml';
    case 'gallon': return plural ? 'gallons' : 'gallon';
    case 'quart': return plural ? 'quarts' : 'quart';
    case 'cup': return plural ? 'cups' : 'cup';
    case 'tbsp': return 'tbsp';
    case 'tsp': return 'tsp';
    case 'c': return '°C';
    case 'f': return '°F';
    case 'mm': return 'mm';
    case 'cm': return 'cm';
    case 'inch': return plural ? 'inches' : 'inch';
    default: return unit;
  }
}

function formatMeasure(parsed: ParsedMeasure, system: MeasurementSystem) {
  if (system === 'us' && (parsed.unit.id === 'stick' || parsed.unit.id === 'gallon')) {
    const unit = parsed.unit.id as DisplayUnit;
    const amounts = parsed.values.map((value) => snapCooking(value));
    const label = labelFor(unit, amounts[amounts.length - 1] ?? '');
    return amounts.length === 1 ? `${amounts[0]} ${label}` : `${amounts.join('-')} ${label}`;
  }
  const bases = parsed.values.map((value) => parsed.unit.toBase(value));
  const unit = pickUnit(bases, parsed.unit.dimension, system);
  const amounts = bases.map((base) => amountInUnit(base, unit));
  const shown = amounts.every((amount) => amount === amounts[0]) ? amounts.slice(0, 1) : amounts;
  const label = labelFor(unit, shown[shown.length - 1] ?? '');
  if (shown.length === 1) return label.startsWith('°') ? `${shown[0]}${label}` : `${shown[0]} ${label}`;
  return label.startsWith('°') ? `${shown.join('-')}${label}` : `${shown.join('-')} ${label}`;
}

function matchesSystem(unit: UnitDef, system: MeasurementSystem) {
  return !unit.household && unit.system === system;
}

function preferredSide(outer: ParsedMeasure, inner: ParsedMeasure, system: MeasurementSystem): 'outer' | 'inner' | 'both' | 'convert-outer' {
  const outerMatches = matchesSystem(outer.unit, system);
  const innerMatches = matchesSystem(inner.unit, system);
  if (outerMatches && innerMatches) return 'both';
  if (outerMatches) return 'outer';
  if (innerMatches) return 'inner';
  if (outer.unit.dimension !== inner.unit.dimension) return 'both';
  const outerBase = outer.unit.toBase(outer.values[0] ?? 0);
  const innerBase = inner.unit.toBase(inner.values[0] ?? 0);
  const scale = Math.max(Math.abs(outerBase), Math.abs(innerBase), 1);
  return Math.abs(outerBase - innerBase) / scale < 0.15 ? 'convert-outer' : 'both';
}

/**
 * Rewrites ingredient and step measures to the selected system.
 * Language is intentionally not an input: English text can stay metric,
 * and Polish text can use US measures.
 */
export function convertMeasurementText(text: string, system: MeasurementSystem): string {
  if (!text) return text;
  const pattern = new RegExp(MEASURE_RE.source, MEASURE_RE.flags);
  let result = '';
  let cursor = 0;
  for (const match of text.matchAll(pattern)) {
    const start = match.index ?? 0;
    const outer = parseMeasure(match[1]);
    const innerRaw = match[2] || match[3];
    const inner = innerRaw ? parseMeasure(innerRaw) : null;
    const separator = match[3] ? ' / ' : ' (';
    if (!outer || !allowsTemperature(text, start, start + match[1].length, outer.unit, outer.explicitSymbol)) {
      continue;
    }
    if (inner && !allowsTemperature(text, start, start + match[0].length, inner.unit, inner.explicitSymbol)) {
      continue;
    }
    if (!allowsStick(text, start, start + match[0].length, outer.unit)) continue;

    let replacement: string | null = null;
    if (inner) {
      const side = preferredSide(outer, inner, system);
      if (side === 'outer' || side === 'convert-outer') replacement = formatMeasure(outer, system);
      else if (side === 'inner') replacement = formatMeasure(inner, system);
      else {
        const left = formatMeasure(outer, system);
        const right = formatMeasure(inner, system);
        replacement = separator === ' / ' ? `${left} / ${right}` : `${left} (${right})`;
      }
    } else {
      replacement = formatMeasure(outer, system);
    }

    if (replacement === null) continue;
    result += text.slice(cursor, start) + replacement;
    cursor = start + match[0].length;
  }
  return result + text.slice(cursor);
}
