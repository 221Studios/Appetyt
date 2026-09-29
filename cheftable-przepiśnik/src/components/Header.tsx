import React from 'react';
import { useTranslation } from '../i18n';
import { BrandMark } from './BrandMark';

interface HeaderProps {
  onNavigateHome: () => void;
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onNavigateHome, onOpenSettings }) => {
  const { t } = useTranslation();
  return (
    <header className="fixed top-0 w-full max-w-[520px] z-50 pt-safe bg-surface/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
      <div className="h-16 px-4 flex items-center justify-between">
        <button
          onClick={onNavigateHome}
          className="flex items-center gap-2 group min-h-[48px] min-w-[48px] flex-shrink-0 text-left cursor-pointer"
          type="button"
        >
          <BrandMark className="w-9 h-9" />
          <div className="flex flex-col">
            <span className="font-headline-sm text-headline-sm text-on-surface tracking-tight leading-none">
              Appetyt
            </span>
          </div>
        </button>
        <button
          onClick={onOpenSettings}
          aria-label={t('settings')}
          className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface hover:bg-surface-container cursor-pointer"
          type="button"
        >
          <span className="material-symbols-outlined text-[22px]">settings</span>
        </button>
      </div>
    </header>
  );
};
