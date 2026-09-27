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
    onShowToast('');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-inverse-surface/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[480px] bg-surface rounded-t-3xl sm:rounded-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 pt-5 pb-3 flex items-center justify-between border-b border-surface-container">
          <h3 className="font-headline-sm text-headline-sm text-on-surface">Ustawienia</h3>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center text-on-surface cursor-pointer"
            type="button"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="p-5 overflow-y-auto no-scrollbar flex flex-col gap-2">
          <label className="flex items-center justify-between p-3.5 rounded-2xl bg-surface-container-lowest border border-surface-container-high/30 cursor-pointer">
            <span className="font-label-lg text-label-lg font-semibold text-on-surface">Rabaty</span>
            <input
              type="checkbox"
              checked={includeDiscounts}
              onChange={(e) => setIncludeDiscounts(e.target.checked)}
              className="w-5 h-5 accent-primary rounded cursor-pointer shrink-0"
            />
          </label>
          <label className="flex items-center justify-between p-3.5 rounded-2xl bg-surface-container-lowest border border-surface-container-high/30 cursor-pointer">
            <span className="font-label-lg text-label-lg font-semibold text-on-surface">Zamienniki</span>
            <input
              type="checkbox"
              checked={substituteIngredients}
              onChange={(e) => setSubstituteIngredients(e.target.checked)}
              className="w-5 h-5 accent-primary rounded cursor-pointer shrink-0"
            />
          </label>
          <label className="flex items-center justify-between p-3.5 rounded-2xl bg-surface-container-lowest border border-surface-container-high/30 cursor-pointer">
            <span className="font-label-lg text-label-lg font-semibold text-on-surface">Dźwięk stopera</span>
            <input
              type="checkbox"
              checked={showCookingTimerSound}
              onChange={(e) => setShowCookingTimerSound(e.target.checked)}
              className="w-5 h-5 accent-primary rounded cursor-pointer shrink-0"
            />
          </label>
          <label className="flex items-center justify-between p-3.5 rounded-2xl bg-surface-container-lowest border border-surface-container-high/30 cursor-pointer">
            <span className="font-label-lg text-label-lg font-semibold text-on-surface">Przypomnienia</span>
            <input
              type="checkbox"
              checked={expiryReminders}
              onChange={(e) => setExpiryReminders(e.target.checked)}
              className="w-5 h-5 accent-primary rounded cursor-pointer shrink-0"
            />
          </label>
        </div>

        <div className="p-4 pt-2 pb-safe border-t border-surface-container bg-surface">
          <button
            onClick={handleSave}
            className="w-full h-12 rounded-xl bg-primary text-on-primary font-label-lg font-bold cursor-pointer"
            type="button"
          >
            Zapisz
          </button>
        </div>
      </div>
    </div>
  );
};
