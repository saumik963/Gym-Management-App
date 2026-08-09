import React from 'react';
import { motion } from 'motion/react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  iconBgColor?: string;
  badgeText?: string;
  badgeType?: 'success' | 'warning' | 'danger' | 'info';
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  iconBgColor = 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  badgeText,
  badgeType = 'success',
  onClick,
}) => {
  const badgeStyles = {
    success: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50',
    warning: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/50',
    danger: 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/50',
    info: 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-800/50',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      onClick={onClick}
      className={`bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-all ${
        onClick ? 'cursor-pointer hover:border-emerald-500/50 dark:hover:border-emerald-500/40' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 tracking-wide uppercase">
            {title}
          </p>
          <p className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-1 tracking-tight">
            {value}
          </p>
        </div>
        <div className={`p-3 rounded-2xl ${iconBgColor}`}>
          {icon}
        </div>
      </div>

      {(subtitle || badgeText) && (
        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-xs">
          {subtitle && (
            <span className="text-slate-500 dark:text-slate-400 font-medium truncate">
              {subtitle}
            </span>
          )}
          {badgeText && (
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${badgeStyles[badgeType]}`}
            >
              {badgeText}
            </span>
          )}
        </div>
      )}
    </motion.div>
  );
};
