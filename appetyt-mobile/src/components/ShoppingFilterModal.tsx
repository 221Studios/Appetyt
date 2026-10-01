import React, { useState } from 'react';
import type { ShoppingFilterMode } from '../data/shoppingGroups';
import { useTranslation } from '../i18n';

export type { ShoppingFilterMode };

interface ShoppingFilterModalProps {
  mode: ShoppingFilterMode;
  onClose: () => void;
  onSave: (mode: ShoppingFilterMode) => void;
}

const FILTER_OPTIONS: {
  mode: ShoppingFilterMode;
  titleKey: 'filterByRecipe' | 'filterByCategoryInRecipe' | 'filterByCategoryMerged';
  descriptionKey: 'filterByRecipeDesc' | 'filterByCategoryInRecipeDesc' | 'filterByCategoryMergedDesc';
}[] = [
  {
    mode: 'byRecipe',
    titleKey: 'filterByRecipe',
    descriptionKey: 'filterByRecipeDesc',
  },
  {
    mode: 'byCategoryInRecipe',
    titleKey: 'filterByCategoryInRecipe',
    descriptionKey: 'filterByCategoryInRecipeDesc',
  },
  {
    mode: 'byCategoryMerged',
    titleKey: 'filterByCategoryMerged',
    descriptionKey: 'filterByCategoryMergedDesc',
  },
];

export const ShoppingFilterModal: React.FC<ShoppingFilterModalProps> = ({ mode, onClose, onSave }) => {
  const { t } = useTranslation();
  const [selectedMode, setSelectedMode] = useState<ShoppingFilterMode>(mode);

  return (
    <div
      className="fixed inset-0 z-50 bg-inverse-surface/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[480px] bg-surface rounded-t-3xl sm:rounded-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 pt-5 pb-3 flex items-center justify-between border-b border-surface-container">
          <h3 className="font-headline-sm text-headline-sm text-on-surface">{t('shoppingFilter')}</h3>
          <button
            onClick={onClose}
            aria-label={t('close')}
            className="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center text-on-surface cursor-pointer"
            type="button"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="min-h-0 p-5 flex-1 overflow-y-auto no-scrollbar flex flex-col gap-2">
          {FILTER_OPTIONS.map(({ mode, titleKey, descriptionKey }) => {
            const isSelected = selectedMode === mode;
            return (
              <button
                key={mode}
                type="button"
                aria-pressed={isSelected}
                onClick={() => setSelectedMode(mode)}
                className={`w-full text-left p-3.5 rounded-2xl border flex flex-col gap-1 cursor-pointer transition-colors ${
                  isSelected
                    ? 'bg-primary-fixed/30 border-primary/40'
                    : 'bg-surface-container-lowest border-surface-container-high/30'
                }`}
              >
                <span className="font-label-lg text-label-lg font-semibold text-on-surface">
                  {t(titleKey)}
                </span>
                <span className="font-body-sm text-body-sm text-on-surface-variant">
                  {t(descriptionKey)}
                </span>
              </button>
            );
          })}
        </div>

        <div className="p-4 pt-2 pb-safe-action-bar shrink-0 border-t border-surface-container bg-surface">
          <button
            onClick={() => onSave(selectedMode)}
            className="w-full h-12 rounded-xl bg-primary text-on-primary font-label-lg font-bold cursor-pointer"
            type="button"
          >
            {t('save')}
          </button>
        </div>
      </div>
    </div>
  );
};
