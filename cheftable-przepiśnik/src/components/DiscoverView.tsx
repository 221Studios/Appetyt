import React, { useMemo, useState } from 'react';
import { type AppLanguage, useTranslation } from '../i18n';
import { Chef, Recipe } from '../types';

type CategoryId =
  | 'quick-15'
  | 'one-pot'
  | 'lunchbox'
  | 'simple'
  | 'budget'
  | 'low-calorie'
  | 'vegetarian'
  | 'vegan'
  | 'keto'
  | 'high-protein'
  | 'gluten-free'
  | 'lactose-free'
  | 'breakfast-sweet'
  | 'breakfast-savory'
  | 'soups'
  | 'main-dishes'
  | 'desserts'
  | 'dinners'
  | 'snacks'
  | 'chicken'
  | 'pasta'
  | 'potatoes'
  | 'minced-meat'
  | 'vegetables'
  | 'fish'
  | 'zero-waste'
  | 'pizza'
  | 'burgers'
  | 'comfort-food'
  | 'pasta-craving';

type CategoryTone = 'orange' | 'green' | 'purple' | 'red' | 'brown';

interface LocalizedText {
  pl: string;
  en: string;
}

interface CategoryDefinition {
  id: CategoryId;
  icon: string;
  tone: CategoryTone;
  title: LocalizedText;
  description: LocalizedText;
  matches: (recipe: Recipe) => boolean;
}

interface CategorySection {
  title: LocalizedText;
  categories: CategoryDefinition[];
}

const CATEGORY_IMAGE_BY_ID: Record<CategoryId, string> = {
  'quick-15': '/category-images/pasta.jpg',
  'one-pot': '/category-images/soup.jpg',
  lunchbox: '/category-images/salad.jpg',
  simple: '/category-images/vegetables.jpg',
  budget: '/category-images/rice-bowl.jpg',
  'low-calorie': '/category-images/green-salad.jpg',
  vegetarian: '/category-images/tofu.jpg',
  vegan: '/category-images/curry.jpg',
  keto: '/category-images/avocado-eggs.jpg',
  'high-protein': '/category-images/chicken.jpg',
  'gluten-free': '/category-images/quinoa.jpg',
  'lactose-free': '/category-images/dairy-free.jpg',
  'breakfast-sweet': '/category-images/breakfast.jpg',
  'breakfast-savory': '/category-images/breakfast-savory.jpg',
  soups: '/category-images/tomato-soup.jpg',
  'main-dishes': '/category-images/main-roast.jpg',
  desserts: '/category-images/dessert.jpg',
  dinners: '/category-images/dinner-bowl.jpg',
  snacks: '/category-images/snacks.jpg',
  chicken: '/category-images/chicken-bowl.jpg',
  pasta: '/category-images/pasta-red.jpg',
  potatoes: '/category-images/potato-dish.jpg',
  'minced-meat': '/category-images/meatballs.jpg',
  vegetables: '/category-images/vegetables-roasted.jpg',
  fish: '/category-images/fish.jpg',
  'zero-waste': '/category-images/leftover-bowl.jpg',
  pizza: '/category-images/pizza.jpg',
  burgers: '/category-images/burger.jpg',
  'comfort-food': '/category-images/stew.jpg',
  'pasta-craving': '/category-images/pasta-green.jpg',
};

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

