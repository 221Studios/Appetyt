import { describe, expect, it } from 'vitest';

import { RecipeSummary } from './api/types';
import { recipeMatchesCategory, recipesForChef, seedForCategory } from './referenceLook';

function recipe(partial: Partial<RecipeSummary> & Pick<RecipeSummary, 'id' | 'title'>): RecipeSummary {
  return {
    subtitle: null,
    category: 'obiad',
    cuisine: null,
    creator: null,
    source_url: 'https://example.com',
    duration_minutes: 20,
    servings: 2,
    nutrition_per_serving: { calories: 400, protein_g: 10, fat_g: 10, carbs_g: 40 },
    ingredient_count: 1,
    ingredient_names: ['jajka'],
    ...partial,
  };
}

describe('kategorie i szefowie', () => {
  it('dopasowuje szybkie obiady po czasie', () => {
    expect(recipeMatchesCategory(recipe({ id: 'a', title: 'Jajecznica', duration_minutes: 15 }), 'Szybkie obiady (<25 min)')).toBe(true);
    expect(recipeMatchesCategory(recipe({ id: 'b', title: 'Pieczeń', duration_minutes: 90 }), 'Szybkie obiady (<25 min)')).toBe(false);
  });

  it('filtruje przepisy szefa po autorze z półki', () => {
    const carbonara = recipe({ id: 'c', title: 'Carbonara' });
    const soup = recipe({ id: 'z', title: 'Zupa pomidorowa' });
    expect(recipesForChef([carbonara, soup], 'Tomasz Jakubiak').map((item) => item.id)).toEqual(['c']);
  });

  it('zamienia kategorię na filtr wyszukiwania', () => {
    expect(seedForCategory('Makarony & Risotto')).toEqual({ query: 'makaron', cuisine: 'Włoska' });
    expect(seedForCategory('Szybkie obiady (<25 min)').maxTime).toBe('30');
  });
});
