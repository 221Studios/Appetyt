import React, { useState } from 'react';

interface ProfileModalProps {
  onClose: () => void;
  savedCount: number;
  fridgeCount: number;
  onShowToast: (msg: string) => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  onClose,
  savedCount,
  fridgeCount,
  onShowToast,
}) => {
  const [userName, setUserName] = useState('Nikodem');
  const [diet, setDiet] = useState<'wszystko' | 'wege' | 'ryby' | 'keto'>('wszystko');
  const [cookingLevel, setCookingLevel] = useState<'Początkujący' | 'Sous Chef' | 'Szef Domu'>('Sous Chef');

  const handleSave = () => {
    onShowToast('Zapisano ustawienia profilu kucharza');
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
            <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-on-primary font-headline-sm shadow-md">
              <span className="material-symbols-outlined text-[26px]">person</span>
            </div>
            <div>
              <h3 className="font-headline-sm text-headline-sm text-on-surface">Twój Profil</h3>
              <p className="font-label-sm text-label-sm text-primary font-bold">Konto ChefTable</p>
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
          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="p-3 rounded-2xl bg-surface-container-lowest shadow-sm flex flex-col items-center text-center border border-surface-container-high/30">
              <span className="font-headline-md text-headline-md text-primary font-bold">{savedCount}</span>
              <span className="font-label-sm text-label-sm text-on-surface-variant">Zapisanych dań</span>
            </div>
            <div className="p-3 rounded-2xl bg-surface-container-lowest shadow-sm flex flex-col items-center text-center border border-surface-container-high/30">
              <span className="font-headline-md text-headline-md text-tertiary font-bold">{fridgeCount}</span>
              <span className="font-label-sm text-label-sm text-on-surface-variant">W lodówce</span>
            </div>
            <div className="p-3 rounded-2xl bg-surface-container-lowest shadow-sm flex flex-col items-center text-center border border-surface-container-high/30">
              <span className="font-headline-md text-headline-md text-secondary font-bold">14</span>
              <span className="font-label-sm text-label-sm text-on-surface-variant">Ugotowanych</span>
            </div>
          </div>

          {/* Name Field */}
          <div className="flex flex-col gap-1.5">
            <label className="font-label-sm text-label-sm font-bold text-on-surface uppercase tracking-wider">
              Imię kucharza
            </label>
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="w-full h-12 px-4 rounded-xl bg-surface-container-low border border-surface-container-high text-on-surface font-body-md focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          {/* Cooking Experience Level */}
          <div className="flex flex-col gap-1.5">
            <label className="font-label-sm text-label-sm font-bold text-on-surface uppercase tracking-wider">
              Poziom w kuchni
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['Początkujący', 'Sous Chef', 'Szef Domu'] as const).map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setCookingLevel(lvl)}
                  className={`h-11 rounded-xl font-label-md text-label-md transition-all cursor-pointer ${
                    cookingLevel === lvl
                      ? 'bg-primary text-on-primary font-bold shadow-sm'
                      : 'bg-surface-container text-on-surface'
                  }`}
                  type="button"
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          {/* Dietary Preference */}
          <div className="flex flex-col gap-1.5">
            <label className="font-label-sm text-label-sm font-bold text-on-surface uppercase tracking-wider">
              Preferencje kulinarne
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'wszystko', label: 'Wszystkozerne 🥩' },
                { id: 'wege', label: 'Wegetariańskie 🥦' },
                { id: 'ryby', label: 'Peskatarianizm 🐟' },
                { id: 'keto', label: 'Low Carb / Keto 🥑' },
              ].map((d) => (
                <button
                  key={d.id}
                  onClick={() => setDiet(d.id as any)}
                  className={`h-11 px-3 rounded-xl font-label-md text-label-md flex items-center justify-center transition-all cursor-pointer ${
                    diet === d.id
                      ? 'bg-primary text-on-primary font-bold shadow-sm'
                      : 'bg-surface-container text-on-surface'
                  }`}
                  type="button"
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {/* Loyalty store cards preview */}
          <div className="p-3.5 rounded-xl bg-surface-container-low flex flex-col gap-2">
            <span className="font-label-sm text-label-sm text-on-surface font-bold">
              Aktywne karty dyskontów:
            </span>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-surface-container-lowest text-[12px] font-bold text-primary flex items-center gap-1 shadow-xs">
                <span className="material-symbols-outlined text-[14px]">credit_card</span>
                Moja Biedronka
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-surface-container-lowest text-[12px] font-bold text-primary flex items-center gap-1 shadow-xs">
                <span className="material-symbols-outlined text-[14px]">credit_card</span>
                Lidl Plus
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 pt-2 pb-safe border-t border-surface-container bg-surface">
          <button
            onClick={handleSave}
            className="w-full h-12 rounded-xl bg-primary text-on-primary font-label-lg font-bold shadow-md active:scale-95 transition-transform cursor-pointer"
            type="button"
          >
            Zapisz profil
          </button>
        </div>
      </div>
    </div>
  );
};
