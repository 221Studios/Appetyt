import React, { useEffect, useMemo, useState } from 'react';
import { type AppLanguage, useTranslation } from '../i18n';
import { Chef, Recipe } from '../types';

interface LocalizedText {
  pl: string;
  en: string;
}

function searchText(recipe: Recipe): string {
  return [
    recipe.title,
    recipe.subtitle,
    recipe.category,
    recipe.categoryLabel,
    recipe.cuisine,
    ...recipe.ingredients.flatMap((ingredient) => [ingredient.name, ingredient.polishName]),
  ]
    .filter(Boolean)
    .join(' ')
    .toLocaleLowerCase('pl-PL')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');
}

function hasAny(text: string, terms: string[]): boolean {
  return terms.some((term) =>
    text.includes(term.toLocaleLowerCase('pl-PL').normalize('NFD').replace(/\p{Diacritic}/gu, '')),
  );
}

function recipeDisplayTitle(title: string): string {
  return title
    .replace(/\s*[([]\s*\d+\s+(?:składnik(?:i|ów)?|ingredients?)\s*[\])]\s*$/iu, '')
    .replace(/\s+[-–—:]?\s*\d+\s+(?:składnik(?:i|ów)?|ingredients?)\s*$/iu, '')
    .trim();
}

interface DiscoveryRail {
  id: string;
  title: LocalizedText;
  description: LocalizedText;
  subcategories: DiscoverySubcategory[];
}

interface DiscoverySubcategory {
  id: string;
  title: LocalizedText;
  description: LocalizedText;
  image: string;
  matches: (recipe: Recipe) => boolean;
}

