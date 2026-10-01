import React, { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { Recipe, Chef } from '../types';
import { useTranslation } from '../i18n';
import {
  buildRecipeSearchIndex,
  filterRecipes,
  getVisibleRecipeRange,
  normalizeSearchText,
  SEARCH_CARD_GAP,
  SEARCH_PAGE_SIZE,
  SEARCH_ROW_HEIGHT,
} from '../data/searchCatalog';

interface SearchViewProps {
  recipes: Recipe[];
  chefs: Chef[];
  onSelectRecipe: (recipe: Recipe) => void;
  onSelectChef?: (chef: Chef) => void;
  bookmarkedRecipeIds: string[];
  onToggleBookmark: (recipeId: string) => void;
  onShowToast: (msg: string) => void;
}

function shuffleRecipes(recipes: Recipe[]): Recipe[] {
  const shuffled = [...recipes];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
  }
  return shuffled;
}

export const SearchView: React.FC<SearchViewProps> = ({
  recipes,
  chefs,
  onSelectRecipe,
  onSelectChef,
  bookmarkedRecipeIds,
  onToggleBookmark,
  onShowToast,
}) => {
  const { t, count } = useTranslation();
  const [query, setQuery] = useState('');
  const [followingChefs, setFollowingChefs] = useState<string[]>([]);
  const [visibleRecipeCount, setVisibleRecipeCount] = useState(SEARCH_PAGE_SIZE);
  const deferredQuery = useDeferredValue(query);
  const [viewport, setViewport] = useState(() => ({
    scrollY: 0,
    height: typeof window === 'undefined' ? 800 : window.innerHeight,
  }));
  const shuffledRecipes = useMemo(() => shuffleRecipes(recipes), [recipes]);
  const searchIndex = useMemo(() => buildRecipeSearchIndex(recipes), [recipes]);
  const bookmarkedRecipeIdSet = useMemo(
    () => new Set(bookmarkedRecipeIds),
    [bookmarkedRecipeIds],
  );

  const matchingChefs = useMemo(() => {
    const q = normalizeSearchText(deferredQuery);
    if (!q) return chefs;
    return chefs.filter(
      (c) => normalizeSearchText(c.name).includes(q) || normalizeSearchText(c.sourceDomain).includes(q)
    );
  }, [chefs, deferredQuery]);

  const filteredRecipes = useMemo(() => {
    const q = normalizeSearchText(deferredQuery);
    if (!q) return shuffledRecipes;

    return filterRecipes(shuffledRecipes, searchIndex, q);
  }, [deferredQuery, searchIndex, shuffledRecipes]);

  useEffect(() => {
    setVisibleRecipeCount(SEARCH_PAGE_SIZE);
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'auto' });
  }, [deferredQuery]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let frame = 0;
    const updateViewport = () => {
      setViewport({ scrollY: window.scrollY, height: window.innerHeight });
    };
    const handleViewportChange = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        updateViewport();
      });
    };

    updateViewport();
    window.addEventListener('scroll', handleViewportChange, { passive: true });
    window.addEventListener('resize', handleViewportChange);
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener('scroll', handleViewportChange);
      window.removeEventListener('resize', handleViewportChange);
    };
  }, []);

  const visibleRecipes = useMemo(
    () => filteredRecipes.slice(0, visibleRecipeCount),
    [filteredRecipes, visibleRecipeCount],
  );
  const hasMoreRecipes = visibleRecipes.length < filteredRecipes.length;
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const recipeListRef = useRef<HTMLDivElement>(null);
  const recipeListTop = recipeListRef.current
    ? recipeListRef.current.getBoundingClientRect().top + viewport.scrollY
    : 0;
  const recipeListScrollTop = Math.max(0, viewport.scrollY - recipeListTop);
  const [firstVisibleRecipe, lastVisibleRecipe] = getVisibleRecipeRange(
    visibleRecipes.length,
    recipeListScrollTop,
    viewport.height,
  );
  const windowedRecipes = visibleRecipes.slice(firstVisibleRecipe, lastVisibleRecipe);

  useEffect(() => {
    if (!hasMoreRecipes || !loadMoreRef.current || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisibleRecipeCount((current) => Math.min(current + SEARCH_PAGE_SIZE, filteredRecipes.length));
        }
      },
      { rootMargin: '800px 0px' },
    );
    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [filteredRecipes.length, hasMoreRecipes, visibleRecipeCount]);

  const toggleFollowChef = (chefId: string, chefName: string) => {
    if (followingChefs.includes(chefId)) {
      setFollowingChefs((prev) => prev.filter((id) => id !== chefId));
      onShowToast(`${t('unfollowedToast')}: ${chefName}`);
    } else {
      setFollowingChefs((prev) => [...prev, chefId]);
      onShowToast(t('followedToast', { chef: chefName }));
    }
  };

  return (
    <div className="flex flex-col w-full pb-10">
      <section className="sticky top-header z-30 bg-surface/95 backdrop-blur-md px-4 pt-1 pb-3 shadow-sm border-b border-surface-container-high/40">
        <div className="relative flex items-center w-full">
          <div className="absolute left-3.5 flex items-center pointer-events-none text-primary">
            <span className="material-symbols-outlined text-[22px]">search</span>
          </div>
          <input
            aria-label={t('searchAria')}
            className="w-full h-12 pl-11 pr-11 bg-surface-container-lowest text-on-surface font-body-md text-body-md rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all border border-surface-container-high/40"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('searchPlaceholder')}
            type="text"
          />
          {query && (
            <button
              aria-label={t('clearSearch')}
              onClick={() => setQuery('')}
              className="absolute right-1 w-10 h-10 flex items-center justify-center text-on-surface-variant hover:text-on-surface rounded-full transition-colors cursor-pointer"
              type="button"
            >
              <span className="material-symbols-outlined text-[20px]">cancel</span>
            </button>
          )}
        </div>
      </section>

      <div className="flex flex-col px-4 pt-4 gap-6">
        {matchingChefs.length > 0 && (
          <section className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <h2 className="font-headline-sm text-headline-sm text-on-surface tracking-tight">
                {t('chefsAndAuthors')}
              </h2>
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                {matchingChefs.length} {count('result', matchingChefs.length)}
              </span>
            </div>

            <div className="flex flex-col gap-2.5">
              {matchingChefs.map((chef) => {
                const isFollowing = followingChefs.includes(chef.id);

                return (
                  <article
                    key={chef.id}
                    className="w-full bg-surface-container-lowest rounded-2xl p-3 shadow-sm flex items-center justify-between gap-3"
                  >
                    <div
                      onClick={() => onSelectChef && onSelectChef(chef)}
                      className="flex items-center gap-3 min-w-0 cursor-pointer flex-1"
                    >
                      <div className="relative w-14 h-14 rounded-full overflow-hidden shrink-0 shadow-sm bg-surface-container">
                        <img
                          className="w-full h-full object-cover"
                          src={chef.avatarUrl}
                          alt={chef.name}
                          loading="lazy"
                          decoding="async"
                        />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-headline-sm text-headline-sm text-on-surface truncate hover:text-primary transition-colors">
                            {chef.name}
                          </h3>
                          {chef.isVerified && (
                            <span
                              className="material-symbols-outlined text-primary text-[18px]"
                              style={{ fontVariationSettings: "'FILL' 1" }}
                              title={t('verifiedChef')}
                            >
                              verified
                            </span>
                          )}
                        </div>
                        <p className="font-body-sm text-body-sm text-on-surface-variant truncate">
                          {chef.recipesCount} {count('recipe', chef.recipesCount)} · {chef.sourceDomain}
                        </p>
                      </div>
                    </div>

                    <button
                      aria-label={`${isFollowing ? t('unfollowChef') : t('followChef')} ${chef.name}`}
                      onClick={() => toggleFollowChef(chef.id, chef.name)}
                      className={`shrink-0 w-12 h-12 flex items-center justify-center rounded-full active:scale-95 transition-all cursor-pointer ${
                        isFollowing
                          ? 'bg-primary-fixed text-primary'
                          : 'bg-surface-container-low text-on-surface-variant hover:text-primary'
                      }`}
                      type="button"
                    >
                      <span
                        className="material-symbols-outlined text-[24px]"
                        style={{ fontVariationSettings: isFollowing ? "'FILL' 1" : "'FILL' 0" }}
                      >
                        favorite
                      </span>
                    </button>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        <section className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <h2 className="font-headline-sm text-headline-sm text-on-surface tracking-tight">
              {query ? `${t('searchResults')}: „${query}”` : t('allRecipes')}
            </h2>
            <span className="font-label-sm text-label-sm text-on-surface-variant">
              {filteredRecipes.length} {count('result', filteredRecipes.length)}
            </span>
          </div>

          {filteredRecipes.length === 0 ? (
            <div className="p-8 rounded-2xl bg-surface-container text-center flex flex-col items-center gap-3">
              <span className="material-symbols-outlined text-[48px] text-outline">search_off</span>
              <h3 className="font-headline-sm text-headline-sm text-on-surface">{t('noRecipes')}</h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant max-w-[280px]">
                {t('searchHint')}
              </p>
              <button
                onClick={() => setQuery('')}
                className="mt-2 px-4 py-2 rounded-xl bg-primary text-on-primary font-label-md font-bold shadow-sm cursor-pointer"
                type="button"
              >
                {t('showAllRecipes')}
              </button>
            </div>
          ) : (
            <div
              ref={recipeListRef}
              className="relative"
              style={{
                height: `${Math.max(0, visibleRecipes.length * SEARCH_ROW_HEIGHT - SEARCH_CARD_GAP)}px`,
              }}
            >
              {windowedRecipes.map((recipe, index) => {
                const recipeIndex = firstVisibleRecipe + index;
                const isBookmarked = bookmarkedRecipeIdSet.has(recipe.id);

                return (
                  <article
                    key={recipe.id}
                    onClick={() => onSelectRecipe(recipe)}
                    style={{
                      position: 'absolute',
                      top: `${recipeIndex * SEARCH_ROW_HEIGHT}px`,
                      left: 0,
                      right: 0,
                    }}
                    className="relative w-full h-44 overflow-hidden rounded-2xl shadow-sm transition-transform active:scale-[0.99] cursor-pointer group bg-surface-container"
                  >
                    <img
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      src={recipe.imageUrl}
                      alt={recipe.imageAlt}
                      loading={recipeIndex < 6 ? 'eager' : 'lazy'}
                      decoding="async"
                      fetchPriority={recipeIndex < 3 ? 'high' : 'auto'}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/5" />

                    <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-3">
                      <span className="max-w-[75%] truncate rounded-full bg-black/35 px-3 py-1.5 font-label-sm text-label-sm font-bold text-white backdrop-blur-sm">
                        {recipe.author}
                      </span>
                      <button
                        aria-label={t('saveRecipe')}
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleBookmark(recipe.id);
                        }}
                        className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-black/35 text-white backdrop-blur-sm transition-colors cursor-pointer ${
                          isBookmarked ? 'text-primary-fixed' : 'hover:text-primary-fixed'
                        }`}
                        type="button"
                      >
                        <span
                          className="material-symbols-outlined text-[22px]"
                          style={{ fontVariationSettings: isBookmarked ? "'FILL' 1" : "'FILL' 0" }}
                        >
                          bookmark
                        </span>
                      </button>
                    </div>

                    <div className="absolute inset-x-4 bottom-4">
                      <h3 className="font-headline-sm text-headline-sm text-white font-bold leading-tight drop-shadow-md line-clamp-2">
                        {recipe.title}
                      </h3>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {hasMoreRecipes && (
            <div ref={loadMoreRef} className="flex justify-center pt-1">
              <button
                type="button"
                onClick={() => setVisibleRecipeCount((current) => Math.min(current + SEARCH_PAGE_SIZE, filteredRecipes.length))}
                className="px-4 py-2 rounded-xl bg-surface-container text-primary font-label-md font-bold cursor-pointer"
              >
                {t('loadMoreResults')}
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
