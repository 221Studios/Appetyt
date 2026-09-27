import React, { useState, useMemo } from 'react';
import { Recipe, Chef } from '../types';

interface SearchViewProps {
  recipes: Recipe[];
  chefs: Chef[];
  onSelectRecipe: (recipe: Recipe) => void;
  onSelectChef?: (chef: Chef) => void;
  bookmarkedRecipeIds: string[];
  onToggleBookmark: (recipeId: string) => void;
  onShowToast: (msg: string) => void;
}

export const SearchView: React.FC<SearchViewProps> = ({
  recipes,
  chefs,
  onSelectRecipe,
  onSelectChef,
  bookmarkedRecipeIds,
  onToggleBookmark,
  onShowToast,
}) => {
  const [query, setQuery] = useState('');
  const [followingChefs, setFollowingChefs] = useState<string[]>([]);

  const norm = (s: string) => s.toLowerCase().trim();

  const matchingChefs = useMemo(() => {
    const q = norm(query);
    if (!q) return chefs;
    return chefs.filter(
      (c) => norm(c.name).includes(q) || norm(c.sourceDomain).includes(q)
    );
  }, [chefs, query]);

  const filteredRecipes = useMemo(() => {
    const q = norm(query);
    if (!q) return recipes;

    return recipes.filter((r) => {
      const matchesTitle = norm(r.title).includes(q);
      const matchesCategory = norm(r.category).includes(q);
      const matchesCuisine = norm(r.cuisine).includes(q);
      const matchesAuthor = norm(r.author).includes(q);
      const matchesIngredients = r.ingredients.some(
        (i) => norm(i.name).includes(q) || norm(i.categoryDetail).includes(q)
      );
      return matchesTitle || matchesCategory || matchesCuisine || matchesAuthor || matchesIngredients;
    });
  }, [recipes, query]);

  const toggleFollowChef = (chefId: string, chefName: string) => {
    if (followingChefs.includes(chefId)) {
      setFollowingChefs((prev) => prev.filter((id) => id !== chefId));
      onShowToast(`Usunięto ${chefName} z obserwowanych`);
    } else {
      setFollowingChefs((prev) => [...prev, chefId]);
      onShowToast(`Obserwujesz ${chefName}!`);
    }
  };

  return (
    <div className="flex flex-col w-full pb-10">
      <section className="sticky top-header z-30 bg-surface/95 backdrop-blur-md px-4 pt-1 pb-3 shadow-sm border-b border-surface-container-high/40">
        <div className="relative flex items-center w-full">
          <div className="absolute left-3.5 flex items-center pointer-events-none text-primary">
            <span className="material-symbols-outlined text-[22px]">search</span>
          </div>
          <input
            aria-label="Wyszukiwarka dań, szefów i składników"
            className="w-full h-12 pl-11 pr-11 bg-surface-container-lowest text-on-surface font-body-md text-body-md rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all border border-surface-container-high/40"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Szukaj"
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
      </section>

      <div className="flex flex-col px-4 pt-4 gap-6">
        {matchingChefs.length > 0 && (
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

        <section className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <h2 className="font-headline-sm text-headline-sm text-on-surface tracking-tight">
              {query ? `Wyniki: „${query}”` : 'Wszystkie przepisy'}
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
                Spróbuj zmienić zapytanie na „makaron”, „burger” lub „łosoś”.
              </p>
              <button
                onClick={() => setQuery('')}
                className="mt-2 px-4 py-2 rounded-xl bg-primary text-on-primary font-label-md font-bold shadow-sm cursor-pointer"
                type="button"
              >
                Pokaż wszystkie przepisy
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {filteredRecipes.map((recipe) => {
                const isBookmarked = bookmarkedRecipeIds.includes(recipe.id);

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
                    </div>

                    <div className="flex flex-col flex-1 min-w-0 justify-center">
                      <div className="flex items-start justify-between gap-1">
                        <h3 className="font-label-lg text-label-lg text-on-surface font-bold leading-snug line-clamp-2">
                          {recipe.title}
                        </h3>
                        <button
                          aria-label="Zapisz"
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
                        {recipe.author} · {recipe.ingredients.length}
                      </p>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
