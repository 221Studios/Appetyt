import React from 'react';
import { useTranslation } from '../i18n';

export type TabType = 'odkrywaj' | 'szukaj' | 'zakupy' | 'zapisane';

export interface BottomNavProps {
  currentTab: TabType;
  onSelectTab?: (tab: TabType) => void;
  onTabChange?: (tab: TabType) => void;
  shoppingCount?: number;
  shoppingItemsCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onSelectTab,
  onTabChange,
  shoppingCount = 0,
  shoppingItemsCount,
}) => {
  const { t } = useTranslation();
  const badgeCount = shoppingItemsCount !== undefined ? shoppingItemsCount : shoppingCount;

  const handleSelect = (tab: TabType) => {
    if (typeof onSelectTab === 'function') {
      onSelectTab(tab);
    }
    if (typeof onTabChange === 'function') {
      onTabChange(tab);
    }
  };

  return (
    <nav className="fixed bottom-0 w-full max-w-[520px] z-50 pb-safe bg-black/75 backdrop-blur-xl shadow-[0_-8px_28px_rgba(0,0,0,0.5)]">
      <div className="h-[68px] px-2 flex justify-around items-center">
        <button
          aria-current={currentTab === 'odkrywaj' ? 'page' : undefined}
          onClick={() => handleSelect('odkrywaj')}
          className={`group flex flex-col items-center justify-center flex-1 h-full active:scale-[0.94] transition-[transform,color] duration-150 ease-out cursor-pointer ${
            currentTab === 'odkrywaj' ? 'text-white font-bold' : 'text-white/60 hover:text-white'
          }`}
          type="button"
        >
          <span
            className="material-symbols-outlined text-[22px]"
            style={{ fontVariationSettings: currentTab === 'odkrywaj' ? "'FILL' 1" : "'FILL' 0" }}
          >
            local_dining
          </span>
          <span className="font-label-sm text-label-sm mt-0.5 tracking-tight">{t('discover')}</span>
        </button>

        <button
          aria-current={currentTab === 'szukaj' ? 'page' : undefined}
          onClick={() => handleSelect('szukaj')}
          className={`group flex flex-col items-center justify-center flex-1 h-full active:scale-[0.94] transition-[transform,color] duration-150 ease-out cursor-pointer ${
            currentTab === 'szukaj' ? 'text-white font-bold' : 'text-white/60 hover:text-white'
          }`}
          type="button"
        >
          <span className="material-symbols-outlined text-[22px]">search</span>
          <span className="font-label-sm text-label-sm mt-0.5 tracking-tight">{t('search')}</span>
        </button>

        <button
          aria-current={currentTab === 'zakupy' ? 'page' : undefined}
          onClick={() => handleSelect('zakupy')}
          className={`group relative flex flex-col items-center justify-center flex-1 h-full active:scale-[0.94] transition-[transform,color] duration-150 ease-out cursor-pointer ${
            currentTab === 'zakupy' ? 'text-white font-bold' : 'text-white/60 hover:text-white'
          }`}
          type="button"
        >
          <span className="relative flex items-center justify-center leading-none">
            <span
              className="material-symbols-outlined text-[22px]"
              style={{ fontVariationSettings: currentTab === 'zakupy' ? "'FILL' 1" : "'FILL' 0" }}
            >
              shopping_basket
            </span>
            {badgeCount > 0 && (
              <span className="absolute -top-1 -right-2 bg-primary text-on-primary font-label-sm text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold shadow-xs">
                {badgeCount}
              </span>
            )}
          </span>
          <span className="font-label-sm text-label-sm mt-0.5 tracking-tight">{t('shopping')}</span>
        </button>

        <button
          aria-current={currentTab === 'zapisane' ? 'page' : undefined}
          onClick={() => handleSelect('zapisane')}
          className={`group flex flex-col items-center justify-center flex-1 h-full active:scale-[0.94] transition-[transform,color] duration-150 ease-out cursor-pointer ${
            currentTab === 'zapisane' ? 'text-white font-bold' : 'text-white/60 hover:text-white'
          }`}
          type="button"
        >
          <span
            className="material-symbols-outlined text-[22px]"
            style={{ fontVariationSettings: currentTab === 'zapisane' ? "'FILL' 1" : "'FILL' 0" }}
          >
            bookmark
          </span>
          <span className="font-label-sm text-label-sm mt-0.5 tracking-tight">{t('saved')}</span>
        </button>
      </div>
    </nav>
  );
};
