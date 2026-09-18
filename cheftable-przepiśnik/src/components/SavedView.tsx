import React, { useState, useMemo } from 'react';
import { Recipe } from '../types';

interface SavedViewProps {
  recipes: Recipe[];
  bookmarkedRecipeIds: string[];
  onSelectRecipe: (recipe: Recipe) => void;
  onToggleBookmark: (recipeId: string) => void;
  onNavigateExplore: () => void;
  onShowToast: (msg: string) => void;
}

export const SavedView: React.FC<SavedViewProps> = ({
  recipes,
  bookmarkedRecipeIds,
  onSelectRecipe,
  onToggleBookmark,
  onNavigateExplore,
  onShowToast,
}) => {
  const [filter, setFilter] = useState<'all' | 'quick' | 'pasta'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const bookmarkedRecipes = useMemo(() => {
    return recipes.filter((r) => bookmarkedRecipeIds.includes(r.id));
  }, [recipes, bookmarkedRecipeIds]);

  const filteredList = useMemo(() => {
    return bookmarkedRecipes.filter((r) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matches =
          r.title.toLowerCase().includes(q) ||
          r.author.toLowerCase().includes(q) ||
          r.category.toLowerCase().includes(q);
        if (!matches) return false;
      }
      if (filter === 'quick') return r.durationMinutes <= 25;
      if (filter === 'pasta') return r.category.includes('Makaron');
      return true;
    });
  }, [bookmarkedRecipes, filter, searchQuery]);

  const handleQuickBookmark = (recipeId: string) => {
    onToggleBookmark(recipeId);
    onShowToast('Dodano polecany przepis do zapisanych!');
  };

  return (
    <div className="flex flex-col w-full pb-10 px-4 pt-3">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">
            Zapisane przepisy
          </h1>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
            Twoja prywatna książka kucharska ({bookmarkedRecipes.length})
          </p>
        </div>
      </div>

      {/* Internal Search Bar (when there are saved recipes) */}
      {bookmarkedRecipes.length > 0 && (
        <div className="relative flex items-center w-full mb-3">
          <span className="material-symbols-outlined absolute left-3.5 text-primary text-[20px] pointer-events-none">
            search
          </span>
          <input
            className="w-full h-11 pl-10 pr-10 bg-surface-container-low rounded-xl text-on-surface font-body-sm placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-2 focus:ring-primary/40 border border-surface-container-high/40"
            placeholder="Szukaj w swoich zapisanych..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            type="text"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 w-8 h-8 flex items-center justify-center text-on-surface-variant hover:text-on-surface cursor-pointer"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          )}
        </div>
      )}

      {/* Filter chips */}
      <div className="flex items-center gap-2 mb-4 overflow-x-auto no-scrollbar py-0.5">
        <button
          onClick={() => setFilter('all')}
          className={`px-3.5 py-1.5 rounded-full font-label-md text-label-md transition-colors cursor-pointer ${
            filter === 'all'
              ? 'bg-primary text-on-primary font-bold shadow-xs'
              : 'bg-surface-container text-on-surface'
          }`}
          type="button"
        >
          Wszystkie ({bookmarkedRecipes.length})
        </button>
        <button
          onClick={() => setFilter('quick')}
          className={`px-3.5 py-1.5 rounded-full font-label-md text-label-md transition-colors cursor-pointer ${
            filter === 'quick'
              ? 'bg-primary text-on-primary font-bold shadow-xs'
              : 'bg-surface-container text-on-surface'
          }`}
          type="button"
        >
          Szybkie (&lt;25 min)
        </button>
        <button
          onClick={() => setFilter('pasta')}
          className={`px-3.5 py-1.5 rounded-full font-label-md text-label-md transition-colors cursor-pointer ${
            filter === 'pasta'
              ? 'bg-primary text-on-primary font-bold shadow-xs'
              : 'bg-surface-container text-on-surface'
          }`}
          type="button"
        >
          Makarony
        </button>
      </div>

      {filteredList.length === 0 ? (
        <div className="p-8 bg-surface-container-low rounded-2xl text-center flex flex-col items-center gap-3 mt-2 border border-surface-container-high/30">
          <div className="w-16 h-16 rounded-full bg-surface-container-high flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-[32px]">bookmark_border</span>
          </div>
          <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
            {searchQuery ? 'Brak wyników wyszukiwania' : 'Brak zapisanych przepisów'}
          </h3>
          <p className="font-body-sm text-body-sm text-on-surface-variant max-w-[280px]">
            {searchQuery
              ? `Nie znaleziono dania pasującego do „${searchQuery}”.`
              : 'Kliknij ikonę zakładki przy dowolnym daniu w zakładce Odkrywaj lub Szukaj, aby zachować je tutaj.'}
          </p>

          {!searchQuery && (
            <div className="flex flex-col items-center gap-2 mt-3 w-full max-w-xs">
              <span className="font-label-sm text-label-sm text-on-surface-variant font-bold uppercase tracking-wider">
                Dodaj prawdziwy przepis:
              </span>
              <div className="flex flex-wrap justify-center gap-2">
                {recipes.slice(0, 2).map((recipe) => (
                  <button
                    key={recipe.id}
                    onClick={() => handleQuickBookmark(recipe.id)}
                    className="px-3 py-1.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface font-label-sm font-semibold flex items-center gap-1 active:scale-95 transition-all cursor-pointer"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[15px] text-primary">add</span>
                    {recipe.title}
                  </button>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={onNavigateExplore}
            className="mt-3 px-5 py-2.5 rounded-xl bg-primary text-on-primary font-label-lg font-bold shadow-sm cursor-pointer active:scale-95 transition-all"
            type="button"
          >
            Przeglądaj dania
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filteredList.map((recipe) => (
            <article
              key={recipe.id}
              onClick={() => onSelectRecipe(recipe)}
              className="w-full bg-surface-container-lowest rounded-2xl p-3 shadow-sm flex items-center gap-3.5 transition-transform active:scale-[0.99] cursor-pointer border border-surface-container-high/30 hover:border-primary/40 group"
            >
              <div className="relative w-24 h-24 rounded-xl overflow-hidden shrink-0 bg-surface-container shadow-sm">
                <img
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  src={recipe.imageUrl}
                  alt={recipe.imageAlt}
                />
                <span className="absolute bottom-1.5 left-1.5 bg-inverse-surface/85 backdrop-blur-sm text-inverse-on-surface font-label-sm text-label-sm px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                  <span className="material-symbols-outlined text-[12px]">schedule</span> {recipe.durationMinutes}m
                </span>
              </div>

              <div className="flex flex-col flex-1 min-w-0 justify-center">
                <div className="flex items-start justify-between gap-1">
                  <h3 className="font-label-lg text-label-lg text-on-surface font-bold leading-snug line-clamp-2">
                    {recipe.title}
                  </h3>
                  <button
                    aria-label="Usuń z zapisanych"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleBookmark(recipe.id);
                      onShowToast('Usunięto z ulubionych');
                    }}
                    className="shrink-0 w-10 h-10 -mr-2 -mt-2 flex items-center justify-center text-primary cursor-pointer hover:opacity-80 transition-opacity"
                    type="button"
                  >
                    <span
                      className="material-symbols-outlined text-[22px]"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      bookmark
                    </span>
                  </button>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant truncate mt-0.5">
                  {recipe.author} · {recipe.estimatedPrice}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="inline-flex items-center gap-1 font-label-sm text-label-sm font-semibold text-tertiary bg-tertiary-fixed/30 px-2 py-0.5 rounded-md">
                    <span className="material-symbols-outlined text-[13px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                      check_circle
                    </span>
                    Zweryfikowane źródło
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};