const DISCOVERY_RAILS: DiscoveryRail[] = [
  {
    id: 'cuisine',
    title: { pl: 'Typ kuchni', en: 'Cuisine' },
    description: { pl: 'Smaki z całego świata', en: 'Flavors from around the world' },
    subcategories: [
      { id: 'asian', title: { pl: 'Azjatycka', en: 'Asian' }, description: { pl: 'Wok, curry i ramen', en: 'Wok, curry and ramen' }, image: '/category-images/curry.jpg', matches: (recipe) => matchesText(recipe, ['azjat', 'asian', 'japoń', 'japon', 'chiń', 'chin', 'kore', 'thai', 'taj', 'wok', 'ramen', 'sushi']) },
      { id: 'italian', title: { pl: 'Włoska', en: 'Italian' }, description: { pl: 'Pasta, pizza i więcej', en: 'Pasta, pizza and more' }, image: '/category-images/pasta-red.jpg', matches: (recipe) => matchesText(recipe, ['włos', 'wlos', 'ital', 'pizza', 'pasta', 'spaghetti', 'risotto', 'lasagn']) },
      { id: 'chinese', title: { pl: 'Chińska', en: 'Chinese' }, description: { pl: 'Smaki z Dalekiego Wschodu', en: 'Flavors from the Far East' }, image: '/category-images/rice-bowl.jpg', matches: (recipe) => matchesText(recipe, ['chiń', 'chin', 'chinese', 'sajgon', 'sojow', 'wok', 'bao', 'dumpling']) },
      { id: 'american', title: { pl: 'Amerykańska', en: 'American' }, description: { pl: 'Klasyki zza oceanu', en: 'Classics from across the ocean' }, image: '/category-images/burger.jpg', matches: (recipe) => matchesText(recipe, ['ameryk', 'american', 'burger', 'hamburger', 'bbq', 'barbecue', 'mac and cheese', 'pancake']) },
      { id: 'mexican', title: { pl: 'Meksykańska', en: 'Mexican' }, description: { pl: 'Tacos, salsa i chili', en: 'Tacos, salsa and chili' }, image: '/category-images/pizza.jpg', matches: (recipe) => matchesText(recipe, ['meksyk', 'mexic', 'taco', 'burrito', 'quesadilla', 'nachos', 'salsa', 'guacamole']) },
    ],
  },
  {
    id: 'diet',
    title: { pl: 'Diety', en: 'Diets' },
    description: { pl: 'Dopasuj do swoich zasad', en: 'Match your way of eating' },
    subcategories: [
      { id: 'vegetarian', title: { pl: 'Wegetariańska', en: 'Vegetarian' }, description: { pl: 'Bez mięsa i ryb', en: 'No meat or fish' }, image: '/category-images/vegetables.jpg', matches: recipeIsVegetarian },
      { id: 'vegan', title: { pl: 'Wegańska', en: 'Vegan' }, description: { pl: 'W 100% roślinna', en: '100% plant-based' }, image: '/category-images/tofu.jpg', matches: recipeIsVegan },
      { id: 'keto', title: { pl: 'Keto', en: 'Keto' }, description: { pl: 'Mało węglowodanów', en: 'Lower carbs' }, image: '/category-images/avocado-eggs.jpg', matches: (recipe) => (recipe.carbsPerServing !== null && recipe.carbsPerServing !== undefined && recipe.carbsPerServing <= 25) || matchesText(recipe, ['keto', 'low carb', 'low-carb', 'niskoweg', 'niskowęgl']) },
      { id: 'gluten-free', title: { pl: 'Bez glutenu', en: 'Gluten-free' }, description: { pl: 'Dla wrażliwych', en: 'For sensitive diets' }, image: '/category-images/quinoa.jpg', matches: (recipe) => matchesText(recipe, ['bez glut', 'gluten free', 'gluten-free', 'bezgluten']) },
      { id: 'high-protein', title: { pl: 'Wysokobiałkowa', en: 'High-protein' }, description: { pl: 'Dla aktywnych', en: 'For active people' }, image: '/category-images/chicken.jpg', matches: (recipe) => (recipe.proteinPerServing !== null && recipe.proteinPerServing !== undefined && recipe.proteinPerServing >= 25) || matchesText(recipe, ['białk', 'bialk', 'protein']) },
    ],
  },
  {
    id: 'fast-food',
    title: { pl: 'Fast food', en: 'Fast food' },
    description: { pl: 'Domowe wersje hitów', en: 'Homemade versions of hits' },
    subcategories: [
      { id: 'burgers', title: { pl: 'Burgery', en: 'Burgers' }, description: { pl: 'Buła pełna smaku', en: 'Packed with flavor' }, image: '/category-images/burger.jpg', matches: (recipe) => matchesText(recipe, ['burger', 'hamburger', 'cheeseburger']) },
      { id: 'pizza', title: { pl: 'Pizza', en: 'Pizza' }, description: { pl: 'Domowa i chrupiąca', en: 'Homemade and crispy' }, image: '/category-images/pizza.jpg', matches: (recipe) => matchesText(recipe, ['pizza', 'pizz']) },
      { id: 'tacos', title: { pl: 'Tacos', en: 'Tacos' }, description: { pl: 'Tortilla i dużo smaku', en: 'Tortilla packed with flavor' }, image: '/category-images/pizza.jpg', matches: (recipe) => matchesText(recipe, ['taco', 'tacos', 'meksyk', 'mexic']) },
      { id: 'kebab', title: { pl: 'Kebab', en: 'Kebab' }, description: { pl: 'Domowy street food', en: 'Homemade street food' }, image: '/category-images/chicken-bowl.jpg', matches: (recipe) => matchesText(recipe, ['kebab', 'shawarma', 'gyros', 'dürüm', 'durum']) },
      { id: 'fries-and-nuggets', title: { pl: 'Frytki i nuggetsy', en: 'Fries and nuggets' }, description: { pl: 'Chrupiące klasyki', en: 'Crispy classics' }, image: '/category-images/potato-dish.jpg', matches: (recipe) => matchesText(recipe, ['frytk', 'fries', 'nugget', 'hot dog', 'wrap']) },
    ],
  },
  {
    id: 'meal-type',
    title: { pl: 'Typ posiłku', en: 'Meal type' },
    description: { pl: 'Wybierz moment dnia', en: 'Choose your moment of the day' },
    subcategories: [
      { id: 'breakfast', title: { pl: 'Śniadanie', en: 'Breakfast' }, description: { pl: 'Dobry początek dnia', en: 'A good start to the day' }, image: '/category-images/breakfast.jpg', matches: (recipe) => matchesText(recipe, ['śniad', 'sniad', 'breakfast']) },
      { id: 'lunch-and-dinner', title: { pl: 'Obiad', en: 'Lunch and dinner' }, description: { pl: 'Konkret na stół', en: 'A satisfying meal' }, image: '/category-images/main-roast.jpg', matches: (recipe) => matchesText(recipe, ['obiad', 'dania głów', 'danie głów', 'main dish', 'dinner', 'lunch']) },
      { id: 'soups', title: { pl: 'Zupy', en: 'Soups' }, description: { pl: 'Rozgrzewające klasyki', en: 'Comforting classics' }, image: '/category-images/tomato-soup.jpg', matches: (recipe) => matchesText(recipe, ['zupa', 'soup', 'ramen', 'pho', 'barszcz', 'rosol', 'rosół']) },
      { id: 'desserts', title: { pl: 'Deser', en: 'Dessert' }, description: { pl: 'Coś słodkiego', en: 'Something sweet' }, image: '/category-images/dessert.jpg', matches: (recipe) => matchesText(recipe, ['deser', 'ciast', 'cake', 'dessert', 'brownie', 'cookie', 'ciastecz', 'tart', 'sernik']) },
      { id: 'snacks', title: { pl: 'Przekąski', en: 'Snacks' }, description: { pl: 'Małe, ale konkretne', en: 'Small but mighty' }, image: '/category-images/snacks.jpg', matches: (recipe) => matchesText(recipe, ['przekąsk', 'przekask', 'snack', 'przystawk', 'starter', 'dip']) },
    ],
  },
  {
    id: 'other',
    title: { pl: 'Inne', en: 'More ways to choose' },
    description: { pl: 'Pomysły na konkretną sytuację', en: 'Ideas for a specific situation' },
    subcategories: [
      { id: 'one-pot', title: { pl: 'W 1 garnku', en: 'One-pot meals' }, description: { pl: 'Mniej zmywania', en: 'Less washing up' }, image: '/category-images/soup.jpg', matches: (recipe) => matchesText(recipe, ['jednogarnk', 'one pot', 'one-pot', 'gulasz', 'stew', 'curry', 'chili']) },
      { id: 'quick-15', title: { pl: 'Przepisy na 15 min', en: '15-minute recipes' }, description: { pl: 'Szybko i prosto', en: 'Quick and easy' }, image: '/category-images/pasta.jpg', matches: (recipe) => recipe.durationMinutes !== null && recipe.durationMinutes > 0 && recipe.durationMinutes <= 15 },
      { id: 'meal-prep', title: { pl: 'Meal prep', en: 'Meal prep' }, description: { pl: 'Gotowe na później', en: 'Ready for later' }, image: '/category-images/salad.jpg', matches: (recipe) => matchesText(recipe, ['meal prep', 'lunchbox', 'lunch box', 'do pracy', 'do szkol', 'na wynos']) },
      { id: 'comfort-food', title: { pl: 'Comfort food', en: 'Comfort food' }, description: { pl: 'Dużo smaku i wygody', en: 'Big flavor and comfort' }, image: '/category-images/stew.jpg', matches: (recipe) => matchesText(recipe, ['comfort', 'gulasz', 'stew', 'curry', 'chili', 'mac and cheese', 'serowy']) },
      { id: 'budget', title: { pl: 'Tanie gotowanie', en: 'Budget cooking' }, description: { pl: 'Oszczędne pomysły', en: 'Affordable ideas' }, image: '/category-images/rice-bowl.jpg', matches: (recipe) => (recipe.numericPrice > 0 && recipe.numericPrice <= 15) || matchesText(recipe, ['tani', 'tanio', 'budget', 'oszczed', 'oszczęd']) },
    ],
  },
];

