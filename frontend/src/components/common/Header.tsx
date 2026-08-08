import React from 'react';
import { BrandLogo, Icon } from './BrandLogo';

interface HeaderProps {
  userEmail?: string;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ userEmail, onLogout }) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        <BrandLogo />

        {userEmail && (
          <div className="flex items-center gap-4">
            <span className="hidden sm:inline text-xs font-medium text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">
              {userEmail}
            </span>
            {onLogout && (
              <button
                onClick={onLogout}
                className="flex items-center gap-2 text-xs font-semibold text-slate-700 hover:text-red-600 border border-slate-200 hover:border-red-200 bg-white hover:bg-red-50 rounded-lg px-3.5 py-2 transition-all cursor-pointer shadow-2xs"
              >
                <Icon name="log-out" className="w-4 h-4" />
                <span>Đăng xuất</span>
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
