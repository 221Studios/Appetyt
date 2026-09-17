import { describe, expect, it } from 'vitest';

import { findMissingIngredients, isIngredientAvailable } from './ingredientMatching';

describe('dopasowanie składników', () => {
  it('traktuje zapis bez polskich znaków jako alias pełnej nazwy', () => {
    expect(isIngredientAvailable('jabłko', ['Jablko'])).toBe(true);
  });

  it('nie uznaje ogólnej nazwy za konkretny składnik', () => {
    expect(isIngredientAvailable('Masło', ['masło orzechowe'])).toBe(false);
  });

  it('dopasowuje pełną nazwę bez względu na wielkość liter', () => {
    expect(isIngredientAvailable('masło orzechowe', ['MASŁO ORZECHOWE'])).toBe(true);
  });

  it('uznaje bezpieczne aliasy ogólnych składników startowych', () => {
    expect(isIngredientAvailable('makaron spaghetti', ['Makaron'])).toBe(true);
    expect(isIngredientAvailable('boczek wędzony', ['Boczek'])).toBe(true);
    expect(isIngredientAvailable('pomidory krojone', ['Pomidory'])).toBe(true);
    expect(isIngredientAvailable('ryż biały', ['Ryż'])).toBe(true);
    expect(isIngredientAvailable('szpinak baby', ['Szpinak'])).toBe(true);
  });

  it('nie dodaje aliasów posiadanych składników do zakupów', () => {
    const ingredients = [
      { name: 'makaron spaghetti' },
      { name: 'boczek wędzony' },
      { name: 'pomidory krojone' },
      { name: 'ryż biały' },
      { name: 'szpinak baby' },
      { name: 'ser pecorino' },
    ];

    expect(findMissingIngredients(ingredients, ['Makaron', 'Boczek', 'Pomidory', 'Ryż', 'Szpinak'])).toEqual([
      { name: 'ser pecorino' },
    ]);
  });
});