const MEAT_AND_FISH_TERMS = [
  'kurczak', 'chicken', 'indyk', 'turkey', 'wolow', 'wołow', 'beef', 'wieprz', 'pork',
  'schab', 'boczek', 'bekon', 'bacon', 'szynk', 'ham', 'kielbas', 'sausage', 'mieso',
  'mięso', 'meat', 'baranin', 'lamb', 'losos', 'łosoś', 'salmon', 'tunczyk', 'tuńczyk',
  'tuna', 'dorsz', 'cod', 'krewet', 'shrimp', 'fish', 'ryb', 'owoc morza',
];

const DAIRY_AND_EGG_TERMS = [
  'mleko', 'milk', 'smietan', 'śmietan', 'cream', 'ser', 'cheese', 'jogurt', 'yogurt',
  'maslo', 'masło', 'butter', 'parmezan', 'parmesan', 'mozzarella', 'jaj', 'egg', 'majonez',
];

function matchesText(recipe: Recipe, terms: string[]): boolean {
  return hasAny(searchText(recipe), terms);
}

function recipeIsVegetarian(recipe: Recipe): boolean {
  const text = searchText(recipe);
  return (
    hasAny(text, ['wegetarian', 'vegetarian', 'vege', 'tofu', 'falafel', 'hummus', 'warzyw']) &&
    !hasAny(text, MEAT_AND_FISH_TERMS)
  );
}

