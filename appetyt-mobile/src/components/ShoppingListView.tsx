import React, { useMemo, useState } from 'react';
import { buildShoppingGroups, type ShoppingFilterMode } from '../data/shoppingGroups';
import { STORE_AISLE_ORDER, type StoreAisleId } from '../data/storeAisles';
import { convertMeasurementText } from '../data/measurements';
import { ShoppingItem } from '../types';
import { useTranslation } from '../i18n';

interface ShoppingListViewProps {
  items: ShoppingItem[];
  filterMode?: ShoppingFilterMode;
  onToggleBought: (itemIds: string[], isBought: boolean) => void;
  onClearBought: () => void;
  onDeleteGroup: (groupId: string) => void;
  onShowToast: (msg: string) => void;
  onOpenFilter: () => void;
}

const AISLE_LABEL_KEYS = {
  produce: 'aisleProduce',
  bakery: 'aisleBakery',
  dairy: 'aisleDairy',
  meat: 'aisleMeat',
  dry: 'aisleDry',
  jar: 'aisleJar',
  sauce: 'aisleSauce',
  sweets: 'aisleSweets',
  drinks: 'aisleDrinks',
  other: 'aisleOther',
  frozen: 'aisleFrozen',
} as const satisfies Record<StoreAisleId, 'aisleProduce' | 'aisleBakery' | 'aisleDairy' | 'aisleMeat' | 'aisleDry' | 'aisleJar' | 'aisleSauce' | 'aisleSweets' | 'aisleDrinks' | 'aisleOther' | 'aisleFrozen'>;

