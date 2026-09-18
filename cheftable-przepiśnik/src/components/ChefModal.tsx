import React from 'react';
import { Chef, Recipe } from '../types';

interface ChefModalProps {
  chef: Chef;
  recipes: Recipe[];
  isFollowing: boolean;
  onToggleFollow: (chefId: string) => void;
  onSelectRecipe: (recipe: Recipe) => void;
  onClose: () => void;
}

export const ChefModal: React.FC<ChefModalProps> = ({
  chef,
  recipes,
  isFollowing,
  onToggleFollow,
  onSelectRecipe,
  onClose,
}) => {
  const chefRecipes = recipes.filter(
    (r) =>
      r.authorSlug === chef.slug ||
      r.author.toLowerCase().includes(chef.name.toLowerCase()) ||
      chef.name.toLowerCase().includes(r.author.toLowerCase())
  );

  return (
    <div
      className="fixed inset-0 z-50 bg-inverse-surface/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[500px] bg-surface rounded-t-3xl sm:rounded-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom-8 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Visual Hero */}
        <div className="relative w-full h-36 bg-gradient-to-r from-primary-container to-primary overflow-hidden flex items-end p-4">
          <div className="absolute top-3 right-3 flex items-center gap-2">
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-surface/80 backdrop-blur-md flex items-center justify-center text-on-surface hover:bg-surface cursor-pointer shadow-sm"
              type="button"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          <div className="relative flex items-center gap-3.5 -mb-2">
            <div className="w-20 h-20 rounded-full border-3 border-surface bg-surface overflow-hidden shadow-lg shrink-0">
              <img
                src={chef.avatarUrl}
                alt={chef.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="text-surface-bright flex flex-col">
              <div className="flex items-center gap-1.5">
                <h3 className="font-headline-md text-headline-md font-bold drop-shadow-sm text-surface-bright">
                  {chef.name}
                </h3>
                {chef.isVerified && (
                  <span
                    className="material-symbols-outlined text-[18px] text-surface-bright"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                    title="Zweryfikowany twórca"
                  >
                    verified
                  </span>
                )}
              </div>
              <span className="font-label-sm text-label-sm text-surface-bright/80 font-medium">
                {chef.recipesCount} opublikowanych przepisów
              </span>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 pt-5 flex-1 overflow-y-auto no-scrollbar flex flex-col gap-4">
          {/* Action Row */}
          <div className="flex items-center justify-between gap-3">
            <a
              href={
                chef.sourceDomain.startsWith('http')
                  ? chef.sourceDomain
                  : `https://${chef.sourceDomain}`
              }
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md font-semibold transition-colors"
            >
              <span className="material-symbols-outlined text-primary text-[18px]">public</span>
              <span>{chef.sourceDomain}</span>
              <span className="material-symbols-outlined text-[14px] text-on-surface-variant">
                open_in_new
              </span>
            </a>

            <button
              onClick={() => onToggleFollow(chef.id)}
              className={`px-4 py-2 rounded-xl font-label-md text-label-md font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer ${
                isFollowing
                  ? 'bg-primary-fixed text-on-primary-fixed-variant'
                  : 'bg-primary text-on-primary'
              }`}
              type="button"
            >
              <span
                className="material-symbols-outlined text-[18px]"
                style={{ fontVariationSettings: isFollowing ? "'FILL' 1" : "'FILL' 0" }}
              >
                favorite
              </span>
              <span>{isFollowing ? 'Obserwujesz' : 'Obserwuj szefa'}</span>
            </button>
          </div>

          {/* Bio & Transparency Note */}
          <div className="p-3.5 rounded-xl bg-surface-container-low flex items-start gap-2.5 border border-surface-container-high/30">
            <span className="material-symbols-outlined text-tertiary text-[20px] shrink-0 mt-0.5">
              verified_user
            </span>
            <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
              Autorskie receptury pobrane z oficjalnych kanałów i publikacji szefa. Waga, proporcje i technika są odwzorowane bez sztucznych modyfikacji.
            </p>
          </div>

          {/* Recipes by this Chef */}
          <div className="flex flex-col gap-2.5">
            <h4 className="font-headline-sm text-headline-sm text-on-surface tracking-tight">
              Przepisy tego autora ({chefRecipes.length})
            </h4>

            {chefRecipes.length === 0 ? (
              <div className="p-4 rounded-xl bg-surface-container text-center text-on-surface-variant font-body-sm">
                Więcej przepisów szefa pojawi się wkrótce w kolejnych aktualizacjach katalogu.
              </div>
            ) : (
              chefRecipes.map((r) => (
                <div
                  key={r.id}
                  onClick={() => {
                    onSelectRecipe(r);
                    onClose();
                  }}
                  className="p-3 rounded-2xl bg-surface-container-lowest shadow-sm flex items-center justify-between gap-3 border border-surface-container-high/30 cursor-pointer active:scale-[0.99] transition-transform hover:bg-surface-container-low"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={r.imageUrl}
                      alt={r.imageAlt}
                      className="w-14 h-14 rounded-xl object-cover shrink-0"
                    />
                    <div className="flex flex-col min-w-0">
                      <span className="font-label-lg text-label-lg font-bold text-on-surface truncate">
                        {r.title}
                      </span>
                      <div className="flex items-center gap-2 mt-0.5 text-on-surface-variant font-body-sm text-[12px]">
                        <span className="flex items-center gap-0.5">
                          <span className="material-symbols-outlined text-[13px] text-primary">schedule</span>
                          {r.durationMinutes} min
                        </span>
                        <span>•</span>
                        <span>{r.estimatedPrice}</span>
                      </div>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-[20px] text-on-surface-variant">
                    chevron_right
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