function recipeIsVegan(recipe: Recipe): boolean {
  const text = searchText(recipe);
  return (
    hasAny(text, ['wegansk', 'vegan', 'tofu', 'tempeh', 'falafel', 'hummus']) &&
    !hasAny(text, [...MEAT_AND_FISH_TERMS, ...DAIRY_AND_EGG_TERMS])
  );
}


interface DiscoverViewProps {
  onSelectRecipe: (recipe: Recipe) => void;
  onSelectChef: (chef: Chef) => void;
  recipes: Recipe[];
  chefs: Chef[];
  bookmarkedRecipeIds: string[];
  onToggleBookmark: (recipeId: string) => void;
}

function getLocalizedText(text: LocalizedText, language: AppLanguage): string {
  return text[language];
}

function localDateKey(date = new Date()): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

function millisecondsUntilMidnight(): number {
  const now = new Date();
  const nextMidnight = new Date(now);
  nextMidnight.setHours(24, 0, 0, 0);
  return Math.max(1000, nextMidnight.getTime() - now.getTime() + 50);
}

function stableHash(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function rankForEdition(recipes: Recipe[], editionDate: string, railId: string): Recipe[] {
  return [...recipes].sort((left, right) => {
    const leftRank = stableHash(`${editionDate}:${railId}:${left.id}`);
    const rightRank = stableHash(`${editionDate}:${railId}:${right.id}`);
    return leftRank - rightRank;
  });
}

export const DiscoverView: React.FC<DiscoverViewProps> = ({
  onSelectRecipe,
  recipes,
  bookmarkedRecipeIds,
  onToggleBookmark,
}) => {
  const { language, t, count } = useTranslation();
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<string | null>(null);
  const [editionDate, setEditionDate] = useState(() => localDateKey());

  useEffect(() => {
    let timer: number | undefined;
    const scheduleNextEdition = () => {
      timer = window.setTimeout(() => {
        setEditionDate(localDateKey());
        scheduleNextEdition();
      }, millisecondsUntilMidnight());
    };
    scheduleNextEdition();
    return () => {
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, []);

  const dailyTopRecipes = useMemo(
    () => rankForEdition(recipes, editionDate, 'top5').slice(0, 5),
    [recipes, editionDate],
  );

  const allSubcategories = useMemo(
    () => DISCOVERY_RAILS.flatMap((rail) => rail.subcategories),
    [],
  );
  const selectedSubcategory = allSubcategories.find((subcategory) => subcategory.id === selectedSubcategoryId) || null;
  const selectedRecipes = useMemo(
    () => selectedSubcategory
      ? rankForEdition(recipes.filter(selectedSubcategory.matches), editionDate, selectedSubcategory.id)
      : [],
    [recipes, editionDate, selectedSubcategory],
  );

  if (selectedSubcategory) {
    return (
      <div className="flex flex-col w-full pb-10">
        <section className="px-4 pt-5 pb-2">
          <button
            type="button"
            onClick={() => setSelectedSubcategoryId(null)}
            className="flex items-center gap-1.5 text-primary font-label-md text-label-md font-bold mb-4 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
            {t('categoryBack')}
          </button>
          <div className="flex items-start gap-3">
            <img
              src={selectedSubcategory.image}
              alt={getLocalizedText(selectedSubcategory.title, language)}
              className="w-16 h-16 rounded-2xl object-cover shrink-0"
            />
            <div className="min-w-0">
              <h1 className="font-headline-lg text-headline-lg text-on-surface">
                {getLocalizedText(selectedSubcategory.title, language)}
              </h1>
            </div>
          </div>
        </section>

        <section className="px-4 pt-4 flex flex-col gap-2.5">
          <div className="flex items-center justify-between px-1">
            <h2 className="font-headline-sm text-headline-sm text-on-surface">{t('categoryResults')}</h2>
            <span className="font-label-sm text-label-sm text-on-surface-variant">
              {selectedRecipes.length} {count('result', selectedRecipes.length)}
            </span>
          </div>
          {selectedRecipes.length === 0 ? (
            <div className="p-8 rounded-2xl bg-surface-container text-center flex flex-col items-center gap-3">
              <span className="material-symbols-outlined text-[48px] text-outline">search_off</span>
              <h3 className="font-headline-sm text-headline-sm text-on-surface">{t('categoryNoRecipes')}</h3>
              <button
                type="button"
                onClick={() => setSelectedSubcategoryId(null)}
                className="mt-2 px-4 py-2 rounded-xl bg-primary text-on-primary font-label-md font-bold shadow-sm cursor-pointer"
              >
                {t('categoryBack')}
              </button>
            </div>
          ) : (
            selectedRecipes.map((recipe) => (
              <RecipeRow
                key={recipe.id}
                recipe={recipe}
                isBookmarked={bookmarkedRecipeIds.includes(recipe.id)}
                onSelectRecipe={onSelectRecipe}
                onToggleBookmark={onToggleBookmark}
                saveLabel={t('saveRecipe')}
              />
            ))
          )}
        </section>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full pb-10">
      <section className="px-4 pt-5 pb-1">
        <p className="font-label-sm text-label-sm text-primary uppercase tracking-[0.14em]">{t('discover')}</p>
        <h1 className="font-headline-lg text-headline-lg text-on-surface mt-1">{t('discoverTitle')}</h1>
      </section>

      <section className="pt-6">
        <div className="px-4 flex items-end justify-between gap-3 mb-3">
          <div>
            <h2 className="font-headline-sm text-headline-sm text-on-surface">
              {language === 'pl' ? 'Top 5 dnia' : 'Top 5 today'}
            </h2>
          </div>
          <span className="material-symbols-outlined text-primary text-[22px]">auto_awesome</span>
        </div>
        <div className="flex gap-3 overflow-x-auto no-scrollbar snap-x snap-mandatory px-4 pb-1">
          {dailyTopRecipes.map((recipe, index) => (
            <RecipeRailCard
              key={recipe.id}
              recipe={recipe}
              rank={index + 1}
              isBookmarked={bookmarkedRecipeIds.includes(recipe.id)}
              onSelectRecipe={onSelectRecipe}
              onToggleBookmark={onToggleBookmark}
              saveLabel={t('saveRecipe')}
            />
          ))}
        </div>
      </section>

      {DISCOVERY_RAILS.map((rail) => (
        <section key={rail.id} className="pt-7">
          <div className="px-4 mb-3">
            <h2 className="font-headline-sm text-headline-sm text-on-surface">
              {getLocalizedText(rail.title, language)}
            </h2>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
              {getLocalizedText(rail.description, language)}
            </p>
          </div>
          <div className="flex gap-3 overflow-x-auto no-scrollbar snap-x snap-mandatory px-4 pb-1">
            {rail.subcategories.map((subcategory) => (
              <SubcategoryCard
                key={`${rail.id}-${subcategory.id}`}
                subcategory={subcategory}
                language={language}
                onSelect={() => setSelectedSubcategoryId(subcategory.id)}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
};

interface RecipeRailCardProps {
  recipe: Recipe;
  rank?: number;
  isBookmarked: boolean;
  onSelectRecipe: (recipe: Recipe) => void;
  onToggleBookmark: (recipeId: string) => void;
  saveLabel: string;
}

interface SubcategoryCardProps {
  subcategory: DiscoverySubcategory;
  language: AppLanguage;
  onSelect: () => void;
}

const SubcategoryCard: React.FC<SubcategoryCardProps> = ({ subcategory, language, onSelect }) => (
  <article
    onClick={onSelect}
    className="relative w-[190px] shrink-0 snap-start overflow-hidden rounded-2xl bg-surface-container-lowest shadow-sm active:scale-[0.985] transition-transform cursor-pointer"
  >
    <div className="relative h-[118px] bg-surface-container-high overflow-hidden">
      <img
        className="w-full h-full object-cover"
        src={subcategory.image}
        alt={getLocalizedText(subcategory.title, language)}
        loading="lazy"
        decoding="async"
      />
      <span className="absolute inset-0 bg-gradient-to-t from-black/45 to-transparent" />
    </div>
    <div className="p-3">
      <h3 className="font-label-lg text-label-lg text-on-surface font-bold line-clamp-1">
        {getLocalizedText(subcategory.title, language)}
      </h3>
      <p className="font-body-sm text-body-sm text-on-surface-variant mt-1 line-clamp-2">
        {getLocalizedText(subcategory.description, language)}
      </p>
    </div>
  </article>
);

const RecipeRailCard: React.FC<RecipeRailCardProps> = ({
  recipe,
  rank,
  isBookmarked,
  onSelectRecipe,
  onToggleBookmark,
  saveLabel,
}) => (
  <article
    onClick={() => onSelectRecipe(recipe)}
    className="relative w-[224px] shrink-0 snap-start overflow-hidden rounded-2xl bg-surface-container-lowest shadow-sm active:scale-[0.985] transition-transform cursor-pointer"
  >
    <div className="relative h-[142px] bg-surface-container-high overflow-hidden">
      <img
        className="w-full h-full object-cover"
        src={recipe.imageUrl}
        alt={recipe.imageAlt}
        loading="lazy"
        decoding="async"
      />
      {rank ? (
        <span className="absolute top-2.5 left-2.5 w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center font-headline-sm text-headline-sm shadow-md">
          {rank}
        </span>
      ) : null}
      <button
        aria-label={saveLabel}
        onClick={(event) => {
          event.stopPropagation();
          onToggleBookmark(recipe.id);
        }}
        className="absolute top-2 right-2 w-9 h-9 rounded-full bg-black/45 text-white flex items-center justify-center cursor-pointer"
        type="button"
      >
        <span
          className="material-symbols-outlined text-[20px]"
          style={{ fontVariationSettings: isBookmarked ? "'FILL' 1" : "'FILL' 0" }}
        >
          bookmark
        </span>
      </button>
    </div>
    <div className="p-3">
      <span className="font-label-sm text-label-sm text-primary uppercase tracking-[0.08em] truncate block">
        {recipe.author}
      </span>
      <h3 className="font-label-lg text-label-lg text-on-surface font-bold line-clamp-2 mt-1 min-h-[40px]">
        {recipeDisplayTitle(recipe.title)}
      </h3>
      <span className="font-body-sm text-body-sm text-on-surface-variant block mt-1 truncate">
        {recipe.durationMinutes !== null && recipe.durationMinutes > 0 ? `${recipe.durationMinutes} min` : ''}
      </span>
    </div>
  </article>
);

interface RecipeRowProps {
  recipe: Recipe;
  isBookmarked: boolean;
  onSelectRecipe: (recipe: Recipe) => void;
  onToggleBookmark: (recipeId: string) => void;
  saveLabel: string;
}

const RecipeRow: React.FC<RecipeRowProps> = ({
  recipe,
  isBookmarked,
  onSelectRecipe,
  onToggleBookmark,
  saveLabel,
}) => (
  <article
    onClick={() => onSelectRecipe(recipe)}
    className="w-full bg-surface-container-lowest rounded-2xl p-2.5 shadow-sm flex items-center gap-3 transition-transform active:scale-[0.99] cursor-pointer"
  >
    <div className="w-20 h-20 rounded-xl bg-surface-container-high overflow-hidden flex-shrink-0">
      <img
        className="w-full h-full object-cover"
        src={recipe.imageUrl}
        alt={recipe.imageAlt}
        loading="lazy"
        decoding="async"
      />
    </div>
    <div className="flex flex-col min-w-0 flex-1">
      <span className="font-label-sm text-label-sm text-primary truncate">{recipe.author}</span>
      <h3 className="font-label-lg text-label-lg text-on-surface font-bold line-clamp-2">{recipeDisplayTitle(recipe.title)}</h3>
      <span className="font-body-sm text-body-sm text-on-surface-variant">
        {recipe.durationMinutes !== null && recipe.durationMinutes > 0 ? `${recipe.durationMinutes} min` : ''}
      </span>
    </div>
    <button
      aria-label={saveLabel}
      onClick={(event) => {
        event.stopPropagation();
        onToggleBookmark(recipe.id);
      }}
      className={`w-9 h-9 flex items-center justify-center shrink-0 cursor-pointer ${isBookmarked ? 'text-primary' : 'text-on-surface-variant'}`}
      type="button"
    >
      <span
        className="material-symbols-outlined text-[20px]"
        style={{ fontVariationSettings: isBookmarked ? "'FILL' 1" : "'FILL' 0" }}
      >
        bookmark
      </span>
    </button>
  </article>
);
