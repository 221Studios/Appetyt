import React, { useMemo } from 'react';
import { Recipe, Chef } from '../types';

function pickRandomRecipes(recipes: Recipe[], count: number): Recipe[] {
  if (recipes.length <= count) return [...recipes];
  const pool = [...recipes];
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, count);
}

interface DiscoverViewProps {
  onSelectRecipe: (recipe: Recipe) => void;
  onSelectChef: (chef: Chef) => void;
  recipes: Recipe[];
  chefs: Chef[];
  bookmarkedRecipeIds: string[];
  onToggleBookmark: (recipeId: string) => void;
}

export const DiscoverView: React.FC<DiscoverViewProps> = ({
  onSelectRecipe,
  onSelectChef,
  recipes,
  chefs,
  bookmarkedRecipeIds,
  onToggleBookmark,
}) => {
  const { featuredRecipe, listRecipes } = useMemo(() => {
    const picked = pickRandomRecipes(recipes, 6);
    return {
      featuredRecipe: picked[0] || null,
      listRecipes: picked.slice(1, 6),
    };
  }, [recipes]);

  return (
    <div className="flex flex-col w-full pb-10">
      {featuredRecipe ? (
        <section className="px-4 pt-3">
          <div
            onClick={() => onSelectRecipe(featuredRecipe)}
            className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden bg-surface-container-highest cursor-pointer"
          >
            <img
              className="w-full h-full object-cover"
              src={featuredRecipe.imageUrl}
              alt={featuredRecipe.imageAlt}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-inverse-surface/95 via-inverse-surface/35 to-transparent flex flex-col justify-end p-4">
              <span className="font-label-md text-label-md text-primary-fixed">{featuredRecipe.author}</span>
              <h2 className="font-headline-md text-headline-md text-on-primary line-clamp-2">
                {featuredRecipe.title}
              </h2>
            </div>
          </div>
        </section>
      ) : null}

      <section className="pt-5">
        <div className="flex overflow-x-auto gap-4 px-4 no-scrollbar py-1">
          {chefs.map((chef) => (
            <button
              key={chef.id}
              onClick={() => onSelectChef(chef)}
              className="flex flex-col items-center flex-shrink-0 w-20 text-center cursor-pointer"
              type="button"
            >
              <div className="w-16 h-16 rounded-full overflow-hidden bg-surface-container mb-1.5">
                <img className="w-full h-full object-cover" src={chef.avatarUrl} alt={chef.name} />
              </div>
              <span className="font-label-md text-label-md text-on-surface line-clamp-1 font-semibold">
                {chef.shortName}
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className="px-4 pt-5 flex flex-col gap-2.5">
        {listRecipes.map((recipe) => (
          <div
            key={recipe.id}
            onClick={() => onSelectRecipe(recipe)}
            className="w-full bg-surface-container-lowest rounded-xl p-2.5 flex items-center gap-3 border border-surface-container-high/30 cursor-pointer"
          >
            <div className="w-14 h-14 rounded-lg bg-surface-container-high overflow-hidden flex-shrink-0">
              <img className="w-full h-full object-cover" src={recipe.imageUrl} alt={recipe.imageAlt} />
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="font-label-sm text-label-sm text-primary truncate">{recipe.author}</span>
              <h3 className="font-label-lg text-label-lg text-on-surface truncate font-semibold">
                {recipe.title}
              </h3>
              <span className="font-label-sm text-label-sm text-on-surface-variant">
                {recipe.ingredients.length} składników
              </span>
            </div>
            <button
              aria-label="Zapisz"
              onClick={(e) => {
                e.stopPropagation();
                onToggleBookmark(recipe.id);
              }}
              className={`w-9 h-9 flex items-center justify-center cursor-pointer ${
                bookmarkedRecipeIds.includes(recipe.id) ? 'text-primary' : 'text-on-surface-variant'
              }`}
              type="button"
            >
              <span
                className="material-symbols-outlined text-[20px]"
                style={{
                  fontVariationSettings: bookmarkedRecipeIds.includes(recipe.id)
                    ? "'FILL' 1"
                    : "'FILL' 0",
                }}
              >
                bookmark
              </span>
            </button>
          </div>
        ))}
      </section>
    </div>
  );
};
