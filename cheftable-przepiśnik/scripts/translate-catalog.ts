import { readFile, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { GoogleGenAI, Type } from '@google/genai';
import {
  isCompleteRecipeTranslation,
  LocalizedRecipeText,
  quantityTokens,
  quantitiesMatch,
  sourceRecipeText,
} from '../src/data/recipeTranslation';

type RawRecipe = {
  id: string;
  title: string;
  ingredients?: unknown[];
  steps?: unknown[];
  [key: string]: unknown;
};

type TranslationCacheEntry = {
  source: LocalizedRecipeText;
  pl: LocalizedRecipeText;
  en: LocalizedRecipeText;
};

type TranslationLanguage = 'pl' | 'en';
type TranslationProvider = 'gemini' | 'local' | 'google-free';

class TranslationValidationError extends Error {
  constructor(
    readonly recipeId: string,
    readonly source: LocalizedRecipeText,
    readonly pl: LocalizedRecipeText | null,
    readonly en: LocalizedRecipeText | null,
    message: string,
  ) {
    super(message);
    this.name = 'TranslationValidationError';
  }
}

const ROOT = path.resolve(import.meta.dirname, '../..');
const INPUT_PATH = path.join(ROOT, 'data/mobile_catalog.json');
const CACHE_PATH = path.join(ROOT, 'data/recipe_translations.json');
const PUBLIC_PATH = path.join(ROOT, 'cheftable-przepiśnik/public/recipes.json');
const DEFAULT_MODEL = process.env.GEMINI_TRANSLATION_MODEL || 'gemini-3.5-flash';
const DEFAULT_LOCAL_MODEL = process.env.OLLAMA_TRANSLATION_MODEL || 'qwen3.5:27b';
const DEFAULT_OLLAMA_CONTAINER = process.env.OLLAMA_TRANSLATION_CONTAINER || 'n3xus-api-api-1';

const LOCAL_OLLAMA_BRIDGE = `
import json
import sys
import urllib.request

payload = json.loads(sys.stdin.read())
request = urllib.request.Request(
    'http://ollama:11434/api/generate',
    data=json.dumps(payload).encode(),
    headers={'Content-Type': 'application/json'},
)
with urllib.request.urlopen(request, timeout=900) as response:
    print(response.read().decode())
`;

const localizedTextSchema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    subtitle: { type: Type.STRING },
    category: { type: Type.STRING },
    cuisine: { type: Type.STRING },
    ingredients: { type: Type.ARRAY, items: { type: Type.STRING } },
    steps: { type: Type.ARRAY, items: { type: Type.STRING } },
  },
  required: ['title', 'subtitle', 'category', 'cuisine', 'ingredients', 'steps'],
};

const localizedRecipeSchema = {
  type: Type.OBJECT,
  properties: {
    pl: localizedTextSchema,
    en: localizedTextSchema,
  },
  required: ['pl', 'en'],
};

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    recipes: {
      type: Type.ARRAY,
      items: localizedRecipeSchema,
    },
  },
  required: ['recipes'],
};

const singleResponseSchema = localizedRecipeSchema;

function argumentValue(name: string, fallback: string): string {
  const index = process.argv.indexOf(name);
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback;
}

function hasFlag(name: string): boolean {
  return process.argv.includes(name);
}

type GoogleTranslateResponse = {
  sentences?: Array<{ trans?: string }>;
};

const GOOGLE_QUANTITY_PATTERN = /(?:\d+(?:st|nd|rd|th)\b|\d+(?::\d{2})?(?:[.,]\d+)?(?:\s*\/\s*\d+)?|\.\d+|[¼½¾⅓⅔⅛⅜⅝⅞])/gi;

function googleMarkerIndex(index: number): string {
  let value = index;
  let marker = '';
  do {
    marker = String.fromCharCode(65 + (value % 26)) + marker;
    value = Math.floor(value / 26) - 1;
  } while (value >= 0);
  return marker;
}

function googleMarkerIndexFromText(marker: string): number {
  return [...marker].reduce((value, character) => value * 26 + character.charCodeAt(0) - 64, 0) - 1;
}

