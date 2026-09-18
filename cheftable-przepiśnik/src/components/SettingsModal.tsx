import React, { useState } from 'react';

interface SettingsModalProps {
  onClose: () => void;
  onShowToast: (msg: string) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ onClose, onShowToast }) => {
  const [includeDiscounts, setIncludeDiscounts] = useState(true);
  const [showCookingTimerSound, setShowCookingTimerSound] = useState(true);
  const [substituteIngredients, setSubstituteIngredients] = useState(true);
  const [expiryReminders, setExpiryReminders] = useState(false);

  const handleSave = () => {
    onShowToast('Ustawienia aplikacji zostały zaktualizowane');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-inverse-surface/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[480px] bg-surface rounded-t-3xl sm:rounded-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom-8 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 pt-5 pb-3 flex items-center justify-between border-b border-surface-container">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center text-on-surface">
              <span className="material-symbols-outlined text-[22px]">settings</span>
            </div>
            <div>
              <h3 className="font-headline-sm text-headline-sm text-on-surface">Ustawienia</h3>
              <p className="font-label-sm text-label-sm text-on-surface-variant">
                Dostosuj działanie przepiśnika
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center text-on-surface hover:bg-surface-container-high cursor-pointer"
            type="button"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto no-scrollbar flex flex-col gap-4">
          {/* Section: Kosztorys i wyceny */}
          <div className="flex flex-col gap-2">
            <span className="font-label-sm text-label-sm font-bold uppercase tracking-wider text-primary">
              Kosztorys i zakupy
            </span>

            <label className="flex items-center justify-between p-3.5 rounded-2xl bg-surface-container-lowest shadow-xs cursor-pointer border border-surface-container-high/30">
              <div className="flex flex-col pr-3">
                <span className="font-label-lg text-label-lg font-semibold text-on-surface">
                  Ceny z kartami lojalnościowymi
                </span>
                <span className="font-body-sm text-body-sm text-on-surface-variant">
                  Uwzględniaj rabaty Moja Biedronka i Lidl Plus przy estymacji dań
                </span>
              </div>
              <input
                type="checkbox"
                checked={includeDiscounts}
                onChange={(e) => setIncludeDiscounts(e.target.checked)}
                className="w-5 h-5 accent-primary rounded cursor-pointer shrink-0"
              />
            </label>

            <label className="flex items-center justify-between p-3.5 rounded-2xl bg-surface-container-lowest shadow-xs cursor-pointer border border-surface-container-high/30">
              <div className="flex flex-col pr-3">
                <span className="font-label-lg text-label-lg font-semibold text-on-surface">
                  Sugeruj zamienniki składników
                </span>
                <span className="font-body-sm text-body-sm text-on-surface-variant">
                  Np. parmezan ↔ Grana Padano, śmietanka ↔ mascarpone
                </span>
              </div>
              <input
                type="checkbox"
                checked={substituteIngredients}
                onChange={(e) => setSubstituteIngredients(e.target.checked)}
                className="w-5 h-5 accent-primary rounded cursor-pointer shrink-0"
              />
            </label>
          </div>

          {/* Section: Tryb gotowania */}
          <div className="flex flex-col gap-2">
            <span className="font-label-sm text-label-sm font-bold uppercase tracking-wider text-primary">
              Aktywne gotowanie
            </span>

            <label className="flex items-center justify-between p-3.5 rounded-2xl bg-surface-container-lowest shadow-xs cursor-pointer border border-surface-container-high/30">
              <div className="flex flex-col pr-3">
                <span className="font-label-lg text-label-lg font-semibold text-on-surface">
                  Sygnał dźwiękowy stopera
                </span>
                <span className="font-body-sm text-body-sm text-on-surface-variant">
                  Odtwarzaj sygnał po upływie odliczanego czasu kroku
                </span>
              </div>
              <input
                type="checkbox"
                checked={showCookingTimerSound}
                onChange={(e) => setShowCookingTimerSound(e.target.checked)}
                className="w-5 h-5 accent-primary rounded cursor-pointer shrink-0"
              />
            </label>

            <label className="flex items-center justify-between p-3.5 rounded-2xl bg-surface-container-lowest shadow-xs cursor-pointer border border-surface-container-high/30">
              <div className="flex flex-col pr-3">
                <span className="font-label-lg text-label-lg font-semibold text-on-surface">
                  Przypomnienia o ważności w lodówce
                </span>
                <span className="font-body-sm text-body-sm text-on-surface-variant">
                  Powiadom, gdy otwarte produkty przekroczą 3 dni
                </span>
              </div>
              <input
                type="checkbox"
                checked={expiryReminders}
                onChange={(e) => setExpiryReminders(e.target.checked)}
                className="w-5 h-5 accent-primary rounded cursor-pointer shrink-0"
              />
            </label>
          </div>

          {/* App Info */}
          <div className="p-3.5 rounded-2xl bg-surface-container-low text-center flex flex-col items-center gap-1">
            <span className="font-label-md text-label-md font-bold text-on-surface">
              Appetyt v1.0.4
            </span>
            <span className="font-body-sm text-body-sm text-on-surface-variant">
              Autorska gastronomia & spiżarnia domowa
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 pt-2 pb-safe border-t border-surface-container bg-surface">
          <button
            onClick={handleSave}
            className="w-full h-12 rounded-xl bg-primary text-on-primary font-label-lg font-bold shadow-md active:scale-95 transition-transform cursor-pointer"
            type="button"
          >
            Zapisz preferencje
          </button>
        </div>
      </div>
    </div>
  );
};
