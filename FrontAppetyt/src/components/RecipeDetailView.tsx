import React, { useState } from 'react';
import { Recipe, StepIngredient } from '../types';

interface RecipeDetailViewProps {
  recipe: Recipe;
  onBack: () => void;
  onStartCooking: (recipe: Recipe) => void;
  onAddMissingToShopping: (recipe: Recipe) => void;
  isBookmarked: boolean;
  onToggleBookmark: (recipeId: string) => void;
  onShowToast: (msg: string) => void;
}

export const RecipeDetailView: React.FC<RecipeDetailViewProps> = ({
  recipe,
  onBack,
  onStartCooking,
  onAddMissingToShopping,
  isBookmarked,
  onToggleBookmark,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<'ingredients' | 'steps' | 'cost'>('ingredients');
  const [servings, setServings] = useState(recipe.baseServings || 2);
  const [addedToCartFeedback, setAddedToCartFeedback] = useState(false);

  const ratio = servings / (recipe.baseServings || 2);

  const formatStepIngredientAmount = (item: StepIngredient) => {
    if (item.amount) return item.amount;
    if (item.amountBase !== undefined) {
      const scaled = item.scalable ? Math.round(item.amountBase * ratio * 10) / 10 : item.amountBase;
      return `${scaled} ${item.unit || ''}`.trim();
    }
    return '';
  };

  const missingIngredientsCount = recipe.ingredients.filter((i) => !i.inFridge && !i.inPantry).length;
  const inFridgeCount = recipe.ingredients.filter((i) => i.inFridge).length;

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: recipe.title,
        text: `Zobacz przepis na ${recipe.title} w ChefTable!`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(window.location.href);
      onShowToast('Skopiowano link do schowka!');
    }
  };

  const handleAddCart = () => {
    onAddMissingToShopping(recipe);
    setAddedToCartFeedback(true);
    onShowToast(`Dodano ${missingIngredientsCount} brakujące składniki do listy zakupów!`);
    setTimeout(() => {
      setAddedToCartFeedback(false);
    }, 2500);
  };

  return (
    <div className="flex flex-col relative w-full pt-16 pb-28 bg-surface min-h-screen">
      {/* Top Header */}
      <header className="fixed top-0 w-full max-w-[520px] z-50 pt-safe bg-surface/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
        <div className="h-16 px-2 flex items-center justify-between">
          <div className="flex items-center gap-1">
            <button
              aria-label="Wróć"
              onClick={onBack}
              className="w-12 h-12 rounded-full flex items-center justify-center text-on-surface hover:text-primary transition-colors cursor-pointer"
              type="button"
            >
              <span className="material-symbols-outlined text-[24px]">arrow_back</span>
            </button>
            <h1 className="font-headline-sm text-headline-sm text-on-surface truncate max-w-[260px]">
              Szczegóły Przepisu
            </h1>
          </div>
          <div className="flex items-center gap-1 pr-2">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-sm">
              <span className="material-symbols-outlined text-on-primary text-[18px]">person</span>
            </div>
          </div>
        </div>
      </header>

      {/* Visual Hero Banner with Editorial Scrim */}
      <div className="relative w-full h-64 overflow-hidden rounded-b-2xl shadow-sm bg-surface-container-high">
        <img
          className="w-full h-full object-cover"
          src={recipe.imageUrl}
          alt={recipe.imageAlt}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-inverse-surface via-inverse-surface/40 to-transparent"></div>

        {/* Top Action Badges */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-bright/90 backdrop-blur-md shadow-sm">
            <span className="w-2 h-2 rounded-full bg-tertiary"></span>
            <span className="font-label-sm text-label-sm text-on-surface font-semibold tracking-wide uppercase">
              Zweryfikowany przepis
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              aria-label="Zapisz do ulubionych"
              onClick={() => {
                onToggleBookmark(recipe.id);
                onShowToast(!isBookmarked ? 'Zapisano w ulubionych!' : 'Usunięto z ulubionych');
              }}
              className={`w-10 h-10 rounded-full bg-surface-bright/90 backdrop-blur-md flex items-center justify-center shadow-sm active:scale-90 transition-all cursor-pointer ${
                isBookmarked ? 'text-primary' : 'text-on-surface'
              }`}
              type="button"
            >
              <span
                className="material-symbols-outlined text-[20px]"
                style={{ fontVariationSettings: isBookmarked ? "'FILL' 1" : "'FILL' 0" }}
              >
                bookmark
              </span>
            </button>
            <button
              aria-label="Udostępnij przepis"
              onClick={handleShare}
              className="w-10 h-10 rounded-full bg-surface-bright/90 backdrop-blur-md flex items-center justify-center text-on-surface shadow-sm active:scale-95 transition-transform cursor-pointer"
              type="button"
            >
              <span className="material-symbols-outlined text-[20px]">share</span>
            </button>
          </div>
        </div>

        {/* Floating Title Overlay Content */}
        <div className="absolute bottom-4 left-4 right-4 text-on-primary">
          <span className="font-label-sm text-label-sm text-primary-fixed-dim uppercase tracking-wider font-bold">
            {recipe.categoryLabel || 'Autorska Gastronomia'}
          </span>
          <h2 className="font-headline-md text-headline-md text-surface-bright leading-tight drop-shadow-sm mt-0.5">
            {recipe.title}
          </h2>
        </div>
      </div>

      {/* Author & Provenance Section */}
      <div className="px-4 pt-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center text-primary font-headline-sm text-headline-sm overflow-hidden shadow-sm">
              {recipe.authorAvatar || 'TJ'}
            </div>
            <div className="flex flex-col">
              <span className="font-label-sm text-label-sm text-secondary">Autor przepisu</span>
              <span className="font-label-lg text-label-lg text-on-surface flex items-center gap-1 font-bold">
                {recipe.author}
                <span className="material-symbols-outlined text-[16px] text-secondary">chevron_right</span>
              </span>
            </div>
          </div>

          {/* External Source Chip */}
          <a
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-container-low text-on-surface shadow-sm active:bg-surface-container transition-colors hover:text-primary"
            href={recipe.authorSourceUrl || '#'}
            target="_blank"
            rel="noopener noreferrer"
          >
            <span className="material-symbols-outlined text-[16px] text-primary">auto_stories</span>
            <span className="font-label-sm text-label-sm font-semibold">
              {recipe.authorSourceUrl ? recipe.authorSourceUrl.replace('https://', '') : 'tomaszjakubiak.pl'}
            </span>
            <span className="material-symbols-outlined text-[14px] text-secondary">open_in_new</span>
          </a>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-4 gap-2 mt-1">
          <div className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-surface-container-lowest shadow-sm text-center">
            <span className="material-symbols-outlined text-primary text-[20px] mb-0.5">schedule</span>
            <span className="font-headline-sm text-headline-sm text-on-surface">{recipe.durationMinutes}</span>
            <span className="font-label-sm text-label-sm text-secondary">minut</span>
          </div>

          <div className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-surface-container-lowest shadow-sm text-center">
            <span className="material-symbols-outlined text-primary text-[20px] mb-0.5">restaurant</span>
            <span className="font-headline-sm text-headline-sm text-on-surface">{servings}</span>
            <span className="font-label-sm text-label-sm text-secondary">porcje</span>
          </div>

          <div className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-surface-container-lowest shadow-sm text-center">
            <span className="material-symbols-outlined text-tertiary text-[20px] mb-0.5">kitchen</span>
            <span className="font-headline-sm text-headline-sm text-on-surface">
              {inFridgeCount}/{recipe.ingredients.length}
            </span>
            <span className="font-label-sm text-label-sm text-secondary">w lodówce</span>
          </div>

          <div className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-surface-container-lowest shadow-sm text-center">
            <span className="material-symbols-outlined text-secondary text-[20px] mb-0.5">local_fire_department</span>
            <span className="font-label-sm text-label-sm text-secondary font-medium mt-1">
              {recipe.caloriesText.includes('kcal') ? recipe.caloriesText.split(' ')[0] : 'Brak'}
            </span>
            <span className="font-label-sm text-label-sm text-secondary">
              {recipe.caloriesText.includes('kcal') ? 'kcal' : 'w źródle'}
            </span>
          </div>
        </div>

        {/* Strict Transparency Note */}
        <div className="p-3 rounded-xl bg-surface-container-low flex items-start gap-2.5">
          <span className="material-symbols-outlined text-primary text-[18px] mt-0.5 shrink-0">verified</span>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Przepis pobrany bezpośrednio z publikacji autora. Kalorie i gramatury nie są sztucznie estymowane.
          </p>
        </div>

        {/* Action CTAs */}
        <div className="flex flex-col gap-2.5 pt-1">
          <button
            onClick={() => onStartCooking(recipe)}
            className="w-full h-12 rounded-xl bg-primary-container text-on-primary font-headline-sm text-headline-sm flex items-center justify-center gap-2 shadow-[0_4px_16px_rgba(254,147,44,0.28)] active:scale-[0.98] transition-transform cursor-pointer"
            type="button"
          >
            <span className="material-symbols-outlined text-[22px]">cooking</span>
            Rozpocznij gotowanie
          </button>

          <button
            onClick={handleAddCart}
            className="w-full h-12 rounded-xl bg-surface-container-lowest text-on-surface font-label-lg text-label-lg flex items-center justify-center gap-2 shadow-sm active:bg-surface-container-low transition-colors cursor-pointer border border-surface-container-high/60"
            type="button"
          >
            {addedToCartFeedback ? (
              <>
                <span className="material-symbols-outlined text-[20px] text-tertiary">done</span>
                <span className="text-tertiary font-bold">Dodano do listy zakupów!</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[20px] text-primary">shopping_bag</span>
                <span>Dodaj brakujące ({missingIngredientsCount}) do listy zakupów</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Tabs System (Segmented Architecture) */}
      <div className="mt-6">
        <div className="px-4">
          <div className="flex p-1 rounded-xl bg-surface-container-highest shadow-inner" role="tablist">
            <button
              aria-selected={activeTab === 'ingredients'}
              onClick={() => setActiveTab('ingredients')}
              className={`flex-1 py-2 rounded-lg font-label-lg text-label-lg transition-all text-center cursor-pointer ${
                activeTab === 'ingredients'
                  ? 'bg-surface-container-lowest text-on-surface shadow-sm font-bold'
                  : 'text-secondary font-medium hover:text-on-surface'
              }`}
              type="button"
            >
              Składniki ({recipe.ingredients.length})
            </button>
            <button
              aria-selected={activeTab === 'steps'}
              onClick={() => setActiveTab('steps')}
              className={`flex-1 py-2 rounded-lg font-label-lg text-label-lg transition-all text-center cursor-pointer ${
                activeTab === 'steps'
                  ? 'bg-surface-container-lowest text-on-surface shadow-sm font-bold'
                  : 'text-secondary font-medium hover:text-on-surface'
              }`}
              type="button"
            >
              Kroki ({recipe.steps.length})
            </button>
            <button
              aria-selected={activeTab === 'cost'}
              onClick={() => setActiveTab('cost')}
              className={`flex-1 py-2 rounded-lg font-label-lg text-label-lg transition-all text-center cursor-pointer ${
                activeTab === 'cost'
                  ? 'bg-surface-container-lowest text-on-surface shadow-sm font-bold'
                  : 'text-secondary font-medium hover:text-on-surface'
              }`}
              type="button"
            >
              Kosztorys
            </button>
          </div>
        </div>

        {/* TAB 1: SKŁADNIKI */}
        {activeTab === 'ingredients' && (
          <div className="px-4 pt-4 flex flex-col gap-3">
            {/* Servings Scaler Header */}
            <div className="p-3.5 rounded-xl bg-surface-container-lowest shadow-sm flex items-center justify-between">
              <div className="flex flex-col">
                <span className="font-label-lg text-label-lg font-bold text-on-surface">Przelicznik porcji</span>
                <span className="font-body-sm text-body-sm text-secondary">Składniki skalowalne z katalogu</span>
              </div>
              <div className="flex items-center gap-2 bg-surface-container-low px-2 py-1 rounded-lg">
                <button
                  aria-label="Zmniejsz porcje"
                  disabled={servings <= 1}
                  onClick={() => setServings((s) => Math.max(1, s - 1))}
                  className="w-8 h-8 rounded-md bg-surface-container-lowest text-on-surface flex items-center justify-center active:scale-95 shadow-xs disabled:opacity-30 cursor-pointer"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[18px]">remove</span>
                </button>
                <span className="w-7 text-center font-headline-sm text-headline-sm text-on-surface">
                  {servings}
                </span>
                <button
                  aria-label="Zwiększ porcje"
                  onClick={() => setServings((s) => Math.min(24, s + 1))}
                  className="w-8 h-8 rounded-md bg-surface-container-lowest text-on-surface flex items-center justify-center active:scale-95 shadow-xs cursor-pointer"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[18px]">add</span>
                </button>
              </div>
            </div>

            {/* Ingredients Items List */}
            <div className="flex flex-col gap-2">
              {recipe.ingredients.map((ing) => {
                const scaledAmount = ing.scalable
                  ? Math.round(ing.amountBase * ratio * 10) / 10
                  : null;

                return (
                  <div
                    key={ing.id}
                    className="p-3.5 rounded-xl bg-surface-container-lowest shadow-sm flex items-center justify-between gap-3 border border-surface-container-high/30"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-surface-container-low flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-[18px] text-on-surface-variant">
                          {ing.icon || 'restaurant'}
                        </span>
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-label-lg text-label-lg text-on-surface font-semibold truncate">
                          {scaledAmount !== null ? `${scaledAmount} ${ing.unit}` : ing.name}
                        </span>
                        <span className="font-body-sm text-body-sm text-secondary truncate">
                          {ing.categoryDetail}
                        </span>
                      </div>
                    </div>

                    {ing.inFridge ? (
                      <div className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-tertiary-fixed text-on-tertiary-fixed-variant">
                        <span className="material-symbols-outlined text-[14px]">check_circle</span>
                        <span className="font-label-sm text-label-sm font-bold">W lodówce</span>
                      </div>
                    ) : ing.inPantry ? (
                      <div className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-tertiary-fixed text-on-tertiary-fixed-variant">
                        <span className="material-symbols-outlined text-[14px]">check_circle</span>
                        <span className="font-label-sm text-label-sm font-bold">W szafce</span>
                      </div>
                    ) : (
                      <div className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-container-highest text-secondary">
                        <span className="material-symbols-outlined text-[14px]">shopping_cart</span>
                        <span className="font-label-sm text-label-sm font-semibold">Brak</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Ratio Exemption Note */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-container-low text-secondary">
              <span className="material-symbols-outlined text-[16px]">info</span>
              <span className="font-body-sm text-body-sm">
                Przyprawy i sól pomijamy w kalkulacji ilościowej.
              </span>
            </div>
          </div>
        )}

        {/* TAB 2: KROKI */}
        {activeTab === 'steps' && (
          <div className="px-4 pt-4 flex flex-col gap-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-surface-container-low">
              <span className="font-label-sm text-label-sm text-secondary uppercase font-bold tracking-wider">
                Kroki szefa kuchni
              </span>
              <span className="font-label-sm text-label-sm text-primary font-bold">Tempo umiarkowane</span>
            </div>

            {recipe.steps.map((step) => (
              <div
                key={step.stepNumber}
                className="p-4 rounded-xl bg-surface-container-lowest shadow-sm flex flex-col gap-3 border border-surface-container-high/30"
              >
                <div className="flex gap-3.5 items-start">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-headline-sm text-headline-sm shrink-0 ${
                      step.stepNumber === 1
                        ? 'bg-primary-container text-on-primary'
                        : 'bg-surface-container-highest text-on-surface'
                    }`}
                  >
                    {step.stepNumber}
                  </div>
                  <div className="flex flex-col gap-1 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-label-lg text-label-lg font-bold text-on-surface">
                        {step.title}
                      </span>
                      {step.durationMinutes && (
                        <span className="text-[11px] font-bold text-secondary bg-surface-container-low px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                          <span className="material-symbols-outlined text-[13px]">timer</span>
                          {step.durationMinutes} min
                        </span>
                      )}
                    </div>
                    <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>

                {/* Potrzebne składniki w tym kroku */}
                {step.stepIngredients && step.stepIngredients.length > 0 && (
                  <div className="mt-1 pt-3 border-t border-surface-container-high/40 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-secondary text-[11px] font-bold uppercase tracking-wider">
                        <span className="material-symbols-outlined text-[15px] text-primary">kitchen</span>
                        <span>Składniki do tego kroku:</span>
                      </div>
                      <span className="text-[11px] text-secondary font-medium">
                        {step.stepIngredients.length} {step.stepIngredients.length === 1 ? 'składnik' : 'składniki'}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {step.stepIngredients.map((ing, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-surface-container-low/70 border border-surface-container-high/30"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="material-symbols-outlined text-[16px] text-primary shrink-0">
                              {ing.icon || 'restaurant'}
                            </span>
                            <span className="text-xs font-medium text-on-surface truncate">
                              {ing.name}
                            </span>
                          </div>
                          <span className="text-xs font-bold text-primary shrink-0 bg-surface-bright px-1.5 py-0.5 rounded border border-surface-container-high/30">
                            {formatStepIngredientAmount(ing)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* TAB 3: KOSZTORYS */}
        {activeTab === 'cost' && (
          <div className="px-4 pt-4 flex flex-col gap-3">
            <div className="p-4 rounded-2xl bg-surface-container-lowest shadow-sm flex flex-col gap-4 border border-surface-container-high/30">
              <div className="flex items-center justify-between pb-3 border-b border-surface-container">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[22px]">receipt_long</span>
                  <span className="font-headline-sm text-headline-sm text-on-surface">Wycena koszyka</span>
                </div>
                <span className="font-label-sm text-label-sm font-bold text-tertiary px-2 py-0.5 rounded bg-tertiary-fixed">
                  Aktualne ceny
                </span>
              </div>

              <div className="flex flex-col gap-2.5">
                <div className="flex items-baseline justify-between">
                  <span className="font-headline-lg text-headline-lg text-on-surface font-extrabold">
                    {recipe.costBreakdown?.totalEstimate || recipe.estimatedPrice}
                  </span>
                  <span className="font-label-sm text-label-sm text-secondary font-medium">
                    za całe opakowania
                  </span>
                </div>

                <div className="flex flex-col gap-2 pt-2">
                  <div className="flex justify-between items-center text-body-sm font-body-sm">
                    <span className="text-secondary">Średnia katalogowa marketów:</span>
                    <span className="font-semibold text-on-surface">
                      {recipe.costBreakdown?.catalogAvg || '32,10 zł'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-body-sm font-body-sm">
                    <span className="text-secondary">Twoje lokalne ceny z kartami:</span>
                    <span className="font-bold text-primary">
                      {recipe.costBreakdown?.userWithCards || '28,40 zł'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-body-sm font-body-sm pt-2 border-t border-surface-container">
                    <span className="text-secondary">Do dokupienia dzisiaj:</span>
                    <span className="font-bold text-on-surface">
                      {recipe.costBreakdown?.toBuyNow || '17,20 zł'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Items Breakdown */}
              {recipe.costBreakdown?.items && (
                <div className="p-3 rounded-xl bg-surface-container-low flex flex-col gap-2">
                  {recipe.costBreakdown.items.map((item, i) => (
                    <div
                      key={i}
                      className="flex justify-between text-label-sm font-label-sm text-on-surface"
                    >
                      <span>{item.name}</span>
                      <span className={item.highlight ? 'font-bold text-primary' : 'text-secondary'}>
                        {item.price}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Disclaimer */}
              <div className="p-3 rounded-xl bg-surface-container-highest/60 flex items-start gap-2.5">
                <span className="material-symbols-outlined text-secondary text-[18px] shrink-0 mt-0.5">
                  policy
                </span>
                <p className="font-body-sm text-body-sm text-on-surface-variant leading-tight">
                  Liczymy całe opakowania głównych składników. Woda, przyprawy, energia poza wyceną. Brak ceny w sklepie ≠ darmowe.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