function maskGoogleQuantities(text: string): { masked: string; tokens: string[] } {
  const tokens: string[] = [];
  const wordMasked = text.replace(/\ban inch\b/gi, () => {
    const index = tokens.push('cala') - 1;
    return `QTYMARKER${googleMarkerIndex(index + 26)}`;
  });
  const masked = wordMasked.replace(GOOGLE_QUANTITY_PATTERN, (token) => {
    const index = tokens.push(token) - 1;
    return `QTYMARKER${googleMarkerIndex(index + 26)}`;
  });
  return { masked, tokens };
}

function restoreGoogleQuantities(text: string, tokens: string[]): string {
  return text.replace(/QTYMARKER([A-Z]+)/g, (match, marker: string) => tokens[googleMarkerIndexFromText(marker) - 26] || match);
}

function repairKnownGoogleConversions(source: string, translated: string): string {
  let result = translated;
  if (/\bl2 inch pieces\b/i.test(source)) {
    result = result.replace(/\bcentymetrowe kawałki\b/i, '2-calowe kawałki');
  }
  if (/\b1\/2 tablespoon\b/i.test(source) && !quantitiesMatch(source, result)) {
    result = result.replace(/(łyżk(?:ę|i|a))/i, '1/2 $1');
  }
  return result;
}

async function translateGoogleText(text: string, target: TranslationLanguage, source: TranslationLanguage): Promise<string> {
  if (!text.trim()) return text;
  const endpoint = new URL('https://clients5.google.com/translate_a/t');
  endpoint.searchParams.set('client', 'dict-chrome-ex');
  endpoint.searchParams.set('sl', source);
  endpoint.searchParams.set('tl', target);
  endpoint.searchParams.set('q', text);
  const response = await fetch(endpoint);
  if (!response.ok) throw new Error(`Free translator returned HTTP ${response.status}`);
  const payload = await response.json() as GoogleTranslateResponse | string[];
  const translated = Array.isArray(payload)
    ? payload.join('')
    : payload.sentences?.map((sentence) => sentence.trans || '').join('') || '';
  if (!translated.trim()) throw new Error('Free translator returned an empty response');
  return translated.trim();
}

async function translateGoogleLines(lines: string[], target: TranslationLanguage, source: TranslationLanguage): Promise<string[]> {
  const translated = [...lines];
  const entries = lines
    .map((text, index) => {
      const normalized = text.replace(/\r?\n/g, ' ').trim();
      const quantities = maskGoogleQuantities(normalized);
      return { index, text: normalized, masked: quantities.masked, tokens: quantities.tokens };
    })
    .filter((entry) => entry.text);
  for (let cursor = 0; cursor < entries.length;) {
    const chunk: typeof entries = [];
    let length = 0;
    while (cursor < entries.length && (chunk.length === 0 || length + entries[cursor].text.length + 1 <= 3500)) {
      const entry = entries[cursor];
      chunk.push(entry);
      length += entry.text.length + 1;
      cursor += 1;
    }
    const response = await translateGoogleText(chunk.map((entry) => entry.masked).join('\n'), target, source);
    let values = response.split(/\r?\n/);
    if (values.length !== chunk.length) {
      values = [];
      for (const entry of chunk) values.push(await translateGoogleText(entry.masked, target, source));
    }
    chunk.forEach((entry, index) => {
      translated[entry.index] = repairKnownGoogleConversions(
        entry.text,
        restoreGoogleQuantities(values[index].trim(), entry.tokens),
      );
    });
  }
  return translated;
}

function isLikelyPolish(text: string): boolean {
  return /[ąćęłńóśźż]/i.test(text) || /\b(?:dania|mięsa|pieczywo|makarony|desery|zupy|sałatki|śniadania|ryby|włoska|domowa|azjatycka)\b/i.test(text);
}

async function translateWithFreeGoogle(recipe: RawRecipe): Promise<{ pl: LocalizedRecipeText; en: LocalizedRecipeText }> {
  const source = sourceRecipeText(recipe);
  const fields = [
    source.title,
    source.subtitle || '',
    source.category || '',
    source.cuisine || '',
    ...source.ingredients,
    ...source.steps,
  ];
  const plFields = await translateGoogleLines(fields, 'pl', 'en');
  const enFields = [...fields];
  for (let index = 0; index < fields.length; index += 1) {
    if (isLikelyPolish(fields[index])) enFields[index] = await translateGoogleText(fields[index], 'en', 'pl');
  }
  const makeText = (values: string[]): LocalizedRecipeText => ({
    title: values[0] || source.title,
    subtitle: source.subtitle ? values[1] || source.subtitle : undefined,
    category: source.category ? values[2] || source.category : undefined,
    cuisine: source.cuisine ? values[3] || source.cuisine : undefined,
    ingredients: values.slice(4, 4 + source.ingredients.length),
    steps: values.slice(4 + source.ingredients.length),
  });
  return {
    pl: alignOptionalMetadata(source, makeText(plFields), 'pl') as LocalizedRecipeText,
    en: alignOptionalMetadata(source, makeText(enFields), 'en') as LocalizedRecipeText,
  };
}

