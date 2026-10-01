import assert from 'node:assert/strict';
import { loadRecipeCatalog } from '../src/data/realRecipes';
import { isCompleteRecipeTranslation, resolveRecipeText } from '../src/data/recipeTranslation';

const sourceRecipe = {
  id: 'translation-regression',
  title: 'English title',
  category: 'Dessert',
  category_pl: 'Deser',
  category_en: 'Dessert',
  title_pl: 'Polski tytuł',
  creator_id: 'foxx_gotuje',
  source_url: 'https://example.test/recipe',
  ingredients: ['1 cup flour', '2 eggs'],
  ingredients_pl: ['1 szklanka mąki', '2 jajka'],
  steps: ['Mix the flour.', 'Add the eggs.'],
  steps_pl: ['Wymieszaj mąkę.', 'Dodaj jajka.'],
  title_en: 'English title',
  ingredients_en: ['1 cup flour', '2 eggs'],
  steps_en: ['Mix the flour.', 'Add the eggs.'],
};

const originalFetch = globalThis.fetch;
globalThis.fetch = async () =>
  new Response(JSON.stringify([sourceRecipe]), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });

try {
  const { recipes } = await loadRecipeCatalog();
  const recipe = recipes[0];

  assert.equal(recipe.title, 'Polski tytuł');
  assert.equal(recipe.category, 'Deser');
  assert.deepEqual(
    recipe.ingredients.map((ingredient) => ingredient.name),
    ['1 szklanka mąki', '2 jajka'],
  );
  assert.deepEqual(
    recipe.steps.map((step) => step.description),
    ['Wymieszaj mąkę.', 'Dodaj jajka.'],
  );

  const englishCatalog = await loadRecipeCatalog('en');
  const englishRecipe = englishCatalog.recipes[0];
  assert.equal(englishRecipe.title, 'English title');
  assert.equal(englishRecipe.category, 'Dessert');
  assert.deepEqual(
    englishRecipe.ingredients.map((ingredient) => ingredient.name),
    ['1 cup flour', '2 eggs'],
  );
  assert.deepEqual(
    englishRecipe.steps.map((step) => step.description),
    ['Mix the flour.', 'Add the eggs.'],
  );

  assert.equal(
    isCompleteRecipeTranslation(
      { title: '1/2 cup soup', ingredients: ['2 eggs'], steps: ['Cook for 5 minutes.'] },
      { title: '½ szklanki zupy', ingredients: ['2 jajka'], steps: ['Gotuj przez 5 minut.'] },
    ),
    true,
  );
  assert.equal(
    isCompleteRecipeTranslation(
      { title: '1 cup soup', ingredients: ['2 eggs'], steps: ['Cook for 5 minutes.'] },
      { title: '1 szklanka zupy', ingredients: ['1 jajko'], steps: ['Gotuj przez 5 minut.'] },
    ),
    false,
  );
  assert.equal(
    isCompleteRecipeTranslation(
      { title: 'Cake', ingredients: ['1 egg'], steps: ['Bake.'], category: 'Dessert' },
      { title: 'Ciasto', ingredients: ['1 jajko'], steps: ['Piecz.'] },
    ),
    false,
  );
  assert.equal(
    isCompleteRecipeTranslation(
      { title: 'Dinner', ingredients: ['100,000 Scoville'], steps: ['Start at 10am.', 'Cook on the second side.'] },
      { title: 'Kolacja', ingredients: ['100 000 w skali Scoville’a'], steps: ['Zacznij o 10:00.', 'Gotuj z drugiej strony.'] },
    ),
    true,
  );
  assert.equal(
    isCompleteRecipeTranslation(
      { title: 'Dinner', ingredients: ['3rd portion'], steps: ['Use 1/3 of the sauce.'] },
      { title: 'Kolacja', ingredients: ['trzecia porcja'], steps: ['Użyj 1/3 sosu.'] },
    ),
    true,
  );

  const partial = resolveRecipeText(
    {
      title: 'Leftover Celery & Chicken Stir Fry',
      ingredients: ['2 cups leftover chicken', '4 celery stalks'],
      steps: ['Heat the pan.', 'Stir-fry the celery.'],
      title_pl: 'Stir-fry z selerem i resztkami kurczaka',
      ingredients_pl: ['2 szklanki resztek kurczaka', '4 łodygi selera'],
      steps_pl: [],
    },
    'pl',
  );
  assert.equal(partial.title, 'Stir-fry z selerem i resztkami kurczaka');
  assert.deepEqual(partial.ingredients, ['2 szklanki resztek kurczaka', '4 łodygi selera']);
  assert.deepEqual(partial.steps, ['Heat the pan.', 'Stir-fry the celery.']);

  console.log('translation regression: passed');
} finally {
  globalThis.fetch = originalFetch;
}
