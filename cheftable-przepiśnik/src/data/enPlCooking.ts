/** Opcjonalne: przeliczenie miar US → metryczne + ostrożne tłumaczenie terminów kucharskich EN→PL. */

const FRACTIONS: Record<string, number> = {
  '¼': 0.25,
  '½': 0.5,
  '¾': 0.75,
  '⅓': 1 / 3,
  '⅔': 2 / 3,
  '⅛': 0.125,
  '⅜': 0.375,
  '⅝': 0.625,
  '⅞': 0.875,
};

function parseNumberToken(token: string): number | null {
  const t = token.trim().toLowerCase().replace(',', '.');
  if (!t) return null;
  if (FRACTIONS[t] !== undefined) return FRACTIONS[t];
  if (/^\d+\s+\d+\/\d+$/.test(t)) {
    const [whole, frac] = t.split(/\s+/);
    const [a, b] = frac.split('/').map(Number);
    if (!b) return null;
    return Number(whole) + a / b;
  }
  if (/^\d+\/\d+$/.test(t)) {
    const [a, b] = t.split('/').map(Number);
    if (!b) return null;
    return a / b;
  }
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

/** Parsuje „1 1/2”, „1½”, „1 & 1/2”, „.5”, „¾”. */
function parseAmountPrefix(text: string): { value: number; rest: string } | null {
  const m = text.match(
    /^(\d+\s*&\s*\d+\/\d+|\d+\s+\d+\/\d+|\d+\/\d+|\d+(?:[.,]\d+)?|[¼½¾⅓⅔⅛⅜⅝⅞]|\d+[¼½¾⅓⅔])\s*/
  );
  if (!m) return null;
  let raw = m[1].replace(/\s*&\s*/, ' ').trim();
  // 1½ → 1 + ½
  const mixedUnicode = raw.match(/^(\d+)([¼½¾⅓⅔⅛⅜⅝⅞])$/);
  if (mixedUnicode) {
    const v = Number(mixedUnicode[1]) + (FRACTIONS[mixedUnicode[2]] || 0);
    return { value: v, rest: text.slice(m[0].length) };
  }
  const v = parseNumberToken(raw);
  if (v === null) return null;
  return { value: v, rest: text.slice(m[0].length) };
}

function fmtQty(n: number): string {
  if (!Number.isFinite(n)) return '';
  const rounded = Math.abs(n - Math.round(n)) < 0.05 ? Math.round(n) : Math.round(n * 10) / 10;
  return String(rounded).replace('.', ',');
}

type UnitRule = {
  re: RegExp;
  /** ml / g / °C */
  toMetric: (qty: number) => { amount: number; unit: string };
};

const UNIT_RULES: UnitRule[] = [
  {
    re: /^(cups?|c\.)\b/i,
    toMetric: (q) => ({ amount: q * 240, unit: 'ml' }),
  },
  {
    re: /^(tablespoons?|tbsps?|tbs\.)\b/i,
    toMetric: (q) => ({ amount: q * 15, unit: 'ml' }),
  },
  {
    re: /^(teaspoons?|tsps?|tsp\.)\b/i,
    toMetric: (q) => ({ amount: q * 5, unit: 'ml' }),
  },
  {
    re: /^(fluid\s*ounces?|fl\.?\s*oz\.?)\b/i,
    toMetric: (q) => ({ amount: q * 30, unit: 'ml' }),
  },
  {
    re: /^(ounces?|oz\.?)\b/i,
    toMetric: (q) => ({ amount: q * 28, unit: 'g' }),
  },
  {
    re: /^(pounds?|lbs?\.?)\b/i,
    toMetric: (q) => {
      const g = q * 454;
      if (g >= 1000) return { amount: Math.round((g / 1000) * 100) / 100, unit: 'kg' };
      return { amount: g, unit: 'g' };
    },
  },
  {
    re: /^(quarts?|qt\.?)\b/i,
    toMetric: (q) => ({ amount: q * 950, unit: 'ml' }),
  },
  {
    re: /^(pints?|pt\.?)\b/i,
    toMetric: (q) => ({ amount: q * 475, unit: 'ml' }),
  },
  {
    re: /^(gallons?|gal\.?)\b/i,
    toMetric: (q) => ({ amount: q * 3.785, unit: 'l' }),
  },
  {
    re: /^(°\s*f|degrees?\s*f(?:ahrenheit)?|fahrenheit)\b/i,
    toMetric: (q) => ({ amount: Math.round(((q - 32) * 5) / 9), unit: '°C' }),
  },
];

/** Przelicza pierwszą ilość+jednostkę US na metryczne; reszta linii zostaje. */
export function convertUsMeasures(text: string): string {
  const raw = (text || '').trim();
  if (!raw) return raw;

  // np. "350°F" / "350 F"
  const fOnly = raw.match(/^(\d+(?:[.,]\d+)?)\s*°?\s*F\b(.*)$/i);
  if (fOnly) {
    const f = Number(fOnly[1].replace(',', '.'));
    const c = Math.round(((f - 32) * 5) / 9);
    return `${c} °C${fOnly[2] || ''}`;
  }

  const parsed = parseAmountPrefix(raw);
  if (!parsed) return raw;

  for (const rule of UNIT_RULES) {
    const um = parsed.rest.match(rule.re);
    if (!um) continue;
    const afterUnit = parsed.rest.slice(um[0].length).replace(/^\s*/, '');
    const metric = rule.toMetric(parsed.value);
    const qty = fmtQty(metric.amount);
    const sep = afterUnit.startsWith(',') || afterUnit.startsWith('(') ? ' ' : afterUnit ? ' ' : '';
    return `${qty} ${metric.unit}${sep}${afterUnit}`.replace(/\s{2,}/g, ' ').trim();
  }

  return raw;
}

/** Tylko częste frazy składników — bez ślepego podmieniania każdego słowa. */
const PHRASE_MAP: Array<[RegExp, string]> = [
  [/\bextra virgin olive oil\b/gi, 'oliwa extra virgin'],
  [/\bolive oil\b/gi, 'oliwa z oliwek'],
  [/\bvegetable oil\b/gi, 'olej roślinny'],
  [/\bcanola oil\b/gi, 'olej rzepakowy'],
  [/\bsesame oil\b/gi, 'olej sezamowy'],
  [/\bsoy sauce\b/gi, 'sos sojowy'],
  [/\bfish sauce\b/gi, 'sos rybny'],
  [/\btomato paste\b/gi, 'skoncentrowany przecier pomidorowy'],
  [/\btomato sauce\b/gi, 'sos pomidorowy'],
  [/\bdiced tomatoes\b/gi, 'pomidory krojone'],
  [/\bcrushed tomatoes\b/gi, 'pomidory mielone'],
  [/\bcherry tomatoes\b/gi, 'pomidorki koktajlowe'],
  [/\bgreen onions?\b/gi, 'szczypiorek'],
  [/\bspring onions?\b/gi, 'cebula dymka'],
  [/\bred onion\b/gi, 'czerwona cebula'],
  [/\bgallic cloves?\b/gi, 'ząbki czosnku'],
  [/\bgarlic cloves?\b/gi, 'ząbki czosnku'],
  [/\bgarlic powder\b/gi, 'czosnek granulowany'],
  [/\bonion powder\b/gi, 'cebula granulowana'],
  [/\bblack pepper\b/gi, 'pieprz czarny'],
  [/\bred pepper flakes\b/gi, 'płatki chili'],
  [/\bsmoked paprika\b/gi, 'papryka wędzona'],
  [/\bkosher salt\b/gi, 'sól'],
  [/\bsea salt\b/gi, 'sól morska'],
  [/\bbrown sugar\b/gi, 'cukier brązowy'],
  [/\ball[- ]purpose flour\b/gi, 'mąka pszenna'],
  [/\bbaking powder\b/gi, 'proszek do pieczenia'],
  [/\bbaking soda\b/gi, 'soda oczyszczona'],
  [/\binstant yeast\b/gi, 'drożdże instant'],
  [/\bsour cream\b/gi, 'śmietana'],
  [/\bheavy cream\b/gi, 'śmietanka 36%'],
  [/\bcream cheese\b/gi, 'ser kremowy'],
  [/\bparmesan cheese\b/gi, 'parmezan'],
  [/\bcheddar cheese\b/gi, 'ser cheddar'],
  [/\bchicken breast\b/gi, 'pierś z kurczaka'],
  [/\bchicken thighs?\b/gi, 'udka z kurczaka'],
  [/\bground beef\b/gi, 'mięso mielone wołowe'],
  [/\bground pork\b/gi, 'mięso mielone wieprzowe'],
  [/\bbell pepper\b/gi, 'papryka'],
  [/\bru[sz]set potatoes?\b/gi, 'ziemniaki'],
  [/\bsweet potatoes?\b/gi, 'bataty'],
  [/\blarge\b/gi, 'duże'],
  [/\bmedium\b/gi, 'średnie'],
  [/\bsmall\b/gi, 'małe'],
  [/\bsirloin steak\b/gi, 'stek z rostbefu'],
  [/\bpeanut butter\b/gi, 'masło orzechowe'],
  [/\bdijon mustard\b/gi, 'musztarda Dijon'],
  [/\bapple cider vinegar\b/gi, 'ocet jabłkowy'],
  [/\bbalsamic vinegar\b/gi, 'ocet balsamiczny'],
  [/\bchicken broth\b/gi, 'bulion drobiowy'],
  [/\bbeef broth\b/gi, 'bulion wołowy'],
  [/\bvegetable broth\b/gi, 'bulion warzywny'],
  [/\bcoconut milk\b/gi, 'mleko kokosowe'],
  [/\blemon juice\b/gi, 'sok z cytryny'],
  [/\blime juice\b/gi, 'sok z limonki'],
  [/\bunsalted butter\b/gi, 'masło'],
  [/\bsalted butter\b/gi, 'masło'],
  [/\bto taste\b/gi, 'do smaku'],
  [/\bas needed\b/gi, 'w razie potrzeby'],
  [/\bfor serving\b/gi, 'do podania'],
  [/\boptional\b/gi, 'opcjonalnie'],
  [/\bfreshly ground\b/gi, 'świeżo mielony'],
  [/\bdiced\b/gi, 'w kostkę'],
  [/\bchopped\b/gi, 'posiekany'],
  [/\bminced\b/gi, 'drobno posiekany'],
  [/\bsliced\b/gi, 'w plastry'],
  [/\bgrated\b/gi, 'starty'],
];

const SIMPLE_WORDS: Record<string, string> = {
  salt: 'sól',
  pepper: 'pieprz',
  onion: 'cebula',
  onions: 'cebula',
  garlic: 'czosnek',
  butter: 'masło',
  oil: 'olej',
  flour: 'mąka',
  sugar: 'cukier',
  egg: 'jajko',
  eggs: 'jajka',
  milk: 'mleko',
  cream: 'śmietanka',
  cheese: 'ser',
  tomato: 'pomidor',
  tomatoes: 'pomidory',
  potato: 'ziemniak',
  potatoes: 'ziemniaki',
  rice: 'ryż',
  water: 'woda',
  lemon: 'cytryna',
  lime: 'limonka',
  parsley: 'pietruszka',
  cilantro: 'kolendra',
  basil: 'bazylia',
  oregano: 'oregano',
  thyme: 'tymianek',
  paprika: 'papryka',
  chicken: 'kurczak',
  beef: 'wołowina',
  pork: 'wieprzowina',
  bacon: 'boczek',
  shrimp: 'krewetki',
  salmon: 'łosoś',
  bread: 'chleb',
  mayonnaise: 'majonez',
  vinegar: 'ocet',
  yogurt: 'jogurt',
  spinach: 'szpinak',
  carrot: 'marchew',
  carrots: 'marchew',
  celery: 'seler naciowy',
  mushroom: 'pieczarki',
  mushrooms: 'pieczarki',
};

const POLISH_HINT = /[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]|łyżk|szklank|ząbek|do smaku|cebula|czosnek|mąka|masło|pomidor/i;

export function looksPolish(text: string): boolean {
  return POLISH_HINT.test(text);
}

function translateTerms(text: string): string {
  let out = text;
  for (const [re, pl] of PHRASE_MAP) out = out.replace(re, pl);
  out = out.replace(/\b[A-Za-z']+\b/g, (word) => {
    const key = word.toLowerCase();
    return SIMPLE_WORDS[key] || word;
  });
  return out;
}

/** Pełna adaptacja linii: miary US→metryczne, potem lekkie tłumaczenie terminów. */
export function adaptCookingLine(text: string): string {
  const raw = (text || '').trim();
  if (!raw) return raw;
  if (looksPolish(raw)) return raw;
  const converted = convertUsMeasures(raw);
  return translateTerms(converted).replace(/\s{2,}/g, ' ').trim();
}

export function adaptRecipeForPl(recipe: {
  title: string;
  ingredients: Array<{ id: string; name: string; amountText?: string }>;
  steps: Array<{ stepNumber: number; title: string; description: string }>;
}) {
  return {
    title: looksPolish(recipe.title) ? recipe.title : adaptCookingLine(recipe.title),
    ingredients: recipe.ingredients.map((ing) => ({
      ...ing,
      name: adaptCookingLine(ing.name),
      amountText: ing.amountText ? adaptCookingLine(ing.amountText) : ing.amountText,
    })),
    steps: recipe.steps.map((step) => ({
      ...step,
      title: adaptCookingLine(step.title),
      description: adaptCookingLine(step.description || step.title),
    })),
  };
}
