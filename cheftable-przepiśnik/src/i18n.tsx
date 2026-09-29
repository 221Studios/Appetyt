import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export type AppLanguage = 'pl' | 'en';
export type MeasurementSystem = 'eu' | 'us';

type MessageKey =
  | 'settings'
  | 'close'
  | 'save'
  | 'discover'
  | 'discoverTitle'
  | 'discoverSubtitle'
  | 'categoryBack'
  | 'categoryResults'
  | 'categoryNoRecipes'
  | 'search'
  | 'shopping'
  | 'saved'
  | 'cooked'
  | 'searchPlaceholder'
  | 'searchAria'
  | 'clearSearch'
  | 'chefsAndAuthors'
  | 'allRecipes'
  | 'searchResults'
  | 'loadMoreResults'
  | 'noRecipes'
  | 'searchHint'
  | 'showAllRecipes'
  | 'saveRecipe'
  | 'removeSaved'
  | 'browseRecipes'
  | 'addRealRecipe'
  | 'emptySavedDescription'
  | 'shoppingList'
  | 'copyShoppingList'
  | 'clearBought'
  | 'privateGroup'
  | 'recipeGroup'
  | 'deleteRecipeFromList'
  | 'expand'
  | 'collapse'
  | 'allBought'
  | 'copyListSuccess'
  | 'listReady'
  | 'followChef'
  | 'unfollowChef'
  | 'verifiedChef'
  | 'verifiedCreator'
  | 'chefRecipes'
  | 'chefBio'
  | 'moreRecipesSoon'
  | 'back'
  | 'share'
  | 'copyLinkSuccess'
  | 'addToShopping'
  | 'ingredients'
  | 'steps'
  | 'minute'
  | 'servings'
  | 'translateRecipe'
  | 'profile'
  | 'language'
  | 'polish'
  | 'english'
  | 'measurementSystem'
  | 'european'
  | 'usa'
  | 'profileSaved'
  | 'name'
  | 'level'
  | 'beginner'
  | 'sousChef'
  | 'homeChef'
  | 'culinaryPreferences'
  | 'everythingEater'
  | 'vegetarian'
  | 'pescatarian'
  | 'lowCarb'
  | 'activeCards'
  | 'saveProfile'
  | 'cookingMode'
  | 'step'
  | 'pause'
  | 'resume'
  | 'finishCooking'
  | 'ingredientsInStep'
  | 'ingredient'
  | 'noIngredientsInStep'
  | 'addMinute'
  | 'skipTimer'
  | 'previous'
  | 'nextStep'
  | 'finishCookingCelebration'
  | 'catalogLoadError'
  | 'loadingRecipe'
  | 'addIngredientsToast'
  | 'savedToast'
  | 'removedSavedToast'
  | 'followedToast'
  | 'unfollowedToast'
  | 'clearedBoughtToast'
  | 'removedGroupToast';

