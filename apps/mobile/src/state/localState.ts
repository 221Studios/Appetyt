export type ShoppingItem = {
  id: string;
  title: string;
  subtitle?: string;
  recipeTitle?: string;
  price?: number;
  storeName?: string;
  group?: string;
  groupTitle?: string;
  isBought: boolean;
};

export type CookingLevel = 'Początkujący' | 'Sous Chef' | 'Szef Domu';
export type DietPref = 'wszystko' | 'wege' | 'ryby' | 'keto';

export type ProfileState = {
  name: string;
  level: CookingLevel;
  diet: DietPref;
  cookedCount: number;
};

export type SettingsState = {
  discounts: boolean;
  substitutes: boolean;
  timerSound: boolean;
  reminders: boolean;
};

export type LocalState = {
  fridge: string[];
  savedRecipeIds: string[];
  shopping: ShoppingItem[];
  followingChefIds: string[];
  profile: ProfileState;
  settings: SettingsState;
};

export const INITIAL_PROFILE: ProfileState = {
  name: 'Nikodem',
  level: 'Sous Chef',
  diet: 'wszystko',
  cookedCount: 0,
};

export const INITIAL_SETTINGS: SettingsState = {
  discounts: true,
  substitutes: true,
  timerSound: true,
  reminders: false,
};

export const INITIAL_LOCAL_STATE: LocalState = {
  fridge: ['Jajka', 'Czosnek', 'Makaron', 'Boczek', 'Śmietanka', 'Masło'],
  savedRecipeIds: [],
  shopping: [],
  followingChefIds: ['jakubiak'],
  profile: INITIAL_PROFILE,
  settings: INITIAL_SETTINGS,
};

type Action =
  | { type: 'hydrate'; state: Partial<LocalState> }
  | { type: 'toggleSaved'; recipeId: string }
  | { type: 'toggleFollow'; chefId: string }
  | { type: 'setProfile'; profile: ProfileState }
  | { type: 'setSettings'; settings: SettingsState }
  | { type: 'incrementCooked' }
  | { type: 'addFridge'; ingredient: string }
  | { type: 'removeFridge'; ingredient: string }
  | { type: 'addShopping'; item: ShoppingItem }
  | { type: 'toggleBought'; itemId: string }
  | { type: 'removeBought' }
  | { type: 'removeShopping'; itemId: string }
  | { type: 'setShoppingPrice'; itemId: string; price: number; store: string };

export function localReducer(state: LocalState, action: Action): LocalState {
  switch (action.type) {
    case 'hydrate':
      return {
        fridge: stringArray(action.state.fridge, state.fridge),
        savedRecipeIds: stringArray(action.state.savedRecipeIds, state.savedRecipeIds),
        shopping: shoppingArray(action.state.shopping, state.shopping),
        followingChefIds: stringArray(action.state.followingChefIds, state.followingChefIds),
        profile: profileValue(action.state.profile, state.profile),
        settings: settingsValue(action.state.settings, state.settings),
      };
    case 'toggleFollow':
      return state.followingChefIds.includes(action.chefId)
        ? { ...state, followingChefIds: state.followingChefIds.filter((id) => id !== action.chefId) }
        : { ...state, followingChefIds: [...state.followingChefIds, action.chefId] };
    case 'setProfile':
      return { ...state, profile: action.profile };
    case 'setSettings':
      return { ...state, settings: action.settings };
    case 'incrementCooked':
      return { ...state, profile: { ...state.profile, cookedCount: state.profile.cookedCount + 1 } };
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
      if (state.shopping.some((item) => item.id === action.item.id)) return state;
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
    case 'removeShopping':
      return { ...state, shopping: state.shopping.filter((item) => item.id !== action.itemId) };
    case 'setShoppingPrice':
      return { ...state, shopping: state.shopping.map((item) => item.id === action.itemId ? { ...item, price: action.price, storeName: action.store } : item) };
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

function profileValue(value: unknown, fallback: ProfileState): ProfileState {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return fallback;
  const item = value as Partial<ProfileState>;
  const levels: CookingLevel[] = ['Początkujący', 'Sous Chef', 'Szef Domu'];
  const diets: DietPref[] = ['wszystko', 'wege', 'ryby', 'keto'];
  return {
    name: typeof item.name === 'string' && item.name.trim() ? item.name.trim() : fallback.name,
    level: levels.includes(item.level as CookingLevel) ? item.level as CookingLevel : fallback.level,
    diet: diets.includes(item.diet as DietPref) ? item.diet as DietPref : fallback.diet,
    cookedCount: typeof item.cookedCount === 'number' && item.cookedCount >= 0 ? Math.floor(item.cookedCount) : fallback.cookedCount,
  };
}

function settingsValue(value: unknown, fallback: SettingsState): SettingsState {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return fallback;
  const item = value as Partial<SettingsState>;
  return {
    discounts: typeof item.discounts === 'boolean' ? item.discounts : fallback.discounts,
    substitutes: typeof item.substitutes === 'boolean' ? item.substitutes : fallback.substitutes,
    timerSound: typeof item.timerSound === 'boolean' ? item.timerSound : fallback.timerSound,
    reminders: typeof item.reminders === 'boolean' ? item.reminders : fallback.reminders,
  };
}
