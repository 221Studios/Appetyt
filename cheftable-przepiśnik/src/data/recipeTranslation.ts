export type RecipeLanguage = 'pl' | 'en';

export interface LocalizedRecipeText {
  title: string;
  ingredients: string[];
  steps: string[];
  subtitle?: string;
  category?: string;
  cuisine?: string;
}

export interface RawRecipeTranslationFields {
  title?: string | null;
  ingredients?: string[] | null;
  steps?: string[] | null;
  subtitle?: string | null;
  category?: string | null;
  cuisine?: string | null;
}

type RawRecipeWithTranslations = {
  title: string;
  subtitle?: string | null;
  category?: string | null;
  cuisine?: string | null;
  ingredients?: unknown[];
  steps?: unknown[];
  title_pl?: string | null;
  subtitle_pl?: string | null;
  category_pl?: string | null;
  cuisine_pl?: string | null;
  ingredients_pl?: string[] | null;
  steps_pl?: string[] | null;
  title_en?: string | null;
  subtitle_en?: string | null;
  category_en?: string | null;
  cuisine_en?: string | null;
  ingredients_en?: string[] | null;
  steps_en?: string[] | null;
  translations?: Partial<Record<RecipeLanguage, RawRecipeTranslationFields>> | null;
};

function sourceIngredientText(value: unknown): string {
  if (typeof value === 'string') return value.trim();
  if (!value || typeof value !== 'object') return '';
  const item = value as Record<string, unknown>;
  return String(item.amount_text || item.name || '').trim();
}

function sourceStepText(value: unknown): string {
  if (typeof value === 'string') return value.trim();
  if (!value || typeof value !== 'object') return '';
  const item = value as Record<string, unknown>;
  return String(item.instructions || item.title || '').trim();
}

function normalizeTextList(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null;
  const result = value.map((item) => (typeof item === 'string' ? item.trim() : '')).filter(Boolean);
  return result.length === value.length ? result : null;
}