const MESSAGES: Record<AppLanguage, Record<MessageKey, string>> = {
  pl: {
    settings: 'Ustawienia', close: 'Zamknij', save: 'Zapisz', discover: 'Odkrywaj', discoverTitle: 'Znajdź swój następny hit', discoverSubtitle: 'Przeglądaj po czasie, diecie, posiłku albo tym, co masz w lodówce.', categoryBack: 'Wszystkie kategorie', categoryResults: 'Pasujące przepisy', categoryNoRecipes: 'Brak przepisów w tej kategorii', search: 'Szukaj',
    shopping: 'Zakupy', saved: 'Zapisane', cooked: 'Gotowane', searchPlaceholder: 'Szukaj', searchAria: 'Wyszukiwarka dań, szefów i składników',
    clearSearch: 'Wyczyść zapytanie', chefsAndAuthors: 'Szefowie i autorzy', allRecipes: 'Wszystkie przepisy',
    searchResults: 'Wyniki', loadMoreResults: 'Pokaż więcej wyników', noRecipes: 'Nie znaleziono przepisów', searchHint: 'Spróbuj zmienić zapytanie na „makaron”, „burger” lub „łosoś”.',
    showAllRecipes: 'Pokaż wszystkie przepisy', saveRecipe: 'Zapisz', removeSaved: 'Usuń z zapisanych',
    browseRecipes: 'Przeglądaj dania', addRealRecipe: 'Dodaj prawdziwy przepis:', emptySavedDescription: 'Kliknij ikonę zakładki przy dowolnym daniu w zakładce Odkrywaj lub Szukaj, aby zachować je tutaj.', shoppingList: 'Lista zakupów',
    copyShoppingList: 'Kopiuj listę do schowka', clearBought: 'Wyczyść kupione', privateGroup: 'Prywatne', recipeGroup: 'Przepis',
    deleteRecipeFromList: 'Usuń przepis z listy', expand: 'Rozwiń', collapse: 'Zwiń', allBought: 'Kupione',
    copyListSuccess: 'Skopiowano listę zakupów do schowka!', listReady: 'Lista przygotowana!', followChef: 'Obserwuj szefa',
    unfollowChef: 'Obserwujesz', verifiedChef: 'Zweryfikowany szef kuchni', verifiedCreator: 'Zweryfikowany twórca',
    chefRecipes: 'Przepisy tego autora', chefBio: 'Autorskie receptury pobrane z oficjalnych kanałów i publikacji szefa. Waga, proporcje i technika są odwzorowane bez sztucznych modyfikacji.',
    moreRecipesSoon: 'Więcej przepisów szefa pojawi się wkrótce w kolejnych aktualizacjach katalogu.', back: 'Wróć', share: 'Udostępnij',
    copyLinkSuccess: 'Skopiowano', addToShopping: 'Dodaj do listy zakupów', ingredients: 'Składniki', steps: 'Kroki', minute: 'min', servings: 'porcji',
    translateRecipe: 'Tłumaczenie przepisu', profile: 'Profil', language: 'Język aplikacji', polish: 'Polski', english: 'English', measurementSystem: 'Wyznacznik miary', european: 'Europejska', usa: 'USA', profileSaved: 'Zapisano ustawienia profilu kucharza',
    name: 'Imię', level: 'Poziom', beginner: 'Początkujący', sousChef: 'Sous Chef', homeChef: 'Szef Domu', culinaryPreferences: 'Preferencje kulinarne', everythingEater: 'Wszystkożerne 🥩', vegetarian: 'Wegetariańskie 🥦',
    pescatarian: 'Peskatarianizm 🐟', lowCarb: 'Low Carb / Keto 🥑', activeCards: 'Aktywne karty dyskontów:', saveProfile: 'Zapisz profil',
    cookingMode: 'Tryb aktywnego gotowania', step: 'Krok', pause: 'Pauza', resume: 'Wznów', finishCooking: 'Zakończ gotowanie',
    ingredientsInStep: 'Składniki w tym kroku:', ingredient: 'składnik', noIngredientsInStep: 'Brak przypisanych składników w tym kroku.',
    addMinute: '+1 min', skipTimer: 'Pomiń stoper', previous: 'Poprzedni', nextStep: 'Następny krok', finishCookingCelebration: 'Zakończ gotowanie 🎉',
    catalogLoadError: 'Nie udało się wczytać przepisów.', loadingRecipe: 'Wczytywanie przepisu…', addIngredientsToast: 'Dodano składniki z „{recipe}”', savedToast: 'Zapisano do ulubionych!',
    removedSavedToast: 'Usunięto z zapisanych', followedToast: 'Obserwujesz {chef}!', unfollowedToast: 'Przestano obserwować szefa',
    clearedBoughtToast: 'Usunięto kupione artykuły', removedGroupToast: 'Usunięto „{group}” z listy',
  },
  en: {
    settings: 'Settings', close: 'Close', save: 'Save', discover: 'Discover', discoverTitle: 'Find your next favorite', discoverSubtitle: 'Browse by time, diet, meal type, or what you already have at home.', categoryBack: 'All categories', categoryResults: 'Matching recipes', categoryNoRecipes: 'No recipes in this category', search: 'Search', shopping: 'Shopping', saved: 'Saved', cooked: 'Cooked',
    searchPlaceholder: 'Search', searchAria: 'Search dishes, chefs, and ingredients', clearSearch: 'Clear search', chefsAndAuthors: 'Chefs & authors',
    allRecipes: 'All recipes', searchResults: 'Results', loadMoreResults: 'Show more results', noRecipes: 'No recipes found', searchHint: 'Try searching for “pasta”, “burger”, or “salmon”.',
    showAllRecipes: 'Show all recipes', saveRecipe: 'Save', removeSaved: 'Remove from saved', browseRecipes: 'Browse dishes',
    addRealRecipe: 'Add a real recipe:', emptySavedDescription: 'Tap the bookmark icon on any dish in Discover or Search to keep it here.', shoppingList: 'Shopping list', copyShoppingList: 'Copy list to clipboard', clearBought: 'Clear bought',
    privateGroup: 'Private', recipeGroup: 'Recipe', deleteRecipeFromList: 'Remove recipe from list', expand: 'Expand', collapse: 'Collapse',
    allBought: 'Bought', copyListSuccess: 'Shopping list copied to clipboard!', listReady: 'List ready!', followChef: 'Follow chef',
    unfollowChef: 'Following', verifiedChef: 'Verified chef', verifiedCreator: 'Verified creator', chefRecipes: 'Recipes by this chef',
    chefBio: 'Original recipes collected from the chef’s official channels and publications. Weights, proportions, and techniques are reproduced without artificial changes.',
    moreRecipesSoon: 'More recipes from this chef will arrive in future catalog updates.', back: 'Back', share: 'Share', copyLinkSuccess: 'Copied',
    addToShopping: 'Add to shopping list', ingredients: 'Ingredients', steps: 'Steps', minute: 'min', servings: 'servings', translateRecipe: 'Recipe translation',
    profile: 'Profile', language: 'App language',
    polish: 'Polski', english: 'English', measurementSystem: 'Measurement system', european: 'European', usa: 'USA', profileSaved: 'Chef profile settings saved', name: 'Name', level: 'Level', beginner: 'Beginner', sousChef: 'Sous Chef', homeChef: 'Home chef', culinaryPreferences: 'Food preferences',
    everythingEater: 'Omnivore 🥩', vegetarian: 'Vegetarian 🥦', pescatarian: 'Pescatarian 🐟', lowCarb: 'Low Carb / Keto 🥑',
    activeCards: 'Active loyalty cards:', saveProfile: 'Save profile', cookingMode: 'Active cooking mode', step: 'Step', pause: 'Pause', resume: 'Resume',
    finishCooking: 'Finish cooking', ingredientsInStep: 'Ingredients in this step:', ingredient: 'ingredient', noIngredientsInStep: 'No ingredients assigned to this step.',
    addMinute: '+1 min', skipTimer: 'Skip timer', previous: 'Previous', nextStep: 'Next step', finishCookingCelebration: 'Finish cooking 🎉',
    catalogLoadError: 'Could not load recipes.', loadingRecipe: 'Loading recipe…', addIngredientsToast: 'Added ingredients from “{recipe}”', savedToast: 'Saved to favourites!',
    removedSavedToast: 'Removed from saved', followedToast: 'Following {chef}!', unfollowedToast: 'Stopped following chef',
    clearedBoughtToast: 'Removed bought items', removedGroupToast: 'Removed “{group}” from list',
  },
};

