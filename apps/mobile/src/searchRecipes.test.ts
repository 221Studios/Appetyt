import { describe, expect, it } from 'vitest';

import { RecipeSummary } from './api/types';
import { searchRecipes } from './searchRecipes';

const recipes: RecipeSummary[] = [
  {
    id: 'szakszuka-test',
    title: 'Szakszuka ze szpinakiem',
    subtitle: 'Śniadanie',
    category: 'Szybkie dania',
    cuisine: 'Śródziemnomorska',
    creator: null,
    source_url: 'https://example.com/szakszuka',
    duration_minutes: 22,
    servings: 2,
    nutrition_per_serving: { calories: 380, protein_g: 20, fat_g: 22, carbs_g: 28 },
    ingredient_count: 2,
    ingredient_names: ['pomidory krojone', 'jajka'],
  },
  {
    id: 'carbonara-test',
    title: 'Carbonara',
    subtitle: 'Makaron',
    category: 'Makarony',
    cuisine: 'Włoska',
    creator: null,
    source_url: 'https://example.com/carbonara',
    duration_minutes: 25,
    servings: 2,
    nutrition_per_serving: { calories: 620, protein_g: 29, fat_g: 25, carbs_g: 68 },
    ingredient_count: 2,
    ingredient_names: ['makaron spaghetti', 'boczek wędzony'],
  },
];

describe('wyszukiwanie przepisów', () => {
  it('znajduje przepis po nazwie składnika bez względu na wielkość liter', () => {
    expect(searchRecipes(recipes, 'JAJKA').map((recipe) => recipe.id)).toEqual(['szakszuka-test']);
  });
});
