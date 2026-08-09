import React from 'react';
import { Moon, Sun, Plus, DollarSign, Dumbbell, WifiOff } from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';

interface HeaderProps {
  title: string;
  onQuickAddMember: () => void;
  onQuickCollectPayment: () => void;
}

export const Header: React.FC<HeaderProps> = ({ title, onQuickAddMember, onQuickCollectPayment }) => {
  const { settings, updateSettings } = useSettings();

  const isDark =
    settings.theme === 'dark' ||
    (settings.theme === 'system' &&
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches);

  const toggleTheme = () => {
    updateSettings({ theme: isDark ? 'light' : 'dark' });
  };

  return (
    <header className="sticky top-0 z-10 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-3.5 sm:px-6 py-3 flex items-center justify-between gap-2">
      {/* Title & Status */}
      <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
        <div className="lg:hidden w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shrink-0 overflow-hidden">
          {settings.gymLogo ? (
            <img src={settings.gymLogo} alt="Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          ) : (
            <Dumbbell className="w-4 h-4 sm:w-5 sm:h-5" />
          )}
        </div>
        <div className="truncate">
          <h1 className="text-lg sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight truncate">
            {title}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block truncate">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        {/* Offline Badge */}
        <div className="hidden md:flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
          <WifiOff className="w-3.5 h-3.5 text-emerald-500" />
          <span>Offline Mode</span>
        </div>

        {/* Quick Add Member */}
        <button
          onClick={onQuickAddMember}
          className="hidden sm:inline-flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-sm hover:shadow-emerald-600/20 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Add Member</span>
        </button>

        {/* Quick Collect Payment */}
        <button
          onClick={onQuickCollectPayment}
          className="inline-flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-sm hover:shadow-indigo-600/20 active:scale-95"
        >
          <DollarSign className="w-4 h-4" />
          <span>Collect</span>
        </button>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/80 dark:hover:bg-slate-700 transition-colors"
        >
          {isDark ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-600" />}
        </button>
      </div>
    </header>
  );
};
