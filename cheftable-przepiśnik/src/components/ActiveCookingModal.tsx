import React, { useState, useEffect } from 'react';
import { Recipe } from '../types';
import { useTranslation } from '../i18n';

export interface ActiveCookingModalProps {
  recipe: Recipe;
  initialStep?: number;
  onClose: () => void;
  onFinish?: () => void;
  onFinishCooking?: () => void;
}

export const ActiveCookingModal: React.FC<ActiveCookingModalProps> = ({
  recipe,
  initialStep = 1,
  onClose,
  onFinish,
  onFinishCooking,
}) => {
  const { t, count } = useTranslation();
  const [currentStepIndex, setCurrentStepIndex] = useState(initialStep - 1);
  const totalSteps = recipe.steps.length;
  const currentStep = recipe.steps[currentStepIndex] || recipe.steps[0];

  const [secondsLeft, setSecondsLeft] = useState(
    (recipe.steps[initialStep - 1]?.durationMinutes ?? 0) * 60
  );
  const [isRunning, setIsRunning] = useState(true);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  useEffect(() => {
    let timer: any;
    if (isRunning && secondsLeft > 0) {
      timer = setInterval(() => {
        setSecondsLeft((prev) => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isRunning, secondsLeft]);

  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const remainder = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  };

  const handleCompleteFinish = () => {
    if (onFinishCooking) {
      onFinishCooking();
    } else if (onFinish) {
      onFinish();
    } else {
      onClose();
    }
  };

  const handleNextStep = () => {
    if (!completedSteps.includes(currentStepIndex)) {
      setCompletedSteps((prev) => [...prev, currentStepIndex]);
    }
    if (currentStepIndex < totalSteps - 1) {
      const nextIdx = currentStepIndex + 1;
      setCurrentStepIndex(nextIdx);
      const nextStepMins = recipe.steps[nextIdx]?.durationMinutes ?? 0;
      setSecondsLeft(nextStepMins * 60);
    } else {
      handleCompleteFinish();
    }
  };

  const handlePrevStep = () => {
    if (currentStepIndex > 0) {
      const prevIdx = currentStepIndex - 1;
      setCurrentStepIndex(prevIdx);
      const prevStepMins = recipe.steps[prevIdx]?.durationMinutes ?? 0;
      setSecondsLeft(prevStepMins * 60);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-surface flex flex-col justify-between max-w-[520px] mx-auto min-h-screen">
      {/* Top Bar */}
      <div className="pt-safe px-4 py-3 bg-surface/90 backdrop-blur-md flex items-center justify-between border-b border-surface-container">
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface hover:bg-surface-container cursor-pointer"
          type="button"
        >
          <span className="material-symbols-outlined text-[24px]">arrow_back</span>
        </button>

        <div className="flex flex-col items-center">
          <span className="font-label-sm text-label-sm uppercase font-bold text-primary tracking-wider">
            {t('cookingMode')}
          </span>
          <h2 className="font-headline-sm text-headline-sm text-on-surface truncate max-w-[240px]">
            {recipe.title}
          </h2>
        </div>

        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container cursor-pointer"
          type="button"
        >
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>
      </div>

      {/* Progress Bars */}
      <div className="px-4 pt-3 flex gap-1.5">
        {recipe.steps.map((_, idx) => (
          <div
            key={idx}
            className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
              idx < currentStepIndex
                ? 'bg-tertiary'
                : idx === currentStepIndex
                ? 'bg-primary'
                : 'bg-surface-container-highest'
            }`}
          />
        ))}
      </div>

      {/* Main Step Content */}
      <div className="px-4 py-5 flex-1 flex flex-col justify-between overflow-y-auto">
        <div className="flex flex-col gap-3.5">
          <div className="flex items-center justify-between">
            <span className="font-headline-lg text-headline-lg text-primary font-bold">
              {t('step')} {currentStepIndex + 1} / {totalSteps}
            </span>
            <div className="flex items-center gap-1.5 bg-surface-container-low px-3 py-1 rounded-full border border-surface-container-high/40">
              <span className="material-symbols-outlined text-primary text-[18px]">timer</span>
              <span className="font-headline-sm text-headline-sm font-mono text-on-surface font-bold">
                {formatTimer(secondsLeft)}
              </span>
            </div>
          </div>

          <h3 className="font-headline-md text-headline-md text-on-surface font-bold">
            {currentStep.title}
          </h3>

          <div className="p-4 rounded-2xl bg-surface-container-lowest shadow-sm border border-surface-container-high/40 leading-relaxed text-on-surface-variant font-body-lg text-[15px]">
            {currentStep.description}
          </div>

          {/* Quick Timer Controls */}
          <div className="flex items-center justify-center gap-3 pt-1">
            <button
              onClick={() => setSecondsLeft((prev) => prev + 60)}
              className="px-3 py-2 rounded-xl bg-surface-container text-on-surface font-label-md hover:bg-surface-container-high cursor-pointer active:scale-95 transition-all"
              type="button"
            >
              {t('addMinute')}
            </button>
            <button
              onClick={() => setIsRunning(!isRunning)}
              className="w-14 h-14 rounded-full bg-primary-container text-on-primary flex items-center justify-center shadow-md active:scale-95 transition-transform cursor-pointer"
              type="button"
            >
              <span className="material-symbols-outlined text-[28px]">
                {isRunning ? 'pause' : 'play_arrow'}
              </span>
            </button>
            <button
              onClick={() => setSecondsLeft(0)}
              className="px-3 py-2 rounded-xl bg-surface-container text-on-surface font-label-md hover:bg-surface-container-high cursor-pointer active:scale-95 transition-all"
              type="button"
            >
              {t('skipTimer')}
            </button>
          </div>
        </div>

        {/* Potrzebne składniki w tym kroku */}
        <div className="mt-4 p-3.5 rounded-2xl bg-surface-container-low/80 flex flex-col gap-2.5 border border-surface-container-high/40 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-primary text-[12px] font-bold uppercase tracking-wider">
              <span className="material-symbols-outlined text-[16px]">kitchen</span>
              <span>{t('ingredientsInStep')}</span>
            </div>
            {currentStep.stepIngredients && currentStep.stepIngredients.length > 0 && (
              <span className="text-[11px] font-bold text-secondary bg-surface-container-high px-2 py-0.5 rounded-full">
                {currentStep.stepIngredients.length} {count('ingredient', currentStep.stepIngredients.length)}
              </span>
            )}
          </div>

          {currentStep.stepIngredients && currentStep.stepIngredients.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {currentStep.stepIngredients.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-surface-container-lowest border border-surface-container-high/30 shadow-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="material-symbols-outlined text-[16px] text-primary shrink-0">
                      {item.icon || 'restaurant'}
                    </span>
                    <span className="text-xs font-semibold text-on-surface truncate">
                      {item.name}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-primary shrink-0 bg-surface-bright px-2 py-0.5 rounded-md border border-surface-container-high/30">
                    {item.amount || (item.amountBase ? `${item.amountBase} ${item.unit || ''}` : '')}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-3 py-2 rounded-xl bg-surface-container-lowest border border-surface-container-high/20">
              <span className="text-xs text-on-surface-variant">
                {t('noIngredientsInStep')}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="p-4 pb-safe-action-bar shrink-0 bg-surface/95 border-t border-surface-container flex items-center gap-3">
        <button
          onClick={handlePrevStep}
          disabled={currentStepIndex === 0}
          className="flex-1 h-12 rounded-xl bg-surface-container text-on-surface font-label-lg font-bold disabled:opacity-40 active:scale-95 transition-all flex items-center justify-center gap-1 cursor-pointer"
          type="button"
        >
          <span className="material-symbols-outlined text-[18px]">chevron_left</span>
          {t('previous')}
        </button>
        <button
          onClick={handleNextStep}
          className="flex-[2] h-12 rounded-xl bg-primary text-on-primary font-label-lg font-bold shadow-md active:scale-95 transition-all flex items-center justify-center gap-1 cursor-pointer"
          type="button"
        >
          <span>{currentStepIndex === totalSteps - 1 ? t('finishCookingCelebration') : t('nextStep')}</span>
          {currentStepIndex < totalSteps - 1 && (
            <span className="material-symbols-outlined text-[18px]">chevron_right</span>
          )}
        </button>
      </div>
    </div>
  );
};
