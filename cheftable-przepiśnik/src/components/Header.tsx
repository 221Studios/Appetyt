import React from 'react';

interface HeaderProps {
  onOpenSettings: () => void;
  onOpenProfile: () => void;
  onNavigateHome: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSettings, onOpenProfile, onNavigateHome }) => {
  return (
    <header className="fixed top-0 w-full max-w-[520px] z-50 pt-safe bg-surface/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
      <div className="h-16 px-4 flex items-center justify-between">
        <button
          onClick={onNavigateHome}
          className="flex items-center gap-2 group min-h-[48px] min-w-[48px] flex-shrink-0 text-left cursor-pointer"
        >
          <div className="w-9 h-9 rounded-xl bg-primary-container text-on-primary flex items-center justify-center shadow-[0_2px_8px_rgba(254,147,44,0.3)]">
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M12 2C9.5 2 7.4 3.7 6.8 6c-2.7.3-4.8 2.6-4.8 5.4 0 2.8 2.1 5.1 4.8 5.4v1.2c0 1.1.9 2 2 2h6.4c1.1 0 2-.9 2-2v-1.2c2.7-.3 4.8-2.6 4.8-5.4 0-2.8-2.1-5.1-4.8-5.4-.6-2.3-2.7-4-5.2-4zm-4 15.5c-.6 0-1-.4-1-1s.4-1 1-1h8c.6 0 1 .4 1 1s-.4 1-1 1H8z" />
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="font-headline-sm text-headline-sm text-on-surface tracking-tight leading-none">
              Appetyt
            </span>
          </div>
        </button>

        <div className="flex items-center gap-1">
          <button
            aria-label="Ustawienia"
            onClick={onOpenSettings}
            className="w-12 h-12 rounded-full flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container active:scale-95 transition-all"
            type="button"
          >
            <span className="material-symbols-outlined text-[24px]">settings</span>
          </button>
          <button
            aria-label="Profil użytkownika"
            onClick={onOpenProfile}
            className="w-12 h-12 flex items-center justify-center rounded-full hover:bg-surface-container active:scale-95 transition-all"
            type="button"
          >
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-sm">
              <span className="material-symbols-outlined text-on-primary text-[18px]">person</span>
            </div>
          </button>
        </div>
      </div>
    </header>
  );
};
