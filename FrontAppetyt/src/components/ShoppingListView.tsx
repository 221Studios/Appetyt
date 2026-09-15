import React, { useState, useMemo } from 'react';
import { ShoppingItem } from '../types';

interface ShoppingListViewProps {
  items: ShoppingItem[];
  onToggleBought: (itemId: string) => void;
  onClearBought: () => void;
  onAddItem: (title: string) => void;
  onDeleteItem: (itemId: string) => void;
  onSetItemPrice: (itemId: string, price: number) => void;
  onShowToast: (msg: string) => void;
}

export const ShoppingListView: React.FC<ShoppingListViewProps> = ({
  items,
  onToggleBought,
  onClearBought,
  onAddItem,
  onDeleteItem,
  onSetItemPrice,
  onShowToast,
}) => {
  const [quickInput, setQuickInput] = useState('');
  const [editingPriceItem, setEditingPriceItem] = useState<ShoppingItem | null>(null);
  const [customPriceVal, setCustomPriceVal] = useState('');
  const [selectedStore, setSelectedStore] = useState('Biedronka');
  const [collapsedGroups, setCollapsedGroups] = useState<{ [group: string]: boolean }>({});

  const totalCount = items.length;
  const boughtCount = items.filter((i) => i.isBought).length;
  const remainingCount = totalCount - boughtCount;
  const progressPercent = totalCount > 0 ? Math.round((boughtCount / totalCount) * 100) : 0;

  // Calculate sum of active (unbought) items with positive prices
  const estimatedSum = useMemo(() => {
    return items
      .filter((i) => !i.isBought)
      .reduce((acc, curr) => acc + (curr.price || 0), 0);
  }, [items]);

  const formattedSum = useMemo(() => {
    return estimatedSum.toFixed(2).replace('.', ',');
  }, [estimatedSum]);

  // Group items
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

  const handleQuickAdd = (title?: string) => {
    const textToAdd = title || quickInput.trim();
    if (!textToAdd) return;
    onAddItem(textToAdd);
    if (!title) setQuickInput('');
    onShowToast(`Dodano "${textToAdd}" do listy zakupów`);
  };

  const handleOpenPriceModal = (item: ShoppingItem) => {
    setEditingPriceItem(item);
    setCustomPriceVal(item.price > 0 ? item.price.toString() : '');
    setSelectedStore(item.storeName || 'Biedronka');
  };

  const handleSavePrice = () => {
    if (!editingPriceItem) return;
    const parsed = parseFloat(customPriceVal.replace(',', '.'));
    if (!isNaN(parsed) && parsed >= 0) {
      onSetItemPrice(editingPriceItem.id, parsed);
      onShowToast(`Zapisano cenę ${parsed.toFixed(2).replace('.', ',')} zł`);
    }
    setEditingPriceItem(null);
  };

  const handleShareList = () => {
    const unbought = items.filter((i) => !i.isBought);
    if (unbought.length === 0) {
      onShowToast('Wszystkie produkty są już kupione!');
      return;
    }
    const text = `🛒 Moja Lista Zakupów (Smakosz):\n` +
      unbought.map((i) => `• ${i.title}${i.subtitle ? ` (${i.subtitle})` : ''}${i.price > 0 ? ` - ${i.price.toFixed(2)} zł` : ''}`).join('\n') +
      `\n\nSzacowany koszt: ok. ${formattedSum} zł`;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text);
      onShowToast('Skopiowano listę zakupów do schowka!');
    } else {
      onShowToast('Lista przygotowana!');
    }
  };

  return (
    <div className="flex flex-col w-full pb-10">
      {/* Top Header Row */}
      <div className="px-4 pt-2 pb-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">
              Lista zakupów
            </h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="inline-block w-2 h-2 rounded-full bg-primary"></span>
              <p className="font-label-md text-label-md text-on-surface-variant font-semibold">
                {boughtCount} z {totalCount} kupionych
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={handleShareList}
              title="Kopiuj listę do schowka"
              className="w-10 h-10 rounded-xl flex items-center justify-center text-on-surface-variant hover:bg-surface-container active:scale-95 transition-all cursor-pointer"
              type="button"
            >
              <span className="material-symbols-outlined text-[20px]">share</span>
            </button>
            {boughtCount > 0 && (
              <button
                onClick={() => {
                  onClearBought();
                  onShowToast('Wyczyszczono kupione produkty');
                }}
                className="h-10 px-3 rounded-xl flex items-center justify-center font-label-md text-label-md text-primary hover:bg-primary-fixed/20 active:scale-95 transition-all cursor-pointer font-bold"
                type="button"
              >
                Wyczyść kupione
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Estimated Cost Summary Card */}
      <div className="px-4 mb-3">
        <div className="p-4 rounded-2xl bg-surface-container-low shadow-[0_2px_12px_rgba(26,28,28,0.03)] flex flex-col gap-2 border border-surface-container-high/40">
          <div className="flex items-baseline justify-between">
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-bold">
              Szacowany koszt
            </span>
            <span className="font-headline-md text-headline-md text-primary tracking-tight font-extrabold">
              ok. {formattedSum} zł
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-on-surface-variant">
            <span className="material-symbols-outlined text-[16px] text-primary">info</span>
            <span className="font-body-sm text-body-sm">
              Częściowa estymacja na bazie całych opakowań
            </span>
          </div>
          <div className="w-full bg-surface-container-highest h-1.5 rounded-full overflow-hidden mt-1">
            <div
              className="bg-primary h-full rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Notice Card */}
      <div className="px-4 mb-4">
        <div className="px-3 py-2.5 rounded-xl bg-surface-container flex items-start gap-2.5 border border-surface-container-high/30">
          <span className="material-symbols-outlined text-[18px] text-on-surface-variant flex-shrink-0 mt-0.5">
            verified_user
          </span>
          <p className="font-body-sm text-body-sm text-on-surface-variant leading-snug">
            Pozycje odznaczone nie wchodzą do sumy. Przyprawy i drobiazgi pomijamy. Ceny orientacyjne z katalogu lub Twoich paragonów.
          </p>
        </div>
      </div>

      {/* Empty State */}
      {items.length === 0 ? (
        <div className="mx-4 p-8 rounded-2xl bg-surface-container-low flex flex-col items-center text-center gap-3 border border-surface-container-high/30">
          <div className="w-14 h-14 rounded-full bg-surface-container-high flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-[28px]">shopping_cart</span>
          </div>
          <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
            Lista zakupów jest pusta
          </h3>
          <p className="font-body-sm text-body-sm text-on-surface-variant max-w-[280px]">
            Dodaj brakujące składniki z przepisów lub wpisz własne produkty poniżej.
          </p>
          <div className="flex flex-wrap justify-center gap-2 mt-2">
            {['Masło 82%', 'Jajka wolny wybieg', 'Mleko 3.2%', 'Chleb żytni'].map((preset) => (
              <button
                key={preset}
                onClick={() => handleQuickAdd(preset)}
                className="px-3 py-1.5 rounded-xl bg-surface-container hover:bg-surface-container-highest text-on-surface font-label-sm font-semibold flex items-center gap-1 active:scale-95 transition-all cursor-pointer"
                type="button"
              >
                <span className="material-symbols-outlined text-[14px] text-primary">add</span>
                {preset}
              </button>
            ))}
          </div>
        </div>
      ) : (
        /* Groups Container */
        <div className="px-4 flex flex-col gap-3">
          {(Object.entries(groupedItems) as [string, ShoppingItem[]][]).map(([groupId, groupList]) => {
            const isCollapsed = !!collapsedGroups[groupId];
            const firstItem = groupList[0];
            const groupTitle = firstItem?.groupTitle || 'Grupa';
            const groupIcon = firstItem?.groupIcon || 'shopping_bag';
            const groupBoughtCount = groupList.filter((i) => i.isBought).length;
            const isAllBought = groupBoughtCount === groupList.length && groupList.length > 0;

            return (
              <div
                key={groupId}
                className="rounded-2xl bg-surface-container-lowest shadow-[0_1px_4px_rgba(26,28,28,0.04)] overflow-hidden border border-surface-container-high/40"
              >
                <button
                  onClick={() => toggleGroup(groupId)}
                  className="w-full p-4 flex items-center justify-between text-left min-h-[48px] active:bg-surface-container-low transition-colors cursor-pointer"
                  type="button"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold ${
                        groupId === 'szakszuka'
                          ? 'bg-tertiary-fixed text-on-tertiary-fixed'
                          : groupId === 'pappardelle'
                          ? 'bg-primary-fixed text-on-primary-fixed'
                          : 'bg-surface-container-high text-on-surface'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[18px]">{groupIcon}</span>
                    </div>
                    <div>
                      <span
                        className={`font-label-sm text-label-sm uppercase font-bold tracking-wider ${
                          groupId === 'szakszuka'
                            ? 'text-tertiary'
                            : groupId === 'pappardelle'
                            ? 'text-primary'
                            : 'text-on-surface-variant'
                        }`}
                      >
                        {groupId === 'custom' ? 'Prywatne' : 'Przepis'}
                      </span>
                      <h2 className="font-headline-sm text-headline-sm text-on-surface">
                        {groupTitle}
                      </h2>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {isAllBought ? (
                      <span className="font-label-md text-label-md text-tertiary bg-tertiary-container/30 px-2 py-0.5 rounded-full font-bold">
                        Kupione {groupBoughtCount}/{groupList.length}
                      </span>
                    ) : (
                      <span className="font-label-md text-label-md text-on-surface-variant px-2 py-0.5 rounded-full bg-surface-container">
                        {groupList.length} {groupList.length === 1 ? 'składnik' : 'składniki'}
                      </span>
                    )}
                    <span
                      className="material-symbols-outlined text-[20px] text-on-surface-variant transition-transform"
                      style={{ transform: isCollapsed ? 'rotate(180deg)' : 'rotate(0deg)' }}
                    >
                      expand_more
                    </span>
                  </div>
                </button>

                {!isCollapsed && (
                  <div className="flex flex-col divide-y divide-surface-container-high/30">
                    {groupList.map((item) => (
                      <div
                        key={item.id}
                        className={`flex items-center justify-between px-4 py-3 min-h-[64px] bg-surface-container-lowest transition-colors ${
                          item.isBought ? 'bg-surface-container-low/40' : ''
                        }`}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0 pr-2">
                          {/* Checkbox */}
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

                          <div
                            className={`flex flex-col min-w-0 flex-1 transition-opacity ${
                              item.isBought ? 'opacity-60' : ''
                            }`}
                          >
                            <span
                              className={`font-body-md text-body-md font-semibold truncate ${
                                item.isBought
                                  ? 'line-through text-on-surface-variant'
                                  : 'text-on-surface'
                              }`}
                            >
                              {item.title}
                            </span>
                            <span className="font-body-sm text-body-sm text-on-surface-variant truncate">
                              {item.isBought ? 'Kupiono' : item.subtitle}
                            </span>

                            <div className="flex items-center gap-1.5 mt-0.5">
                              {item.price > 0 ? (
                                <>
                                  <span
                                    className={`font-label-md text-label-md font-bold ${
                                      item.isBought ? 'text-on-surface-variant' : 'text-primary'
                                    }`}
                                  >
                                    {item.isBought
                                      ? `${item.price.toFixed(2).replace('.', ',')} zł (nie wliczone w sumę)`
                                      : `~${item.price.toFixed(2).replace('.', ',')} zł`}
                                  </span>
                                  {item.storeName && !item.isBought && (
                                    <span className="text-on-surface-variant text-[11px]">
                                      • {item.storeName}
                                    </span>
                                  )}
                                </>
                              ) : (
                                <button
                                  onClick={() => handleOpenPriceModal(item)}
                                  className="px-2.5 py-1 rounded-lg bg-primary-fixed/40 hover:bg-primary-fixed text-on-primary-fixed-variant font-label-sm text-label-sm font-bold flex items-center gap-1 active:scale-95 transition-all cursor-pointer"
                                  type="button"
                                >
                                  <span className="material-symbols-outlined text-[14px]">sell</span>
                                  <span>+ Dodaj cenę opakowania</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Action Menu / Delete */}
                        <div className="flex items-center flex-shrink-0">
                          {item.group === 'custom' ? (
                            <button
                              aria-label="Usuń pozycję"
                              onClick={() => {
                                onDeleteItem(item.id);
                                onShowToast(`Usunięto "${item.title}"`);
                              }}
                              className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:text-error active:scale-95 transition-colors cursor-pointer"
                              type="button"
                            >
                              <span className="material-symbols-outlined text-[20px]">
                                delete_outline
                              </span>
                            </button>
                          ) : (
                            <button
                              aria-label="Więcej opcji"
                              onClick={() => handleOpenPriceModal(item)}
                              className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container active:scale-95 transition-colors cursor-pointer"
                              type="button"
                            >
                              <span className="material-symbols-outlined text-[20px]">
                                {item.isBought ? 'more_vert' : 'edit'}
                              </span>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Quick Add Bar */}
      <div className="px-4 mt-4">
        <div className="p-1.5 bg-surface-container-low rounded-2xl flex items-center gap-2 shadow-[0_2px_8px_rgba(26,28,28,0.03)] border border-surface-container-high/40">
          <div className="w-10 h-10 rounded-xl bg-surface-container-lowest flex items-center justify-center text-primary flex-shrink-0 shadow-xs">
            <span className="material-symbols-outlined text-[22px]">add</span>
          </div>
          <input
            className="flex-1 bg-transparent font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none min-h-[44px]"
            placeholder="Wpisz np. mleko owsiane, sok z cytryny..."
            value={quickInput}
            onChange={(e) => setQuickInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleQuickAdd();
            }}
            type="text"
          />
          <button
            onClick={() => handleQuickAdd()}
            className="h-10 px-4 rounded-xl bg-primary text-on-primary font-label-md text-label-md font-bold flex items-center justify-center active:scale-95 transition-all cursor-pointer shadow-xs"
            type="button"
          >
            Dodaj
          </button>
        </div>
      </div>

      {/* Quick suggestions pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar px-4 mt-2">
        <span className="text-on-surface-variant text-[11px] font-semibold shrink-0">Szybkie:</span>
        {['Masło', 'Chleb', 'Jajka', 'Cytryny', 'Czosnek'].map((pill) => (
          <button
            key={pill}
            onClick={() => handleQuickAdd(pill)}
            className="shrink-0 px-2.5 py-1 rounded-lg bg-surface-container text-on-surface font-label-sm text-label-sm hover:bg-surface-container-high active:scale-95 transition-all cursor-pointer"
            type="button"
          >
            + {pill}
          </button>
        ))}
      </div>

      {/* Bottom Summary Tracker */}
      <div className="px-4 mt-3 mb-2">
        <div className="flex items-center justify-between px-2 text-on-surface-variant">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-tertiary">
              check_circle
            </span>
            <span className="font-label-md text-label-md font-semibold">
              Kupione: {boughtCount} / Pozostało: {remainingCount}
            </span>
          </div>
          <span className="font-label-sm text-label-sm uppercase tracking-wider font-bold text-on-surface-variant/70">
            Wszystkich: {totalCount}
          </span>
        </div>
      </div>

      {/* Price Edit Modal */}
      {editingPriceItem && (
        <div
          className="fixed inset-0 z-50 bg-inverse-surface/60 backdrop-blur-xs flex items-end justify-center p-0"
          onClick={() => setEditingPriceItem(null)}
        >
          <div
            className="w-full max-w-[520px] bg-surface-container-lowest rounded-t-3xl p-5 flex flex-col gap-4 shadow-2xl animate-in slide-in-from-bottom-6 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-1.5 bg-surface-container-highest rounded-full self-center"></div>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                  Edycja ceny produktu
                </h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  {editingPriceItem.title}
                </p>
              </div>
              <button
                onClick={() => setEditingPriceItem(null)}
                className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container cursor-pointer"
                type="button"
              >
                <span className="material-symbols-outlined text-[22px]">close</span>
              </button>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-label-sm text-label-sm font-bold uppercase tracking-wider text-on-surface-variant">
                Cena za całe opakowanie
              </label>
              <div className="relative flex items-center">
                <input
                  className="w-full h-14 pl-4 pr-12 rounded-xl bg-surface-container font-headline-md text-headline-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="0.00"
                  step="0.01"
                  type="number"
                  autoFocus
                  value={customPriceVal}
                  onChange={(e) => setCustomPriceVal(e.target.value)}
                />
                <span className="absolute right-4 font-headline-sm text-headline-sm text-on-surface-variant font-bold">
                  zł
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-label-sm text-label-sm font-bold uppercase tracking-wider text-on-surface-variant">
                Sklep / Dyskont
              </label>
              <div className="flex flex-wrap gap-2">
                {['Biedronka', 'Lidl', 'Carrefour', 'Kaufland', 'Dino', 'Lokalny'].map((store) => (
                  <button
                    key={store}
                    onClick={() => setSelectedStore(store)}
                    className={`px-3 py-1.5 rounded-xl font-label-md text-label-md cursor-pointer transition-colors ${
                      selectedStore === store
                        ? 'bg-primary text-on-primary font-bold shadow-xs'
                        : 'bg-surface-container text-on-surface'
                    }`}
                    type="button"
                  >
                    {store}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 pb-safe">
              <button
                onClick={handleSavePrice}
                className="flex-1 h-12 rounded-xl bg-primary text-on-primary font-label-lg text-label-lg font-bold flex items-center justify-center shadow-[0_4px_16px_rgba(254,147,44,0.28)] active:scale-95 transition-all cursor-pointer"
                type="button"
              >
                Zapisz cenę
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
