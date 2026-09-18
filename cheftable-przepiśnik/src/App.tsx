import { useEffect, useState } from 'react';
import { TabType, Recipe, ShoppingItem, Chef, Ingredient } from './types';
import { INITIAL_SHOPPING_ITEMS, DEFAULT_FRIDGE_PRODUCTS } from './data/mockData';
import { loadRecipeCatalog } from './data/realRecipes';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { DiscoverView } from './components/DiscoverView';
import { SearchView } from './components/SearchView';
import { FridgeView } from './components/FridgeView';
import { ShoppingListView } from './components/ShoppingListView';
import { SavedView } from './components/SavedView';
import { RecipeDetailView } from './components/RecipeDetailView';
import { ActiveCookingWidget } from './components/ActiveCookingWidget';
import { ActiveCookingModal } from './components/ActiveCookingModal';
import { ChefModal } from './components/ChefModal';
import { ProfileModal } from './components/ProfileModal';
import { SettingsModal } from './components/SettingsModal';

const PASTA_TYPES = [
  'tagliatelle',
  'pappardelle',
  'fettuccine',
  'bucatini',
  'spaghetti',
  'rigatoni',
  'penne',
  'farfalle',
  'ravioli',
  'gnocchi',
];

function shoppingIngredientLabel(ingredient: Ingredient, productName?: string) {
  const sourceName = ingredient.name.trim().replace(/\s+/g, ' ');
  const normalized = sourceName.toLocaleLowerCase('pl-PL');
  const pastaType = PASTA_TYPES.find((type) => normalized.includes(type));
  if (pastaType) return `makaron ${pastaType}`;
  if (normalized.includes('oliwa') || normalized.includes('olive oil')) return 'oliwa z oliwek';

  const productAndSource = `${sourceName} ${productName || ''}`;
  const percentage = productAndSource.match(/(\d{1,2})\s*%/)?.[1];
  if (normalized.includes('śmietan') || normalized.includes('cream')) {
    const sour = normalized.includes('sour cream') || normalized.includes('śmietana');
    return `${sour ? 'śmietana' : 'śmietanka'}${percentage ? ` ${percentage}%` : ''}`;
  }

  return ingredient.polishName || sourceName;
}

function cheapestShoppingProduct(recipe: Recipe, ingredientIndex: number) {
  const candidates = (recipe.storeCosts || [])
    .map((store) => ({ store, line: store.lines[ingredientIndex] }))
    .filter((candidate) => candidate.line?.product && candidate.line.product.pricePln > 0)
    .sort((a, b) => (a.line?.product?.pricePln || Infinity) - (b.line?.product?.pricePln || Infinity));
  const best = candidates[0];
  const product = best?.line?.product;
  return product && best
    ? { name: product.name, price: product.pricePln, storeName: best.store.storeName }
    : undefined;
}

const LOCAL_STORAGE_KEYS = {
  shoppingItems: 'appetyt.shopping-items.v1',
  fridgeIngredients: 'appetyt.fridge-ingredients.v1',
  bookmarkedRecipeIds: 'appetyt.bookmarked-recipes.v1',
  followingChefIds: 'appetyt.following-chefs.v1',
} as const;

interface ToastAction {
  label: string;
  onClick: () => void;
}

interface ToastState {
  message: string;
  action?: ToastAction;
}

function loadLocalState<T>(key: string, fallback: T): T {
  try {
    const stored = window.localStorage.getItem(key);
    return stored ? (JSON.parse(stored) as T) : fallback;
  } catch {
    return fallback;
  }
}

function saveLocalState<T>(key: string, value: T) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Local storage can be unavailable in restricted WebView modes; the app remains usable in memory.
  }
}