export function ShoppingListView({
  items,
  filterMode = 'byRecipe',
  onToggleBought,
  onClearBought,
  onDeleteGroup,
  onShowToast,
  onOpenFilter,
}: ShoppingListViewProps) {
  const { measurementSystem, t, count } = useTranslation();
  const [collapsedGroups, setCollapsedGroups] = useState<{ [group: string]: boolean }>({});

  const boughtCount = items.filter((item) => item.isBought).length;
  const filterActive = filterMode !== 'byRecipe';

  const groups = useMemo(() => {
    const aisles = Object.fromEntries(
      STORE_AISLE_ORDER.map((aisle) => [aisle, t(AISLE_LABEL_KEYS[aisle])]),
    ) as Record<StoreAisleId, string>;
    return buildShoppingGroups(items, filterMode, {
      aisles,
      recipe: t('recipeGroup'),
      privateGroup: t('privateGroup'),
      aisle: t('aisleGroup'),
    });
  }, [filterMode, items, t]);

  const toggleGroup = (groupId: string) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  const handleShareList = () => {
    const unbought = items.filter((item) => !item.isBought);
    if (unbought.length === 0) {
      onShowToast(t('allBought') + '!');
      return;
    }

    const text = filterMode === 'byRecipe'
      ? `🛒 ${t('shoppingList')}:\n` + unbought.map((item) => `• ${convertMeasurementText(item.title, measurementSystem)}`).join('\n')
      : `🛒 ${t('shoppingList')}:\n` + groups.map((group) => {
          const lines = group.sections.flatMap((section) => {
            const visible = section.lines.filter((line) => !line.isBought);
            if (!visible.length) return [];
            const heading = section.title ? [`${section.title}`] : [];
            return [...heading, ...visible.map((line) => `• ${convertMeasurementText(line.title, measurementSystem)}`)];
          });
          if (!lines.length) return '';
          return `\n${group.title}\n${lines.join('\n')}`;
        }).filter(Boolean).join('\n');

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text);
      onShowToast(t('copyListSuccess'));
    } else {
      onShowToast(t('listReady'));
    }
  };

  const filterButton = (
    <button
      onClick={onOpenFilter}
      aria-label={t('shoppingFilter')}
      aria-pressed={filterActive}
      title={t('shoppingFilter')}
      className={`w-10 h-10 rounded-xl flex items-center justify-center hover:bg-surface-container active:scale-95 transition-all cursor-pointer ${
        filterActive ? 'text-primary' : 'text-on-surface-variant'
      }`}
      type="button"
    >
      <span className="material-symbols-outlined text-[20px]">filter_list</span>
    </button>
  );

  if (items.length === 0) {
    return (
      <div className="flex flex-col w-full pb-10">
        <div className="px-4 pt-2 pb-3 flex items-center justify-between gap-2">
          <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">
            {t('shoppingList')}
          </h1>
          {filterButton}
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
          {filterButton}
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
        {groups.map((group) => {
          const collapseKey = `${filterMode}:${group.id}`;
          const isCollapsed = !!collapsedGroups[collapseKey];
          const lines = group.sections.flatMap((section) => section.lines);
          const groupBoughtCount = lines.filter((line) => line.isBought).length;
          const isAllBought = groupBoughtCount === lines.length && lines.length > 0;

          return (
            <div
              key={collapseKey}
              className="rounded-2xl bg-surface-container-lowest shadow-[0_1px_4px_rgba(26,28,28,0.04)] overflow-hidden"
            >
              <div className="w-full p-4 flex items-center justify-between min-h-[48px]">
                <button
                  onClick={() => toggleGroup(collapseKey)}
                  className="flex items-center gap-3 text-left flex-1 min-w-0 active:opacity-80 cursor-pointer"
                  type="button"
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold bg-surface-container-high text-on-surface shrink-0">
                    <span className="material-symbols-outlined text-[18px]">{group.icon}</span>
                  </div>
                  <div className="min-w-0">
                    <span className="font-label-sm text-label-sm uppercase font-bold tracking-wider text-on-surface-variant">
                      {group.eyebrow}
                    </span>
                    <h2 className="font-headline-sm text-headline-sm text-on-surface truncate">
                      {group.title}
                    </h2>
                  </div>
                </button>

                <div className="flex items-center gap-1 shrink-0">
                  {isAllBought ? (
                    <span className="font-label-md text-label-md text-tertiary bg-tertiary-container/30 px-2 py-0.5 rounded-full font-bold">
                      {t('allBought')} {groupBoughtCount}/{lines.length}
                    </span>
                  ) : (
                    <span className="font-label-md text-label-md text-on-surface-variant px-2 py-0.5 rounded-full bg-surface-container">
                      {lines.length} {count('product', lines.length)}
                    </span>
                  )}
                  {group.canDelete && (
                    <button
                      aria-label={t('deleteRecipeFromList')}
                      onClick={() => {
                        onDeleteGroup(group.id);
                        onShowToast(t('removedGroupToast', { group: group.title }));
                      }}
                      className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:text-error active:scale-95 transition-colors cursor-pointer"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[20px]">delete_outline</span>
                    </button>
                  )}
                  <button
                    onClick={() => toggleGroup(collapseKey)}
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
                <div className="flex flex-col">
                  {group.sections.map((section) => (
                    <div key={section.id} className="flex flex-col">
                      {section.title && (
                        <div className="px-4 pt-3 pb-1 bg-surface-container-low/70">
                          <span className="font-label-sm text-label-sm uppercase font-bold tracking-wider text-on-surface-variant">
                            {section.title}
                          </span>
                        </div>
                      )}
                      <div className="flex flex-col divide-y divide-surface-container-high/30">
                        {section.lines.map((line) => (
                          <div
                            key={line.key}
                            className={`flex items-center px-4 py-3 min-h-[56px] bg-surface-container-lowest transition-colors ${
                              line.isBought ? 'bg-surface-container-low/40' : ''
                            }`}
                          >
                            <button
                              onClick={() => onToggleBought(line.ids, !line.isBought)}
                              className="w-10 h-10 -ml-2 rounded-xl flex items-center justify-center flex-shrink-0 active:scale-90 transition-transform cursor-pointer"
                              type="button"
                            >
                              <span
                                className={`w-6 h-6 rounded-lg flex items-center justify-center text-on-tertiary transition-colors ${
                                  line.isBought ? 'bg-tertiary shadow-xs' : 'bg-surface-container-high'
                                }`}
                              >
                                <span
                                  className={`material-symbols-outlined text-[18px] transition-opacity ${
                                    line.isBought ? 'opacity-100' : 'opacity-0'
                                  }`}
                                >
                                  check
                                </span>
                              </span>
                            </button>

                            <span
                              className={`font-body-md text-body-md font-semibold whitespace-normal break-words min-w-0 flex-1 ${
                                line.isBought ? 'line-through text-on-surface-variant opacity-60' : 'text-on-surface'
                              }`}
                            >
                              {convertMeasurementText(line.title, measurementSystem)}
                            </span>
                          </div>
                        ))}
                      </div>
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
}
