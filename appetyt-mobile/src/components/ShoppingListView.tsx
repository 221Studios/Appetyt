import React, { useState, useMemo } from 'react';
import { convertMeasurementText } from '../data/measurements';
import { ShoppingItem } from '../types';
import { useTranslation } from '../i18n';

interface ShoppingListViewProps {
  items: ShoppingItem[];
  onToggleBought: (itemId: string) => void;
  onClearBought: () => void;
  onDeleteGroup: (groupId: string) => void;
  onShowToast: (msg: string) => void;
}

export const ShoppingListView: React.FC<ShoppingListViewProps> = ({
  items,
  onToggleBought,
  onClearBought,
  onDeleteGroup,
  onShowToast,
}) => {
  const { measurementSystem, t, count } = useTranslation();
  const [collapsedGroups, setCollapsedGroups] = useState<{ [group: string]: boolean }>({});

  const boughtCount = items.filter((i) => i.isBought).length;

  const groupedItems = useMemo(() => {
    const groups: { [key: string]: ShoppingItem[] } = {};
    items.forEach((item) => {
      const g = item.group || 'custom';
      if (!groups[g]) groups[g] = [];
      groups[g].push(item);
    });
    return groups;
  }, [items]);

  const toggleGroup = (groupId: string) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  const handleShareList = () => {
    const unbought = items.filter((i) => !i.isBought);
    if (unbought.length === 0) {
      onShowToast(t('allBought') + '!');
      return;
    }
    const text =
      `🛒 ${t('shoppingList')}:\n` +
      unbought.map((i) => `• ${convertMeasurementText(i.title, measurementSystem)}`).join('\n');

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text);
      onShowToast(t('copyListSuccess'));
    } else {
      onShowToast(t('listReady'));
    }
  };

  if (items.length === 0) {
    return (
      <div className="flex flex-col w-full pb-10">
        <div className="px-4 pt-2 pb-3">
          <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">
            {t('shoppingList')}
          </h1>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full pb-10">
      <div className="px-4 pt-2 pb-3 flex items-center justify-between gap-2">
        <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">
          {t('shoppingList')}
        </h1>
        <div className="flex items-center gap-1">
          <button
            onClick={handleShareList}
            title={t('copyShoppingList')}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-on-surface-variant hover:bg-surface-container active:scale-95 transition-all cursor-pointer"
            type="button"
          >
            <span className="material-symbols-outlined text-[20px]">share</span>
          </button>
          {boughtCount > 0 && (
            <button
              onClick={() => {
                onClearBought();
                onShowToast(t('clearedBoughtToast'));
              }}
              className="h-10 px-3 rounded-xl flex items-center justify-center font-label-md text-label-md text-primary hover:bg-primary-fixed/20 active:scale-95 transition-all cursor-pointer font-bold"
              type="button"
            >
              {t('clearBought')}
            </button>
          )}
        </div>
      </div>

      <div className="px-4 flex flex-col gap-3">
        {(Object.entries(groupedItems) as [string, ShoppingItem[]][]).map(([groupId, groupList]) => {
          const isCollapsed = !!collapsedGroups[groupId];
          const firstItem = groupList[0];
          const groupTitle = firstItem?.groupTitle || t('privateGroup');
          const groupIcon = firstItem?.groupIcon || 'shopping_bag';
          const groupBoughtCount = groupList.filter((i) => i.isBought).length;
          const isAllBought = groupBoughtCount === groupList.length && groupList.length > 0;

          return (
            <div
              key={groupId}
              className="rounded-2xl bg-surface-container-lowest shadow-[0_1px_4px_rgba(26,28,28,0.04)] overflow-hidden"
            >
              <div className="w-full p-4 flex items-center justify-between min-h-[48px]">
                <button
                  onClick={() => toggleGroup(groupId)}
                  className="flex items-center gap-3 text-left flex-1 min-w-0 active:opacity-80 cursor-pointer"
                  type="button"
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold bg-surface-container-high text-on-surface shrink-0">
                    <span className="material-symbols-outlined text-[18px]">{groupIcon}</span>
                  </div>
                  <div className="min-w-0">
                    <span className="font-label-sm text-label-sm uppercase font-bold tracking-wider text-on-surface-variant">
                      {groupId === 'custom' ? t('privateGroup') : t('recipeGroup')}
                    </span>
                    <h2 className="font-headline-sm text-headline-sm text-on-surface truncate">
                      {groupTitle}
                    </h2>
                  </div>
                </button>

                <div className="flex items-center gap-1 shrink-0">
                  {isAllBought ? (
                    <span className="font-label-md text-label-md text-tertiary bg-tertiary-container/30 px-2 py-0.5 rounded-full font-bold">
                      {t('allBought')} {groupBoughtCount}/{groupList.length}
                    </span>
                  ) : (
                    <span className="font-label-md text-label-md text-on-surface-variant px-2 py-0.5 rounded-full bg-surface-container">
                      {groupList.length} {count('product', groupList.length)}
                    </span>
                  )}
                  <button
                    aria-label={t('deleteRecipeFromList')}
                    onClick={() => {
                      onDeleteGroup(groupId);
                      onShowToast(t('removedGroupToast', { group: groupTitle }));
                    }}
                    className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:text-error active:scale-95 transition-colors cursor-pointer"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[20px]">delete_outline</span>
                  </button>
                  <button
                    onClick={() => toggleGroup(groupId)}
                    className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant cursor-pointer"
                    type="button"
                    aria-label={isCollapsed ? t('expand') : t('collapse')}
                  >
                    <span
                      className="material-symbols-outlined text-[20px] transition-transform"
                      style={{ transform: isCollapsed ? 'rotate(180deg)' : 'rotate(0deg)' }}
                    >
                      expand_more
                    </span>
                  </button>
                </div>
              </div>

              {!isCollapsed && (
                <div className="flex flex-col divide-y divide-surface-container-high/30">
                  {groupList.map((item) => (
                    <div
                      key={item.id}
                      className={`flex items-center px-4 py-3 min-h-[56px] bg-surface-container-lowest transition-colors ${
                        item.isBought ? 'bg-surface-container-low/40' : ''
                      }`}
                    >
                      <button
                        onClick={() => onToggleBought(item.id)}
                        className="w-10 h-10 -ml-2 rounded-xl flex items-center justify-center flex-shrink-0 active:scale-90 transition-transform cursor-pointer"
                        type="button"
                      >
                        <span
                          className={`w-6 h-6 rounded-lg flex items-center justify-center text-on-tertiary transition-colors ${
                            item.isBought ? 'bg-tertiary shadow-xs' : 'bg-surface-container-high'
                          }`}
                        >
                          <span
                            className={`material-symbols-outlined text-[18px] transition-opacity ${
                              item.isBought ? 'opacity-100' : 'opacity-0'
                            }`}
                          >
                            check
                          </span>
                        </span>
                      </button>

                      <span
                        className={`font-body-md text-body-md font-semibold truncate min-w-0 flex-1 ${
                          item.isBought
                            ? 'line-through text-on-surface-variant opacity-60'
                            : 'text-on-surface'
                        }`}
                      >
                        {convertMeasurementText(item.title, measurementSystem)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