const LANGUAGE_KEY = 'appetyt.language.v1';
const MEASUREMENT_KEY = 'appetyt.measurement.v1';

function readLanguage(): AppLanguage {
  try {
    return window.localStorage.getItem(LANGUAGE_KEY) === 'en' ? 'en' : 'pl';
  } catch {
    return 'pl';
  }
}

function readMeasurementSystem(): MeasurementSystem {
  try {
    return window.localStorage.getItem(MEASUREMENT_KEY) === 'us' ? 'us' : 'eu';
  } catch {
    return 'eu';
  }
}

function pluralCategory(language: AppLanguage, count: number): 'one' | 'few' | 'many' {
  if (language === 'en') return count === 1 ? 'one' : 'many';
  const integer = Math.abs(Math.trunc(count));
  if (integer === 1) return 'one';
  if (integer % 10 >= 2 && integer % 10 <= 4 && (integer % 100 < 12 || integer % 100 > 14)) return 'few';
  return 'many';
}

const COUNT_FORMS: Record<string, Record<AppLanguage, Record<'one' | 'few' | 'many', string>>> = {
  recipe: { pl: { one: 'przepis', few: 'przepisy', many: 'przepisów' }, en: { one: 'recipe', few: 'recipes', many: 'recipes' } },
  ingredient: { pl: { one: 'składnik', few: 'składniki', many: 'składników' }, en: { one: 'ingredient', few: 'ingredients', many: 'ingredients' } },
  result: { pl: { one: 'trafienie', few: 'trafienia', many: 'trafień' }, en: { one: 'result', few: 'results', many: 'results' } },
  product: { pl: { one: 'produkt', few: 'produkty', many: 'produktów' }, en: { one: 'product', few: 'products', many: 'products' } },
  serving: { pl: { one: 'porcja', few: 'porcje', many: 'porcji' }, en: { one: 'serving', few: 'servings', many: 'servings' } },
};

interface I18nContextValue {
  language: AppLanguage;
  setLanguage: (language: AppLanguage) => void;
  measurementSystem: MeasurementSystem;
  setMeasurementSystem: (system: MeasurementSystem) => void;
  t: (key: MessageKey, variables?: Record<string, string | number>) => string;
  count: (kind: keyof typeof COUNT_FORMS, value: number) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export const LanguageProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [language, setLanguageState] = useState<AppLanguage>(readLanguage);
  const [measurementSystem, setMeasurementSystemState] = useState<MeasurementSystem>(readMeasurementSystem);

  const setLanguage = useCallback((next: AppLanguage) => {
    setLanguageState(next);
    try {
      window.localStorage.setItem(LANGUAGE_KEY, next);
    } catch {
      // The app keeps working in memory if local storage is unavailable.
    }
  }, []);

  const setMeasurementSystem = useCallback((next: MeasurementSystem) => {
    setMeasurementSystemState(next);
    try {
      window.localStorage.setItem(MEASUREMENT_KEY, next);
    } catch {
      // The app keeps working in memory if local storage is unavailable.
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const value = useMemo<I18nContextValue>(() => ({
    language,
    setLanguage,
    measurementSystem,
    setMeasurementSystem,
    t: (key, variables = {}) => Object.entries(variables).reduce(
      (message, [name, replacement]) => message.replaceAll(`{${name}}`, String(replacement)),
      MESSAGES[language][key],
    ),
    count: (kind, amount) => COUNT_FORMS[kind][language][pluralCategory(language, amount)],
  }), [language, setLanguage, measurementSystem, setMeasurementSystem]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export function useTranslation(): I18nContextValue {
  const value = useContext(I18nContext);
  if (!value) throw new Error('useTranslation must be used inside LanguageProvider');
  return value;
}
