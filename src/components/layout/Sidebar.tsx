import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  CreditCard, 
  BarChart3, 
  Receipt,
  DatabaseBackup, 
  Settings, 
  Dumbbell,
  ChevronRight
} from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';

export type NavTab = 'dashboard' | 'members' | 'payments' | 'expenses' | 'reports' | 'import-export' | 'settings';

interface SidebarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const { settings } = useSettings();

  const menuItems: { id: NavTab; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'members', label: 'Members', icon: <Users className="w-5 h-5" /> },
    { id: 'payments', label: 'Payments', icon: <CreditCard className="w-5 h-5" /> },
    { id: 'expenses', label: 'Expenses', icon: <Receipt className="w-5 h-5" /> },
    { id: 'reports', label: 'Reports', icon: <BarChart3 className="w-5 h-5" /> },
    { id: 'import-export', label: 'Import / Export', icon: <DatabaseBackup className="w-5 h-5" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-5 h-5" /> },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 h-screen sticky top-0 select-none z-20">
      {/* Gym Branding */}
      <div className="p-5 border-b border-slate-200/80 dark:border-slate-800 flex items-center space-x-3">
        <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-lg shadow-md shadow-emerald-600/20">
          {settings.gymLogo ? (
            <img src={settings.gymLogo} alt="Logo" className="w-full h-full object-cover rounded-xl" referrerPolicy="no-referrer" />
          ) : (
            <Dumbbell className="w-6 h-6" />
          )}
        </div>
        <div className="overflow-hidden">
          <h1 className="font-bold text-slate-900 dark:text-white truncate text-base leading-tight">
            {settings.gymName || 'Gym Pro Manager'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
            100% Offline System
          </p>
        </div>
      </div>

      {/* Menu Navigation */}
      <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
        <div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Management
        </div>
        {menuItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
                isActive
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-semibold shadow-sm border border-emerald-200/50 dark:border-emerald-800/40'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <div className="flex items-center space-x-3">
                <span className={isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </div>
              {isActive && <ChevronRight className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
            </button>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-200/80 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
        <span>Offline IndexedDB</span>
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
          Ready
        </span>
      </div>
    </aside>
  );
};
