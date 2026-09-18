import React, { useState, useMemo } from 'react';
import { Recipe, Chef } from '../types';
import { ALL_PANTRY_OPTIONS } from '../data/mockData';

interface SearchViewProps {
  recipes: Recipe[];
  chefs: Chef[];
  onSelectRecipe: (recipe: Recipe) => void;
  onSelectChef?: (chef: Chef) => void;
  bookmarkedRecipeIds: string[];
  onToggleBookmark: (recipeId: string) => void;
  onAddIngredientToFridge: (ingredientName: string) => void;
  fridgeIngredients: string[];
  onShowToast: (msg: string) => void;
}

export const SearchView: React.FC<SearchViewProps> = ({
  recipes,
  chefs,
  onSelectRecipe,
  onSelectChef,
  bookmarkedRecipeIds,
  onToggleBookmark,
  onAddIngredientToFridge,
  fridgeIngredients,
  onShowToast,
}) => {
  const [query, setQuery] = useState('');
  const [scope, setScope] = useState<'all' | 'recipes' | 'chefs' | 'ingredients'>('all');
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [selectedMaxTime, setSelectedMaxTime] = useState<string>('Dowolny');
  const [selectedCategory, setSelectedCategory] = useState<string>('Wszystkie');
  const [selectedSource, setSelectedSource] = useState<string>('Dowolne źródło');
  const [followingChefs, setFollowingChefs] = useState<string[]>([]);

  // Normalize helper
  const norm = (s: string) => s.toLowerCase().trim();

  // Filter Chefs based on query
  const matchingChefs = useMemo(() => {
    const q = norm(query);
    if (!q) return chefs;
    return chefs.filter(
      (c) =>
        norm(c.name).includes(q) ||
        norm(c.sourceDomain).includes(q)
    );
  }, [chefs, query]);

  // Filter Pantry Ingredients based on query
  const matchingIngredients = useMemo(() => {
    const q = norm(query);
    if (!q) return [];
    const filtered = ALL_PANTRY_OPTIONS.filter((opt) => norm(opt.name).includes(q));
    return filtered;
  }, [query]);

  const categoryOptions = useMemo(() => {
    const counts = new Map<string, number>();
    recipes.forEach((recipe) => {
      const category = recipe.category.trim();
      if (category) counts.set(category, (counts.get(category) || 0) + 1);
    });
    return [
      'Wszystkie',
      ...Array.from(counts.entries())
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'pl'))
        .map(([category]) => category),
    ];
  }, [recipes]);

  // Filter Recipes based on query + filters
  const filteredRecipes = useMemo(() => {
    const q = norm(query);

    return recipes.filter((r) => {
      // Query search
      if (q) {
        const matchesTitle = norm(r.title).includes(q);
        const matchesCategory = norm(r.category).includes(q);
        const matchesCuisine = norm(r.cuisine).includes(q);
        const matchesAuthor = norm(r.author).includes(q);
        const matchesIngredients = r.ingredients.some(
          (i) => norm(i.name).includes(q) || norm(i.categoryDetail).includes(q)
        );

        if (!matchesTitle && !matchesCategory && !matchesCuisine && !matchesAuthor && !matchesIngredients) {
          return false;
        }
      }

      // Max time filter
      if (selectedMaxTime === '< 30 min' && r.durationMinutes > 30) return false;
      if (selectedMaxTime === '< 45 min' && r.durationMinutes > 45) return false;

      // Cuisine filter
      if (selectedCategory !== 'Wszystkie' && r.category !== selectedCategory) {
        return false;
      }

      // Source filter
      if (selectedSource === 'Tylko zweryfikowani' && !r.verified) return false;

      return true;
    });
  }, [recipes, query, selectedMaxTime, selectedCategory, selectedSource]);

  // Dynamic counts for scope tabs
  const totalCount = filteredRecipes.length + matchingChefs.length + matchingIngredients.length;

  const toggleFollowChef = (chefId: string, chefName: string) => {
    if (followingChefs.includes(chefId)) {
      setFollowingChefs((prev) => prev.filter((id) => id !== chefId));
      onShowToast(`Usunięto ${chefName} z obserwowanych`);
    } else {
      setFollowingChefs((prev) => [...prev, chefId]);
      onShowToast(`Obserwujesz ${chefName}!`);
    }
  };

  const handleAddIngredient = (name: string) => {
    onAddIngredientToFridge(name);
  };

  return (
    <div className="flex flex-col w-full pb-10">
      {/* Sticky Top Search Header */}
      <section className="sticky top-header z-30 bg-surface/95 backdrop-blur-md px-4 pt-1 pb-3 shadow-sm flex flex-col gap-2.5 border-b border-surface-container-high/40">
        {/* Omnisearch Input */}
        <div className="relative flex items-center w-full">
          <div className="absolute left-3.5 flex items-center pointer-events-none text-primary">
            <span className="material-symbols-outlined text-[22px]">search</span>
          </div>
          <input
            aria-label="Wyszukiwarka dań, szefów i składników"
            className="w-full h-12 pl-11 pr-11 bg-surface-container-lowest text-on-surface font-body-md text-body-md rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all border border-surface-container-high/40"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Szukaj dań, szefów, składników..."
            type="text"
          />
          {query && (
            <button
              aria-label="Wyczyść zapytanie"
              onClick={() => setQuery('')}
              className="absolute right-1 w-10 h-10 flex items-center justify-center text-on-surface-variant hover:text-on-surface rounded-full transition-colors cursor-pointer"
              type="button"
            >
              <span className="material-symbols-outlined text-[20px]">cancel</span>
            </button>
          )}
        </div>

        {/* Scopes and Filter Button Row */}
        <div className="flex items-center justify-between gap-2">
          <div
            aria-label="Kategorie wyników"
            className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5"
            role="tablist"
          >
            <button
              aria-selected={scope === 'all'}
              onClick={() => setScope('all')}
              className={`scope-chip shrink-0 h-9 px-3.5 rounded-full font-label-md text-label-md transition-all cursor-pointer ${
                scope === 'all'
                  ? 'bg-primary text-on-primary shadow-sm font-bold'
                  : 'bg-surface-container text-on-surface hover:bg-surface-container-highest'
              }`}
              type="button"
            >
              Wszystko <span className="opacity-80 font-normal ml-0.5">({totalCount})</span>
            </button>
            <button
              aria-selected={scope === 'recipes'}
              onClick={() => setScope('recipes')}
              className={`scope-chip shrink-0 h-9 px-3.5 rounded-full font-label-md text-label-md transition-all cursor-pointer ${
                scope === 'recipes'
                  ? 'bg-primary text-on-primary shadow-sm font-bold'
                  : 'bg-surface-container text-on-surface hover:bg-surface-container-highest'
              }`}
              type="button"
            >
              Przepisy <span className="text-on-surface-variant font-normal ml-0.5">({filteredRecipes.length})</span>
            </button>
            <button
              aria-selected={scope === 'chefs'}
              onClick={() => setScope('chefs')}
              className={`scope-chip shrink-0 h-9 px-3.5 rounded-full font-label-md text-label-md transition-all cursor-pointer ${
                scope === 'chefs'
                  ? 'bg-primary text-on-primary shadow-sm font-bold'
                  : 'bg-surface-container text-on-surface hover:bg-surface-container-highest'
              }`}
              type="button"
            >
              Szefowie <span className="text-on-surface-variant font-normal ml-0.5">({matchingChefs.length})</span>
            </button>
            <button
              aria-selected={scope === 'ingredients'}
              onClick={() => setScope('ingredients')}
              className={`scope-chip shrink-0 h-9 px-3.5 rounded-full font-label-md text-label-md transition-all cursor-pointer ${
                scope === 'ingredients'
                  ? 'bg-primary text-on-primary shadow-sm font-bold'
                  : 'bg-surface-container text-on-surface hover:bg-surface-container-highest'
              }`}
              type="button"
            >
              Składniki <span className="text-on-surface-variant font-normal ml-0.5">({matchingIngredients.length})</span>
            </button>
          </div>

          <button
            aria-label="Otwórz filtry wyszukiwania"
            onClick={() => setFilterDrawerOpen(true)}
            className="shrink-0 h-9 px-3 rounded-full bg-surface-container-lowest text-on-surface font-label-md text-label-md flex items-center gap-1.5 shadow-sm active:scale-95 transition-transform border border-surface-container-high/40 cursor-pointer"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px] text-primary">tune</span>
            <span>Filtruj</span>
            <span className="material-symbols-outlined text-[16px] text-on-surface-variant">expand_more</span>
          </button>
        </div>

        {/* Applied Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-0.5">
          <button
            onClick={() => setFilterDrawerOpen(true)}
            className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-surface-container-low text-on-surface-variant font-label-sm text-label-sm hover:bg-surface-container cursor-pointer"
          >
            <span className="material-symbols-outlined text-[14px]">schedule</span> {selectedMaxTime}
          </button>
          <button
            onClick={() => setFilterDrawerOpen(true)}
            className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-surface-container-low text-on-surface-variant font-label-sm text-label-sm hover:bg-surface-container cursor-pointer"
          >
            <span className="material-symbols-outlined text-[14px]">category</span> {selectedCategory}
          </button>
          <button
            onClick={() => setFilterDrawerOpen(true)}
            className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-surface-container-low text-on-surface-variant font-label-sm text-label-sm hover:bg-surface-container cursor-pointer"
          >
            <span className="material-symbols-outlined text-[14px]">all_inclusive</span> {selectedSource}
          </button>
        </div>
      </section>

      {/* Main Results Container */}
      <div className="flex flex-col px-4 pt-4 gap-6">
        {/* Section 1: Szefowie i autorzy */}
        {(scope === 'all' || scope === 'chefs') && matchingChefs.length > 0 && (
          <section className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <h2 className="font-headline-sm text-headline-sm text-on-surface tracking-tight">
                Szefowie i autorzy
              </h2>
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                {matchingChefs.length} {matchingChefs.length === 1 ? 'trafienie' : 'trafienia'}
              </span>
            </div>

            <div className="flex flex-col gap-2.5">
              {matchingChefs.map((chef) => {
                const isFollowing = followingChefs.includes(chef.id);

                return (
                  <article
                    key={chef.id}
                    className="w-full bg-surface-container-lowest rounded-2xl p-3 shadow-sm flex items-center justify-between gap-3 border border-surface-container-high/30"
                  >
                    <div
                      onClick={() => onSelectChef && onSelectChef(chef)}
                      className="flex items-center gap-3 min-w-0 cursor-pointer flex-1"
                    >
                      <div className="relative w-14 h-14 rounded-full overflow-hidden shrink-0 shadow-sm bg-surface-container">
                        <img
                          className="w-full h-full object-cover"
                          src={chef.avatarUrl}
                          alt={chef.name}
                        />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-headline-sm text-headline-sm text-on-surface truncate hover:text-primary transition-colors">
                            {chef.name}
                          </h3>
                          {chef.isVerified && (
                            <span
                              className="material-symbols-outlined text-primary text-[18px]"
                              style={{ fontVariationSettings: "'FILL' 1" }}
                              title="Zweryfikowany szef kuchni"
                            >
                              verified
                            </span>
                          )}
                        </div>
                        <p className="font-body-sm text-body-sm text-on-surface-variant truncate">
                          {chef.recipesCount} przepisy · {chef.sourceDomain}
                        </p>
                      </div>
                    </div>

                    <button
                      aria-label={`Obserwuj ${chef.name}`}
                      onClick={() => toggleFollowChef(chef.id, chef.name)}
                      className={`shrink-0 w-12 h-12 flex items-center justify-center rounded-full active:scale-95 transition-all cursor-pointer ${
                        isFollowing
                          ? 'bg-primary-fixed text-primary'
                          : 'bg-surface-container-low text-on-surface-variant hover:text-primary'
                      }`}
                      type="button"
                    >
                      <span
                        className="material-symbols-outlined text-[24px]"
                        style={{ fontVariationSettings: isFollowing ? "'FILL' 1" : "'FILL' 0" }}
                      >
                        favorite
                      </span>
                    </button>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {/* Section 2: Składniki w spiżarni */}
        {(scope === 'all' || scope === 'ingredients') && matchingIngredients.length > 0 && (
          <section className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <h2 className="font-headline-sm text-headline-sm text-on-surface tracking-tight">
                Składniki w spiżarni
              </h2>
              <span className="font-label-sm text-label-sm text-tertiary font-bold">Akcje lodówki</span>
            </div>

            <div className="flex flex-col gap-2.5">
              {matchingIngredients.map((item) => {
                const inFridge = fridgeIngredients.some(
                  (f) =>
                    f.toLowerCase().includes(item.name.toLowerCase()) ||
                    item.name.toLowerCase().includes(f.toLowerCase())
                );

                return (
                  <div
                    key={item.name}
                    className="w-full bg-surface-container-lowest rounded-2xl p-4 shadow-sm flex items-center justify-between gap-3 border border-surface-container-high/30"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-primary-fixed flex items-center justify-center text-on-primary-fixed shrink-0 shadow-sm text-[20px]">
                        {item.emoji || '🥘'}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <h3 className="font-label-lg text-label-lg text-on-surface truncate font-bold">
                          {item.name}
                        </h3>
                        <span className="font-body-sm text-body-sm text-on-surface-variant">
                          {inFridge ? 'W Twojej lodówce' : 'Brak w Twojej lodówce'}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleAddIngredient(item.name)}
                      className={`shrink-0 min-h-[44px] px-3.5 rounded-xl font-label-md text-label-md flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer ${
                        inFridge
                          ? 'bg-tertiary-container text-on-tertiary-container font-bold'
                          : 'bg-tertiary text-on-tertiary'
                      }`}
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        {inFridge ? 'check' : 'add_circle'}
                      </span>
                      <span>{inFridge ? 'W lodówce' : 'Do lodówki'}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Section 3: Przepisy */}
        {(scope === 'all' || scope === 'recipes') && (
          <section className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <h2 className="font-headline-sm text-headline-sm text-on-surface tracking-tight">
                {query ? `Wyniki wyszukiwania: „${query}”` : 'Wszystkie przepisy'}
              </h2>
              <span className="font-label-sm text-label-sm text-on-surface-variant">
                {filteredRecipes.length} znalezionych
              </span>
            </div>

            {filteredRecipes.length === 0 ? (
              <div className="p-8 rounded-2xl bg-surface-container text-center flex flex-col items-center gap-3">
                <span className="material-symbols-outlined text-[48px] text-outline">search_off</span>
                <h3 className="font-headline-sm text-headline-sm text-on-surface">Nie znaleziono przepisów</h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant max-w-[280px]">
                  Spróbuj zmienić zapytanie na „makaron”, „burger”, „łosoś” lub zresetuj aktywne filtry.
                </p>
                <button
                  onClick={() => {
                    setQuery('');
                    setSelectedMaxTime('Dowolny');
                    setSelectedCategory('Wszystkie');
                    setSelectedSource('Dowolne źródło');
                  }}
                  className="mt-2 px-4 py-2 rounded-xl bg-primary text-on-primary font-label-md font-bold shadow-sm"
                  type="button"
                >
                  Pokaż wszystkie przepisy
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {filteredRecipes.map((recipe) => {
                  const isBookmarked = bookmarkedRecipeIds.includes(recipe.id);

                  // Calculate matched ingredients from fridge
                  const totalIngs = recipe.ingredients.length;
                  const matchedCount = recipe.ingredients.filter((ing) =>
                    fridgeIngredients.some((f) =>
                      ing.name.toLowerCase().includes(f.toLowerCase()) ||
                      f.toLowerCase().includes(ing.name.toLowerCase()) ||
                      ing.inFridge
                    )
                  ).length;
                  const isFullMatch = matchedCount >= totalIngs;

                  return (
                    <article
                      key={recipe.id}
                      onClick={() => onSelectRecipe(recipe)}
                      className="w-full bg-surface-container-lowest rounded-2xl p-2.5 shadow-sm flex items-center gap-3 transition-transform active:scale-[0.99] cursor-pointer border border-surface-container-high/30 group"
                    >
                      <div className="relative w-24 h-24 rounded-xl overflow-hidden shrink-0 bg-surface-container shadow-sm">
                        <img
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          src={recipe.imageUrl}
                          alt={recipe.imageAlt}
                        />
                        <span className="absolute bottom-1.5 left-1.5 bg-inverse-surface/85 backdrop-blur-sm text-inverse-on-surface font-label-sm text-label-sm px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                          <span className="material-symbols-outlined text-[12px]">schedule</span>{' '}
                          {recipe.durationMinutes}m
                        </span>
                      </div>

                      <div className="flex flex-col flex-1 min-w-0 justify-center">
                        <div className="flex items-start justify-between gap-1">
                          <h3 className="font-label-lg text-label-lg text-on-surface font-bold leading-snug line-clamp-2">
                            {recipe.title}
                          </h3>
                          <button
                            aria-label="Zapisz do ulubionych"
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleBookmark(recipe.id);
                            }}
                            className={`shrink-0 w-10 h-10 -mr-2 -mt-2 flex items-center justify-center transition-colors cursor-pointer ${
                              isBookmarked ? 'text-primary' : 'text-on-surface-variant hover:text-primary'
                            }`}
                            type="button"
                          >
                            <span
                              className="material-symbols-outlined text-[22px]"
                              style={{ fontVariationSettings: isBookmarked ? "'FILL' 1" : "'FILL' 0" }}
                            >
                              bookmark
                            </span>
                          </button>
                        </div>
                        <p className="font-body-sm text-body-sm text-on-surface-variant truncate mt-0.5">
                          {recipe.author} · {recipe.estimatedPrice}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <span
                            className={`inline-flex items-center gap-1 font-label-sm text-label-sm font-bold px-2 py-0.5 rounded-md ${
                              isFullMatch
                                ? 'bg-tertiary-fixed text-on-tertiary-fixed-variant'
                                : 'text-tertiary bg-tertiary-fixed/40'
                            }`}
                          >
                            <span
                              className="material-symbols-outlined text-[13px]"
                              style={{ fontVariationSettings: "'FILL' 1" }}
                            >
                              {isFullMatch ? 'stars' : 'check_circle'}
                            </span>
                            {isFullMatch
                              ? `${matchedCount}/${totalIngs} w lodówce (Pełne dopasowanie!)`
                              : `${matchedCount}/${totalIngs} w lodówce`}
                          </span>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        )}
      </div>

      {/* Filter Bottom Sheet / Modal */}
      {filterDrawerOpen && (
        <div
          className="fixed inset-0 z-50 bg-inverse-surface/40 backdrop-blur-xs flex items-end justify-center"
          onClick={() => setFilterDrawerOpen(false)}
        >
          <div
            className="w-full max-w-[520px] bg-surface-container-lowest rounded-t-3xl shadow-xl flex flex-col p-4 gap-4 animate-in slide-in-from-bottom duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-1.5 bg-surface-container-highest rounded-full mx-auto self-center"></div>
            <div className="flex items-center justify-between">
              <h3 className="font-headline-md text-headline-md text-on-surface tracking-tight">
                Filtry wyszukiwania
              </h3>
              <button
                aria-label="Zamknij panel filtrów"
                onClick={() => setFilterDrawerOpen(false)}
                className="w-10 h-10 flex items-center justify-center rounded-full text-on-surface-variant hover:text-on-surface cursor-pointer"
                type="button"
              >
                <span className="material-symbols-outlined text-[24px]">close</span>
              </button>
            </div>

            {/* Time Filter */}
            <div className="flex flex-col gap-2">
              <label className="font-label-lg text-label-lg text-on-surface font-bold">
                Maksymalny czas przygotowania
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['< 30 min', '< 45 min', 'Dowolny'].map((time) => (
                  <button
                    key={time}
                    onClick={() => setSelectedMaxTime(time)}
                    className={`h-11 rounded-xl font-label-md text-label-md flex items-center justify-center cursor-pointer transition-colors ${
                      selectedMaxTime === time
                        ? 'bg-primary text-on-primary font-bold shadow-sm'
                        : 'bg-surface-container text-on-surface'
                    }`}
                    type="button"
                  >
                    {time}
                  </button>
                ))}
              </div>
            </div>

            {/* Real Recipe Category Filter */}
            <div className="flex flex-col gap-2">
              <label className="font-label-lg text-label-lg text-on-surface font-bold">Kategoria przepisu</label>
              <div className="flex flex-wrap gap-2">
                {categoryOptions.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`h-10 px-4 rounded-xl font-label-md text-label-md cursor-pointer transition-colors ${
                      selectedCategory === category
                        ? 'bg-primary text-on-primary font-bold shadow-sm'
                        : 'bg-surface-container text-on-surface'
                    }`}
                    type="button"
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            {/* Source Filter */}
            <div className="flex flex-col gap-2">
              <label className="font-label-lg text-label-lg text-on-surface font-bold">
                Źródło przepisów
              </label>
              <div className="grid grid-cols-2 gap-2">
                {['Dowolne źródło', 'Tylko zweryfikowani'].map((src) => (
                  <button
                    key={src}
                    onClick={() => setSelectedSource(src)}
                    className={`h-11 rounded-xl font-label-md text-label-md cursor-pointer transition-colors ${
                      selectedSource === src
                        ? 'bg-primary text-on-primary font-bold shadow-sm'
                        : 'bg-surface-container text-on-surface'
                    }`}
                    type="button"
                  >
                    {src}
                  </button>
                ))}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center gap-3 pt-2 pb-safe">
              <button
                onClick={() => {
                  setSelectedMaxTime('Dowolny');
                  setSelectedCategory('Wszystkie');
                  setSelectedSource('Dowolne źródło');
                  setFilterDrawerOpen(false);
                  onShowToast('Zresetowano filtry');
                }}
                className="flex-1 h-12 rounded-2xl bg-surface-container text-on-surface font-label-lg text-label-lg active:scale-95 transition-all cursor-pointer"
                type="button"
              >
                Resetuj
              </button>
              <button
                onClick={() => {
                  setFilterDrawerOpen(false);
                  onShowToast('Zastosowano filtry!');
                }}
                className="flex-[2] h-12 rounded-2xl bg-primary-container text-on-primary font-label-lg text-label-lg font-bold shadow-md active:scale-95 transition-all cursor-pointer"
                type="button"
              >
                Zastosuj ({filteredRecipes.length})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
