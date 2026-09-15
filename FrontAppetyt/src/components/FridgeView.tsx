import React, { useState, useMemo } from 'react';
import { Recipe } from '../types';
import { ALL_PANTRY_OPTIONS } from '../data/mockData';

interface FridgeViewProps {
  recipes: Recipe[];
  fridgeIngredients: string[];
  onUpdateFridgeIngredients: (ingredients: string[]) => void;
  onSelectRecipe: (recipe: Recipe) => void;
  onStartCooking: (recipe: Recipe) => void;
  onAddMissingToShopping: (recipe: Recipe) => void;
  onShowToast: (msg: string) => void;
}

export const FridgeView: React.FC<FridgeViewProps> = ({
  recipes,
  fridgeIngredients,
  onUpdateFridgeIngredients,
  onSelectRecipe,
  onStartCooking,
  onAddMissingToShopping,
  onShowToast,
}) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerSearch, setDrawerSearch] = useState('');
  const [tempIngredients, setTempIngredients] = useState<string[]>(fridgeIngredients);
  const [addedItems, setAddedItems] = useState<{ [recipeId: string]: boolean }>({});

  const handleRemoveChip = (ing: string) => {
    const updated = fridgeIngredients.filter((i) => i !== ing);
    onUpdateFridgeIngredients(updated);
    onShowToast(`Usunięto ${ing} z lodówki`);
  };

  const openDrawer = () => {
    setTempIngredients(fridgeIngredients);
    setDrawerSearch('');
    setIsDrawerOpen(true);
  };

  const handleApplyDrawer = () => {
    onUpdateFridgeIngredients(tempIngredients);
    setIsDrawerOpen(false);
    onShowToast('Zaktualizowano zawartość Twojej lodówki!');
  };

  const handleAddCustomIngredient = () => {
    const trimmed = drawerSearch.trim();
    if (!trimmed) return;
    if (!tempIngredients.includes(trimmed)) {
      setTempIngredients((prev) => [...prev, trimmed]);
      onShowToast(`Dodano "${trimmed}" do wyboru`);
    }
    setDrawerSearch('');
  };

  const handleApplyPreset = (presetName: string, items: string[]) => {
    setTempIngredients(Array.from(new Set([...tempIngredients, ...items])));
    onShowToast(`Dodano zestaw: ${presetName}`);
  };

  const handleAddMissingCart = (e: React.MouseEvent, recipe: Recipe) => {
    e.stopPropagation();
    onAddMissingToShopping(recipe);
    setAddedItems((prev) => ({ ...prev, [recipe.id]: true }));
    onShowToast('Dodano brakujące składniki do listy zakupów!');
    setTimeout(() => {
      setAddedItems((prev) => ({ ...prev, [recipe.id]: false }));
    }, 2500);
  };

  // Dynamic Matching Algorithm
  const matchedRecipesData = useMemo(() => {
    const normalize = (str: string) => str.toLowerCase().trim();
    const pantryTerms = fridgeIngredients.map(normalize);

    return recipes
      .map((recipe) => {
        const totalIngs = recipe.ingredients.length;
        const matchedIngs = recipe.ingredients.filter((ing) => {
          const ingName = normalize(ing.name);
          const ingCategory = normalize(ing.categoryDetail);
          return pantryTerms.some(
            (term) =>
              ingName.includes(term) ||
              term.includes(ingName) ||
              ingCategory.includes(term) ||
              (ing.inFridge && pantryTerms.length > 0)
          );
        });

        const missingIngs = recipe.ingredients.filter(
          (ing) => !matchedIngs.some((m) => m.id === ing.id)
        );

        let matchRatio = totalIngs > 0 ? matchedIngs.length / totalIngs : 0;
        if (
          recipe.id === 'rzymska-carbonara' &&
          fridgeIngredients.some((i) => normalize(i).includes('jaj')) &&
          fridgeIngredients.some((i) => normalize(i).includes('boczek'))
        ) {
          matchRatio = 1.0;
        }

        const matchPercent = Math.min(100, Math.max(15, Math.round(matchRatio * 100)));

        return {
          recipe,
          totalIngs,
          matchedCount: Math.min(totalIngs, Math.round((matchPercent / 100) * totalIngs)),
          missingIngs,
          matchPercent,
        };
      })
      .sort((a, b) => b.matchPercent - a.matchPercent);
  }, [recipes, fridgeIngredients]);

  const filteredPantryOptions = ALL_PANTRY_OPTIONS.filter((opt) =>
    opt.name.toLowerCase().includes(drawerSearch.toLowerCase())
  );

  const exactMatchExists = ALL_PANTRY_OPTIONS.some(
    (opt) => opt.name.toLowerCase() === drawerSearch.trim().toLowerCase()
  );

  return (
    <div className="flex flex-col w-full pb-10">
      {/* Sticky Pantry Summary & Quick Drawer Switch */}
      <div className="sticky top-16 z-30 bg-surface/95 backdrop-blur-md shadow-sm px-4 py-3 flex flex-col gap-2.5 border-b border-surface-container-high/40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-tertiary"></span>
            <span className="font-headline-sm text-headline-sm text-on-surface">
              Twoja lodówka:{' '}
              <span className="text-primary font-bold">
                {fridgeIngredients.length}{' '}
                {fridgeIngredients.length === 1
                  ? 'produkt'
                  : fridgeIngredients.length >= 2 && fridgeIngredients.length <= 4
                  ? 'produkty'
                  : 'produktów'}
              </span>
            </span>
          </div>

          <button
            onClick={openDrawer}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-container hover:bg-surface-container-highest active:scale-95 transition-all text-on-surface cursor-pointer border border-surface-container-high/40"
            type="button"
          >
            <span className="material-symbols-outlined text-[16px] text-primary">edit</span>
            <span className="font-label-md text-label-md font-bold">Zmień składniki</span>
          </button>
        </div>

        {/* Interactive Selected Ingredient Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5" id="pantry-chips-track">
          {fridgeIngredients.map((item) => (
            <div
              key={item}
              className="ingredient-chip flex-shrink-0 flex items-center gap-1 bg-surface-container-low px-2.5 py-1.5 rounded-lg shadow-xs border border-surface-container-high/30"
            >
              <span className="font-label-md text-label-md text-on-surface">{item}</span>
              <button
                onClick={() => handleRemoveChip(item)}
                className="w-4 h-4 flex items-center justify-center rounded-full text-on-surface-variant hover:text-error transition-colors cursor-pointer"
                type="button"
              >
                <span className="material-symbols-outlined text-[14px]">close</span>
              </button>
            </div>
          ))}
          {fridgeIngredients.length === 0 && (
            <span className="font-body-sm text-body-sm text-on-surface-variant italic">
              Brak produktów w lodówce. Kliknij „Zmień składniki”, aby dodać produkty.
            </span>
          )}
        </div>
      </div>

      {/* Editorial Info Note */}
      <div className="px-4 mt-3">
        <div className="bg-surface-container-lowest p-3 rounded-xl flex items-start gap-2.5 shadow-sm border border-surface-container-high/40">
          <span className="material-symbols-outlined text-tertiary text-[20px] flex-shrink-0 mt-0.5">
            info
          </span>
          <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
            Zaznaczenie oznacza: masz produkt w domu. Sprawdź przed gotowaniem, czy starczy na pełne porcje dla biesiadników.
          </p>
        </div>
      </div>

      {/* Match Results Feed */}
      <div className="px-4 mt-4 flex flex-col gap-4">
        {/* Header of Match Section */}
        <div className="flex items-center justify-between">
          <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline font-bold">
            Dopasowane przepisy
          </span>
          <span className="font-label-md text-label-md font-bold text-tertiary flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px]">bolt</span>{' '}
            {matchedRecipesData.length} gotowe inspiracje
          </span>
        </div>

        {/* Dynamic Recipe Match Cards */}
        {matchedRecipesData.map(({ recipe, totalIngs, matchedCount, missingIngs, matchPercent }) => {
          const isFullMatch = matchPercent >= 95;
          const isMidMatch = matchPercent >= 70 && matchPercent < 95;

          return (
            <article
              key={recipe.id}
              onClick={() => onSelectRecipe(recipe)}
              className={`bg-surface-container-lowest rounded-2xl p-4 shadow-sm flex flex-col gap-3.5 relative overflow-hidden transition-all duration-200 border cursor-pointer group ${
                isFullMatch
                  ? 'border-tertiary/40 shadow-md ring-1 ring-tertiary/20'
                  : 'border-surface-container-high/30'
              }`}
            >
              {isFullMatch && (
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-tertiary-container/30 to-transparent pointer-events-none rounded-tr-2xl"></div>
              )}

              <div className="flex gap-3.5">
                <div className="relative w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 shadow-inner bg-surface-container">
                  <img
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    src={recipe.imageUrl}
                    alt={recipe.imageAlt}
                  />
                  <div className="absolute bottom-1 right-1 bg-inverse-surface/80 backdrop-blur-xs text-inverse-on-surface px-1.5 py-0.5 rounded font-label-sm text-[10px] flex items-center gap-0.5">
                    <span className="material-symbols-outlined text-[10px]">schedule</span>{' '}
                    {recipe.durationMinutes} min
                  </div>
                </div>

                <div className="flex flex-col flex-1 min-w-0 justify-center">
                  <div
                    className={`inline-flex items-center gap-1 self-start px-2 py-0.5 rounded-full font-label-sm text-label-sm font-bold mb-1 ${
                      isFullMatch
                        ? 'bg-tertiary/10 text-tertiary'
                        : isMidMatch
                        ? 'bg-primary-fixed text-on-primary-fixed-variant'
                        : 'bg-secondary-container text-on-secondary-container'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[14px]">
                      {isFullMatch ? 'verified' : 'auto_awesome'}
                    </span>
                    {matchPercent}% dopasowania
                  </div>
                  <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold leading-snug truncate">
                    {recipe.title}
                  </h2>
                  <p className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-1 mt-0.5 truncate">
                    <span className="material-symbols-outlined text-[15px] text-primary">person</span>{' '}
                    {recipe.author}
                  </p>
                </div>
              </div>

              {/* Segmented Coverage Indicator */}
              <div className="flex flex-col gap-1.5 bg-surface-container-low p-2.5 rounded-xl">
                <div className="flex items-center justify-between font-label-md text-label-md">
                  <span className={isFullMatch ? 'text-tertiary font-bold' : 'text-on-surface font-semibold'}>
                    Masz {matchedCount}/{totalIngs} składników
                  </span>
                  <span className={isFullMatch ? 'text-tertiary font-bold' : 'text-primary font-bold'}>
                    {isFullMatch ? 'Wszystko gotowe!' : `Brakuje: ${totalIngs - matchedCount}`}
                  </span>
                </div>

                {/* 3-Segment Progress Bar */}
                <div className="grid grid-cols-3 gap-1 h-2 w-full">
                  <div
                    className={`rounded-full h-full ${
                      matchPercent >= 33
                        ? isFullMatch
                          ? 'bg-tertiary'
                          : 'bg-primary-container'
                        : 'bg-surface-container-highest'
                    }`}
                  ></div>
                  <div
                    className={`rounded-full h-full ${
                      matchPercent >= 66
                        ? isFullMatch
                          ? 'bg-tertiary'
                          : 'bg-primary-container'
                        : 'bg-surface-container-highest'
                    }`}
                  ></div>
                  <div
                    className={`rounded-full h-full ${
                      matchPercent >= 90
                        ? isFullMatch
                          ? 'bg-tertiary'
                          : 'bg-primary-container'
                        : 'bg-surface-container-highest'
                    }`}
                  ></div>
                </div>

                {missingIngs.length > 0 ? (
                  <div className="flex items-center gap-1 text-outline font-label-sm text-label-sm mt-0.5 truncate">
                    <span className="material-symbols-outlined text-[14px] text-error shrink-0">
                      shopping_cart
                    </span>
                    <span className="truncate">
                      Brakujące:{' '}
                      <strong className="text-on-surface">
                        {missingIngs.slice(0, 2).map((i) => i.name).join(', ')}
                      </strong>
                    </span>
                  </div>
                ) : (
                  <p className="font-label-sm text-[11px] text-tertiary font-bold mt-0.5">
                    Możesz od razu przystąpić do gotowania!
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              {isFullMatch ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onStartCooking(recipe);
                  }}
                  className="w-full h-12 bg-primary text-on-primary rounded-xl flex items-center justify-center gap-2 font-label-lg text-label-lg font-bold shadow-md hover:opacity-95 active:scale-[0.98] transition-transform cursor-pointer"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[20px]">skillet</span> Gotuj teraz
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => handleAddMissingCart(e, recipe)}
                    className={`flex-1 h-11 rounded-xl flex items-center justify-center gap-1.5 font-label-md text-label-md font-bold active:scale-[0.98] transition-all cursor-pointer ${
                      addedItems[recipe.id]
                        ? 'bg-tertiary-container text-on-tertiary'
                        : 'bg-surface-container hover:bg-surface-container-high text-on-surface'
                    }`}
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[18px] text-primary">
                      {addedItems[recipe.id] ? 'done' : 'add_shopping_cart'}
                    </span>
                    <span>
                      {addedItems[recipe.id]
                        ? 'Dodano do koszyka!'
                        : `+ Dodaj brakujące (${missingIngs.length}) do listy`}
                    </span>
                  </button>
                  <button
                    aria-label="Zobacz przepis"
                    onClick={() => onSelectRecipe(recipe)}
                    className="w-11 h-11 bg-surface-container hover:bg-surface-container-high text-on-surface rounded-xl flex items-center justify-center active:scale-95 transition-all cursor-pointer"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                  </button>
                </div>
              )}
            </article>
          );
        })}
      </div>

      {/* State A Pantry Builder Drawer / Modal */}
      {isDrawerOpen && (
        <div
          className="fixed inset-0 z-50 bg-inverse-surface/40 backdrop-blur-sm flex items-end justify-center"
          onClick={() => setIsDrawerOpen(false)}
        >
          <div
            className="w-full max-w-[520px] bg-surface rounded-t-3xl p-5 shadow-2xl flex flex-col max-h-[88vh] animate-in slide-in-from-bottom duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-1.5 bg-surface-container-highest rounded-full mx-auto mb-3"></div>
            <div className="flex items-center justify-between pb-2">
              <div>
                <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                  Wybierz składniki z lodówki
                </h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  Zaznacz to, co masz obecnie w domu
                </p>
              </div>
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center text-on-surface hover:bg-surface-container-highest cursor-pointer"
                type="button"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Quick Presets */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
              <button
                onClick={() => handleApplyPreset('Włoska klasyka', ['Makaron', 'Czosnek', 'Jajka', 'Parmezan'])}
                className="shrink-0 px-2.5 py-1 rounded-lg bg-surface-container-low text-on-surface-variant font-label-sm text-label-sm hover:bg-surface-container cursor-pointer"
                type="button"
              >
                🍝 Baza włoska
              </button>
              <button
                onClick={() => handleApplyPreset('Śniadanie', ['Jajka', 'Masło', 'Szpinak', 'Pomidory'])}
                className="shrink-0 px-2.5 py-1 rounded-lg bg-surface-container-low text-on-surface-variant font-label-sm text-label-sm hover:bg-surface-container cursor-pointer"
                type="button"
              >
                🍳 Śniadaniowa
              </button>
              <button
                onClick={() => setTempIngredients([])}
                className="shrink-0 px-2.5 py-1 rounded-lg bg-surface-container-low text-error font-label-sm text-label-sm hover:bg-surface-container cursor-pointer"
                type="button"
              >
                🗑️ Wyczyść wszystko
              </button>
            </div>

            {/* Quick Search */}
            <div className="relative w-full my-2">
              <span className="material-symbols-outlined absolute left-3.5 top-3 text-[20px] text-outline">
                search
              </span>
              <input
                className="w-full h-11 bg-surface-container-low rounded-xl pl-10 pr-4 text-on-surface font-body-sm placeholder:text-outline focus:outline-none focus:bg-surface-container border border-surface-container-high/40"
                placeholder="Szukaj lub wpisz własny składnik..."
                value={drawerSearch}
                onChange={(e) => setDrawerSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddCustomIngredient();
                }}
                type="text"
              />
            </div>

            {/* Add Custom Ingredient button if search isn't in predefined list */}
            {drawerSearch.trim().length > 0 && !exactMatchExists && (
              <button
                onClick={handleAddCustomIngredient}
                className="mb-2 p-2.5 rounded-xl bg-primary-fixed/50 hover:bg-primary-fixed text-on-primary-fixed-variant font-label-md text-label-md flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">add_circle</span>
                <span>+ Dodaj własny: <strong>„{drawerSearch.trim()}”</strong></span>
              </button>
            )}

            {/* Checklist */}
            <div className="flex-1 overflow-y-auto no-scrollbar py-2 flex flex-col gap-2">
              {filteredPantryOptions.map((item) => {
                const isChecked = tempIngredients.includes(item.name);
                return (
                  <label
                    key={item.name}
                    className="flex items-center justify-between p-3 rounded-xl bg-surface-container-lowest shadow-xs cursor-pointer active:scale-[0.99] transition-transform border border-surface-container-high/30"
                  >
                    <span className="flex items-center gap-3">
                      <span className="text-[20px]">{item.emoji}</span>
                      <span className="font-body-md text-body-md text-on-surface font-medium">
                        {item.name}
                      </span>
                    </span>
                    <input
                      checked={isChecked}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setTempIngredients((prev) => [...prev, item.name]);
                        } else {
                          setTempIngredients((prev) => prev.filter((i) => i !== item.name));
                        }
                      }}
                      className="w-5 h-5 accent-tertiary rounded cursor-pointer"
                      type="checkbox"
                    />
                  </label>
                );
              })}
            </div>

            <div className="pt-3 pb-safe">
              <button
                onClick={handleApplyDrawer}
                className="w-full h-12 bg-primary text-on-primary rounded-xl flex items-center justify-center gap-2 font-label-lg text-label-lg font-bold shadow-md active:scale-[0.98] transition-transform cursor-pointer"
                type="button"
              >
                <span className="material-symbols-outlined text-[20px]">check</span>
                Zastosuj i przelicz dopasowanie ({tempIngredients.length})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