export default function App() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [chefs, setChefs] = useState<Chef[]>([]);
  const [isCatalogLoading, setIsCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [currentTab, setCurrentTab] = useState<TabType>('odkrywaj');
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [selectedChef, setSelectedChef] = useState<Chef | null>(null);
  const [followingChefIds, setFollowingChefIds] = useState<string[]>(() =>
    loadLocalState(LOCAL_STORAGE_KEYS.followingChefIds, [])
  );

  // Modals for settings and profile
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // The widget uses the first real recipe only to preserve the reference layout.
  const [activeCookingRecipe, setActiveCookingRecipe] = useState<Recipe | null>(null);
  const [isCookingModalOpen, setIsCookingModalOpen] = useState<boolean>(false);

  // Fridge and Shopping data state
  const [fridgeIngredients, setFridgeIngredients] = useState<string[]>(() =>
    loadLocalState(LOCAL_STORAGE_KEYS.fridgeIngredients, DEFAULT_FRIDGE_PRODUCTS)
  );
  const [shoppingItems, setShoppingItems] = useState<ShoppingItem[]>(() =>
    loadLocalState(LOCAL_STORAGE_KEYS.shoppingItems, INITIAL_SHOPPING_ITEMS)
  );
  const [bookmarkedRecipeIds, setBookmarkedRecipeIds] = useState<string[]>(() =>
    loadLocalState(LOCAL_STORAGE_KEYS.bookmarkedRecipeIds, [])
  );

  useEffect(() => saveLocalState(LOCAL_STORAGE_KEYS.shoppingItems, shoppingItems), [shoppingItems]);
  useEffect(() => saveLocalState(LOCAL_STORAGE_KEYS.fridgeIngredients, fridgeIngredients), [fridgeIngredients]);
  useEffect(() => saveLocalState(LOCAL_STORAGE_KEYS.bookmarkedRecipeIds, bookmarkedRecipeIds), [bookmarkedRecipeIds]);
  useEffect(() => saveLocalState(LOCAL_STORAGE_KEYS.followingChefIds, followingChefIds), [followingChefIds]);

  useEffect(() => {
    let isMounted = true;
    loadRecipeCatalog()
      .then(({ recipes: loadedRecipes, chefs: loadedChefs }) => {
        if (!isMounted) return;
        setRecipes(loadedRecipes);
        setChefs(loadedChefs);
        setIsCatalogLoading(false);
      })
      .catch((error: unknown) => {
        if (!isMounted) return;
        setCatalogError(error instanceof Error ? error.message : 'Nie udało się wczytać przepisów.');
        setIsCatalogLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Toast feedback
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = (message: string, action?: ToastAction) => {
    setToast({ message, action });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 2800);
  };

  // Recipe selection & navigation
  const handleSelectRecipe = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackFromDetail = () => {
    setSelectedRecipe(null);
  };

  const handleStartCooking = (recipe: Recipe) => {
    setActiveCookingRecipe(recipe);
    setIsCookingModalOpen(true);
  };

  const handleToggleBookmark = (recipeId: string) => {
    setBookmarkedRecipeIds((prev) => {
      const isSaved = prev.includes(recipeId);
      showToast(isSaved ? 'Usunięto z zapisanych' : 'Zapisano do ulubionych!');
      return isSaved ? prev.filter((id) => id !== recipeId) : [...prev, recipeId];
    });
  };

  const handleToggleFollowChef = (chefId: string) => {
    setFollowingChefIds((prev) => {
      const isFollow = prev.includes(chefId);
      showToast(isFollow ? 'Przestano obserwować szefa' : 'Dodano szefa do obserwowanych!');
      return isFollow ? prev.filter((id) => id !== chefId) : [...prev, chefId];
    });
  };

  // Shopping List Actions
  const handleToggleBought = (itemId: string) => {
    setShoppingItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, isBought: !item.isBought } : item))
    );
  };

  const handleClearBought = () => {
    setShoppingItems((prev) => prev.filter((item) => !item.isBought));
    showToast('Usunięto kupione artykuły');
  };

  const handleAddCustomShoppingItem = (title: string) => {
    const newItem: ShoppingItem = {
      id: `custom-${Date.now()}`,
      title,
      subtitle: 'Dodano ręcznie',
      price: 0,
      isBought: false,
      group: 'custom',
      groupTitle: 'Inne / Dodane ręcznie',
      groupIcon: 'add_shopping_cart',
    };
    setShoppingItems((prev) => [...prev, newItem]);
    showToast(`Dodano "${title}" do listy`);
  };

  const handleAddCustomPantryShoppingItem = (itemData: {
    title: string;
    price: number;
    storeName?: string;
  }) => {
    const newItem: ShoppingItem = {
      id: `custom-${Date.now()}`,
      title: itemData.title,
      subtitle: 'Brakujący z lodówki',
      price: itemData.price,
      storeName: itemData.storeName,
      isBought: false,
      group: 'custom',
      groupTitle: 'Inne / Dodane ręcznie',
      groupIcon: 'add_shopping_cart',
    };
    setShoppingItems((prev) => [...prev, newItem]);
  };

  const handleDeleteShoppingItem = (itemId: string) => {
    const itemToRestore = shoppingItems.find((item) => item.id === itemId);
    const itemIndex = shoppingItems.findIndex((item) => item.id === itemId);
    if (!itemToRestore) return;

    setShoppingItems((prev) => prev.filter((item) => item.id !== itemId));
    showToast(`Usunięto "${itemToRestore.title}"`, {
      label: 'Przywróć',
      onClick: () => {
        setShoppingItems((prev) => {
          if (prev.some((item) => item.id === itemToRestore.id)) return prev;
          const next = [...prev];
          next.splice(Math.min(itemIndex, next.length), 0, itemToRestore);
          return next;
        });
        showToast(`Przywrócono "${itemToRestore.title}"`);
      },
    });
  };

  const handleSetShoppingItemPrice = (itemId: string, price: number, storeName: string) => {
    setShoppingItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, price, storeName, isManualPrice: true } : item))
    );
  };

  const handleClearShoppingItemPrice = (itemId: string) => {
    setShoppingItems((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? { ...item, price: 0, storeName: undefined, isManualPrice: false }
          : item
      )
    );
  };

  const handleAddMissingToShopping = (recipe: Recipe) => {
    const newItems: ShoppingItem[] = recipe.ingredients
      .map((ing, ingredientIndex) => ({ ing, ingredientIndex }))
      .filter(({ ing }) => !ing.inFridge && !ing.inPantry)
      .map(({ ing, ingredientIndex }) => {
        const shopProduct = cheapestShoppingProduct(recipe, ingredientIndex);
        return {
          id: `recipe-${recipe.id}-${ing.id}-${Date.now()}`,
          // Store catalog names are Polish and represent the whole product package.
          title: shoppingIngredientLabel(ing, shopProduct?.name),
          subtitle: '',
          price: shopProduct?.price || 0,
          storeName: shopProduct?.storeName || 'brak dopasowania cenowego',
          isBought: false,
          recipeId: recipe.id,
          group: 'custom',
          groupTitle: recipe.title,
          groupIcon: 'dinner_dining',
        };
      });

    setShoppingItems((prev) => [...prev, ...newItems]);
  };

  // Fridge actions
  const handleAddIngredientToFridge = (ingredientName: string) => {
    if (!fridgeIngredients.includes(ingredientName)) {
      setFridgeIngredients((prev) => [...prev, ingredientName]);
      showToast(`Dodano ${ingredientName} do lodówki`);
    } else {
      showToast(`${ingredientName} jest już w lodówce`);
    }
  };

  const unboughtShoppingCount = shoppingItems.filter((i) => !i.isBought).length;

  if (isCatalogLoading || catalogError) {
    return (
      <div className="flex justify-center bg-surface-container-highest min-h-screen text-on-surface antialiased font-sans">
        <div className="w-full max-w-[520px] bg-surface min-h-screen flex items-center justify-center px-8 text-center">
          <div>
            <div className="w-14 h-14 rounded-2xl bg-primary-container text-on-primary flex items-center justify-center mx-auto mb-4 shadow-sm">
              <span className="material-symbols-outlined text-[30px]">restaurant</span>
            </div>
            <h1 className="font-headline-md text-headline-md text-on-surface">
              {catalogError ? 'Nie udało się wczytać katalogu' : 'Wczytuję prawdziwe przepisy...'}
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant mt-2">
              {catalogError || 'Foxx Gotuje · Sam · Nick · Joshua'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center bg-surface-container-highest min-h-screen text-on-surface antialiased font-sans">
      {/* Mobile Shell Frame */}
      <div className="w-full max-w-[520px] bg-surface relative min-h-screen flex flex-col shadow-2xl overflow-x-hidden">
        {/* Toast Feedback Notification */}
        {toast && (
          <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-inverse-surface text-inverse-on-surface font-label-md text-label-md px-4 py-2.5 rounded-full shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-3 duration-200">
            <span className="material-symbols-outlined text-primary text-[18px]">info</span>
            <span>{toast.message}</span>
            {toast.action && (
              <button
                type="button"
                onClick={() => {
                  const action = toast.action;
                  setToast(null);
                  action?.onClick();
                }}
                className="ml-1 rounded-lg px-2 py-1 text-primary font-bold hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
              >
                {toast.action.label}
              </button>
            )}
          </div>
        )}

        {/* Recipe Detail View takes full screen with its own header */}
        {selectedRecipe ? (
          <RecipeDetailView
            recipe={selectedRecipe}
            onBack={handleBackFromDetail}
            onStartCooking={handleStartCooking}
            onAddMissingToShopping={handleAddMissingToShopping}
            isBookmarked={bookmarkedRecipeIds.includes(selectedRecipe.id)}
            onToggleBookmark={handleToggleBookmark}
            onShowToast={showToast}
          />
        ) : (
          <>
            {/* Top Global Header */}
            <Header
              onOpenSettings={() => setIsSettingsOpen(true)}
              onOpenProfile={() => setIsProfileOpen(true)}
              onNavigateHome={() => {
                setSelectedRecipe(null);
                setCurrentTab('odkrywaj');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />

            {/* Main Tab Content */}
            <main className="flex-1 w-full pt-header pb-24">
              {currentTab === 'odkrywaj' && (
                <DiscoverView
                  onSelectRecipe={handleSelectRecipe}
                  onSelectChef={(chef) => setSelectedChef(chef)}
                  onNavigateTab={(tab) => {
                    setCurrentTab(tab);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  recipes={recipes}
                  chefs={chefs}
                  bookmarkedRecipeIds={bookmarkedRecipeIds}
                  onToggleBookmark={handleToggleBookmark}
                  onAddCustomItemToShopping={handleAddCustomPantryShoppingItem}
                  onShowToast={showToast}
                />
              )}

              {currentTab === 'szukaj' && (
                <SearchView
                  recipes={recipes}
                  chefs={chefs}
                  onSelectRecipe={handleSelectRecipe}
                  onSelectChef={(chef) => setSelectedChef(chef)}
                  bookmarkedRecipeIds={bookmarkedRecipeIds}
                  onToggleBookmark={handleToggleBookmark}
                  onAddIngredientToFridge={handleAddIngredientToFridge}
                  fridgeIngredients={fridgeIngredients}
                  onShowToast={showToast}
                />
              )}

              {currentTab === 'lodowka' && (
                <FridgeView
                  recipes={recipes}
                  fridgeIngredients={fridgeIngredients}
                  onUpdateFridgeIngredients={setFridgeIngredients}
                  onSelectRecipe={handleSelectRecipe}
                  onStartCooking={handleStartCooking}
                  onAddMissingToShopping={handleAddMissingToShopping}
                  onShowToast={showToast}
                />
              )}

              {currentTab === 'zakupy' && (
                <ShoppingListView
                  items={shoppingItems}
                  onToggleBought={handleToggleBought}
                  onClearBought={handleClearBought}
                  onAddItem={handleAddCustomShoppingItem}
                  onDeleteItem={handleDeleteShoppingItem}
                  onSetItemPrice={handleSetShoppingItemPrice}
                  onClearItemPrice={handleClearShoppingItemPrice}
                  onShowToast={showToast}
                />
              )}

              {currentTab === 'zapisane' && (
                <SavedView
                  recipes={recipes}
                  bookmarkedRecipeIds={bookmarkedRecipeIds}
                  onSelectRecipe={handleSelectRecipe}
                  onToggleBookmark={handleToggleBookmark}
                  onNavigateExplore={() => {
                    setCurrentTab('odkrywaj');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  onShowToast={showToast}
                />
              )}
            </main>
          </>
        )}

        {/* Persistent Floating Active Cooking Mini-Widget (when not in full modal) */}
        {!isCookingModalOpen && activeCookingRecipe && (
          <ActiveCookingWidget
            recipeTitle={activeCookingRecipe.title}
            currentStep={1}
            totalSteps={Math.max(1, activeCookingRecipe.steps.length)}
            currentStepText={`Krok 1/${Math.max(1, activeCookingRecipe.steps.length)}: ${activeCookingRecipe.steps[0]?.title || 'Przygotowanie'}`}
            initialSecondsRemaining={480}
            onOpenModal={() => setIsCookingModalOpen(true)}
            onStop={() => {
              setActiveCookingRecipe(null);
              showToast('Zakończono aktywne gotowanie');
            }}
          />
        )}

        {/* Bottom Navigation Bar */}
        <BottomNav
          currentTab={currentTab}
          onSelectTab={(tab) => {
            setSelectedRecipe(null);
            setCurrentTab(tab);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onTabChange={(tab) => {
            setSelectedRecipe(null);
            setCurrentTab(tab);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          shoppingCount={unboughtShoppingCount}
          shoppingItemsCount={unboughtShoppingCount}
        />

        {/* Full-Screen Interactive Active Cooking Modal */}
        {isCookingModalOpen && activeCookingRecipe && (
          <ActiveCookingModal
            recipe={activeCookingRecipe}
            onClose={() => setIsCookingModalOpen(false)}
            onFinishCooking={() => {
              setIsCookingModalOpen(false);
              showToast('Brawo! Danie gotowe do serwowania! Smacznego!');
            }}
          />
        )}

        {/* Chef Details Modal */}
        {selectedChef && (
          <ChefModal
            chef={selectedChef}
            recipes={recipes}
            isFollowing={followingChefIds.includes(selectedChef.id)}
            onToggleFollow={handleToggleFollowChef}
            onSelectRecipe={handleSelectRecipe}
            onClose={() => setSelectedChef(null)}
          />
        )}

        {/* Profile Modal */}
        {isProfileOpen && (
          <ProfileModal
            onClose={() => setIsProfileOpen(false)}
            savedCount={bookmarkedRecipeIds.length}
            fridgeCount={fridgeIngredients.length}
            onShowToast={showToast}
          />
        )}

        {/* Settings Modal */}
        {isSettingsOpen && (
          <SettingsModal
            onClose={() => setIsSettingsOpen(false)}
            onShowToast={showToast}
          />
        )}
      </div>
    </div>
  );
}
