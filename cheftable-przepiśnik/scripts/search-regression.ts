import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  buildRecipeSearchIndex,
  filterRecipes,
  getVisibleRecipeRange,
  SEARCH_PAGE_SIZE,
} from '../src/data/searchCatalog';
import { loadRecipeCatalog, loadRecipeDetails } from '../src/data/realRecipes';

globalThis.fetch = (async (path) => {
  const filePath = path === '/recipes-index.json' ? 'public/recipes-index.json' : 'public/recipes.json';
  return new Response(await readFile(filePath), { status: 200 });
}) as typeof fetch;

const { recipes } = await loadRecipeCatalog('pl');
const searchIndex = buildRecipeSearchIndex(recipes);
const emptyResults = filterRecipes(recipes, searchIndex, '');
const broadResults = filterRecipes(recipes, searchIndex, 'm');
const visibleResults = broadResults.slice(0, SEARCH_PAGE_SIZE);
const [firstWindowItem, lastWindowItem] = getVisibleRecipeRange(recipes.length, 0, 800);
const details = await loadRecipeDetails(recipes[0].id, 'pl');

assert.equal(recipes.length, 2620);
assert.equal(emptyResults.length, recipes.length);
assert.ok(broadResults.length > SEARCH_PAGE_SIZE);
assert.equal(visibleResults.length, SEARCH_PAGE_SIZE);
assert.equal(firstWindowItem, 0);
assert.ok(lastWindowItem <= 20);
assert.ok(details.ingredients.length > 0);
assert.ok(details.steps.length > 0);

console.log(JSON.stringify({
  recipes: recipes.length,
  broadResults: broadResults.length,
  renderedPerPage: visibleResults.length,
  detailIngredients: details.ingredients.length,
  detailSteps: details.steps.length,
}));
