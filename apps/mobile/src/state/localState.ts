export type ShoppingItem = {
  id: string;
  title: string;
  recipeTitle?: string;
  isBought: boolean;
};

export type LocalState = {
  fridge: string[];
  savedRecipeIds: string[];
  shopping: ShoppingItem[];
};

export const INITIAL_LOCAL_STATE: LocalState = {
  fridge: ['Jajka', 'Czosnek', 'Makaron', 'Boczek', 'Śmietanka', 'Masło'],
  savedRecipeIds: [],
  shopping: [],
};

type Action =
  | { type: 'hydrate'; state: Partial<LocalState> }
  | { type: 'toggleSaved'; recipeId: string }
  | { type: 'addFridge'; ingredient: string }
  | { type: 'removeFridge'; ingredient: string }
  | { type: 'addShopping'; item: ShoppingItem }
  | { type: 'toggleBought'; itemId: string }
  | { type: 'removeBought' };

export function localReducer(state: LocalState, action: Action): LocalState {
  switch (action.type) {
    case 'hydrate':
      return {
        fridge: stringArray(action.state.fridge, state.fridge),
        savedRecipeIds: stringArray(action.state.savedRecipeIds, state.savedRecipeIds),
        shopping: shoppingArray(action.state.shopping, state.shopping),
      };
    case 'toggleSaved':
      return state.savedRecipeIds.includes(action.recipeId)
        ? { ...state, savedRecipeIds: state.savedRecipeIds.filter((id) => id !== action.recipeId) }
        : { ...state, savedRecipeIds: [...state.savedRecipeIds, action.recipeId] };
    case 'addFridge': {
      const ingredient = action.ingredient.trim();
      if (!ingredient || state.fridge.some((item) => item.toLocaleLowerCase() === ingredient.toLocaleLowerCase())) {
        return state;
      }
      return { ...state, fridge: [...state.fridge, ingredient] };
    }
    case 'removeFridge':
      return { ...state, fridge: state.fridge.filter((item) => item !== action.ingredient) };
    case 'addShopping':
      return { ...state, shopping: [...state.shopping, action.item] };
    case 'toggleBought':
      return {
        ...state,
        shopping: state.shopping.map((item) =>
          item.id === action.itemId ? { ...item, isBought: !item.isBought } : item,
        ),
      };
    case 'removeBought':
      return { ...state, shopping: state.shopping.filter((item) => !item.isBought) };
  }
}

function stringArray(value: unknown, fallback: string[]): string[] {
  if (!Array.isArray(value)) return fallback;
  return unique(value.filter((item): item is string => typeof item === 'string'));
}

function shoppingArray(value: unknown, fallback: ShoppingItem[]): ShoppingItem[] {
  if (!Array.isArray(value)) return fallback;
  return value.filter((item): item is ShoppingItem => {
    if (!item || typeof item !== 'object') return false;
    return (
      'id' in item &&
      'title' in item &&
      'isBought' in item &&
      typeof item.id === 'string' &&
      typeof item.title === 'string' &&
      typeof item.isBought === 'boolean'
    );
  });
}

function unique(values: string[]): string[] {
  return [...new Set(values.filter((value) => value.trim()))];
}
