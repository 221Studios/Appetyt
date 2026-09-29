import React from 'react';
import { useTranslation } from '../i18n';

interface SettingsModalProps {
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ onClose }) => {
  const { language, setLanguage, measurementSystem, setMeasurementSystem, t } = useTranslation();

  const handleSave = () => {
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
          <h3 className="font-headline-sm text-headline-sm text-on-surface">{t('settings')}</h3>
          <button
            onClick={onClose}
            aria-label={t('close')}
            className="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center text-on-surface cursor-pointer"
            type="button"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="min-h-0 p-5 flex-1 overflow-y-auto no-scrollbar flex flex-col gap-2">
          <div className="p-3.5 rounded-2xl bg-surface-container-lowest border border-surface-container-high/30">
            <span className="font-label-lg text-label-lg font-semibold text-on-surface">{t('language')}</span>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {(['pl', 'en'] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  aria-pressed={language === option}
                  onClick={() => setLanguage(option)}
                  className={`h-10 rounded-xl font-label-md font-bold cursor-pointer ${
                    language === option
                      ? 'bg-primary text-on-primary'
                      : 'bg-surface-container text-on-surface'
                  }`}
                >
                  {option === 'pl' ? t('polish') : t('english')}
                </button>
              ))}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-surface-container-lowest border border-surface-container-high/30">
            <span className="font-label-lg text-label-lg font-semibold text-on-surface">{t('measurementSystem')}</span>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {(['eu', 'us'] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  aria-pressed={measurementSystem === option}
                  onClick={() => setMeasurementSystem(option)}
                  className={`h-10 rounded-xl font-label-md font-bold cursor-pointer ${
                    measurementSystem === option
                      ? 'bg-primary text-on-primary'
                      : 'bg-surface-container text-on-surface'
                  }`}
                >
                  {option === 'eu' ? t('european') : t('usa')}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 pt-2 pb-safe-action-bar shrink-0 border-t border-surface-container bg-surface">
          <button
            onClick={handleSave}
            className="w-full h-12 rounded-xl bg-primary text-on-primary font-label-lg font-bold cursor-pointer"
            type="button"
          >
            {t('save')}
          </button>
        </div>
      </div>
    </div>
  );
};
