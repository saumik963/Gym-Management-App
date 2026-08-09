import React from 'react';
import { NavTab } from './Sidebar';
import { 
  LayoutDashboard, 
  Users, 
  CreditCard, 
  Receipt,
  BarChart3, 
  Settings,
  DatabaseBackup
} from 'lucide-react';

interface MobileNavProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ activeTab, setActiveTab }) => {
  const items: { id: NavTab; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Home', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'members', label: 'Members', icon: <Users className="w-5 h-5" /> },
    { id: 'payments', label: 'Payments', icon: <CreditCard className="w-5 h-5" /> },
    { id: 'expenses', label: 'Expenses', icon: <Receipt className="w-5 h-5" /> },
    { id: 'reports', label: 'Reports', icon: <BarChart3 className="w-5 h-5" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-5 h-5" /> },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800 px-2 py-1.5 flex items-center justify-around shadow-lg">
      {items.map((item) => {
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col items-center justify-center min-h-[44px] py-1 px-2.5 rounded-xl transition-all relative ${
              isActive
                ? 'text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50/80 dark:bg-emerald-950/40'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <span className={`${isActive ? 'scale-110' : ''} transition-transform`}>
              {item.icon}
            </span>
            <span className="text-[10px] font-semibold mt-0.5 tracking-tight">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
