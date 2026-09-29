import React, { useState, useEffect } from 'react';
import { useTranslation } from '../i18n';

export interface ActiveCookingWidgetProps {
  recipeTitle: string;
  currentStepText?: string;
  currentStep?: number;
  totalSteps?: number;
  timeRemaining?: string;
  secondsRemaining?: number;
  initialSecondsRemaining?: number;
  isPlaying?: boolean;
  onTogglePlay?: () => void;
  onOpenModal?: () => void;
  onOpenDetails?: () => void;
  onClose?: () => void;
  onStop?: () => void;
}

export const ActiveCookingWidget: React.FC<ActiveCookingWidgetProps> = ({
  recipeTitle,
  currentStepText,
  currentStep = 1,
  totalSteps = 1,
  timeRemaining,
  secondsRemaining,
  initialSecondsRemaining = 252,
  isPlaying: controlledIsPlaying,
  onTogglePlay,
  onOpenModal,
  onOpenDetails,
  onClose,
  onStop,
}) => {
  const { t } = useTranslation();
  const [internalSeconds, setInternalSeconds] = useState(
    secondsRemaining !== undefined ? secondsRemaining : initialSecondsRemaining
  );
  const [internalIsPlaying, setInternalIsPlaying] = useState(true);

  const isPlaying = controlledIsPlaying !== undefined ? controlledIsPlaying : internalIsPlaying;

  useEffect(() => {
    let timer: any;
    if (isPlaying && internalSeconds > 0) {
      timer = setInterval(() => {
        setInternalSeconds((prev) => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isPlaying, internalSeconds]);

  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const remainder = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  };

  const displayTimer = timeRemaining || formatTimer(internalSeconds);
  const handleDetailsClick = onOpenModal || onOpenDetails || (() => {});
  const handleClose = onStop || onClose || (() => {});

  const handlePlayToggle = () => {
    if (onTogglePlay) {
      onTogglePlay();
    } else {
      setInternalIsPlaying(!internalIsPlaying);
    }
  };

  return (
    <aside className="fixed bottom-[76px] w-full max-w-[520px] z-40 px-4 pointer-events-none pb-safe">
      <div className="pointer-events-auto bg-inverse-surface text-inverse-on-surface rounded-2xl p-2.5 shadow-[0_6px_24px_rgba(26,28,28,0.22)] flex items-center justify-between gap-3 transition-transform active:scale-[0.99] border border-surface-variant/20">
        <button
          onClick={handleDetailsClick}
          className="flex items-center gap-3 flex-1 min-w-0 pl-1 min-h-[44px] text-left cursor-pointer"
          type="button"
        >
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-primary-container text-on-primary flex-shrink-0 shadow-[0_2px_10px_rgba(254,147,44,0.4)]">
            <span className="material-symbols-outlined text-[22px]">skillet</span>
            {isPlaying && (
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-tertiary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-tertiary-container"></span>
              </span>
            )}
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-label-sm text-label-sm font-bold text-primary-fixed">
                {t('step')} {currentStep}/{totalSteps}
              </span>
              <span className="text-inverse-on-surface/40 text-[10px]">•</span>
              <span className="font-label-sm text-label-sm text-inverse-on-surface/90 font-mono tracking-wider">
                {displayTimer}
              </span>
            </div>
            <p className="font-body-sm text-body-sm text-inverse-on-surface truncate font-medium">
              {currentStepText || recipeTitle}
            </p>
          </div>
        </button>

        <div className="flex items-center gap-1 flex-shrink-0 pr-1">
          <button
            aria-label={isPlaying ? t('pause') : t('resume')}
            onClick={handlePlayToggle}
            className="w-10 h-10 flex items-center justify-center text-inverse-on-surface hover:text-primary-container transition-colors rounded-full active:scale-90 cursor-pointer"
            type="button"
          >
            <span className="material-symbols-outlined text-[24px]">
              {isPlaying ? 'pause_circle' : 'play_circle'}
            </span>
          </button>
          <button
            aria-label={t('finishCooking')}
            onClick={handleClose}
            className="w-10 h-10 flex items-center justify-center text-inverse-on-surface/60 hover:text-inverse-on-surface transition-colors rounded-full active:scale-90 cursor-pointer"
            type="button"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
