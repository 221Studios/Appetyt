import React from 'react';

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
    <nav className="fixed bottom-0 w-full max-w-[520px] z-50 pb-safe bg-surface/90 backdrop-blur-xl shadow-[0_-2px_12px_rgba(0,0,0,0.04)] border-t border-surface-container-high/40">
      <div className="h-[68px] px-2 flex justify-around items-center">
        <button
          aria-current={currentTab === 'odkrywaj' ? 'page' : undefined}
          onClick={() => handleSelect('odkrywaj')}
          className={`group flex flex-col items-center justify-center flex-1 h-full transition-colors cursor-pointer ${
            currentTab === 'odkrywaj' ? 'text-primary font-bold' : 'text-on-surface-variant hover:text-on-surface'
          }`}
          type="button"
        >
          <span
            className="material-symbols-outlined text-[22px]"
            style={{ fontVariationSettings: currentTab === 'odkrywaj' ? "'FILL' 1" : "'FILL' 0" }}
          >
            local_dining
          </span>
          <span className="font-label-sm text-label-sm mt-0.5 tracking-tight">Odkrywaj</span>
        </button>

        <button
          aria-current={currentTab === 'szukaj' ? 'page' : undefined}
          onClick={() => handleSelect('szukaj')}
          className={`group flex flex-col items-center justify-center flex-1 h-full transition-colors cursor-pointer ${
            currentTab === 'szukaj' ? 'text-primary font-bold' : 'text-on-surface-variant hover:text-on-surface'
          }`}
          type="button"
        >
          <span className="material-symbols-outlined text-[22px]">search</span>
          <span className="font-label-sm text-label-sm mt-0.5 tracking-tight">Szukaj</span>
        </button>

        <button
          aria-current={currentTab === 'zakupy' ? 'page' : undefined}
          onClick={() => handleSelect('zakupy')}
          className={`group relative flex flex-col items-center justify-center flex-1 h-full transition-colors cursor-pointer ${
            currentTab === 'zakupy' ? 'text-primary font-bold' : 'text-on-surface-variant hover:text-on-surface'
          }`}
          type="button"
        >
          <div className="relative">
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
          </div>
          <span className="font-label-sm text-label-sm mt-0.5 tracking-tight">Zakupy</span>
        </button>

        <button
          aria-current={currentTab === 'zapisane' ? 'page' : undefined}
          onClick={() => handleSelect('zapisane')}
          className={`group flex flex-col items-center justify-center flex-1 h-full transition-colors cursor-pointer ${
            currentTab === 'zapisane' ? 'text-primary font-bold' : 'text-on-surface-variant hover:text-on-surface'
          }`}
          type="button"
        >
          <span
            className="material-symbols-outlined text-[22px]"
            style={{ fontVariationSettings: currentTab === 'zapisane' ? "'FILL' 1" : "'FILL' 0" }}
          >
            bookmark
          </span>
          <span className="font-label-sm text-label-sm mt-0.5 tracking-tight">Zapisane</span>
        </button>
      </div>
    </nav>
  );
};
