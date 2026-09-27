import React, { useMemo } from 'react';
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
  const bookmarkedRecipes = useMemo(() => {
    return recipes.filter((r) => bookmarkedRecipeIds.includes(r.id));
  }, [recipes, bookmarkedRecipeIds]);

  const handleQuickBookmark = (recipeId: string) => {
    onToggleBookmark(recipeId);
    onShowToast('');
  };

  return (
    <div className="flex flex-col w-full pb-10 px-4 pt-3">
      {bookmarkedRecipes.length === 0 ? (
        <div className="p-8 bg-surface-container-low rounded-2xl text-center flex flex-col items-center gap-3 mt-2 border border-surface-container-high/30">
          <div className="w-16 h-16 rounded-full bg-surface-container-high flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-[32px]">bookmark_border</span>
          </div>
          <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
            Brak zapisanych przepisów
          </h3>
          <p className="font-body-sm text-body-sm text-on-surface-variant max-w-[280px]">
            Kliknij ikonę zakładki przy dowolnym daniu w zakładce Odkrywaj lub Szukaj, aby zachować je tutaj.
          </p>

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
          {bookmarkedRecipes.map((recipe) => (
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
                    {recipe.durationMinutes} min · {recipe.author}
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
