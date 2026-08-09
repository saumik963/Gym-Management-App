import React from 'react';
import { MemberStatus, PaymentStatus } from '../../types';

interface BadgeProps {
  status: MemberStatus | PaymentStatus | string;
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({ status, size = 'sm' }) => {
  const normStatus = (status || '').toLowerCase();

  let style = 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';

  if (normStatus === 'active' || normStatus === 'paid') {
    style = 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-200/80 dark:border-emerald-800/60';
  } else if (normStatus === 'partial') {
    style = 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border-amber-200/80 dark:border-amber-800/60';
  } else if (normStatus === 'inactive' || normStatus === 'unpaid') {
    style = 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border-rose-200/80 dark:border-rose-800/60';
  }

  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';

  return (
    <span className={`inline-flex items-center font-semibold rounded-full border ${sizeClass} ${style}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-80" />
      <span className="capitalize">{status}</span>
    </span>
  );
};
