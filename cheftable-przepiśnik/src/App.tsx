import { useEffect, useState } from 'react';
import { TabType, Recipe, ShoppingItem, Chef } from './types';
import { INITIAL_SHOPPING_ITEMS } from './data/mockData';
import { loadRecipeCatalog } from './data/realRecipes';
import { adaptCookingLine } from './data/enPlCooking';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { DiscoverView } from './components/DiscoverView';
import { SearchView } from './components/SearchView';
import { ShoppingListView } from './components/ShoppingListView';
import { SavedView } from './components/SavedView';
import { RecipeDetailView } from './components/RecipeDetailView';
import { ChefModal } from './components/ChefModal';

const LOCAL_STORAGE_KEYS = {
  shoppingItems: 'appetyt.shopping-items.v1',
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

  // Shopping data state
  const [shoppingItems, setShoppingItems] = useState<ShoppingItem[]>(() =>
    loadLocalState(LOCAL_STORAGE_KEYS.shoppingItems, INITIAL_SHOPPING_ITEMS)
  );
  const [bookmarkedRecipeIds, setBookmarkedRecipeIds] = useState<string[]>(() =>
    loadLocalState(LOCAL_STORAGE_KEYS.bookmarkedRecipeIds, [])
  );

  useEffect(() => saveLocalState(LOCAL_STORAGE_KEYS.shoppingItems, shoppingItems), [shoppingItems]);
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
    if (!message.trim()) return;
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

  const handleDeleteShoppingGroup = (groupId: string) => {
    setShoppingItems((prev) => prev.filter((item) => (item.group || 'custom') !== groupId));
  };

  const handleAddRecipeToShopping = (
    recipe: Recipe,
    options?: { adaptPl?: boolean }
  ) => {
    const groupId = `recipe-${recipe.id}`;
    const stamp = Date.now();
    const adapt = Boolean(options?.adaptPl);
    const newItems: ShoppingItem[] = recipe.ingredients.map((ing, index) => {
      const source = ing.amountText && ing.amountText !== ing.name ? ing.amountText : ing.name;
      const title = adapt ? adaptCookingLine(source) : source;
      return {
        id: `${groupId}-${ing.id}-${stamp}-${index}`,
        title,
        subtitle: '',
        price: 0,
        isBought: false,
        recipeId: recipe.id,
        group: groupId,
        groupTitle: adapt ? adaptCookingLine(recipe.title) : recipe.title,
        groupIcon: 'dinner_dining',
      };
    });

    setShoppingItems((prev) => {
      const withoutSameRecipe = prev.filter((item) => item.group !== groupId);
      return [...withoutSameRecipe, ...newItems];
    });
    showToast(`Dodano składniki z „${adapt ? adaptCookingLine(recipe.title) : recipe.title}"`);
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
            <h1 className="font-headline-md text-headline-md text-on-surface">Appetyt</h1>
            {catalogError ? (
              <p className="font-body-md text-body-md text-on-surface-variant mt-2">{catalogError}</p>
            ) : null}
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
            onAddToShopping={handleAddRecipeToShopping}
            isBookmarked={bookmarkedRecipeIds.includes(selectedRecipe.id)}
            onToggleBookmark={handleToggleBookmark}
            onShowToast={showToast}
          />
        ) : (
          <>
            {/* Top Global Header */}
            <Header
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
                  recipes={recipes}
                  chefs={chefs}
                  bookmarkedRecipeIds={bookmarkedRecipeIds}
                  onToggleBookmark={handleToggleBookmark}
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
                  onShowToast={showToast}
                />
              )}

              {currentTab === 'zakupy' && (
                <ShoppingListView
                  items={shoppingItems}
                  onToggleBought={handleToggleBought}
                  onClearBought={handleClearBought}
                  onDeleteGroup={handleDeleteShoppingGroup}
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

      </div>
    </div>
  );
}
