import { useState } from 'react';
import { TabType, Recipe, ShoppingItem, Chef } from './types';
import { RECIPES, CHEFS, INITIAL_SHOPPING_ITEMS, INITIAL_FRIDGE_INGREDIENTS } from './data/mockData';
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

export default function App() {
  const [currentTab, setCurrentTab] = useState<TabType>('odkrywaj');
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [selectedChef, setSelectedChef] = useState<Chef | null>(null);
  const [followingChefIds, setFollowingChefIds] = useState<string[]>(['jakubiak']);

  // Modals for settings and profile
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Active cooking session state (starts with Pappardelle active as in reference UI)
  const [activeCookingRecipe, setActiveCookingRecipe] = useState<Recipe | null>(RECIPES[0]);
  const [isCookingModalOpen, setIsCookingModalOpen] = useState<boolean>(false);

  // Fridge and Shopping data state
  const [fridgeIngredients, setFridgeIngredients] = useState<string[]>(INITIAL_FRIDGE_INGREDIENTS);
  const [shoppingItems, setShoppingItems] = useState<ShoppingItem[]>(INITIAL_SHOPPING_ITEMS);
  const [bookmarkedRecipeIds, setBookmarkedRecipeIds] = useState<string[]>([
    'pappardelle-borowiki',
    'rzymska-carbonara',
  ]);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage((prev) => (prev === message ? null : prev));
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
    setShoppingItems((prev) => prev.filter((item) => item.id !== itemId));
    showToast('Usunięto pozycję z listy');
  };

  const handleSetShoppingItemPrice = (itemId: string, price: number) => {
    setShoppingItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, price } : item))
    );
  };

  const handleAddMissingToShopping = (recipe: Recipe) => {
    const missingIngredients = recipe.ingredients.filter((i) => !i.inFridge && !i.inPantry);
    const newItems: ShoppingItem[] = missingIngredients.map((ing) => ({
      id: `recipe-${recipe.id}-${ing.id}-${Date.now()}`,
      title: `${ing.name} ${ing.amountBase} ${ing.unit}`.trim(),
      subtitle: `Do przepisu: ${recipe.title}`,
      price: ing.estimatedPrice || 4.5,
      storeName: 'Biedronka / Carrefour',
      isBought: false,
      recipeId: recipe.id,
      group: recipe.id === 'pappardelle-borowiki' ? 'pappardelle' : 'custom',
      groupTitle: recipe.title,
      groupIcon: 'dinner_dining',
    }));

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

  return (
    <div className="flex justify-center bg-surface-container-highest min-h-screen text-on-surface antialiased font-sans">
      {/* Mobile Shell Frame */}
      <div className="w-full max-w-[520px] bg-surface relative min-h-screen flex flex-col shadow-2xl overflow-x-hidden">
        {/* Toast Feedback Notification */}
        {toastMessage && (
          <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-inverse-surface text-inverse-on-surface font-label-md text-label-md px-4 py-2.5 rounded-full shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-3 duration-200">
            <span className="material-symbols-outlined text-primary text-[18px]">info</span>
            <span>{toastMessage}</span>
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
            <main className="flex-1 w-full pt-16 pb-24">
              {currentTab === 'odkrywaj' && (
                <DiscoverView
                  onSelectRecipe={handleSelectRecipe}
                  onSelectChef={(chef) => setSelectedChef(chef)}
                  onNavigateTab={(tab) => {
                    setCurrentTab(tab);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  recipes={RECIPES}
                  chefs={CHEFS}
                  bookmarkedRecipeIds={bookmarkedRecipeIds}
                  onToggleBookmark={handleToggleBookmark}
                  onAddCustomItemToShopping={handleAddCustomPantryShoppingItem}
                  onShowToast={showToast}
                />
              )}

              {currentTab === 'szukaj' && (
                <SearchView
                  recipes={RECIPES}
                  chefs={CHEFS}
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
                  recipes={RECIPES}
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
                  onShowToast={showToast}
                />
              )}

              {currentTab === 'zapisane' && (
                <SavedView
                  recipes={RECIPES}
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
            currentStepText="Krok 3/6: Zeszklenie szalotki i czosnku"
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
            recipes={RECIPES}
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