const CATEGORY_SECTIONS: CategorySection[] = [
  {
    title: { pl: 'Na co dzień', en: 'Everyday cooking' },
    categories: [
      {
        id: 'quick-15', icon: 'bolt', tone: 'orange',
        title: { pl: 'Szybki obiad', en: 'Quick dinner' },
        description: { pl: 'Do 15 minut', en: 'Up to 15 min' },
        matches: (recipe) => recipe.durationMinutes !== null && recipe.durationMinutes > 0 && recipe.durationMinutes <= 15,
      },
      {
        id: 'one-pot', icon: 'soup_kitchen', tone: 'green',
        title: { pl: 'Dania jednogarnkowe', en: 'One-pot meals' },
        description: { pl: 'Mniej zmywania', en: 'Less washing up' },
        matches: (recipe) => matchesText(recipe, ['jednogarnk', 'one pot', 'one-pot', 'gulasz', 'stew', 'curry', 'chili', 'zupa', 'soup']),
      },
      {
        id: 'lunchbox', icon: 'lunch_dining', tone: 'green',
        title: { pl: 'Do lunchboxa', en: 'Lunchbox / meal prep' },
        description: { pl: 'Na następny dzień', en: 'For tomorrow' },
        matches: (recipe) => matchesText(recipe, ['lunchbox', 'lunch box', 'meal prep', 'do pracy', 'do szkol', 'leftover', 'na wynos', 'takeaway']),
      },
      {
        id: 'simple', icon: 'sentiment_satisfied', tone: 'brown',
        title: { pl: 'Proste przepisy', en: 'Easy recipes' },
        description: { pl: 'Dla początkujących', en: 'For beginners' },
        matches: (recipe) => recipe.ingredients.length <= 8 || matchesText(recipe, ['prost', 'easy', 'basic', 'poczatkuj', 'początkuj']),
      },
      {
        id: 'budget', icon: 'savings', tone: 'brown',
        title: { pl: 'Tanie gotowanie', en: 'Budget cooking' },
        description: { pl: 'Oszczędne obiady', en: 'Affordable meals' },
        matches: (recipe) =>
          (recipe.numericPrice > 0 && recipe.numericPrice <= 15) ||
          matchesText(recipe, ['tani', 'tanio', 'budget', 'oszczed', 'oszczęd']) ||
          recipe.ingredients.length <= 6,
      },
    ],
  },
  {
    title: { pl: 'Diety i zdrowy styl życia', en: 'Diets & healthy living' },
    categories: [
      {
        id: 'low-calorie', icon: 'monitor_weight', tone: 'green',
        title: { pl: 'Fit / niskokaloryczne', en: 'Fit / low-calorie' },
        description: { pl: 'Do 600 kcal', en: 'Up to 600 kcal' },
        matches: (recipe) =>
          (recipe.caloriesPerServing !== null && recipe.caloriesPerServing !== undefined && recipe.caloriesPerServing <= 600) ||
          matchesText(recipe, ['fit', 'low calorie', 'niskokal', 'lekki', 'light']),
      },
      {
        id: 'vegetarian', icon: 'eco', tone: 'green',
        title: { pl: 'Wegetariańskie', en: 'Vegetarian' },
        description: { pl: 'Bez mięsa i ryb', en: 'No meat or fish' },
        matches: recipeIsVegetarian,
      },
      {
        id: 'vegan', icon: 'spa', tone: 'green',
        title: { pl: 'Wegańskie', en: 'Vegan' },
        description: { pl: '100% roślinne', en: '100% plant-based' },
        matches: recipeIsVegan,
      },
      {
        id: 'keto', icon: 'avocado', tone: 'purple',
        title: { pl: 'Keto / low-carb', en: 'Keto / low-carb' },
        description: { pl: 'Mało węglowodanów', en: 'Lower carbs' },
        matches: (recipe) =>
          (recipe.carbsPerServing !== null && recipe.carbsPerServing !== undefined && recipe.carbsPerServing <= 25) ||
          matchesText(recipe, ['keto', 'low carb', 'low-carb', 'niskoweg', 'niskowęgl']),
      },
      {
        id: 'high-protein', icon: 'fitness_center', tone: 'purple',
        title: { pl: 'Wysokobiałkowe', en: 'High-protein' },
        description: { pl: 'Dla aktywnych', en: 'For active people' },
        matches: (recipe) =>
          (recipe.proteinPerServing !== null && recipe.proteinPerServing !== undefined && recipe.proteinPerServing >= 25) ||
          matchesText(recipe, ['białk', 'bialk', 'protein']),
      },
      {
        id: 'gluten-free', icon: 'grain', tone: 'purple',
        title: { pl: 'Bez glutenu', en: 'Gluten-free' },
        description: { pl: 'Dla wrażliwych', en: 'For sensitive diets' },
        matches: (recipe) => matchesText(recipe, ['bez glut', 'gluten free', 'gluten-free', 'bezgluten']),
      },
      {
        id: 'lactose-free', icon: 'no_drinks', tone: 'purple',
        title: { pl: 'Bez laktozy', en: 'Lactose-free' },
        description: { pl: 'Bez nabiału', en: 'Dairy-free' },
        matches: (recipe) => matchesText(recipe, ['bez laktoz', 'lactose free', 'lactose-free', 'bez nabial', 'bez nabiał']),
      },
    ],
  },
  {
    title: { pl: 'Typ posiłku', en: 'Meal type' },
    categories: [
      {
        id: 'breakfast-sweet', icon: 'bakery_dining', tone: 'orange',
        title: { pl: 'Śniadania na słodko', en: 'Sweet breakfasts' },
        description: { pl: 'Owsianki, naleśniki', en: 'Oats, pancakes' },
        matches: (recipe) => matchesText(recipe, ['śniad', 'sniad', 'breakfast']) && matchesText(recipe, ['slod', 'słod', 'pancake', 'naleś', 'nales', 'owsiank', 'granola', 'toast franc']),
      },
      {
        id: 'breakfast-savory', icon: 'egg_alt', tone: 'orange',
        title: { pl: 'Śniadania wytrawne', en: 'Savory breakfasts' },
        description: { pl: 'Jajka, kanapki', en: 'Eggs, sandwiches' },
        matches: (recipe) => matchesText(recipe, ['śniad', 'sniad', 'breakfast']) && matchesText(recipe, ['jaj', 'egg', 'kanapk', 'sandwich', 'omlet', 'omelet', 'awokado', 'avocado']),
      },
      {
        id: 'soups', icon: 'soup_kitchen', tone: 'green',
        title: { pl: 'Zupy', en: 'Soups' },
        description: { pl: 'Rozgrzewające klasyki', en: 'Comforting classics' },
        matches: (recipe) => matchesText(recipe, ['zupa', 'soup', 'ramen', 'pho', 'barszcz', 'rosol', 'rosół']),
      },
      {
        id: 'main-dishes', icon: 'dinner_dining', tone: 'red',
        title: { pl: 'Dania główne', en: 'Main dishes' },
        description: { pl: 'Obiad na stół', en: 'Dinner on the table' },
        matches: (recipe) => matchesText(recipe, ['dania', 'danie', 'main', 'obiad', 'dinner', 'lunch']),
      },
      {
        id: 'desserts', icon: 'cake', tone: 'red',
        title: { pl: 'Desery i ciasta', en: 'Desserts & cakes' },
        description: { pl: 'Na słodkie chwile', en: 'Sweet moments' },
        matches: (recipe) => matchesText(recipe, ['deser', 'ciast', 'cake', 'dessert', 'brownie', 'cookie', 'ciastecz', 'tart', 'sernik']),
      },
      {
        id: 'dinners', icon: 'restaurant', tone: 'red',
        title: { pl: 'Lekkie kolacje', en: 'Light dinners' },
        description: { pl: 'Na koniec dnia', en: 'For the evening' },
        matches: (recipe) => matchesText(recipe, ['kolac', 'dinner', 'salad', 'sałat', 'salat', 'kanapk', 'sandwich']),
      },
      {
        id: 'snacks', icon: 'tapas', tone: 'red',
        title: { pl: 'Przekąski i przystawki', en: 'Snacks & starters' },
        description: { pl: 'Małe, ale konkretne', en: 'Small but mighty' },
        matches: (recipe) => matchesText(recipe, ['przekąsk', 'przekask', 'snack', 'przystawk', 'starter', 'dip', 'sos']),
      },
    ],
  },
  {
    title: { pl: 'Ratowanie lodówki', en: 'Rescue your fridge' },
    categories: [
      {
        id: 'chicken', icon: 'drumstick', tone: 'brown',
        title: { pl: 'Dania z kurczakiem', en: 'Chicken dishes' },
        description: { pl: 'Najpopularniejszy składnik', en: 'A kitchen staple' },
        matches: (recipe) => matchesText(recipe, ['kurczak', 'chicken']),
      },
      {
        id: 'pasta', icon: 'ramen_dining', tone: 'brown',
        title: { pl: 'Przepisy z makaronem', en: 'Pasta recipes' },
        description: { pl: 'Szybko i sycąco', en: 'Fast and filling' },
        matches: (recipe) => matchesText(recipe, ['makaron', 'pasta', 'spaghetti', 'penne', 'noodle', 'ramen']),
      },
      {
        id: 'potatoes', icon: 'bakery_dining', tone: 'brown',
        title: { pl: 'Dania z ziemniaków', en: 'Potato dishes' },
        description: { pl: 'Zawsze pod ręką', en: 'Always on hand' },
        matches: (recipe) => matchesText(recipe, ['ziemniak', 'potato', 'kartofel']),
      },
      {
        id: 'minced-meat', icon: 'kebab_dining', tone: 'brown',
        title: { pl: 'Z mięsa mielonego', en: 'Ground meat' },
        description: { pl: 'Pomysł na obiad', en: 'Dinner inspiration' },
        matches: (recipe) => matchesText(recipe, ['mielon', 'minced', 'ground beef', 'ground meat']),
      },
      {
        id: 'vegetables', icon: 'local_florist', tone: 'green',
        title: { pl: 'Dania z warzywami', en: 'Vegetable dishes' },
        description: { pl: 'Kolorowo i świeżo', en: 'Fresh and colorful' },
        matches: (recipe) => matchesText(recipe, ['warzyw', 'vegetable', 'veggie', 'broku', 'papryk', 'cukini', 'bakłaż', 'baklazan']),
      },
      {
        id: 'fish', icon: 'set_meal', tone: 'green',
        title: { pl: 'Ryby i owoce morza', en: 'Fish & seafood' },
        description: { pl: 'Lekko i konkretnie', en: 'Light and satisfying' },
        matches: (recipe) => matchesText(recipe, ['ryb', 'fish', 'łosoś', 'losos', 'salmon', 'krewet', 'shrimp', 'tuńczyk', 'tunczyk', 'tuna']),
      },
      {
        id: 'zero-waste', icon: 'recycling', tone: 'green',
        title: { pl: 'Zero waste', en: 'Zero waste' },
        description: { pl: 'Wykorzystaj resztki', en: 'Use what you have' },
        matches: (recipe) => matchesText(recipe, ['zero waste', 'reszt', 'leftover', 'z lodówk', 'z lodowk', 'czerstw']),
      },
    ],
  },
  {
    title: { pl: 'Na co masz ochotę?', en: 'What are you craving?' },
    categories: [
      {
        id: 'pizza', icon: 'local_pizza', tone: 'red',
        title: { pl: 'Pizza', en: 'Pizza' },
        description: { pl: 'Domowa i chrupiąca', en: 'Homemade & crispy' },
        matches: (recipe) => matchesText(recipe, ['pizza', 'pizz']),
      },
      {
        id: 'burgers', icon: 'lunch_dining', tone: 'orange',
        title: { pl: 'Burgery', en: 'Burgers' },
        description: { pl: 'Buła pełna smaku', en: 'Packed with flavor' },
        matches: (recipe) => matchesText(recipe, ['burger', 'hamburger', 'cheeseburger']),
      },
      {
        id: 'pasta-craving', icon: 'ramen_dining', tone: 'orange',
        title: { pl: 'Makaron', en: 'Pasta' },
        description: { pl: 'Zawsze dobry pomysł', en: 'Always a good idea' },
        matches: (recipe) => matchesText(recipe, ['makaron', 'pasta', 'spaghetti', 'penne', 'noodle', 'ramen']),
      },
      {
        id: 'comfort-food', icon: 'soup_kitchen', tone: 'green',
        title: { pl: 'Comfort food', en: 'Comfort food' },
        description: { pl: 'Dużo smaku, mało zachodu', en: 'Big flavor, low effort' },
        matches: (recipe) => matchesText(recipe, ['comfort', 'gulasz', 'stew', 'curry', 'chili', 'mac and cheese', 'serowy']),
      },
    ],
  },
];

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

