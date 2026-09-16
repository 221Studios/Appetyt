import { describe, expect, it } from 'vitest';

import { isIngredientAvailable } from './ingredientMatching';

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
});
