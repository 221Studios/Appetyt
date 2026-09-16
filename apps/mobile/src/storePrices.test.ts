import { describe, expect, it } from 'vitest';

import { RecipeDetail, StoreCost } from './api/types';
import { applyLoyalty, cheapestStore, pickCheapestProduct, searchToken, shoppingItemsFromRecipe } from './storePrices';

function cost(store: string, store_name: string, basket: number, lines: StoreCost['lines']): StoreCost {
  return { store, store_name, currency: 'PLN', is_estimate: true, usage_cost_pln: basket / 2, basket_cost_pln: basket, lines, source_updated_at: '2026-09-15T12:00:00' };
}

const recipe = {
  id: 'carbonara',
  title: 'Carbonara',
  ingredients: [{ name: 'jajka', amount_text: '3 szt.', ingredient_id: 1, amount_value: 3, unit: 'szt', scalable: true, ingredient: null }],
  costs: [
    cost('frisco', 'Frisco', 40, [{ ingredient_name: 'jajka', required_amount: '3 szt.', product: { name: 'Jaja Frisco', price_pln: 9.9, is_estimate: true, price_per_100g: null, price_per_100ml: null, package_qty: 6, package_unit: 'szt' }, usage_cost_pln: 8, basket_cost_pln: 9.9, confidence: 'orientacyjny' }]),
    cost('carrefour', 'Carrefour', 30, [{ ingredient_name: 'jajka', required_amount: '3 szt.', product: { name: 'Jaja Carrefour', price_pln: 6.89, is_estimate: true, price_per_100g: null, price_per_100ml: null, package_qty: 6, package_unit: 'szt' }, usage_cost_pln: 6, basket_cost_pln: 6.89, confidence: 'orientacyjny' }]),
  ],
} as RecipeDetail;

describe('ceny sklepów', () => {
  it('bierze najtańszy sklep, a nie sumę trzech', () => {
    expect(cheapestStore(recipe.costs)?.store).toBe('carrefour');
    expect(cheapestStore(recipe.costs)?.basket_cost_pln).toBe(30);
  });

  it('wkłada na listę cenę opakowania z najtańszego sklepu', () => {
    const items = shoppingItemsFromRecipe(recipe, [], false);
    expect(items).toHaveLength(1);
    expect(items[0].price).toBe(6.89);
    expect(items[0].storeName).toBe('Carrefour');
    expect(items[0].subtitle).toContain('Jaja Carrefour');
  });

  it('obniża cenę przy kartach lojalnościowych i pomija składniki z lodówki', () => {
    expect(applyLoyalty(10, true)).toBe(9.2);
    expect(shoppingItemsFromRecipe(recipe, ['jajka'], false)).toEqual([]);
  });

  it('pomija chipsy i szuka oliwy po polsku', () => {
    expect(searchToken('olive oil')).toBe('oliwa z oliwek');
    expect(searchToken('cornstarch')).toBe('skrobia kukurydziana');
    const hit = pickCheapestProduct([
      { name: 'Bruschetta z oliwą', store: 'frisco', price_pln: 3.69 },
      { name: 'Oliwa z oliwek Extra Virgin', store: 'auchan', price_pln: 11.89 },
    ]);
    expect(hit?.name).toContain('Oliwa z oliwek');
  });
});