function optionalText(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function legacyTranslation(raw: RawRecipeWithTranslations, language: RecipeLanguage): RawRecipeTranslationFields {
  return language === 'pl'
    ? {
        title: raw.title_pl,
        ingredients: raw.ingredients_pl,
        steps: raw.steps_pl,
        subtitle: raw.subtitle_pl,
        category: raw.category_pl,
        cuisine: raw.cuisine_pl,
      }
    : {
        title: raw.title_en,
        ingredients: raw.ingredients_en,
        steps: raw.steps_en,
        subtitle: raw.subtitle_en,
        category: raw.category_en,
        cuisine: raw.cuisine_en,
      };
}

export function sourceRecipeText(raw: RawRecipeWithTranslations): LocalizedRecipeText {
  return {
    title: raw.title.trim(),
    ingredients: (raw.ingredients || []).map(sourceIngredientText),
    steps: (raw.steps || []).map(sourceStepText),
    subtitle: typeof raw.subtitle === 'string' && raw.subtitle.trim() ? raw.subtitle.trim() : undefined,
    category: typeof raw.category === 'string' && raw.category.trim() ? raw.category.trim() : undefined,
    cuisine: typeof raw.cuisine === 'string' && raw.cuisine.trim() ? raw.cuisine.trim() : undefined,
  };
}

function translationCandidate(
  raw: RawRecipeWithTranslations,
  language: RecipeLanguage,
): RawRecipeTranslationFields {
  const nested = raw.translations?.[language];
  return nested && typeof nested === 'object' ? nested : legacyTranslation(raw, language);
}

export function getRecipeTranslation(
  raw: RawRecipeWithTranslations,
  language: RecipeLanguage,
): LocalizedRecipeText | null {
  const source = sourceRecipeText(raw);
  const candidate = translationCandidate(raw, language);
  const title = typeof candidate.title === 'string' ? candidate.title.trim() : '';
  const ingredients = normalizeTextList(candidate.ingredients);
  const steps = normalizeTextList(candidate.steps);

  if (!title || !ingredients || !steps) return null;
  if (ingredients.length !== source.ingredients.length || steps.length !== source.steps.length) return null;

  return {
    title,
    ingredients,
    steps,
    subtitle: optionalText(candidate.subtitle),
    category: optionalText(candidate.category),
    cuisine: optionalText(candidate.cuisine),
  };
}

/**
 * UI language switch must still apply title/ingredient translations when the
 * catalog only has a partial localization (index rows omit cooking steps).
 */
export function resolveRecipeText(
  raw: RawRecipeWithTranslations,
  language: RecipeLanguage,
): LocalizedRecipeText {
  const source = sourceRecipeText(raw);
  const complete = getRecipeTranslation(raw, language);
  if (complete) return complete;

  const candidate = translationCandidate(raw, language);
  const title = typeof candidate.title === 'string' && candidate.title.trim()
    ? candidate.title.trim()
    : source.title;
  const ingredients = normalizeTextList(candidate.ingredients);
  const steps = normalizeTextList(candidate.steps);

  return {
    title,
    ingredients:
      ingredients && ingredients.length === source.ingredients.length ? ingredients : source.ingredients,
    steps: steps && steps.length === source.steps.length ? steps : source.steps,
    subtitle: optionalText(candidate.subtitle) || source.subtitle,
    category: optionalText(candidate.category) || source.category,
    cuisine: optionalText(candidate.cuisine) || source.cuisine,
  };
}

/**
 * Translation output must keep every recipe quantity intact. This catches a
 * model response that silently drops a number or changes a fraction.
 */
export function quantityTokens(text: string): string[] {
  const unicodeFractions: Record<string, string> = {
    '¼': '1/4',
    '½': '1/2',
    '¾': '3/4',
    '⅓': '1/3',
    '⅔': '2/3',
    '⅛': '1/8',
    '⅜': '3/8',
    '⅝': '5/8',
    '⅞': '7/8',
  };
  const compactThousands = text.replace(/(?<=\d)[\s\u00a0](?=\d{3}(?!\d))/g, '');
  const withoutPercentages = compactThousands.replace(/(?:\d+(?::\d{2})?(?:[.,]\d+)?|\.\d+)\s*%/gi, '');
  const tokens = withoutPercentages.match(/(?:\d+(?::\d{2})?(?:[.,]\d+)?(?:\s*\/\s*\d+)?|\.\d+)|[¼½¾⅓⅔⅛⅜⅝⅞]/gi) || [];
  return tokens
    .map((token) => {
      if (unicodeFractions[token]) return unicodeFractions[token];
      const normalized = token.replace(/\s+/g, '');
      if (normalized.includes(':')) {
        const [hours, minutes] = normalized.split(':');
        return minutes === '00' ? hours : normalized;
      }
      const separatorMatches = normalized.match(/[.,]/g) || [];
      if (!normalized.startsWith('.') && !/^0[.,]/.test(normalized) && separatorMatches.length === 1 && /[.,]\d{3}$/.test(normalized)) {
        return normalized.replace(/[.,]/, '');
      }
      return normalized.replace(',', '.').replace(/^\./, '0.');
    })
    .sort();
}

const ORDINAL_WORDS: Record<string, string> = {
    first: '1', second: '2', third: '3', fourth: '4', fifth: '5', sixth: '6', seventh: '7', eighth: '8', ninth: '9', tenth: '10',
    pierwszy: '1', pierwsza: '1', pierwsze: '1', pierwszego: '1', pierwszej: '1', pierwszym: '1', pierwszą: '1',
    drugi: '2', druga: '2', drugie: '2', drugiego: '2', drugiej: '2', drugim: '2', drugą: '2',
    trzeci: '3', trzecia: '3', trzecie: '3', trzeciego: '3', trzeciej: '3', trzecim: '3', trzecią: '3',
    czwarty: '4', czwarta: '4', czwarte: '4', czwartego: '4', czwartej: '4', czwartym: '4', czwartą: '4',
    piąty: '5', piata: '5', piąta: '5', piąte: '5', piątego: '5', piątej: '5', piątym: '5', piątą: '5',
    szósty: '6', szósta: '6', szóste: '6', szóstego: '6', szóstej: '6', szóstym: '6', szóstą: '6',
    siódmy: '7', siódma: '7', siódme: '7', siódmego: '7', siódmej: '7', siódmym: '7', siódmą: '7',
    ósmy: '8', ósma: '8', ósme: '8', ósmego: '8', ósmej: '8', ósmym: '8', ósmą: '8',
    dziewiąty: '9', dziewiąta: '9', dziewiąte: '9', dziewiątego: '9', dziewiątej: '9', dziewiątym: '9', dziewiątą: '9',
    dziesiąty: '10', dziesiąta: '10', dziesiąte: '10', dziesiątego: '10', dziesiątej: '10', dziesiątym: '10', dziesiątą: '10',
};

function ordinalTokens(text: string): string[] {
  return (text.match(/\b(?:first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth|pierwszy|pierwsza|pierwsze|pierwszego|pierwszej|pierwszym|pierwszą|drugi|druga|drugie|drugiego|drugiej|drugim|drugą|trzeci|trzecia|trzecie|trzeciego|trzeciej|trzecim|trzecią|czwarty|czwarta|czwarte|czwartego|czwartej|czwartym|czwartą|piąty|piata|piąta|piąte|piątego|piątej|piątym|piątą|szósty|szósta|szóste|szóstego|szóstej|szóstym|szóstą|siódmy|siódma|siódme|siódmego|siódmej|siódmym|siódmą|ósmy|ósma|ósme|ósmego|ósmej|ósmym|ósmą|dziewiąty|dziewiąta|dziewiąte|dziewiątego|dziewiątej|dziewiątym|dziewiątą|dziesiąty|dziesiąta|dziesiąte|dziesiątego|dziesiątej|dziesiątym|dziesiątą)\b/gi) || [])
    .map((token) => ORDINAL_WORDS[token.toLocaleLowerCase('pl-PL')])
    .filter(Boolean)
    .sort();
}

const CARDINAL_WORDS: Record<string, string> = {
  zero: '0', one: '1', two: '2', three: '3', four: '4', five: '5', six: '6', seven: '7', eight: '8', nine: '9', ten: '10',
  jeden: '1', jedna: '1', jedno: '1', jednej: '1', jednego: '1', jednym: '1', jedną: '1',
  dwa: '2', dwie: '2', dwóch: '2', dwu: '2', dwoma: '2', dwóm: '2',
  trzy: '3', trzech: '3', trzema: '3', trzem: '3',
  cztery: '4', czterech: '4', czterema: '4', czterem: '4',
  pięć: '5', pięciu: '5', pięcioma: '5',
  sześć: '6', sześciu: '6', sześcioma: '6',
  siedem: '7', siedmiu: '7', siedmioma: '7',
  osiem: '8', ośmiu: '8', ośmioma: '8',
  dziewięć: '9', dziewięciu: '9', dziewięcioma: '9',
  dziesięć: '10', dziesięciu: '10', dziesięcioma: '10',
};

function cardinalTokens(text: string): string[] {
  const pattern = Object.keys(CARDINAL_WORDS).join('|');
  return (text.match(new RegExp(`\\b(?:${pattern})\\b`, 'gi')) || [])
    .map((token) => CARDINAL_WORDS[token.toLocaleLowerCase('pl-PL')])
    .filter(Boolean)
    .sort();
}

function quantityVariants(text: string): string[][] {
  const numeric = quantityTokens(text);
  const variants = [numeric];
  for (const extra of [ordinalTokens(text), cardinalTokens(text)]) {
    if (extra.length) variants.push([...numeric, ...extra].sort());
  }
  return variants;
}

export function quantitiesMatch(source: string, translated: string): boolean {
  return quantityVariants(source).some((sourceVariant) =>
    quantityVariants(translated).some((translatedVariant) => sourceVariant.join('|') === translatedVariant.join('|')),
  );
}

export function isCompleteRecipeTranslation(
  source: LocalizedRecipeText,
  translation: LocalizedRecipeText | null | undefined,
): translation is LocalizedRecipeText {
  if (!translation || !translation.title.trim()) return false;
  if (
    source.ingredients.length !== translation.ingredients.length ||
    source.steps.length !== translation.steps.length ||
    translation.ingredients.some((line) => !line.trim()) ||
    translation.steps.some((line) => !line.trim())
  ) {
    return false;
  }

  const sourceTexts = [
    source.title,
    source.subtitle || '',
    source.category || '',
    source.cuisine || '',
    ...source.ingredients,
    ...source.steps,
  ];
  const translatedTexts = [
    translation.title,
    translation.subtitle || '',
    translation.category || '',
    translation.cuisine || '',
    ...translation.ingredients,
    ...translation.steps,
  ];
  if (source.subtitle && !translation.subtitle) return false;
  if (source.category && !translation.category) return false;
  if (source.cuisine && !translation.cuisine) return false;
  if (Boolean(source.subtitle) !== Boolean(translation.subtitle)) return false;
  if (Boolean(source.category) !== Boolean(translation.category)) return false;
  if (Boolean(source.cuisine) !== Boolean(translation.cuisine)) return false;
  return sourceTexts.every((text, index) => {
    return quantitiesMatch(text, translatedTexts[index]);
  });
}