async function generateLocalContent(prompt: string, model: string, container: string): Promise<string> {
  const response = await new Promise<string>((resolve, reject) => {
    const child = spawn(
      'docker',
      ['exec', '-i', container, 'python', '-c', LOCAL_OLLAMA_BRIDGE],
      { stdio: ['pipe', 'pipe', 'pipe'] },
    );
    let stdout = '';
    let stderr = '';
    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stdout.on('data', (chunk: string) => { stdout += chunk; });
    child.stderr.on('data', (chunk: string) => { stderr += chunk; });
    child.once('error', reject);
    child.once('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Local Ollama bridge failed (${code}): ${stderr.trim() || 'unknown error'}`));
        return;
      }
      resolve(stdout);
    });
    child.stdin.end(JSON.stringify({
      model,
      prompt,
      stream: false,
      format: 'json',
      think: false,
      options: {
        temperature: 0.1,
        num_ctx: Number(process.env.OLLAMA_CONTEXT || '8192'),
      },
    }));
  });
  const payload = JSON.parse(response) as { response?: string; thinking?: string };
  const text = payload.response?.trim() || payload.thinking?.trim() || '';
  if (!text) throw new Error('Local Ollama returned an empty response');
  return text;
}

function localizedField(value: unknown, language: TranslationLanguage): string | undefined {
  if (typeof value === 'string') return value.trim();
  if (!value || typeof value !== 'object') return undefined;
  const candidate = value as Record<string, unknown>;
  return typeof candidate[language] === 'string' ? candidate[language].trim() : undefined;
}

function normalizeLocalText(value: unknown, language: TranslationLanguage): Record<string, unknown> | null {
  if (!value || typeof value !== 'object') return null;
  const candidate = value as Record<string, unknown>;
  const ingredients = Array.isArray(candidate.ingredients)
    ? candidate.ingredients.map((item) => localizedField(item, language) || '')
    : [];
  const steps = Array.isArray(candidate.steps)
    ? candidate.steps.map((item) => localizedField(item, language) || '')
    : [];
  return {
    title: localizedField(candidate.title, language) || '',
    subtitle: localizedField(candidate.subtitle, language) || '',
    category: localizedField(candidate.category, language) || '',
    cuisine: localizedField(candidate.cuisine, language) || '',
    ingredients,
    steps,
  };
}

function normalizeLocalResult(value: unknown): unknown {
  if (!value || typeof value !== 'object') return value;
  const candidate = value as Record<string, unknown>;
  const keyedRecipes = Object.entries(candidate)
    .filter(([, item]) => item && typeof item === 'object' && ('pl' in (item as object) || 'en' in (item as object)))
    .map(([id, item]) => ({ id, item }));
  const rawRecipes = Array.isArray(candidate.recipes)
    ? candidate.recipes.map((item) => ({ id: undefined, item }))
    : candidate.recipe && typeof candidate.recipe === 'object'
      ? [{ id: undefined, item: candidate }]
      : candidate.pl && typeof candidate.pl === 'object' && candidate.en && typeof candidate.en === 'object'
        ? [{ id: undefined, item: candidate }]
        : candidate.title || candidate.ingredients || candidate.steps
          ? [{ id: undefined, item: candidate }]
          : keyedRecipes;
  if (!rawRecipes.length) return value;
  return {
    recipes: rawRecipes.map(({ id: keyedId, item }) => {
      if (!item || typeof item !== 'object') return item;
      const record = item as Record<string, unknown>;
      const source = record.recipe && typeof record.recipe === 'object' ? record.recipe : record;
      return {
        ...(typeof record.id === 'string' ? { id: record.id } : keyedId ? { id: keyedId } : {}),
        pl: record.pl && typeof record.pl === 'object'
          ? normalizeLocalText(record.pl, 'pl')
          : normalizeLocalText(source, 'pl'),
        en: record.en && typeof record.en === 'object'
          ? normalizeLocalText(record.en, 'en')
          : normalizeLocalText(source, 'en'),
      };
    }),
  };
}

