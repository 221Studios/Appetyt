import React from 'react';
import { convertMeasurementText } from '../data/measurements';
import { Recipe } from '../types';
import { useTranslation } from '../i18n';
import { RecipeRatingPanel } from './RecipeRatingPanel';

interface RecipeDetailViewProps {
  recipe: Recipe;
  isLoading?: boolean;
  onBack: () => void;
  onOpenSettings: () => void;
  onAddToShopping: (recipe: Recipe) => void;
  isBookmarked: boolean;
  onToggleBookmark: (recipeId: string) => void;
}

export const RecipeDetailView: React.FC<RecipeDetailViewProps> = ({
  recipe,
  isLoading = false,
  onBack,
  onOpenSettings,
  onAddToShopping,
  isBookmarked,
  onToggleBookmark,
}) => {
  const { measurementSystem, t, count } = useTranslation();

  const sourceUrl = recipe.sourceUrl || recipe.authorSourceUrl;

  return (
    <div className="flex flex-col relative w-full pt-header pb-28 bg-surface min-h-screen">
      <header className="fixed top-0 w-full max-w-[520px] z-50 pt-safe bg-surface/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
        <div className="h-16 px-2 flex items-center justify-between">
          <button
            aria-label={t('back')}
            onClick={onBack}
            className="w-12 h-12 rounded-full flex items-center justify-center text-on-surface hover:text-primary transition-colors cursor-pointer"
            type="button"
          >
            <span className="material-symbols-outlined text-[24px]">arrow_back</span>
          </button>
          <div className="flex items-center gap-1 pr-2">
            <button
              aria-label={t('settings')}
              onClick={onOpenSettings}
              className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface hover:text-primary active:text-primary transition-colors cursor-pointer"
              type="button"
            >
              <span className="material-symbols-outlined text-[21px]">settings</span>
            </button>
          </div>
        </div>
      </header>

      <div className="relative w-full h-56 overflow-hidden bg-surface-container-high">
        <img className="w-full h-full object-cover" src={recipe.imageUrl} alt={recipe.imageAlt} />
        <div className="absolute inset-0 bg-gradient-to-t from-inverse-surface via-inverse-surface/40 to-transparent" />
        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between gap-3">
          <h1 className="min-w-0 flex-1 font-headline-md text-headline-md text-white leading-tight drop-shadow-sm">
            {recipe.title}
          </h1>
          <button
            aria-label={isBookmarked ? t('removeSaved') : t('saveRecipe')}
            onClick={() => onToggleBookmark(recipe.id)}
            className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center cursor-pointer drop-shadow-sm ${
              isBookmarked ? 'text-primary' : 'text-white'
            }`}
            type="button"
          >
            <span
              className="material-symbols-outlined text-[24px]"
              style={{ fontVariationSettings: isBookmarked ? "'FILL' 1" : "'FILL' 0" }}
            >
              bookmark
            </span>
          </button>
        </div>
      </div>

      <div className="px-4 pt-4 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <span className="font-label-lg text-label-lg text-on-surface font-bold truncate">
            {recipe.author}
          </span>
          {sourceUrl ? (
            <a
              className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full bg-surface-container-low text-on-surface"
              href={sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="material-symbols-outlined text-[16px] text-primary">open_in_new</span>
            </a>
          ) : null}
        </div>

        <div className="flex items-center gap-3 text-on-surface">
          {recipe.durationMinutes !== null && (
            <span className="inline-flex items-center gap-1 font-label-md text-label-md">
              <span className="material-symbols-outlined text-[18px] text-primary">schedule</span>
              {recipe.durationMinutes} {t('minute')}
            </span>
          )}
          {recipe.baseServings !== null && (
            <span className="inline-flex items-center gap-1 font-label-md text-label-md">
              <span className="material-symbols-outlined text-[18px] text-primary">restaurant</span>
              {recipe.baseServings} {count('serving', recipe.baseServings)}
            </span>
          )}
        </div>

        {recipe.isExternalLink ? (
          <div className="rounded-2xl bg-secondary-container/60 p-4 flex flex-col gap-2">
            <span className="font-label-md text-label-md text-on-secondary-container font-bold">{t('userRecipeLabel')}</span>
            <p className="font-body-sm text-body-sm text-on-secondary-container">{t('externalRecipeHint')}</p>
            {sourceUrl ? <a href={sourceUrl} target="_blank" rel="noopener noreferrer" className="h-10 rounded-xl bg-secondary text-on-secondary font-label-md font-bold flex items-center justify-center gap-2" aria-label={t('openSource')}><span className="material-symbols-outlined text-[18px]">open_in_new</span>{t('openSource')}</a> : null}
          </div>
        ) : (
          <button
            onClick={() => onAddToShopping(recipe)}
            className="w-full h-12 rounded-xl bg-primary text-on-primary font-label-lg text-label-lg font-bold flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] transition-transform"
            type="button"
          >
            <span className="material-symbols-outlined text-[20px]">shopping_bag</span>
            {t('addToShopping')}
          </button>
        )}
      </div>

      <RecipeRatingPanel recipeId={recipe.id} onOpenSettings={onOpenSettings} />

      {!recipe.isExternalLink ? <div className="mt-5 px-4">
        <button
          className="w-full h-12 rounded-xl bg-surface-container-high text-on-surface font-label-lg text-label-lg font-bold flex items-center justify-center gap-2 cursor-default"
          type="button"
        >
          {t('ingredients')}
        </button>
      </div> : null}

      {isLoading ? (
        <div
          className="px-4 pt-8 flex flex-col items-center justify-center gap-3 text-on-surface-variant"
          aria-live="polite"
          aria-busy="true"
        >
          <span className="material-symbols-outlined animate-spin text-[28px] text-primary">progress_activity</span>
          <span className="font-body-md text-body-md">{t('loadingRecipe')}</span>
        </div>
      ) : !recipe.isExternalLink ? (
        <div className="px-4 pt-4 flex flex-col gap-2">
          {recipe.ingredients.map((ing) => {
            const name = convertMeasurementText(ing.name, measurementSystem);
            const displayAmount = ing.amountText
              ? convertMeasurementText(ing.amountText, measurementSystem)
              : ing.amountBase
                ? convertMeasurementText(`${ing.amountBase} ${ing.unit}`, measurementSystem)
                : null;
            const showAmountRow = displayAmount && displayAmount !== name;

            return (
              <div
                key={ing.id}
                className="p-3.5 rounded-xl bg-surface-container-lowest border border-surface-container-high/30"
              >
                <span className="font-label-lg text-label-lg text-on-surface font-semibold whitespace-normal break-words">
                  {name}
                </span>
                {showAmountRow ? (
                  <div className="font-body-sm text-body-sm text-secondary mt-0.5">{displayAmount}</div>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
};
