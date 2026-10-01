import assert from 'node:assert/strict';
import { convertMeasurementText } from '../src/data/measurements';

const cases: Array<[string, 'eu' | 'us', string]> = [
  ['2 cup tepid water', 'eu', '480 ml tepid water'],
  ['2 cup tepid water', 'us', '2 cups tepid water'],
  ['1 pound ground beef', 'eu', '454 g ground beef'],
  ['200 g mąki', 'us', '7 oz mąki'],
  ['200 g mąki', 'eu', '200 g mąki'],
  ['Preheat the oven to 400°F (205°C).', 'eu', 'Preheat the oven to 205°C.'],
  ['Preheat the oven to 400°F (205°C).', 'us', 'Preheat the oven to 400°F.'],
  ['wypiekaj w 180 stopniach przez 25 minut', 'us', 'wypiekaj w 350°F przez 25 minut'],
  ['wypiekaj w 180 stopniach przez 25 minut', 'eu', 'wypiekaj w 180°C przez 25 minut'],
  ['rotate 90 degrees and press', 'eu', 'rotate 90 degrees and press'],
  ['Preheat oven to 300 degrees.', 'eu', 'Preheat oven to 149°C.'],
  ['¾ szklanki majonezu', 'eu', '188 ml majonezu'],
  ['¾ szklanki majonezu', 'us', '¾ cup majonezu'],
  ['2 łyżki kwaśnych pikli', 'eu', '30 ml kwaśnych pikli'],
  ['2 łyżki kwaśnych pikli', 'us', '2 tbsp kwaśnych pikli'],
  ['2cm oleju', 'us', '¾ inch oleju'],
  ['2cm oleju', 'eu', '2 cm oleju'],
  ['1 - 1.5 ounce packet', 'eu', '28-43 g packet'],
  ['Bake until tender, about 50–60 minutes', 'eu', 'Bake until tender, about 50–60 minutes'],
  ['1 large russet potato', 'eu', '1 large russet potato'],
  ['4 ½ teaspoon instant yeast', 'eu', '23 ml instant yeast'],
  ['4 ½ teaspoon instant yeast', 'us', '1 ½ tbsp instant yeast'],
  ['1.25 cups (295g) water', 'eu', '295 g water'],
  ['1.25 cups (295g) water', 'us', '1 ¼ cups water'],
  ['720g wody, podgrzanej do 90°F (32°C)', 'eu', '720 g wody, podgrzanej do 32°C'],
  ['720g wody, podgrzanej do 90°F (32°C)', 'us', '1.6 lb wody, podgrzanej do 90°F'],
  ['3-4 tbsp oil', 'us', '3-4 tbsp oil'],
  ['1.5 kg pork', 'us', '53 oz pork'],
  ['increase the temperature to 475℉ / 246℃.', 'eu', 'increase the temperature to 246°C.'],
  ['increase the temperature to 475℉ / 246℃.', 'us', 'increase the temperature to 475°F.'],
  ['1 stick salted butter', 'eu', '113 g salted butter'],
  ['2 sticks unsalted butter', 'eu', '227 g unsalted butter'],
  ['1 stick salted butter', 'us', '1 stick salted butter'],
  ['1 cinnamon stick', 'eu', '1 cinnamon stick'],
  ['paski o grubości 1 cala', 'us', 'paski o grubości 1 inch'],
  ['3 gallons (11.5L) of water', 'eu', '11.5 l of water'],
  ['3 gallons (11.5L) of water', 'us', '3 gallons of water'],
  ['½ cup milk', 'eu', '120 ml milk'],
  ['½ cup milk', 'us', '½ cup milk'],
];

for (const [input, system, expected] of cases) {
  const actual = convertMeasurementText(input, system);
  assert.equal(actual, expected, `${system}: ${input} -> ${actual}`);
}

const englishEuropean = convertMeasurementText('2 cups flour and bake at 350°F', 'eu');
const polishEuropean = convertMeasurementText('2 cups mąki i piecz w 350°F', 'eu');
assert.match(englishEuropean, /480 ml/);
assert.match(englishEuropean, /177°C/);
assert.match(polishEuropean, /480 ml/);
assert.doesNotMatch(polishEuropean, /cup/);
assert.match(convertMeasurementText('200 g mąki', 'us'), /oz/);
assert.match(convertMeasurementText('200 g flour', 'us'), /oz/);

console.log(JSON.stringify({ cases: cases.length, englishEuropean, polishEuropean }));