function shuffleRecipes(recipes: Recipe[]): Recipe[] {
  const shuffled = [...recipes];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
  }
  return shuffled;
}

export const DiscoverView: React.FC<DiscoverViewProps> = ({
  onSelectRecipe,
  recipes,
  bookmarkedRecipeIds,
  onToggleBookmark,
}) => {
  const { language, t, count } = useTranslation();
  const [selectedCategoryId, setSelectedCategoryId] = useState<CategoryId | null>(null);
  const shuffledRecipes = useMemo(() => shuffleRecipes(recipes), [recipes]);

  const allCategories = useMemo(
    () => CATEGORY_SECTIONS.flatMap((section) => section.categories),
    [],
  );
  const selectedCategory = allCategories.find((category) => category.id === selectedCategoryId) || null;
  const selectedRecipes = useMemo(
    () => (selectedCategory ? shuffledRecipes.filter(selectedCategory.matches) : []),
    [shuffledRecipes, selectedCategory],
  );

  if (selectedCategory) {
    return (
      <div className="flex flex-col w-full pb-10">
        <section className="px-4 pt-5 pb-2">
          <button
            type="button"
            onClick={() => setSelectedCategoryId(null)}
            className="flex items-center gap-1.5 text-primary font-label-md text-label-md font-bold mb-4 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
            {t('categoryBack')}
          </button>
          <div className="flex items-start gap-3">
            <img
              src={CATEGORY_IMAGE_BY_ID[selectedCategory.id]}
              alt={getLocalizedText(selectedCategory.title, language)}
              className="w-16 h-16 rounded-2xl object-cover shrink-0"
            />
            <div className="min-w-0">
              <h1 className="font-headline-lg text-headline-lg text-on-surface">
                {getLocalizedText(selectedCategory.title, language)}
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
                onClick={() => setSelectedCategoryId(null)}
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
                countIngredients={count('ingredient', recipe.ingredients.length)}
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

      {CATEGORY_SECTIONS.map((section) => (
        <section key={section.title.pl} className="px-4 pt-6">
          <h2 className="font-headline-sm text-headline-sm text-on-surface mb-3">
            {getLocalizedText(section.title, language)}
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {section.categories.map((category) => {
              return (
                <button
                  key={`${section.title.pl}-${category.id}-${category.title.pl}`}
                  type="button"
                  onClick={() => setSelectedCategoryId(category.id)}
                  className="relative aspect-[1.15] rounded-2xl overflow-hidden bg-surface-container-high text-left shadow-sm active:scale-[0.98] transition-transform cursor-pointer"
                >
                  <img
                    src={CATEGORY_IMAGE_BY_ID[category.id]}
                    alt={getLocalizedText(category.title, language)}
                    className="absolute inset-0 w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent px-3 pt-10 pb-3">
                    <h3 className="font-label-lg text-label-lg text-white font-bold leading-snug">
                      {getLocalizedText(category.title, language)}
                    </h3>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
};

interface RecipeRowProps {
  recipe: Recipe;
  isBookmarked: boolean;
  onSelectRecipe: (recipe: Recipe) => void;
  onToggleBookmark: (recipeId: string) => void;
  saveLabel: string;
  countIngredients: string;
}

const RecipeRow: React.FC<RecipeRowProps> = ({
  recipe,
  isBookmarked,
  onSelectRecipe,
  onToggleBookmark,
  saveLabel,
  countIngredients,
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
      <h3 className="font-label-lg text-label-lg text-on-surface font-bold line-clamp-2">{recipe.title}</h3>
      <span className="font-body-sm text-body-sm text-on-surface-variant">
        {recipe.durationMinutes !== null && recipe.durationMinutes > 0 ? `${recipe.durationMinutes} min · ` : ''}{countIngredients}
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