function optionalText(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

const ENGLISH_CATEGORY_FALLBACKS: Record<string, string> = {
  dania: 'Dishes',
  mięsa: 'Meat',
  pieczywo: 'Bread',
  makarony: 'Pasta',
  desery: 'Desserts',
  zupy: 'Soups',
  sałatki: 'Salads',
  śniadania: 'Breakfast',
  ryby: 'Fish',
  'dania jednogarnkowe': 'One-pot dishes',
};

const ENGLISH_CUISINE_FALLBACKS: Record<string, string> = {
  włoska: 'Italian',
  domowa: 'Home-style',
  azjatycka: 'Asian',
};

function metadataFallback(
  field: 'category' | 'cuisine',
  sourceValue: string | undefined,
  translatedValue: string | undefined,
  language: TranslationLanguage,
): string | undefined {
  if (!sourceValue) return undefined;
  if (language === 'pl') return translatedValue || sourceValue;
  const key = sourceValue.toLocaleLowerCase('pl-PL');
  const fallback = (field === 'category' ? ENGLISH_CATEGORY_FALLBACKS[key] : ENGLISH_CUISINE_FALLBACKS[key]) || sourceValue;
  if (!translatedValue || translatedValue.toLocaleLowerCase('pl-PL') === key) return fallback;
  return translatedValue;
}

function asLocalizedText(value: unknown): LocalizedRecipeText | null {
  if (!value || typeof value !== 'object') return null;
  const candidate = value as Record<string, unknown>;
  if (typeof candidate.title !== 'string') return null;
  if (candidate.subtitle !== undefined && typeof candidate.subtitle !== 'string') return null;
  if (candidate.category !== undefined && typeof candidate.category !== 'string') return null;
  if (candidate.cuisine !== undefined && typeof candidate.cuisine !== 'string') return null;
  if (!Array.isArray(candidate.ingredients) || !candidate.ingredients.every((item) => typeof item === 'string')) {
    return null;
  }
  if (!Array.isArray(candidate.steps) || !candidate.steps.every((item) => typeof item === 'string')) {
    return null;
  }
  return {
    title: candidate.title.trim(),
    subtitle: optionalText(candidate.subtitle),
    category: optionalText(candidate.category),
    cuisine: optionalText(candidate.cuisine),
    ingredients: candidate.ingredients.map((item) => item.trim()),
    steps: candidate.steps.map((item) => item.trim()),
  };
}

function localizedTextKey(value: LocalizedRecipeText): string {
  return JSON.stringify({
    title: value.title,
    subtitle: value.subtitle,
    category: value.category,
    cuisine: value.cuisine,
    ingredients: value.ingredients,
    steps: value.steps,
  });
}

function translationIssue(source: LocalizedRecipeText, translation: LocalizedRecipeText | null): string {
  if (!translation) return 'missing or malformed translation';
  if (!translation.title.trim()) return 'empty title';
  if (source.ingredients.length !== translation.ingredients.length) return 'ingredient count mismatch';
  if (source.steps.length !== translation.steps.length) return 'step count mismatch';
  if (translation.ingredients.some((line) => !line.trim())) return 'empty ingredient line';
  if (translation.steps.some((line) => !line.trim())) return 'empty step line';
  if (Boolean(source.subtitle) !== Boolean(translation.subtitle)) return 'subtitle presence mismatch';
  if (Boolean(source.category) !== Boolean(translation.category)) return 'category presence mismatch';
  if (Boolean(source.cuisine) !== Boolean(translation.cuisine)) return 'cuisine presence mismatch';
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
  for (let index = 0; index < sourceTexts.length; index += 1) {
    if (!quantitiesMatch(sourceTexts[index], translatedTexts[index] || '')) {
      return `quantity mismatch at field ${index + 1}: source=${JSON.stringify(sourceTexts[index])} translated=${JSON.stringify(translatedTexts[index] || '')}`;
    }
  }
  return 'unknown translation validation mismatch';
}

function alignOptionalMetadata(
  source: LocalizedRecipeText,
  translation: LocalizedRecipeText | null,
  language: TranslationLanguage,
): LocalizedRecipeText | null {
  if (!translation) return null;
  return {
    ...translation,
    subtitle: source.subtitle ? translation.subtitle : undefined,
    category: metadataFallback('category', source.category, translation.category, language),
    cuisine: metadataFallback('cuisine', source.cuisine, translation.cuisine, language),
  };
}

function isUsableCacheEntry(value: unknown, source: LocalizedRecipeText): value is TranslationCacheEntry {
  if (!value || typeof value !== 'object') return false;
  const entry = value as Record<string, unknown>;
  const cachedSource = asLocalizedText(entry.source);
  const pl = asLocalizedText(entry.pl);
  const en = asLocalizedText(entry.en);
  return Boolean(
    cachedSource &&
    localizedTextKey(cachedSource) === localizedTextKey(source) &&
    isCompleteRecipeTranslation(source, pl) &&
    isCompleteRecipeTranslation(source, en),
  );
}

function promptForRecipes(recipes: RawRecipe[]): string {
  const source = recipes.map((recipe) => ({
    id: recipe.id,
    recipe: sourceRecipeText(recipe),
  }));
  return `You are a professional Polish-English culinary translator. Translate every complete recipe below into BOTH Polish (pl) and English (en).

Rules:
- Return results in exactly the same order as the input recipes.
- Translate every natural-language word in the title, every ingredient line, and every cooking step.
- Translate subtitle, category, and cuisine too when they are present; keep them empty when the source is empty.
- Preserve brand names, proper names, dish names, temperatures, times, quantities, fractions, ranges, abbreviations, and the exact number of list items.
- Never convert, recalculate, or add metric/imperial equivalents; preserve every numeric value and unit exactly as written in the source.
- Preserve ordinal meanings such as 3rd/third as an ordinal (trzeci), never rewrite them as a fraction such as 1/3.
- Do not summarize, explain, add, remove, reorder, or merge anything.
- Keep the meaning and cooking technique exact. Use natural cookbook language in the target language.
- If a piece is already in the requested language, keep it, correcting only obvious grammar or spacing without changing content.
- Return JSON only, match the requested structure exactly, and never combine two recipes.

Source recipes:
${JSON.stringify(source, null, 2)}`;
}

async function translateRecipes(
  ai: GoogleGenAI | null,
  recipes: RawRecipe[],
  model: string,
  provider: TranslationProvider,
  localContainer: string,
): Promise<Map<string, { pl: LocalizedRecipeText; en: LocalizedRecipeText }>> {
  if (provider === 'google-free') {
    const translated = new Map<string, { pl: LocalizedRecipeText; en: LocalizedRecipeText }>();
    for (const recipe of recipes) translated.set(recipe.id, await translateWithFreeGoogle(recipe));
    return translated;
  }
  const prompt = promptForRecipes(recipes);
  const responseText = provider === 'local'
    ? await generateLocalContent(prompt, model, localContainer)
    : (await ai!.models.generateContent({
      model,
      contents: prompt,
      config: {
        temperature: 0.1,
        seed: 17,
        responseMimeType: 'application/json',
        responseSchema,
      },
    })).text || '';

  let parsed: unknown;
  try {
    parsed = JSON.parse(responseText);
  } catch {
    throw new Error(`${provider === 'local' ? 'Local Ollama' : 'Gemini'} returned invalid JSON for batch starting ${recipes[0]?.id}`);
  }
  if (provider === 'local') parsed = normalizeLocalResult(parsed);
  if (!parsed || typeof parsed !== 'object') throw new Error(`Gemini returned no translation for batch starting ${recipes[0]?.id}`);
  const result = parsed as Record<string, unknown>;
  if (!Array.isArray(result.recipes) || result.recipes.length !== recipes.length) {
    if (provider === 'local' && process.env.DEBUG_LOCAL_TRANSLATION === '1') console.error(JSON.stringify(parsed, null, 2));
    throw new Error(`Translation validation failed for batch starting ${recipes[0]?.id}: result count mismatch`);
  }
  const inputById = new Map(recipes.map((recipe) => [recipe.id, recipe]));
  const translated = new Map<string, { pl: LocalizedRecipeText; en: LocalizedRecipeText }>();
  for (const [index, item] of (result.recipes as unknown[]).entries()) {
    if (!item || typeof item !== 'object') throw new Error('Gemini returned an invalid recipe result');
    const candidate = item as Record<string, unknown>;
    const expectedRecipe = recipes[index];
    const returnedId = typeof candidate.id === 'string' ? candidate.id : '';
    if (returnedId && returnedId !== expectedRecipe.id) {
      throw new Error(`Translation validation failed: result order/id mismatch for ${expectedRecipe.id}`);
    }
    const id = expectedRecipe.id;
    const sourceRecipe = inputById.get(id);
    const source = sourceRecipe ? sourceRecipeText(sourceRecipe) : null;
    const pl = source ? alignOptionalMetadata(source, asLocalizedText(candidate.pl), 'pl') : null;
    const en = source ? alignOptionalMetadata(source, asLocalizedText(candidate.en), 'en') : null;
    if (!source || translated.has(id) || !isCompleteRecipeTranslation(source, pl) || !isCompleteRecipeTranslation(source, en)) {
      if (!source) throw new Error(`Translation validation failed for ${id}: unknown recipe`);
      throw new TranslationValidationError(
        id,
        source,
        pl,
        en,
        `Translation validation failed for ${id}: pl=${translationIssue(source, pl)}; en=${translationIssue(source, en)}`,
      );
    }
    translated.set(id, { pl, en });
  }
  if (translated.size !== recipes.length) throw new Error('Translation validation failed: missing recipe result');
  return translated;
}

function repairPrompt(recipe: RawRecipe, failed: TranslationValidationError): string {
  const sourceFields = [
    failed.source.title,
    failed.source.subtitle || '',
    failed.source.category || '',
    failed.source.cuisine || '',
    ...failed.source.ingredients,
    ...failed.source.steps,
  ];
  const quantityLedger = sourceFields
    .map((text, index) => ({ field: index + 1, quantities: quantityTokens(text), source: text }))
    .filter((entry) => entry.quantities.length > 0);
  return `You are repairing one Polish-English culinary translation. Return a corrected JSON object with pl and en.

Rules:
- Keep the exact title, ingredient count, step count, order, quantities, units, temperatures, times, fractions, ranges, and ordinal meanings from the source.
- The quantity ledger below is authoritative. For every listed field, preserve every listed numeric token and fraction in both languages; do not add a number, remove a number, convert a numeral to a different value, or turn an ordinal into a fraction.
- Do not add conversions, percentages, explanations, or new information.
- Translate every natural-language word in every title, ingredient, and step.
- Keep source-empty subtitle/category/cuisine fields empty.
- Correct the previous candidate rather than summarizing it.

Source recipe:
${JSON.stringify({ id: recipe.id, recipe: failed.source }, null, 2)}

Quantity ledger:
${JSON.stringify(quantityLedger, null, 2)}

Previous candidate:
${JSON.stringify({ pl: failed.pl, en: failed.en }, null, 2)}`;
}

async function repairRecipe(
  ai: GoogleGenAI | null,
  recipe: RawRecipe,
  failed: TranslationValidationError,
  model: string,
  provider: TranslationProvider,
  localContainer: string,
): Promise<{ pl: LocalizedRecipeText; en: LocalizedRecipeText }> {
  if (provider === 'google-free') return translateWithFreeGoogle(recipe);
  const prompt = repairPrompt(recipe, failed);
  const responseText = provider === 'local'
    ? await generateLocalContent(prompt, model, localContainer)
    : (await ai!.models.generateContent({
      model,
      contents: prompt,
      config: {
        temperature: 0.1,
        seed: 29,
        responseMimeType: 'application/json',
        responseSchema: singleResponseSchema,
      },
    })).text || '';
  let parsed: unknown;
  try {
    parsed = JSON.parse(responseText);
  } catch {
    throw new Error(`Gemini returned invalid repair JSON for ${recipe.id}`);
  }
  if (!parsed || typeof parsed !== 'object') throw new Error(`Gemini returned no repair for ${recipe.id}`);
  let candidate = parsed as Record<string, unknown>;
  if (provider === 'local') {
    const normalized = normalizeLocalResult(parsed);
    if (normalized && typeof normalized === 'object' && Array.isArray((normalized as Record<string, unknown>).recipes)) {
      const first = (normalized as { recipes: unknown[] }).recipes[0];
      if (first && typeof first === 'object') candidate = first as Record<string, unknown>;
    }
  }
  const pl = alignOptionalMetadata(failed.source, asLocalizedText(candidate.pl), 'pl');
  const en = alignOptionalMetadata(failed.source, asLocalizedText(candidate.en), 'en');
  if (!isCompleteRecipeTranslation(failed.source, pl) || !isCompleteRecipeTranslation(failed.source, en)) {
    throw new Error(`Translation repair validation failed for ${recipe.id}: pl=${translationIssue(failed.source, pl)}; en=${translationIssue(failed.source, en)}`);
  }
  return { pl, en };
}

async function withRetry<T>(operation: () => Promise<T>): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (/Translation (?:repair )?validation failed|invalid recipe result|missing recipe result/i.test(String(error))) {
        throw error;
      }
      if (attempt < 4) {
        const message = String(error);
        const delay = /429|rate limit/i.test(message)
          ? 10_000 * 2 ** (attempt - 1)
          : /503|UNAVAILABLE|high demand|temporarily unavailable/i.test(message)
          ? 30_000 * 2 ** (attempt - 1)
          : 750 * 2 ** (attempt - 1);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }
  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

async function readJson<T>(filePath: string, fallback: T): Promise<T> {
  try {
    return JSON.parse(await readFile(filePath, 'utf8')) as T;
  } catch {
    return fallback;
  }
}

function applyCache(recipe: RawRecipe, entry: TranslationCacheEntry | undefined): RawRecipe {
  if (!entry) return recipe;
  return {
    ...recipe,
    title_pl: entry.pl.title,
    subtitle_pl: entry.pl.subtitle,
    category_pl: entry.pl.category,
    cuisine_pl: entry.pl.cuisine,
    ingredients_pl: entry.pl.ingredients,
    steps_pl: entry.pl.steps,
    title_en: entry.en.title,
    subtitle_en: entry.en.subtitle,
    category_en: entry.en.category,
    cuisine_en: entry.en.cuisine,
    ingredients_en: entry.en.ingredients,
    steps_en: entry.en.steps,
    translations: { pl: entry.pl, en: entry.en },
  };
}

async function main() {
  const recipes = await readJson<RawRecipe[]>(INPUT_PATH, []);
  if (!recipes.length) throw new Error(`Missing or empty ${INPUT_PATH}. Run scripts/export_mvp_mobile_catalog.py first.`);

  const cache = await readJson<Record<string, TranslationCacheEntry>>(CACHE_PATH, {});
  const force = hasFlag('--force');
  const validateOnly = hasFlag('--validate-only');
  const onlyId = argumentValue('--id', '');
  const provider = argumentValue('--provider', 'gemini') as TranslationProvider;
  const limit = Number(argumentValue('--limit', '0')) || 0;
  const scopedRecipes = onlyId ? recipes.filter((recipe) => recipe.id === onlyId) : recipes;
  const candidates = (limit > 0 ? scopedRecipes.slice(0, limit) : scopedRecipes).filter((recipe) => {
    const source = sourceRecipeText(recipe);
    return force || !isUsableCacheEntry(cache[recipe.id], source);
  });

  const invalid = scopedRecipes.filter((recipe) => !isUsableCacheEntry(cache[recipe.id], sourceRecipeText(recipe)));
  if (!['gemini', 'local', 'google-free'].includes(provider)) {
    throw new Error(`Unsupported translation provider: ${provider}. Use gemini, local, or google-free.`);
  }
  const model = provider === 'local'
    ? argumentValue('--local-model', DEFAULT_LOCAL_MODEL)
    : provider === 'google-free'
      ? 'google-translate-free'
      : argumentValue('--model', DEFAULT_MODEL);
  const localContainer = argumentValue('--ollama-container', DEFAULT_OLLAMA_CONTAINER);
  console.log(`catalog=${recipes.length} translated=${scopedRecipes.length - invalid.length} pending=${candidates.length} provider=${provider} model=${model}`);
  if (validateOnly) {
    if (invalid.length) {
      console.error(`Missing or invalid translations: ${invalid.length}`);
      console.error(invalid.slice(0, 10).map((recipe) => recipe.id).join('\n'));
      process.exitCode = 1;
    }
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (provider === 'gemini' && !apiKey) throw new Error('Set GEMINI_API_KEY before running npm run translate:catalog.');

  const ai = provider === 'gemini' ? new GoogleGenAI({ apiKey: apiKey! }) : null;
  const concurrency = Math.max(1, Math.min(8, Number(argumentValue('--concurrency', provider === 'local' || provider === 'google-free' ? '1' : '4')) || 1));
  const batchSize = Math.max(1, Math.min(8, Number(argumentValue('--batch-size', provider === 'google-free' ? '1' : '5')) || 1));
  const delayMs = Math.max(0, Number(argumentValue('--delay-ms', provider === 'google-free' ? '200' : '0')) || 0);
  let cursor = 0;
  let completed = 0;
  const failedRecipes: Array<{ id: string; error: string }> = [];
  let cacheWrite = Promise.resolve();
  let requestGate = Promise.resolve();
  let nextRequestAt = 0;

  async function waitForRequestSlot() {
    const previous = requestGate;
    let release!: () => void;
    requestGate = new Promise<void>((resolve) => {
      release = resolve;
    });
    await previous;
    const waitMs = Math.max(0, nextRequestAt - Date.now());
    if (waitMs > 0) await new Promise((resolve) => setTimeout(resolve, waitMs));
    nextRequestAt = Date.now() + delayMs;
    release();
  }

  const persistCache = () => {
    cacheWrite = cacheWrite.then(() => writeFile(CACHE_PATH, JSON.stringify(cache, null, 2) + '\n', 'utf8'));
    return cacheWrite;
  };

  async function translateBatchWithFallback(batch: RawRecipe[]): Promise<Map<string, { pl: LocalizedRecipeText; en: LocalizedRecipeText }>> {
    try {
      return await withRetry(async () => {
        await waitForRequestSlot();
        return translateRecipes(ai, batch, model, provider, localContainer);
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (batch.length <= 1 && error instanceof TranslationValidationError) {
        const repaired = await withRetry(async () => {
          await waitForRequestSlot();
          return repairRecipe(ai, batch[0], error, model, provider, localContainer);
        });
        return new Map([[batch[0].id, repaired]]);
      }
      if (batch.length <= 1 || /429|quota|RESOURCE_EXHAUSTED|503|UNAVAILABLE|high demand/i.test(message)) throw error;
      const midpoint = Math.ceil(batch.length / 2);
      const left = await translateBatchWithFallback(batch.slice(0, midpoint));
      const right = await translateBatchWithFallback(batch.slice(midpoint));
      return new Map([...left, ...right]);
    }
  }

  async function worker() {
    while (cursor < candidates.length) {
      const batch = candidates.slice(cursor, cursor + batchSize);
      cursor += batch.length;
      let translated: Map<string, { pl: LocalizedRecipeText; en: LocalizedRecipeText }>;
      try {
        translated = await translateBatchWithFallback(batch);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (batch.length === 1) {
          failedRecipes.push({ id: batch[0].id, error: message });
          console.error(`skipped=${batch[0].id} reason=${message}`);
          continue;
        }
        for (const recipe of batch) {
          try {
            const single = await translateBatchWithFallback([recipe]);
            const translation = single.get(recipe.id);
            if (!translation) throw new Error(`Missing translation result for ${recipe.id}`);
            cache[recipe.id] = { source: sourceRecipeText(recipe), ...translation };
            completed += 1;
            if (completed % 10 === 0) {
              console.log(`translated=${completed}/${candidates.length}`);
              await persistCache();
            }
          } catch (singleError) {
            const singleMessage = singleError instanceof Error ? singleError.message : String(singleError);
            failedRecipes.push({ id: recipe.id, error: singleMessage });
            console.error(`skipped=${recipe.id} reason=${singleMessage}`);
          }
        }
        continue;
      }
      for (const recipe of batch) {
        const translation = translated.get(recipe.id);
        if (!translation) throw new Error(`Missing translation result for ${recipe.id}`);
        cache[recipe.id] = { source: sourceRecipeText(recipe), ...translation };
      }
      completed += batch.length;
      if (completed % 10 === 0 || completed === candidates.length) {
        console.log(`translated=${completed}/${candidates.length}`);
        await persistCache();
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, candidates.length) }, worker));
  await persistCache();

  const output = recipes.map((recipe) => applyCache(recipe, cache[recipe.id]));
  const serialized = JSON.stringify(output, null, 0) + '\n';
  await writeFile(INPUT_PATH, serialized, 'utf8');
  await writeFile(PUBLIC_PATH, serialized, 'utf8');
  console.log(`wrote ${output.length} recipes to ${INPUT_PATH} and ${PUBLIC_PATH}`);
  if (failedRecipes.length) {
    console.error(`failed=${failedRecipes.length}`);
    process.exitCode = 1;
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
