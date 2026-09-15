import React, { useState } from 'react';
import { Recipe, Chef } from '../types';

interface DiscoverViewProps {
  onSelectRecipe: (recipe: Recipe) => void;
  onSelectChef: (chef: Chef) => void;
  onNavigateTab: (tab: 'szukaj' | 'lodowka' | 'zakupy') => void;
  recipes: Recipe[];
  chefs: Chef[];
  bookmarkedRecipeIds: string[];
  onToggleBookmark: (recipeId: string) => void;
  onAddCustomItemToShopping: (item: { title: string; price: number; storeName?: string }) => void;
  onShowToast: (msg: string) => void;
}

export const DiscoverView: React.FC<DiscoverViewProps> = ({
  onSelectRecipe,
  onSelectChef,
  onNavigateTab,
  recipes,
  chefs,
  bookmarkedRecipeIds,
  onToggleBookmark,
  onAddCustomItemToShopping,
  onShowToast,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('Szybkie obiady (<25 min)');
  const [historyCleared, setHistoryCleared] = useState(false);

  // Featured Recipe of the week
  const featuredRecipe = recipes.find((r) => r.id === 'pappardelle-borowiki') || recipes[0];
  const forYouRecipes = recipes.filter((r) => r.id !== 'pappardelle-borowiki').slice(0, 3);

  const categories = [
    { label: 'Szybkie obiady (<25 min)', icon: 'bolt' },
    { label: 'Kuchnia polska', icon: 'restaurant' },
    { label: 'Makarony & Risotto', icon: 'ramen_dining' },
    { label: 'Street Food & Burgery', icon: 'lunch_dining' },
    { label: 'Wege & Roślinne', icon: 'eco' },
    { label: 'Słodkości', icon: 'cake' },
  ];

  const handleBookmarkClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    onToggleBookmark(id);
    const isNowBookmarked = !bookmarkedRecipeIds.includes(id);
    onShowToast(isNowBookmarked ? 'Zapisano przepis!' : 'Usunięto z zapisanych');
  };

  const handleAddFridgeMissing = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddCustomItemToShopping({
      title: 'Świeża bazylia',
      price: 4.99,
      storeName: 'Biedronka (lodówka)',
    });
    onShowToast('Świeża bazylia dodana do listy zakupów!');
  };

  return (
    <div className="flex flex-col w-full pb-10">
      {/* Quick Search Static Bar */}
      <div className="px-4 pt-3 pb-2">
        <button
          onClick={() => onNavigateTab('szukaj')}
          className="w-full h-12 bg-surface-container-lowest rounded-xl flex items-center px-4 gap-3 shadow-[0_2px_8px_rgba(26,28,28,0.04)] active:scale-[0.99] transition-all cursor-pointer text-left border border-surface-container-high/30"
          type="button"
        >
          <span className="material-symbols-outlined text-primary text-[22px]">search</span>
          <span className="font-body-md text-body-md text-on-surface-variant flex-1 truncate">
            Szukaj dań, składników, szefów...
          </span>
          <div className="w-7 h-7 rounded-lg bg-surface-container flex items-center justify-center text-on-surface-variant">
            <span className="material-symbols-outlined text-[16px]">tune</span>
          </div>
        </button>
      </div>

      {/* PÓŁKA 1: Hero Tygodnia (16:9 Featured Canvas) */}
      <section className="px-4 pt-3">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-1.5">
            <span
              className="material-symbols-outlined text-primary text-[18px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              local_fire_department
            </span>
            <h2 className="font-headline-sm text-headline-sm text-on-surface tracking-tight">
              Wybór Tygodnia
            </h2>
          </div>
          <span className="font-label-sm text-label-sm uppercase tracking-wider text-primary font-bold">
            Polecane
          </span>
        </div>

        <div
          onClick={() => onSelectRecipe(featuredRecipe)}
          className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden bg-surface-container-highest shadow-[0_4px_16px_rgba(26,28,28,0.08)] group cursor-pointer"
        >
          <img
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
            src={featuredRecipe.imageUrl}
            alt={featuredRecipe.imageAlt}
          />
          {/* Scrim Gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-inverse-surface/95 via-inverse-surface/40 to-transparent flex flex-col justify-between p-4">
            {/* Top Badges Row */}
            <div className="flex items-center justify-between w-full">
              <div className="bg-surface-container-lowest/90 backdrop-blur-md px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
                <span className="material-symbols-outlined text-tertiary text-[14px]">verified</span>
                <span className="font-label-sm text-label-sm text-on-surface">
                  Źródło: tomaszjakubiak.pl
                </span>
              </div>
              <button
                aria-label="Zapisz przepis"
                onClick={(e) => handleBookmarkClick(e, featuredRecipe.id)}
                className={`bookmark-btn w-9 h-9 rounded-full bg-surface-container-lowest/90 backdrop-blur-md flex items-center justify-center hover:text-primary active:scale-90 transition-all shadow-sm ${
                  bookmarkedRecipeIds.includes(featuredRecipe.id) ? 'text-primary' : 'text-on-surface'
                }`}
                type="button"
              >
                <span
                  className="material-symbols-outlined text-[20px]"
                  style={{
                    fontVariationSettings: bookmarkedRecipeIds.includes(featuredRecipe.id)
                      ? "'FILL' 1"
                      : "'FILL' 0",
                  }}
                >
                  bookmark
                </span>
              </button>
            </div>

            {/* Bottom Content & Stats */}
            <div className="flex flex-col gap-2">
              <div className="flex flex-col">
                <span className="font-label-md text-label-md text-primary-fixed tracking-wide">
                  Szef Tomasz Jakubiak
                </span>
                <h3 className="font-headline-md text-headline-md text-on-primary line-clamp-1">
                  {featuredRecipe.title}
                </h3>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <div className="bg-inverse-surface/80 backdrop-blur-md px-2.5 py-1 rounded-lg flex items-center gap-1 text-on-primary">
                  <span className="material-symbols-outlined text-primary-container text-[14px]">
                    timer
                  </span>
                  <span className="font-label-sm text-label-sm font-medium">
                    {featuredRecipe.durationMinutes} min
                  </span>
                </div>
                <div className="bg-inverse-surface/80 backdrop-blur-md px-2.5 py-1 rounded-lg flex items-center gap-1 text-inverse-on-surface/75">
                  <span className="material-symbols-outlined text-[14px]">local_fire_department</span>
                  <span className="font-label-sm text-label-sm font-medium">
                    kcal: {featuredRecipe.caloriesText}
                  </span>
                </div>
                <div className="bg-inverse-surface/80 backdrop-blur-md px-2.5 py-1 rounded-lg flex items-center gap-1 text-inverse-on-surface/90">
                  <span className="material-symbols-outlined text-tertiary-container text-[14px]">
                    payments
                  </span>
                  <span className="font-label-sm text-label-sm font-medium">
                    {featuredRecipe.estimatedPrice} · orientacyjnie
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PÓŁKA 2: Dla Ciebie (Horizontal Rail 16:10 Cards) */}
      <section className="pt-6">
        <div className="px-4 flex items-baseline justify-between mb-3">
          <div>
            <h2 className="font-headline-sm text-headline-sm text-on-surface tracking-tight">Dla Ciebie</h2>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
              Dopasowane do Twojego stylu gotowania
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('szukaj')}
            className="font-label-md text-label-md text-primary font-bold hover:underline cursor-pointer"
          >
            Zobacz
          </button>
        </div>

        <div className="flex overflow-x-auto gap-3.5 px-4 no-scrollbar pb-2 pt-0.5">
          {forYouRecipes.map((recipe) => (
            <article
              key={recipe.id}
              onClick={() => onSelectRecipe(recipe)}
              className="flex flex-col flex-shrink-0 w-[260px] bg-surface-container-lowest rounded-2xl overflow-hidden shadow-[0_2px_10px_rgba(26,28,28,0.05)] cursor-pointer group border border-surface-container-high/30"
            >
              <div className="relative w-full aspect-[16/10] bg-surface-container-high overflow-hidden">
                <img
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  src={recipe.imageUrl}
                  alt={recipe.imageAlt}
                />
                <button
                  aria-label={`Zapisz ${recipe.title}`}
                  onClick={(e) => handleBookmarkClick(e, recipe.id)}
                  className={`absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-surface-container-lowest/90 backdrop-blur-md flex items-center justify-center hover:text-primary active:scale-90 transition-all shadow-sm ${
                    bookmarkedRecipeIds.includes(recipe.id) ? 'text-primary' : 'text-on-surface'
                  }`}
                  type="button"
                >
                  <span
                    className="material-symbols-outlined text-[18px]"
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

              <div className="p-3.5 flex flex-col justify-between flex-1 gap-2.5">
                <div>
                  <span className="font-label-sm text-label-sm text-primary font-semibold">
                    {recipe.author}
                  </span>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface line-clamp-2 mt-0.5">
                    {recipe.title}
                  </h3>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="bg-surface-container-low px-2 py-0.5 rounded-md font-label-sm text-label-sm text-on-surface flex items-center gap-1">
                    <span className="material-symbols-outlined text-[13px] text-primary">schedule</span>
                    {recipe.durationMinutes} min
                  </span>
                  <span className="bg-surface-container-low px-2 py-0.5 rounded-md font-label-sm text-label-sm text-on-surface flex items-center gap-1">
                    <span className="material-symbols-outlined text-[13px] text-tertiary">payments</span>
                    {recipe.estimatedPrice}
                  </span>
                  <span className="bg-surface-container-low px-2 py-0.5 rounded-md font-label-sm text-label-sm text-on-surface-variant font-medium">
                    {recipe.caloriesText}
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* PÓŁKA 3: Kategorie (Keyword Pill Chips) */}
      <section className="pt-5">
        <div className="px-4 mb-2.5 flex items-center justify-between">
          <h2 className="font-headline-sm text-headline-sm text-on-surface tracking-tight">Kategorie</h2>
          <span className="font-label-sm text-label-sm text-on-surface-variant">Przeglądaj</span>
        </div>

        <div className="flex overflow-x-auto gap-2 px-4 no-scrollbar py-1">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.label;
            return (
              <button
                key={cat.label}
                onClick={() => setSelectedCategory(cat.label)}
                className={`flex-shrink-0 px-3.5 py-2 rounded-xl font-label-md text-label-md shadow-sm active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer ${
                  isSelected
                    ? 'bg-primary-container text-on-primary font-bold'
                    : 'bg-surface-container-lowest text-on-surface hover:bg-surface-container-low border border-surface-container-high/40'
                }`}
                type="button"
              >
                <span className="material-symbols-outlined text-[16px]">{cat.icon}</span>
                {cat.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* PÓŁKA 4: Szefowie, których warto znać */}
      <section className="pt-6">
        <div className="px-4 mb-3">
          <h2 className="font-headline-sm text-headline-sm text-on-surface tracking-tight">
            Szefowie, których warto znać
          </h2>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
            Sprawdzone przepisy od zaufanych twórców
          </p>
        </div>

        <div className="flex overflow-x-auto gap-4 px-4 no-scrollbar py-1">
          {chefs.map((chef, idx) => (
            <div
              key={chef.id}
              onClick={() => onSelectChef(chef)}
              className="flex flex-col items-center flex-shrink-0 group w-20 text-center cursor-pointer"
            >
              <div
                className={`relative w-16 h-16 rounded-full p-0.5 mb-1.5 group-active:scale-95 transition-transform ${
                  idx === 0
                    ? 'bg-gradient-to-tr from-primary to-primary-container shadow-sm'
                    : 'bg-surface-container-high'
                }`}
              >
                <div className="w-full h-full rounded-full overflow-hidden bg-surface-container">
                  <img
                    className="w-full h-full object-cover"
                    src={chef.avatarUrl}
                    alt={chef.name}
                  />
                </div>
              </div>
              <span className="font-label-md text-label-md text-on-surface line-clamp-1 leading-tight font-semibold">
                {chef.shortName}
              </span>
              <span className="font-label-sm text-label-sm text-on-surface-variant mt-0.5">
                {chef.recipesCount} dań
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* PÓŁKA 5: Z Twojej lodówki (Interactive Pantry Match) */}
      <section className="px-4 pt-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-tertiary-fixed text-on-tertiary-fixed flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">kitchen</span>
            </div>
            <div>
              <h2 className="font-headline-sm text-headline-sm text-on-surface tracking-tight">
                Z Twojej lodówki
              </h2>
              <p className="font-label-sm text-label-sm text-tertiary font-bold">
                Dopasowano do Twoich 4 składników
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('lodowka')}
            className="font-label-md text-label-md text-primary font-bold hover:underline cursor-pointer"
          >
            Otwórz
          </button>
        </div>

        {/* Match Card */}
        {(() => {
          const matchedRecipe = recipes.find((r) => r.id === 'zupa-krem-pomidory') || recipes[0];
          return (
            <div
              onClick={() => onSelectRecipe(matchedRecipe)}
              className="w-full bg-surface-container-lowest rounded-2xl p-4 shadow-[0_2px_12px_rgba(26,28,28,0.05)] cursor-pointer group hover:bg-surface-container-low transition-colors border border-surface-container-high/40"
            >
              <div className="flex gap-3.5">
                <div className="relative w-24 h-24 rounded-xl overflow-hidden bg-surface-container flex-shrink-0">
                  <img
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    src={matchedRecipe.imageUrl}
                    alt={matchedRecipe.imageAlt}
                  />
                  <span className="absolute top-1.5 left-1.5 bg-tertiary text-on-tertiary font-label-sm text-[10px] px-1.5 py-0.5 rounded-md font-bold">
                    80%
                  </span>
                </div>

                <div className="flex flex-col justify-between flex-1 min-w-0">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-label-sm text-label-sm text-on-surface-variant">
                        Obiad w {matchedRecipe.durationMinutes} min
                      </span>
                      <button
                        aria-label="Zapisz przepis"
                        onClick={(e) => handleBookmarkClick(e, matchedRecipe.id)}
                        className={`text-on-surface-variant hover:text-primary active:scale-90 transition-transform ${
                          bookmarkedRecipeIds.includes(matchedRecipe.id) ? 'text-primary' : ''
                        }`}
                        type="button"
                      >
                        <span
                          className="material-symbols-outlined text-[20px]"
                          style={{
                            fontVariationSettings: bookmarkedRecipeIds.includes(matchedRecipe.id)
                              ? "'FILL' 1"
                              : "'FILL' 0",
                          }}
                        >
                          bookmark
                        </span>
                      </button>
                    </div>
                    <h3 className="font-headline-sm text-headline-sm text-on-surface truncate mt-0.5">
                      {matchedRecipe.title}
                    </h3>
                  </div>

                  {/* Matching Ingredients Bar Indicator */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-label-sm text-label-sm text-tertiary font-semibold flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">check_circle</span>
                        Masz 4 składniki
                      </span>
                      <span className="font-label-sm text-label-sm text-error font-medium">Brakuje: 1</span>
                    </div>
                    {/* Segmented Progress Bar */}
                    <div className="grid grid-cols-5 gap-1 w-full h-1.5">
                      <div className="h-full bg-tertiary rounded-full"></div>
                      <div className="h-full bg-tertiary rounded-full"></div>
                      <div className="h-full bg-tertiary rounded-full"></div>
                      <div className="h-full bg-tertiary rounded-full"></div>
                      <div className="h-full bg-surface-container-high rounded-full"></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Action Pill inside Card */}
              <div className="flex items-center justify-between pt-3 mt-3 bg-surface-container-low/60 rounded-xl px-3 py-2">
                <div className="flex items-center gap-1.5 text-on-surface-variant">
                  <span className="material-symbols-outlined text-[15px] text-error">shopping_cart</span>
                  <span className="font-label-sm text-label-sm">Brakujący: Świeża bazylia</span>
                </div>
                <button
                  onClick={handleAddFridgeMissing}
                  className="font-label-sm text-label-sm text-primary font-bold hover:underline flex items-center gap-0.5 cursor-pointer"
                  type="button"
                >
                  Dodaj do listy <span className="material-symbols-outlined text-[14px]">add</span>
                </button>
              </div>
            </div>
          );
        })()}
      </section>

      {/* PÓŁKA 6: Ostatnio oglądane (Lokalna historia) */}
      <section className="px-4 pt-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-on-surface-variant text-[18px]">history</span>
            <h2 className="font-headline-sm text-headline-sm text-on-surface tracking-tight">
              Ostatnio oglądane
            </h2>
          </div>
          {!historyCleared && (
            <button
              onClick={() => {
                setHistoryCleared(true);
                onShowToast('Historia została wyczyszczona');
              }}
              className="font-label-sm text-label-sm text-on-surface-variant hover:text-on-surface cursor-pointer"
              type="button"
            >
              Wyczyść
            </button>
          )}
        </div>

        {historyCleared ? (
          <div className="p-4 bg-surface-container-low rounded-xl text-center">
            <span className="material-symbols-outlined text-on-surface-variant text-[24px] mb-1">
              done_all
            </span>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Historia została wyczyszczona
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {/* Historia 1 */}
            {(() => {
              const r1 = recipes.find((r) => r.id === 'rzymska-carbonara') || recipes[0];
              return (
                <div
                  onClick={() => onSelectRecipe(r1)}
                  className="w-full bg-surface-container-lowest rounded-xl p-2.5 flex items-center justify-between gap-3 shadow-[0_1px_4px_rgba(26,28,28,0.03)] group cursor-pointer hover:bg-surface-container-low transition-colors border border-surface-container-high/30"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-12 rounded-lg bg-surface-container-high overflow-hidden flex-shrink-0">
                      <img className="w-full h-full object-cover" src={r1.imageUrl} alt={r1.imageAlt} />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <h4 className="font-label-lg text-label-lg text-on-surface truncate font-semibold">
                        {r1.title}
                      </h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="font-label-sm text-label-sm text-on-surface-variant">
                          {r1.durationMinutes} min
                        </span>
                        <span className="text-on-surface-variant text-[10px]">•</span>
                        <span className="font-label-sm text-label-sm text-on-surface-variant">
                          {r1.estimatedPrice}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      aria-label="Zapisz do zakładek"
                      onClick={(e) => handleBookmarkClick(e, r1.id)}
                      className={`w-9 h-9 flex items-center justify-center hover:text-primary active:scale-90 transition-transform ${
                        bookmarkedRecipeIds.includes(r1.id) ? 'text-primary' : 'text-on-surface-variant'
                      }`}
                      type="button"
                    >
                      <span
                        className="material-symbols-outlined text-[20px]"
                        style={{
                          fontVariationSettings: bookmarkedRecipeIds.includes(r1.id)
                            ? "'FILL' 1"
                            : "'FILL' 0",
                        }}
                      >
                        bookmark
                      </span>
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* Historia 2 */}
            {(() => {
              const r2 = recipes.find((r) => r.id === 'szakszuka-feta') || recipes[1];
              return (
                <div
                  onClick={() => onSelectRecipe(r2)}
                  className="w-full bg-surface-container-lowest rounded-xl p-2.5 flex items-center justify-between gap-3 shadow-[0_1px_4px_rgba(26,28,28,0.03)] group cursor-pointer hover:bg-surface-container-low transition-colors border border-surface-container-high/30"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-12 rounded-lg bg-surface-container-high overflow-hidden flex-shrink-0">
                      <img className="w-full h-full object-cover" src={r2.imageUrl} alt={r2.imageAlt} />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <h4 className="font-label-lg text-label-lg text-on-surface truncate font-semibold">
                        {r2.title}
                      </h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="font-label-sm text-label-sm text-on-surface-variant">
                          {r2.durationMinutes} min
                        </span>
                        <span className="text-on-surface-variant text-[10px]">•</span>
                        <span className="font-label-sm text-label-sm text-on-surface-variant">
                          {r2.estimatedPrice}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      aria-label="Zapisz do zakładek"
                      onClick={(e) => handleBookmarkClick(e, r2.id)}
                      className={`w-9 h-9 flex items-center justify-center hover:text-primary active:scale-90 transition-transform ${
                        bookmarkedRecipeIds.includes(r2.id) ? 'text-primary' : 'text-on-surface-variant'
                      }`}
                      type="button"
                    >
                      <span
                        className="material-symbols-outlined text-[20px]"
                        style={{
                          fontVariationSettings: bookmarkedRecipeIds.includes(r2.id)
                            ? "'FILL' 1"
                            : "'FILL' 0",
                        }}
                      >
                        bookmark
                      </span>
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </section>
    </div>
  );
};
