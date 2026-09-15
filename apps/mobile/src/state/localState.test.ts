import { describe, expect, it } from 'vitest';

import { INITIAL_LOCAL_STATE, localReducer } from './localState';

describe('lokalny stan MVP', () => {
  it('zapisuje i usuwa przepis z ulubionych', () => {
    const saved = localReducer(INITIAL_LOCAL_STATE, { type: 'toggleSaved', recipeId: 'carbonara-test' });
    expect(saved.savedRecipeIds).toEqual(['carbonara-test']);
    expect(localReducer(saved, { type: 'toggleSaved', recipeId: 'carbonara-test' }).savedRecipeIds).toEqual([]);
  });

  it('nie dodaje drugi raz tego samego składnika', () => {
    const state = localReducer(INITIAL_LOCAL_STATE, { type: 'addFridge', ingredient: 'jajka' });
    expect(state.fridge).toEqual(INITIAL_LOCAL_STATE.fridge);
  });

  it('odrzuca uszkodzony zrzut lokalnego stanu', () => {
    const state = localReducer(INITIAL_LOCAL_STATE, { type: 'hydrate', state: JSON.parse('{"fridge":"nie-tablica","shopping":[{"nope":true}]}') });
    expect(state.fridge).toEqual(INITIAL_LOCAL_STATE.fridge);
    expect(state.shopping).toEqual([]);
  });

  it('obsługuje listę zakupów i oznaczanie kupionych', () => {
    const added = localReducer(INITIAL_LOCAL_STATE, { type: 'addShopping', item: { id: 'one', title: 'Pomidory', isBought: false } });
    const bought = localReducer(added, { type: 'toggleBought', itemId: 'one' });
    expect(bought.shopping[0].isBought).toBe(true);
    expect(localReducer(bought, { type: 'removeBought' }).shopping).toEqual([]);
  });
});
