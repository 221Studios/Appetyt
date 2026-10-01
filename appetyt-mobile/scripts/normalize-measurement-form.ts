import { readFile } from 'node:fs/promises';
import { convertMeasurementText } from '../src/data/measurements';

const catalogPath = new URL('../public/recipes.json', import.meta.url);
const data = JSON.parse(await readFile(catalogPath, 'utf8')) as Array<Record<string, unknown>>;
const fields = ['ingredients', 'ingredients_pl', 'ingredients_en', 'steps', 'steps_pl', 'steps_en'] as const;

const quantity = String.raw`\d(?:[.,]\d+)?(?:\s+\d+\s*\/\s*\d+|\s*[¼½¾⅓⅔⅛⅜⅝⅞])?`;
const usLeftInEuropean = new RegExp(
  String.raw`${quantity}\s*-?\s*(?:cups?|tablespoons?|teaspoons?|tbsp|tsp|ounces?|oz|pounds?|lbs?|°\s*f|℉|fahrenheit|quarts?|pints?|gallons?|inches|inch|fl\.?\s*oz)\b`,
  'i',
);
const europeanLeftInUs = new RegExp(
  String.raw`${quantity}\s*-?\s*(?:kg|grams?|gramów|gramy|grama|ml|mililitr\w*|litr\w*|\bl\b|°\s*c|℃|celsius|szklan\w+|łyżeczk\w+|łyżk\w+|\bstopni(?:ach|a)?\b|\bcm\b|\bmm\b|\bcal(?:a|e|i)\b)\b`,
  'i',
);

const leftovers = { eu: [] as string[], us: [] as string[] };
const unstable = [] as string[];
let lines = 0;
let rewritten = 0;

for (const recipe of data) {
  for (const field of fields) {
    const list = recipe[field];
    if (!Array.isArray(list)) continue;
    for (const raw of list) {
      if (typeof raw !== 'string' || !raw.trim()) continue;
      lines += 1;
      const european = convertMeasurementText(raw, 'eu');
      const usa = convertMeasurementText(raw, 'us');
      if (european !== raw || usa !== raw) rewritten += 1;
      if (usLeftInEuropean.test(european) && leftovers.eu.length < 20) leftovers.eu.push(european.slice(0, 160));
      if (europeanLeftInUs.test(usa) && leftovers.us.length < 20) leftovers.us.push(usa.slice(0, 160));
      const europeanAgain = convertMeasurementText(european, 'eu');
      const usaAgain = convertMeasurementText(usa, 'us');
      if ((europeanAgain !== european || usaAgain !== usa) && unstable.length < 20) {
        unstable.push(`${european.slice(0, 80)} => ${europeanAgain.slice(0, 80)}`);
      }
    }
  }
}

const euMisses = leftovers.eu.length;
const usMisses = leftovers.us.length;
console.log(JSON.stringify({
  recipes: data.length,
  lines,
  linesRewrittenForAtLeastOneSystem: rewritten,
  europeanLeftoverSamples: leftovers.eu,
  usaLeftoverSamples: leftovers.us,
  unstableSamples: unstable,
}, null, 2));

if (euMisses || usMisses || unstable.length) {
  throw new Error('Measurement form is not consistent across the catalog');
}
