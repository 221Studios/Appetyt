import AsyncStorage from '@react-native-async-storage/async-storage';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { INITIAL_LOCAL_STATE, localReducer } from './localState';
import { hydratePersistedState, persistLocalState } from './useLocalState';

vi.mock('@react-native-async-storage/async-storage', () => ({
  default: { setItem: vi.fn() },
}));

describe('lokalny stan MVP', () => {
  beforeEach(() => {
    vi.mocked(AsyncStorage.setItem).mockReset();
  });

  it('ponawia zapis lokalnego stanu tylko raz po błędzie', async () => {
    const setItem = vi.mocked(AsyncStorage.setItem);
    setItem.mockRejectedValueOnce(new Error('temporary')).mockResolvedValueOnce(undefined);

    await expect(persistLocalState(INITIAL_LOCAL_STATE)).resolves.toBeUndefined();
    expect(setItem).toHaveBeenCalledTimes(2);
  });

  it('zgłasza błąd po wyczerpaniu prób zapisu lokalnego stanu', async () => {
    const setItem = vi.mocked(AsyncStorage.setItem);
    setItem.mockRejectedValue(new Error('storage unavailable'));

    await expect(persistLocalState(INITIAL_LOCAL_STATE)).rejects.toThrow('storage unavailable');
    expect(setItem).toHaveBeenCalledTimes(2);
  });

  it('nie wysyła null snapshotu do reduktora podczas hydracji', () => {
    const dispatch = vi.fn();

    hydratePersistedState('null', dispatch);

    expect(dispatch).not.toHaveBeenCalled();
  });

  it('serializuje zapisy, aby starszy snapshot nie zakończył się później', async () => {
    const setItem = vi.mocked(AsyncStorage.setItem);
    let releaseFirst: () => void = () => undefined;
    const firstWrite = new Promise<void>((resolve) => {
      releaseFirst = resolve;
    });
    setItem.mockImplementationOnce(() => firstWrite).mockResolvedValue(undefined);

    const first = persistLocalState({ ...INITIAL_LOCAL_STATE, fridge: ['S0'] });
    const second = persistLocalState({ ...INITIAL_LOCAL_STATE, fridge: ['S1'] });
    await Promise.resolve();
    expect(setItem).toHaveBeenCalledTimes(1);

    releaseFirst();
    await Promise.all([first, second]);
    expect(setItem.mock.calls.map(([, value]) => JSON.parse(value).fridge)).toEqual([['S0'], ['S1']]);
  });

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
